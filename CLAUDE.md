# Un:edited — working context for Claude Code

You're working with Ashmit on **Un:edited**, a free news reader that shows stories exactly as publishers wrote them, from outlets the reader picks. Android (APK), web (PWA) and iPhone (via the installable website). Motto: "Every story, as it was written."

The project has had five design passes on a claude.ai design canvas and an early Expo build. This folder holds a local copy of all of it.

## How to work here

- **Nothing is frozen.** `docs/current-config.md` describes where things stand today, not rules. Ashmit may change any of it: name, palette, fonts, screens, stack, scope. When Ashmit asks for a change, make it, then update `current-config.md` and add a line to `docs/changelog.md`.
- **Ask before deciding.** When a request touches something marked *open* or *proposed*, or when two sources disagree (see `current-config.md` §7), give the options with trade-offs in a sentence or two each and let Ashmit choose. Don't settle these yourself.
- **Talk first on big changes.** For anything that changes several screens or the stack, describe the plan in a few lines and wait for a go-ahead.
- **Keep the history.** Don't edit `docs/history/` — those are snapshots. Record changes in `changelog.md` instead.
- **Keep the brand rules unless told otherwise:** nothing reader-facing is AI-written; no "verified"/"fact-checked" claims; fictional outlet names in mockups; reduced-motion fallbacks for every animation.

## Where things are

| Path | What |
|---|---|
| `docs/current-config.md` | Current state of product, brand, tokens, screens, backend, build, plus open items and known conflicts. **Read this first.** |
| `docs/changelog.md` | Log of changes made from here on. |
| `docs/history/` | Original design doc and decisions log, as of 2026-10-07/08. |
| `design/screens/*.dc.html` | 64 screen files (mobile Paper + Ink, onboarding, tour, menus/states, web, landing, brand boards). |
| `design/screens/canvas.json` | Board titles, sizes and positions on the original canvas. |
| `design/screens/index.html` | Gallery of every board. |
| `design/screens/support.js` | The runtime that renders `.dc.html` files. Don't edit. |
| `design/screens/assets/` | The 16 stamp and cursor SVGs (added 2026-10-09). Copies for the app live in `assets/stamps/` and `assets/cursors/`. |
| `design/README.md` | How the screen files work and how to preview/edit them. |

## Previewing screens

```bash
cd design/screens && python3 -m http.server 8000
# open http://localhost:8000/index.html
```
Opening files straight from disk won't work: screens import each other over HTTP.

## The original canvas

The design also lives at https://claude.ai/artifact/KBgcFxZShLJtR21cxHsr67 (private to Ashmit). This folder is a copy from 2026-10-09. Once Ashmit edits here, **this folder is the newer version.** Ashmit decides whether the canvas or this folder is the main copy going forward; ask if it's unclear.

## The app code

The Expo app (`uneditd-app.zip`: Expo SDK 57, Expo Router, Supabase, routing + landing page) isn't in this folder. If Ashmit adds it, note that it predates passes 4–5 and still uses the old name and fonts.
