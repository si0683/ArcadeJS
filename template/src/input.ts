import Phaser from "phaser"

import { GENRE } from "./genre"
import { replay } from "./replay"
import { save } from "./save"

// Controls by action, not by key: the game asks "is jump pressed?", and keyboard, gamepad and touch
// all answer. Change the keys here — the scenes never name a key themselves.

export type Action = "left" | "right" | "up" | "down" | "jump" | "pause" | "confirm"

/** Default keyboard keys for every action (names from Phaser.Input.Keyboard.KeyCodes) */
export const KEYS: Record<Action, string[]> = {
  left: ["LEFT", "A"],
  right: ["RIGHT", "D"],
  up: ["UP", "W"],
  down: ["DOWN", "S"],
  jump: ["UP", "W", "SPACE"],
  pause: ["ESC", "P"],
  confirm: ["ENTER", "SPACE"],
}

/** Standard gamepad buttons (https://w3c.github.io/gamepad/#remapping): 0 — A / ✕, 9 — Start */
export const PAD_BUTTONS: Record<Action, number[]> = {
  left: [14],
  right: [15],
  up: [12],
  down: [13],
  jump: [0],
  pause: [9],
  confirm: [0],
}

/** Actions the player can re-assign in the settings */
export const REBINDABLE: Action[] = ["left", "right", "jump", "pause"]

/** Keys of an action: the player's choice from the settings, otherwise the genre's or the default */
export function keysFor(action: Action): string[] {
  return save.get().settings.keys[action] ?? GENRE.keys[action] ?? KEYS[action]
}

/** A key name for KEYS from a browser key event ("SPACE", "A", "LEFT"); undefined for unknown keys */
export function keyName(event: KeyboardEvent): string | undefined {
  const codes = Phaser.Input.Keyboard.KeyCodes as unknown as Record<string, number>
  return Object.keys(codes).find((name) => codes[name] === event.keyCode)
}

/** Stick tilt that counts as a press */
export const STICK_DEADZONE = 0.35

/**
 * On-screen buttons (HudScene) and anything else that presses actions directly.
 * A tap shorter than a frame still counts: it is remembered until Controls reads it.
 */
export class VirtualButtons {
  private held = new Set<Action>()
  private taps = new Set<Action>()

  press(action: Action) {
    this.held.add(action)
    this.taps.add(action)
  }

  release(action: Action) {
    this.held.delete(action)
  }

  isHeld(action: Action) {
    return this.held.has(action)
  }

  /** Actions tapped since the last call */
  takeTaps(): Set<Action> {
    const taps = this.taps
    this.taps = new Set()
    return taps
  }

  reset() {
    this.held.clear()
    this.taps.clear()
  }
}

/** Per-frame action state, one per scene: call `update()` first thing in the scene's update() */
export class Controls {
  private keys = new Map<Action, Phaser.Input.Keyboard.Key[]>()
  private down = new Set<Action>()
  private pressed = new Set<Action>()
  private released = new Set<Action>()
  /** Horizontal axis −1…1: stick or keys */
  axisX = 0
  /** Vertical axis −1 (up) … 1 (down): stick or keys — for top-down games */
  axisY = 0
  /** Sum of the game loop's frame times since this scene started — the clock the physics steps on */
  private clock = 0
  /** When update() last ran (event time base): a key tapped between two frames still counts */
  private lastUpdate = performance.now()

  constructor(
    private scene: Phaser.Scene,
    private virtual: () => VirtualButtons | undefined = () => undefined,
    /** GameScene: this input is recorded and replayed (src/replay.ts) */
    private recordable = false,
  ) {
    const keyboard = scene.input.keyboard
    if (keyboard) {
      for (const action of Object.keys(KEYS) as Action[]) {
        // The same key in two actions (Space: jump and confirm) is one Key object — that is fine
        this.keys.set(
          action,
          keysFor(action).map((name) => keyboard.addKey(name)),
        )
      }
    }
  }

  update() {
    // A replay plays: the recording is the input, the devices are ignored
    this.clock += this.scene.game.loop.delta
    const played = this.recordable ? replay.next(this.clock) : undefined
    if (played) return this.apply(played.down as Set<Action>, played.axisX)

    const pad = this.pad()
    const virtual = this.virtual()
    const taps = virtual?.takeTaps()
    const stickX = pad && Math.abs(pad.leftStick.x) > STICK_DEADZONE ? pad.leftStick.x : 0
    const stickY = pad && Math.abs(pad.leftStick.y) > STICK_DEADZONE ? pad.leftStick.y : 0

    const now = new Set<Action>()
    for (const action of Object.keys(KEYS) as Action[]) {
      const key = this.keys.get(action)?.some((k) => k.isDown || k.timeDown > this.lastUpdate)
      const button = pad ? PAD_BUTTONS[action].some((i) => pad.buttons[i]?.pressed) : false
      const stick =
        (action === "left" && stickX < 0) ||
        (action === "right" && stickX > 0) ||
        (action === "up" && stickY < 0) ||
        (action === "down" && stickY > 0)
      const touch = virtual?.isHeld(action) || taps?.has(action)
      if (key || button || stick || touch) now.add(action)
    }

    const keysX = (now.has("right") ? 1 : 0) - (now.has("left") ? 1 : 0)
    const keysY = (now.has("down") ? 1 : 0) - (now.has("up") ? 1 : 0)
    this.axisY = stickY !== 0 ? Phaser.Math.Clamp(stickY, -1, 1) : keysY
    this.apply(now, stickX !== 0 ? Phaser.Math.Clamp(stickX, -1, 1) : keysX)
    if (this.recordable) replay.record(now, this.axisX, this.clock)
  }

  private apply(now: Set<Action>, axisX: number) {
    this.pressed.clear()
    this.released.clear()
    for (const action of now) if (!this.down.has(action)) this.pressed.add(action)
    for (const action of this.down) if (!now.has(action)) this.released.add(action)
    this.down = now
    this.axisX = axisX
    // Replays store only the horizontal axis; the vertical one comes from up/down
    if (this.recordable && replay.isPlaying) this.axisY = (now.has("down") ? 1 : 0) - (now.has("up") ? 1 : 0)
    this.lastUpdate = performance.now()
  }

  /**
   * Forget everything held: call when the scene resumes after a pause — keys released
   * while it was paused never reached it and would look stuck
   */
  reset() {
    this.scene.input.keyboard?.resetKeys()
    this.virtual()?.reset()
    this.lastUpdate = performance.now()
    this.down.clear()
    this.pressed.clear()
    this.released.clear()
    this.axisX = 0
  }

  /** Held right now */
  isDown(action: Action) {
    return this.down.has(action)
  }

  /** Pressed this frame (was up on the previous one) */
  justPressed(action: Action) {
    return this.pressed.has(action)
  }

  /** Let go this frame */
  justReleased(action: Action) {
    return this.released.has(action)
  }

  /** The first connected gamepad (the game config enables `input.gamepad`) */
  private pad() {
    const gamepads = this.scene.input.gamepad
    return gamepads && gamepads.total > 0 ? gamepads.getPad(0) : undefined
  }
}
