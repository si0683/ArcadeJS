import Phaser from "phaser"

import { StateMachine } from "../fsm"

// An enemy that wanders and chases the hero when it comes close. In Tiled: a point "slime" with
// optional properties speed (px/s) and sight (px). Two states through StateMachine:
// wander — a random direction every 1–2 s; chase — straight at the target.
export class Chaser extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body
  readonly states: StateMachine<"wander" | "chase">
  private turnIn = 0
  private speed = 40
  private sight = 90

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "slime")
    scene.add.existing(this)
    this.states = new StateMachine({
      wander: { enter: () => (this.turnIn = 0) },
      chase: { enter: () => this.scene.tweens.add({ targets: this, scaleY: 0.7, duration: 90, yoyo: true }) },
    })
  }

  /** Call after `group.add(chaser)`: a physics group resets body settings when it adopts a sprite */
  start(speed = 40, sight = 90) {
    this.speed = speed
    this.sight = sight
    this.body.setAllowGravity(false).setSize(16, 12).setOffset(4, 12)
    this.setCollideWorldBounds(true).setBounce(1)
    this.play("slime-walk")
    this.states.set("wander")
    return this
  }

  step(target: { x: number; y: number }, dt: number) {
    const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y)
    this.states.set(distance < this.sight ? "chase" : "wander")
    this.states.update(dt)
    if (this.states.is("chase")) {
      // A little faster when chasing
      this.scene.physics.moveToObject(this, target, this.speed * 1.4)
    } else if ((this.turnIn -= dt) <= 0) {
      this.turnIn = Phaser.Math.Between(1000, 2000)
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed)
    }
    this.setFlipX(this.body.velocity.x > 0)
  }
}
