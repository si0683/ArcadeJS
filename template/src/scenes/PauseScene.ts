import Phaser from "phaser"

import { canSkipLevel } from "../accessibility"
import { duckMusic, updateMusicVolume } from "../audio"
import { FEATURES, TEXT_STYLE } from "../config"
import { effectsLabel, t, volumeLabel } from "../i18n"
import { Controls } from "../input"
import { LEVELS, recordResult } from "../levels"
import { platform } from "../platform"
import { nextVolume, save } from "../save"
import { track } from "../telemetry"
import { goTo } from "../transition"
import { MenuList } from "../ui"
import type { GameScene } from "./GameScene"

// Pause over the level: Esc / P / gamepad Start / the HUD "II" button open it, the same keys close it.
// GameScene and HudScene stay paused underneath; nothing in the level moves. With help on
// (settings → accessibility) a stuck player can skip the level: it opens the next one, without stars.
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
    duckMusic(this, true)
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
        { label: t("restart"), action: () => this.quit("game", { level: game.level }) },
        ...(canSkipLevel() ? [{ label: t("skipLevel"), action: () => this.skip(game.level) }] : []),
        { label: t("toMenu"), action: () => this.quit("menu") },
      ],
      this.controls,
      canSkipLevel() ? { gap: 44 } : {},
    )
  }

  update() {
    this.controls.update()
    if (this.controls.justPressed("pause")) return this.resume()
    this.menu.update()
  }

  private resume() {
    duckMusic(this, false)
    this.scene.stop()
    this.scene.resume("hud")
    this.scene.resume("game")
    platform.gameplayStart()
  }

  /** Marks the level as passed with no stars and goes on: the level select, or the next level */
  private skip(level: number) {
    const key = LEVELS[level].key
    save.update({ levels: recordResult(save.get().levels, key, 0, 0) })
    track("level_skip", { level: level + 1 })
    duckMusic(this, false)
    this.scene.stop("hud")
    this.scene.stop("game")
    if (FEATURES.levelSelect) goTo(this, "levels")
    else if (level + 1 < LEVELS.length) goTo(this, "game", { level: level + 1 })
    else goTo(this, "menu")
  }

  /** Leave the level: to the menu or into the same level again */
  private quit(key: "menu" | "game", data?: object) {
    duckMusic(this, false)
    track(key === "game" ? "restart" : "quit", {
      level: (this.registry.get("level") as number) + 1,
      score: this.registry.get("score") as number,
    })
    this.scene.stop("hud")
    this.scene.stop("game")
    goTo(this, key, data)
  }
}
