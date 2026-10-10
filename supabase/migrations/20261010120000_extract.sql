-- Fuller stories (Ashmit, 2026-10-10): the extract-articles function opens each new story's page and stores
-- the article text (free-to-read outlets only), a photo when the feed had none, and a video file.

-- Outlets whose pages are free to read: their article text is pulled from the page. Paywalled outlets (Mint,
-- Business Standard, The Hindu, BusinessLine, Newslaundry) keep the feed's excerpt and "Continue on [outlet]".
-- NDTV and NDTV India refuse the request (HTTP 403), so they stay excerpt-only too.
alter table public.sources add column if not exists page_text boolean not null default false;
update public.sources set page_text = true where id in (
  'indian-express', 'hindustan-times', 'times-of-india', 'scroll', 'bbc-india', 'bbc-world', 'bbc-hindi', 'bbc-marathi',
  'guardian-world', 'al-jazeera', 'amar-ujala', 'dainik-bhaskar', 'abp-news', 'tv9-marathi', 'pib'
);

-- A video file (mp4 / webm) from the page, shown as the thumbnail where the reader allows it.
alter table public.articles add column if not exists video_url text;
-- When the page was read (or tried). Null = not yet.
alter table public.articles add column if not exists extracted_at timestamptz;
create index if not exists articles_to_extract on public.articles (published_at desc) where extracted_at is null;

-- Every 5 minutes, a dozen pages at a time (Edge Functions get about 2s of CPU per request).
select cron.schedule('extract-articles', '*/5 * * * *', $$ select public.call_function('extract-articles') $$);
