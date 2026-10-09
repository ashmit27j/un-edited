# Changelog

Newest first. One line per change: date — what changed — why (if known). Update `current-config.md` alongside.

- 2026-10-09 — Web deployed to Vercel (https://unedited-six.vercel.app, project `unedited` under ashmit27js-projects; `npm run deploy:web`). Built the app screens on **sample data** (fictional outlets in `src/data/sample.ts`; no live feeds yet): landing page, onboarding (welcome, 6 steps, printing), Home, Feed (one story per screen on phones, list on wide web), Article, Library and folders, Search, You (Reading, Language, Front page, Storage, Accessibility basics, sign out) and Your news. Reader choices, saves, folders, downloads flags and recent stories persist on the device (`src/store/reader-provider.tsx`). Real app icon and PWA manifest/icons (`public/`), web `<head>` tags. Landing leaves out the funding answer and contact email until written. Hindi/Marathi menus, notifications delivery, tour, web onboarding variants, report-a-problem and most accessibility options are **not built**.
- 2026-10-09 — Stack settled for the app: Expo, one repository for Android (APK) and web (PWA); iPhone uses the installable website, no native iOS build. Backend and hosting (Supabase, fetch job, Cloudflare Pages) still proposed.
- 2026-10-09 — Added the 16 stamp and cursor SVGs from `uneditd-handoff.zip` (to `design/screens/assets/` and the app's `assets/`). Sign-in now has the edition preview card and the Brand stamp-down animation. Only the SVGs were taken from the zip: its screens are older than this folder's, and it also contains new sign-out boards (`SignOut`, `YouSignedOut`) that are **not merged yet**. Documented Google setup in `.env.example`.
- 2026-10-09 — Sign-in built on Supabase: email code (no password) and Google, guest via "Not now", session remembered on the device. Works without keys as guest-only. New shared `Button`. Not yet tested against a real Supabase project.
- 2026-10-09 — App foundation in `src/`: fonts, Paper/Ink tokens and theme provider, `Text` variants, wordmark, four-tab navigation (bottom on phones, top nav on web ≥ 768px), `/` routing with a temporary welcome/landing screen and a guest path. Tab screens are placeholders. Removed the template's example screens, unused packages and assets.
- 2026-10-09 — Started a fresh Expo app (SDK 57, Expo Router) at the repo root, not from `uneditd-app.zip`. Renamed to Un:edited (slug/scheme `unedited`), Paper splash and icon colours. Supabase confirmed for DB and auth.
- 2026-10-09 — Downloads, Save, language, accessibility, notifications, edition number (Ashmit's change list):
  - Saving no longer downloads. ⋯ menu has Download / Remove download; new You › Storage setting "Auto-download saved articles" (off by default; turning it off keeps existing downloads) and "Clear all downloads". All "kept offline automatically" copy replaced (You, WebYou, SaveSheet, Library, FolderEmpty, LibraryEmpty, Offline, Tour, WebSyncHint). Library folders show "N downloaded".
  - Save is its own icon next to ⋯ on every story (Save first); "Save to folder" removed from ⋯. One tap saves to "Saved" with a toast (Change folder / Undo). Guests get the sign-in prompt. `Article-ptmb`: ⋯ stays top-right, Save in the bottom bar. Guests moved from proposed to current.
  - Font weights standardised to 400 / 500 (Inter 600 dropped; 700 wordmark only).
  - Devanagari: Tiro Devanagari Hindi / Marathi + Mukta now load on every screen with `lang` rules (and no letter-spacing). New You › Language (app language, source languages, Hindi / Marathi font). New boards HomeHindi and HomeMarathi (`language` tweak on `Main`).
  - Accessibility rebuilt into sections: Text, Colour vision, Low vision, Reading and focus, Touch and movement, Motion, Screen readers (plus web equivalents).
  - New You › Notifications: new-edition notification (time, days, sound, vibration, quiet hours) and opt-in topic / source alerts.
  - Home edition strip: "Nº 279" replaced by a per-reader count starting at Nº 1 (none for guests).
  - Kept the stale "source switcher" board titles as asked.
  - New boards: YouLanguage, YouNotifications, HomeHindi, HomeMarathi and Ink twins of the You pages; `canvas.json` and `index.html` updated.
- 2026-10-09 — Exported the design canvas to local files and wrote this handoff. No design changes.
- 2026-10-08 — Pass 5: tour, accessibility settings, Components board, comment and consistency fixes (see `history/2026-10-08-design-doc.md`).
- 2026-10-07 — Pass 4: renamed to Un:edited, motto, Baskerville, stamps, onboarding review, landing rebuild.
- 2026-10-06 — Passes 1–3: core screens, onboarding, menus/states, web, landing. Expo app started.
