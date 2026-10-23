import Phaser from "phaser"

import { PLATFORM_SPEED } from "../config"

// A platform that moves back and forth. In Tiled: a rectangle object named "platform" in the layer
// "objects" (its width = platform width, multiple of 18) with properties dx / dy — how far it travels
// in pixels — and speed (px/s). The player rides it: the body is immovable and moves by velocity,
// so Arcade carries whoever stands on it.
export class MovingPlatform extends Phaser.GameObjects.TileSprite {
  declare body: Phaser.Physics.Arcade.Body
  private from: Phaser.Math.Vector2
  private to: Phaser.Math.Vector2
  private forward = true
  private speed: number

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    dx: number,
    dy: number,
    speed = PLATFORM_SPEED,
  ) {
    // Frame 2 of the tile sheet is the wooden plank
    super(scene, x, y, Math.max(18, width), 18, "tiles-sheet", 2)
    this.setOrigin(0, 0)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setAllowGravity(false).setImmovable(true)
    // Only the top is solid: jump onto it from below
    this.body.checkCollision.down = false
    this.body.checkCollision.left = false
    this.body.checkCollision.right = false
    this.from = new Phaser.Math.Vector2(x, y)
    this.to = new Phaser.Math.Vector2(x + dx, y + dy)
    this.speed = speed
  }

  step() {
    const target = this.forward ? this.to : this.from
    const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y)
    if (distance < 2) {
      this.forward = !this.forward
      return
    }
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y)
    this.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed)
  }
}
