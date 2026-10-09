# Filmstrip tools

Turn the design animations into numbered, timestamped frames that Claude Code can look at.

```bash
cd design/motion/tools
npm i playwright && npx playwright install chromium   # once
pip install pillow                                     # once
node capture.js            # all animations → ../frames/<id>/tNNNN.png
node capture.js 01-welcome # just one
python3 strip.py           # frames → ../filmstrips/<id>.png
```

To add an animation, add a line to `JOBS` in `capture.js`: screen file, viewport size, and the moments (ms) to capture. For a step change, set `click` to the button text. Timings are real time, so frames can land ±50ms from the label.
