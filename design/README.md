# Design files

Every board from the "Un:edited — Core Screens" canvas, exported 2026-10-09.

## Preview

```bash
cd design/screens && python3 -m http.server 8000
```
Then open `http://localhost:8000/index.html` for the full gallery, or any `http://localhost:8000/<Name>.dc.html` on its own. Links between screens work (tap through onboarding from `OB1Welcome.dc.html`). Fonts load from Google Fonts, so you need to be online.

## Board groups

| Group | Files |
|---|---|
| Paper (light), mobile 390w | Main (Home · Comfortable), HomeFocused, HomeHindi, HomeMarathi, Feed, FeedCaughtUp, Article, Library, LibraryEmpty, Search, FolderEmpty, History, Article-ptmb (Ashmit's experiment) |
| Ink (dark), mobile | `…Dark` version of each, plus MoreSheetDark, SaveSheetDark, GuestPromptDark, SkeletonDark, OfflineDark, YouDark, YouAccessibilityDark, YouLanguageDark, YouNotificationsDark, TourDark |
| Onboarding | OB1Welcome → OB9SignIn, Tour |
| Menus, states, You | MoreSheet, SaveSheet, GuestPrompt, ImageView, Skeleton, Offline, You, YouAccessibility, YouLanguage, YouNotifications |
| Web (fluid, 1200 max) | WebHome, WebArticle, WebFeed, WebLibrary, WebYou, WebSearch, WebSyncHint, and `…Dark` twins |
| Landing | Landing |
| Brand & system | Logo, Tokens, Stamps, Components |

`canvas.json` has each board's title, size and position on the original canvas.

## How a `.dc.html` file works

Each file is one screen. `support.js` (the runtime) renders it. Full reference: `reference/dc-html-format.md`.

- **Markup** sits inside `<x-dc>…</x-dc>`. Fonts and global CSS go in `<helmet>`. Styles are inline.
- **Values** come from `{{…}}` placeholders, filled by `renderVals()` in the `<script type="text/x-dc">` block at the bottom.
- **Theme:** each full screen has a `theme(dark, type)` method holding the Paper/Ink token values. Colour changes mean editing these, and they're repeated per file (no shared token file yet).
- **Tweaks:** `data-props` on the script tag declares the knobs (`dark`, `type` serif/sans, `saved`, `step`, `caughtUp` …). Defaults are what you see.
- **Loops / conditions:** `<sc-for list="{{items}}" as="item">` and `<sc-if value="{{flag}}">`.
- **Ink twins** are tiny wrappers: `<dc-import name="Feed" dark="{{yes}}">` renders `Feed.dc.html` with `dark` on. Edit the Paper file and both update.
- **Links:** `<a href="Article.dc.html">` moves between screens.
- **Images:** stamps and cursors point to `assets/*.svg` (see `screens/assets/README.md`). Photos are placeholder hatching.

## Turning these into app code

The boards are mockups, not production components. Reasonable ways to use them, depending on what Ashmit wants:

- as a visual reference while building the Expo screens,
- by pulling the token values into one shared theme file first,
- or by editing the boards here first and building once the design settles.

Ask which.
