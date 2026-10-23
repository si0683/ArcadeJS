import Phaser from "phaser"

// Dynamic 2D light (Phaser 4 Lighting, WebGL): a dark level lit by a light that follows the player and
// glows around coins. Switched on per level in content/levels.json — no new art needed:
//   { "key": "level3", …, "light": { "ambient": "#26213d", "radius": 140, "coins": true } }
// Self-shadowing makes flat pixel art look embossed from its own brightness. For real relief draw a normal
// map next to a sprite and load it with the sprite: this.load.image("tree", ["tree.png", "tree_n.png"]).
// The Canvas renderer has no lighting: the level is then shown as usual.

export interface LevelLight {
  /** Darkness of the level: "#26213d" — night, "#000000" — a cave */
  ambient: string
  /** Light around the player, px */
  radius?: number
  /** Warm glow around every coin */
  coins?: boolean
}

/**
 * Lights the scene: every game object that supports lighting reacts to light, a light follows `follow`.
 * Call at the end of GameScene.create(), when the level is built.
 */
export function addLevelLight(scene: Phaser.Scene, light: LevelLight | undefined, follow: { x: number; y: number }) {
  if (!light || scene.game.renderer.type !== Phaser.WEBGL) return
  // Turned on after the first frame: switched on inside create() the lit objects are not drawn at all
  scene.events.once("postupdate", () => lightScene(scene, light, follow))
}

function lightScene(scene: Phaser.Scene, light: LevelLight, follow: { x: number; y: number }) {
  // The sky colour is not lit: the camera background takes the level's darkness
  scene.cameras.main.setBackgroundColor(light.ambient)
  scene.lights.enable().setAmbientColor(Phaser.Display.Color.HexStringToColor(light.ambient).color)

  type Lit = Phaser.GameObjects.GameObject & {
    setLighting?: (on: boolean) => unknown
    setTint?: (color: number) => unknown
    scrollFactorX?: number
    texture?: { key: string }
  }
  // Far background (parallax) is not lit — the light would slide over it
  const ambient = Phaser.Display.Color.HexStringToColor(light.ambient)
  const dusk = Phaser.Display.Color.Interpolate.ColorWithColor(
    ambient,
    new Phaser.Display.Color(255, 255, 255),
    100,
    40,
  )
  const farTint = Phaser.Display.Color.GetColor(dusk.r, dusk.g, dusk.b)
  const coins: Lit[] = []
  const lightUp = (list: Phaser.GameObjects.GameObject[]) => {
    for (const object of list as Lit[]) {
      // Layers hold children of their own (the glow layer with coins)
      if (object instanceof Phaser.GameObjects.Layer) {
        lightUp(object.list)
        continue
      }
      // The player carries the light and stays fully visible; far background is darkened, not lit
      if ((object as unknown) === follow) continue
      if ((object.scrollFactorX ?? 1) < 1) object.setTint?.(farTint)
      else object.setLighting?.(true)
      if (object.texture?.key === "coin") coins.push(object)
    }
  }
  lightUp(scene.children.list)

  const player = scene.lights.addLight(follow.x, follow.y, light.radius ?? 140, 0xfff1d6, 1)
  if (light.coins) {
    for (const coin of coins as unknown as Phaser.GameObjects.Image[]) {
      const glow = scene.lights.addLight(coin.x, coin.y, 36, 0xffc933, 1)
      coin.once("destroy", () => scene.lights.removeLight(glow))
    }
  }
  const step = () => player.setPosition(follow.x, follow.y - 6)
  scene.events.on("update", step)
  scene.events.once("shutdown", () => scene.events.off("update", step))
}
