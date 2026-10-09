// fetch-news: runs every 30 minutes (pg_cron, see supabase/migrations/*_schedule.sql).
// 1. Read each active outlet's own RSS feed.
// 2. If a feed fails or is empty, fall back to a news API filtered to that outlet's domain
//    (NewsData.io, then NewsAPI.org, then GNews), when the key is set.
// 3. Store new stories in the publisher's words, file them under a topic by keyword rules, and group stories
//    about the same event by shared names and numbers (no AI).
import { createClient } from 'npm:@supabase/supabase-js@2';

import { keysOf, parseFeed, plain, sameEvent, topicOf, type FeedItem } from '../_shared/feeds.ts';

type Source = {
  id: string;
  name: string;
  lang: string;
  feed_url: string | null;
  site_url: string;
  topic: string;
  api_domain: string | null;
};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
const HOURS = 3_600_000;
/** Ignore anything older than this when it first arrives. */
const MAX_AGE = 72 * HOURS;
/** Grouping window (current-config §5: 36 hours). */
const GROUP_WINDOW = 36 * HOURS;

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

async function get(url: string, timeout = 15_000) {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: '*/*' }, signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

const onDomain = (url: string, domain: string) => {
  try {
    const host = new URL(url).hostname;
    return host === domain || host.endsWith(`.${domain}`);
  } catch {
    return false;
  }
};

/** News API fallbacks. Each returns items already filtered to the outlet's own domain. */
async function fromApis(src: Source): Promise<{ items: FeedItem[]; via: string } | null> {
  const domain = src.api_domain;
  if (!domain) return null;
  const tries: [string, () => Promise<FeedItem[]>][] = [];

  const newsdata = Deno.env.get('NEWSDATA_API_KEY');
  if (newsdata)
    tries.push([
      'newsdata',
      async () => {
        const res = await get(`https://newsdata.io/api/1/latest?apikey=${newsdata}&domainurl=${domain}&language=${src.lang}`);
        const json = await res.json();
        return (json.results ?? []).map((r: Record<string, string>) => ({
          url: r.link,
          title: plain(r.title ?? ''),
          excerpt: r.description ? plain(r.description).slice(0, 600) : null,
          body: null,
          imageUrl: r.image_url ?? null,
          imageCredit: null,
          categories: ([] as string[]).concat(r.category ?? []),
          publishedAt: new Date(`${r.pubDate}Z`.replace(' ', 'T')).toISOString(),
        }));
      },
    ]);

  const newsapi = Deno.env.get('NEWSAPI_KEY');
  if (newsapi)
    tries.push([
      'newsapi',
      async () => {
        const res = await get(`https://newsapi.org/v2/everything?domains=${domain}&sortBy=publishedAt&pageSize=30&apiKey=${newsapi}`);
        const json = await res.json();
        return (json.articles ?? []).map((a: Record<string, string>) => ({
          url: a.url,
          title: plain(a.title ?? ''),
          excerpt: a.description ? plain(a.description).slice(0, 600) : null,
          body: null,
          imageUrl: a.urlToImage ?? null,
          imageCredit: null,
          categories: [],
          publishedAt: new Date(a.publishedAt).toISOString(),
        }));
      },
    ]);

  const gnews = Deno.env.get('GNEWS_API_KEY');
  if (gnews)
    tries.push([
      'gnews',
      async () => {
        const q = encodeURIComponent(`"${src.name}"`);
        const res = await get(`https://gnews.io/api/v4/search?q=${q}&lang=${src.lang}&country=in&max=25&apikey=${gnews}`);
        const json = await res.json();
        return (json.articles ?? []).map((a: Record<string, string>) => ({
          url: a.url,
          title: plain(a.title ?? ''),
          excerpt: a.description ? plain(a.description).slice(0, 600) : null,
          body: null,
          imageUrl: a.image ?? null,
          imageCredit: null,
          categories: [],
          publishedAt: new Date(a.publishedAt).toISOString(),
        }));
      },
    ]);

  for (const [via, run] of tries) {
    try {
      const items = (await run()).filter((i) => i.title && onDomain(i.url, domain));
      if (items.length) return { items, via };
    } catch {
      // Try the next provider.
    }
  }
  return null;
}

async function read(src: Source): Promise<{ items: FeedItem[]; via: string; error: string | null }> {
  let error: string | null = null;
  if (src.feed_url) {
    try {
      const items = parseFeed(await (await get(src.feed_url)).text());
      const newest = Math.max(0, ...items.map((i) => new Date(i.publishedAt).getTime()));
      if (items.length && Date.now() - newest < MAX_AGE) return { items, via: 'rss', error: null };
      // Some outlets serve a stale cached copy to some regions: treat it like a failed feed.
      error = items.length ? `Feed is stale (newest ${new Date(newest).toISOString().slice(0, 10)})` : 'Feed had no stories';
    } catch (e) {
      error = (e as Error).message;
    }
  }
  const fallback = await fromApis(src);
  return fallback ? { ...fallback, error } : { items: [], via: 'none', error: error ?? 'No feed' };
}

/** Put a new story in the same group as the best-matching story from another outlet, if any. */
async function group(article: { id: string; source_id: string; lang: string; keys: string[]; published_at: string }) {
  if (article.keys.length < 2) return;
  const at = new Date(article.published_at).getTime();
  const { data: candidates } = await db
    .from('articles')
    .select('id, source_id, keys, group_id')
    .eq('lang', article.lang)
    .neq('source_id', article.source_id)
    .neq('id', article.id)
    .overlaps('keys', article.keys)
    .gte('published_at', new Date(at - GROUP_WINDOW).toISOString())
    .lte('published_at', new Date(at + GROUP_WINDOW).toISOString())
    .limit(50);
  const match = (candidates ?? []).find((c) => sameEvent(article.keys, c.keys));
  if (!match) return;
  let groupId = match.group_id as string | null;
  if (!groupId) {
    const { data } = await db.from('story_groups').insert({ lang: article.lang }).select('id').single();
    groupId = data?.id ?? null;
    if (!groupId) return;
    await db.from('articles').update({ group_id: groupId }).eq('id', match.id);
  }
  await db.from('articles').update({ group_id: groupId }).eq('id', article.id);
}

Deno.serve(async (req) => {
  // Only the scheduler may run this: it sends the CRON_SECRET (function secret = Vault 'cron_secret').
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`)
    return new Response('Forbidden', { status: 403 });
  const { data: sources, error } = await db.from('sources').select('id, name, lang, feed_url, site_url, topic, api_domain').eq('active', true);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const report: Record<string, string> = {};
  const now = Date.now();
  // A few outlets at a time, to be polite to their servers and stay inside the function's time limit.
  const queue = [...(sources as Source[])];
  const workers = Array.from({ length: 6 }, async () => {
    for (let src = queue.shift(); src; src = queue.shift()) {
      const { items, via, error } = await read(src);
      const fresh = items.filter((i) => now - new Date(i.publishedAt).getTime() < MAX_AGE);
      const rows = fresh.map((i) => ({
        source_id: src.id,
        url: i.url,
        title: i.title,
        excerpt: i.excerpt,
        body: i.body,
        image_url: i.imageUrl,
        image_credit: i.imageCredit,
        topic: topicOf(i.title, i.categories, src.topic),
        lang: src.lang,
        keys: keysOf(i.title, src.lang),
        via,
        published_at: i.publishedAt,
      }));
      let added = 0;
      let saveError: string | null = null;
      if (rows.length) {
        const { data: inserted, error: insertError } = await db
          .from('articles')
          .upsert(rows, { onConflict: 'url', ignoreDuplicates: true })
          .select('id, source_id, lang, keys, published_at');
        saveError = insertError?.message ?? null;
        for (const a of inserted ?? []) await group(a);
        added = inserted?.length ?? 0;
      }
      await db
        .from('sources')
        .update(items.length ? { last_ok_at: new Date().toISOString(), last_error: error } : { last_error: error })
        .eq('id', src.id);
      report[src.id] = `${via}: ${items.length} read, ${fresh.length} recent, ${added} new${error ? ` (${error})` : ''}${saveError ? ` [not saved: ${saveError}]` : ''}`;
    }
  });
  await Promise.all(workers);

  // Once a day around 01:00 UTC, drop stories older than 30 days that nobody saved.
  if (new Date().getUTCHours() === 1 && new Date().getUTCMinutes() < 30) await db.rpc('prune_articles');

  return new Response(JSON.stringify(report, null, 2), { headers: { 'content-type': 'application/json' } });
});
