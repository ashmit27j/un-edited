// Feed parsing, topic rules and grouping keys for the fetch job. Plain TypeScript with no Deno or Node APIs,
// so it runs in the Supabase Edge Function and in scripts/check-feeds.ts. Nothing here writes reader-facing
// text: titles, excerpts and paragraphs are the publisher's own, only stripped of HTML.
import { XMLParser } from 'npm:fast-xml-parser@4.5.0';

export type FeedItem = {
  url: string;
  title: string;
  excerpt: string | null;
  /** Paragraphs, only when the feed carries the full article (content:encoded). */
  body: string[] | null;
  imageUrl: string | null;
  imageCredit: string | null;
  categories: string[];
  publishedAt: string;
};

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@', textNodeName: '#text', cdataPropName: '#cdata' });

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…' };

function decode(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

function text(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return text(v[0]);
  const o = v as Record<string, unknown>;
  return text(o['#cdata'] ?? o['#text'] ?? '');
}

/** Strip HTML to plain text, keeping the publisher's words. */
export function plain(html: string) {
  return decode(html.replace(/<(script|style|figure|figcaption)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Full text as paragraphs: split on <p> and <br><br>, drop empties and boilerplate lines. */
export function paragraphs(html: string): string[] {
  return html
    .split(/<\/p>|<br\s*\/?>\s*<br\s*\/?>/i)
    .map(plain)
    .filter((p) => p.length > 1 && !/^(also read|read more|advertisement|click here)/i.test(p));
}

function imageOf(item: Record<string, unknown>, html: string): string | null {
  const media = (item['media:content'] ?? item['media:thumbnail']) as Record<string, unknown> | Record<string, unknown>[] | undefined;
  const m = Array.isArray(media) ? media[0] : media;
  if (m && typeof m['@url'] === 'string') return m['@url'] as string;
  const enc = item.enclosure as Record<string, unknown> | undefined;
  if (enc && typeof enc['@url'] === 'string' && String(enc['@type'] ?? 'image').startsWith('image')) return enc['@url'] as string;
  const img = html.match(/<img[^>]+src="([^"]+)"/i);
  return img ? img[1] : null;
}

function creditOf(item: Record<string, unknown>): string | null {
  const media = item['media:content'] as Record<string, unknown> | undefined;
  const credit = media && (media['media:credit'] ?? media['media:copyright']);
  return credit ? plain(text(credit)) : null;
}

/** RSS 2.0 and Atom. */
export function parseFeed(xml: string): FeedItem[] {
  const doc = parser.parse(xml);
  const items: Record<string, unknown>[] = [].concat(doc?.rss?.channel?.item ?? doc?.feed?.entry ?? doc?.['rdf:RDF']?.item ?? []);
  const out: FeedItem[] = [];
  for (const item of items) {
    const link = item.link as unknown;
    const url = typeof link === 'object' && link && !Array.isArray(link) && '@href' in (link as object) ? String((link as Record<string, unknown>)['@href']) : text(link || item.guid);
    const title = plain(text(item.title));
    if (!url.startsWith('http') || !title) continue;
    const full = text(item['content:encoded'] ?? item.content);
    const desc = text(item.description ?? item.summary);
    const body = full && plain(full).length > 400 ? paragraphs(full) : null;
    const excerpt = plain(desc) || (body ? body[0] : '') || null;
    const date = text(item.pubDate ?? item.published ?? item.updated ?? item['dc:date']);
    const when = date ? new Date(date) : new Date();
    out.push({
      url: url.trim(),
      title,
      excerpt: excerpt ? excerpt.slice(0, 600) : null,
      body: body && body.length ? body : null,
      imageUrl: imageOf(item, full || desc),
      imageCredit: creditOf(item),
      categories: ([] as unknown[]).concat(item.category ?? []).map((c) => plain(text(c))).filter(Boolean),
      publishedAt: (isNaN(when.getTime()) ? new Date() : when).toISOString(),
    });
  }
  return out;
}

/**
 * Topic from the feed's own categories and the headline, by plain keyword rules (no AI). Falls back to the
 * source's default topic. Topics match the app's list (src/data/sample.ts TOPICS).
 */
const TOPIC_RULES: [string, RegExp][] = [
  ['Sport', /\b(cricket|ipl|football|hockey|olympic|tennis|badminton|kabaddi|world cup|t20|odi|bcci|fifa)\b|क्रिकेट|खेल|क्रीडा/i],
  ['Finance', /\b(sensex|nifty|rbi|repo rate|stock|shares|ipo|rupee|inflation|gdp|bank|loan|mutual fund)\b|शेयर|बाजार|सेंसेक्स/i],
  ['Business', /\b(business|company|startup|industry|market|trade|exports?|imports?|earnings|revenue)\b/i],
  ['Technology', /\b(tech|ai|artificial intelligence|smartphone|software|app|cyber|data|internet|5g|chip|semiconductor)\b|तकनीक|तंत्रज्ञान/i],
  ['Science', /\b(science|isro|nasa|space|research|scientists?|study finds|physics|biology)\b|विज्ञान/i],
  ['Health', /\b(health|hospital|disease|virus|vaccine|doctor|medical|dengue|malaria|covid|cancer)\b|स्वास्थ्य|आरोग्य/i],
  ['Climate', /\b(climate|heatwave|monsoon|cyclone|flood|drought|emissions|carbon)\b|मानसून|पाऊस|बाढ़|पूर/i],
  ['Environment', /\b(environment|forest|wildlife|pollution|air quality|aqi|river|tiger)\b|प्रदूषण|पर्यावरण/i],
  ['Law & courts', /\b(supreme court|high court|court|judge|verdict|bail|petition|cji|tribunal)\b|अदालत|न्यायालय|कोर्ट/i],
  ['Politics', /\b(election|bjp|congress|minister|parliament|lok sabha|rajya sabha|assembly|mla|mp|cm|chief minister|poll)\b|चुनाव|निवडणूक|मंत्री/i],
  ['Education', /\b(school|university|college|exam|neet|jee|cbse|students?|ugc)\b|शिक्षा|शिक्षण|परीक्षा/i],
  ['Culture', /\b(film|cinema|music|festival|art|bollywood|theatre|book)\b|फिल्म|चित्रपट/i],
  ['Agriculture', /\b(farmers?|crop|kharif|rabi|msp|agricultur\w*)\b|किसान|शेतकरी/i],
  ['Cities', /\b(municipal|civic|metro|bmc|ward|traffic|water supply|potholes?)\b|महापालिका|नगर निगम/i],
  ['World', /\b(us|china|pakistan|russia|ukraine|israel|gaza|un|united nations|europe|trump|biden)\b/i],
];

export function topicOf(title: string, categories: string[], fallback: string) {
  const hay = `${categories.join(' ')} ${title}`;
  for (const [topic, re] of TOPIC_RULES) if (re.test(hay)) return topic;
  return fallback;
}

const STOP = new Set(
  'the a an and or of in on at to for from by with as is are was were be been has have had will would after before over under into about says said new india indian state govt government news live update updates today week year years day days its it this that their his her who what when how why than more most first last two three'.split(
    ' ',
  ),
);
// Common Hindi and Marathi words that say nothing about which event a headline is about.
for (const w of 'में के की का और से को पर है हैं ने लिए बाद साथ बीच तक भी नहीं क्या कैसे अब आज कल यह वह इस उस एक दो तीन लेकर बताया कहा गया गई होगा मध्ये आणि च्या चा ची चे साठी नंतर आहे होते केले झाले काय कसे आता हे ते या त्या एक दोन तीन'.split(' '))
  STOP.add(w);

/**
 * Grouping keys: the "strong words" of a headline. For English, runs of capitalised words become one name
 * ("Jantar Mantar", "Supreme Court"), plus numbers; the first word only counts as part of a run. For Devanagari,
 * every word of 3+ letters that isn't a common word. Lower-cased.
 */
export function keysOf(title: string, lang: string): string[] {
  const words = title.replace(/[“”"‘’'(),:;!?|–—]/g, ' ').replace(/\s-\s/g, ' ').split(/\s+/).filter(Boolean);
  const keys = new Set<string>();
  let run: string[] = [];
  const flush = () => {
    const name = run.join(' ');
    if (run.length && (run.length > 1 || (name.length >= 3 && !STOP.has(name)))) keys.add(name);
    run = [];
  };
  words.forEach((w, i) => {
    const lower = w.toLowerCase().replace(/[.]+$/, '');
    if (/^\d[\d,.]*%?$/.test(lower)) {
      flush();
      // Bare small numbers ("10", "4") are too common to identify an event.
      if (lower.replace(/\D/g, '').length >= 3 || lower.endsWith('%')) keys.add(lower);
      return;
    }
    if (lang === 'en') {
      const cap = /^[A-Z]/.test(w) && !(STOP.has(lower) && run.length === 0);
      if (cap && (i > 0 || words[1] && /^[A-Z]/.test(words[1]))) run.push(lower);
      else flush();
    } else if (lower.length >= 3 && !STOP.has(lower)) keys.add(lower);
  });
  flush();
  return [...keys];
}

/**
 * Two headlines are about the same event when they share at least two strong words and those make up at least
 * 50% of the shorter headline's strong words. Leans towards not merging: a wrong merge hides a story.
 */
export function sameEvent(a: string[], b: string[]) {
  if (a.length < 2 || b.length < 2) return false;
  let shared = 0;
  for (const k of a) if (b.includes(k)) shared++;
  return shared >= 2 && shared / Math.min(a.length, b.length) >= 0.5;
}
