import type Phaser from "phaser"

// Bitmap fonts drawn at start-up from any CSS font, with Cyrillic: no font files to make or load.
// A BitmapText is a row of images from one texture — changing its text costs almost nothing, while
// a Text redraws a canvas and re-uploads it to the GPU every time. Use it for numbers that change every
// frame or many labels (score, timer, damage numbers); keep Text for menus with word wrap.
//   makeBitmapFont(this, "hud", { size: 26 })                 // PreloadScene, once
//   this.add.bitmapText(20, 16, "hud", "Монеты: 0")          // any scene

export interface BitmapFontStyle {
  /** CSS font family (a web font must be loaded before) */
  fontFamily?: string
  /** px */
  size?: number
  bold?: boolean
  color?: string
  stroke?: string
  strokeThickness?: number
  /** Characters the font has; others are skipped when drawn */
  chars?: string
}

export const LATIN = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"
export const CYRILLIC = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя"
export const SYMBOLS = "«»—–…№★☆♥←→↑↓·×"

/** Glyph layout in a square-ish texture: x, y, width of every char (a plain function — tested) */
export function layoutGlyphs(widths: number[], cellHeight: number, maxWidth = 1024, pad = 2) {
  const positions: { x: number; y: number }[] = []
  let x = pad
  let y = pad
  for (const w of widths) {
    if (x + w + pad > maxWidth) {
      x = pad
      y += cellHeight + pad
    }
    positions.push({ x, y })
    x += w + pad
  }
  return { positions, width: maxWidth, height: y + cellHeight + pad }
}

export function makeBitmapFont(scene: Phaser.Scene, key: string, style: BitmapFontStyle = {}) {
  const {
    fontFamily = "system-ui, sans-serif",
    size = 26,
    bold = true,
    color = "#ffffff",
    stroke = "#1d1630",
    strokeThickness = Math.round(size / 4.5),
    chars = LATIN + CYRILLIC + SYMBOLS,
  } = style
  const font = `${bold ? "bold " : ""}${size}px ${fontFamily}`
  const measure = document.createElement("canvas").getContext("2d")!
  measure.font = font
  const list = [...new Set(chars)]
  const extra = strokeThickness
  const widths = list.map((c) => Math.ceil(measure.measureText(c).width) + extra)
  const cellHeight = Math.ceil(size * 1.3) + extra
  const { positions, width, height } = layoutGlyphs(widths, cellHeight)

  const texture = scene.textures.createCanvas(key, width, height)!
  const ctx = texture.getContext()
  ctx.font = font
  ctx.textBaseline = "top"
  ctx.lineJoin = "round"
  ctx.lineWidth = strokeThickness
  ctx.strokeStyle = stroke
  ctx.fillStyle = color
  list.forEach((c, i) => {
    const { x, y } = positions[i]
    const left = x + extra / 2
    const top = y + extra / 2 + size * 0.1
    if (strokeThickness > 0) ctx.strokeText(c, left, top)
    ctx.fillText(c, left, top)
  })
  texture.refresh()

  // The same data a BMFont .xml gives (see Phaser's ParseXMLBitmapFont)
  const data = { font: key, size, lineHeight: cellHeight, retroFont: false, chars: {} as Record<number, unknown> }
  list.forEach((c, i) => {
    const { x, y } = positions[i]
    const w = widths[i]
    data.chars[c.charCodeAt(0)] = {
      x,
      y,
      width: w,
      height: cellHeight,
      centerX: Math.floor(w / 2),
      centerY: Math.floor(cellHeight / 2),
      xOffset: 0,
      yOffset: 0,
      // Glyphs overlap by the stroke so the letters keep their normal spacing
      xAdvance: w - extra,
      data: {},
      kerning: {},
      u0: x / width,
      v0: 1 - y / height,
      u1: (x + w) / width,
      v1: 1 - (y + cellHeight) / height,
    }
  })
  scene.cache.bitmapFont.add(key, { data, texture: key, frame: null })
}
