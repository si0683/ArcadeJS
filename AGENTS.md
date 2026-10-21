# AGENTS.md — rules for AI coding agents

GameMonsterJS2D (since 4.0.0) is a **project starter**: the npm package `create-gamemonsterjs2d` copies `template/` (Vite + Phaser 4 + Tiled + TypeScript) into a new folder and runs `npm install`.

- `bin/create.mjs` — the CLI, Node ≥ 20.19, no dependencies. The template keeps `.gitignore` as `template/_gitignore` (npm never publishes `.gitignore`); the CLI renames it.
- `template/` — a working game. Work on it in place: `cd template && npm install && npm run dev`. `template/AGENTS.md` is the guide for agents in the user's project — keep it in sync.
- Stack decisions: Matter.js is used through Phaser (`physics.default = "matter"`), never as a separate package; sound goes through Phaser's sound manager, no Howler.
- Level: `template/public/assets/maps/level1.tmj` (Tiled JSON, embedded tileset `tiles`, 18 px tiles). Keep layer names `decor`, `ground`, `objects` and object names `player`, `coin`, `slime`, `flag` in sync with `GameScene.ts`.
- Assets: only CC0 or own work; list every file in `template/public/assets/CREDITS.md`.
- Player texts Russian, code comments English.
- Before a release: `npm pack`, `npx ./create-gamemonsterjs2d-<v>.tgz "Test Game"` in a temp folder, `npm run build` there, play it in `npm run dev` (keyboard and touch), no console errors.
- Versions: `version` in package.json + CHANGELOG.md + tag `vX.Y.Z`; published tags are never changed.
- `index.html` in the root is the GitHub Pages page: only a short install guide, Inter font, light/dark theme.
- Tags v1.0.0–v3.0.0 hold the former CDN library (ArcadeJS / GameMonsterJS). Lesson repos pin them through jsDelivr — never delete those tags.
