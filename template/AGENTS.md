# AGENTS.md — rules for AI coding agents

2D browser game on **Vite + Phaser 4 + TypeScript**, levels made in **Tiled**. Created with `npm create gamemonsterjs2d`.

## Phaser docs for agents

Phaser ships its own skills: `node_modules/phaser/skills/<topic>/SKILL.md` (scenes, sprites-and-images, animations, physics-arcade, physics-matter, tilemaps, input-keyboard-mouse-touch, audio-and-sound, cameras, tweens, particles, v3-to-v4-migration…). Read the relevant one before writing Phaser code. This is **Phaser 4**: no `setTintFill` (use `setTint().setTintMode(Phaser.TintModes.FILL)`), FX and masks are filters, `roundPixels` defaults to false. Do not copy Phaser 3 snippets blindly.

## Structure

- `src/main.ts` — game config: size 960×540 (`Scale.FIT`), `pixelArt`, physics, list of scenes.
- `src/config.ts` — balance numbers (speed, jump, lives, zoom) and text style.
- `src/scenes/` — `PreloadScene` (all assets + animations) → `MenuScene` → `GameScene` (level) + `HudScene` (score, lives, touch buttons, runs in parallel, no zoom).
- `public/assets/maps/level1.tmj` — Tiled map (JSON). Layers: `decor` (tiles, no collision), `ground` (tiles), `objects` (points by **name**: `player`, `coin`, `slime`, `flag`). Tileset `tiles` is embedded, image `maps/tiles.png`, tiles 18×18. Tile properties: `collides` (solid), `hazard` (hurts).
- `public/assets/sprites|sounds` — loaded with `this.load.setPath("assets")`.
- Shared state goes through `this.registry` (`score`, `lives`); HUD listens to `changedata`.

## Rules

- Physics: Arcade by default. Matter.js is built into Phaser (`physics: { default: "matter" }`, `this.matter.add…`) — never install the separate `matter-js` package.
- Sound: Phaser's sound manager (`this.load.audio`, `this.sound.play`). No Howler. Start music only after user input (browsers block autoplay) — the menu waits for a click/key.
- New level: edit or copy the map in Tiled, keep layer and object names, load it in `PreloadScene` with `tilemapTiledJSON`.
- New asset: put it into `public/assets/…`, load it in `PreloadScene`, add a line to `public/assets/CREDITS.md`.
- Controls must work with keyboard and touch (`HudScene.touch`).
- Asset paths are relative (`base: "./"` in vite.config.ts), so the build runs from any folder and GitHub Pages.
- In dev mode `window.game` is the Phaser.Game: test with `game.scene.getScene("game")`.
- Texts for players in Russian by default; code comments in English.

## Check before finishing

```bash
npm run build   # tsc + vite build
```
