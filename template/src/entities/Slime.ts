import Phaser from "phaser"

import { SLIME_SPEED } from "../config"

// A slime patrols its platform: turns around at walls and at edges.
// New enemies follow the same shape: a class with `start()` (after adding to the group) and `step()`.
export class Slime extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "slime")
    scene.add.existing(this)
  }

  /** Call after `group.add(slime)`: a physics group resets body settings when it adopts a sprite */
  start() {
    this.body.setSize(18, 14).setOffset(3, 10)
    this.setCollideWorldBounds(true).setVelocityX(-SLIME_SPEED)
    this.play("slime-walk")
    return this
  }

  step(ground: Phaser.Tilemaps.TilemapLayer) {
    const dir = Math.sign(this.body.velocity.x) || -1
    const ahead = ground.getTileAtWorldXY(this.x + dir * 10, this.y + 14)
    if (this.body.blocked.left || this.body.blocked.right || (this.body.blocked.down && !ahead?.collides)) {
      this.setVelocityX(-dir * SLIME_SPEED)
    }
    this.setFlipX(this.body.velocity.x > 0)
  }
}
