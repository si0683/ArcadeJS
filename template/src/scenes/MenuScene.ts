import Phaser from "phaser"

import { TEXT_STYLE } from "../config"

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu")
  }

  create(data: { title?: string; subtitle?: string }) {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor("#1d1630")

    this.add
      .text(width / 2, height / 2 - 70, data.title ?? "Моя игра", { ...TEXT_STYLE, fontSize: "56px" })
      .setOrigin(0.5)
    if (data.subtitle) {
      this.add.text(width / 2, height / 2 - 10, data.subtitle, TEXT_STYLE).setOrigin(0.5)
    }
    const hint = this.add
      .text(width / 2, height / 2 + 60, "Нажмите, чтобы играть", { ...TEXT_STYLE, color: "#f59e0b" })
      .setOrigin(0.5)
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 })
    this.add
      .text(width / 2, height - 40, "← → или A D — бег, ↑ / W / пробел — прыжок", {
        ...TEXT_STYLE,
        fontSize: "18px",
        color: "#a69fc2",
      })
      .setOrigin(0.5)

    // Browsers allow sound only after a click or key press, so the game starts on input
    const start = () => this.scene.start("game")
    this.input.once("pointerdown", start)
    this.input.keyboard?.once("keydown", start)
  }
}
