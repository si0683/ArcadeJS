import Phaser from "phaser"

import { FX } from "./config"
import { save } from "./save"

// "Juice": the small reactions that make a game feel alive — dust, sparkles, freeze frames,
// squash and stretch, floating numbers. One Fx per scene: `this.fx = new Fx(this)` in create().
// Screen-wide effects (shake, flashes, freeze) respect the "Effects" setting; particles stay —
// they carry information (where the coin was), not just intensity.

/** The player allowed strong screen effects (menu: Effects, key E) */
export const effectsOn = () => save.get().settings.effects

/** Small white textures for particles; PreloadScene calls this once */
export function makeFxTextures(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  g.fillStyle(0xffffff).fillRect(0, 0, 2, 2)
  g.generateTexture("fx-px", 2, 2)
  g.clear().fillStyle(0xffffff).fillCircle(3, 3, 3)
  g.generateTexture("fx-dot", 6, 6)
  g.destroy()
}

export class Fx {
  readonly dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter
  /** GameScene puts it into the glow layer */
  readonly sparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter
  private freezeUntil = 0

  constructor(private scene: Phaser.Scene) {
    // Emitters are pooled: create once, call explode() as often as needed
    this.dustEmitter = scene.add
      .particles(0, 0, "fx-dot", {
        lifespan: { min: 250, max: 450 },
        speedX: { min: -40, max: 40 },
        speedY: { min: -30, max: -5 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 0.8, end: 0 },
        tint: 0xe8dcc0,
        emitting: false,
      })
      .setDepth(5)
    this.sparkEmitter = scene.add
      .particles(0, 0, "fx-px", {
        lifespan: { min: 300, max: 600 },
        speed: { min: 40, max: 140 },
        angle: { min: 0, max: 360 },
        gravityY: 200,
        scale: { start: 1.5, end: 0 },
        emitting: false,
      })
      .setDepth(5)
  }

  /** Puff of dust at the feet: landing, jump take-off */
  dust(x: number, y: number, count = 6) {
    this.dustEmitter.explode(count, x, y)
  }

  /** Burst of sparks: coin, enemy defeated */
  sparks(x: number, y: number, color = 0xffd34d, count = 12) {
    this.sparkEmitter.setParticleTint(color)
    this.sparkEmitter.explode(count, x, y)
  }

  /** Camera shake; `intensity` is a share of the screen */
  shake(intensity = FX.shake, duration = 150) {
    if (effectsOn()) this.scene.cameras.main.shake(duration, intensity)
  }

  /**
   * Freeze frames: the world stops for a moment on an impact so it reads as heavy.
   * Only physics freezes — timers, tweens and the HUD keep running.
   */
  hitstop(ms = FX.hitstop) {
    if (!effectsOn() || ms <= 0) return
    const world = (this.scene.physics as Phaser.Physics.Arcade.ArcadePhysics | undefined)?.world
    if (!world) return
    const now = this.scene.time.now
    if (this.freezeUntil > now) return
    this.freezeUntil = now + ms
    world.timeScale = 1000
    this.scene.time.delayedCall(ms, () => (world.timeScale = 1))
  }

  /** The sprite turns solid white for a moment: it was hit */
  flash(target: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image, ms = 90) {
    if (!effectsOn()) return
    target.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL)
    // clearTint() also brings the normal tint mode back
    this.scene.time.delayedCall(ms, () => target.clearTint())
  }

  /** Squash (amount > 0: wider and lower) or stretch (amount < 0), springing back */
  squash(target: Phaser.GameObjects.Components.Transform, amount = FX.squash, ms = 90) {
    this.scene.tweens.killTweensOf(target)
    target.setScale(1 + amount, 1 - amount)
    this.scene.tweens.add({ targets: target, scaleX: 1, scaleY: 1, duration: ms * 2, ease: "Back.Out" })
  }

  /** "+1" that floats up and fades */
  popText(x: number, y: number, text: string, color = "#ffd34d") {
    const label = this.scene.add
      .text(x, y, text, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        color,
        stroke: "#1d1630",
        strokeThickness: 3,
        resolution: 4,
      })
      .setOrigin(0.5)
      .setDepth(10)
    this.scene.tweens.add({
      targets: label,
      y: y - 18,
      alpha: 0,
      duration: 600,
      ease: "Cubic.Out",
      onComplete: () => label.destroy(),
    })
  }
}
