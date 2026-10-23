import enTexts from "../content/i18n/en.json"
import ruTexts from "../content/i18n/ru.json"
import { platform } from "./platform"
import { format } from "./plural"
import { save } from "./save"

// Player-facing texts live in content/i18n/<language>.json — translators edit them there, or in a table:
// `npm run i18n:export` writes content/i18n.csv (open it in Google Sheets / Excel), `npm run i18n:import`
// reads it back (a file or a published Google Sheets CSV link). The language comes from the platform
// (Yandex: ysdk.environment.i18n.lang, otherwise the browser) — moderation on game portals requires it;
// the player may override it in the settings. `{n}` in a text is filled by fmt(), `{n:монета|монеты|монет}`
// picks the plural form (src/plural.ts). `npm run check` fails on a missing key, a lost {placeholder},
// wrong plural forms or a translation that will not fit next to the original (content/validate.ts).
const ru = ruTexts
/** Every language has every key: a missing one is a type error here */
const en: Record<keyof typeof ru, string> = enTexts
export const texts = { ru, en }

export type Key = keyof typeof texts.ru
export type Language = keyof typeof texts

/** Languages the settings offer, in the order of the button */
export const LANGUAGES: Language[] = ["ru", "en"]

// Russian for the CIS languages, English for everyone else
const RU = ["ru", "be", "kk", "uk", "uz"]

/** Which text set a platform language gets */
export function pickLanguage(lang: string): Language {
  const code = lang.slice(0, 2).toLowerCase()
  if ((LANGUAGES as string[]).includes(code)) return code as Language
  return RU.includes(code) ? "ru" : "en"
}

/** The language in use: the player's choice in the settings, otherwise the platform's */
export function currentLanguage(): Language {
  return pickLanguage(save.get().settings.lang || platform.lang)
}

export function t(key: Key): string {
  return texts[currentLanguage()][key]
}

/** A text with values: fmt("dailyText", { n: 3, m: 20 }) → "День 3: +20 монет" */
export function fmt(key: Key, values: Record<string, string | number>): string {
  return format(currentLanguage(), t(key), values)
}

/** "Звук: 75%" / "Звук: выкл" */
export function volumeLabel(key: "sound" | "music", volume: number): string {
  return `${t(key)}: ${volume > 0 ? `${Math.round(volume * 100)}%` : t("off")}`
}

/** "Эффекты: вкл" / "Effects: off" */
export function effectsLabel(on: boolean): string {
  return `${t("effects")}: ${t(on ? "on" : "off")}`
}

/** "★★☆" */
export function starsLabel(stars: number): string {
  return "★".repeat(stars) + "☆".repeat(Math.max(0, 3 - stars))
}
