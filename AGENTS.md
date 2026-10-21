# AGENTS.md — rules for AI coding agents

GameMonsterJS is a general-purpose browser game framework, distributed via jsDelivr (git tags) and npm (`gamemonsterjs`).

- **Never change a published version.** Projects pin `@x.y.z`; tags are immutable. Changes go into a new version: `VERSION` in gamemonster.js, `version` in package.json, `@x.y.z` links (README*, AI.md, PROMPT*.md, tools/build.py output), CHANGELOG.md, tag `vX.Y.Z`.
- Any API change must be reflected in **AI.md** (compact, complete, with examples), **gamemonster.d.ts**, both READMEs and the cheat sheets in **PROMPT.md / PROMPT.ru.md**.
- Code: plain browser JavaScript, no build step, no classes in examples, **English comments**. The only global is `window.GameMonster`. Interface strings live in `I18N` (en, ru) — never hard-code UI text.
- `examples/` holds finished games copied as is from the owner's repositories (FlappyBird, SubwaySurf, QuizShooter, QuizTowerDefense, QuizSnake, QuizPlatformer, QuizBreakout). Do not edit or regenerate them; to update one, copy `index.html`, `style.css`, `script.js` and `codepen/` from its repository again. `python tools/build.py` only injects the Kenney sound and sprite lists and writes `gamemonster.mjs`.
- Assets: only CC0 or permissive licenses; record every source in THIRD_PARTY.md.
- Testing: serve the folder (`python -m http.server`), use test pages with local `gamemonster.js`/`gamemonster.css`; drive games with `GameMonster.game.start()` and `GameMonster.game.step(1/60)` (rAF may not run in a hidden browser pane). No console errors. Types: compile a sample with `tsc --strict --noEmit`.
- Classroom repos (CreateGame01PROMT, lesson games) pin ArcadeJS 1.1.0 (the former name) — do not migrate them without the owner's request.
