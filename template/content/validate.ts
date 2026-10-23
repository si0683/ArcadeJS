/// <reference types="node" />
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"

import type { z } from "zod"

import { minPluralForms } from "../src/plural.ts"
import { BalanceSchema, LevelsSchema, TextsSchema } from "./schema.ts"

// Checks all game content before it reaches a player: content/*.json against content/schema.ts and the
// links between files — a level's map exists and has the layers and objects GameScene needs, hint texts
// and level titles exist in every language, translations keep their {placeholders} and plural forms.
// Returns readable problems ([] — all good). Runs in `npm run dev` (vite.config.ts → error overlay),
// `npm run build` and `npm test` (src/content.test.ts).

/** Base language: every other one is compared with it */
const BASE = "ru"
/** A translation longer than the original by this factor (plus a few letters) will not fit the same button */
const MAX_LENGTH_RATIO = 1.6
const LENGTH_SLACK = 12
/** Layers GameScene builds the level from */
const LAYERS = ["decor", "ground", "objects"]
/** Objects every level must have */
const REQUIRED_OBJECTS = ["player", "flag"]

interface TiledObject {
  name?: string
  x?: number
  y?: number
  properties?: { name: string; value: unknown }[]
}
interface TiledMap {
  layers?: { name: string; type: string; objects?: TiledObject[] }[]
  tilesets?: { name?: string }[]
}

export function validateContent(root = "."): string[] {
  const problems: string[] = []
  const content = (...parts: string[]) => join(root, "content", ...parts)
  const asset = (path: string) => join(root, "public", "assets", path)

  /** Reads a JSON file and checks it against a schema; undefined if it is broken */
  function check<T>(file: string, schema: z.ZodType<T>): T | undefined {
    let data: unknown
    try {
      data = JSON.parse(readFileSync(file, "utf8"))
    } catch (error) {
      problems.push(`${short(file)}: ${error instanceof Error ? error.message : error}`)
      return undefined
    }
    const result = schema.safeParse(data)
    if (result.success) return result.data
    for (const issue of result.error.issues) {
      problems.push(`${short(file)} → ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    }
    return undefined
  }
  const short = (file: string) => relative(root, file).replaceAll("\\", "/")

  check(content("balance.json"), BalanceSchema)

  // ---------- texts ----------
  const languages = existsSync(content("i18n"))
    ? readdirSync(content("i18n"))
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.slice(0, -5))
    : []
  const texts: Record<string, Record<string, string>> = {}
  for (const lang of languages) {
    const set = check(content("i18n", `${lang}.json`), TextsSchema)
    if (set) texts[lang] = set
  }
  const base = texts[BASE]
  if (!base) problems.push(`content/i18n/${BASE}.json: the base language is missing or broken`)
  else {
    for (const [lang, set] of Object.entries(texts)) {
      const file = `content/i18n/${lang}.json`
      for (const k of Object.keys(base)) if (!(k in set)) problems.push(`${file}: no text "${k}"`)
      for (const k of Object.keys(set)) if (!(k in base)) problems.push(`${file}: "${k}" is not in ${BASE}.json`)
      for (const [k, text] of Object.entries(set)) {
        const original = base[k]
        if (original === undefined) continue
        const want = placeholders(original)
        const got = placeholders(text)
        if (want.join() !== got.join()) {
          problems.push(`${file} → ${k}: placeholders {${got.join("} {")}} differ from ${BASE}: {${want.join("} {")}}`)
        }
        for (const forms of pluralGroups(text)) {
          const need = minPluralForms(lang)
          if (forms.length < need) problems.push(`${file} → ${k}: ${forms.length} plural forms, ${lang} needs ${need}`)
        }
        if (lang !== BASE && text.length > original.length * MAX_LENGTH_RATIO + LENGTH_SLACK) {
          problems.push(`${file} → ${k}: ${text.length} letters against ${original.length} in ${BASE} — will not fit`)
        }
      }
    }
  }
  const hasText = (k: string) => !base || k in base

  // ---------- levels and their maps ----------
  const levels = check(content("levels.json"), LevelsSchema)
  for (const level of levels ?? []) {
    const where = `content/levels.json → ${level.key}`
    if (!hasText(level.title)) problems.push(`${where}: title "${level.title}" is not in content/i18n/${BASE}.json`)
    for (const a of level.assets ?? []) {
      if (!existsSync(asset(a.url))) problems.push(`${where}: asset "${a.key}" — no file public/assets/${a.url}`)
    }
    if (!existsSync(asset(level.file))) {
      problems.push(`${where}: no map public/assets/${level.file}`)
      continue
    }
    let map: TiledMap
    try {
      map = JSON.parse(readFileSync(asset(level.file), "utf8")) as TiledMap
    } catch {
      problems.push(`public/assets/${level.file}: not a Tiled JSON map`)
      continue
    }
    const file = `public/assets/${level.file}`
    const layers = map.layers ?? []
    for (const name of LAYERS) {
      if (!layers.some((l) => l.name === name)) problems.push(`${file}: no layer "${name}"`)
    }
    if (!(map.tilesets ?? []).some((t) => t.name === "tiles")) problems.push(`${file}: no tileset named "tiles"`)
    const objects = layers.find((l) => l.name === "objects")?.objects ?? []
    for (const name of REQUIRED_OBJECTS) {
      const count = objects.filter((o) => o.name === name).length
      if (count === 0) problems.push(`${file}: no object "${name}" on the "objects" layer`)
      if (name === "player" && count > 1) problems.push(`${file}: ${count} "player" objects, one expected`)
    }
    for (const o of objects.filter((o) => o.name === "hint")) {
      const text = o.properties?.find((p) => p.name === "text")?.value
      if (typeof text !== "string" || !hasText(text)) {
        problems.push(
          `${file}: hint at ${Math.round(o.x ?? 0)},${Math.round(o.y ?? 0)} — text "${text}" is not in i18n`,
        )
      }
    }
  }
  return problems
}

/** Names used in a text: "{n}" and "{m:a|b}" → ["m", "n"] */
function placeholders(text: string): string[] {
  return [...new Set([...text.matchAll(/\{(\w+)(?::[^}]*)?\}/g)].map((m) => m[1]))].sort()
}

/** Plural form lists of a text: "{m:a|b|c}" → [["a", "b", "c"]] */
function pluralGroups(text: string): string[][] {
  return [...text.matchAll(/\{\w+:([^}]*)\}/g)].map((m) => m[1].split("|"))
}
