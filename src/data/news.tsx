import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { newsData, setNewsData, TOPICS, type NewsData, type Paper, type Source, type Story, type Topic } from '@/data/sample';
import { supabase } from '@/lib/supabase';
import { useReader } from '@/store/reader-provider';

/**
 * Live news from Supabase (filled by the fetch-news job from the outlets' own feeds). Cached on the device so
 * Home and Feed open offline with the last copy. When nothing live is available (no keys, no stories yet,
 * never loaded), the app keeps the fictional sample stories and says so.
 */
type NewsValue = NewsData & {
  /** 'sample' (no live data), 'loading' (first load), 'live'. */
  status: 'sample' | 'loading' | 'live';
  updatedAt: number | null;
  refresh: () => Promise<void>;
};

const CACHE_KEY = 'unedited.news.v1';
const REFRESH_MS = 30 * 60_000;
/** Feed and Home show the last two days; older stories stay reachable through saves and history. */
const WINDOW_MS = 48 * 3_600_000;

type Row = {
  id: string;
  source_id: string;
  url: string;
  title: string;
  excerpt: string | null;
  body: string[] | null;
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
      papers.push({ id: r.id, label: paper.paperLabel!, title: r.title, note: r.excerpt ?? '', where: s.name, minsAgo: minsAgo(r.published_at) });
      continue;
    }
    stories.push({
      id: r.id,
      sourceId: r.source_id,
      topic: asTopic(r.topic),
      group: r.group_id ?? undefined,
      headline: r.title,
      // The publisher's words: the full text when their feed carries it, otherwise their excerpt.
      body: r.body?.length ? r.body : r.excerpt ? [r.excerpt] : [],
      excerptOnly: !r.body?.length,
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
    setNewsData(next);
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
      supabase
        .from('articles')
        .select('id, source_id, url, title, excerpt, body, image_url, image_credit, topic, lang, group_id, published_at')
        .gte('published_at', since)
        .order('published_at', { ascending: false })
        .limit(800),
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
            .select('id, source_id, url, title, excerpt, body, image_url, image_credit, topic, lang, group_id, published_at')
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

  const value = useMemo<NewsValue>(() => ({ ...data, status, updatedAt, refresh }), [data, status, updatedAt, refresh]);
  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
}

export function useNews(): NewsValue {
  const value = useContext(NewsContext);
  if (!value) throw new Error('useNews must be used inside NewsProvider');
  return value;
}
