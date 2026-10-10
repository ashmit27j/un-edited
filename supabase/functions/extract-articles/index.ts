// extract-articles: runs every 5 minutes (pg_cron, see supabase/migrations/*_extract.sql).
// Opens the publisher's page for the newest stories not read yet and stores what the feed left out:
//  - the full article text, for outlets marked page_text (free to read); paywalled outlets keep their excerpt
//  - the page's photo, when the feed had none
//  - a video file, when the page has one (plays as the thumbnail)
// A few pages per run: parsing is CPU work and Edge Functions get about 2s of CPU per request.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { extractPage } from '../_shared/extract.ts';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
const PER_RUN = 12;
/** Only recent stories: older ones have left the edition and Feed. */
const WINDOW_MS = 48 * 3_600_000;
/** Pages larger than this are cut; the article and the meta tags come well before. */
const MAX_BYTES = 2_500_000;

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

type Row = {
  id: string;
  url: string;
  excerpt: string | null;
  body: string[] | null;
  image_url: string | null;
  sources: { page_text: boolean } | null;
};

async function page(url: string) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow',
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  return html.length > MAX_BYTES ? html.slice(0, MAX_BYTES) : html;
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return new Response('Forbidden', { status: 403 });

  const { data, error } = await db
    .from('articles')
    .select('id, url, excerpt, body, image_url, sources(page_text)')
    .is('extracted_at', null)
    .gte('published_at', new Date(Date.now() - WINDOW_MS).toISOString())
    .order('published_at', { ascending: false })
    .limit(PER_RUN);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const report: Record<string, string> = {};
  // Fetch pages in parallel (network), then parse one at a time (CPU).
  const pages = await Promise.all(
    (data as unknown as Row[]).map(async (row) => {
      try {
        return { row, html: await page(row.url), error: null };
      } catch (e) {
        return { row, html: null, error: (e as Error).message };
      }
    }),
  );
  for (const { row, html, error: fetchError } of pages) {
    const patch: Record<string, unknown> = { extracted_at: new Date().toISOString() };
    if (html) {
      try {
        // A feed that already carried the full text keeps it.
        const withText = !!row.sources?.page_text && !row.body;
        const found = extractPage(html, row.url, withText, row.excerpt);
        if (found.paragraphs) patch.body = found.paragraphs;
        if (!row.image_url && found.imageUrl) patch.image_url = found.imageUrl;
        if (found.videoUrl) patch.video_url = found.videoUrl;
        report[row.url] = `text ${found.paragraphs ? found.paragraphs.length + ' paras' : '-'} · photo ${patch.image_url ? 'added' : '-'} · video ${found.videoUrl ? 'yes' : '-'}`;
      } catch (e) {
        report[row.url] = `parse failed: ${(e as Error).message}`;
      }
    } else report[row.url] = `not read: ${fetchError}`;
    await db.from('articles').update(patch).eq('id', row.id);
  }
  return new Response(JSON.stringify(report, null, 2), { headers: { 'content-type': 'application/json' } });
});
