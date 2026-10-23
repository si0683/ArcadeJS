import type Phaser from "phaser"

import type { Level } from "./levels"

/**
 * Queues what a level needs and is not loaded yet: its Tiled map and its own assets (content/levels.json →
 * "assets"). Called from GameScene.preload(), so the files load when the level starts — a game with
 * 50 levels still opens fast. Files stay cached: replaying the level loads nothing.
 */
export function loadLevel(scene: Phaser.Scene, level: Level) {
  const load = scene.load.setPath("assets")
  if (!scene.cache.tilemap.exists(level.key)) load.tilemapTiledJSON(level.key, level.file)
  for (const asset of level.assets ?? []) {
    if (asset.type === "audio") {
      if (!scene.cache.audio.exists(asset.key)) load.audio(asset.key, asset.url)
    } else if (!scene.textures.exists(asset.key)) {
      if (asset.type === "spritesheet") {
        load.spritesheet(asset.key, asset.url, { frameWidth: asset.frameWidth!, frameHeight: asset.frameHeight! })
      } else load.image(asset.key, asset.url)
    }
  }
}
