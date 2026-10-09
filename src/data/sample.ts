/**
 * Sample content: every outlet here is fictional (brand rule). It is what the app shows when the live news
 * (src/data/news.tsx, from Supabase) isn't available. The lookups below (sourceById, storyById, groupOf) read
 * whichever is current, live or sample.
 */

export type LanguageCode = 'en' | 'hi' | 'mr';

export type Source = {
  id: string;
  name: string;
  lang: LanguageCode;
  kind: string;
  place: string;
  owner: string;
  funding: string;
  journal?: boolean;
  /** Live outlets: the outlet's site, and the label for Papers & Reports sources. */
  siteUrl?: string;
  paperLabel?: Paper['label'];
};

export const SOURCES: Source[] = [
  { id: 'ledger', name: 'Morning Ledger', lang: 'en', kind: 'Daily newspaper', place: 'Mumbai', owner: 'Ledger Media Pvt Ltd', funding: 'Subscriptions and advertising' },
  { id: 'courier', name: 'Deccan Courier', lang: 'en', kind: 'Daily newspaper', place: 'Pune', owner: 'Courier Publications Ltd', funding: 'Advertising' },
  { id: 'civic', name: 'Civic Wire', lang: 'en', kind: 'Non-profit newsroom', place: 'Bengaluru', owner: 'Civic Wire Foundation', funding: 'Reader donations and grants' },
  { id: 'sahyadri', name: 'सह्याद्री वार्ता', lang: 'mr', kind: 'Daily newspaper', place: 'Pune', owner: 'Sahyadri Prakashan', funding: 'Subscriptions and advertising' },
  { id: 'darpan', name: 'नगर दर्पण', lang: 'hi', kind: 'Daily newspaper', place: 'Nagpur', owner: 'Darpan Media Group', funding: 'Advertising' },
  { id: 'plateau', name: 'The Plateau Times', lang: 'en', kind: 'Weekly', place: 'Pune', owner: 'Independent, reader-owned', funding: 'Memberships' },
  { id: 'repo', name: 'Open Research Repository', lang: 'en', kind: 'Journals, preprints and papers', place: 'International', owner: 'University consortium', funding: 'Public research grants', journal: true },
];

export const TOPICS = [
  'India', 'World', 'Politics', 'Business', 'Finance', 'Technology', 'Science', 'Health', 'Environment',
  'Climate', 'Education', 'Law & courts', 'Sport', 'Culture', 'Books', 'Cities', 'Agriculture', 'Research',
] as const;
export type Topic = (typeof TOPICS)[number];

export const REGIONS: { name: string; kind: string }[] = [
  { name: 'World', kind: 'Everywhere' },
  { name: 'India', kind: 'Country' },
  { name: 'Maharashtra', kind: 'State' },
  { name: 'Mumbai', kind: 'City' },
  { name: 'Pune', kind: 'City' },
  { name: 'Nagpur', kind: 'City' },
  { name: 'Nashik', kind: 'City' },
  { name: 'Delhi', kind: 'State' },
  { name: 'Karnataka', kind: 'State' },
  { name: 'Bengaluru', kind: 'City' },
  { name: 'Gujarat', kind: 'State' },
  { name: 'Ahmedabad', kind: 'City' },
];

export type Story = {
  id: string;
  sourceId: string;
  /** One of TOPICS (live stories are filed by keyword rules on the server). */
  topic: Topic;
  /** Stories about the same event share a group. */
  group?: string;
  headline: string;
  /** Text shown in the publisher's own words. */
  body: string[];
  /** True when only an excerpt is available and the article links to the full story. */
  excerptOnly?: boolean;
  minsAgo: number;
  credit: string;
  lang?: LanguageCode;
  /** Live stories: the publisher's page and photo. */
  url?: string;
  imageUrl?: string;
};

export type Paper = {
  id: string;
  label: 'Peer-reviewed' | 'Preprint · not yet peer-reviewed' | 'Official report';
  title: string;
  note: string;
  where: string;
  minsAgo: number;
};

const WATER_RES = 'Water board resolution on the 24-hour supply pilot (PDF)';
export const PRIMARY_SOURCE = { title: WATER_RES, note: 'Linked by 2 of the 4 outlets' };

export const STORIES: Story[] = [
  {
    id: 'water-ledger', sourceId: 'ledger', topic: 'Cities', group: 'water', minsAgo: 120,
    headline: 'Water board clears a 24-hour supply pilot for three wards',
    credit: 'Photo · Morning Ledger staff',
    body: [
      'The city water board on Monday approved a six-month pilot that will move three wards from scheduled supply to round-the-clock water.',
      'Officials said meters will be installed in all connections before the switch, and that billing will move to actual use.',
      "Residents' groups asked for a public review of the pilot's results before it is extended to other wards, and the board said findings would be published.",
    ],
  },
  {
    id: 'water-courier', sourceId: 'courier', topic: 'Cities', group: 'water', minsAgo: 90,
    headline: 'Round-the-clock water, but only for three wards — for now',
    credit: 'Photo · A. Rao / Deccan Courier',
    body: [
      'Three wards will get water 24 hours a day under a pilot cleared on Monday, while the rest of the city stays on its current schedule.',
      'The board said the wards were picked because their pipe network was replaced in the last two years.',
      'Water for the remaining wards will keep arriving at fixed hours until the pilot has been reviewed.',
    ],
  },
  {
    id: 'water-civic', sourceId: 'civic', topic: 'Cities', group: 'water', minsAgo: 60,
    headline: '24-hour water pilot: what changes for residents from November',
    credit: 'Photo · Civic Wire',
    body: [
      'Meters first, then the switch: a step-by-step look at the timeline the board has set for the pilot wards.',
      'Meter installation starts in October. Households will receive a notice before their connection moves to the new supply.',
      'Billing for the pilot wards will be based on the reading, not on a flat charge.',
    ],
  },
  {
    id: 'water-plateau', sourceId: 'plateau', topic: 'Cities', group: 'water', minsAgo: 30,
    headline: 'Residents ask for a public review before 24×7 water pilot expands',
    credit: 'Photo · S. Deshmukh / The Plateau Times',
    body: [
      "Residents' groups welcomed the pilot but said its results should be reviewed in public before any expansion.",
      'They asked the board to publish supply hours, complaints and billing data every month while the pilot runs.',
    ],
  },
  {
    id: 'crop-insurance', sourceId: 'courier', topic: 'Agriculture', minsAgo: 180,
    headline: 'State cabinet approves new crop insurance window for rabi season',
    credit: 'Photo · Deccan Courier',
    body: [
      'The state cabinet on Tuesday approved a new enrolment window for crop insurance for the rabi season.',
      'Farmers will be able to enrol through their banks and common service centres until the end of next month.',
      'The state said claims for the last kharif season would be settled in the same period.',
    ],
  },
  {
    id: 'crop-insurance-hi', sourceId: 'darpan', topic: 'Agriculture', lang: 'hi', minsAgo: 200,
    headline: 'राज्य मंत्रिमंडल ने रबी सीज़न के लिए फ़सल बीमा की नई खिड़की मंज़ूर की',
    credit: 'फ़ोटो · नगर दर्पण',
    body: [
      'राज्य मंत्रिमंडल ने मंगलवार को रबी सीज़न के लिए फ़सल बीमा में नामांकन की नई अवधि को मंज़ूरी दी।',
      'किसान अगले महीने के अंत तक अपने बैंक और सामान्य सेवा केंद्रों के ज़रिए नामांकन कर सकेंगे।',
    ],
  },
  {
    id: 'session-ends', sourceId: 'ledger', topic: 'Politics', minsAgo: 240,
    headline: 'Monsoon session ends with nine bills passed, four sent to committee',
    credit: 'Photo · Morning Ledger staff',
    body: [
      'The monsoon session of the legislature ended on Tuesday after nine bills were passed and four were sent to committee for further study.',
      'The session ran for three weeks and lost two days to adjournments.',
    ],
  },
  {
    id: 'session-ends-mr', sourceId: 'sahyadri', topic: 'Politics', lang: 'mr', minsAgo: 260,
    headline: 'पावसाळी अधिवेशन संपले: नऊ विधेयके मंजूर, चार समितीकडे',
    credit: 'छायाचित्र · सह्याद्री वार्ता',
    body: [
      'पावसाळी अधिवेशनाचा मंगळवारी समारोप झाला. नऊ विधेयके मंजूर झाली आणि चार विधेयके समितीकडे पाठवण्यात आली.',
      'अधिवेशन तीन आठवडे चालले आणि दोन दिवस कामकाज तहकूब झाले.',
    ],
  },
  {
    id: 'rail-platforms', sourceId: 'civic', topic: 'India', minsAgo: 300,
    headline: 'Rail ministry lists 40 stations for platform-height upgrades',
    credit: 'Photo · Civic Wire',
    body: [
      'The rail ministry has listed 40 stations where platforms will be raised to match the floor height of newer coaches.',
      'Work is expected to start with stations that have the most passengers boarding with luggage or wheelchairs.',
    ],
  },
  {
    id: 'maps-project', sourceId: 'civic', topic: 'Technology', minsAgo: 330,
    headline: 'Open-source maps project adds street-level data for 12 Indian cities',
    credit: 'Photo · Civic Wire',
    body: [
      'A community mapping project has added street-level data for 12 Indian cities, with house numbers and footpaths in most of them.',
      'The data is free to use and was collected by volunteers over two years.',
    ],
  },
  {
    id: 'data-rule', sourceId: 'ledger', topic: 'Technology', minsAgo: 360,
    headline: 'What a new data-protection rule means for apps that store location',
    credit: 'Illustration · Morning Ledger',
    excerptOnly: true,
    body: [
      'A new rule on personal data will require apps that store location history to say plainly why they keep it and for how long.',
    ],
  },
  {
    id: 'opinion-planning', sourceId: 'plateau', topic: 'Cities', minsAgo: 420,
    headline: 'Opinion: the case for slower city-planning decisions',
    credit: 'Illustration · The Plateau Times',
    body: [
      'Quick approvals feel decisive. But a plan that takes an extra season to consult residents is often cheaper to build and easier to live with.',
      'Cities that review plans in public tend to find problems before the concrete is poured.',
    ],
  },
  {
    id: 'commute-charts', sourceId: 'civic', topic: 'Cities', minsAgo: 480,
    headline: 'Five charts on how commuting times changed this year',
    credit: 'Charts · Civic Wire',
    excerptOnly: true,
    body: ['Average commute times rose in four of the five largest cities this year, while bus journeys got shorter in two of them.'],
  },
  {
    id: 'electric-buses', sourceId: 'courier', topic: 'Cities', minsAgo: 540,
    headline: 'City bus fleet to add 120 electric buses by March',
    credit: 'Photo · Deccan Courier',
    body: ['The city transport body said 120 electric buses will join the fleet by March, taking electric buses to a fifth of the total.'],
  },
  {
    id: 'dengue-beds', sourceId: 'ledger', topic: 'Health', minsAgo: 600,
    headline: 'Hospitals add beds ahead of the dengue season peak',
    credit: 'Photo · Morning Ledger staff',
    body: ['Government hospitals have added dedicated fever wards ahead of the usual October peak in dengue cases.'],
  },
  {
    id: 'election-rolls', sourceId: 'courier', topic: 'Politics', minsAgo: 660,
    headline: 'Election commission publishes revised voter rolls for two states',
    credit: 'Photo · Deccan Courier',
    body: ['The commission published revised voter rolls for two states and opened a window for corrections.'],
  },
  {
    id: 'groundwater', sourceId: 'ledger', topic: 'Environment', minsAgo: 720,
    headline: 'Groundwater recovery after an above-normal monsoon',
    credit: 'Photo · Morning Ledger staff',
    body: ['Groundwater levels recovered in most districts after an above-normal monsoon, though three districts remain below their ten-year average.'],
  },
  {
    id: 'lake-levels', sourceId: 'ledger', topic: 'Environment', minsAgo: 4320,
    headline: 'Lake levels at the end of monsoon, ward by ward',
    credit: 'Photo · Morning Ledger staff',
    body: ['A ward-by-ward look at the city lakes at the end of the monsoon, with the level for each lake against last year.'],
  },
  {
    id: 'metering', sourceId: 'civic', topic: 'Cities', minsAgo: 1440,
    headline: 'Metering drive: how the switch to billed use will work',
    credit: 'Photo · Civic Wire',
    body: ['What a household can expect when a meter is fitted, how readings are taken and how to dispute a bill.'],
  },
];

export const PAPERS: Paper[] = [
  {
    id: 'paper-heat', label: 'Peer-reviewed', where: 'Open Research Repository', minsAgo: 1800,
    title: 'Urban heat islands and night-time temperatures in tier-2 cities',
    note: 'Checked by independent researchers before publication.',
  },
  {
    id: 'paper-commute', label: 'Preprint · not yet peer-reviewed', where: 'Open Research Repository', minsAgo: 2400,
    title: 'Measuring commute times with open transit data',
    note: 'Shared early. Findings may change after review.',
  },
  {
    id: 'paper-roads', label: 'Official report', where: 'Open Research Repository', minsAgo: 3000,
    title: 'Quarterly report on rural road connectivity, July–September',
    note: 'A primary document from a government body, linked in full.',
  },
];

export type NewsData = {
  sources: Source[];
  stories: Story[];
  papers: Paper[];
  live: boolean;
  /** Saved or recently viewed stories older than the live window: found by id, never listed on Home or Feed. */
  archive?: Story[];
};

const SAMPLE: NewsData = { sources: SOURCES, stories: STORIES, papers: PAPERS, live: false };
let current: NewsData = SAMPLE;

/** Set by NewsProvider when live news loads (or null to go back to the sample). */
export function setNewsData(data: NewsData | null) {
  current = data ?? SAMPLE;
}
export const newsData = () => current;

const UNKNOWN: Source = { id: 'unknown', name: 'Unknown outlet', lang: 'en', kind: '', place: '', owner: 'Not yet listed', funding: 'Not yet listed' };
export const sourceById = (id: string): Source => current.sources.find((s) => s.id === id) ?? SOURCES.find((s) => s.id === id) ?? UNKNOWN;
export const storyById = (id: string): Story | undefined =>
  current.stories.find((s) => s.id === id) ?? current.archive?.find((s) => s.id === id) ?? STORIES.find((s) => s.id === id);
export const groupOf = (story: Story): Story[] =>
  story.group ? current.stories.filter((s) => s.group === story.group) : [story];

export function ago(mins: number): string {
  if (mins < 60) return `${Math.max(1, mins)}m`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h`;
  const d = Math.round(mins / 1440);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}

/** Morning Edition is built at 06:00 IST (00:30 UTC). */
const EDITION_UTC_OFFSET_MS = 30 * 60 * 1000;
const DAY_MS = 86_400_000;
const editionIndex = (ms: number) => Math.floor((ms - EDITION_UTC_OFFSET_MS) / DAY_MS);

/** A reader's first edition is Nº 1; it goes up by one each time a new edition publishes. */
export function editionNumber(firstSeenMs: number, nowMs = Date.now()): number {
  return Math.max(1, editionIndex(nowMs) - editionIndex(firstSeenMs) + 1);
}
