# Un:edited — design package (9 Oct 2026)

| Path | What |
|---|---|
| `CLAUDE_CODE_PROMPT.md` | The prompt to paste into Claude Code |
| `HANDOFF.md` | Full instructions: overwrite rules, typography (sans × 0.88), scroll fix, scrollbars, cursors, web layout, route map, tokens, new screens, status, open decisions |
| `LIVE_SITE_REVIEW.md` | Issues found on unedited-six.vercel.app |
| `design/screens/` | 70 boards (`*.dc.html`), `index.html` gallery, `canvas.json` layout, `support.js` runtime, `assets/` (stamps + cursors as SVG), `fonts/` (woff2 + fonts.css) |
| `design/screenshots/` | PNG of every board |
| `design/strings.json` | English / Hindi / Marathi UI strings (draft, needs native review) |

## Preview

```
cd design/screens
python3 -m http.server 8000
# open http://localhost:8000
```

Boards need to be served over HTTP; opening them as `file://` won't load the runtime.

Source canvas: https://claude.ai/artifact/KBgcFxZShLJtR21cxHsr67
