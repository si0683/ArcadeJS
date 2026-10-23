# AGENTS.md — rules for AI coding agents

2D browser game on **Vite + Phaser 4 + TypeScript**, levels made in **Tiled**. Created with `npm create gamemonsterjs2d`.

## Phaser docs for agents

Phaser ships its own skills: `node_modules/phaser/skills/<topic>/SKILL.md` (scenes, sprites-and-images, animations, physics-arcade, physics-matter, tilemaps, input-keyboard-mouse-touch, audio-and-sound, cameras, tweens, particles, v3-to-v4-migration…). Read the relevant one before writing Phaser code. This is **Phaser 4**: no `setTintFill` (use `setTint().setTintMode(Phaser.TintModes.FILL)`), FX and masks are filters, `roundPixels` defaults to false. Do not copy Phaser 3 snippets blindly.

`PROMT.md` is the user's game design document; the whole file is the prompt. When the user asks to build from it, follow it: plan and questions first (including every unfilled `«…»` field), then stages; the rules below stay in force.

## Structure

- `src/main.ts` — game config: size 960×540 (`Scale.FIT`), `pixelArt`, physics, gamepad, list of scenes; error capture; dev tools in `npm run dev`.
- `src/config.ts` — balance numbers: `GRAVITY`, `PLAYER` (movement tuning), `CAMERA`, `FX`, lives, points, text style. Objects, not constants, so the dev panel (F2) can change them live.
- `src/scenes/` — `PreloadScene` (all assets + animations + particle textures) → `MenuScene` → `GameScene` (level) + `HudScene` (score, lives, touch buttons, runs in parallel, no zoom) + `PauseScene` (over the level).
- `src/entities/` — `Player` (movement, state machine, juice) and `Slime`: one class per entity with `start()`/`step()`; scenes only wire them up.
- `src/movement.ts` — platformer movement as plain math (acceleration, coyote time, jump buffer, variable jump, fall gravity) + `pickPlayerState`, tested in `movement.test.ts`; `src/fsm.ts` — `StateMachine` for entities.
- `src/input.ts` — `Controls`: actions (`left right up down jump pause confirm`) from keyboard, gamepad and HUD touch buttons; `justPressed`/`isDown`/`justReleased`/`axisX`.
- `src/fx.ts` — `Fx`: dust, sparks, pop text, squash, flash, hitstop, shake (respect the "Effects" setting); `src/look.ts` — camera filters (vignette, colour grade) and `glowLayer()`; `src/transition.ts` — `goTo()`/`fadeIn()` scene fades; `src/ui.ts` — `MenuList` (keyboard/gamepad/pointer menu with visible focus).
- `src/telemetry.ts` — `track()` events, `captureErrors()`, sinks; `src/cheats.ts` — dev switches; `src/debug/` — dev tools (F1 overlay, F2 Tweakpane tuning, F3 hitboxes, F4 god mode, F6 win), loaded only under `npm run dev`.
- `scripts/` — `zip.mjs` (portal archive), `atlas.mjs` (`npm run atlas`: `art/atlas/<name>/*.png` → `public/assets/atlas/<name>.png|json`), `size.mjs` (`npm run size`: JS gzip and total size budget, part of `npm run check`).
- `public/assets/maps/level1.tmj` — Tiled map (JSON). Layers: `decor` (tiles, no collision), `ground` (tiles), `objects` (points by **name**: `player`, `coin`, `slime`, `flag`). Tileset `tiles` is embedded, image `maps/tiles.png`, tiles 18×18. Tile properties: `collides` (solid), `hazard` (hurts).
- `public/assets/sprites|sounds` — loaded with `this.load.setPath("assets")`.
- Shared state goes through `this.registry` (`score`, `lives`); HUD listens to `changedata`.
- `src/rules.ts` — game rules as plain functions (stomp, record, lives) with tests in `src/rules.test.ts`; `src/save.ts` — the one save record (best + settings: sound, music, effects) with `parseSave` and `save.update()`; `src/audio.ts` — `playSfx` / `playMusic` / `updateMusicVolume` apply the volume settings; `src/i18n.ts` — texts.
- `e2e/game.spec.ts` — Playwright check of the running game (menu settings, shop, run, jump, pause); `RECIPES.md` — step-by-step recipes (enemy, level, sound, save field, screen, language, purchase, assets, accessibility, performance, juice, filters, Aseprite, atlas, controls, live tuning, state machine, analytics, genre libraries).

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
npm run test:e2e  # Playwright: the game loads, starts and the player moves (first time: npx playwright install chromium)
```

Add a unit test for every new rule and a step in `e2e/game.spec.ts` for every new core mechanic. `e2e/sdk-mock.ts` serves fake Yandex, CrazyGames and Poki SDKs (records calls in `window.sdkCalls`), so portal builds are checked too; VK Bridge works only inside VK, so `--sdk=vk` runs in its no-SDK mode there. Format with `npm run format` (Prettier: no semicolons, double quotes, width 120).
