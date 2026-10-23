import { z } from "zod"

// What the content files may contain. This file is the reference for designers: every number has
// a meaning and a range. Unknown fields are errors too — a typo like "jumpSpeeed" never passes silently.
// Checked by content/validate.ts on `npm run dev` (an error overlay in the browser), `npm run build`
// and `npm run check`. zod runs only in these checks; it never reaches the players' download.

const positive = (what: string) => z.number().positive().describe(what)
const share = (what: string) => z.number().min(0).max(1).describe(what)
const whole = (what: string) => z.number().int().min(0).describe(what)

export const BalanceSchema = z.strictObject({
  WORLD: z.strictObject({
    gravity: positive("World gravity, px/s²"),
    lives: z.number().int().min(1).max(99).describe("Lives at the level start"),
    slimeSpeed: positive("Slime patrol speed, px/s (a Tiled property `speed` overrides it)"),
    springSpeed: positive("Spring bounce speed, px/s"),
    platformSpeed: positive("Moving platform speed, px/s (Tiled property `speed`)"),
  }),
  PLAYER: z.strictObject({
    speed: positive("Top run speed, px/s"),
    accel: positive("Run speed-up on the ground, px/s²"),
    decel: positive("Run slow-down on the ground, px/s²"),
    airControl: share("Share of accel/decel in the air: 1 — full control, 0 — none"),
    jumpSpeed: positive("Jump take-off speed, px/s"),
    jumpCut: share("Releasing jump early multiplies the rising speed by this"),
    coyoteMs: whole("Jump still works this long after running off a ledge, ms"),
    bufferMs: whole("A jump pressed this long before landing still happens, ms"),
    fallGravity: z.number().min(1).max(5).describe("Gravity multiplier while falling"),
    maxFall: positive("Top fall speed, px/s"),
  }),
  CAMERA: z.strictObject({
    zoom: z.number().min(0.5).max(8).describe("Camera zoom"),
    lerp: z.number().gt(0).max(1).describe("Follow smoothing: 1 — sticks to the player"),
    lookAhead: z.number().min(0).describe("How far the view looks ahead in the run direction, px"),
  }),
  FX: z.strictObject({
    hitstop: whole("Freeze frames on a hit, ms"),
    shake: z.number().min(0).max(0.05).describe("Camera shake, share of the screen"),
    squash: z.number().min(0).max(0.8).describe("Landing squash, share of the sprite size"),
  }),
  POINTS: z.strictObject({
    coin: whole("Points for a coin"),
    stomp: whole("Points for squashing an enemy"),
    stompMargin: whole("How many px above the enemy's centre a stomp counts"),
  }),
})

const key = z.string().regex(/^[\w-]+$/, "letters, digits, _ and - only")
const assetPath = z.string().min(1).describe("Path inside public/assets")

export const LevelAssetSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("image"), key, url: assetPath }),
  z.strictObject({
    type: z.literal("spritesheet"),
    key,
    url: assetPath,
    frameWidth: z.number().int().positive(),
    frameHeight: z.number().int().positive(),
  }),
  z.strictObject({ type: z.literal("audio"), key, url: assetPath }),
])

export const LevelsSchema = z
  .array(
    z.strictObject({
      key: key.describe("Cache key of the map, unique"),
      file: assetPath.regex(/\.(tmj|json)$/, "a Tiled map in JSON (.tmj)"),
      title: z.string().describe("i18n key of the level name (content/i18n/*.json)"),
      assets: z.array(LevelAssetSchema).optional().describe("Files only this level needs"),
      light: z
        .strictObject({
          ambient: z
            .string()
            .regex(/^#[0-9a-fA-F]{6}$/, "a colour like #26213d")
            .describe("Darkness of the level"),
          radius: z.number().positive().optional().describe("Light around the player, px"),
          coins: z.boolean().optional().describe("Warm glow around coins"),
        })
        .optional()
        .describe("A dark level with dynamic light (src/lighting.ts)"),
    }),
  )
  .min(1, "at least one level")
  .superRefine((levels, ctx) => {
    const seen = new Set<string>()
    levels.forEach((level, i) => {
      if (seen.has(level.key)) ctx.addIssue({ code: "custom", message: `key "${level.key}" repeats`, path: [i, "key"] })
      seen.add(level.key)
    })
  })

export const TextsSchema = z.record(z.string(), z.string().trim().min(1, "empty text"))

export type Balance = z.infer<typeof BalanceSchema>
export type LevelList = z.infer<typeof LevelsSchema>
