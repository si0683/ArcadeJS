# Моя игра

Создана командой `npm create gamemonsterjs2d` — стек [GameMonsterJS2D](https://github.com/si0683/GameMonsterJS2D):
**Vite · Phaser 4 · Tiled · TypeScript**.

## Команды

```bash
npm run dev      # игра на http://localhost:5173, правки видны сразу
npm run build    # готовая игра в папке dist/ — загрузите на любой хостинг
npm run preview  # посмотреть собранную dist/
```

## Где что лежит

```
src/main.ts              настройки игры: размер, физика, сцены
src/config.ts            баланс: скорость, прыжок, жизни, зум
src/scenes/
  PreloadScene.ts        загрузка картинок, звуков, карты
  MenuScene.ts           меню и экран «Победа / Игра окончена»
  GameScene.ts           уровень: игрок, монеты, враги, флаг
  HudScene.ts            счёт, жизни, кнопки для телефона
public/assets/
  maps/level1.tmj        уровень из Tiled
  maps/tiles.png         тайлы 18×18
  sprites/  sounds/      картинки и звуки (CREDITS.md — авторы)
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

## Звук

Встроенный звук Phaser: `this.load.audio("jump", "sounds/jump.wav")` в PreloadScene,
`this.sound.play("jump")` в игре. Музыка включается после первого нажатия — так требуют браузеры.

## Выкладка на GitHub Pages

1. Залейте проект в репозиторий GitHub (ветка `main`).
2. Settings → Pages → Source: **GitHub Actions**.
3. Каждый push публикует игру на `https://<user>.github.io/<repo>/`.

## Документация

- Phaser: https://docs.phaser.io и примеры https://phaser.io/examples
- Справка для нейросетей: `node_modules/phaser/skills/` и `AGENTS.md`

## Через ИИ

Заполните `PROMT.md` (техническое задание: жанр, механики, уровни, графика) и напишите ИИ-ассистенту в этой папке:

> Прочитай PROMT.md и AGENTS.md и сделай игру по разделу «Промт». Начни с плана и вопросов.
