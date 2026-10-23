# AGENTS.md — rules for AI coding agents

2D browser game on **Vite + Phaser 4 + TypeScript**, levels made in **Tiled**. Created with `npm create gamemonsterjs2d`.

## Phaser docs for agents

Phaser ships its own skills: `node_modules/phaser/skills/<topic>/SKILL.md` (scenes, sprites-and-images, animations, physics-arcade, physics-matter, tilemaps, input-keyboard-mouse-touch, audio-and-sound, cameras, tweens, particles, v3-to-v4-migration…). Read the relevant one before writing Phaser code. This is **Phaser 4**: no `setTintFill` (use `setTint().setTintMode(Phaser.TintModes.FILL)`), FX and masks are filters, `roundPixels` defaults to false. Do not copy Phaser 3 snippets blindly.

`PROMT.md` is the user's game design document; the whole file is the prompt. When the user asks to build from it, follow it: plan and questions first (including every unfilled `«…»` field), then stages; the rules below stay in force.

## Structure

- `src/main.ts` — game config: size 960×540 (`Scale.FIT`), `pixelArt`, physics, gamepad, list of scenes; platform init + remote config; error capture; dev tools in `npm run dev`.
- `src/config.ts` — balance numbers: `GRAVITY`, `PLAYER` (movement tuning), `CAMERA`, `FX`, springs/platforms, lives, points, text style, and **`FEATURES`** — switches of the optional systems (level select, checkpoints, hints, parallax, achievements, daily reward, rotate prompt, remote config URL).
- `src/genre.ts` — `GENRE`: platformer (default) or a genre template (`--template=topdown` replaces this file, `GameScene`, the maps and adds its entities). Controls text, key overrides, touch layout, dev-panel tuning object.
- `src/scenes/` — `PreloadScene` (shared assets, animations, generated textures; maps are NOT here) → `MenuScene` (start, quick settings S/M/E, settings O, shop, daily reward) → `LevelSelectScene` (grid with stars, locks) → `GameScene` (one level; `init({ level })`, map loaded in its `preload()`) + `HudScene` (score, lives, touch buttons or joystick) + `PauseScene` (resume, volume, effects, restart, menu). `SettingsScene` (volume, effects, language, fullscreen, touch controls, key re-assignment). `ToastScene` — pop-ups above everything, launched once.
- `src/levels.ts` — `LEVELS` (key, file, title) and progress as plain functions: `starsFor`, `isUnlocked`, `recordResult`, `totalStars`, `parseProgress` (tests in `levels.test.ts`).
- `src/entities/` — `Player` (movement, state machine, juice), `Slime` (patrol, Tiled property `speed`), `MovingPlatform` (Tiled rectangle `platform` with `dx`/`dy`/`speed`, carries the player): one class per entity with `start()`/`step()`.
- `src/movement.ts` — platformer movement as plain math (acceleration, coyote time, jump buffer, variable jump, fall gravity) + `pickPlayerState`; `src/fsm.ts` — `StateMachine`; `src/tiled.ts` — `prop(obj, name, fallback)` for custom properties of Tiled objects.
- `src/input.ts` — `Controls`: actions (`left right up down jump pause confirm`) from keyboard (re-assignable: `keysFor()` = settings → genre → `KEYS`), gamepad and `VirtualButtons` (HUD buttons/joystick; taps shorter than a frame are kept); `justPressed`/`isDown`/`justReleased`/`axisX`/`axisY`. GameScene's Controls are recordable (`src/replay.ts`).
- `src/fx.ts` — `Fx`: dust, sparks, pop text, squash, flash, hitstop, shake (respect the "Effects" setting); `src/look.ts` — camera filters and `glowLayer()`; `src/parallax.ts` — background layers + generated textures (hills, spring); `src/transition.ts` — `goTo()`/`fadeIn()`; `src/ui.ts` — `MenuList` (keyboard/gamepad/pointer, visible focus, options `gap`/`fontSize`/`focus`).
- `src/audio.ts` — `playSfx(scene, key, volume, { variation, limit })` (random pitch, copy limit), `playMusic` (one track, crossfade, same track keeps playing), `stopMusic`, `duckMusic` (pause), `updateMusicVolume`. Fades run on the game clock.
- `src/save.ts` — the one save record: `best`, `wallet`, `levels`, `achievements`, `daily`, `settings` (`sound`, `music`, `effects`, `lang`, `touch`, `keys`) with `parseSave` and `save.update()` (merges, optional delay).
- `src/achievements.ts` (list + `checkAchievements`), `src/daily.ts` (`claimDaily`, streak), `src/remote.ts` (`applyOverrides`, `loadRemoteConfig`), `src/meta.ts` (`toast`, `unlockAchievements`, `claimDailyReward`) — tested in `meta.test.ts`.
- `src/i18n.ts` — texts ru/en, `t()`, `fmt()` (`{n}` placeholders), `currentLanguage()` (settings → platform), `starsLabel`; `src/orientation.ts` — "turn your phone" (HTML `#rotate` + CSS media query).
- `src/telemetry.ts` — `track()` events, `captureErrors()`, sinks; `src/replay.ts` — input recording/playback; `src/cheats.ts` — dev switches; `src/debug/` — dev tools (F1 overlay, F2 Tweakpane tuning, F3 hitboxes, F4 god mode, F6 win, F7 record, F8 replay), only under `npm run dev`.
- `scripts/` — `zip.mjs` (portal archive), `atlas.mjs` (`npm run atlas`), `size.mjs` (`npm run size`, part of `check`), `pwa.mjs` (`npm run build:web`: offline web app; the GitHub Pages workflow runs it), `audio.mjs` (`npm run audio`: WAV → OGG/M4A with ffmpeg).
- `public/assets/maps/level*.tmj` — Tiled maps (JSON). Layers: `decor` (no collision), `ground`, `objects` (points/rectangles by **name**: `player`, `coin`, `slime`, `flag`, `checkpoint`, `spring`, `hint` (property `text` = i18n key), `platform` (rectangle)). Tileset `tiles` embedded, image `maps/tiles.png`, 18×18. Tile properties: `collides` (solid), `oneWay` (solid from above only — planks), `hazard` (hurts). The same image is loaded as the sheet `tiles-sheet` (frames 18×18).
- `public/assets/sprites|sounds` — loaded with `this.load.setPath("assets")`.
- Shared state goes through `this.registry` (`score`, `lives`, `level`, `genre`); HUD listens to `changedata`.
- `src/rules.ts` — game rules as plain functions (stomp, record, lives) with tests.
- `e2e/game.spec.ts` — Playwright: menu settings, shop, level select, run, jump (or walk for top-down), pause, level progress, settings, replay; `e2e/visual.spec.ts` — screenshot tests (snapshots saved on the first run per OS, commit them; `--update-snapshots` after an intended change); `e2e/perf.spec.ts` — FPS with a 4× slower CPU (`npm run test:perf`, `MIN_FPS` env). `RECIPES.md` — step-by-step recipes.

## Rules

- Physics: Arcade by default. Matter.js is built into Phaser (`physics: { default: "matter" }`, `this.matter.add…`) — never install the separate `matter-js` package.
- Sound: Phaser's sound manager, played only through `playSfx(scene, key, volume)` / `playMusic()` from `src/audio.ts` so the menu volume settings (S / M) apply. No Howler. Start music only after user input (browsers block autoplay) — the menu waits for a click/key.
- New level: edit or copy the map in Tiled, keep layer and object names, load it in `PreloadScene` with `tilemapTiledJSON`.
- New asset: put it into `public/assets/…`, load it in `PreloadScene`, add a line to `public/assets/CREDITS.md`.
- Input: scenes read actions from `Controls` (`src/input.ts`), never keys directly; call `controls.update()` first in `update()`. A new action goes into `Action`, `KEYS`, `PAD_BUTTONS` and, if needed, a HUD touch button. Every action works with keyboard, gamepad and touch. After a pause call `controls.reset()` (GameScene does it on `resume`).
- Entities: a class in `src/entities/` with `start()` (after adding to a physics group — the group resets the body) and `step()`; modes go through `StateMachine` (`src/fsm.ts`), not boolean flags. Movement and other numeric logic stay plain functions with tests.
- Juice: feedback goes through `this.fx` (`src/fx.ts`); screen-wide effects (shake, flash, hitstop) and filters must respect `save.get().settings.effects`. Glowing objects go into `this.look.glowLayer()`, not one filter per sprite. Phaser 4 filters only — see `node_modules/phaser/skills/filters-and-postfx`.
- Scene changes: `goTo(scene, key, data)` + `fadeIn(this)` in the next scene's create() (`src/transition.ts`); overlays (pause, shop) use `scene.launch` + `scene.pause` and `platform.gameplayStop/Start`. Menus are `MenuList` (`src/ui.ts`).
- Balance numbers live in `src/config.ts` objects; when adding one, also add an `addBinding` line in `src/debug/index.ts`. Dev-only code goes to `src/debug/` behind `import.meta.env.DEV` (dynamic import) so it never ships.
- Analytics: `track(name, data)` from `src/telemetry.ts` at meaningful moments (level start/end, death, purchase); never send personal data. Production sinks are added in `src/main.ts`.
- Optional systems are switched in `FEATURES` (`src/config.ts`); code that belongs to one of them checks its flag, so turning it off never breaks the game.
- Levels: add maps to `LEVELS` in `src/levels.ts` (+ title in i18n); never load maps in `PreloadScene`. `GameScene` takes `{ level }`; finishing goes to `levels` (or the next level / menu without the level select). Stars and unlocking are rules in `levels.ts` with tests.
- Level objects come from Tiled by name; their numbers are custom properties read with `prop()` (`src/tiled.ts`), with defaults in `config.ts`.
- Sound: effects through `playSfx` (pitch variation on by default — pass `{ variation: 0 }` for UI and jingles), music only through `playMusic`/`stopMusic`; never `this.sound.stopAll()` (it kills the crossfade).
- Meta: achievements are data in `src/achievements.ts` (title in i18n); call `unlockAchievements(game, run)` at the end of a run. Pop-ups only through `toast()`.
- Key re-assignment: scenes create `Controls` after settings may have changed (every scene does it in `create()`), so new keys apply on the next screen.
- Phaser keyboard events may be delivered twice when several keys arrive in one frame: handlers of `keydown` that toggle something must dedupe by event (see `MenuScene`), or use `Controls.justPressed`.
- Asset paths are relative (`base: "./"` in vite.config.ts), so the build runs from any folder and GitHub Pages.
- In dev mode `window.game` is the Phaser.Game and `window.save` the save store: test with `game.scene.getScene("game")`; `e2e/` uses them too.
- Platform: game code never calls a portal SDK directly — only `platform` from `src/platform` (`init`, `ready` after loading, `gameplayStart`/`gameplayStop` around actual play, `showFullscreenAd` only at logical pauses, `showRewardedAd`, `loadData`/`saveData`, `submitScore`, `lang`, `onPause`/`onResume`). This project uses `none.ts` (localStorage, browser language, no ads). Player texts live in `src/i18n.ts` and follow `platform.lang`. `npm run zip` packs `dist/` into `game.zip` for game portals.
- Texts for players in Russian by default; code comments in English.
- Game rules (scoring, win/lose, records, damage) are plain functions in `src/rules.ts` without engine code, each with a test in `src/rules.test.ts`. New mechanics follow the same split: the rule in `rules.ts`, the engine glue in the scene/component.
- Saves: only through `save` from `src/save.ts` (`save.load()` once, `save.update(patch)` merges and writes; `save.update(patch, 1000)` for frequent changes — portals limit writes). Every new field gets a default and a check in `parseSave()` so old saves keep loading.
- `src/platform/index.ts` wraps the platform in `guard()`: SDK errors are logged, hanging calls end after a time limit (`LIMITS`), a failed rewarded ad returns `false`. Never call the raw `none.ts` / SDK files directly. Check `platform.features` (`ads`, `purchases`, `leaderboard`) before showing buttons that depend on them.
- Purchases: only through `shop` from `src/shop.ts` (`shop.restore()` once at start, `shop.buy(id)`, `shop.has(id)`, `shop.product(id).price`, `shop.available`). Product ids live in `PRODUCTS` and must match the portal console; consumables get a grant function in `createShop(platform, grants)` and are consumed after delivery. Without an SDK purchases are emulated only under `npm run dev`.
- Portal SDKs (`--sdk=yandex|vk|crazygames|poki`) replace `src/platform/index.ts` and add `src/platform/<name>.ts`; script-loaded SDKs use `loadScript()` from `src/platform/script.ts`. A new SDK implements the whole `Platform` interface (falling back to `none.ts`) and gets a mock in `e2e/sdk-mock.ts`.
- Accessibility: every action works from the keyboard, gamepad and by touch; menus keep visible keyboard focus; no full-screen flashes; volume and "Effects" settings stay in the menu and the pause screen.
- Assets: many small images → an atlas (`npm run atlas`); Aseprite animations → `load.aseprite` + `anims.createFromAseprite`. `npm run size` must stay within the budget in `scripts/size.mjs`.
- Recipes for common changes are in `RECIPES.md` — follow them.

## Check before finishing

```bash
npm run check     # ESLint + tsc + Vitest + vite build + size budget — must pass
npm run test:e2e  # Playwright: game flow, levels, settings, replay, screenshots (first time: npx playwright install chromium)
npm run test:perf # optional: frame rate with a 4× slower CPU
```

Add a unit test for every new rule and a step in `e2e/game.spec.ts` for every new core mechanic. `e2e/sdk-mock.ts` serves fake Yandex, CrazyGames and Poki SDKs (records calls in `window.sdkCalls`), so portal builds are checked too; VK Bridge works only inside VK, so `--sdk=vk` runs in its no-SDK mode there. Format with `npm run format` (Prettier: no semicolons, double quotes, width 120).
