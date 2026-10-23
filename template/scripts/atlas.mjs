// Packs loose PNG sprites into texture atlases: fewer files to download and fewer texture switches
// for the GPU (many sprites draw in one batch). Pure JS, no native tools.
//
//   art/atlas/<name>/**/*.png   →   public/assets/atlas/<name>.png + <name>.json (Phaser JSON Hash)
//
// Frame names are file paths without ".png": art/atlas/items/coin.png → frame "coin",
// art/atlas/hero/run/1.png → "run/1". Load: this.load.atlas("items", "atlas/items.png", "atlas/items.json"),
// draw: this.add.image(x, y, "items", "coin"). Run: npm run atlas
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join, relative, sep } from "node:path"

import { MaxRectsPacker } from "maxrects-packer"
import { PNG } from "pngjs"

const SOURCE = "art/atlas"
const TARGET = "public/assets/atlas"
const MAX_SIZE = 4096
/** Empty pixels between frames, and edge pixels copied around each frame: no bleeding when scaled */
const PADDING = 2
const EXTRUDE = 1

if (!existsSync(SOURCE)) {
  console.log(`${SOURCE}/ not found: put sprites into ${SOURCE}/<atlas name>/*.png and run again`)
  process.exit(0)
}

const pngs = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return pngs(path)
    return name.toLowerCase().endsWith(".png") ? [path] : []
  })

mkdirSync(TARGET, { recursive: true })

for (const atlas of readdirSync(SOURCE).filter((name) => statSync(join(SOURCE, name)).isDirectory())) {
  const dir = join(SOURCE, atlas)
  const sprites = pngs(dir)
    .sort()
    .map((path) => ({
      name: relative(dir, path)
        .split(sep)
        .join("/")
        .replace(/\.png$/i, ""),
      png: PNG.sync.read(readFileSync(path)),
    }))
  if (sprites.length === 0) continue

  const packer = new MaxRectsPacker(MAX_SIZE, MAX_SIZE, PADDING, { smart: true, pot: true, square: false })
  for (const sprite of sprites) {
    packer.add(sprite.png.width + EXTRUDE * 2, sprite.png.height + EXTRUDE * 2, sprite)
  }
  if (packer.bins.length > 1) {
    console.error(`${atlas}: does not fit into ${MAX_SIZE}×${MAX_SIZE} — split it into two folders`)
    process.exit(1)
  }

  const bin = packer.bins[0]
  const out = new PNG({ width: bin.width, height: bin.height })
  const frames = {}
  for (const rect of bin.rects) {
    const { name, png } = rect.data
    const x = rect.x + EXTRUDE
    const y = rect.y + EXTRUDE
    // Copy the sprite, then smear its border pixels into the extrude margin
    for (let dy = -EXTRUDE; dy < png.height + EXTRUDE; dy++) {
      for (let dx = -EXTRUDE; dx < png.width + EXTRUDE; dx++) {
        const sx = Math.min(png.width - 1, Math.max(0, dx))
        const sy = Math.min(png.height - 1, Math.max(0, dy))
        png.data.copy(
          out.data,
          ((y + dy) * bin.width + x + dx) * 4,
          (sy * png.width + sx) * 4,
          (sy * png.width + sx) * 4 + 4,
        )
      }
    }
    frames[name] = {
      frame: { x, y, w: png.width, h: png.height },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: png.width, h: png.height },
      sourceSize: { w: png.width, h: png.height },
    }
  }

  writeFileSync(join(TARGET, `${atlas}.png`), PNG.sync.write(out))
  const meta = {
    app: "GameMonsterJS2D scripts/atlas.mjs",
    image: `${atlas}.png`,
    size: { w: bin.width, h: bin.height },
    scale: 1,
  }
  writeFileSync(join(TARGET, `${atlas}.json`), `${JSON.stringify({ frames, meta }, null, 1)}\n`)
  console.log(`${atlas}: ${sprites.length} frames → ${TARGET}/${atlas}.png (${bin.width}×${bin.height})`)
}
