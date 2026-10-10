// Reads a story's page on the publisher's site for what the feed left out: the article's own paragraphs
// (outlets marked page_text only), its photo, and a video file. Nothing is rewritten: paragraphs are the
// publisher's text as it appears on the page, only stripped of markup and of site furniture (share prompts,
// "Also read" links, author bios).
import { Readability } from 'npm:@mozilla/readability@0.5.0';
import { parseHTML } from 'npm:linkedom@0.18.5';

export type PageExtract = {
  paragraphs: string[] | null;
  imageUrl: string | null;
  videoUrl: string | null;
};

/** Lines that belong to the site, not the story. */
const FURNITURE =
  /^(also read|read more|read also|also see|also watch|watch:|advertisement|click here|subscribe|follow us|follow live updates|download the|sign up|get the latest|for more|you can now|join our|catch all the|stay updated|first published|published\s*[-–:]|updated\s*[-–:]|quick answers to key questions)/i;
/** Everything from here down is a bio, a newsletter box or related links. */
const STOP = /^(about the author|more from this section|recommended stories|related stories|trending stories|top stories)$/i;

const ENTITY: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', '#39': "'", '#x2F': '/' };
const unescape = (s: string) => s.replace(/&(amp|quot|apos|lt|gt|#39|#x2F);/g, (_, e) => ENTITY[e] ?? _).replace(/\\\//g, '/');

function meta(html: string, names: string[]): string | null {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`,
      'i',
    );
    const m = html.match(re);
    if (m) return unescape((m[1] ?? m[2]).trim());
  }
  return null;
}

const absolute = (u: string | null, base: string) => {
  if (!u) return null;
  try {
    const url = new URL(u, base);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
};

/** Only plain video files play as a thumbnail; streams and embeds (YouTube, HLS) don't. */
const isVideoFile = (u: string | null) => !!u && /\.(mp4|webm)(\?|#|$)/i.test(u);

function findVideo(html: string, base: string): string | null {
  const og = [meta(html, ['og:video:secure_url']), meta(html, ['og:video:url']), meta(html, ['og:video'])].map((u) => absolute(u, base));
  const fromMeta = og.find(isVideoFile);
  if (fromMeta) return fromMeta;
  const ld = html.match(/"contentUrl"\s*:\s*"([^"]+?\.(?:mp4|webm)[^"]*)"/i);
  if (ld) return absolute(unescape(ld[1]), base);
  const tag = html.match(/<(?:video|source)[^>]+src=["']([^"']+\.(?:mp4|webm)[^"']*)["']/i);
  return tag ? absolute(unescape(tag[1]), base) : null;
}

/** The article's paragraphs via Readability (the reader-view algorithm), in page order. */
function findParagraphs(html: string): string[] | null {
  // Scripts, styles and inline SVG are most of a news page's weight and never part of the story.
  const lean = html.replace(/<(script|style|noscript|svg|iframe|template)\b[\s\S]*?<\/\1>/gi, '');
  const { document } = parseHTML(lean);
  const article = new Readability(document as unknown as Document, { charThreshold: 400 }).parse();
  if (!article?.content) return null;
  const { document: doc } = parseHTML(`<!doctype html><html><body>${article.content}</body></html>`);
  const out: string[] = [];
  for (const el of doc.querySelectorAll('p, h2, h3, blockquote, li')) {
    if (el.parentElement?.closest('p, blockquote, li')) continue;
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (STOP.test(text)) break;
    if (text.length > 1 && !FURNITURE.test(text)) out.push(text);
  }
  return out.length ? out : null;
}

/**
 * `withText`: also pull the article text (outlets with page_text on). The text is kept only when it is clearly
 * more than the feed gave (at least 500 characters and 1.3× the excerpt), so a paywall teaser or a page the
 * reader view can't read never replaces the excerpt.
 */
export function extractPage(html: string, url: string, withText: boolean, excerpt: string | null): PageExtract {
  const imageUrl = absolute(meta(html, ['og:image', 'twitter:image', 'twitter:image:src']), url);
  const videoUrl = findVideo(html, url);
  let paragraphs: string[] | null = null;
  if (withText) {
    const found = findParagraphs(html);
    const chars = found ? found.join(' ').length : 0;
    if (found && chars >= 500 && chars >= (excerpt?.length ?? 0) * 1.3) paragraphs = found;
  }
  return { paragraphs, imageUrl, videoUrl };
}
