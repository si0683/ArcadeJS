import Phaser from "phaser"

import { TEXT_STYLE } from "../config"

// Runs on top of GameScene without camera zoom: score, lives and touch buttons.
export class HudScene extends Phaser.Scene {
  /** Touch buttons state, read by GameScene every frame */
  touch = { left: false, right: false, jump: false }

  constructor() {
    super("hud")
  }

  create() {
    this.touch = { left: false, right: false, jump: false }
    const score = this.add.text(20, 16, "", TEXT_STYLE)
    const hearts = this.add.group()

    const render = () => {
      score.setText(`Монеты: ${this.registry.get("score")}`)
      hearts.clear(true, true)
      for (let i = 0; i < this.registry.get("lives"); i++) {
        hearts.add(this.add.image(this.scale.width - 30 - i * 40, 34, "heart").setScale(2))
      }
    }
    render()
    // registry "changedata" fires whenever GameScene changes score or lives
    this.registry.events.on("changedata", render)
    this.events.once("shutdown", () => this.registry.events.off("changedata", render))

    if (this.sys.game.device.input.touch) this.addTouchButtons()
  }

  private addTouchButtons() {
    const { width, height } = this.scale
    const button = (x: number, label: string, key: keyof HudScene["touch"]) => {
      const b = this.add
        .circle(x, height - 70, 46, 0xffffff, 0.25)
        .setStrokeStyle(3, 0xffffff, 0.6)
        .setInteractive()
      this.add.text(x, height - 70, label, { ...TEXT_STYLE, fontSize: "34px" }).setOrigin(0.5)
      b.on("pointerdown", () => (this.touch[key] = true))
      b.on("pointerup", () => (this.touch[key] = false))
      b.on("pointerout", () => (this.touch[key] = false))
    }
    button(80, "◀", "left")
    button(190, "▶", "right")
    button(width - 90, "▲", "jump")
  }
}
