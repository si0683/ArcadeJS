# Changelog

## 4.3.0 — 2026-10-22

- Quality toolchain in the template: ESLint 10 + typescript-eslint, Prettier, Vitest unit tests (`npm test`), Playwright browser check (`npm run test:e2e`, `e2e/game.spec.ts`) and `npm run check` (lint + types + tests + build); the GitHub Pages workflow runs `npm run check` before deploying.
- `src/platform/guard.ts`: every platform is wrapped — SDK errors are logged, hanging calls end after a time limit, failed rewarded ads return `false`, broken saves load as empty. Yandex: a failing `YaGames.init` falls back to no SDK, an ad error after opening still resumes the game.
- `src/save.ts`: one save record (best + volume settings) with `parseSave` (old saves keep loading) and `save.update()` (merges; optional delay groups writes for portal limits); flushed on `pagehide`.
- Sound and music volume in the menu (S / M keys or clicks, `src/audio.ts` `playSfx`/`playMusic`).
- `src/rules.ts`: game rules as plain tested functions; `RECIPES.md`: step-by-step recipes (new enemy, level, sound, save field, screen, language, assets, accessibility, performance).

## 4.2.0 — 2026-10-22

- Platform SDK choice in the installer: `--sdk=none` (default) or `--sdk=yandex`, or an interactive question. SDKs live in `sdks/<name>/` and are applied over the template.
- `src/platform/`: one interface for the game (init, ready, gameplay start/stop, fullscreen and rewarded ads, saves, leaderboard, language, pause/resume); `none.ts` uses localStorage and the browser.
- Yandex Games SDK (`sdks/yandex`): `/sdk.js` + `YaGames.init`, `LoadingAPI.ready`, `GameplayAPI`, `game_api_pause`/`resume`, `showFullscreenAdv`, `showRewardedVideo`, `player.getData/setData`, `leaderboards.setScore`, `environment.i18n.lang`; falls back to no-SDK under `npm run dev`; `npm run yandex` (sdk-dev-proxy), `YANDEX.md` with publishing steps and moderation checklist.
- `src/i18n.ts` (ru/en by platform language), best result saved and shown in the menu, interstitial at round end, game paused and muted on platform pause.
- `npm run zip` → `game.zip` with `index.html` at the root; no page scroll, text selection or long-tap menu; Vite `appType: "mpa"` (missing files answer 404).

## 4.1.1 — 2026-10-22

- `PROMT.md` is now copy-paste ready: the whole file is the prompt (works in an AI chat without files and with unfilled fields); usage, the filled-in example and tips moved to README.ru.md.

## 4.1.0 — 2026-10-22

- `PROMT.md`: a fill-in brief (in Russian) for building a 2D game with an AI assistant — type, structure, features, design, quality rules, work stages and acceptance checklist. In the repository root for download and in every new project.

## 4.0.0 — 2026-10-22

GameMonsterJS2D is now a project starter instead of the CDN library GameMonsterJS.

- `npm create gamemonsterjs2d` (package `create-gamemonsterjs2d`): copies the template, installs dependencies, runs `git init`.
- Template: Vite 8, Phaser 4 (Arcade physics, Matter.js built in, Phaser sound), TypeScript, a Tiled level.
- Playable platformer: menu, HUD, coins, slimes, hazards, flag, touch buttons; Kenney CC0 art; GitHub Pages workflow; `AGENTS.md`.
- Removed: `gamemonster.js/.css/.mjs/.d.ts`, examples, sprites/sounds catalogue, tools, AI.md, PROMPT*.md. Tags v1.0.0–v3.0.0 still serve the old library on jsDelivr.
