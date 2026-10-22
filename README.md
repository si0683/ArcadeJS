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

## Quality built in

- **Checks:** ESLint + Prettier, strict TypeScript, [Vitest](https://vitest.dev) unit tests (game rules, saves, platform) and a [Playwright](https://playwright.dev) browser check: the game loads without errors, the menu works, the level starts, the player moves. All at once: `npm run check`; GitHub Actions runs it before every deploy.
- **Reliable platform layer:** portal SDK errors and hangs never break the game — calls have time limits, a failed ad gives no reward and never freezes the game.
- **Saves:** the record and the settings in one record, old saves keep loading; sound and music volume in the menu.
- **RECIPES.md:** step by step — a new enemy, level, sound, screen, language; assets, accessibility, performance (in Russian).

## Platform SDK

The installer asks which portal to build for (or pass `--sdk`):

```bash
npm create gamemonsterjs2d@latest my-game -- --sdk=none         # plain web build (default)
npm create gamemonsterjs2d@latest my-game -- --sdk=yandex       # Yandex Games
npm create gamemonsterjs2d@latest my-game -- --sdk=vk           # VK Games (vk.com/games)
npm create gamemonsterjs2d@latest my-game -- --sdk=crazygames   # CrazyGames
npm create gamemonsterjs2d@latest my-game -- --sdk=poki         # Poki
```

The game talks to one interface, `platform` in `src/platform/` (init, game ready, gameplay start/stop, fullscreen and rewarded ads, saves, leaderboard, purchases, language, pause/resume). The SDK only swaps the implementation; `guard()` keeps SDK errors and hangs from breaking the game.

| SDK | Ads | Purchases | Cloud saves | Leaderboard | Guide |
|---|---|---|---|---|---|
| `none` | — | `npm run dev` only (test) | localStorage | — | — |
| `yandex` | ✔ | ✔ | ✔ | ✔ | `YANDEX.md` |
| `vk` | ✔ | needs your server | ✔ | — | `VK.md` |
| `crazygames` | ✔ | Xsolla, approved games | ✔ | — | `CRAZYGAMES.md` |
| `poki` | ✔ | — | localStorage | — | `POKI.md` |

**Purchases** go through `src/shop.ts`: owned products are restored on every start, permanent and consumable products are supported. The template sells "Remove ads" in the menu wherever the portal allows purchases.

VK Play (vkplay.ru) has no public JS SDK for HTML5 games (partner integration with a server only), so the VK option targets VK Games.

Every project gets `npm run zip` → `game.zip` with `index.html` at the root for game portals.

## Build it with AI

[PROMT.md](https://raw.githubusercontent.com/si0683/GameMonsterJS2D/main/PROMT.md) is a fill-in brief for AI assistants (Claude Code, Cursor, Codex…): describe your 2D game — genre, controls, mechanics, levels, art — then tell the assistant in the project folder: *"Read PROMT.md and build the project from it."* The whole file is the prompt, so it can also be copied (Ctrl+A) into any AI chat; unfilled fields are fine, the AI asks about them. The file is also copied into every new project. (The brief is in Russian.)

## Developing this repository

```bash
cd template && npm install && npm run dev
npm pack   # then: npx ./create-gamemonsterjs2d-<v>.tgz test
```

Versions up to 3.0.0 were the CDN library GameMonsterJS (`gamemonster.js`, formerly ArcadeJS). Their tags stay on jsDelivr.

MIT © si0683
