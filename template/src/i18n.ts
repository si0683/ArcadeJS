import { platform } from "./platform"

// Player-facing texts. The language comes from the platform (Yandex: ysdk.environment.i18n.lang,
// otherwise the browser) — moderation on game portals requires it.
export const texts = {
  ru: {
    title: "Моя игра",
    play: "Нажмите, чтобы играть",
    controls: "← → или A D — бег, ↑ / W / пробел — прыжок",
    coins: "Монеты",
    best: "Рекорд",
    win: "Победа!",
    gameOver: "Игра окончена",
    sound: "Звук",
    music: "Музыка",
    off: "выкл",
    noAds: "Убрать рекламу",
  },
  en: {
    title: "My Game",
    play: "Tap or press any key to play",
    controls: "← → or A D — run, ↑ / W / space — jump",
    coins: "Coins",
    best: "Best",
    win: "You win!",
    gameOver: "Game over",
    sound: "Sound",
    music: "Music",
    off: "off",
    noAds: "Remove ads",
  },
}

export type Key = keyof typeof texts.ru

// Russian for the CIS languages, English for everyone else
const RU = ["ru", "be", "kk", "uk", "uz"]

/** Which text set a platform language gets */
export function pickLanguage(lang: string): keyof typeof texts {
  return RU.includes(lang.slice(0, 2).toLowerCase()) ? "ru" : "en"
}

export function t(key: Key): string {
  return texts[pickLanguage(platform.lang)][key]
}

/** "Звук: 75%" / "Звук: выкл" */
export function volumeLabel(key: "sound" | "music", volume: number): string {
  return `${t(key)}: ${volume > 0 ? `${Math.round(volume * 100)}%` : t("off")}`
}
