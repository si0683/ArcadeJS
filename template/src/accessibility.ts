import type Phaser from "phaser"

import { LIVES } from "./config"
import type { Key } from "./i18n"
import { save, type ColorMode } from "./save"

// Accessibility settings (SettingsScene) in one place:
//   colours   — a filter on the game camera: higher contrast, or colours shifted so that players with
//               protanopia, deuteranopia or tritanopia can tell red/green or blue/yellow apart (daltonize)
//   captions  — sound effects as short texts at the bottom of the screen (HudScene)
//   speed     — the whole level runs at 80% or 60%: more time to react, the same game
//   help      — two extra lives and "Skip level" in the pause menu
// They stay on with "Effects" off: they help to play, they are not decoration.

type Matrix3 = number[][]

/** How a colour-blind eye sees sRGB colours (Viénot et al. 1999, the common simplified form) */
const SIMULATE: Record<"protan" | "deutan" | "tritan", Matrix3> = {
  protan: [
    [0.56667, 0.43333, 0],
    [0.55833, 0.44167, 0],
    [0, 0.24167, 0.75833],
  ],
  deutan: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7],
  ],
  tritan: [
    [0.95, 0.05, 0],
    [0, 0.43333, 0.56667],
    [0, 0.475, 0.525],
  ],
}
/** Where the lost difference goes: into the channels the eye still tells apart */
const SHIFT: Matrix3 = [
  [0, 0, 0],
  [0.7, 1, 0],
  [0.7, 0, 1],
]

const multiply = (a: Matrix3, b: Matrix3): Matrix3 =>
  a.map((row) => b[0].map((_, j) => row.reduce((sum, value, k) => sum + value * b[k][j], 0)))

/** The 4×5 colour matrix of a mode (Phaser ColorMatrix layout); identity for "normal" */
export function colorMatrix(mode: ColorMode): number[] {
  if (mode === "normal") return [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]
  if (mode === "contrast") {
    // +35% contrast and +25% saturation: edges and coloured objects stand out from the background
    const c = 1.35
    const o = -0.5 * (c - 1)
    const s = 1.25
    const l = [0.3086, 0.6094, 0.082].map((w) => w * (1 - s))
    const sat = [0, 1, 2].map((i) => [0, 1, 2].map((j) => l[j] + (i === j ? s : 0)))
    return sat.flatMap((row) => [...row.map((v) => v * c), 0, o]).concat([0, 0, 0, 1, 0])
  }
  // Daltonize: original + shift × (original − simulated) = (I + SHIFT × (I − S)) × original
  const identity: Matrix3 = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]
  const lost = identity.map((row, i) => row.map((v, j) => v - SIMULATE[mode][i][j]))
  const fix = multiply(SHIFT, lost).map((row, i) => row.map((v, j) => v + identity[i][j]))
  return fix.flatMap((row) => [...row, 0, 0]).concat([0, 0, 0, 1, 0])
}

const filters = new WeakMap<Phaser.Cameras.Scene2D.Camera, Phaser.Filters.ColorMatrix>()

/** Applies the colour setting to a camera (WebGL); call again after the setting changes */
export function applyColorMode(camera: Phaser.Cameras.Scene2D.Camera) {
  // WebGL only (filters); a type-only Phaser import keeps this file testable without a browser
  if (!("gl" in camera.scene.game.renderer) || !camera.filters) return
  let filter = filters.get(camera)
  const mode = save.get().settings.colors
  if (!filter) {
    if (mode === "normal") return
    filter = camera.filters.external.addColorMatrix()
    filters.set(camera, filter)
  }
  filter.colorMatrix.set(colorMatrix(mode))
  filter.setActive(mode !== "normal")
}

/** Lives at the level start: two more with help on */
export function startLives(): number {
  return LIVES + (save.get().settings.assist ? 2 : 0)
}

/** "Skip level" in the pause menu */
export const canSkipLevel = () => save.get().settings.assist

/**
 * The game speed setting for a level: physics, timers and tweens run slower together.
 * Arcade's timeScale works the other way round (2 — half speed).
 */
export function applyGameSpeed(scene: Phaser.Scene) {
  const speed = save.get().settings.gameSpeed
  scene.physics.world.timeScale = 1 / speed
  scene.time.timeScale = speed
  scene.tweens.timeScale = speed
}

/** What a sound says, for captions: sound key → i18n key. Sounds without a caption stay silent on screen */
export const CAPTIONS: Partial<Record<string, Key>> = {
  jump: "sndJump",
  coin: "sndCoin",
  hurt: "sndHurt",
  win: "sndWin",
}
