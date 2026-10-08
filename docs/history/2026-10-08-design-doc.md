# Un:edited — Design (source of truth)

> Snapshot copied from the claude.ai project doc `claude/uneditd-design.md` on 2026-10-09. Kept for history; the living version for this folder is `docs/current-config.md`.

_Last updated: 2026-10-08 · Design passes 1–5 complete_

## Where the design lives
- **Canvas:** "Un:edited — Core Screens" — https://claude.ai/artifact/KBgcFxZShLJtR21cxHsr67
  - It's a Claude Design canvas: private to Ashmit until shared.
  - You can also open it from the artifacts gallery at claude.ai/code/artifacts.
- **Editing in a new chat:** paste the link above (or say "the Un:edited design canvas") and ask for changes. Claude reads the canvas and edits it in place, so the link never changes.
- **Live files:** each screen is a `project/<Name>.dc.html` file on the canvas. The layout index is `project/canvas.json`.
- **Rule:** always edit the canvas. Do not rebuild screens elsewhere.
- **Not the source of truth:** the Expo code (`uneditd-app.zip`, landing page and routing) was made ahead of schedule, and still uses the old name and fonts. Design comes first.

## Brand (pass 4)
- **Name:** **Un:edited** (was "Un:editd"). The colon is two accent dots.
- **Motto:** **"Every story, as it was written."**
- **Wordmark:** "Un" and the two-dot colon in the accent color, "edited" in ink. Baskerville Bold.
- **App icon:** "Un" in Baskerville Bold, cropped at the right edge. Dark: coral #C8705F on ink #1C1A17. Light: oxblood #A8372A on paper #F8F3EA with a thin rule border.
- **Three one-liners:** No AI — every word comes from the publisher. · No algorithm — only the outlets you choose. · No fee — free for everyone, always.

### Stamps (2026-10-07, extended 2026-10-08)
Round rubber-stamp marks: double outer ring, JetBrains Mono Bold text around the ring, a Baskervville mark in the centre, slight tilt, light ink texture. Text is outlined in the SVG, so no fonts are needed. Each comes in Paper (oxblood #A8372A) and Ink (coral #C8705F), **plain** and **capped** (filled with the page background, 1px bottle-cap edge). Board: **Stamps** (Brand & tokens row), which also shows the web cursors.

| Stamp | Ring | Centre | Used on |
|---|---|---|---|
| Brand | EVERY STORY · AS IT WAS WRITTEN · UN:EDITED · 2026 | Un: | Landing hero (capped look, stamps in), footer, sign-in (stamp-down animation), end of the tour |
| As published | AS PUBLISHED · WORD FOR WORD · NOT REWRITTEN | ¶ | Article (image edge), Web article (right margin, hidden below 1080px) |
| Free | FREE FOR EVERYONE · ALWAYS · NO ADS · NO PAYWALL | ₹0 | Landing Start section |
| Read more (cursor) | READ MORE · READ MORE | ↗ | Web, desktop only: replaces the pointer over anything that opens a story |

- Use at most one stamp per screen. Avoid "verified" or "fact-checked" — the app doesn't check facts.
- Ideas not yet made: Morning Edition (`MORNING EDITION · PRINTED 6:00 IST`, "Nº 14"), All caught up (`NEWS THAT ENDS · SEE YOU AT SIX`).

## Board inventory

**Paper (light), mobile 390 wide**

| Board | File | Notes |
|---|---|---|
| Home · Comfortable | Main.dc.html | Front page with images. Every section header has "See more". Search icon opens Search. Tweaks: dark, view, type |
| Home · Focused | HomeFocused.dc.html | Text-only version (imports Main) |
| Feed | Feed.dc.html | My Feed / Explore, category tabs (swipe left/right), one story per screen; byline: Save then ⋯ |
| Feed · Caught up | FeedCaughtUp.dc.html | "You're all caught up" sheet |
| Article | Article.dc.html | Image with Back (left) and vertical ⋯ (right, opens ⋯ menu), As published stamp → headline → text → Continue on source → Primary source → Related. Bottom bar: previous/next source, Save. No source tabs. Tweak `saved` |
| Library | Library.dc.html | Folders + New folder; Recently viewed (last 5) |
| Library · Empty | LibraryEmpty.dc.html | "Saved · 0" + New folder; guest tweak |
| Search | Search.dc.html | X inside the field closes Search; Your sources / All sources |
| Folder · Empty | FolderEmpty.dc.html | Status line "0 articles · online only" with a ↓ Download / Remove text action. Tweak `downloaded` |
| Recently viewed | History.dc.html | |
| Article copy | Article-ptmb.dc.html | Ashmit's experiment board (byline "Article by") |

**Ink (dark):** wrapper boards for every Paper screen (…Dark), plus the Menus/states row.

**Onboarding** (press Play on OB1 and tap through). Steps 1–6 have Back, "Step N of 6" and Skip.

| # | File | Content |
|---|---|---|
| 1 | OB1Welcome | Wordmark wipes in, motto, three one-liners, "Set up my edition" / "I already have an account" |
| 2 | OB2Language | English / हिंदी / मराठी |
| 3 | OB3Reading | Theme, Font, Home view, with live preview |
| 4 | OB4Topics | 18 chips; Continue disabled until 1 picked |
| 5 | OB5Regions | Search + Selected list |
| 6 | OB6Sources | Choose who you trust; Continue disabled until 3 picked |
| 7 | OB7Front | Front page sections |
| 8 | OB8Printing | "Getting your edition ready" sequence |
| 9 | OB9SignIn | Capped Brand stamp stamps down. Google / email / Not now → **Tour** |
| — | Tour / TourDark | First-run walkthrough (see Pass 5). Tweak `step` |

**Menus, states and You:** MoreSheet (Report a problem opens a form; tweak `panel`), SaveSheet, GuestPrompt, ImageView, Skeleton, Offline, You (Reading › Accessibility; About › Replay the tour), **YouAccessibility**, and Ink twins.

**Web** (fluid, 1200px max, top nav): WebHome, WebArticle, WebFeed, WebLibrary, WebYou (with Accessibility section), **WebSearch**, WebSyncHint. **Web · Ink row**: Ink twins of all six pages.

**Landing page** — Landing.dc.html. Numbered-section layout: Hero → stats → 01 The idea → 02 Your sources → 03 Papers & reports → 04 Your day → 05 Questions → 06 Start → footer. Placeholders: `[ANSWER: how the project is funded]`, `[CONTACT EMAIL]`, store links.

**Brand and system:** Logo, Tokens, Stamps, **Components**.

## Design tokens

| Token | Paper | Ink (dark, low contrast) |
|---|---|---|
| bg | #F1EBE0 | #1E1C19 |
| surface | #F8F3EA | #262320 |
| ink | #1C1A17 | #C9C0B0 |
| muted | #6B645A | #8E8678 |
| rule | #DDD4C4 | #38332D |
| accent | #A8372A | #C8705F |
| accent-soft | #EBD5CC | #3A2924 |
| photo placeholder | #DCD2C1 | #2D2924 |

**Fonts:** Baskervville for serif (headlines, body, wordmark), stack `'Baskervville', Baskerville, 'Libre Baskerville', Georgia, serif`. Inter for interface, buttons and meta. JetBrains Mono for uppercase labels. Tiro Devanagari Hindi / Marathi, Mukta.

**Type rules:** mono labels ≥11px; Inter meta ≥12px; body serif 16.5–18px at 1.55–1.6; mobile display 30px; one weight step (400/500, 700 wordmark only); one italic accent phrase per heading max. Numbered lists use the reading font (serif when Serif is on). Sentence case for buttons and links ("See more").

**Shape and layout:** square corners (sheets 14px top radius, chips on images round), thin rules instead of shadows, 24px phone margin, 44px touch targets.

## Patterns and rules
- **Navigation:** Home · Feed · Library · You; active tab in the accent color, mobile and web.
- **Per-story actions:** byline row with Save then ⋯.
- **Saving:** "Save to" sheet; saved = filled accent bookmark.
- **Disabled buttons:** only when a step needs a minimum, with a line saying what's missing.
- **Scrollbars:** hidden on all mobile screens; web uses a thin thumb-only scrollbar (no track).
- **Cursors (web, desktop only):** stylised ink pointer; Read more stamp over story links; native hand on other controls.
- **Motion:** every animation has a reduced-motion fallback.
- **Copy:** plain, calm newspaper voice; fictional outlets only.

## Pass 5 (2026-10-08)
- **Tour:** 8 steps + done — edition strip → lead story → Search → tab bar → Feed swipe (animated left/right hint, "Swipe left or right to switch sections") → My Feed / Explore → Library → You → "You’re all set" with the stamp. Spotlight with scrim, hint card with accent top rule, Skip tour on every step, Back/Next, progress dashes.
- **Accessibility:** text size S–XL, line spacing Normal/Relaxed/Loose, match phone text size, higher contrast, underline links, reduce motion; live preview.
- **Components board:** buttons, icon buttons, selection controls, tabs and nav, labels and headers, inputs, story units, cards, sheets and tour hint, loading/empty states, brand marks.
- **Comment fixes:** Article source tabs removed; Article ⋯ chip; Report a problem form; folder Download/Remove; See more on all Home sections; serif list numbers; Search close X; sign-in stamp animation; capped stamps; web cursors; Web Home byline full width.
- **Consistency fixes:** "See More" → "See more"; mobile Home search opens Search; web search icons open WebSearch; Feed byline order matches web; Home lead headline 30px like other screens.

## Open design items
- Library and You › Storage still say saved articles are kept offline automatically, which now overlaps with the per-folder Download action. Decide which model to keep.
- Fill landing placeholders (funding, contact email, store links).
- Web onboarding and a web version of the tour.
- Update the Expo code to the new name, motto, Baskerville fonts and pass-5 patterns.
