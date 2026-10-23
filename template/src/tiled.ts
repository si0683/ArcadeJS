import type Phaser from "phaser"

// Custom properties of Tiled objects: select an object in Tiled → Properties → "+" (Add Property).
// prop(obj, "speed", 40) reads the number "speed" or returns 40 when it is not set.

type TiledObject = Phaser.Types.Tilemaps.TiledObject

export function prop<T extends string | number | boolean>(obj: TiledObject, name: string, fallback: T): T {
  const list = (obj.properties ?? []) as { name: string; value: unknown }[]
  const value = list.find((p) => p.name === name)?.value
  return typeof value === typeof fallback ? (value as T) : fallback
}
