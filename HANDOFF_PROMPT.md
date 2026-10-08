# Claude Code handoff prompt

Open Claude Code in this folder (`uneditd-handoff/`) and paste everything between the lines as your first message. Edit any part of it first. The bracketed bits are yours to fill or delete.

---

I'm handing you my project **Un:edited**, a free news reader for Android, web and iPhone that shows stories exactly as publishers wrote them, from outlets the reader picks. I've done five design passes on a claude.ai design canvas and started an Expo app. This folder holds a local copy of the design and all the context.

**Please start by reading, in this order:**
1. `CLAUDE.md`: how we'll work and where things are.
2. `docs/current-config.md`: where everything stands today (product, brand, tokens, screens, backend, build), plus open items and places where my older notes and the later designs disagree.
3. `design/README.md`: how the `.dc.html` screen files work and how to preview them.
4. Skim `design/screens/canvas.json` and a few screens (`Main`, `Feed`, `Article`, `OB1Welcome`, `Landing`) so you know the visual language.

**How I want to work with you:**
- Treat everything in `current-config.md` as the current setup, not fixed rules. I may change the name, colours, fonts, screens, flows, stack or scope at any point. I'll tell you what I want; you make it happen and keep the docs current.
- When something is *open*, *proposed*, or contradictory, show me the options with short trade-offs and let me pick. Don't decide for me.
- For bigger changes (several screens, new flows, stack changes), give me a short plan and wait for my OK.
- After each change, update `docs/current-config.md` and add a line to `docs/changelog.md`.
- Ask me when you're unsure. Short questions are fine.

**When you've read everything, reply with:**
- a short summary of the project as you understand it (about 10 lines),
- the open items and conflicts you found, as a list I can choose from,
- anything that looks inconsistent between the screens and the docs,
- then ask me what I want to work on first. Don't start changing anything yet.

[Optional, delete if not needed:]
- What I'm thinking about right now: [e.g. "revisit the offline/download model", "start building the Expo screens", "rework the palette"]
- Things I already know I want to change: [ … ]
- The Expo code is at: [path, or "not added yet"]

---

## Tips

- To preview screens while you talk: ask Claude Code to run `python3 -m http.server 8000` in `design/screens` and open `http://localhost:8000/index.html`.
- The stamp/cursor SVGs aren't included yet. See `design/screens/assets/README.md` to add or redraw them.
- If you'd rather keep editing on the claude.ai canvas instead, say so; then this folder is just reference and Claude Code should treat the canvas as the main copy.
