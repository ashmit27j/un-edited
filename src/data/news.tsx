import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import {
  groupOf as moduleGroupOf,
  newsData,
  setNewsData,
  sourceById as moduleSourceById,
  storyById as moduleStoryById,
  storyById,
  TOPICS, type NewsData, type Paper, type Source, type Story, type Topic } from '@/data/sample';
import { supabase } from '@/lib/supabase';
import { useReader } from '@/store/reader-provider';

/**
 * Live news from Supabase (filled by the fetch-news job from the outlets' own feeds). Cached on the device so
 * Home and Feed open offline with the last copy. When nothing live is available (no keys, no stories yet,
 * never loaded), the app keeps the fictional sample stories and says so.
 */
type NewsValue = NewsData & {
  /**
   * Lookups bound to the current data. Components must use these (not the module functions in sample.ts):
   * React Compiler memoizes plain function calls by their arguments, so a module lookup would never see
   * stories that arrive later.
   */
  sourceById: (id: string) => Source;
  storyById: (id: string) => Story | undefined;
  groupOf: (story: Story) => Story[];
  /** Loads a live story that isn't in the current lists (a shared link, an old save). */
  ensure: (id: string) => Promise<void>;
  /** 'sample' (no live data), 'loading' (first load), 'live'. */
  status: 'sample' | 'loading' | 'live';
  updatedAt: number | null;
  refresh: () => Promise<void>;
};

const CACHE_KEY = 'unedited.news.v2';
const REFRESH_MS = 30 * 60_000;
/** Covers the whole Morning Edition (the 24h before the latest 06:00 IST) at any time of day, plus today. */
const WINDOW_MS = 54 * 3_600_000;

type Row = {
  id: string;
  source_id: string;
  url: string;
  title: string;
  excerpt: string | null;
  /** Lists load without the text; true when the publisher's full text is there to fetch. */
  has_full: boolean;
  image_url: string | null;
  image_credit: string | null;
  topic: string;
  lang: Story['lang'];
  group_id: string | null;
  published_at: string;
};
type SourceRow = {
  id: string;
  name: string;
  lang: Source['lang'];
  kind: string;
  place: string;
  owner: string;
  funding: string;
  site_url: string;
  paper_label: Paper['label'] | null;
};

const asTopic = (t: string): Topic => ((TOPICS as readonly string[]).includes(t) ? (t as Topic) : 'India');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function toData(sources: SourceRow[], rows: Row[], now: number, older: Row[] = []): NewsData {
  const src = sources.map<Source>((s) => ({
    id: s.id,
    name: s.name,
    lang: s.lang,
    kind: s.kind,
    place: s.place,
    owner: s.owner,
    funding: s.funding,
    siteUrl: s.site_url,
    journal: !!s.paper_label,
    paperLabel: s.paper_label ?? undefined,
  }));
  const papersFrom = new Map(src.filter((s) => s.paperLabel).map((s) => [s.id, s]));
  const minsAgo = (iso: string) => Math.max(1, Math.round((now - new Date(iso).getTime()) / 60_000));
  const stories: Story[] = [];
  const papers: Paper[] = [];
  for (const r of rows) {
    const s = src.find((x) => x.id === r.source_id);
    if (!s) continue;
    const paper = papersFrom.get(r.source_id);
    if (paper) {
      papers.push({ id: r.id, label: paper.paperLabel!, title: r.title, note: r.excerpt ?? '', where: s.name, minsAgo: minsAgo(r.published_at), lang: s.lang, url: r.url });
      continue;
    }
    stories.push({
      id: r.id,
      sourceId: r.source_id,
      topic: asTopic(r.topic),
      group: r.group_id ?? undefined,
      headline: r.title,
      // The publisher's excerpt; the full text (when their feed carries it) loads when the story opens.
      body: r.excerpt ? [r.excerpt] : [],
      excerptOnly: !r.has_full,
      minsAgo: minsAgo(r.published_at),
      credit: r.image_credit ? `Photo · ${r.image_credit}` : `Photo · ${s.name}`,
      lang: r.lang,
      url: r.url,
      imageUrl: r.image_url ?? undefined,
    });
  }
  const archive = older.length ? toData(sources, older, now).stories : [];
  return { sources: src, stories, papers, live: true, archive };
}

const NewsContext = createContext<NewsValue | null>(null);

const LIST = 'id, source_id, url, title, excerpt, has_full, image_url, image_credit, topic, lang, group_id, published_at';
const PAGE = 1000;
const MAX_ROWS = 4000;

/** The stories in the window, newest first. The API returns at most 1000 rows per request, so page through. */
async function pages(since: string): Promise<{ data: Row[]; error: { message: string } | null }> {
  const all: Row[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await supabase!
      .from('articles')
      .select(LIST)
      .gte('published_at', since)
      .order('published_at', { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) return { data: all, error };
    all.push(...((data ?? []) as Row[]));
    if (!data || data.length < PAGE) break;
  }
  return { data: all, error: null };
}

const bodies = new Map<string, string[]>();
/** Stories loaded one by one (links, old saves); kept across list refreshes. */
const fetched = new Map<string, Story>();

/**
 * The full text of a live story, in the publisher's words, fetched when it opens (lists carry only the excerpt).
 * Sample stories and excerpt-only stories return their body as it is.
 */
export function useStoryBody(story: Story | undefined): string[] {
  const [text, setText] = useState<string[] | null>(() => (story ? (bodies.get(story.id) ?? null) : null));
  const id = story?.id;
  const fetchFull = !!story?.url && !story.excerptOnly && !bodies.has(story.id);
  useEffect(() => {
    if (!id || !fetchFull || !supabase) return;
    let cancelled = false;
    supabase
      .from('articles')
      .select('body')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data?.body?.length) return;
        bodies.set(id, data.body);
        setText(data.body);
      });
    return () => {
      cancelled = true;
    };
  }, [id, fetchFull]);
  if (!story) return [];
  return text ?? bodies.get(story.id) ?? story.body;
}

export function NewsProvider({ children }: { children: ReactNode }) {
  const { folders, recent } = useReader();
  // Live story ids the reader kept (folders, Recently viewed), so they still open after they leave the window.
  const kept = useMemo(
    () => [...new Set([...Object.values(folders).flat(), ...recent])].filter((id) => UUID.test(id)).sort().join(','),
    [folders, recent],
  );
  const [data, setData] = useState<NewsData>(newsData());
  const [status, setStatus] = useState<NewsValue['status']>(supabase ? 'loading' : 'sample');
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const apply = useCallback((next: NewsData | null, at: number | null) => {
    setNewsData(next && fetched.size ? { ...next, archive: [...(next.archive ?? []), ...fetched.values()] } : next);
    setData(newsData());
    setStatus(next ? 'live' : 'sample');
    setUpdatedAt(at);
  }, []);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const now = Date.now();
    const since = new Date(now - WINDOW_MS).toISOString();
    const [sources, articles] = await Promise.all([
      supabase.from('sources').select('id, name, lang, kind, place, owner, funding, site_url, paper_label').eq('active', true),
      pages(since),
    ]);
    if (sources.error || articles.error) {
      setStatus((s) => (s === 'loading' ? 'sample' : s));
      return;
    }
    if (!articles.data.length) return apply(null, now);
    const have = new Set(articles.data.map((a) => a.id));
    const missing = kept ? kept.split(',').filter((id) => !have.has(id)) : [];
    const older = missing.length
      ? ((
          await supabase
            .from('articles')
            .select('id, source_id, url, title, excerpt, has_full, image_url, image_credit, topic, lang, group_id, published_at')
            .in('id', missing.slice(0, 200))
        ).data ?? [])
      : [];
    const next = toData(sources.data as SourceRow[], articles.data as Row[], now, older as Row[]);
    apply(next, now);
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ at: now, sources: sources.data, articles: articles.data, older })).catch(() => {});
  }, [apply, kept]);

  useEffect(() => {
    if (!supabase) return;
    // Last copy first, so Home opens straight away (and offline); then the network.
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        if (!raw) return;
        const cached = JSON.parse(raw) as { at: number; sources: SourceRow[]; articles: Row[]; older?: Row[] };
        apply(toData(cached.sources, cached.articles, Date.now(), cached.older ?? []), cached.at);
      })
      .catch(() => {})
      .finally(() => {
        refresh().catch(() => setStatus((s) => (s === 'loading' ? 'sample' : s)));
      });
    const timer = setInterval(() => refresh().catch(() => {}), REFRESH_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh().catch(() => {});
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [apply, refresh]);

  const ensure = useCallback(async (id: string) => {
    if (!supabase || !UUID.test(id) || storyById(id)) return;
    const { data: row } = await supabase
      .from('articles')
      .select('id, source_id, url, title, excerpt, has_full, image_url, image_credit, topic, lang, group_id, published_at')
      .eq('id', id)
      .maybeSingle();
    if (!row) return;
    const current = newsData();
    const { data: src } = await supabase
      .from('sources')
      .select('id, name, lang, kind, place, owner, funding, site_url, paper_label')
      .eq('id', row.source_id)
      .maybeSingle();
    if (!src) return;
    const extra = toData([src as SourceRow], [], Date.now(), [row as Row]).archive ?? [];
    for (const story of extra) fetched.set(story.id, story);
    setNewsData({
      ...current,
      live: current.live,
      sources: current.sources.some((s) => s.id === src.id) ? current.sources : [...current.sources, ...toData([src as SourceRow], [], Date.now()).sources],
      archive: [...(current.archive ?? []), ...extra],
    });
    setData(newsData());
  }, []);

  const value = useMemo<NewsValue>(
    () => ({
      ...data,
      status,
      updatedAt,
      refresh,
      ensure,
      // New functions whenever the data changes, so memoized components recompute.
      sourceById: (id: string) => moduleSourceById(id),
      storyById: (id: string) => moduleStoryById(id),
      groupOf: (story: Story) => moduleGroupOf(story),
    }),
    [data, status, updatedAt, refresh, ensure],
  );
  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
}

/**
 * One story by id, recomputed whenever the news changes. Prefer this to storyById() in components: React
 * Compiler memoizes a plain call by its argument and can keep a stale "not found".
 */
export function useStory(id: string | undefined): Story | undefined {
  const { stories, archive } = useNews();
  return useMemo(
    () => (id ? (stories.find((s) => s.id === id) ?? archive?.find((s) => s.id === id) ?? moduleStoryById(id)) : undefined),
    [id, stories, archive],
  );
}

/** Several stories by id (folders, history), in the given order, skipping any that aren't loaded. */
export function useStoryList(ids: string[]): Story[] {
  const { stories, archive } = useNews();
  const key = ids.join(',');
  return useMemo(() => {
    const byId = new Map([...(archive ?? []), ...stories].map((s) => [s.id, s]));
    return key
      .split(',')
      .filter(Boolean)
      .map((id) => byId.get(id) ?? moduleStoryById(id))
      .filter((s): s is Story => !!s);
  }, [key, stories, archive]);
}

export function useNews(): NewsValue {
  const value = useContext(NewsContext);
  if (!value) throw new Error('useNews must be used inside NewsProvider');
  return value;
}
