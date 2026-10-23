import Phaser from "phaser"

import { effectsOn } from "./fx"

// The "look" of the game: Phaser 4 filters (WebGL only).
//   camera  — a soft vignette pulls the eye to the centre, a light colour grade adds punch;
//   glow    — a layer whose objects glow (coins, sparks, magic): one filter pass for all of them.
// Canvas renderer or the "Effects" setting off — no filters, the game looks plain but works the same.

export const LOOK = {
  /** Vignette: radius (keep ≥ 0.71 so the corners are inside) and strength (0.1 — subtle) */
  vignetteRadius: 0.8,
  vignetteStrength: 0.12,
  /** Colour grade: saturation boost (0 — none) */
  saturation: 0.12,
  glowColor: 0xffe08a,
  /** Glow strength around objects of the glow layer */
  glowStrength: 3,
}

export class Look {
  private filters: Phaser.Filters.Controller[] = []
  private readonly webgl: boolean

  constructor(private camera: Phaser.Cameras.Scene2D.Camera) {
    this.webgl = camera.scene.game.renderer.type === Phaser.WEBGL && !!camera.filters
    if (!this.webgl) return
    const grade = camera.filters.internal.addColorMatrix()
    grade.colorMatrix.saturate(LOOK.saturation)
    const vignette = camera.filters.external.addVignette(0.5, 0.5, LOOK.vignetteRadius, LOOK.vignetteStrength)
    this.filters.push(grade, vignette)
    this.setEnabled(effectsOn())
  }

  /** A layer whose objects glow: `glow.add(coin)` */
  glowLayer(): Phaser.GameObjects.Layer {
    const layer = this.camera.scene.add.layer()
    if (this.webgl) {
      layer.enableFilters()
      this.filters.push(layer.filters!.internal.addGlow(LOOK.glowColor, LOOK.glowStrength, 0, 1, false, 10, 6))
      this.setEnabled(effectsOn())
    }
    return layer
  }

  /** The menu setting "Effects" */
  setEnabled(on: boolean) {
    for (const filter of this.filters) filter.setActive(on)
  }
}
