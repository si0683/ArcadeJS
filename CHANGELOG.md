# Changelog

## 4.1.0 — 2026-10-22

- `PROMT.md`: a fill-in brief (in Russian) for building a 2D game with an AI assistant — type, structure, features, design, quality rules, work stages and acceptance checklist. In the repository root for download and in every new project.

## 4.0.0 — 2026-10-22

GameMonsterJS2D is now a project starter instead of the CDN library GameMonsterJS.

- `npm create gamemonsterjs2d` (package `create-gamemonsterjs2d`): copies the template, installs dependencies, runs `git init`.
- Template: Vite 8, Phaser 4 (Arcade physics, Matter.js built in, Phaser sound), TypeScript, a Tiled level.
- Playable platformer: menu, HUD, coins, slimes, hazards, flag, touch buttons; Kenney CC0 art; GitHub Pages workflow; `AGENTS.md`.
- Removed: `gamemonster.js/.css/.mjs/.d.ts`, examples, sprites/sounds catalogue, tools, AI.md, PROMPT*.md. Tags v1.0.0–v3.0.0 still serve the old library on jsDelivr.
