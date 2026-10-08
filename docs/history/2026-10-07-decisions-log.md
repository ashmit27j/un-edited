# Un:edited — Decisions Log (planning phase)

> Snapshot copied from the claude.ai project doc `claude/uneditd-decisions-log.md` on 2026-10-09. Kept for history. Some entries here were later changed by design passes 4–5 (see `docs/current-config.md` → "Where the history disagrees").

_Last updated: 2026-10-07_

## Locked
- **Name:** Un:edited (renamed from "Un:editd" on 2026-10-07). The colon in the wordmark is two accent dots. Handles and domains: still to decide (old handle `uneditd`).
- **Motto:** "Every story, as it was written." (added 2026-10-07)
- **Platforms:** Android, iPhone and web, with the same features everywhere.
- **Distribution:** no App Store and no Apple developer fee.
  - Android: APK file.
  - Web: live website, installable as an app (PWA).
  - **iPhone: the installable website**, because a .ipa file can't reach normal iPhone users without a paid Apple account.
- **Price:** free for users. Solo builder, minimal paid services.
- **No AI in what the reader sees.** Content comes straight from sources and is never rewritten. AI may be used behind the scenes to group stories, if needed (see "Story grouping").
- **Languages at launch:** English, Hindi, Marathi. This covers both the app's interface and the source lists.
- **Design direction (approved):**
  - Newspaper and paper feel, clean and minimal, Ground News-level restraint.
  - Light theme: cream paper, ink black, oxblood/crimson accent.
  - Dark theme: warm charcoal, low contrast.
  - Fonts: **Baskerville** for serif (headlines, body, wordmark; ship **Baskervville**, the free Google Fonts revival), Inter, JetBrains Mono, plus Devanagari fonts. Replaced Times New Roman / Tinos on 2026-10-07.

### Navigation
- 4 tabs: **Home · Feed · Library · You**.
- The tab bar sits at the bottom on mobile and at the top on web.
- The active tab is shown in the accent color (2026-10-07).

### Home
- A newspaper-style dashboard made of cards. It includes:
  - Lead story
  - Stories covered by most of your sources
  - A block per topic
  - Trending (only if opted in)
  - Papers & Reports
  - Continue reading
  - Outside your sources
- **Home view setting:** chosen in onboarding and changeable later in You → Reading.
  - **Comfortable:** cards with images.
  - **Focused:** compact and text-led.

### Feed
- Top toggle: **"My Feed | Explore"**.
- Category tabs under it.
- One story per screen, sized to the screen height. The text is cut off and fades out at the bottom.
- After today's stories, a "You're all caught up" sheet.

### Card actions
- Only a `⋯` button in the byline row under the headline.
- The `⋯` menu holds:
  - Save to folder
  - Share link
  - More about [topic]
  - Not interested (less about this topic, or hide this source)
  - Report a problem (broken link, wrong image or credit, wrong grouping, something else)
- No separate Save, Download or Share icons on cards.

### Article view
- Full screen with the bottom navigation hidden.
- Layout: image (Back left, Save bookmark right) → headline → source switcher.

### Library
- Folders: "Saved" (default) plus folders the user creates.
- "Recently viewed": the last 5 articles opened, each with a save button.
- **No Download feature.** Saved articles are kept offline automatically. This can be turned off in You › Storage.
- Only holds articles from inside the app.

### Saving
- No Like feature.
- Tapping Save opens a sheet to pick a folder. A saved article shows a filled bookmark.

### Loading and offline states
- Calm skeleton placeholders.
- An offline screen that points to saved articles.

### Onboarding and accounts
- Welcome (animated wordmark, motto, three one-liners) → steps 1–6 (each skippable) → "Getting your edition ready" sequence → sign-in.
- Sign-in screen has a "Not now" option.
- Guests who tap a feature that needs an account get a message with a "Sign in" button.

## Proposed (awaiting confirmation)

### Story grouping
- **Version 1, no AI:**
  - Compare headlines and excerpts with standard text-similarity scoring, using Postgres full-text search, which is built in and free.
  - Two stories only match if they share 2 or more strong words (names, places, numbers).
  - Only compare stories within a 36-hour window.
  - Keep an alias list (e.g. "PM Modi" = "Narendra Modi").
  - Group within one language only.
  - Lean toward not merging when unsure.
- **Upgrade path:**
  - A small open-source model running on our own server. No Gemini, no API, no rate limits, and it can match stories across Hindi, Marathi and English.
  - Only switch if testing in the first build phase shows plain matching isn't good enough.
- **Correcting mistakes:** the Report menu includes "Wrong grouping."

### Refresh cadence
- Fetch feeds in the background every 30 minutes, using standard checks so unchanged feeds aren't downloaded again.
- **Home = Morning Edition:** built at 6:00 IST and stays fixed for the day.
- **Feed = Latest:** updates live, with a "12 new stories" pill instead of the screen jumping.
- Delete stored articles older than 30 days, except ones users have saved.

### Research
- "Papers & Reports" appears as a Home block and a Research category in the Feed. No separate tab.
- Papers carry honest labels: Peer-reviewed / Preprint / Official report.
- A story links papers or reports only when the article itself links to them.

### Stack
- One Expo codebase builds Android (APK) and web (PWA).
- Supabase for the database and login.
- A scheduled job (Supabase cron or GitHub Actions) fetches feeds.
- Cloudflare Pages for hosting the web app.

### Sign-in
- Google and email. No Sign in with Apple, since it requires a paid Apple account.

### Android
- Register as a verified developer early, ahead of Google's sideloading verification.

### Devanagari fonts
- Tiro Devanagari Hindi and Marathi, plus Mukta. Set the `lang` tag on all text.

### Guests
- Can read without signing in.
- Sign-in is needed for Save and folders.

### iPhone install guide
- A one-time screen shown on iPhone Safari after onboarding: Share → Add to Home Screen.

### Second reference (travel blog UI): what to take and what to drop
- **Take:**
  - Article opens with the headline set over a full-width image, with a dark fade behind the text.
  - The article body slides up as a sheet that overlaps the image.
  - Bookmark icon at the top right of the image.
  - "Related stories" cards at the end of the article.
  - Topic tags as quiet chips.
- **Drop:**
  - Navy and yellow colors (keep the paper and oxblood palette).
  - The floating "+" button (users don't create content).
  - Heavy drop shadows and large rounded corners.

## Design progress
- **Pass 1 (2026-10-06):** core screens canvas: https://claude.ai/artifact/KBgcFxZShLJtR21cxHsr67 — Home, Feed, caught up, Article, Library in Paper and Ink, plus tokens.
- **Pass 2 (2026-10-06):** onboarding (9 screens), menus and states, You tab, web Home and Article, logo board.
- **Pass 3 (2026-10-06):** Ink twins for menus/states, Library empty, Search, web Feed / Library / You, landing page; then comment-driven fixes (onboarding, Library, Article save button).
- **Pass 4 (2026-10-07):** rename to Un:edited, motto, Baskerville everywhere, accent-colored active tab, type-legibility review, onboarding UX review (Skip on every step, consistent headings, minimum-selection rules, clearer sign-in copy), new animated Welcome screen, landing page rebuilt with a uniform numbered-section layout and more motion. See the design doc for details.

## Brand
- **Logo / app icon:** "Un" in Baskerville Bold, cropped at the right edge. Dark: coral #C8705F on ink #1C1A17. Light: oxblood on paper.
- **Wordmark:** "Un" and the two-dot colon in the accent color, "edited" in ink.
- **List numbers:** sans serif (Inter), not serif.

## Open questions
- New handles and domain for "Un:edited".

## Build progress
- **2026-10-06: Expo app project started** (Expo SDK 57, Expo Router, Supabase).
  - Done: login-based routing for `/` and the web landing page.
  - **Routing at `/`:**
    - Signed in or guest → `/feed`.
    - Signed out on web → the landing page.
    - Signed out in the phone app → `/welcome` (onboarding).
  - A script in the page header sends returning readers to `/feed` before the landing page shows. First-time visitors get the landing page already built into the HTML, so search engines can read it.
  - The code still uses the old name, fonts and landing layout; update it to match the pass-4 design.
