import Phaser from "phaser"

import { TEXT_STYLE } from "../config"
import { t, volumeLabel } from "../i18n"
import { nextVolume, save, type Settings } from "../save"

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu")
  }

  create(data: { title?: string; subtitle?: string }) {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor("#1d1630")

    this.add
      .text(width / 2, height / 2 - 70, data.title ?? t("title"), { ...TEXT_STYLE, fontSize: "56px" })
      .setOrigin(0.5)
    const best = `${t("best")}: ${save.get().best}`
    this.add
      .text(width / 2, height / 2 - 10, data.subtitle ? `${data.subtitle} · ${best}` : best, TEXT_STYLE)
      .setOrigin(0.5)
    const hint = this.add
      .text(width / 2, height / 2 + 60, t("play"), { ...TEXT_STYLE, color: "#f59e0b" })
      .setOrigin(0.5)
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 })
    this.add
      .text(width / 2, height - 40, t("controls"), {
        ...TEXT_STYLE,
        fontSize: "18px",
        color: "#a69fc2",
      })
      .setOrigin(0.5)

    // ---------- settings: click a button or press S / M ----------
    const small = { ...TEXT_STYLE, fontSize: "18px", strokeThickness: 4 }
    const button = (y: number, key: keyof Settings, shortcut: string) => {
      const label = () => `${volumeLabel(key, save.get().settings[key])}  [${shortcut}]`
      const text = this.add
        .text(width - 20, y, label(), small)
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true })
      const change = () => {
        // Settings save after a second of quiet: clicking through the levels is one write
        save.update({ settings: { [key]: nextVolume(save.get().settings[key]) } }, 1000)
        text.setText(label())
      }
      text.on("pointerdown", change)
      text.on("pointerover", () => text.setColor("#f59e0b"))
      text.on("pointerout", () => text.setColor("#ffffff"))
      return { change, code: `Key${shortcut}` }
    }
    const settings = [button(16, "sound", "S"), button(46, "music", "M")]

    // Browsers allow sound only after a click or key press, so the game starts on input
    let started = false
    const start = () => {
      if (started) return
      started = true
      this.scene.start("game")
    }
    // A click outside the settings buttons, or any key except the settings shortcuts
    this.input.on("pointerdown", (_pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length === 0) start()
    })
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      const setting = settings.find((s) => s.code === event.code)
      if (setting) setting.change()
      else start()
    })
  }
}
