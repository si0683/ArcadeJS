import Phaser from "phaser"

import { updateMusicVolume } from "../audio"
import { TEXT_STYLE } from "../config"
import { effectsLabel, t, volumeLabel } from "../i18n"
import { Controls } from "../input"
import { platform } from "../platform"
import { nextVolume, save } from "../save"
import { track } from "../telemetry"
import { goTo } from "../transition"
import { MenuList } from "../ui"
import type { GameScene } from "./GameScene"

// Pause over the level: Esc / P / gamepad Start / the HUD "II" button open it, the same keys close it.
// GameScene and HudScene stay paused underneath; nothing in the level moves.
export class PauseScene extends Phaser.Scene {
  private controls!: Controls
  private menu!: MenuList

  constructor() {
    super("pause")
  }

  create() {
    const { width, height } = this.scale
    this.add.rectangle(0, 0, width, height, 0x1d1630, 0.72).setOrigin(0)
    this.add.text(width / 2, height / 2 - 150, t("paused"), { ...TEXT_STYLE, fontSize: "48px" }).setOrigin(0.5)

    this.controls = new Controls(this)
    const game = this.scene.get("game") as GameScene
    const setting = (patch: Parameters<typeof save.update>[0]) => save.update(patch, 1000)
    this.menu = new MenuList(
      this,
      width / 2,
      height / 2 - 70,
      [
        { label: t("resume"), action: () => this.resume() },
        {
          label: () => volumeLabel("sound", save.get().settings.sound),
          action: () => setting({ settings: { sound: nextVolume(save.get().settings.sound) } }),
        },
        {
          label: () => volumeLabel("music", save.get().settings.music),
          action: () => {
            setting({ settings: { music: nextVolume(save.get().settings.music) } })
            updateMusicVolume(this)
          },
        },
        {
          label: () => effectsLabel(save.get().settings.effects),
          action: () => {
            setting({ settings: { effects: !save.get().settings.effects } })
            game.look.setEnabled(save.get().settings.effects)
          },
        },
        { label: t("toMenu"), action: () => this.quit() },
      ],
      this.controls,
    )
  }

  update() {
    this.controls.update()
    if (this.controls.justPressed("pause")) return this.resume()
    this.menu.update()
  }

  private resume() {
    this.scene.stop()
    this.scene.resume("hud")
    this.scene.resume("game")
    platform.gameplayStart()
  }

  private quit() {
    track("quit", { level: 1, score: this.registry.get("score") as number })
    this.scene.stop("hud")
    this.scene.stop("game")
    goTo(this, "menu")
  }
}
