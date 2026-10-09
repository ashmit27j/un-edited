-- Lists load without article text; this flag says whether the full text is there to fetch when a story opens.
alter table public.articles add column if not exists has_full boolean generated always as (body is not null) stored;
