import type Phaser from "phaser"

// Scene changes with a fade instead of a hard cut. Use `goTo(this, "menu", data)` instead of
// `this.scene.start(...)`, and `fadeIn(this)` at the top of the next scene's create().

/** Fade colour: the menu background, so menu ↔ level reads as one flow */
const COLOR = { r: 29, g: 22, b: 48 }
export const FADE_MS = 250

/** Scenes that are fading out right now */
const leaving = new WeakSet<Phaser.Scene>()

/** Fade out, then start `key`. Works during a fade-in too; repeated calls are ignored */
export function goTo(scene: Phaser.Scene, key: string, data?: object, ms = FADE_MS) {
  if (leaving.has(scene)) return
  leaving.add(scene)
  scene.input.enabled = false
  scene.events.once("shutdown", () => {
    leaving.delete(scene)
    scene.input.enabled = true
  })
  const camera = scene.cameras.main
  camera.once("camerafadeoutcomplete", () => scene.scene.start(key, data))
  // force = true: cuts a fade-in that is still running
  camera.fade(ms, COLOR.r, COLOR.g, COLOR.b, true)
}

/** Fade in from the transition colour */
export function fadeIn(scene: Phaser.Scene, ms = FADE_MS) {
  scene.cameras.main.fadeIn(ms, COLOR.r, COLOR.g, COLOR.b)
}
