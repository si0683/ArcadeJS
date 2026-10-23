// The platform this build is made for. Created with the GamePush SDK (npm create … -- --sdk=gamepush):
// VK Play, VK Games, OK, Yandex Games and other portals through one SDK.
// To build without the SDK, import from "./none" instead.
// guard() keeps the game running when an SDK call fails or never answers.
import { guard } from "./guard"
import { platform as current } from "./gamepush"

export const platform = guard(current)
export type { Features, Platform, Product, Purchase, SaveData } from "./types"
