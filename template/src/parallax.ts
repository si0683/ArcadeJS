import type Phaser from "phaser"

// Background layers that scroll slower than the level: far hills, near hills, clouds.
// Depth is read from the speed: 0 — stays on screen, 1 — moves with the level.
// The textures are drawn in code (makeLevelTextures); swap them for your art: load images
// with the same keys in PreloadScene and remove the drawing.

/** Draws hill silhouettes and a spring; PreloadScene calls this once */
export function makeLevelTextures(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  // Rolling hills: a sum of two waves drawn in 4 px columns (pixel-art steps); the width is a whole
  // number of both waves, so the texture tiles without a seam
  const hills = (key: string, color: number, height: number, low: number, high: number, waves: [number, number]) => {
    const width = 512
    g.clear().fillStyle(color)
    for (let x = 0; x < width; x += 4) {
      const a = Math.sin((x / width) * Math.PI * 2 * waves[0])
      const b = Math.sin((x / width) * Math.PI * 2 * waves[1] + 1.3)
      const h = low + ((a * 0.65 + b * 0.35 + 1) / 2) * (high - low)
      g.fillRect(x, height - Math.round(h / 4) * 4, 4, height)
    }
    g.generateTexture(key, width, height)
  }
  hills("bg-hills-far", 0xa9d8ee, 160, 60, 130, [2, 5])
  hills("bg-hills-near", 0x8cc7a5, 120, 34, 80, [3, 7])
  // Spring: base + coil + top plate, 18×12
  g.clear()
  g.fillStyle(0x5b5f78).fillRect(1, 9, 16, 3)
  g.fillStyle(0xc9ccd8).fillRect(4, 4, 10, 2).fillRect(4, 7, 10, 2)
  g.fillStyle(0xe5484d).fillRect(0, 0, 18, 4)
  g.generateTexture("spring", 18, 12)
  g.destroy()
}

/** Adds the background layers under the level; call before the tilemap layers */
export function addParallax(scene: Phaser.Scene, worldWidth: number, worldHeight: number) {
  const { width } = scene.scale
  const layer = (key: string, speed: number, height: number) =>
    scene.add
      .tileSprite(0, worldHeight - height, Math.max(width, worldWidth * speed + width), height, key)
      .setOrigin(0, 0)
      .setScrollFactor(speed, 1)
  layer("bg-hills-far", 0.2, 160)
  layer("bg-hills-near", 0.45, 120)
  // Clouds drift a little on their own
  for (let i = 0; i < Math.ceil(worldWidth / 220); i++) {
    const cloud = scene.add
      .image(i * 220 + (i % 3) * 40, 20 + (i % 4) * 14, "cloud")
      .setScrollFactor(0.15, 1)
      .setAlpha(0.9)
    scene.tweens.add({ targets: cloud, x: cloud.x + 30, duration: 6000 + i * 500, yoyo: true, repeat: -1 })
  }
}
