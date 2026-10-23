import Phaser from "phaser"

import { updateMusicVolume } from "../audio"
import { backendOn, transferCode, useTransferCode } from "../backend"
import { TEXT_STYLE } from "../config"
import { effectsLabel, LANGUAGES, t, volumeLabel, type Key } from "../i18n"
import { Controls, keyName, keysFor, REBINDABLE, type Action } from "../input"
import { platform } from "../platform"
import { COLOR_MODES, GAME_SPEEDS, nextVolume, save, type ColorMode, type Settings } from "../save"
import { fadeIn, goTo } from "../transition"
import { MenuItem, MenuList } from "../ui"

const ACTION_TITLES: Partial<Record<Action, Key>> = {
  left: "actionLeft",
  right: "actionRight",
  jump: "actionJump",
  pause: "actionPause",
}
const LANGUAGE_NAMES: Record<string, string> = { ru: "Русский", en: "English" }
const COLOR_NAMES: Record<ColorMode, Key> = {
  normal: "colorsNormal",
  contrast: "colorsContrast",
  protan: "colorsProtan",
  deutan: "colorsDeutan",
  tritan: "colorsTritan",
}

// Settings: volume, effects, language, fullscreen, touch controls, keys; "Accessibility" opens the second
// page: colours, sound captions, game speed, help (src/accessibility.ts).
// Every change saves at once (with a 1 s delay that groups quick clicks into one write).
export class SettingsScene extends Phaser.Scene {
  private controls!: Controls
  private menu!: MenuList
  /** Waiting for a key for this action */
  private rebinding?: Action
  /** Index of the "Accessibility" item: the focus returns to it from the second page */
  private accessItem = 0
  /** Esc / B: the main page goes to the menu, the second page back to the main one */
  private back = () => goTo(this, "menu")

  constructor() {
    super("settings")
  }

  create(data: { focus?: number; page?: "main" | "access" }) {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor("#1d1630")
    fadeIn(this)
    this.rebinding = undefined
    this.controls = new Controls(this)
    const title = data.page === "access" ? t("accessibility") : t("settings")
    this.add.text(width / 2, 40, title, { ...TEXT_STYLE, fontSize: "36px" }).setOrigin(0.5)
    this.back = () => goTo(this, "menu")

    const s = () => save.get().settings
    const set = (patch: Partial<Settings>) => save.update({ settings: patch }, 1000)
    const onOff = (on: boolean) => t(on ? "on" : "off")
    const next = <T>(list: readonly T[], value: T) => list[(list.indexOf(value) + 1) % list.length]

    if (data.page === "access") {
      const back = () => this.scene.restart({ focus: this.accessItem })
      this.menu = new MenuList(
        this,
        width / 2,
        120,
        [
          {
            label: () => `${t("colors")}: ${t(COLOR_NAMES[s().colors])}`,
            action: () => set({ colors: next(COLOR_MODES, s().colors) }),
          },
          {
            label: () => `${t("captions")}: ${onOff(s().captions)}`,
            action: () => set({ captions: !s().captions }),
          },
          {
            label: () => `${t("gameSpeed")}: ${Math.round(s().gameSpeed * 100)}%`,
            action: () => set({ gameSpeed: next(GAME_SPEEDS, s().gameSpeed) }),
          },
          { label: () => `${t("assist")}: ${onOff(s().assist)}`, action: () => set({ assist: !s().assist }) },
          { label: `← ${t("back")}`, action: back },
        ],
        this.controls,
        { gap: 48, fontSize: 24, focus: data.focus ?? 0 },
      )
      this.back = back
      return
    }

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
    this.accessItem = items.length
    items.push({ label: `${t("accessibility")} →`, action: () => this.scene.restart({ page: "access" }) })
    for (const action of REBINDABLE) {
      items.push({
        label: () =>
          this.rebinding === action
            ? `${t(ACTION_TITLES[action]!)}: ${t("pressKey")}`
            : `${t(ACTION_TITLES[action]!)}: ${keysFor(action).join(" / ")}`,
        action: () => this.waitForKey(action),
      })
    }
    // Your own site with the game server: progress moves to another device with a code (src/backend.ts)
    if (backendOn && platform.name === "none") {
      items.push(
        { label: t("transferShow"), action: () => void prompt(t("transferPrompt"), transferCode()) },
        {
          label: t("transferEnter"),
          action: () => {
            const code = prompt(t("transferAsk"))
            if (!code) return
            // The new id's save loads on the next start
            if (useTransferCode(code)) location.reload()
            else alert(t("transferBad"))
          },
        },
      )
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
    if (this.controls.justPressed("pause")) return this.back()
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
