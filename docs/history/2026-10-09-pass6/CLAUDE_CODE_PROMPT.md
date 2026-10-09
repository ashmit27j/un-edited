I've attached `unedited-design.zip`, the finished Un:edited design exported from Claude Design. Unzip it at the repo root and read `README.md`, `HANDOFF.md` and `LIVE_SITE_REVIEW.md` before changing anything.

Do the following:

1. **Overwrite your design with these files.**
   - Replace the repo's design screens and assets with `design/` from the zip.
   - Treat these boards as the source of truth. Where code and boards disagree, the boards win.
   - Then update the app to match them.

2. **Leave the landing page exactly as you built it. It's correct.**
   - Don't change its layout, styles or copy.
   - The only landing-related changes allowed are the global scroll and cursor fixes below, and they must not change how it looks.

3. **Make sans-serif sizes consistent with serif.**
   - Keep every serif size as it is. Change only sans-serif: right now sans renders slightly larger than serif in several places.
   - Rule: reading text in Sans = serif size × 0.88, rounded to 0.5px. Easy-read (Atkinson Hyperlegible) = × 0.9.
   - UI text (buttons, meta, tabs, labels) doesn't change with the reading font.
   - Put this in one helper and use it everywhere. HANDOFF §2 has the full table.

4. **Re-enable scrolling on the website.**
   - It's currently disabled: `body { overflow: hidden }` from Expo Router's `ScrollViewStyleReset`, so `#root` is locked to the viewport.
   - Let the document scroll on web on every route.
   - Keep the nav sticky.
   - Check that Home, Feed, Library, You, Article, Search and Onboarding all scroll to the bottom with the mouse wheel at 1440×900. HANDOFF §3 has details.

5. **Cursors.** Extend the custom cursors to the whole web app, not just the landing page.
   - Desktop only: `@media (hover:hover) and (pointer:fine)`.
   - Default is the stylised ink pointer: `cursor-pointer-paper.svg` / `-ink.svg`, hotspot 4 3.
   - Buttons and tabs use the native hand. Inputs use the text cursor.
   - Anything that opens a story shows the 64px **Read more stamp**: `cursor-readmore-paper.svg` / `-ink.svg`, hotspot 32 32.
   - Switch the paper/ink variant with the theme.
   - Web scrollbars: thin, thumb only, no track. Mobile: no scrollbars at all.
   - HANDOFF §4 has the CSS.

6. **Fix the website on larger screens.** This is the main issue: right now it's a stretched or centred mobile column. I reviewed https://unedited-six.vercel.app; the findings are in `LIVE_SITE_REVIEW.md`.
   - Build each web route from its Web board (WebHome, WebFeed, WebArticle, WebLibrary, WebYou, WebSearch, WebOnboarding, WebSignOut).
   - Use a 1200px max container with 32px padding, content aligned to the wordmark, and the multi-column layouts at ≥1024.
   - Breakpoints: <768 mobile, 768–1023 single column, ≥1024 full layout.
   - Article on web must keep the web top bar, not the mobile full-screen view.
   - Remove the dark-mode toggle from the nav; theme lives in You.
   - Smaller mobile screens are mostly fine. Don't regress them.

7. **Build the screens that are now designed:**
   - Tour.
   - Notifications settings and delivery rules.
   - Accessibility, including the Easy-read (dyslexia-friendly) font.
   - Report a problem form.
   - Web onboarding.
   - Sign out (mobile sheet + web dialog).
   - Hindi/Marathi UI (`strings.json` is a draft that needs native review).
   - Folder Download/Remove.
   - Use the Components board for shared components.
   - HANDOFF §8 lists them and §6 maps boards to routes.

8. **Make sure it's complete end to end.**
   - Every route in HANDOFF §6 is implemented in Paper and Ink, on mobile and web, with its empty, loading, offline and guest states.
   - Then go through the "left to do" list in HANDOFF §9: news backend, Supabase setup, syncing library and settings to the account, and building and testing the Android APK with EAS.
   - Leave the landing funding answer and contact email as placeholders. I'll supply them.
   - Ask me about the open decisions in HANDOFF §10 instead of guessing.

When you're done:
- Deploy to Vercel.
- Recheck https://unedited-six.vercel.app at 1440×900, 1024×768 and 390×844.
- Send me a short list of what changed and anything still open.
