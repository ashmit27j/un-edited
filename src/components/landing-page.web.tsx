/**
 * Web landing page, built from design/screens/Landing.dc.html and design/motion/MOTION.md §9.
 * Plain DOM + CSS (web only), so the design's CSS animations carry over as written.
 * Colours come from CSS variables keyed on <html data-theme="paper|ink"> (set in +html.tsx).
 */
import { useRouter } from 'expo-router';
import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';

import { useInstallGuide } from '@/components/install-guide';
import { useSession } from '@/session/session-provider';
import { useReader } from '@/store/reader-provider';
import { useTheme } from '@/theme/theme-provider';

const WORDS = ['changed', 'biased', 'masked', 'edited'];

const STEPS = [
  { id: 'home', dur: 6400, tab: 0, tapX: 241, tapY: 800, to: -1040, h: 1900 },
  { id: 'library', dur: 4200, tab: 2, tapX: 332, tapY: 800, to: 0, h: 844 },
  { id: 'you', dur: 5600, tab: 3, tapX: 149, tapY: 800, to: -540, h: 1700 },
  { id: 'feed', dur: 4200, tab: 1, tapX: 195, tapY: 330, to: 0, h: 844 },
  { id: 'article', dur: 6400, tab: -1, tapX: 38, tapY: 36, to: -780, h: 1640 },
];

const TABS = [
  ['Home', 'M4 5h16v14H4zM4 9h16M9 9v10'],
  ['Feed', 'M6 3h12v18H6zM9 8h6M9 12h6M9 16h3'],
  ['Library', 'M3.5 7h6l2 2h9v10h-17z'],
  ['You', 'M8.5 8.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5'],
];

const VERSIONS = [
  { name: 'Morning Ledger', time: '7:42 AM', headline: 'Water board clears a 24-hour supply pilot for three wards', lede: 'The city water board on Monday approved a six-month pilot that will move three wards from scheduled supply to round-the-clock water.' },
  { name: 'Deccan Courier', time: '8:15 AM', headline: 'Round-the-clock water, but only for three wards — for now', lede: 'Three wards will get water 24 hours a day under a pilot cleared on Monday, while the rest of the city stays on its current schedule.' },
  { name: 'Civic Wire', time: '9:02 AM', headline: '24-hour water pilot: what changes for residents from November', lede: 'Meters first, then the switch: a step-by-step look at the timeline the board has set for the pilot wards.' },
  { name: 'The Plateau Times', time: '10:30 AM', headline: 'Residents ask for a public review before the pilot expands', lede: 'Residents’ groups welcomed the pilot but said its results should be reviewed in public before any expansion.' },
];

const FACTS = [
  ['Owner', 'Ledger Media (example)'],
  ['Funding', 'Subscriptions and advertising'],
  ['Based in', 'Pune, Maharashtra'],
  ['Corrections', 'Published policy, noted at the end of articles'],
];

const PAPERS = [
  { label: 'Peer-reviewed', title: 'Urban heat islands and night-time temperatures in tier-2 cities', note: 'Checked by independent researchers before publication.' },
  { label: 'Preprint · not yet peer-reviewed', title: 'Measuring commute times with open transit data', note: 'Shared early. Findings may change after review.' },
  { label: 'Official report', title: 'Quarterly report on rural road connectivity, July–September', note: 'A primary document from a government body, linked in full.' },
];

const CONTACT = 'ashmit27j@gmail.com';

const FAQS = [
  { q: 'Do you rewrite or summarise articles?', a: 'No. Headlines, text and image credits are shown as each publisher released them. When only an excerpt is available, the article says so and links to the full story.' },
  { q: 'How is my feed ordered?', a: 'By time of publication, from the sources you chose. Nothing is ranked by what you click.' },
  { q: 'Do I need an account?', a: 'No. Anyone can read. An account lets you save articles into folders and keep your settings on every device.' },
  { q: 'How does Un:edited pay for itself?', a: 'It doesn’t need to. There is no paid version, no subscription and no ads, and there won’t be. It is built by one person and runs on free and low-cost services.' },
];

const OUTLETS = ['Morning Ledger', 'Deccan Courier', 'Civic Wire', 'The Plateau Times', 'सह्याद्री वार्ता', 'नगर दर्पण'];
const OUTLET_LANG: Record<string, string> = { 'सह्याद्री वार्ता': 'mr', 'नगर दर्पण': 'hi' };

const REVEAL = ['idea', 'sources', 'papers', 'day', 'questions', 'start'] as const;
type RevealId = (typeof REVEAL)[number];

const vars = (o: Record<string, string | number>) => o as CSSProperties;

/** Line-drawn newspaper page (hero background): masthead, headline, two columns. */
function ColumnSheet({ w, h }: { w: number; h: number }) {
  const mid = w / 2;
  const L = mid - 6;
  const R = mid + 6;
  const E = w - 16;
  const lines: string[] = [];
  for (let i = 0; i < 9; i++) {
    const y = 78 + i * 12;
    const short = i === 3 || i === 7;
    lines.push(`M16 ${y}H${short ? Math.round(16 + (L - 16) * 0.6) : L}`);
    lines.push(`M${R} ${y}H${short ? Math.round(R + (E - R) * 0.6) : E}`);
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect x="1" y="1" width={w - 2} height={h - 2} pathLength={1} />
      <path d={`M16 26H${E}`} pathLength={1} />
      <path d={`M16 31H${E}`} pathLength={1} />
      <path d={`M${mid - 44} 18H${mid + 44}`} pathLength={1} style={{ strokeWidth: 3 }} />
      <path d={`M16 48H${Math.round(16 + (E - 16) * 0.64)}M16 58H${Math.round(16 + (E - 16) * 0.5)}`} pathLength={1} style={{ strokeWidth: 3 }} />
      {lines.map((d) => (
        <path key={d} d={d} pathLength={1} />
      ))}
      <path d={`M${mid} 72V${h - 18}`} pathLength={1} />
    </svg>
  );
}

/** Small newspaper that peeks up behind the "caught up" card (section 04). */
function PeekPaper({ w, h }: { w: number; h: number }) {
  const mid = w / 2;
  const L = mid - 5;
  const R = mid + 5;
  const E = w - 12;
  const lines: string[] = [];
  for (let i = 0, y = 50; y <= h - 9; i++, y += 9) {
    const short = i % 4 === 3;
    lines.push(`M12 ${y}H${short ? Math.round(12 + (L - 12) * 0.55) : L}`);
    lines.push(`M${R} ${y}H${short ? Math.round(R + (E - R) * 0.55) : E}`);
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <rect x="1" y="1" width={w - 2} height={h - 2} style={{ fill: 'var(--bg)' }} />
      <path d={`M12 20H${E}M12 24H${E}`} />
      <path d={`M${mid - 26} 13H${mid + 26}`} style={{ strokeWidth: 2.4 }} />
      <path d={`M12 36H${Math.round(12 + (E - 12) * 0.685)}`} style={{ strokeWidth: 2.4 }} />
      {lines.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

function Wordmark({ size, label }: { size: number; label: string }) {
  return (
    <a href="#top" aria-label={label} className="lp-mark" style={{ fontSize: size }}>
      <span style={{ color: 'var(--accent)' }}>Un</span>
      <span aria-hidden="true" className="lp-colon">
        <span />
        <span />
      </span>
      edited
    </a>
  );
}

function SectionHead({ n, title, aside, accent }: { n: string; title: string; aside: string; accent?: boolean }) {
  return (
    <div className="lp-head">
      <span className="lp-num" style={accent ? { background: 'var(--accent)' } : undefined}>{n}</span>
      <span>{title}</span>
      <span className="lp-line" />
      <span className="lp-aside">{aside}</span>
    </div>
  );
}

export function LandingPage() {
  const router = useRouter();
  const { name, setPreference } = useTheme();
  const { continueAsGuest } = useSession();
  const { finishOnboarding } = useReader();
  const installGuide = useInstallGuide();
  const scroller = useRef<HTMLDivElement>(null);

  // Typing headline. Starts on "edited" so the pre-rendered page and reduced motion read "Un:edited".
  const [type, setType] = useState({ wi: 3, n: 6, done: true });
  const [demo, setDemo] = useState(0);
  const [tapping, setTapping] = useState(false);
  const [version, setVersion] = useState({ v: 0, auto: true });
  const [faq, setFaq] = useState(0);
  const [armed, setArmed] = useState(false);
  const [seen, setSeen] = useState<Partial<Record<RevealId, boolean>>>({});

  useEffect(() => {
    const rotate = setInterval(() => setVersion((s) => (s.auto ? { ...s, v: (s.v + 1) % VERSIONS.length } : s)), 6000);
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (calm) return () => clearInterval(rotate);

    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));

    // Typing: 1.4s in, 150ms a letter, hold 2.6s, erase at 70ms a letter, pause 0.6s; stop on "edited".
    let wi = 0;
    let n = 0;
    later(() => setType({ wi: 0, n: 0, done: false }), 0); // the "Un:" line is still hidden (rises at 0.55s)
    const typeStep = (phase: 'type' | 'erase', wait: number) =>
      later(() => {
        const word = WORDS[wi];
        if (phase === 'type') {
          if (n < word.length) {
            n += 1;
            setType({ wi, n, done: false });
            typeStep('type', 150);
          } else if (wi === WORDS.length - 1) {
            later(() => setType({ wi, n, done: true }), 2400);
          } else typeStep('erase', 2600);
        } else if (n > 0) {
          n -= 1;
          setType({ wi, n, done: false });
          typeStep('erase', 70);
        } else {
          wi += 1;
          setType({ wi, n, done: false });
          typeStep('type', 600);
        }
      }, wait);
    typeStep('type', 1400);

    // Phone demo: each screen runs its duration; the tap ripple shows 650ms before the switch.
    const runDemo = (i: number) => {
      setDemo(i);
      setTapping(false);
      later(() => setTapping(true), STEPS[i].dur - 650);
      later(() => runDemo((i + 1) % STEPS.length), STEPS[i].dur);
    };
    runDemo(0);

    // Section reveal: a section shows once its top passes 88% of the viewport height.
    const el = scroller.current;
    let raf = 0;
    const reveal = (first?: boolean) => {
      const limit = window.innerHeight * 0.88;
      setSeen((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const id of REVEAL) {
          const node = document.getElementById(id);
          if (!next[id] && node && node.getBoundingClientRect().top < limit) {
            next[id] = true;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
      if (first) setArmed(true);
    };
    const check = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        reveal();
      });
    };
    el?.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    reveal(true);

    return () => {
      clearInterval(rotate);
      timers.forEach(clearTimeout);
      el?.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const go = useCallback(
    (href: '/onboarding') => (e: MouseEvent) => {
      e.preventDefault();
      router.push(href);
    },
    [router],
  );

  const readOnWeb = (e: MouseEvent) => {
    e.preventDefault();
    continueAsGuest();
    finishOnboarding();
    router.replace('/home');
  };

  const dark = name === 'ink';
  const step = STEPS[demo];
  const typed = WORDS[type.wi].slice(0, type.n);
  const caretOff = type.done && type.wi === WORDS.length - 1 && type.n === WORDS[type.wi].length;
  const hidden = (id: RevealId) => (armed && !seen[id] ? ' lp-hide' : '');
  const mode = dark ? 'ink' : 'paper';

  return (
    <div ref={scroller} className="lp-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="lp-header">
        <div className="lp-wrap lp-header-row">
          <Wordmark size={28} label="Un:edited" />
          <div className="lp-header-right">
            <nav aria-label="Page" className="lp-nav">
              <a href="#idea">How it works</a>
              <a href="#sources">Sources</a>
              <a href="#questions">Questions</a>
            </nav>
            <button
              type="button"
              className="lp-theme"
              onClick={() => setPreference(dark ? 'paper' : 'ink')}
              aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
              title={dark ? 'Light theme' : 'Dark theme'}>
              {dark ? (
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main style={{ position: 'relative' }}>
        <section id="top" className="lp-wrap lp-hero">
          <div className="lp-head">
            <span className="lp-num">Nº 1</span>
            <span>A news reader</span>
            <span className="lp-line" />
            <span className="lp-aside">No AI · No algorithm · No fee</span>
          </div>

          <div className="lp-hero-row">
            <div className="lp-px-text lp-hero-text">
              <h1 aria-label="Every story, Un:edited." className="lp-h1">
                <span aria-hidden="true" className="lp-wipe lp-d1">Every story,</span>
                <br />
                <span aria-hidden="true" className="lp-rise lp-d2 lp-typed">
                  <span style={{ color: 'var(--accent)' }}>Un:</span>
                  <span>{typed}</span>
                  <span className={caretOff ? 'lp-caret lp-caret-off' : 'lp-caret'} style={{ color: 'var(--accent)' }} />
                </span>
              </h1>
              <p className="lp-rise lp-d3 lp-hero-p">
                <span style={{ color: 'var(--ink)' }}>Every story, as it was written.</span> Un:edited brings the outlets you choose onto one calm front page. Nothing is summarised, rewritten or ranked for you.
              </p>
              <div className="lp-rise lp-d4 lp-btns">
                <a href="/onboarding" onClick={go('/onboarding')} className="lp-cta lp-hero-btn lp-solid">
                  Start reading
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="lp-ico" style={{ strokeWidth: 1.8 }}>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
                <a href="#start" className="lp-cta lp-ghost lp-hero-btn lp-outline">Get the app</a>
              </div>
            </div>

            <div className="lp-rise lp-d3 lp-phone-col">
              <div className="lp-px-deep" aria-hidden="true">
                <div className="lp-deep-scale">
                  <div className="lp-sheet" style={vars({ '--x': '-200px', '--y': '-150px', '--r': '-9deg', '--d': '0.5s' })}>
                    <ColumnSheet w={230} h={300} />
                  </div>
                  <div className="lp-sheet" style={vars({ '--x': '110px', '--y': '-170px', '--r': '7deg', '--d': '0.65s' })}>
                    <ColumnSheet w={210} h={280} />
                  </div>
                  <div className="lp-sheet" style={vars({ '--x': '-215px', '--y': '190px', '--r': '6deg', '--d': '0.8s' })}>
                    <svg width="180" height="170" viewBox="0 0 180 170">
                      <rect x="1" y="1" width="178" height="168" pathLength={1} />
                      <rect x="14" y="14" width="152" height="71" pathLength={1} />
                      <path d="M14 85L166 14" pathLength={1} />
                      {[101, 112, 123, 134].map((y) => (
                        <path key={y} d={`M14 ${y}H166`} pathLength={1} />
                      ))}
                      <path d="M14 145H148" pathLength={1} />
                    </svg>
                  </div>
                  <div className="lp-sheet" style={vars({ '--x': '100px', '--y': '200px', '--r': '-6deg', '--d': '0.95s' })}>
                    <ColumnSheet w={220} h={290} />
                  </div>
                  <div className="lp-sheet" style={vars({ '--x': '0px', '--y': '-330px', '--r': '-3deg', '--d': '1.1s' })}>
                    <svg width="170" height="54" viewBox="0 0 170 54">
                      {[['4', 169], ['13', 147], ['22', 125], ['31', 169], ['40', 147], ['49', 125]].map(([y, x]) => (
                        <path key={y} d={`M1 ${y}H${x}`} pathLength={1} />
                      ))}
                    </svg>
                  </div>
                  <div className="lp-sheet" style={vars({ '--x': '-250px', '--y': '20px', '--r': '0deg', '--d': '1.2s' })}>
                    <svg width="78" height="78" viewBox="0 0 78 78">
                      <circle cx="39" cy="39" r="37" pathLength={1} />
                      <circle cx="39" cy="39" r="30" pathLength={1} />
                      <path d="M23 39H55M29 47H49M29 31H49" pathLength={1} />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="lp-px-phone">
                <div className="lp-phone-frame" role="img" aria-label="Preview of the Un:edited app moving through Home, Library, You, Feed and an article">
                  <div aria-hidden="true" className="lp-phone-screen">
                    <div className="lp-phone-inner">
                      <div key={`${step.id}-${mode}`} className="lp-screen">
                        <div className="lp-scrolling" style={vars({ '--to': `${step.to}px`, '--dur': `${step.dur / 1000}s`, width: '390px', height: `${step.h}px` })}>
                          <img src={`/lp/${step.id}-${mode}.jpg`} alt="" width={390} height={step.h} draggable={false} style={{ display: 'block' }} />
                        </div>
                      </div>
                      {step.tab >= 0 ? (
                        <div className="lp-phone-tabs">
                          {TABS.map(([label, icon], i) => (
                            <span key={label} style={{ color: i === step.tab ? 'var(--accent)' : 'var(--muted)', fontWeight: i === step.tab ? 500 : 400 }}>
                              <svg width="22" height="22" viewBox="0 0 24 24" className="lp-ico" style={{ strokeWidth: 1.6 }}>
                                <path d={icon} />
                              </svg>
                              {label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {tapping ? <span key={`tap-${demo}`} className="lp-tap" style={{ left: step.tapX, top: step.tapY }} /> : null}
                    </div>
                  </div>
                </div>
                <span className="lp-hero-stamp">
                  <svg viewBox="0 0 156 156" aria-hidden="true">
                    <path d={STAMP_EDGE} />
                  </svg>
                  <img src={`/lp/stamp-brand-${mode}.svg`} alt="Stamp: Every story, as it was written. Un:edited, 2026." />
                </span>
              </div>
            </div>
          </div>

          <div className="lp-marquee">
            <div className="lp-track">
              {[0, 1, 2, 3].map((copy) => (
                <Fragment key={copy}>
                  {OUTLETS.map((o) => (
                    <span key={`${copy}-${o}`} className="lp-marquee-item" aria-hidden={copy === 0 ? undefined : true}>
                      <span className="lp-out" lang={OUTLET_LANG[o]}>{o}</span>
                      <span className="lp-dot" />
                    </span>
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        <section id="idea" className={`lp-wrap lp-sec lp-fade${hidden('idea')}`}>
          <SectionHead n="01" title="The idea" aside="Read it from" />
          <div className="lp-cols">
            <div className="lp-col-text">
              <h2 className="lp-h2">One story.<br /><i style={{ color: 'var(--accent)' }}>Every version.</i></h2>
              <p className="lp-lead">When several outlets report the same event, Un:edited puts them side by side. Switch between them under “Read it from” and see how each one tells it.</p>
            </div>
            <div className="lp-col-card lp-card" style={{ padding: '24px 28px 28px 28px' }}>
              <span className="lp-label" style={{ color: 'var(--accent)' }}>City · Covered by 4 sources</span>
              <div role="tablist" aria-label="Read it from" className="lp-tabs">
                {VERSIONS.map((s, i) => {
                  const on = i === version.v;
                  return (
                    <button
                      key={s.name}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setVersion({ v: i, auto: false })}
                      style={{ borderBottomColor: on ? 'var(--accent)' : 'transparent', color: on ? 'var(--ink)' : 'var(--muted)', fontWeight: on ? 500 : 400 }}>
                      {s.name}
                    </button>
                  );
                })}
              </div>
              <div style={{ minHeight: 210, paddingTop: 22 }}>
                <div key={version.v} className="lp-swap" role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span className="lp-sans" style={{ fontSize: 13, color: 'var(--muted)' }}>{VERSIONS[version.v].name} · Tue 6 Oct, {VERSIONS[version.v].time}</span>
                  <span style={{ fontSize: 32, lineHeight: 1.15, letterSpacing: -0.4 }}>{VERSIONS[version.v].headline}</span>
                  <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6 }}>{VERSIONS[version.v].lede}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="sources" className={`lp-wrap lp-sec lp-fade${hidden('sources')}`}>
          <SectionHead n="02" title="Your sources" aside="Choose who you trust" />
          <div className="lp-cols">
            <div className="lp-col-text">
              <h2 className="lp-h2">Know who is<br /><i style={{ color: 'var(--accent)' }}>behind</i> the news.</h2>
              <p className="lp-lead">Every outlet shows who owns it, how it is funded and where it is based before you add it. Your feed shows only the ones you pick.</p>
            </div>
            <div className="lp-col-card lp-card" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--ink)' }}>
                <span style={{ fontSize: 30 }}>Morning Ledger</span>
                <span className="lp-label" style={{ color: 'var(--accent)' }}>Example</span>
              </div>
              {FACTS.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 16, padding: '13px 0', borderBottom: '1px solid var(--rule)' }}>
                  <span className="lp-label" style={{ width: 120, flexShrink: 0, color: 'var(--muted)', paddingTop: 4 }}>{k}</span>
                  <span style={{ fontSize: 18, lineHeight: 1.4 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="papers" className={`lp-wrap lp-sec lp-fade${hidden('papers')}`}>
          <SectionHead n="03" title="Papers & reports" aside="Honest labels" />
          <div className="lp-cols">
            <div className="lp-col-text">
              <h2 className="lp-h2">Research,<br /><i style={{ color: 'var(--accent)' }}>labelled</i> honestly.</h2>
              <p className="lp-lead">Studies and official documents sit on your front page with a plain label, so you always know what kind of evidence you are reading.</p>
            </div>
            <div className="lp-col-card" style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--ink)' }}>
              {PAPERS.map((p) => (
                <div key={p.title} className="lp-paper">
                  <span className="lp-label" style={{ color: 'var(--accent)', paddingTop: 6, lineHeight: 1.5 }}>{p.label}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 21, lineHeight: 1.3 }}>{p.title}</span>
                    <span className="lp-sans" style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--muted)' }}>{p.note}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="day" className={`lp-wrap lp-sec lp-fade${hidden('day')}`}>
          <SectionHead n="04" title="Your day" aside="One edition" />
          <div className="lp-cols">
            <div className="lp-col-text">
              <h2 className="lp-h2">News that<br /><i style={{ color: 'var(--accent)' }}>ends.</i></h2>
              <p className="lp-lead">There is no endless scroll. When you have read what your sources published today, Un:edited tells you, and you can put it down.</p>
            </div>
            <div className={`lp-col-card${!armed || seen.day ? ' lp-peek-on' : ''}`} style={{ position: 'relative', marginTop: 150 }}>
              <span className="lp-peek" style={vars({ left: '6%', '--r': '-9deg', '--d': '.15s' })}>
                <PeekPaper w={170} h={128} />
              </span>
              <span className="lp-peek" style={vars({ left: '34%', '--r': '2deg', '--d': '.3s' })}>
                <PeekPaper w={190} h={140} />
              </span>
              <span className="lp-peek" style={vars({ left: '64%', '--r': '8deg', '--d': '.45s' })}>
                <PeekPaper w={160} h={120} />
              </span>
              <div className="lp-card lp-caught">
                <span style={{ width: 48, height: 1, background: 'var(--ink)' }} />
                <span style={{ fontSize: 30, fontStyle: 'italic' }}>That’s today’s edition.</span>
                <span className="lp-sans" style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--muted)' }}>You’re all caught up. The next edition arrives at 6:00 AM.</span>
              </div>
            </div>
          </div>
        </section>

        <section id="questions" className={`lp-wrap lp-sec lp-fade${hidden('questions')}`}>
          <SectionHead n="05" title="Questions" aside="Plain answers" />
          <div className="lp-cols">
            <div className="lp-col-text">
              <h2 className="lp-h2">Before you<br /><i style={{ color: 'var(--accent)' }}>start.</i></h2>
            </div>
            <div className="lp-col-card" style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--ink)' }}>
              {FAQS.map((f, i) => (
                <div key={f.q} style={{ borderBottom: '1px solid var(--rule)' }}>
                  <button type="button" aria-expanded={faq === i} onClick={() => setFaq(faq === i ? -1 : i)} className="lp-faq">
                    {f.q}
                    <span className="lp-sans" style={{ fontSize: 20, color: 'var(--accent)' }}>{faq === i ? '−' : '+'}</span>
                  </button>
                  {faq === i ? <p className="lp-rise lp-sans lp-answer">{f.a}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="start" className={`lp-wrap lp-sec lp-fade${hidden('start')}`} style={{ paddingBottom: 112 }}>
          <SectionHead n="06" title="Start" aside="About two minutes" accent />
          <div className="lp-start">
            <div style={{ flex: '1 1 440px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 32 }}>
              <h2 className="lp-h2 lp-h2-big">Start your<br /><i style={{ color: 'var(--accent)' }}>first edition.</i></h2>
              <p className="lp-sans" style={{ margin: 0, maxWidth: 500, fontSize: 18, lineHeight: 1.6, color: 'var(--body)' }}>Languages, topics, places, sources. Pick them once and your front page is ready.</p>
              <img src={`/lp/stamp-free-${mode}.svg`} alt="Stamp: Free for everyone, always. No ads, no paywall. ₹0." style={{ width: 136, height: 136, margin: '-8px 0 0 -6px' }} />
            </div>
            <div className="lp-start-btns lp-sans">
              <a href="/home" onClick={readOnWeb} className="lp-cta lp-ghost lp-big lp-big-outline">
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="lp-ico" style={{ strokeWidth: 1.6 }}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z" />
                </svg>
                <span style={{ flex: 1 }}>Read on the web <span style={{ fontWeight: 400, color: 'var(--body)' }}>(no install)</span></span>
                <span aria-hidden="true">→</span>
              </a>
              <a href="/onboarding" onClick={go('/onboarding')} className="lp-cta lp-big lp-big-solid">
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="lp-ico" style={{ strokeWidth: 1.6 }}>
                  <path d="M4 5h16v14H4zM4 9h16M9 9v10" />
                </svg>
                <span style={{ flex: 1 }}>Set up my edition</span>
                <span aria-hidden="true">→</span>
              </a>
              <a
                href="#install-iphone"
                onClick={(e) => {
                  e.preventDefault();
                  installGuide.open('landing');
                }}
                className="lp-cta lp-big lp-big-solid">
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="lp-ico" style={{ strokeWidth: 1.6 }}>
                  <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
                  <path d="M10.5 5h3M11 18.5h2" />
                </svg>
                <span style={{ flex: 1 }}>Add to iPhone</span>
                <span aria-hidden="true">→</span>
              </a>
              <span className="lp-big lp-big-solid" aria-disabled="true" style={{ opacity: 0.55 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="lp-ico" style={{ strokeWidth: 1.6 }}>
                  <path d="M5 17.5V11a7 7 0 0 1 14 0v6.5z" />
                  <path d="M7.5 5.5L6 3.5M16.5 5.5L18 3.5" />
                  <path d="M8.5 17.5V21M15.5 17.5V21" />
                </svg>
                <span style={{ flex: 1 }}>Android app · coming soon</span>
              </span>

              <div className="lp-notes">
                <p className="lp-label" style={{ margin: 0, fontSize: 12, letterSpacing: 0.9, color: 'var(--muted)', lineHeight: 1.55 }}>No account, no store, installs in seconds.</p>
                <p id="install-iphone" style={{ margin: 0 }}><strong style={{ fontWeight: 500 }}>iPhone:</strong> Open this page in Safari, tap Share, then Add to Home Screen.</p>
                <p style={{ margin: 0 }}><strong style={{ fontWeight: 500 }}>Android:</strong> The app is on its way. Until then, read on the web or add this page to your home screen from Chrome’s menu.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-row">
          <div style={{ flex: '1 1 300px', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <img src={`/lp/stamp-brand-${mode}.svg`} alt="Stamp: Every story, as it was written. Un:edited, 2026." style={{ width: 104, height: 104, margin: '0 0 4px -4px' }} />
            <Wordmark size={34} label="Un:edited, back to top" />
            <p style={{ margin: 0, fontSize: 19, lineHeight: 1.5 }}>Every story, as it was written.</p>
            <p className="lp-sans" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--muted)' }}>An independent news reader with no AI rewrites, no ranking algorithm and no ads. Designed and built by one person.</p>
          </div>
          <nav aria-label="Footer" className="lp-footer-nav lp-sans">
            <div>
              <span className="lp-label lp-footer-h">Read</span>
              <a href="/onboarding" onClick={go('/onboarding')} className="lp-out">Start reading</a>
              <a href="/home" onClick={readOnWeb} className="lp-out">Read on the web</a>
              <a href="#start" className="lp-out">Get the app</a>
            </div>
            <div>
              <span className="lp-label lp-footer-h">About</span>
              <a href="#idea" className="lp-out">How it works</a>
              <a href="#sources" className="lp-out">Sources</a>
              <a href="#questions" className="lp-out">Questions</a>
            </div>
            <div>
              <span className="lp-label lp-footer-h">Maker</span>
              <span className="lp-footer-item">Ashmit</span>
              <a href="https://github.com/ashmit27j/un-edited" target="_blank" rel="noreferrer" className="lp-out">Source code ↗</a>
              <a href={`mailto:${CONTACT}`} className="lp-out" style={{ overflowWrap: 'anywhere' }}>{CONTACT}</a>
            </div>
          </nav>
        </div>
        <div className="lp-wrap lp-footer-base lp-sans">
          <span>© 2026 Un:edited · Free for everyone, always.</span>
          <span style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span lang="en">English</span>·<span lang="hi">हिंदी</span>·<span lang="mr">मराठी</span>
          </span>
          <span style={{ flexBasis: '100%', fontSize: 12 }}>Headlines and outlets shown on this page are examples. Every article in the app belongs to its publisher.</span>
        </div>
      </footer>
    </div>
  );
}

const STAMP_EDGE =
  'M78.00 4.80Q84.85 -0.30 90.71 5.91Q98.34 2.08 103.04 9.21Q111.22 6.76 114.60 14.61Q123.08 13.61 125.05 21.93Q133.58 22.42 134.07 30.95Q142.39 32.92 141.39 41.40Q149.24 44.78 146.79 52.96Q153.92 57.66 150.09 65.29Q156.30 71.15 151.20 78.00Q156.30 84.85 150.09 90.71Q153.92 98.34 146.79 103.04Q149.24 111.22 141.39 114.60Q142.39 123.08 134.07 125.05Q133.58 133.58 125.05 134.07Q123.08 142.39 114.60 141.39Q111.22 149.24 103.04 146.79Q98.34 153.92 90.71 150.09Q84.85 156.30 78.00 151.20Q71.15 156.30 65.29 150.09Q57.66 153.92 52.96 146.79Q44.78 149.24 41.40 141.39Q32.92 142.39 30.95 134.07Q22.42 133.58 21.93 125.05Q13.61 123.08 14.61 114.60Q6.76 111.22 9.21 103.04Q2.08 98.34 5.91 90.71Q-0.30 84.85 4.80 78.00Q-0.30 71.15 5.91 65.29Q2.08 57.66 9.21 52.96Q6.76 44.78 14.61 41.40Q13.61 32.92 21.93 30.95Q22.42 22.42 30.95 21.93Q32.92 13.61 41.40 14.61Q44.78 6.76 52.96 9.21Q57.66 2.08 65.29 5.91Q71.15 -0.30 78.00 4.80Z';

// Motion: design/motion/MOTION.md §9. Timings, easing and reduced-motion rules are copied from Landing.dc.html.
const CSS = `
.lp-root{position:absolute;inset:0;overflow-x:hidden;overflow-y:auto;scroll-behavior:smooth;background:var(--bg);color:var(--ink);
  font-family:'Baskervville',Baskerville,'Libre Baskerville',Georgia,serif;-webkit-font-smoothing:antialiased;
  scrollbar-width:thin;scrollbar-color:rgba(122,112,98,.45) transparent}
.lp-root::-webkit-scrollbar{width:10px;background:transparent}
.lp-root::-webkit-scrollbar-thumb{background:rgba(122,112,98,.38);border-radius:10px;border:3px solid transparent;background-clip:padding-box}
.lp-root::-webkit-scrollbar-thumb:hover{background:rgba(168,55,42,.7);border:3px solid transparent;background-clip:padding-box}
.lp-root a{color:inherit;text-decoration:none}
.lp-root button{font:inherit}
.lp-root section[id]{scroll-margin-top:8px}
.lp-sans{font-family:'Inter',system-ui,sans-serif}
.lp-label{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase}
.lp-ico{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
.lp-wrap{max-width:1200px;margin:0 auto;padding-left:32px;padding-right:32px;box-sizing:border-box}

.lp-header{border-bottom:1px solid var(--rule)}
.lp-header-row{min-height:72px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 32px}
.lp-header-right{display:flex;align-items:center;gap:8px 20px;flex-wrap:wrap}
.lp-nav{display:flex;flex-wrap:wrap;gap:0 28px;font-family:'Inter',system-ui,sans-serif;font-size:14.5px}
.lp-nav a{height:44px;display:flex;align-items:center}
.lp-theme{width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;background:none;border:1px solid var(--rule);border-radius:50%;color:var(--ink);cursor:pointer;transition:border-color .2s ease,color .2s ease}
.lp-theme:hover{border-color:var(--ink);color:var(--accent)}
.lp-theme:focus-visible,.lp-root a:focus-visible,.lp-root button:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.lp-theme svg{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.lp-mark{font-weight:700;letter-spacing:-.4px;display:flex;align-items:center;line-height:1}
.lp-colon{display:inline-flex;flex-direction:column;gap:5px;margin:0 3px;padding-top:3px}
.lp-colon span{width:5px;height:5px;border-radius:50%;background:var(--accent)}

.lp-head{display:flex;align-items:center;gap:16px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--muted)}
.lp-num{padding:4px 8px;background:var(--ink);color:var(--bg)}
.lp-line{flex:1;height:1px;background:var(--rule)}
.lp-hero{padding-top:28px;position:relative}
.lp-hero-row{margin-top:56px;display:flex;flex-wrap:wrap;align-items:center;gap:56px 64px}
.lp-hero-text{flex:999 1 540px;min-width:0;display:flex;flex-direction:column;gap:28px}
.lp-h1{margin:0;font-weight:500;font-size:clamp(52px,7.4vw,104px);line-height:1.02;letter-spacing:-2px}
.lp-typed{display:inline-flex;align-items:baseline;white-space:nowrap}
.lp-hero-p{margin:0;max-width:560px;font-size:22px;line-height:1.55;color:var(--muted)}
.lp-btns{display:flex;flex-wrap:wrap;gap:12px}
.lp-hero-btn{height:58px;box-sizing:border-box;padding:0 30px;display:inline-flex;align-items:center;gap:12px;font-family:'Inter',system-ui,sans-serif;font-size:16px;font-weight:500}
.lp-solid{background:var(--ink);color:var(--bg)!important}
.lp-outline{border:1px solid var(--ink)}
.lp-phone-col{flex:1 1 320px;display:flex;justify-content:center;position:relative}
.lp-px-deep{position:absolute;left:50%;top:50%;width:0;height:0;z-index:0;color:var(--line)}
.lp-sheet svg{display:block;overflow:visible;fill:none;stroke:currentColor;stroke-width:1.2;stroke-linecap:round}
.lp-px-phone{position:relative;z-index:1}
.lp-phone-frame{width:336px;height:712px;box-sizing:border-box;padding:12px;border:1px solid var(--ink);border-radius:40px;background:var(--surface)}
.lp-phone-screen{width:312px;height:688px;overflow:hidden;border-radius:30px;border:1px solid var(--rule);box-sizing:border-box;pointer-events:none;position:relative}
.lp-phone-inner{width:390px;height:860px;transform:scale(.8);transform-origin:0 0;position:relative;overflow:hidden;background:var(--bg)}
.lp-phone-tabs{position:absolute;left:0;right:0;bottom:0;height:92px;box-sizing:border-box;padding:6px 12px 24px;background:var(--bg);border-top:1px solid var(--rule);display:grid;grid-template-columns:repeat(4,minmax(0,1fr));font-family:'Inter',system-ui,sans-serif;font-size:11px}
.lp-phone-tabs>span{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px}
.lp-tap{color:var(--accent)}
.lp-hero-stamp{position:absolute;top:-44px;right:-74px;width:156px;height:156px;z-index:2;pointer-events:none;display:block}
.lp-hero-stamp svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.lp-hero-stamp path{fill:var(--bg);stroke:var(--accent);stroke-width:1px;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.lp-hero-stamp img{position:absolute;inset:9px;width:calc(100% - 18px);height:calc(100% - 18px)}

.lp-marquee{--lp-acc:var(--accent);margin-top:72px;overflow:hidden;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule)}
.lp-marquee-item{padding:18px 28px;display:flex;align-items:center;gap:28px}
.lp-marquee-item .lp-out{font-size:26px;white-space:nowrap}
.lp-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}

.lp-sec{padding-top:128px}
.lp-cols{margin-top:40px;display:flex;flex-wrap:wrap;gap:40px 64px;align-items:flex-start}
.lp-col-text{flex:1 1 420px;min-width:0;display:flex;flex-direction:column;gap:22px}
.lp-col-card{flex:1 1 480px;min-width:0}
.lp-card{background:var(--surface);border:1px solid var(--rule);box-sizing:border-box}
.lp-h2{margin:0;font-weight:500;font-size:clamp(40px,5vw,68px);line-height:1.02;letter-spacing:-1.2px}
.lp-h2-big{font-size:clamp(44px,6vw,84px);line-height:1;letter-spacing:-1.6px}
.lp-lead{margin:0;font-size:20px;line-height:1.6;color:var(--muted)}
.lp-tabs{margin-top:14px;display:flex;flex-wrap:wrap;gap:0 24px;border-bottom:1px solid var(--rule);font-family:'Inter',system-ui,sans-serif;font-size:14.5px}
.lp-tabs button{transition:color .8s ease,border-color .8s ease;height:46px;padding:0;margin-bottom:-1px;background:none;border:0;border-bottom:2px solid transparent;cursor:pointer;font-family:inherit}
.lp-paper{padding:20px 0;border-bottom:1px solid var(--rule);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:20px}
.lp-caught{position:relative;padding:32px 28px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px}
.lp-peek svg{display:block;fill:none;stroke:var(--line);stroke-width:1.1;stroke-linecap:round}
.lp-faq{width:100%;min-height:64px;padding:16px 0;display:flex;align-items:center;justify-content:space-between;gap:16px;background:none;border:0;color:var(--ink);text-align:left;cursor:pointer;font-family:'Baskervville',Baskerville,Georgia,serif!important;font-size:22px;line-height:1.3}
.lp-answer{margin:0 0 20px;font-size:16px;line-height:1.6;color:var(--muted)}
.lp-start{margin-top:40px;box-sizing:border-box;background:var(--surface);border:1px solid var(--rule);border-top:3px solid var(--accent);padding:clamp(32px,5vw,64px) clamp(24px,6vw,72px);display:flex;flex-wrap:wrap;gap:40px 72px;align-items:center;justify-content:space-between}
.lp-start-btns{flex:1 1 320px;max-width:400px;min-width:min(100%,280px);display:flex;flex-direction:column;gap:12px}
.lp-big{min-height:60px;padding:0 22px;box-sizing:border-box;display:flex;align-items:center;gap:14px;font-size:16px;font-weight:500}
.lp-big-outline{border:1.5px solid var(--ink)}
.lp-big-solid{background:var(--ink);color:var(--bg)!important}
.lp-notes{margin-top:14px;padding-top:18px;border-top:1px solid var(--rule);display:flex;flex-direction:column;gap:14px;font-size:16px;line-height:1.55}
.lp-footer{border-top:2px solid var(--ink);margin-top:24px}
.lp-footer-row{padding-top:56px;display:flex;flex-wrap:wrap;gap:48px 64px;justify-content:space-between}
.lp-footer-nav{flex:2 1 520px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:32px;font-size:14px}
.lp-footer-nav>div{display:flex;flex-direction:column}
.lp-footer-nav a,.lp-footer-item{min-height:36px;display:flex;align-items:center}
.lp-footer-h{margin-bottom:6px;color:var(--muted)}
.lp-footer-base{margin-top:48px;padding-top:18px;padding-bottom:32px;border-top:1px solid var(--rule);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 24px;font-size:13px;color:var(--muted)}

@keyframes lp-wipe{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 -2% 0 0)}}
@keyframes lp-rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes lp-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes lp-fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.lp-wipe{display:inline-block;animation:lp-wipe 1.1s cubic-bezier(.65,0,.35,1) both}
.lp-rise{animation:lp-rise .8s cubic-bezier(.2,.7,.2,1) both}
.lp-d1{animation-delay:.15s}.lp-d2{animation-delay:.55s}.lp-d3{animation-delay:.9s}.lp-d4{animation-delay:1.2s}
.lp-track{display:flex;width:max-content;animation:lp-marquee 60s linear infinite}
.lp-track:hover{animation-play-state:paused}
.lp-out{transition:color .2s ease}
.lp-out:hover,.lp-out:focus-visible{color:var(--accent);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:7px}
.lp-swap{animation:lp-fadein 1.4s cubic-bezier(.25,.6,.3,1) both}
.lp-cta{transition:transform .2s ease,background-color .2s ease}
.lp-cta:hover{transform:translateY(-2px)}
.lp-ghost:hover{background-color:color-mix(in srgb,currentColor 8%,transparent)}
.lp-fade{transition:opacity 1s cubic-bezier(.2,.7,.2,1),transform 1s cubic-bezier(.2,.7,.2,1)}
.lp-hide{opacity:0;transform:translateY(44px)}
.lp-peek{position:absolute;bottom:calc(100% - 28px);opacity:0;transform:translateY(90px) rotate(0deg);transition:transform 1.2s cubic-bezier(.16,.8,.24,1),opacity .5s ease;transition-delay:var(--d)}
.lp-peek-on .lp-peek{opacity:1;transform:translateY(0) rotate(var(--r))}
@keyframes lp-unfold{from{opacity:0;transform:translate(-50%,-50%) rotate(0deg) scale(.55)}to{opacity:1;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) rotate(var(--r)) scale(1)}}
@keyframes lp-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
.lp-sheet{position:absolute;left:0;top:0;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) rotate(var(--r));animation:lp-unfold 1.6s cubic-bezier(.16,.8,.24,1) both;animation-delay:var(--d)}
.lp-sheet path,.lp-sheet rect,.lp-sheet circle{stroke-dasharray:1;animation:lp-draw 1.8s cubic-bezier(.45,0,.25,1) both;animation-delay:calc(var(--d) + .3s)}
@keyframes lp-scroll{0%,14%{transform:translateY(0)}86%,100%{transform:translateY(var(--to))}}
@keyframes lp-screen{from{opacity:0}to{opacity:1}}
@keyframes lp-tap{0%{opacity:.9;transform:translate(-50%,-50%) scale(.35)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}
.lp-screen{position:absolute;inset:0;animation:lp-screen .45s ease both}
.lp-scrolling{animation:lp-scroll var(--dur) cubic-bezier(.45,0,.25,1) both}
.lp-tap{position:absolute;width:56px;height:56px;border-radius:50%;border:2px solid currentColor;animation:lp-tap .65s ease-out both}
@supports (animation-timeline: scroll()){
  .lp-px-text{animation:lp-px-text linear both;animation-timeline:scroll(nearest);animation-range:0 100vh}
  .lp-px-phone{animation:lp-px-phone linear both;animation-timeline:scroll(nearest);animation-range:0 100vh}
  .lp-px-deep{animation:lp-px-deep linear both;animation-timeline:scroll(nearest);animation-range:0 100vh}
}
@keyframes lp-px-text{to{transform:translateY(90px);opacity:.35}}
@keyframes lp-px-phone{to{transform:translateY(-70px)}}
@keyframes lp-px-deep{to{transform:translateY(160px) scale(1.06)}}
@keyframes lp-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
.lp-caret{display:inline-block;width:.06em;height:.82em;margin-left:.06em;vertical-align:-.04em;background:currentColor;animation:lp-blink 1.05s steps(1) infinite}
.lp-caret-off{animation:none;opacity:0;transition:opacity .8s ease}
@keyframes lp-stamp-in{0%{opacity:0;transform:scale(1.35) rotate(-6deg)}60%{opacity:1;transform:scale(.97)}100%{opacity:1;transform:none}}
.lp-hero-stamp{animation:lp-stamp-in .45s cubic-bezier(.3,.7,.3,1) 1.9s both}

@media (max-width:720px){
  .lp-wrap{padding-left:16px;padding-right:16px}
  .lp-aside{display:none}
  .lp-hero{padding-top:18px}
  .lp-hero-row{margin-top:24px;gap:28px}
  .lp-hero-text{gap:18px}
  .lp-hero-p{font-size:18px;line-height:1.5}
  .lp-hero-btn{height:52px;padding:0 18px;font-size:15px}
  .lp-phone-frame{transform:scale(.9);transform-origin:top center;margin-bottom:-72px}
  .lp-deep-scale{transform:scale(.68)}
  .lp-hero-stamp{width:108px;height:108px;right:4px;top:-16px}
  .lp-col-text,.lp-col-card{flex-basis:100%}
  .lp-sec{padding-top:96px}
  .lp-paper{grid-template-columns:minmax(0,1fr)}
}

@media (prefers-reduced-motion: reduce){
  .lp-root{scroll-behavior:auto}
  .lp-caret,.lp-hero-stamp,.lp-wipe,.lp-rise,.lp-track,.lp-swap,.lp-sheet,.lp-sheet path,.lp-sheet rect,.lp-sheet circle,.lp-scrolling,.lp-screen,.lp-tap,.lp-px-text,.lp-px-phone,.lp-px-deep{animation:none}
  .lp-sheet path,.lp-sheet rect,.lp-sheet circle{stroke-dasharray:none}
  .lp-fade,.lp-hide{transition:none;opacity:1;transform:none}
  .lp-peek{transition:none}
  .lp-cta,.lp-cta:hover{transition:none;transform:none}
}

/* Desktop cursors (MOTION.md §10): ink pointer everywhere, normal pointer on links and buttons. */
@media (hover: hover) and (pointer: fine){
  :root[data-theme="paper"] .lp-root,:root[data-theme="paper"] .lp-root *{cursor:url(/lp/cursor-pointer-paper.svg) 4 3, default}
  :root[data-theme="ink"] .lp-root,:root[data-theme="ink"] .lp-root *{cursor:url(/lp/cursor-pointer-ink.svg) 4 3, default}
  .lp-root a,.lp-root a *,.lp-root button,.lp-root button *,.lp-root [role=tab]{cursor:pointer!important}
}

[lang="hi"],[lang="mr"]{letter-spacing:0!important;text-transform:none!important;font-style:normal}
[lang="hi"]{font-family:'Tiro Devanagari Hindi','Mukta',serif!important}
[lang="mr"]{font-family:'Tiro Devanagari Marathi','Mukta',serif!important}
`;
