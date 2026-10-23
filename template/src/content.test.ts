/// <reference types="node" />
import { describe, expect, it } from "vitest"

import { BalanceSchema, LevelsSchema } from "../content/schema"
import { validateContent } from "../content/validate"
import BALANCE from "../content/balance.json"
import { format, minPluralForms, pluralForm } from "./plural"

describe("game content", () => {
  it("content/*.json, the maps and the texts pass every check", () => {
    // A failure lists what to fix: file → field: problem
    expect(validateContent(process.cwd())).toEqual([])
  })

  it("the balance schema catches typos and impossible numbers", () => {
    const typo = { ...BALANCE, PLAYER: { ...BALANCE.PLAYER, jumpSpeeed: 400 } }
    expect(BalanceSchema.safeParse(typo).success).toBe(false)
    const negative = { ...BALANCE, PLAYER: { ...BALANCE.PLAYER, speed: -1 } }
    expect(BalanceSchema.safeParse(negative).success).toBe(false)
    expect(BalanceSchema.safeParse(BALANCE).success).toBe(true)
  })

  it("the level list needs unique keys and Tiled maps", () => {
    const level = { key: "a", file: "maps/a.tmj", title: "level1" }
    expect(LevelsSchema.safeParse([level]).success).toBe(true)
    expect(LevelsSchema.safeParse([level, level]).success).toBe(false)
    expect(LevelsSchema.safeParse([{ ...level, file: "maps/a.png" }]).success).toBe(false)
    expect(LevelsSchema.safeParse([]).success).toBe(false)
    const boss = { type: "spritesheet", key: "boss", url: "sprites/boss.png", frameWidth: 32, frameHeight: 32 }
    expect(LevelsSchema.safeParse([{ ...level, assets: [boss] }]).success).toBe(true)
    expect(LevelsSchema.safeParse([{ ...level, assets: [{ ...boss, frameWidth: undefined }] }]).success).toBe(false)
  })
})

describe("plural forms", () => {
  it("Russian picks one of three forms", () => {
    const coins = ["монета", "монеты", "монет"]
    expect([1, 2, 5, 11, 21, 22, 25].map((n) => pluralForm("ru", n, coins))).toEqual([
      "монета",
      "монеты",
      "монет",
      "монет",
      "монета",
      "монеты",
      "монет",
    ])
    expect(minPluralForms("ru")).toBe(3)
  })

  it("English picks one of two", () => {
    expect(pluralForm("en", 1, ["coin", "coins"])).toBe("coin")
    expect(pluralForm("en", 7, ["coin", "coins"])).toBe("coins")
  })

  it("format fills values and plural forms", () => {
    expect(format("ru", "+{m} {m:монета|монеты|монет}", { m: 22 })).toBe("+22 монеты")
    expect(format("en", "Day {n}", { n: 3 })).toBe("Day 3")
  })
})
