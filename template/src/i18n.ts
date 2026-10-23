import { platform } from "./platform"
import { save } from "./save"

// Player-facing texts. The language comes from the platform (Yandex: ysdk.environment.i18n.lang,
// otherwise the browser) — moderation on game portals requires it; the player may override it
// in the settings. `{n}` in a text is filled by fmt().
export const texts = {
  ru: {
    title: "Моя игра",
    play: "Нажмите, чтобы играть",
    controls: "← → или A D — бег, ↑ / W / пробел — прыжок, Esc — пауза. Геймпад тоже работает",
    coins: "Монеты",
    best: "Рекорд",
    win: "Победа!",
    gameOver: "Игра окончена",
    sound: "Звук",
    music: "Музыка",
    off: "выкл",
    on: "вкл",
    effects: "Эффекты",
    paused: "Пауза",
    resume: "Продолжить",
    toMenu: "В меню",
    noAds: "Убрать рекламу",
    // levels
    levels: "Уровни",
    level1: "Зелёные холмы",
    level2: "Водные переправы",
    levelComplete: "Уровень пройден!",
    locked: "Закрыт",
    back: "Назад",
    restart: "Заново",
    stars: "Звёзды",
    checkpoint: "Контрольная точка",
    // tutorial hints (Tiled objects "hint", property text)
    hintMove: "← → — бег",
    hintJump: "↑ или пробел — прыжок. Держите дольше — выше",
    hintStomp: "Прыгните на слизня сверху",
    hintCheckpoint: "Флажок: дальше вы начнёте отсюда",
    hintPlatform: "Платформа довезёт через воду",
    hintSpring: "Пружина подбросит высоко",
    hintThrough: "Сквозь доски можно запрыгнуть снизу",
    // top-down genre (--template=topdown)
    controlsTopdown: "Стрелки или WASD — ходьба, пробел или Shift — рывок, Esc — пауза",
    hintWalk: "Стрелки или WASD — ходьба",
    hintDash: "Пробел — рывок: на миг неуязвим",
    hintAvoid: "Слизни гонятся за вами — не подпускайте их",
    hintExit: "Флаг — выход с уровня",
    // settings
    settings: "Настройки",
    language: "Язык",
    auto: "авто",
    fullscreen: "Во весь экран",
    touchControls: "Управление на телефоне",
    buttons: "кнопки",
    joystick: "джойстик",
    keys: "Клавиши",
    pressKey: "Нажмите клавишу…",
    resetKeys: "Сбросить клавиши",
    actionLeft: "Влево",
    actionRight: "Вправо",
    actionJump: "Прыжок",
    actionPause: "Пауза",
    rotate: "Поверните телефон горизонтально",
    // achievements and daily reward
    achievements: "Достижения",
    achievement: "Достижение!",
    achFirstWin: "Первая победа",
    achAllStars: "Все звёзды",
    achCoins100: "Копилка: 100 монет",
    achNoDamage: "Без единой царапины",
    daily: "Ежедневная награда",
    dailyText: "День {n}: +{m} монет",
    wallet: "Копилка",
  },
  en: {
    title: "My Game",
    play: "Tap or press any key to play",
    controls: "← → or A D — run, ↑ / W / space — jump, Esc — pause. Gamepads work too",
    coins: "Coins",
    best: "Best",
    win: "You win!",
    gameOver: "Game over",
    sound: "Sound",
    music: "Music",
    off: "off",
    on: "on",
    effects: "Effects",
    paused: "Paused",
    resume: "Resume",
    toMenu: "Main menu",
    noAds: "Remove ads",
    levels: "Levels",
    level1: "Green Hills",
    level2: "Water Crossing",
    levelComplete: "Level complete!",
    locked: "Locked",
    back: "Back",
    restart: "Restart",
    stars: "Stars",
    checkpoint: "Checkpoint",
    hintMove: "← → — run",
    hintJump: "↑ or space — jump. Hold for higher",
    hintStomp: "Jump on the slime from above",
    hintCheckpoint: "Flag: you will restart from here",
    hintPlatform: "The platform carries you over water",
    hintSpring: "The spring throws you high",
    hintThrough: "Jump through the planks from below",
    controlsTopdown: "Arrows or WASD — walk, space or Shift — dash, Esc — pause",
    hintWalk: "Arrows or WASD — walk",
    hintDash: "Space — dash: invulnerable for a moment",
    hintAvoid: "Slimes chase you — keep away",
    hintExit: "The flag is the way out",
    settings: "Settings",
    language: "Language",
    auto: "auto",
    fullscreen: "Fullscreen",
    touchControls: "Touch controls",
    buttons: "buttons",
    joystick: "joystick",
    keys: "Keys",
    pressKey: "Press a key…",
    resetKeys: "Reset keys",
    actionLeft: "Left",
    actionRight: "Right",
    actionJump: "Jump",
    actionPause: "Pause",
    rotate: "Turn your phone sideways",
    achievements: "Achievements",
    achievement: "Achievement!",
    achFirstWin: "First win",
    achAllStars: "All stars",
    achCoins100: "Piggy bank: 100 coins",
    achNoDamage: "Not a scratch",
    daily: "Daily reward",
    dailyText: "Day {n}: +{m} coins",
    wallet: "Piggy bank",
  },
}

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
  return t(key).replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ""))
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
