import { describe, expect, it } from "vitest"

import { fmt, pickLanguage, starsLabel, texts, volumeLabel } from "./i18n"

describe("i18n", () => {
  it("every language has every text", () => {
    const keys = Object.keys(texts.ru).sort()
    for (const [lang, set] of Object.entries(texts)) {
      expect(Object.keys(set).sort(), lang).toEqual(keys)
      for (const value of Object.values(set)) expect(String(value).trim(), lang).not.toBe("")
    }
  })

  it("CIS languages get Russian, the rest English", () => {
    expect(pickLanguage("ru")).toBe("ru")
    expect(pickLanguage("kk")).toBe("ru")
    expect(pickLanguage("uk-UA")).toBe("ru")
    expect(pickLanguage("en")).toBe("en")
    expect(pickLanguage("tr")).toBe("en")
  })

  it("volume labels show percent or off", () => {
    expect(volumeLabel("sound", 0.75)).toMatch(/75%$/)
    expect(volumeLabel("music", 0)).not.toMatch(/%/)
  })
})

describe("texts with values", () => {
  it("fills {n} placeholders and draws stars", () => {
    expect(fmt("dailyText", { n: 3, m: 20 })).toMatch(/3.*20/)
    expect(starsLabel(2)).toBe("★★☆")
  })
})
