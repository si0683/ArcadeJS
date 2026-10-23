import { HERO } from "./topdown"
import type { Key } from "./i18n"
import type { Action } from "./input"

// What kind of game this project is: top-down (created with --template=topdown).
// The default template is a platformer; this file, GameScene, src/topdown.ts, the entities
// Hero/Chaser and the maps come from the genre template. Everything else is shared.

export interface Genre {
  name: "platformer" | "topdown"
  /** Menu line that explains the controls */
  controls: Key
  /** Keys that differ from the defaults in src/input.ts (KEYS) */
  keys: Partial<Record<Action, string[]>>
  /** Label of the big touch button (the "jump" action — here it is the dash) */
  actionLabel: string
  /** Touch controls need up/down too: the joystick is always used */
  joystickOnly: boolean
  /** Movement numbers the dev panel (F2) shows as sliders */
  tuning: object
}

export const GENRE: Genre = {
  name: "topdown",
  controls: "controlsTopdown",
  // Up/W walk up here, so the dash ("jump" action) takes Space, Shift and X
  keys: { jump: ["SPACE", "SHIFT", "X"] },
  actionLabel: "⚡",
  joystickOnly: true,
  tuning: HERO,
}
