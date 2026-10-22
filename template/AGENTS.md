# AGENTS.md — rules for AI coding agents

2D browser game on **Vite + Phaser 4 + TypeScript**, levels made in **Tiled**. Created with `npm create gamemonsterjs2d`.

## Phaser docs for agents

Phaser ships its own skills: `node_modules/phaser/skills/<topic>/SKILL.md` (scenes, sprites-and-images, animations, physics-arcade, physics-matter, tilemaps, input-keyboard-mouse-touch, audio-and-sound, cameras, tweens, particles, v3-to-v4-migration…). Read the relevant one before writing Phaser code. This is **Phaser 4**: no `setTintFill` (use `setTint().setTintMode(Phaser.TintModes.FILL)`), FX and masks are filters, `roundPixels` defaults to false. Do not copy Phaser 3 snippets blindly.

`PROMT.md` is the user's game design document; the whole file is the prompt. When the user asks to build from it, follow it: plan and questions first (including every unfilled `«…»` field), then stages; the rules below stay in force.

## Structure

- `src/main.ts` — game config: size 960×540 (`Scale.FIT`), `pixelArt`, physics, list of scenes.
- `src/config.ts` — balance numbers (speed, jump, lives, zoom) and text style.
- `src/scenes/` — `PreloadScene` (all assets + animations) → `MenuScene` → `GameScene` (level) + `HudScene` (score, lives, touch buttons, runs in parallel, no zoom).
- `public/assets/maps/level1.tmj` — Tiled map (JSON). Layers: `decor` (tiles, no collision), `ground` (tiles), `objects` (points by **name**: `player`, `coin`, `slime`, `flag`). Tileset `tiles` is embedded, image `maps/tiles.png`, tiles 18×18. Tile properties: `collides` (solid), `hazard` (hurts).
- `public/assets/sprites|sounds` — loaded with `this.load.setPath("assets")`.
- Shared state goes through `this.registry` (`score`, `lives`); HUD listens to `changedata`.
- `src/rules.ts` — game rules as plain functions (stomp, record, lives) with tests in `src/rules.test.ts`; `src/save.ts` — the one save record (best + settings) with `parseSave` and `save.update()`; `src/audio.ts` — `playSfx` / `playMusic` apply the volume settings; `src/i18n.ts` — texts.
- `e2e/game.spec.ts` — Playwright check of the running game; `RECIPES.md` — step-by-step recipes (enemy, level, sound, save field, screen, language, assets, accessibility, performance).

## Rules

- Physics: Arcade by default. Matter.js is built into Phaser (`physics: { default: "matter" }`, `this.matter.add…`) — never install the separate `matter-js` package.
- Sound: Phaser's sound manager, played only through `playSfx(scene, key, volume)` / `playMusic()` from `src/audio.ts` so the menu volume settings (S / M) apply. No Howler. Start music only after user input (browsers block autoplay) — the menu waits for a click/key.
- New level: edit or copy the map in Tiled, keep layer and object names, load it in `PreloadScene` with `tilemapTiledJSON`.
- New asset: put it into `public/assets/…`, load it in `PreloadScene`, add a line to `public/assets/CREDITS.md`.
- Controls must work with keyboard and touch (`HudScene.touch`).
- Asset paths are relative (`base: "./"` in vite.config.ts), so the build runs from any folder and GitHub Pages.
- In dev mode `window.game` is the Phaser.Game and `window.save` the save store: test with `game.scene.getScene("game")`; `e2e/` uses them too.
- Platform: game code never calls a portal SDK directly — only `platform` from `src/platform` (`init`, `ready` after loading, `gameplayStart`/`gameplayStop` around actual play, `showFullscreenAd` only at logical pauses, `showRewardedAd`, `loadData`/`saveData`, `submitScore`, `lang`, `onPause`/`onResume`). This project uses `none.ts` (localStorage, browser language, no ads). Player texts live in `src/i18n.ts` and follow `platform.lang`. `npm run zip` packs `dist/` into `game.zip` for game portals.
- Texts for players in Russian by default; code comments in English.
- Game rules (scoring, win/lose, records, damage) are plain functions in `src/rules.ts` without engine code, each with a test in `src/rules.test.ts`. New mechanics follow the same split: the rule in `rules.ts`, the engine glue in the scene/component.
- Saves: only through `save` from `src/save.ts` (`save.load()` once, `save.update(patch)` merges and writes; `save.update(patch, 1000)` for frequent changes — portals limit writes). Every new field gets a default and a check in `parseSave()` so old saves keep loading.
- `src/platform/index.ts` wraps the platform in `guard()`: SDK errors are logged, hanging calls end after a time limit (`LIMITS`), a failed rewarded ad returns `false`. Never call the raw `none.ts` / `yandex.ts` directly.
- Accessibility: every action works from the keyboard and by touch; menus keep visible keyboard focus; no full-screen flashes; volume settings stay in the menu.
- Recipes for common changes are in `RECIPES.md` — follow them.

## Check before finishing

```bash
npm run check     # ESLint + tsc + Vitest + vite build — must pass
npm run test:e2e  # Playwright: the game loads, starts and the player moves (first time: npx playwright install chromium)
```

Add a unit test for every new rule and a step in `e2e/game.spec.ts` for every new core mechanic. `e2e/sdk-mock.ts` serves a fake portal SDK at `/sdk.js` (records calls in `window.sdkCalls`), so `--sdk=yandex` builds are checked too; extend it when a new SDK is added. Format with `npm run format` (Prettier: no semicolons, double quotes, width 120).
