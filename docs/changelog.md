# Changelog

Newest first. One line per change: date — what changed — why (if known). Update `current-config.md` alongside.

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
