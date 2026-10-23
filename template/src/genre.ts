import { PLAYER } from "./config"
import type { Key } from "./i18n"
import type { Action } from "./input"

// What kind of game this project is. The default template is a platformer; genre templates
// (npm create gamemonsterjs2d … -- --template=topdown) replace this file, GameScene and the maps.
// Everything else — menus, saves, platforms, effects, tests — is shared by all genres.

export interface Genre {
  name: "platformer" | "topdown"
  /** Menu line that explains the controls */
  controls: Key
  /** Keys that differ from the defaults in src/input.ts (KEYS) */
  keys: Partial<Record<Action, string[]>>
  /** Label of the big touch button (the "jump" action) */
  actionLabel: string
  /** Touch controls need up/down too: the joystick is always used */
  joystickOnly: boolean
  /** Movement numbers the dev panel (F2) shows as sliders */
  tuning: object
}

export const GENRE: Genre = {
  name: "platformer",
  controls: "controls",
  keys: {},
  actionLabel: "▲",
  joystickOnly: false,
  tuning: PLAYER,
}
