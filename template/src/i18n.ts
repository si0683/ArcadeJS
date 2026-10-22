import { platform } from "./platform"

// Player-facing texts. The language comes from the platform (Yandex: ysdk.environment.i18n.lang,
// otherwise the browser) — moderation on game portals requires it.
const texts = {
  ru: {
    title: "Моя игра",
    play: "Нажмите, чтобы играть",
    controls: "← → или A D — бег, ↑ / W / пробел — прыжок",
    coins: "Монеты",
    best: "Рекорд",
    win: "Победа!",
    gameOver: "Игра окончена",
  },
  en: {
    title: "My Game",
    play: "Tap or press any key to play",
    controls: "← → or A D — run, ↑ / W / space — jump",
    coins: "Coins",
    best: "Best",
    win: "You win!",
    gameOver: "Game over",
  },
}

type Key = keyof typeof texts.ru

// Russian for the CIS languages, English for everyone else
const RU = ["ru", "be", "kk", "uk", "uz"]

export function t(key: Key): string {
  return (RU.includes(platform.lang) ? texts.ru : texts.en)[key]
}
