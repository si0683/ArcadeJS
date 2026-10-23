import Phaser from "phaser"

import { playSfx } from "../audio"
import { PLAYER } from "../config"
import { StateMachine } from "../fsm"
import type { Fx } from "../fx"
import type { Controls } from "../input"
import { pickPlayerState, START_MOVE, stepMovement, type MoveState, type PlayerState } from "../movement"

/** Hurt blinking time after a hit, ms */
const INVULNERABLE_MS = 1500

// The player: reads Controls, moves by src/movement.ts, picks animations by a state machine
// and adds the "juice" (dust, squash, stretch) at the right moments.
export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body
  readonly states: StateMachine<PlayerState>
  /** Movement timers (coyote time, jump buffer): the dev overlay shows them */
  move: MoveState = START_MOVE
  private lastVy = 0
  private invulnerableUntil = 0

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private fx: Fx,
  ) {
    super(scene, x, y, "player", 0)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCollideWorldBounds(true)
    this.body.setSize(14, 20).setOffset(5, 4)

    this.states = new StateMachine<PlayerState>({
      idle: { enter: () => this.still(0) },
      run: { enter: () => this.anims.play("player-walk", true) },
      jump: { enter: () => this.still(1) },
      fall: { enter: () => this.still(1) },
    })
    this.states.set("idle")
  }

  /** Called by the scene every frame; `dt` in ms */
  step(controls: Controls, time: number, dt: number) {
    // blocked — tiles and world bounds, touching — bodies such as moving platforms
    const onFloor = this.body.blocked.down || this.body.touching.down
    const r = stepMovement(
      this.move,
      { x: controls.axisX, jumpHeld: controls.isDown("jump"), jumpPressed: controls.justPressed("jump") },
      { vx: this.body.velocity.x, vy: this.body.velocity.y, onFloor },
      dt,
      PLAYER,
    )
    this.move = r.state
    this.setVelocity(r.vx, r.vy)
    // Heavier gravity while falling: the extra part on top of the world gravity
    this.body.setGravityY(this.scene.physics.world.gravity.y * (r.gravityScale - 1))
    if (r.vx !== 0) this.setFlipX(r.vx < 0)

    if (r.jumped) {
      playSfx(this.scene, "jump", 0.4)
      this.fx.dust(this.x, this.body.bottom, 4)
      this.fx.squash(this, -0.2) // stretch up on take-off
    }
    // Landing after a real fall: squash and a puff of dust
    if (onFloor && this.states.is("fall") && this.lastVy > 150) {
      this.fx.squash(this)
      this.fx.dust(this.x, this.body.bottom)
    }
    this.lastVy = this.body.velocity.y

    this.states.set(pickPlayerState({ vx: r.vx, vy: r.vy, onFloor: onFloor && !r.jumped }))
    this.states.update(dt)
    // Blinking while invulnerable after a hit
    this.setAlpha(this.isInvulnerable(time) && Math.floor(time / 80) % 2 ? 0.3 : 1)
  }

  /** Stop the walk animation on one frame */
  private still(frame: number) {
    this.anims.stop()
    this.setFrame(frame)
  }

  isInvulnerable(time: number) {
    return time < this.invulnerableUntil
  }

  /** Took a hit: blink for a while, flash white, bounce up a little */
  hurt(time: number, knockback: number) {
    this.invulnerableUntil = time + INVULNERABLE_MS
    this.fx.flash(this)
    this.setVelocityY(-knockback)
  }

  /**
   * Bounce up: off an enemy (holding jump bounces higher — the jump cut applies as usual)
   * or a spring (`holdable = false`: always the full height)
   */
  bounce(speed: number, holdable = true) {
    this.setVelocityY(-speed)
    this.move = { ...this.move, rising: holdable }
  }

  respawn(x: number, y: number) {
    this.setPosition(x, y).setVelocity(0, 0)
    this.move = START_MOVE
  }
}
