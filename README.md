# Un:edited — handoff folder

Local copy of the Un:edited design (exported 2026-10-09) plus everything a new Claude Code session needs to pick up the project.

```
uneditd-handoff/
├── HANDOFF_PROMPT.md      ← paste into Claude Code to start (edit it first)
├── CLAUDE.md              ← context Claude Code reads automatically in this folder
├── docs/
│   ├── current-config.md  ← where everything stands now; all of it editable
│   ├── changelog.md       ← log changes here going forward
│   └── history/           ← original design doc + decisions log (read-only snapshots)
└── design/
    ├── README.md          ← how screen files work, how to preview
    ├── reference/         ← full .dc.html format reference
    └── screens/           ← 64 .dc.html boards, canvas.json, index.html gallery, support.js runtime, assets/
```

**Start:** open Claude Code in this folder and paste the prompt from `HANDOFF_PROMPT.md`.

**Preview the screens:** `cd design/screens && python3 -m http.server 8000`, then open `http://localhost:8000/index.html`.

**Missing:** stamp and cursor SVGs (see `design/screens/assets/README.md`) and the Expo app code (`uneditd-app.zip`).

Original canvas: https://claude.ai/artifact/KBgcFxZShLJtR21cxHsr67
