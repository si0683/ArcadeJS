# Changelog

## 5.0.0 — 2026-10-23

A complete game structure on top of the engine features; every system can be switched off in `FEATURES` (`src/config.ts`).

- Levels: `src/levels.ts` (list, stars by coins, unlocking, best score, tested), `LevelSelectScene` (grid, locks, result of the last level, focus on the next), maps load when a level starts (`GameScene.preload`), a second level.
- Tiled mechanics: checkpoints, springs, moving platforms (carry the player), one-way planks (tile property `oneWay`), tutorial hints (`hint` + i18n key), object properties through `prop()` (`src/tiled.ts`); parallax background (`src/parallax.ts`).
- Audio: pitch variation and a copy limit for effects, one music track with crossfades on the game clock, ducking under the pause; `npm run audio` (ffmpeg: WAV → OGG + M4A).
- Settings scene: volume, effects, language override, fullscreen, touch buttons or a virtual joystick, key re-assignment (saved); "rotate your phone" overlay, safe areas for notched phones.
- Meta game: achievements with pop-ups (`ToastScene`), daily reward with a streak, coin wallet, remote balance config (`FEATURES.remoteConfigUrl`).
- Save: `wallet`, `levels`, `achievements`, `daily`, `settings.lang/touch/keys`; old saves keep loading.
- QA: input recording and replay (`src/replay.ts`, F7/F8 in dev), screenshot tests (`e2e/visual.spec.ts`), FPS test with a 4× slower CPU (`npm run test:perf`); the browser check covers level progress, settings and replays.
- Release: `npm run build:web` — offline installable web app (manifest, icons, service worker); the GitHub Pages workflow publishes it.
- Genre templates: `--template=topdown` (8-direction walking with a dash, chasing enemies with a state machine, wall maps); `src/genre.ts` describes the genre for shared code; the installer asks for the genre.
- Fixes: short taps and key presses between frames are no longer lost; pop-ups sent before their scene starts are queued.
- Breaking for projects made from 4.x: `GameScene` takes `{ level }`, `Slime.start(speed)`, `playSfx` options, `save` has new fields, `MenuList` takes an options object.

## 4.6.0 — 2026-10-23

- VK Play in the stack: new `--sdk=gamepush` ([GamePush](https://gamepush.com) — one SDK for VK Play, VK Games, OK, Yandex Games and more; the portal is detected by the page address). Wired: SDK from the official mirrors with `onGPInit`, `gp.player.ready`, `gameStart`, `gameplayStart/Stop`, fullscreen and rewarded ads with the SDK's own pause/resume, saves in the player field `save`, best score in `score`, purchases by product tag, language. Keys in `.env` (`.env.example`); without them it runs as no SDK. Guide: `GAMEPUSH.md`; the browser check mocks the GamePush SDK.
- Website: new palette without green — a light theme (white, indigo ink, violet accent) and a dark indigo theme; VK Play row in the stack table.

## 4.5.0 — 2026-10-23

Game feel and professional tooling in the template.

- Movement: `src/movement.ts` — acceleration/deceleration, air control, coyote time, jump buffer, variable jump height, fall gravity and max fall speed as plain tested functions; numbers in `PLAYER` (`src/config.ts`).
- Structure: entities `src/entities/Player.ts` and `Slime.ts`; `src/fsm.ts` state machine (player animation states); `config.ts` holds objects (`PLAYER`, `CAMERA`, `FX`, `GRAVITY`) instead of loose constants (`PLAYER_SPEED`, `JUMP_SPEED`, `ZOOM` are gone).
- Input: `src/input.ts` `Controls` — actions from keyboard, gamepad (enabled in the config) and HUD touch buttons with `justPressed`/`isDown`/`justReleased`/`axisX`.
- Juice: `src/fx.ts` — dust, sparks, floating "+1", squash and stretch, hit flash, freeze frames, camera shake; HUD score pops; camera dead zone and look-ahead.
- Look: `src/look.ts` — Phaser 4 camera filters (vignette, colour grade) and a glow layer for coins and sparks; `src/transition.ts` scene fades.
- Pause screen (`PauseScene`: Esc / P / gamepad Start / HUD "II" button) with resume, volume, effects, main menu; `src/ui.ts` `MenuList` for keyboard/gamepad/pointer menus with visible focus.
- "Effects" setting (menu key E, pause menu) saved with the settings: turns off shake, flashes, freeze frames and filters.
- Dev tools under `npm run dev` only (`src/debug/`): F1 overlay, F2 Tweakpane live tuning with "copy values for config.ts", F3 hitboxes, F4 god mode, F6 win the level.
- Analytics: `src/telemetry.ts` — `track()` events (level start/complete, game over, deaths with cause and position, quit), `captureErrors()`, `beaconSink()`.
- Assets: `npm run atlas` (`scripts/atlas.mjs`, pure JS: `art/atlas/<name>/*.png` → atlas PNG + Phaser JSON with padding and extrusion); `npm run size` (`scripts/size.mjs`) — size budget, part of `npm run check`.
- Fixes: menu toggles no longer flip twice when Phaser re-delivers a key event; a key or touch tap shorter than a frame is no longer lost (touch jump, pause button); keys released during a pause do not stay "held".
- Tests: movement, state machine, telemetry, the effects setting; the browser check now jumps, pauses and resumes.
- `RECIPES.md`: juice, filters, Aseprite, atlas, controls and gamepad, live tuning, state machine, analytics, libraries per genre; enemy and screen recipes use entities, `MenuList` and fades.

## 4.4.0 — 2026-10-22

- In-game purchases in the `Platform` interface: `features` (ads / purchases / leaderboard), `getProducts`, `purchase`, `getPurchases`, `consumePurchase`; `guard()` covers them (a payment window that never answers ends as a failed purchase, broken catalogs are filtered).
- `src/shop.ts`: restores owned products on start, permanent and consumable products (consumed after delivery, undelivered ones delivered on the next start), titles and prices from the portal; the menu sells "Remove ads" (`no_ads`) where purchases work, and bought it turns off interstitials. Without an SDK purchases are emulated under `npm run dev` only.
- Yandex Games: purchases through `getPayments()` (catalog, purchase, restore, consume).
- New SDKs: `--sdk=vk` (VK Games through `@vkontakte/vk-bridge`: ads, VK storage saves, language, pause when hidden), `--sdk=crazygames` (SDK v3: loading/gameplay events, midgame and rewarded ads, `SDK.data` saves), `--sdk=poki` (SDK v2: loading/gameplay events, commercial and rewarded breaks, no page scroll from keys), each with a guide (`VK.md`, `CRAZYGAMES.md`, `POKI.md`); `src/platform/script.ts` loads SDK scripts with a timeout.
- `e2e/sdk-mock.ts` mocks the Yandex (with payments), CrazyGames and Poki SDKs; the browser check buys "Remove ads" where purchases work.
- `RECIPES.md`: a recipe for a new purchase.

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
