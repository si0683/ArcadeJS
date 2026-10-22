# GameMonsterJS2D

**Стартер 2D-игры для браузера одной командой:** Vite · Phaser 4 · Tiled · TypeScript.

[English](README.md) · [Сайт](https://si0683.github.io/GameMonsterJS2D/)

```bash
npm create gamemonsterjs2d@latest my-game
cd my-game
npm run dev
```

Пока пакета нет в npm, запускайте с GitHub: `npx github:si0683/GameMonsterJS2D my-game`.
Ключи: `--no-install`, `--no-git`. Нужен Node.js 20.19+.

## Что внутри

| | |
|---|---|
| [Vite](https://vite.dev) | сервер разработки с мгновенным обновлением и сборка |
| [Phaser 4](https://phaser.io) | сцены, камера, спрайты, ввод, анимации, тайлмапы, звук; физика **Arcade** по умолчанию, **Matter.js** встроен |
| [Tiled](https://www.mapeditor.org) | уровень — карта Tiled (`.tmj`): рисуйте тайлы, ставьте монеты и врагов |
| TypeScript | строгие типы |

А ещё готовый платформер (бег, прыжки, монеты, слизни, шипы, вода, флаг), меню и счёт, кнопки для телефона, бесплатная графика Kenney (CC0), `AGENTS.md` для нейросетей и выкладка на GitHub Pages.

Matter.js и Howler.js специально не ставятся отдельно: Matter.js уже внутри Phaser, звук у Phaser свой.

## Проект через ИИ

[PROMT.md](https://raw.githubusercontent.com/si0683/GameMonsterJS2D/main/PROMT.md) — техническое задание для ИИ-ассистента (Claude Code, Cursor, Codex…). Скачайте его или возьмите из папки нового проекта, заполните (жанр, управление, механики, уровни, графика) и напишите ассистенту в папке проекта:

> Прочитай PROMT.md и AGENTS.md и сделай игру по разделу «Промт». Начни с плана и вопросов.

## Разработка репозитория

```bash
cd template && npm install && npm run dev
npm pack   # затем: npx ./create-gamemonsterjs2d-<v>.tgz test
```

Версии до 3.0.0 были CDN-библиотекой GameMonsterJS (`gamemonster.js`, бывший ArcadeJS). Их теги остаются на jsDelivr.

MIT © si0683
