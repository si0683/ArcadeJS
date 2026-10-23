# Моя игра

Создана командой `npm create gamemonsterjs2d` — стек [GameMonsterJS2D](https://github.com/si0683/GameMonsterJS2D):
**Vite · Phaser 4 · Tiled · TypeScript**.

## Команды

```bash
npm run dev      # игра на http://localhost:5173, правки видны сразу
npm run build    # готовая игра в папке dist/ — загрузите на любой хостинг
npm run preview  # посмотреть собранную dist/
npm run zip      # game.zip (index.html в корне) для игровых порталов
npm run check     # перед коммитом: линтер, типы, тесты, сборка, бюджет размера
npm run build:web # сборка для своего сайта: офлайн-версия (PWA), ставится на телефон
npm run atlas     # упаковать картинки из art/atlas/<имя>/ в атлас public/assets/atlas/
npm run audio     # сжать звуки WAV → OGG + M4A (нужен ffmpeg)
npm run size      # размер собранной игры: JS (gzip) и всё вместе
npm run test:perf # FPS при замедленном в 4 раза процессоре
npm test          # модульные тесты (Vitest): правила, сохранения, платформа
npm run test:e2e  # игра в браузере (Playwright); первый раз: npx playwright install chromium
npm run test:golden # эталонные прохождения: физика и баланс не поменялись незаметно
npm run lint      # ESLint; npm run format — Prettier

npm run portal        # перед загрузкой на площадку: сборка + требования модерации
npm run i18n:export   # тексты в таблицу content/i18n.csv; npm run i18n:import — обратно (или из Google Таблицы)
npm run audio:sprite  # звуки из art/sfx/<имя>/ в один аудиоспрайт
npm run art           # экспорт из Aseprite (art/aseprite/), -- --watch — на каждое сохранение
npm run server        # свой игровой сервер: аналитика, лидерборд, облачное сохранение (server/README.md)
npm run verify -- <запись.json> [очки]  # проверить рекорд по записи прохождения
npm run sentry:sourcemaps # карты исходников в Sentry
npm run mobile:init   # Android через Capacitor (MOBILE.md); затем npm run mobile
npm run desktop:init  # ПК и Steam через Electron (DESKTOP.md); затем npm run desktop
```

Как добавить врага, уровень, звук, экран, язык, эффекты, анимации из Aseprite, геймпад, аналитику — пошагово в [RECIPES.md](RECIPES.md).

## Инструменты разработчика (в `npm run dev`)

| Клавиша | |
|---|---|
| F1 | панель: FPS, сцены, состояние героя, события аналитики |
| F2 | ползунки баланса: скорость, прыжок, гравитация, камера, эффекты — меняются сразу; кнопка копирует JSON для `content/balance.json` |
| F3 | хитбоксы физики |
| F4 | бессмертие |
| F6 | пройти уровень |
| F7 / F8 | записать прохождение / воспроизвести запись |
| F9 | тепловая карта смертей (Shift+F9 — смерти игроков из файла) |

В собранную игру инструменты не попадают.

## Где что лежит

```
content/balance.json     числа баланса (правит геймдизайнер, проверяются по content/schema.ts)
content/levels.json      список уровней: карта, название, свои ассеты, освещение
content/i18n/*.json      тексты на русском и английском
src/main.ts              настройки игры: размер, физика, геймпад, сцены, аналитика из .env
src/config.ts            баланс из content/ и FEATURES — включение опциональных систем
src/events.ts            события игры; src/systems.ts — кто на них подписан (аналитика, сервер)
src/accessibility.ts     доступность: цвета для дальтоников, субтитры, скорость игры, помощь
src/backend.ts           клиент игрового сервера; src/experiments.ts — A/B-тесты
src/random.ts            повторяемая случайность для геймплея
src/lighting.ts          освещение тёмных уровней; src/bitmapFont.ts — растровый шрифт с кириллицей
src/genre.ts             жанр проекта (платформер / top-down)
src/levels.ts            звёзды и открытие уровней (тесты)
src/achievements.ts      достижения; src/daily.ts — ежедневная награда; src/meta.ts — всплывающие окна
src/remote.ts            удалённый конфиг баланса
src/replay.ts            запись и воспроизведение прохождений
src/tiled.ts             свойства объектов Tiled
src/parallax.ts          фон из слоёв (параллакс)
src/orientation.ts       «поверните телефон»
src/rules.ts             правила игры (тесты — rules.test.ts)
src/movement.ts          движение героя: разгон, coyote time, буфер и высота прыжка (тесты)
src/fsm.ts               автомат состояний для героя и врагов
src/input.ts             управление действиями: клавиатура, геймпад, тач
src/fx.ts                «сочность»: частицы, стоп-кадр, тряска, вспышка, сплющивание
src/look.ts              фильтры Phaser 4: виньетка, цветокоррекция, светящийся слой
src/transition.ts        переходы между сценами с затемнением
src/ui.ts                меню для клавиатуры, геймпада и тача
src/telemetry.ts         аналитика и отлов ошибок
src/save.ts              сохранение: рекорд, копилка, уровни, достижения, настройки
src/audio.ts             звук: вариации, лимит, музыка с плавной сменой, тише на паузе
src/i18n.ts              t() и fmt() с формами множественного числа
src/entities/
  Player.ts              герой: движение, анимации, отклик
  Slime.ts               враг-патрульный
  MovingPlatform.ts      движущаяся платформа
src/scenes/
  PreloadScene.ts        загрузка картинок, звуков, карты
  MenuScene.ts           меню: старт, быстрые настройки (S, M, E), настройки (O), награда дня
  LevelSelectScene.ts    выбор уровня со звёздами
  SettingsScene.ts       настройки: звук, эффекты, язык, экран, управление, клавиши
  ToastScene.ts          всплывающие окна поверх всех сцен
  GameScene.ts           уровень: игрок, монеты, враги, флаг, камера
  HudScene.ts            счёт, жизни, кнопки для телефона
  PauseScene.ts          пауза (Esc / P / Start): продолжить, громкость, эффекты, заново, меню
src/debug/               инструменты разработчика (только npm run dev)
scripts/                 zip, атлас, звук, аудиоспрайт, Aseprite, тексты CSV, PWA, размер, площадки, Android
server/                  игровой сервер без зависимостей (server/README.md)
desktop/                 приложение для ПК и Steam (DESKTOP.md)
public/assets/
  maps/level1.tmj        уровни из Tiled (level2.tmj — платформы, пружина, чекпоинт)
  maps/tiles.png         тайлы 18×18
  sprites/  sounds/      картинки и звуки (CREDITS.md — авторы)
e2e/                     браузерные тесты: игра, требования площадок, эталонные прохождения, скриншоты, FPS
```

## Уровни в Tiled

1. Скачайте бесплатный редактор: https://www.mapeditor.org
2. Откройте `public/assets/maps/level1.tmj` (или `level2.tmj`).
3. Рисуйте тайлами в слоях `ground` (земля, платформы) и `decor` (украшения).
   Объекты ставьте в слой `objects` — важно имя: `player`, `coin`, `slime`, `flag`, `checkpoint`,
   `spring`, `hint` (подсказка), `platform` (прямоугольник — движущаяся платформа). Их числа — свойства объекта.
4. Сохраните (Ctrl+S) и обновите страницу игры (F5).

Свойства тайлов: `collides` — твёрдый, `oneWay` — твёрдый только сверху, `hazard` — ранит (шипы, вода).
Новый уровень — строка в `content/levels.json`. Подробно — «Новый уровень» и «Механики уровня в Tiled» в RECIPES.md.

## Опциональные системы

Выбор уровня со звёздами, чекпоинты, подсказки обучения, параллакс, достижения, ежедневная награда, «поверните телефон», удалённый конфиг — всё включается и выключается флагами `FEATURES` в `src/config.ts`.

## Доступность

Настройки → «Доступность»: цвета для дальтоников и контрастный режим, субтитры звуков, скорость игры 100/80/60 %, помощь (+2 жизни и «Пропустить уровень» в паузе).

## Выпуск

Площадки — `npm run zip` (перед этим `npm run portal`), свой сайт — GitHub Pages, itch.io — `.github/workflows/itch.yml` по тегу версии, Android — `MOBILE.md`, ПК и Steam — `DESKTOP.md`. Аналитика, ошибки и сервер включаются ключами в `.env` (образец — `.env.example`).

## Физика

По умолчанию — **Arcade**: быстрая и простая, для платформеров и шутеров.
Для настоящей физики (вращение, наклоны, шарниры) в Phaser встроен **Matter.js** — ставить ничего не нужно:

```ts
physics: { default: "matter", matter: { gravity: { x: 0, y: 1 } } }
// в сцене: this.matter.add.sprite(x, y, "crate")
```

## Управление

Клавиатура: ← → / A D — бег, ↑ / W / пробел — прыжок, Esc / P — пауза. Геймпад: крестовина или стик, A — прыжок, Start — пауза. Телефон: кнопки на экране. Клавиши меняются в `src/input.ts` — код игры работает с действиями, а не с клавишами.

## Звук

Встроенный звук Phaser: `this.load.audio("jump", "sounds/jump.wav")` в PreloadScene,
`playSfx(this, "jump", 0.4)` в игре (из `src/audio.ts` — учитывает громкость из меню). Музыка включается после первого нажатия — так требуют браузеры.

## Платформа (SDK)

Код игры не обращается к SDK порталов напрямую — только к `platform` из `src/platform/`: `init`, `ready`, `gameplayStart`/`gameplayStop`, `showFullscreenAd`, `showRewardedAd`, `loadData`/`saveData`, `submitScore`, `lang`, `onPause`/`onResume`.

Проект создан **без SDK** (`src/platform/none.ts`): сохранения в localStorage, язык браузера, реклама не показывается. Версии под игровые порталы создают командой `npm create …@latest my-game -- --sdk=yandex` (или `vk`, `crazygames`, `poki`).

**Покупки** — через `shop` из `src/shop.ts`. В меню есть пример: «Убрать рекламу». Без SDK покупка работает только в `npm run dev` — бесплатно и сразу, чтобы проверить игру; в собранной игре кнопки нет. Как добавить свой товар — в `RECIPES.md`.

## Выкладка на GitHub Pages

1. Залейте проект в репозиторий GitHub (ветка `main`).
2. Settings → Pages → Source: **GitHub Actions**.
3. Каждый push публикует игру на `https://<user>.github.io/<repo>/`.

## Документация

- Phaser: https://docs.phaser.io и примеры https://phaser.io/examples
- Справка для нейросетей: `node_modules/phaser/skills/` и `AGENTS.md`

## Через ИИ

Заполните `PROMT.md` — техническое задание: жанр, механики, уровни, графика. Весь файл — готовый промт: его можно скопировать в любой ИИ-чат или написать ИИ-ассистенту в этой папке:

> Прочитай PROMT.md и сделай по нему игру.
