import Phaser from "phaser"

import { playSfx } from "../audio"
import type { Fx } from "../fx"
import type { Controls } from "../input"
import { HERO, START_TOPDOWN, stepTopDown, type TopDownState } from "../topdown"

/** Blinking time after a hit, ms */
const INVULNERABLE_MS = 1200

// The top-down hero: walks in eight directions (src/topdown.ts), dashes with the "jump" action,
// is invulnerable while dashing and for a while after a hit.
export class Hero extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body
  move: TopDownState = START_TOPDOWN
  private invulnerableUntil = 0
  private trail = 0

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private fx: Fx,
  ) {
    super(scene, x, y, "player", 0)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCollideWorldBounds(true).setDepth(5)
    this.body.setAllowGravity(false)
    // Feet only: walls overlap the head a little, as in most top-down games
    this.body.setSize(12, 10).setOffset(6, 14)
  }

  step(controls: Controls, time: number, dt: number) {
    const r = stepTopDown(
      this.move,
      { x: controls.axisX, y: controls.axisY, dashPressed: controls.justPressed("jump") },
      { vx: this.body.velocity.x, vy: this.body.velocity.y },
      dt,
      HERO,
    )
    this.move = r.state
    this.setVelocity(r.vx, r.vy)
    if (r.vx !== 0) this.setFlipX(r.vx < 0)

    if (r.dashed) {
      playSfx(this.scene, "jump", 0.4)
      this.fx.squash(this, -0.25)
    }
    // Dust behind a dash
    if (this.isDashing() && (this.trail += dt) > 30) {
      this.trail = 0
      this.fx.dust(this.x, this.y + 8, 2)
    }

    const moving = Math.hypot(r.vx, r.vy) > 15
    if (moving) this.anims.play("player-walk", true)
    else {
      this.anims.stop()
      this.setFrame(0)
    }
    this.setAlpha(this.isInvulnerable(time) && Math.floor(time / 80) % 2 ? 0.3 : 1)
  }

  isDashing() {
    return this.move.dash > 0
  }

  isInvulnerable(time: number) {
    return time < this.invulnerableUntil || this.isDashing()
  }

  /** Took a hit: knocked away from the attacker */
  hurt(time: number, fromX: number, fromY: number) {
    this.invulnerableUntil = time + INVULNERABLE_MS
    this.fx.flash(this)
    const angle = Phaser.Math.Angle.Between(fromX, fromY, this.x, this.y)
    this.setVelocity(Math.cos(angle) * 220, Math.sin(angle) * 220)
  }

  respawn(x: number, y: number) {
    this.setPosition(x, y).setVelocity(0, 0)
    this.move = START_TOPDOWN
  }
}
