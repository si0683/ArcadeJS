# GameMonsterJS2D

**A 2D browser game starter in one command:** Vite · Phaser 4 · Tiled · TypeScript.

[Русская версия](README.ru.md) · [Website](https://si0683.github.io/GameMonsterJS2D/)

```bash
npm create gamemonsterjs2d@latest my-game
cd my-game
npm run dev
```

Until the package is on npm, run it from GitHub: `npx github:si0683/GameMonsterJS2D my-game`.
Options: `--template=<genre>`, `--sdk=<portal>`, `--no-install`, `--no-git`. Needs Node.js 20.19+.

## What you get

|                                    |                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [Vite](https://vite.dev)           | dev server with instant reload, production build                                                                   |
| [Phaser 4](https://phaser.io)      | scenes, camera, sprites, input, animations, tilemaps, sound; **Arcade** physics by default, **Matter.js** built in |
| [Tiled](https://www.mapeditor.org) | the level is a Tiled map (`.tmj`): draw tiles, place coins and enemies                                             |
| TypeScript                         | strict types                                                                                                       |

Plus a playable platformer (run, jump, coins, slimes, spikes, water, flag), menu and HUD, touch buttons for phones, free CC0 art by Kenney, `AGENTS.md` for AI assistants and a GitHub Pages workflow.

Matter.js and Howler.js are deliberately not separate packages: Phaser already contains Matter.js and its own sound manager.

## Genres

```bash
npm create gamemonsterjs2d@latest my-game                         # platformer (default)
npm create gamemonsterjs2d@latest my-game -- --template=topdown   # top-down: walking, dash, chasing enemies
```

A genre changes only the level scene, its entities and maps; menus, levels, saves, effects, SDKs and tests are shared.

## Game systems included

Each one is switched in `FEATURES` (`src/config.ts`); balance numbers, the level list and texts live in `content/*.json`:

- **Levels:** a list in `content/levels.json`, level select with stars, unlocking in order, maps loaded when a level starts.
- **Tiled mechanics:** checkpoints, springs, moving platforms, jump-through planks, tutorial hints, object properties (enemy speed, platform path).
- **Meta game:** achievements with pop-ups, a daily reward with a streak, a coin wallet, remote balance config.
- **Settings:** sound, music, effects, language, fullscreen, touch buttons or joystick, key re-assignment; "rotate your phone", safe areas.
- **Audio:** pitch variation, copy limit, music crossfade, ducking under the pause, `npm run audio` compression.
- **Release and QA:** offline web app for your own site (`npm run build:web`), input recording and replay (F7/F8), screenshot tests, FPS test on a slowed-down CPU (`npm run test:perf`).

## Game feel and pro tools

- **Movement that forgives:** acceleration, coyote time, jump buffer, variable jump height, faster fall — plain tested math in `src/movement.ts`, numbers in `content/balance.json`.
- **Juice:** dust, sparks, floating "+1", squash and stretch, hit flash, freeze frames, camera shake, look-ahead camera (`src/fx.ts`).
- **Phaser 4 filters:** vignette, colour grade and a glow layer for pickups (`src/look.ts`); fades between scenes. An "Effects" setting turns screen effects off (accessibility, weak devices).
- **Input by action:** keyboard, gamepad and touch through one `Controls` (`src/input.ts`); pause screen and menus navigable by any of them.
- **Structure for bigger games:** entities in `src/entities/`, a `StateMachine` for player and enemy modes.
- **Dev tools in `npm run dev`:** F1 overlay (FPS, player state, events), F2 live tuning panel ([Tweakpane](https://tweakpane.github.io/docs/)) that copies values back into the config, F3 hitboxes, F4 god mode, F6 win — never shipped to players.
- **Assets and budget:** `npm run atlas` packs sprites into a texture atlas, Aseprite animations load directly, `npm run size` keeps the build within a size budget.
- **Analytics:** `track()` events (level start/complete, deaths with position, quits) and error capture with pluggable sinks (`src/telemetry.ts`).

## Quality built in

- **Checks:** ESLint + Prettier, strict TypeScript, [Vitest](https://vitest.dev) unit tests (game rules, saves, platform) and a [Playwright](https://playwright.dev) browser check: the game loads without errors, the menu works, the level starts, the player runs, jumps and pauses. All at once: `npm run check`; GitHub Actions runs it before every deploy.
- **Reliable platform layer:** portal SDK errors and hangs never break the game — calls have time limits, a failed ad gives no reward and never freezes the game.
- **Saves:** the record and the settings in one record, old saves keep loading; sound and music volume in the menu.
- **RECIPES.md:** step by step — a new enemy, level, sound, screen, language, purchase; juice, filters, Aseprite, atlases, gamepad, live tuning, state machines, analytics, libraries per genre; assets, accessibility, performance (in Russian).

## Studio-grade tooling

What separates professional development: content apart from code, decisions from data, release anywhere.

- **Content as data:** balance, levels and texts live in `content/*.json` with zod schemas in `content/schema.ts`. A typo, an out-of-range number, a map without a flag or a missing translation shows over the game in `npm run dev` and stops the build. Plural forms (`{n:coin|coins}`), texts through a spreadsheet (`npm run i18n:export` / `i18n:import`, Google Sheets included), per-level assets loaded with the map.
- **Analytics:** death heat map on the level (F9), A/B tests (`src/experiments.ts`, balance variants from the remote config), errors in Sentry/GlitchTip with the stack and build version (without the 70 KB SDK), Yandex Metrica. Everything is switched on by keys in `.env`.
- **Your own game server** (`server/`, no dependencies, Dockerfile included): a report with the level funnel, D1/D7 retention, A/B results and errors; a leaderboard that rejects impossible scores and keeps every record's replay (`npm run verify` re-runs it); cloud saves with a transfer code to another device.
- **Release:** `npm run portal` checks portal moderation rules (archive, paths, scrolling, sound in a hidden tab, language); itch.io on a version tag (GitHub Actions + butler); Android through Capacitor (`MOBILE.md`); PC and Steam through Electron with Steam achievements (`DESKTOP.md`); every pull request checked with a playable build attached.
- **Art and sound:** a bitmap font with Cyrillic drawn from any CSS font (the HUD score), dynamic lighting for dark levels with one line in `levels.json`, audio sprites without ffmpeg (`npm run audio:sprite`), Aseprite auto-export (`npm run art -- --watch`).
- **Architecture and tests:** typed game events (`src/events.ts`) — the level says what happened, analytics and the server listen. Repeatable randomness (`src/random.ts`). Golden runs: recordings played frame by frame at exactly 1/60 s, the end state compared to a hundredth of a pixel (`npm run test:golden`). The build version shows in the menu.
- **Accessibility:** colour modes for colour blindness (protanopia, deuteranopia, tritanopia) and high contrast, sound captions, game speed 100/80/60 %, help (+2 lives and level skip).

## Platform SDK

The installer asks which portal to build for (or pass `--sdk`):

```bash
npm create gamemonsterjs2d@latest my-game -- --sdk=none         # plain web build (default)
npm create gamemonsterjs2d@latest my-game -- --sdk=yandex       # Yandex Games
npm create gamemonsterjs2d@latest my-game -- --sdk=vk           # VK Games (vk.com/games)
npm create gamemonsterjs2d@latest my-game -- --sdk=gamepush     # VK Play, OK and more through GamePush
npm create gamemonsterjs2d@latest my-game -- --sdk=crazygames   # CrazyGames
npm create gamemonsterjs2d@latest my-game -- --sdk=poki         # Poki
```

The game talks to one interface, `platform` in `src/platform/` (init, game ready, gameplay start/stop, fullscreen and rewarded ads, saves, leaderboard, purchases, language, pause/resume). The SDK only swaps the implementation; `guard()` keeps SDK errors and hangs from breaking the game.

| SDK                         | Ads | Purchases                 | Cloud saves  | Leaderboard | Guide           |
| --------------------------- | --- | ------------------------- | ------------ | ----------- | --------------- |
| `none`                      | —   | `npm run dev` only (test) | localStorage | —           | —               |
| `yandex`                    | ✔   | ✔                         | ✔            | ✔           | `YANDEX.md`     |
| `vk`                        | ✔   | needs your server         | ✔            | —           | `VK.md`         |
| `gamepush` (VK Play, OK, …) | ✔   | ✔                         | ✔            | ✔           | `GAMEPUSH.md`   |
| `crazygames`                | ✔   | Xsolla, approved games    | ✔            | —           | `CRAZYGAMES.md` |
| `poki`                      | ✔   | —                         | localStorage | —           | `POKI.md`       |

**Purchases** go through `src/shop.ts`: owned products are restored on every start, permanent and consumable products are supported. The template sells "Remove ads" in the menu wherever the portal allows purchases.

**VK Play** (vkplay.ru) has no public JS SDK for HTML5 games, so games reach it through [GamePush](https://gamepush.com) (`--sdk=gamepush`): one SDK that detects the portal — VK Play, VK Games, OK, Yandex Games and more. It needs a free GamePush account and the project keys in `.env`; without them the game runs as with no SDK.

Every project gets `npm run zip` → `game.zip` with `index.html` at the root for game portals.

## Build it with AI

[PROMT.md](https://raw.githubusercontent.com/si0683/GameMonsterJS2D/main/PROMT.md) is a fill-in brief for AI assistants (Claude Code, Cursor, Codex…): describe your 2D game — genre, controls, mechanics, levels, art — then tell the assistant in the project folder: _"Read PROMT.md and build the project from it."_ The whole file is the prompt, so it can also be copied (Ctrl+A) into any AI chat; unfilled fields are fine, the AI asks about them. The file is also copied into every new project. (The brief is in Russian.)

## Developing this repository

```bash
cd template && npm install && npm run dev
npm pack   # then: npx ./create-gamemonsterjs2d-<v>.tgz test
```

Versions up to 3.0.0 were the CDN library GameMonsterJS (`gamemonster.js`, formerly ArcadeJS). Their tags stay on jsDelivr.

MIT © si0683
