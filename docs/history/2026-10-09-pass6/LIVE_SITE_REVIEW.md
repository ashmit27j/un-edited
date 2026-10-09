# Review of https://unedited-six.vercel.app (9 Oct 2026)

I checked the site at 1440×900, measuring the DOM and taking screenshots. Mobile widths look mostly right. The problems are on desktop.

## Global

1. **The page doesn't scroll** on every app route (`/home`, `/feed`, `/library`, `/you`, `/article/*`, `/onboarding`):
   - `body { overflow: hidden }`, and both `body` and `#root` are 900px tall at a 900px viewport.
   - The mouse wheel does nothing, even though content is 1374px tall on Home.
   - Everything below the fold can't be reached: Home sections, Article related stories, the lower settings in You.
   - Fix: HANDOFF §3.
2. **Mobile column inside a desktop frame:**
   - The nav spans the 1200 container (wordmark on the left, links on the right).
   - But Feed, Library, You and Onboarding render a ~720px mobile column centred underneath, so the content's left edge doesn't line up with the wordmark.
   - There are large empty side gutters, and no multi-column layouts at all.
3. **No custom cursors** outside the landing page (`body` cursor is `auto`; there are no `cursor:url()` rules on app routes).
4. **A dark-mode toggle (moon icon) in the nav.** It isn't in the design; theme lives in You › Reading.
5. **Sans reading font is larger than serif** at the same setting (see HANDOFF §2 for the ×0.88 rule).
6. The scrollbar is the default browser one where it shows. It should be thin and thumb-only.

## Per page at 1440

| Route | What's wrong now | Should be (board) |
|---|---|---|
| `/home` | One full-width (1200) single column of headlines at 19px, which reads like a stretched list. No lead story with an image, no side "Most covered" list, no section card grid. Empty-state text sits top-left. | WebHome: lead + numbered list side by side, 3-column section grids, 44px lead headline. |
| `/feed` | 720px column with the My Feed / Explore segmented control styled like mobile. Only "Today" shows, so the caught-up state appears immediately. No left rail. | WebFeed: 300px left rail (tabs, sections with counts) + 640px story column, 36px headlines, Read the story. |
| `/library` | 720px mobile column: title, sign-in card, recently viewed. No folder grid. | WebLibrary: folder tile grid + Saved list across the container. |
| `/you` | 720px mobile settings list with full-width segmented controls (Text size S/M/L/XL/XXL). | WebYou: left section nav + right settings with compact right-aligned segmented controls, live preview, Notifications, Accessibility incl. Easy-read. Text size uses the design's steps. |
| `/article/[id]` | Opens as the **mobile** full-screen view: no web nav, a 784px image with a floating round back button, h1 30px, body 18px. Related stories are cut off below the fold (no scroll). | WebArticle: web top bar (← Today's edition · wordmark · Aa), 720 column, h1 48, body 21/1.6, source tabs, As published stamp in the right margin (≥1080). |
| `/onboarding` | Mobile welcome stack (560 wide) in the top third of a blank page; wordmark not aligned with the text column. | WebOnboarding: two-column steps + "Your edition so far". |
| `/`, `/landing` | Looks right. **Leave it.** Only make sure it still scrolls and keeps its cursors after the global scroll fix. | — |

## Measured type sizes (current build, for reference)

- Baskervville: 30 (titles), 22 italic, 19 (list headlines), 18 (article body), 28 (wordmark).
- Inter: 12.5 meta, 14.5 nav, 15 and 16 buttons.
- JetBrains Mono: 11.

These match the **mobile** scale. Web needs the web scale (HANDOFF §2 table) at ≥1024.
