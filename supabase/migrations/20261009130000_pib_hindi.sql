-- PIB's feed is in Hindi whatever language is asked for, and its items are press releases, not reports.
-- So it is a Hindi news source, not a Papers & Reports one ("Official report" would mislabel a press release).
update public.sources
set lang = 'hi', name = 'पत्र सूचना कार्यालय (PIB)', kind = 'Government press releases', paper_label = null
where id = 'pib';
update public.articles set lang = 'hi' where source_id = 'pib';
