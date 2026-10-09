-- Un:edited news backend (docs/current-config.md §5).
-- Stories come from the outlets' own feeds (RSS first, news APIs as a fallback) and are shown in the
-- publisher's words. Nothing reader-facing is written by AI; grouping is plain word matching.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Outlets readers can choose. `funding` / `owner` are shown in "Choose who you trust".
create table if not exists public.sources (
  id text primary key,
  name text not null,
  lang text not null check (lang in ('en', 'hi', 'mr')),
  kind text not null default 'News',
  place text not null default 'India',
  owner text not null default 'Not yet listed',
  funding text not null default 'Not yet listed',
  site_url text not null,
  feed_url text,
  -- Default topic for stories whose feed gives none.
  topic text not null default 'India',
  -- Papers & Reports sources: 'Peer-reviewed' | 'Preprint · not yet peer-reviewed' | 'Official report'.
  paper_label text,
  -- Fallback query for the news APIs when the feed fails ("site:" style domain).
  api_domain text,
  active boolean not null default true,
  -- Feed health, so a broken feed can fall back and be noticed.
  last_ok_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

-- Stories about the same event share a group.
create table if not exists public.story_groups (
  id uuid primary key default gen_random_uuid(),
  lang text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references public.sources (id) on delete cascade,
  url text not null unique,
  title text not null,
  -- The publisher's own excerpt.
  excerpt text,
  -- Paragraphs, only when the feed itself carries the full text. Otherwise the app says "Continue on [source]".
  body text[],
  image_url text,
  image_credit text,
  topic text not null default 'India',
  lang text not null,
  group_id uuid references public.story_groups (id) on delete set null,
  -- Words used for grouping (names, places, numbers), lower-cased.
  keys text[] not null default '{}',
  -- Where the story came from: 'rss' or the API's name.
  via text not null default 'rss',
  published_at timestamptz not null,
  fetched_at timestamptz not null default now()
);

create index if not exists articles_published_idx on public.articles (published_at desc);
create index if not exists articles_source_idx on public.articles (source_id, published_at desc);
create index if not exists articles_group_idx on public.articles (group_id);
create index if not exists articles_keys_idx on public.articles using gin (keys);

-- Report a problem (MoreSheet). Readers can send, never read.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  story_id text not null,
  source_id text not null,
  reason text not null check (reason in ('link', 'image', 'group', 'other')),
  details text check (char_length(details) <= 1000),
  created_at timestamptz not null default now()
);

-- A signed-in reader's library and settings, so they follow them to every device.
-- Downloads are per device and never synced.
create table if not exists public.reader_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  prefs jsonb not null default '{}',
  folders jsonb not null default '{}',
  downloaded_folders jsonb not null default '[]',
  first_seen bigint,
  updated_at timestamptz not null default now()
);

-- Where to deliver notifications: Web Push subscriptions and Expo push tokens (Android).
-- Guests can register too (edition only), so user_id may be null.
create table if not exists public.push_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  kind text not null check (kind in ('web', 'expo')),
  token text not null unique,
  web_keys jsonb,
  -- Snapshot of You › Notifications (NotifyPrefs) and the reader's sources/topics for alerts.
  notify jsonb not null default '{}',
  sources text[] not null default '{}',
  lang text not null default 'en',
  first_seen bigint,
  sent_today int not null default 0,
  sent_on date,
  updated_at timestamptz not null default now()
);

-- What each device has already been sent: 'edition:<date>', 'big:<group id>' (once per story, ever),
-- 'alert:<article id>', 'papers:<date>'.
create table if not exists public.sent_alerts (
  target_id uuid not null references public.push_targets (id) on delete cascade,
  key text not null,
  sent_at timestamptz not null default now(),
  primary key (target_id, key)
);

alter table public.sources enable row level security;
alter table public.story_groups enable row level security;
alter table public.articles enable row level security;
alter table public.reports enable row level security;
alter table public.reader_state enable row level security;
alter table public.push_targets enable row level security;
alter table public.sent_alerts enable row level security;

-- Everyone (guests included) can read the news.
create policy "sources are public" on public.sources for select using (true);
create policy "groups are public" on public.story_groups for select using (true);
create policy "articles are public" on public.articles for select using (true);

-- Anyone can file a report; nobody can read them through the API.
create policy "anyone can report" on public.reports for insert with check (true);

-- Readers see and change only their own state.
create policy "own state: read" on public.reader_state for select using (auth.uid() = user_id);
create policy "own state: insert" on public.reader_state for insert with check (auth.uid() = user_id);
create policy "own state: update" on public.reader_state for update using (auth.uid() = user_id);

-- Push targets are written by the `register-push` function (service role) only.

-- Delete stored articles after 30 days unless someone saved them (proposed in current-config §5).
-- Saved stories live in reader_state.folders, so keep any article id that appears there.
create or replace function public.prune_articles() returns void language sql security definer as $$
  delete from public.articles a
  where a.published_at < now() - interval '30 days'
    and not exists (
      select 1 from public.reader_state r
      where r.folders::text like '%' || a.id::text || '%'
    );
$$;
