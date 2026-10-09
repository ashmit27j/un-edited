-- Starting outlet list (proposed 2026-10-09, needs Ashmit's review before launch).
-- Every feed URL answered with stories when checked on 2026-10-09. Owner and funding are only filled in where
-- they are well documented; the rest say "Not yet listed" until checked.

insert into public.sources (id, name, lang, kind, place, owner, funding, site_url, feed_url, topic, paper_label, api_domain) values
-- English, India
('the-hindu', 'The Hindu', 'en', 'Newspaper', 'Chennai', 'The Hindu Group (Kasturi & Sons)', 'Not yet listed', 'https://www.thehindu.com', 'https://www.thehindu.com/news/national/feeder/default.rss', 'India', null, 'thehindu.com'),
('indian-express', 'The Indian Express', 'en', 'Newspaper', 'New Delhi', 'The Indian Express Group', 'Not yet listed', 'https://indianexpress.com', 'https://indianexpress.com/feed/', 'India', null, 'indianexpress.com'),
('hindustan-times', 'Hindustan Times', 'en', 'Newspaper', 'New Delhi', 'HT Media', 'Not yet listed', 'https://www.hindustantimes.com', 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', 'India', null, 'hindustantimes.com'),
('times-of-india', 'The Times of India', 'en', 'Newspaper', 'Mumbai', 'Bennett, Coleman & Co.', 'Not yet listed', 'https://timesofindia.indiatimes.com', 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', 'India', null, 'timesofindia.indiatimes.com'),
('ndtv', 'NDTV', 'en', 'Broadcaster', 'New Delhi', 'NDTV (majority owned by the Adani Group)', 'Not yet listed', 'https://www.ndtv.com', 'https://feeds.feedburner.com/ndtvnews-top-stories', 'India', null, 'ndtv.com'),
('scroll', 'Scroll', 'en', 'Digital', 'Mumbai', 'Scroll Media', 'Not yet listed', 'https://scroll.in', 'https://feeds.feedburner.com/ScrollinArticles.rss', 'India', null, 'scroll.in'),
('mint', 'Mint', 'en', 'Business daily', 'New Delhi', 'HT Media', 'Not yet listed', 'https://www.livemint.com', 'https://www.livemint.com/rss/news', 'Business', null, 'livemint.com'),
('businessline', 'The Hindu BusinessLine', 'en', 'Business daily', 'Chennai', 'The Hindu Group (Kasturi & Sons)', 'Not yet listed', 'https://www.thehindubusinessline.com', 'https://www.thehindubusinessline.com/feeder/default.rss', 'Business', null, 'thehindubusinessline.com'),
('business-standard', 'Business Standard', 'en', 'Business daily', 'New Delhi', 'Business Standard Private Ltd', 'Not yet listed', 'https://www.business-standard.com', 'https://www.business-standard.com/rss/latest.rss', 'Business', null, 'business-standard.com'),
('newslaundry', 'Newslaundry', 'en', 'Digital', 'New Delhi', 'Newslaundry Media', 'Reader subscriptions', 'https://www.newslaundry.com', 'https://www.newslaundry.com/feed', 'India', null, 'newslaundry.com'),
('bbc-india', 'BBC News India', 'en', 'Broadcaster', 'London', 'BBC', 'UK licence fee and commercial income', 'https://www.bbc.com/news/world/asia/india', 'https://feeds.bbci.co.uk/news/world/asia/india/rss.xml', 'India', null, 'bbc.com'),
('the-hindu-science', 'The Hindu · Science', 'en', 'Newspaper section', 'Chennai', 'The Hindu Group (Kasturi & Sons)', 'Not yet listed', 'https://www.thehindu.com/sci-tech/science/', 'https://www.thehindu.com/sci-tech/science/feeder/default.rss', 'Science', null, null),
-- English, world
('bbc-world', 'BBC News · World', 'en', 'Broadcaster', 'London', 'BBC', 'UK licence fee and commercial income', 'https://www.bbc.com/news/world', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'World', null, null),
('guardian-world', 'The Guardian · World', 'en', 'Newspaper', 'London', 'Guardian Media Group (owned by the Scott Trust)', 'Readers, advertising and the Scott Trust', 'https://www.theguardian.com/world', 'https://www.theguardian.com/world/rss', 'World', null, 'theguardian.com'),
('al-jazeera', 'Al Jazeera English', 'en', 'Broadcaster', 'Doha', 'Al Jazeera Media Network', 'Funded by the State of Qatar', 'https://www.aljazeera.com', 'https://www.aljazeera.com/xml/rss/all.xml', 'World', null, 'aljazeera.com'),
-- Hindi
('bbc-hindi', 'बीबीसी हिंदी', 'hi', 'Broadcaster', 'New Delhi', 'BBC', 'UK licence fee and commercial income', 'https://www.bbc.com/hindi', 'https://feeds.bbci.co.uk/hindi/rss.xml', 'India', null, null),
('amar-ujala', 'अमर उजाला', 'hi', 'Newspaper', 'Noida', 'Amar Ujala Publications', 'Not yet listed', 'https://www.amarujala.com', 'https://www.amarujala.com/rss/breaking-news.xml', 'India', null, 'amarujala.com'),
('dainik-bhaskar', 'दैनिक भास्कर', 'hi', 'Newspaper', 'Bhopal', 'DB Corp', 'Not yet listed', 'https://www.bhaskar.com', 'https://www.bhaskar.com/rss-v1--category-1061.xml', 'India', null, 'bhaskar.com'),
('ndtv-india', 'एनडीटीवी इंडिया', 'hi', 'Broadcaster', 'New Delhi', 'NDTV (majority owned by the Adani Group)', 'Not yet listed', 'https://ndtv.in', 'https://feeds.feedburner.com/ndtvkhabar-latest', 'India', null, 'ndtv.in'),
('abp-news', 'एबीपी न्यूज़', 'hi', 'Broadcaster', 'Noida', 'ABP Group', 'Not yet listed', 'https://www.abplive.com', 'https://www.abplive.com/home/feed', 'India', null, 'abplive.com'),
-- Marathi
('bbc-marathi', 'बीबीसी मराठी', 'mr', 'Broadcaster', 'Mumbai', 'BBC', 'UK licence fee and commercial income', 'https://www.bbc.com/marathi', 'https://feeds.bbci.co.uk/marathi/rss.xml', 'India', null, null),
('tv9-marathi', 'टीव्ही 9 मराठी', 'mr', 'Broadcaster', 'Mumbai', 'TV9 Network', 'Not yet listed', 'https://www.tv9marathi.com', 'https://www.tv9marathi.com/feed', 'India', null, 'tv9marathi.com'),
-- Papers & Reports
('pib', 'Press Information Bureau', 'en', 'Government', 'New Delhi', 'Government of India', 'Government of India', 'https://pib.gov.in', 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3', 'India', 'Official report', null),
('arxiv-soc', 'arXiv · Physics and Society', 'en', 'Preprint server', 'Ithaca, NY', 'Cornell University', 'Cornell, member institutions and donors', 'https://arxiv.org/list/physics.soc-ph/recent', 'https://rss.arxiv.org/rss/physics.soc-ph', 'Research', 'Preprint · not yet peer-reviewed', null)
on conflict (id) do update set
  name = excluded.name, lang = excluded.lang, kind = excluded.kind, place = excluded.place, owner = excluded.owner,
  funding = excluded.funding, site_url = excluded.site_url, feed_url = excluded.feed_url, topic = excluded.topic,
  paper_label = excluded.paper_label, api_domain = excluded.api_domain;
