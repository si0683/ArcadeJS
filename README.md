# GameMonsterJS2D

**A 2D browser game starter in one command:** Vite · Phaser 4 · Tiled · TypeScript.

[Русская версия](README.ru.md) · [Website](https://si0683.github.io/GameMonsterJS2D/)

```bash
npm create gamemonsterjs2d@latest my-game
cd my-game
npm run dev
```

Until the package is on npm, run it from GitHub: `npx github:si0683/GameMonsterJS2D my-game`.
Options: `--no-install`, `--no-git`. Needs Node.js 20.19+.

## What you get

| | |
|---|---|
| [Vite](https://vite.dev) | dev server with instant reload, production build |
| [Phaser 4](https://phaser.io) | scenes, camera, sprites, input, animations, tilemaps, sound; **Arcade** physics by default, **Matter.js** built in |
| [Tiled](https://www.mapeditor.org) | the level is a Tiled map (`.tmj`): draw tiles, place coins and enemies |
| TypeScript | strict types |

Plus a playable platformer (run, jump, coins, slimes, spikes, water, flag), menu and HUD, touch buttons for phones, free CC0 art by Kenney, `AGENTS.md` for AI assistants and a GitHub Pages workflow.

Matter.js and Howler.js are deliberately not separate packages: Phaser already contains Matter.js and its own sound manager.

## Build it with AI

[PROMT.md](https://raw.githubusercontent.com/si0683/GameMonsterJS2D/main/PROMT.md) is a fill-in brief for AI assistants (Claude Code, Cursor, Codex…): describe your 2D game — genre, controls, mechanics, levels, art — then tell the assistant in the project folder: *"Read PROMT.md and AGENTS.md and build the game from the «Промт» section. Start with a plan and questions."* The file is also copied into every new project. (The brief is in Russian.)

## Developing this repository

```bash
cd template && npm install && npm run dev
npm pack   # then: npx ./create-gamemonsterjs2d-<v>.tgz test
```

Versions up to 3.0.0 were the CDN library GameMonsterJS (`gamemonster.js`, formerly ArcadeJS). Their tags stay on jsDelivr.

MIT © si0683
