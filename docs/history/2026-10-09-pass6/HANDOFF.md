# Un:edited — design handoff for Claude Code

This package is the **current, complete design** for Un:edited, exported from the Claude Design canvas on 9 Oct 2026. It replaces whatever design files are in the repo, with one exception: **the landing page**.

## 0. Ground rules

1. **Overwrite** the repo's design folder with `design/` from this package (all screens, assets, fonts, `canvas.json`, `strings.json`). Where code and these boards disagree, the boards win.
2. **Do not touch the landing page implementation** (`/` and `/landing`). Ashmit has confirmed it is correct as built. Do not restyle, re-layout or re-copy it. The only landing-related fixes allowed are the global ones in sections 3 and 4 (page scrolling and cursors), and they must not change its look.
3. Keep the **serif** sizes exactly as they are. Change only **sans-serif** sizes (section 2).
4. Mobile (native and narrow web) is mostly right already. Most of the work is the **web layout on large screens** (section 5 and `LIVE_SITE_REVIEW.md`).

## 1. How to read the boards

- Each screen is `design/screens/<Name>.dc.html`. Serve the folder and open `index.html` for a gallery:
  `cd design/screens && python3 -m http.server 8000` → http://localhost:8000
- Boards are HTML with inline styles. **Exact px values, colours and spacing are in the markup**: read them, don't guess from screenshots.
- `{{t.xxx}}` are theme tokens. Each board's `<script type="text/x-dc">` holds the Paper/Ink token tables and state. Props in `data-props` (e.g. `dark`, `step`, `stage`, `panel`) are the states you need to build.
- `design/screenshots/*.png` is a quick visual reference. Landing renders with blank middle sections in the PNG because of scroll-reveal; ignore that.
- `…Dark.dc.html` boards are the Ink theme of the same screen.

## 2. Typography — make sans match serif

**The problem:** with the Sans reading font on, text looks bigger than the Serif version at the same setting. Inter has a much taller x-height than Baskervville (0.546 vs 0.436 of the em), so the same px size reads about 25% larger.

**The rule:**
- Serif sizes stay exactly as they are.
- **Reading text in Sans = serif size × 0.88**, rounded to the nearest 0.5px.
- **Easy-read (Atkinson Hyperlegible) = serif size × 0.9.**
- Line height stays the same multiplier (1.55–1.6 for body).
- Apply this through one helper, e.g. `readingSize(serifPx, font)`. Never hard-code a second set of numbers.
- **UI text is not affected:** buttons, meta, tabs and settings (Inter) and labels (JetBrains Mono) keep their sizes whatever reading font is chosen.

| Use | Serif (keep) | Sans (new) | Easy-read |
|---|---|---|---|
| Mobile article / screen title | 30 | 26.5 | 27 |
| Feed headline (mobile) | 25 | 22 | 22.5 |
| List headline (mobile) | 17 | 15 | 15.5 |
| Body (mobile) | 18 | 16 | 16 |
| Body small (mobile) | 16.5 | 14.5 | 15 |
| Web article h1 | 48 | 42 | 43 |
| Web Home lead | 44 | 38.5 | 39.5 |
| Web Feed headline | 36 | 31.5 | 32.5 |
| Web article body | 21 | 18.5 | 19 |
| Web list headline | 19 / 18 / 17 | 16.5 / 16 / 15 | 17 / 16 / 15.5 |
| Primary source title (web) | 18 | 16 | 16 |

Fixed UI sizes for reference:
- Buttons: Inter 16 / 15.
- Settings rows: 15, with 12.5 secondary.
- Meta: 12.5, never below 12.
- Mono labels: 11, never below.
- Tab bar: 11.
- Web nav: 14.5. Wordmark: 28.

Text-size steps S–XL scale the reading size. They apply on top of the rule above.

The YouAccessibility and WebYou previews show this in action (`ff[font]`, size × 0.88 for Sans).

Fonts:
- Baskervville (400/500/700, plus italics), Inter (400/500/600), JetBrains Mono (400/500).
- Atkinson Hyperlegible (Easy-read).
- Tiro Devanagari Hindi/Marathi for reading text, Mukta for UI text in Hindi/Marathi.
- Woff2 files are in `design/screens/fonts/`.

## 3. Re-enable scrolling on the website (bug)

On web, every route except the landing page is stuck at the viewport height:
- `body` has `overflow: hidden`.
- `#root` and `body` are both 900px tall at a 900px viewport.
- The mouse wheel does nothing, and content below the fold (Home sections, Article related stories, You settings) can't be reached.

This comes from Expo Router's `ScrollViewStyleReset` / the default `+html.tsx`. To fix it:
- In `app/+html.tsx`, drop `<ScrollViewStyleReset />` (or override it) so that on web:
  - `html, body { height: auto; overflow-y: auto; }`
  - `#root { display: flex; min-height: 100%; }`
- Let the **document** scroll on web, not an inner ScrollView, so the browser scrollbar, keyboard scrolling, anchor links and scroll restoration all work. On web, render screen bodies as normal flow (or a ScrollView with `style={{overflow:'visible'}}` and the page owning the scroll).
- Keep the top nav `position: sticky; top: 0`.
- Check that the landing page still behaves the same after the change.
- Verify on Home, Feed, Library, You, Article, Search and Onboarding at 1440×900: the wheel scrolls to the footer, and Back restores scroll position.

## 4. Scrollbars and cursors

**Scrollbars**
- Native and mobile web (<768): hide them (`scrollbar-width:none`, `::-webkit-scrollbar{display:none}`, and `showsVerticalScrollIndicator={false}` natively).
- Web ≥768: a thin, **thumb-only** scrollbar with no track. Copy this from any Web board:

```css
*{scrollbar-width:thin;scrollbar-color:rgba(122,112,98,.45) transparent}
::-webkit-scrollbar{width:10px;height:10px;background:transparent}
::-webkit-scrollbar-track,::-webkit-scrollbar-corner{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(122,112,98,.4);border-radius:10px;border:3px solid transparent;background-clip:padding-box}
::-webkit-scrollbar-thumb:hover{background:rgba(122,112,98,.7)}
```

**Custom cursors (web, desktop only)**

These are currently only on the landing page. Extend them to the whole web app. They apply only inside `@media (hover:hover) and (pointer:fine)`; touch devices keep the system cursor.

| Cursor | File | Hotspot | Where |
|---|---|---|---|
| Ink pointer | `assets/cursor-pointer-paper.svg` (light theme) / `cursor-pointer-ink.svg` (dark) | `4 3` | Default everywhere |
| Native hand | `pointer` | — | Buttons, tabs, non-story links |
| Native text | `text` | — | Inputs, textareas |
| **Read more stamp** (64px) | `assets/cursor-readmore-paper.svg` / `cursor-readmore-ink.svg` | `32 32` | Anything that **opens a story**: headlines, story cards, related stories, feed "Read the story", search results, library items |

```css
@media (hover:hover) and (pointer:fine){
  .ue-paper,.ue-paper *{cursor:url(/cursors/cursor-pointer-paper.svg) 4 3, default}
  .ue-ink,.ue-ink *{cursor:url(/cursors/cursor-pointer-ink.svg) 4 3, default}
  .ue-paper :is(a,button,[role=tab]),.ue-ink :is(a,button,[role=tab]){cursor:pointer}
  .ue-paper :is(input,textarea),.ue-ink :is(input,textarea){cursor:text}
  .ue-paper [data-story-link],.ue-paper [data-story-link] *{cursor:url(/cursors/cursor-readmore-paper.svg) 32 32, pointer}
  .ue-ink [data-story-link],.ue-ink [data-story-link] *{cursor:url(/cursors/cursor-readmore-ink.svg) 32 32, pointer}
}
```

- Put `ue-paper` or `ue-ink` on the root according to the theme.
- Add `data-story-link` (via `dataSet` in RN-web) to every story pressable.
- In the boards, `a[href="WebArticle.dc.html"]` marks the story links.
- Respect reduced motion: the cursor itself is static.

## 5. Web layout for large screens (the main problem)

The live web app is currently a stretched or centred mobile column. Build each page from its **Web board**, not from the mobile screen.

**Frame**
- Container: max **1200px**, centred, **32px** side padding. Never stretch past 1200; the page background fills the rest.
- Top nav, full width with a bottom rule:
  - Wordmark on the left, aligned to the container's left edge.
  - Home · Feed · Library · You centred, with the active one in accent plus a 2px underline.
  - Search icon on the right (opens WebSearch).
  - Height 68. Sticky.
- Breakpoints:
  - **<768:** mobile layout with the bottom tab bar (current build is fine).
  - **768–1023:** web nav; single main column, max 720.
  - **≥1024:** the multi-column layouts below.
- Every content column's left edge lines up with the wordmark. No floating 720px columns inside a 1200px nav.

**Per page** (see the boards for exact values):

| Route | Board | ≥1024 layout |
|---|---|---|
| `/home` | WebHome | Edition strip (3px top rule) → **lead story ~62% + "Most covered today" numbered list ~38%** side by side → section rows as a **3-column card grid** (Technology / India / World …) → Papers & reports → Continue reading. Lead headline 44 serif. |
| `/feed` | WebFeed | **Left rail 300px**: My Feed / Explore tabs, Sections list with counts, note. **Right: story column ~640px**: image, kicker, 36px headline, byline row (Save, ⋯), excerpt with fade, "Read the story". "12 new stories" pill. Caught-up state at the end. |
| `/article/[id]` | WebArticle | Keep the **web top bar** (← Today's edition · wordmark · Aa); don't render the mobile full-bleed modal. Article column **720px** centred: kicker → h1 48 → source tabs → byline row → image → body 21/1.6 → Continue on source → Primary source → Related (2-col). **As published stamp in the right margin**, hidden below 1080px. |
| `/library` | WebLibrary | Title + summary line, **folder grid** `repeat(auto-fill,minmax(200px,1fr))` with stacked-paper folder tiles + New folder tile → Saved list full width with ⋯ per row. Guest: sign-in card in the same frame. |
| `/you` | WebYou | **Left 300px**: title, account card, section nav (Reading, Your news, Front page, Notifications, Accessibility, Storage, About). **Right ~640px**: settings rows with segmented controls aligned right, live preview, Notifications section, Sign out → WebSignOut dialog. |
| `/search` | WebSearch | Big input with X, Your sources / All sources, results 2-col. |
| `/onboarding` | WebOnboarding | Two columns: steps on the left (Step N of 6, progress bar, Skip) and "Your edition so far" card on the right. Tweak `step` shows all nine steps. |

## 6. Screen ↔ route map

| Route / surface | Mobile board | Web board |
|---|---|---|
| `/` `/landing` | — | **Landing: keep the current build** |
| `/onboarding/*` | OB1Welcome … OB9SignIn | WebOnboarding |
| first run after sign-in | Tour / TourDark (`step` 1–9) | (no web tour, by design) |
| `/home` | Main (Comfortable), HomeFocused | WebHome |
| `/feed` | Feed, FeedCaughtUp | WebFeed |
| `/article/[id]` | Article (+ MoreSheet, SaveSheet, ImageView) | WebArticle |
| `/library` | Library, LibraryEmpty, FolderEmpty, History | WebLibrary |
| `/search` | Search | WebSearch |
| `/you` | You | WebYou |
| `/you/accessibility` | YouAccessibility | WebYou › Accessibility |
| `/you/notifications` | Notifications (+ NotificationDelivery rules) | WebYou › Notifications |
| sign out | SignOut (`stage` confirm / signed-out) | WebSignOut |
| guest gates | GuestPrompt | WebSyncHint |
| loading / offline | Skeleton, Offline | — |
| report a problem | MoreSheet (`panel` = report) | same sheet as a dialog |
| Hindi / Marathi | Localized + `design/strings.json` | same |
| system | Tokens, Components, Stamps, Logo | — |

## 7. Tokens

| Token | Paper | Ink |
|---|---|---|
| bg | #F1EBE0 | #1E1C19 |
| surface | #F8F3EA | #262320 |
| ink | #1C1A17 | #C9C0B0 |
| muted | #6B645A | #8E8678 |
| rule | #DDD4C4 | #38332D |
| accent | #A8372A | #C8705F |
| accent-soft | #EBD5CC | #3A2924 |
| photo | #DCD2C1 | #2D2924 |

Shape and spacing:
- Square corners. Sheets get a 14px top radius. Chips on images are round.
- Thin rules, no shadows.
- 24px phone margin. 44px minimum touch targets.
- Every animation needs a `prefers-reduced-motion` fallback.

## 8. What's new since the last design drop (build these)

- **Tour** (8 steps + done):
  - Order: edition strip → lead story → Search → tab bar → Feed swipe hint (animated, "Swipe left or right to switch sections") → My Feed/Explore → Library → You → "You're all set" with the Brand stamp.
  - Spotlight over a scrim, hint card with an accent top rule.
  - Skip tour, Back/Next, progress dashes.
  - Shown once after the first sign-in. Replay it from You › About.
- **Notifications settings:**
  - Master switch.
  - Morning Edition, with time 6/7/8/9.
  - Big stories, Papers & reports, Downloads.
  - Quiet hours 10 PM–6 AM.
  - Blocked state.
- **Notification delivery rules** (NotificationDelivery):
  - Max 3 a day.
  - Big story = covered by ≥5 of the reader's sources, or 60%, whichever is lower, within 6h. Once per story.
  - Quiet hours hold everything.
  - Tap targets: Morning Edition → Home, Big story → Article, Download → folder.
  - Permission ask: once, on day 2, above the edition strip. Never during onboarding.
  - Guests get Morning Edition only (stored locally).
- **Accessibility:**
  - Text size S–XL; line spacing Normal/Relaxed/Loose; match phone text size; higher contrast; underline links; reduce motion.
  - **Reading font Serif / Sans / Easy-read** (Atkinson Hyperlegible, the dyslexia-friendly option).
  - Live preview.
- **Sign out:**
  - Sheet (mobile) / dialog (web).
  - Kept: sources, topics, folders, settings. Removed: downloads on this device.
  - After signing out: guest Home with a "You're signed out… Sign in" toast.
- **Web onboarding:** the same choices as mobile, laid out for desktop.
- **Hindi / Marathi:**
  - No uppercase or letter-spacing on Devanagari.
  - Mukta for UI, Tiro for reading, line height +0.1.
  - Set `lang` attributes.
  - `strings.json` is a draft; get a native-speaker review before shipping.
- **Report a problem:** short form inside MoreSheet (what's wrong chips, optional note, send). Sends to the backend; no email client.
- **Folder download:** ↓ Download / Remove action on the folder status line (FolderEmpty `downloaded`).
- **Article:**
  - No source tabs on mobile.
  - Vertical ⋯ on the image opens MoreSheet.
  - As published stamp at the image edge.
- **Home:** every section header has "See more". The search icon opens Search.
- **Sign-in:** the capped Brand stamp stamps down (with a reduced-motion fallback).
- **Components** board: the canonical buttons, controls, tabs, inputs, story units, sheets and states. Build shared components from it.

## 9. Status of the "left to do" list

| Item | Design | Code (you) |
|---|---|---|
| Real news backend | n/a | To do (RSS/publisher feeds → Supabase). Show full text only where the feed provides it; otherwise "Continue on source". |
| Supabase dashboard setup | n/a | To do |
| Sync library + settings to account | Designed (WebSyncHint, GuestPrompt, Sign out "Kept") | To do |
| Hindi/Marathi menus | **Designed** (Localized, strings.json) | To do |
| Tour | **Designed** | To do |
| Notifications (settings + delivery) | **Designed** | To do (Expo Notifications + Web Push) |
| Accessibility options incl. dyslexia font | **Designed** | To do |
| Report a problem | **Designed** (MoreSheet) | To do |
| Web onboarding | **Designed** | To do |
| Sign-out boards | **Designed** | To do |
| Custom web cursors outside landing | **Designed** (all Web boards) | To do (section 4) |
| Android APK | n/a | Build with EAS (`eas build -p android --profile preview`) and test on a real device |
| Landing funding answer + contact email | Waiting on Ashmit | Leave placeholders as they are; don't invent copy |

## 10. Open decisions (don't guess, ask Ashmit)

- **Offline model:** Library and You › Storage say saved articles download automatically, but folders now have a manual ↓ Download. Build the per-folder Download for now and leave the auto-offline toggle off until he decides.
- `Article-ptmb.dc.html` is Ashmit's experiment board ("Article by" byline). Don't build from it.
- The dark-mode toggle in the live web nav isn't in the design. Theme lives in You › Reading. Remove it from the nav unless Ashmit wants it kept.
- Web Article keeps source tabs (WebArticle board); mobile Article doesn't. This is intentional.
