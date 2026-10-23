import Phaser from "phaser"

import { updateMusicVolume } from "../audio"
import { TEXT_STYLE } from "../config"
import { effectsLabel, LANGUAGES, t, volumeLabel, type Key } from "../i18n"
import { Controls, keyName, keysFor, REBINDABLE, type Action } from "../input"
import { nextVolume, save, type Settings } from "../save"
import { fadeIn, goTo } from "../transition"
import { MenuItem, MenuList } from "../ui"

const ACTION_TITLES: Partial<Record<Action, Key>> = {
  left: "actionLeft",
  right: "actionRight",
  jump: "actionJump",
  pause: "actionPause",
}
const LANGUAGE_NAMES: Record<string, string> = { ru: "Русский", en: "English" }

// Settings: volume, effects, language, fullscreen, touch controls, keys.
// Every change saves at once (with a 1 s delay that groups quick clicks into one write).
export class SettingsScene extends Phaser.Scene {
  private controls!: Controls
  private menu!: MenuList
  /** Waiting for a key for this action */
  private rebinding?: Action

  constructor() {
    super("settings")
  }

  create(data: { focus?: number }) {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor("#1d1630")
    fadeIn(this)
    this.rebinding = undefined
    this.controls = new Controls(this)
    this.add.text(width / 2, 40, t("settings"), { ...TEXT_STYLE, fontSize: "36px" }).setOrigin(0.5)

    const s = () => save.get().settings
    const set = (patch: Partial<Settings>) => save.update({ settings: patch }, 1000)
    const onOff = (on: boolean) => t(on ? "on" : "off")

    const items: MenuItem[] = [
      { label: () => volumeLabel("sound", s().sound), action: () => set({ sound: nextVolume(s().sound) }) },
      {
        label: () => volumeLabel("music", s().music),
        action: () => {
          set({ music: nextVolume(s().music) })
          updateMusicVolume(this)
        },
      },
      { label: () => effectsLabel(s().effects), action: () => set({ effects: !s().effects }) },
      {
        label: () => `${t("language")}: ${s().lang ? LANGUAGE_NAMES[s().lang] : t("auto")}`,
        action: () => {
          // auto → ru → en → auto; the texts change on the redraw
          const order = ["", ...LANGUAGES]
          set({ lang: order[(order.indexOf(s().lang) + 1) % order.length] })
          this.scene.restart({ focus: this.menu.focused })
        },
      },
    ]
    if (this.scale.fullscreen.available) {
      items.push({
        label: () => `${t("fullscreen")}: ${onOff(this.scale.isFullscreen)}`,
        // Browsers allow fullscreen only from a click or tap
        action: () => this.scale.toggleFullscreen(),
      })
    }
    items.push({
      label: () => `${t("touchControls")}: ${t(s().touch === "joystick" ? "joystick" : "buttons")}`,
      action: () => set({ touch: s().touch === "joystick" ? "buttons" : "joystick" }),
    })
    for (const action of REBINDABLE) {
      items.push({
        label: () =>
          this.rebinding === action
            ? `${t(ACTION_TITLES[action]!)}: ${t("pressKey")}`
            : `${t(ACTION_TITLES[action]!)}: ${keysFor(action).join(" / ")}`,
        action: () => this.waitForKey(action),
      })
    }
    items.push(
      { label: t("resetKeys"), action: () => set({ keys: {} }) },
      { label: `← ${t("back")}`, action: () => goTo(this, "menu") },
    )

    this.menu = new MenuList(this, width / 2, 96, items, this.controls, {
      gap: Math.min(40, (height - 120) / items.length),
      fontSize: 22,
      focus: data.focus ?? 0,
    })
  }

  update() {
    this.controls.update()
    if (this.rebinding) return
    if (this.controls.justPressed("pause")) return goTo(this, "menu")
    this.menu.update()
  }

  /** The next key pressed becomes the action's key; Esc cancels */
  private waitForKey(action: Action) {
    this.rebinding = action
    this.menu.refresh()
    // A plain DOM listener: the key that chose this item is already down, the next one is the answer
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault()
      removeEventListener("keydown", onKey, true)
      const name = keyName(event)
      if (event.key !== "Escape" && name) {
        save.update({ settings: { keys: { ...save.get().settings.keys, [action]: [name] } } }, 1000)
      }
      // Restart so the scene's Controls pick up the new keys
      this.time.delayedCall(150, () => this.scene.restart({ focus: this.menu.focused }))
    }
    setTimeout(() => addEventListener("keydown", onKey, true), 50)
  }
}
