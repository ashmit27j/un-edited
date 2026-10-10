# Un:edited — current configuration

_Merged from the design doc (passes 1–5, 2026-10-08) and the planning decisions log (2026-10-07). Written 2026-10-09. Updated 2026-10-09 with the downloads, Save, language, accessibility, notifications and edition-number changes (see `changelog.md`)._

**This is a snapshot of where things stand, not a spec.** Every line is Ashmit's to change. Each item carries a status:

- **current** — what the design and plans use today. Change it whenever you like; just update this file and `changelog.md`.
- **proposed** — suggested in planning, never confirmed.
- **open** — no answer yet.

When this file and the screen files disagree, ask Ashmit which one is right. Don't assume.

---

## 1. Product

| Topic | Setting | Status |
|---|---|---|
| What it is | A news reader that shows stories exactly as publishers wrote them, from outlets the reader picks. Newspaper feel. | current |
| Name | **Un:edited** (was "Un:editd" until 2026-10-07). The colon is two accent dots. | current |
| Motto | "Every story, as it was written." | current |
| One-liners | No AI — every word comes from the publisher. · No algorithm — only the outlets you choose. · No fee — free for everyone, always. | current |
| AI | Nothing the reader sees is written or rewritten by AI. AI behind the scenes (e.g. story grouping) is allowed if needed. | current |
| Price | Free for readers. Solo builder; keep paid services to a minimum. | current |
| Platforms | Android, iPhone, web — same features everywhere. | current |
| Distribution | Android: APK. Web: PWA. iPhone: the installable website (no App Store, no Apple developer fee). | current |
| Languages at launch | English, Hindi, Marathi — interface and source lists. Three separate settings in You › Language: app language, source languages (at least one on), and the Hindi / Marathi reading font (Match Font · Serif · Sans). | current |
| Handles / domain | For now the Vercel address, https://unedited-six.vercel.app (Ashmit, 2026-10-10; a custom domain later). Handles not chosen; old handle was `uneditd`. | current (domain) · open (handles) |
| Funding story (for landing page) | No paid version, no payments, no subscriptions, no ads, ever (Ashmit, 2026-10-10). Landing FAQ: "It doesn't need to. There is no paid version, no subscription and no ads, and there won't be. It is built by one person and runs on free and low-cost services." | current |
| Contact email | ashmit27j@gmail.com (landing footer). | current |

## 2. Brand

| Topic | Setting | Status |
|---|---|---|
| Wordmark | "Un" + two-dot colon in accent, "edited" in ink. Baskerville Bold. | current |
| App icon | "Un" in Baskerville Bold, cropped at the right edge. Ink: coral #C8705F on #1C1A17. Paper: oxblood #A8372A on #F8F3EA with a thin rule border. | current |
| Voice | Plain, calm newspaper voice. Sentence case for buttons/links. Fictional outlets only in mockups. | current |
| Stamps | Round rubber-stamp marks (double ring, JetBrains Mono Bold ring text, Baskervville centre mark, slight tilt, ink texture, text outlined in SVG). Paper (oxblood) and Ink (coral), plain and "capped". Max one per screen. Never say "verified" or "fact-checked". | current |

**Stamp set (current):**

| Stamp | Ring text | Centre | Where |
|---|---|---|---|
| Brand | EVERY STORY · AS IT WAS WRITTEN · UN:EDITED · 2026 | Un: | Landing hero + footer, sign-in (stamp-down), end of tour |
| As published | AS PUBLISHED · WORD FOR WORD · NOT REWRITTEN | ¶ | Article image edge; web article right margin (hidden < 1080px) |
| Free | FREE FOR EVERYONE · ALWAYS · NO ADS · NO PAYWALL | ₹0 | Landing "Start" section |
| Read more (cursor) | READ MORE · READ MORE | ↗ | Web desktop: cursor over anything that opens a story |

Ideas, not made: Morning Edition stamp (`MORNING EDITION · PRINTED 6:00 IST`, "Nº 14"), All caught up stamp (`NEWS THAT ENDS · SEE YOU AT SIX`).

## 3. Design tokens (current)

| Token | Paper (light) | Ink (dark, low contrast) |
|---|---|---|
| bg | #F1EBE0 | #1E1C19 |
| surface | #F8F3EA | #262320 |
| ink | #1C1A17 | #C9C0B0 |
| muted | #6B645A | #8E8678 |
| rule | #DDD4C4 | #38332D |
| accent | #A8372A | #C8705F |
| accent-soft | #EBD5CC | #3A2924 |
| photo placeholder | #DCD2C1 | #2D2924 |

- **Fonts:** Baskervville (serif: headlines, body, wordmark; italic cuts loaded for italic accents) — stack `'Baskervville', Baskerville, 'Libre Baskerville', Georgia, serif`. Inter (UI, buttons, meta). JetBrains Mono (uppercase labels). Tiro Devanagari Hindi / Marathi (serif) + Mukta (sans) for Devanagari. Every screen loads them, and a `lang="hi"` / `lang="mr"` rule in each `<helmet>` switches text to them (Mukta when `data-dv="sans"`), with letter-spacing and uppercase turned off for Devanagari. Set `lang` on all Hindi / Marathi text. Atkinson Hyperlegible loads on the accessibility board for the dyslexia-friendly option.
- **Reader font option:** Serif / Sans (the `type` tweak on boards).
- **Type rules:** mono labels ≥ 11px; Inter meta ≥ 12px; body serif 16.5–18px at 1.55–1.6; mobile display 30px; weights are **400 regular and 500 medium only** (700 for the wordmark only; Inter 600 was removed 2026-10-09 so active tabs, toggles and buttons use 500, and Tiro Devanagari only exists in one weight); max one italic accent phrase per heading; numbered lists use the reading font; sentence case.
- **Shape:** square corners (sheets: 14px top radius; chips over images: round); thin rules, no shadows; 24px phone margin; 44px touch targets.
- **Scrollbars:** hidden on mobile; thin thumb-only on web.
- **Motion:** every animation has a reduced-motion fallback. Exact timings for every animation are in `design/motion/MOTION.md` (filmstrips alongside).
- **Theme default:** Paper (light). Readers can pick Ink or System; the website has a light/dark toggle in the header / top nav.

## 4. Structure and screens

**Navigation (current):** 4 tabs — Home · Feed · Library · You. Bottom on mobile, top on web. Active tab in accent.

| Area | Current behaviour | Status |
|---|---|---|
| Home | Newspaper front page: lead story, most-covered, a block per topic, Trending (opt-in), Papers & Reports, Continue reading, Outside your sources. Every section header has "See more". Search icon opens Search. The strip under the wordmark reads "Morning Edition Nº N" (see below). `HomeHindi` and `HomeMarathi` show the same page in Devanagari (`language` tweak on `Main`). | current |
| Edition number | Signed-in readers: their first-ever edition is **Nº 1**, and it goes up by 1 each time a new edition publishes (06:00 IST), counted from their first edition. It counts editions published, not days opened. Guests see "Morning Edition" with no number. (Replaces the fixed Nº 279.) | current |
| Home view | Comfortable (images) / Focused (text-led). Picked in onboarding, changeable in You › Reading. | current |
| Feed | "My Feed / Explore" toggle, category tabs (swipe left/right between sections), one story per screen with fade-out text, "You're all caught up" sheet at the end. | current |
| Per-story actions | Byline row: **Save, then ⋯**, as two separate icons everywhere. Save is never inside ⋯. Home lead story, Feed, Library, History, Search and the web cards all follow this. | current |
| ⋯ menu | **Download** (becomes **Remove download** once downloaded) · Share link · More about [topic] · Not interested · Report a problem (opens a form: broken link, wrong image/credit, wrong grouping, other). "Save to folder" was removed because Save is its own icon. | current |
| Article | Full screen, no tab bar. Image with Back (left) and vertical ⋯ (right); As published stamp; headline; text; "Continue on [source]"; Primary source block; Related stories. Bottom bar: previous/next source + Save. No source tabs. `Article-ptmb` (the "Article by" experiment) now has the same layout: ⋯ top-right on the image, Save in the bottom bar. | current |
| Saving | One tap on the Save icon saves instantly to the default "Saved" folder and shows a toast: "Saved · Change folder" (opens the "Save to" sheet). Tapping a filled bookmark removes it, with "Removed from Saved · Undo". The toast hides after about 4 seconds. Saved = filled accent bookmark. No Like. **Saving never downloads.** | current |
| Downloads | Downloading is its own action: ⋯ › Download on a story, or Download / Remove on a folder. You › Storage has **Auto-download saved articles** (off by default): on = every new save downloads; off = nothing new downloads by itself and everything already downloaded stays. **Clear all downloads** (with a confirm step) sits below it. Library shows a "N downloaded" badge on folders. | current |
| Library | Folders ("Saved" + user folders, New folder); Recently viewed (last 5). In-app articles only. | current |
| Search | Field with X to close; Your sources / All sources. | current |
| You | Reading (font, size, theme, home view, Accessibility) · Your news · **Language** · **Notifications** · Front page · Storage · About (Replay the tour). | current |
| Language | You › Language: app language (English / हिंदी / मराठी), source language toggles (at least one stays on), and Hindi / Marathi reading font (Match Font · Serif Tiro Devanagari · Sans Mukta) with a live preview. | current |
| Notifications | You › Notifications (board `Notifications`, combined 10-09 + Pass 6): "Allow notifications" master switch (off state: "Notifications are off. Your edition is still printed at 6:00"). **New edition:** "Tell me when my edition is ready" (one a day; 6:00 earliest, 6:30–9:00 later; days of the week). **Sound and quiet hours:** sound, vibration, quiet hours 10 PM–7 AM (held until they end). **During the day:** Big stories (off by default; covered by ≥5 of your sources or 60%, whichever is lower, within 6h; once per story), Papers & Reports (Sunday note), Downloads finished. **Topic and source alerts** (off; only ticked topics/outlets). Big story + topic + source alerts share a cap of 1 / 3 / 5 a day; the edition and Downloads finished don't count. Text is plain ("Morning Edition Nº 12 is ready"), no headline in the edition notification. Permission asked once, on day 2, above the edition strip, never in onboarding. Guests: edition only, stored on the device. Taps: edition → Home, Big story → Article, download → folder. iPhone: only once on the Home Screen (iOS 16.4+). | current |
| Accessibility | (Easy-read / Atkinson stays a separate switch, not a third reading font — Ashmit, 2026-10-09.) Own screen with a live preview, in separate sections. **Text:** size S–XXL, line spacing, match phone size. **Colour vision:** Standard / Red-green friendly (blue accent) / Black and white only, plus "Don't rely on colour alone" and "Underline links" (Standard already suits blue-yellow colour blindness, since the app uses no blue, green or yellow; stamps keep their print colour). **Low vision:** higher contrast, bolder text, stronger focus outline. **Reading and focus:** dyslexia-friendly font (Atkinson Hyperlegible), reading line, letter and word spacing. **Touch and movement:** larger touch targets, buttons instead of swiping. **Motion:** reduce motion. **Screen readers:** read image credits aloud, plus a VoiceOver / TalkBack note. Web has the same groups in You. | current |
| Guests | Can read without an account. Save and folders need sign-in: the Save icon opens the guest prompt with "Sign in" (`guest` tweak on Feed and Article; `signedIn` off on Home). Guests see no edition number. | current |
| Loading / offline | Calm skeletons; offline screen pointing to saved articles. | current |

**Onboarding (current):** Welcome (animated wordmark, motto, one-liners) → 1 Language → 2 Reading (theme, font, home view, live preview) → 3 Topics (18 chips, min 1) → 4 Regions → 5 Sources "Choose who you trust" (min 3) → 6 Front page sections → "Getting your edition ready" → Sign in (Google / email / Not now) → first-run Tour. Steps have Back, "Step N of 6", Skip. Disabled buttons only where a minimum applies, with a line saying what's missing.

**Tour (current):** 8 steps + done — edition strip → lead story → Search → tab bar → Feed swipe → My Feed / Explore → Library → You → "You're all set" with stamp. Spotlight + scrim, hint card with accent top rule, Skip on every step, Back/Next, progress dashes.

**Web tour (current, 2026-10-10):** the same tour on web (768px+), same motion: tab bar → the top nav ("Four places, always at the top."), Feed swipe → "Pick a section." over the Feed's section list; Search, Library and You point at the nav. 400px card beside or below the target, page scroll locked while it runs, Esc skips. Shown once after setup; web You › About › Replay the tour. No design board; built from the phone Tour board.

**iPhone install guide (current, 2026-10-10):** four swipeable cards in a sheet (Share → Add to Home Screen → Add → open from the Home Screen), drawn as simple screen illustrations, Back / Next, progress dashes, "Got it" at the end. Shows once by itself in Safari on an iPhone or iPad (not already installed), the first time the reader reaches a tab screen after setup and sign-in; the tour waits for it. The landing page's "Add to iPhone" opens it any time, ending in "Set up my edition" (or "Go to my edition" once set up). Closing it counts as seen. Last card explains that iPhone keeps Home Screen apps apart from Safari (guests set up once more there; signed-in readers sign in). Opened from the Home Screen while signed out, the app goes to onboarding, not the landing page. No motion of its own (native snap scrolling; buttons jump with reduced motion). No design board.

**Web (current):** fluid, 1200px max, top nav. Home, Article, Feed, Library, You, Search, plus a first-visit Library sync hint. Desktop-only custom cursors (ink pointer; Read more stamp over story links).

**Landing page (current):** Hero → stats → 01 The idea → 02 Your sources → 03 Papers & reports → 04 Your day → 05 Questions → 06 Start → footer. Funding answer and contact email filled in the app's landing (2026-10-10); store links still placeholders (Android "coming soon").

## 5. Content and backend

| Topic | Setting | Status |
|---|---|---|
| Sources | Starting list of 24 real outlets with verified RSS (`supabase/migrations/*_sources.sql`); fallbacks NewsData.io → NewsAPI.org → GNews. Owners/funding partly "Not yet listed". | proposed (needs review) |
| Story grouping v1 | No AI: Postgres full-text similarity on headline + excerpt; match needs ≥ 2 shared strong words (names, places, numbers); 36-hour window; alias list; same language only; lean towards not merging. | proposed |
| Grouping upgrade | Small open-source model on own server (cross-language), only if v1 testing falls short. No hosted AI APIs. | proposed |
| Refresh | Fetch every 30 min with conditional requests. Home = Morning Edition built 06:00 IST, fixed for the day. Feed = live, with a "12 new stories" pill. Delete stored articles after 30 days unless saved. | proposed |
| Research | Papers & Reports as a Home block + Research category in Feed. Labels: Peer-reviewed / Preprint / Official report. Linked only when the article links them. | proposed |
| Stack: app | **Expo, one repository, one codebase.** It builds the Android APK and the web PWA. iPhone has no native build: readers install the website to the Home Screen from Safari. | current (confirmed 2026-10-09) |
| Stack: backend and hosting | Supabase (DB, auth, Edge Functions, pg_cron every 30 min); web on Vercel. Code in `supabase/`; setup steps in `docs/backend-setup.md`. | current (deployed 2026-10-09) |
| Sign-in | Google + email. No Sign in with Apple. | proposed |
| Notifications (delivery) | Web Push (browsers and installed PWA) and the Android app. Edition notification built from the 06:00 IST edition. Topic and source alerts are opt-in and reader-picked, never chosen by an algorithm. Standard system look (the OS styles them; we supply icon, title, one or two lines): Android channels per kind (Morning Edition, Big stories, Topic and source alerts, Papers & Reports) so readers manage each in system settings, monochrome status-bar icon in accent; web push uses a monochrome badge. | current |
| Android | Package `app.unedited`. EAS `preview` profile builds an APK (EAS project `@ashmit27j/unedited`; `EXPO_PUBLIC_*` vars live in EAS environments; keystore held by Expo). First build started 2026-10-10. Register as a verified developer early. | current (package) |
| iPhone install guide | Built 2026-10-10: swipeable cards, once after setup on iPhone Safari, and from the landing page's "Add to iPhone" (see §4). | current |

## 6. Build status

- Expo app started 2026-10-06 (Expo SDK 57, Expo Router, Supabase). Done: login-based routing at `/` and the web landing page.
  - `/`: signed in or guest → `/feed`; signed out on web → landing; signed out in app → `/welcome`.
  - Landing is pre-rendered in the HTML for search engines; a head script sends returning readers to `/feed`.
- **2026-10-09: fresh Expo app started at the repo root** (SDK 57, Expo Router, routes in `src/app/`), alongside `docs/` and `design/`. Checks pass (`tsc`, `expo lint`, `expo-doctor` 21/21, web export).
  - **Done:** all five font families load (Baskervville 400/500/700, Inter 400/500, JetBrains Mono 400/500, Tiro Devanagari Hindi and Marathi, Mukta 400/500); Paper and Ink tokens in `src/constants/theme.ts` with a theme provider (System / Paper / Ink, remembered on the device); `Text` variants (display, headline, body, ui, meta, label); the Un:edited wordmark; the four tabs (Home, Feed, Library, You) with the design's icons; `/` routing.
  - **Tabs:** bottom bar on phones, top nav with the wordmark on web at 768px and wider (so an iPhone or phone browser gets the bottom bar). Active tab in accent.
  - **Routing:** signed in or guest → `/feed`; signed out → `/landing` on web, `/welcome` in the app. Both are one temporary screen with a "Not now" button, which is the guest path.
  - **Web wide layouts (2026-10-09):** Feed, Library and You have their own layouts on web at 768px and wider (`src/components/wide/`), from `WebFeed`, `WebLibrary` + `WebSyncHint` and `WebYou`. Home, Article and Search adapt their single layout. Web top nav: wordmark, tabs, Search, light/dark toggle.
  - **Built 2026-10-09 (Pass 6 screens):** Tour (phones), Accessibility (all settings working), Notifications settings (Android schedules the edition reminder locally; push not built), Language with draft Hindi/Marathi interface strings (32 keys), phone You per the You board, Report a problem (Supabase `reports` table), Recently viewed, full image view, Offline, Skeleton, Places, Sign out (sheet / dialog), folder Download. See `changelog.md`.
  - **Text size:** S 15 · M 17 · L 19.5 · XL 22 · XXL 28px body, M standard. **Sans reading text × 0.88, dyslexia font × 0.9.**
  - **Web breakpoints:** < 768 phone layout; 768–1023 web nav + one 720px column; ≥ 1024 the Web boards' multi-column layouts. The document scrolls on web from 768px; nav fixed.
  - **Theme switch:** fades over 0.6s on web (View Transitions cross-fade, colour-transition fallback); instant with reduced motion and in the Android app.
  - **Screens (built 2026-10-09, on sample data):** landing (`/landing`), onboarding (`/onboarding`: welcome, 6 steps, printing), Home, Feed, Article (`/article/[id]`), Library + folder (`/folder/[name]`), Search (`/search`), You, Your news (`/manage`). Stories come from `src/data/sample.ts` (made-up outlets); there is no feed backend yet. Reader state is saved on the device in `src/store/reader-provider.tsx` (not synced to Supabase yet).
  - **Hosting:** web is on Vercel at https://unedited-six.vercel.app (project `unedited`), deployed with `npm run deploy:web`, and also built by Vercel from every push to `master` (the project is linked to the GitHub repo; `vercel.json` sets `buildCommand: node scripts/build-web.mjs` and `outputDirectory: dist`). Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` in the Vercel project's environment variables, since Git builds don't see `.env.local`. This replaces the proposed Cloudflare Pages for now. Add `https://unedited-six.vercel.app/sign-in` to Supabase redirect URLs.
  - **Sign-in (built, waiting on keys):** `src/lib/supabase.ts` + `src/session/session-provider.tsx` + `/sign-in` (from `OB9SignIn`). Email = a code sent by email, no password; Google = OAuth with PKCE (browser popup in the app, redirect on web). "Not now" = guest. With no keys the app runs guest-only and sign-in says it isn't available. Keys go in `.env.local` (see `.env.example`). Email code and Google are **untested against a real project**.
  - **Supabase keys:** `.env.local` is filled in (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY`). Google needs nothing in the app's env: its client ID and secret go only in the Supabase dashboard (see `.env.example`).
  - **Google, checked 2026-10-09:** the app side works (the button sends the browser to Supabase's authorize URL with PKCE and `redirect_to=http://localhost:8081/sign-in`). Supabase answered "provider is not enabled", so the Google provider still has to be switched on in the dashboard.
  - **Supabase dashboard setup needed:** enable the Email and Google providers; add redirect URLs `unedited://sign-in`, `http://localhost:8081/sign-in` and the production `/sign-in`; set the Magic Link email template to include the code (`{{ .Token }}`).
  - **Stamps:** all 16 SVGs are in `design/screens/assets/` and copied to `assets/stamps/` and `assets/cursors/`. `Stamp` and `StampDown` (`src/components/stamp.tsx`) render them; the sign-in screen has the edition preview card with the capped Brand stamp dropping onto it (static when the reader prefers reduced motion). On web the SVGs use React Native's `Image`, because expo-image froze the page on web. On Android they use expo-image, which has **not** been tested on a device, and Android may drop the ink texture (an SVG filter) and show a flat stamp.
  - **Landing (rebuilt 2026-10-09):** web-only HTML/CSS in `src/components/landing-page.web.tsx`, following `Landing.dc.html` and MOTION.md §9, with a light/dark toggle. Phone demo uses captures of the design boards (`public/lp/*.jpg`); re-capture them if Home, Library, You, Feed or Article change.
  - **Known issue:** tab routes (`/home`, `/you`, `/library`) log a React hydration mismatch (#418) on load in the static build. It was already there before the landing rebuild; the page still works.
  - **Not done (updated 2026-10-10):** any test on a real Android phone (first APK built 2026-10-10); Firebase (FCM) credentials for Expo push on Android; Google sign-in on Android (redirect not set up or tested); Hindi/Marathi interface beyond the 32 draft strings; API fallback keys (NewsData.io / NewsAPI.org / GNews).
  - **Vercel env vars (2026-10-10):** the three `EXPO_PUBLIC_*` values are set for **Production only**. Preview builds still have none, and the Vercel build fails without them.
  - **Known gap:** on web, text first shows in a system font until the fonts arrive; the pre-rendered landing page will need handling for search engines.
- Backend: Supabase confirmed for DB and auth (2026-10-09).
- The older code (`uneditd-app.zip`) is **not in this folder** and still uses the old name, fonts and landing layout. It was built ahead of the design.

## 7. Where the history disagrees

These came up because older planning notes and later design passes say different things. The screens follow the newer version; none of these has been formally settled.

1. **Offline saving.** ~~Planning said saved articles are kept offline automatically.~~ **Settled 2026-10-09:** saving never downloads. Download is explicit (⋯ › Download, folder Download) or automatic only if "Auto-download saved articles" is on. All copy updated.
2. **Card actions.** ~~Planning said "only ⋯ in the byline".~~ **Settled 2026-10-09:** Save and ⋯ are separate icons everywhere, Save first.
3. **Article top bar.** Planning said Save bookmark top-right on the image. Pass 5 moved Save to the bottom bar and put ⋯ top-right. → screens use ⋯ top-right (and `Article-ptmb` now matches)
4. **Source switcher.** Planning said a source switcher under the headline. Pass 5 removed source tabs; switching is prev/next in the bottom bar. → screens use bottom bar
5. **List numbers.** Planning brand note said sans serif (Inter). Pass 5 changed them to the reading font (serif when Serif is on). → screens use reading font
6. **Travel-blog reference** (headline over image with dark fade, body as overlapping sheet) — the current Article doesn't do this. Treat as an idea, not a rule.

## 8. Open items (as of 2026-10-09)

- Board titles in `canvas.json` and `index.html` still say "source switcher" for Article. Kept on purpose until Ashmit decides.
- Devanagari at 11px (mono labels) reads small; consider 12–13px for `lang="hi"` / `lang="mr"` labels.
- `data-dv` (Mukta vs Tiro follows the Serif / Sans choice) is wired on Home only; add it to the other reading screens when they get Hindi / Marathi versions.
- Accessibility settings are designed but not yet applied across the other boards (they only drive the live preview).
- Notification delivery (web push, Android) is not yet built or decided; see §5.
- Fill landing store links.
- Handles (domain stays on Vercel for now).
- Bring the Expo code up to date with the current design (name, motto, fonts, patterns). Expo as the stack is settled (2026-10-09); where the code lives and whether to reuse `uneditd-app.zip` is not.
- `Article-ptmb.dc.html` is Ashmit's experiment ("Article by" byline; its layout now matches Article). Decide whether to merge it into Article or drop it.

## 9. Future plan (not scheduled)

- **Android home-screen widgets** (Ashmit, 2026-10-10): e.g. today's Morning Edition lead and edition number, or the latest stories from the reader's sources. Not designed yet; needs a board and a native widget (Expo config plugin) when it's picked up.
