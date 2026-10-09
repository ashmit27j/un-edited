import { useMemo } from 'react';

import { STORIES, type Story } from '@/data/sample';
import { useReader } from '@/store/reader-provider';

/**
 * What the reader sees, newest first. `mine` = stories from the outlets they picked;
 * `outside` = everything else (Home's "Outside your sources", Feed's Explore).
 */
export function useStories() {
  const { prefs, hidden } = useReader();
  return useMemo(() => {
    const visible = STORIES.filter((s) => !hidden.includes(s.id)).sort((a, b) => a.minsAgo - b.minsAgo);
    const mine = visible.filter((s) => prefs.sources.includes(s.sourceId));
    const outside = visible.filter((s) => !prefs.sources.includes(s.sourceId));
    return { mine, outside, all: visible };
  }, [prefs.sources, hidden]);
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

/** How many of the given stories cover the same event as `story`. */
export function coverage(story: Story, within: Story[]): number {
  if (!story.group) return 1;
  return within.filter((s) => s.group === story.group).length;
}
