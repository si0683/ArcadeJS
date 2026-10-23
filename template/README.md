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
npm run atlas     # упаковать картинки из art/atlas/<имя>/ в атлас public/assets/atlas/
npm run size      # размер собранной игры: JS (gzip) и всё вместе
npm test          # модульные тесты (Vitest): правила, сохранения, платформа
npm run test:e2e  # игра в браузере (Playwright); первый раз: npx playwright install chromium
npm run lint      # ESLint; npm run format — Prettier
```

Как добавить врага, уровень, звук, экран, язык, эффекты, анимации из Aseprite, геймпад, аналитику — пошагово в [RECIPES.md](RECIPES.md).

## Инструменты разработчика (в `npm run dev`)

| Клавиша | |
|---|---|
| F1 | панель: FPS, сцены, состояние героя, события аналитики |
| F2 | ползунки баланса: скорость, прыжок, гравитация, камера, эффекты — меняются сразу; кнопка копирует числа для `src/config.ts` |
| F3 | хитбоксы физики |
| F4 | бессмертие |
| F6 | пройти уровень |

В собранную игру инструменты не попадают.

## Где что лежит

```
src/main.ts              настройки игры: размер, физика, геймпад, сцены
src/config.ts            баланс: движение героя, гравитация, камера, эффекты, жизни, очки
src/rules.ts             правила игры (тесты — rules.test.ts)
src/movement.ts          движение героя: разгон, coyote time, буфер и высота прыжка (тесты)
src/fsm.ts               автомат состояний для героя и врагов
src/input.ts             управление действиями: клавиатура, геймпад, тач
src/fx.ts                «сочность»: частицы, стоп-кадр, тряска, вспышка, сплющивание
src/look.ts              фильтры Phaser 4: виньетка, цветокоррекция, светящийся слой
src/transition.ts        переходы между сценами с затемнением
src/ui.ts                меню для клавиатуры, геймпада и тача
src/telemetry.ts         аналитика и отлов ошибок
src/save.ts              сохранение: рекорд и настройки (громкость, эффекты)
src/audio.ts             playSfx / playMusic с учётом громкости
src/i18n.ts              тексты на русском и английском
src/entities/
  Player.ts              герой: движение, анимации, отклик
  Slime.ts               враг-патрульный
src/scenes/
  PreloadScene.ts        загрузка картинок, звуков, карты
  MenuScene.ts           меню, экран «Победа / Игра окончена», настройки (S, M, E)
  GameScene.ts           уровень: игрок, монеты, враги, флаг, камера
  HudScene.ts            счёт, жизни, кнопки для телефона
  PauseScene.ts          пауза (Esc / P / Start): продолжить, громкость, эффекты, меню
src/debug/               инструменты разработчика (только npm run dev)
scripts/                 zip, атлас, бюджет размера
public/assets/
  maps/level1.tmj        уровень из Tiled
  maps/tiles.png         тайлы 18×18
  sprites/  sounds/      картинки и звуки (CREDITS.md — авторы)
e2e/game.spec.ts         проверка игры в браузере (Playwright)
```

## Уровни в Tiled

1. Скачайте бесплатный редактор: https://www.mapeditor.org
2. Откройте `public/assets/maps/level1.tmj`.
3. Рисуйте тайлами в слоях `ground` (земля, платформы) и `decor` (украшения).
   Монеты, слизней, флаг и старт игрока ставьте точками в слое `objects` — важно имя точки:
   `player`, `coin`, `slime`, `flag`.
4. Сохраните (Ctrl+S) и обновите страницу игры (F5).

Свойства тайлов: `collides` — твёрдый, `hazard` — ранит (шипы, вода).

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
