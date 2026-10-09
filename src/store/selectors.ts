import { useMemo } from 'react';

import { useNews } from '@/data/news';
import type { Story } from '@/data/sample';
import { useReader } from '@/store/reader-provider';

/**
 * What the reader sees, newest first. `mine` = stories from the outlets they picked;
 * `outside` = everything else (Home's "Outside your sources", Feed's Explore).
 */
export function useStories() {
  const { prefs, hidden } = useReader();
  const { stories: STORIES } = useNews();
  return useMemo(() => {
    const visible = STORIES.filter((s) => !hidden.includes(s.id)).sort((a, b) => a.minsAgo - b.minsAgo);
    const mine = visible.filter((s) => prefs.sources.includes(s.sourceId));
    const outside = visible.filter((s) => !prefs.sources.includes(s.sourceId));
    return { mine, outside, all: visible };
  }, [prefs.sources, hidden, STORIES]);
}

const DAY_MS = 86_400_000;
/** Morning Edition is built at 06:00 IST = 00:30 UTC. */
const EDITION_UTC_MS = 30 * 60_000;

/**
 * Home is the Morning Edition: stories published in the 24 hours before the latest 06:00 IST, fixed for the
 * day (current-config §4–5). Only for live news; sample stories have no real times, so they're used as they are.
 */
export function useEdition() {
  const { mine, outside } = useStories();
  const { live, updatedAt } = useNews();
  return useMemo(() => {
    if (!live || !updatedAt) return { mine, outside };
    const cutoff = Math.floor((updatedAt - EDITION_UTC_MS) / DAY_MS) * DAY_MS + EDITION_UTC_MS;
    const since = (updatedAt - cutoff) / 60_000; // minutes from the cutoff to when the data loaded
    const inEdition = (s: Story) => s.minsAgo >= since && s.minsAgo < since + 24 * 60;
    const edition = mine.filter(inEdition);
    // Cold start (the backend began after the last 06:00, so the window holds only what feeds still carried):
    // the last 24 hours until the first full edition. 10 stories is a thin front page, not an edition.
    if (edition.length < 10) {
      const recent = (s: Story) => s.minsAgo < 24 * 60;
      return { mine: mine.filter(recent), outside: outside.filter(recent) };
    }
    return { mine: edition, outside: outside.filter(inEdition) };
  }, [mine, outside, live, updatedAt]);
}

/** Newest story of each event, so one event isn't listed once per outlet. */
export function onePerEvent(stories: Story[]): Story[] {
  // Show the first outlet to publish; the others are one tap away inside the article.
  const first = new Map<string, Story>();
  for (const s of stories) {
    const key = s.group ?? s.id;
    const have = first.get(key);
    if (!have || s.minsAgo > have.minsAgo) first.set(key, s);
  }
  return [...first.values()].sort((a, b) => a.minsAgo - b.minsAgo);
}

/** How many different outlets (among the given stories) cover the same event as `story`. */
export function coverage(story: Story, within: Story[]): number {
  if (!story.group) return 1;
  return new Set(within.filter((s) => s.group === story.group).map((s) => s.sourceId)).size;
}
