# 🕹️ ArcadeJS

Фреймворк для быстрых 2D-игр в браузере: подключил двумя строками — и у игры уже есть меню, настройки, отсчёт, пауза, экран «Игра окончена», рекорд, очки и жизни, звуки, частицы, кнопки для телефона и вопросы-квиз. Остаётся описать правила своей игры — обычно 50–150 строк.

Сделан для уроков программирования с детьми: игру по описанию собирает нейросеть (Qwen, ChatGPT, GigaChat…), и получается ровно **3 файла — HTML, CSS, JS**, которые вставляются в CodePen.

**Примеры:** [Фруктопад](https://si0683.github.io/ArcadeJS/examples/starter/) · [Флаппи](https://si0683.github.io/ArcadeJS/examples/flappy/) · [Змейка-умник](https://si0683.github.io/ArcadeJS/examples/snake/) · [Космо-арканоид](https://si0683.github.io/ArcadeJS/examples/breakout/) · [Лисёнок](https://si0683.github.io/ArcadeJS/examples/platformer/) · [Звёздный патруль](https://si0683.github.io/ArcadeJS/examples/shooter/) · [Злые эмодзи](https://si0683.github.io/ArcadeJS/examples/angry/) (физика) · [Космо-раннер 3D](https://si0683.github.io/ArcadeJS/examples/runner3d/)

## 🚀 Быстрый старт с нейросетью

Готовый шаблон промта — **[PROMPT.md](PROMPT.md)**: поменяйте строки «МОЯ ИГРА» (название, идея, управление, мир) и отправьте в Qwen, ChatGPT или GigaChat — получите игру в 3 файлах для CodePen.

## Подключение

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/si0683/ArcadeJS@1.0.0/arcade.css">
<script src="https://cdn.jsdelivr.net/gh/si0683/ArcadeJS@1.0.0/arcade.js"></script>
<div id="game"></div>
```

## Игра за 20 строк

```js
Arcade.create({
  title: 'Фруктопад', emoji: '🍉', world: 'sky', lives: 3, buttons: ['left', 'right'],
  setup(game) {
    game.data.hero = game.add({ emoji: '🧺', x: 400, y: 540, size: 70, inside: true });
    game.every(0.7, g => g.add({ emoji: g.pick(['🍎', '🍌']), x: g.rand(40, 760), y: -30, vy: 220, tag: 'fruit', removeOffscreen: true }));
  },
  update(game) {
    const hero = game.data.hero;
    hero.vx = game.key.left ? -500 : game.key.right ? 500 : 0;
    const fruit = game.hitAny(hero, 'fruit');
    if (fruit) { fruit.remove(); game.addScore(1, fruit.x, fruit.y); game.sound('coin'); }
  }
});
```

## Что внутри

- **Объекты:** эмодзи, надписи, прямоугольники и круги со скоростью, гравитацией, вращением, отскоком, временем жизни; группы по тегам.
- **Столкновения:** `hit`, `hitAny`, твёрдые платформы `collide` (в том числе «снизу насквозь»), камера `follow`.
- **Управление:** клавиатура, мышь, касания, свайпы, экранные кнопки — всё через `game.key.left` и `game.pressed('action')`.
- **Экраны:** меню, настройки (звук, мир, предмет, сложность), отсчёт, пауза, конец игры, рекорд в браузере.
- **Эффекты:** частицы, всплывающие надписи, тряска, вспышка; 8 миров с анимированным фоном.
- **Звуки:** 12 штук в папке `sounds/`.
- **Физика Matter.js** (`physics: true`): падение, столкновения, башни, верёвки, бросок мышью — Matter.js грузится сам.
- **3D на Three.js** (`mode: '3d'`): `game.add3d` — кубы, шары, эмодзи в 3D, камера за героем; те же меню, очки и управление.
- **Квиз:** `game.ask()` — математика, русский, английский, история России или свои вопросы; `game.choose()` — выбор улучшения.

Полный справочник — [AI.md](AI.md) (написан так, чтобы его понимали нейросети).

## Для разработчиков

```
arcade.js / arcade.css — фреймворк (версия в arcade.js: VERSION)
sounds/                — звуки
examples/<игра>/       — примеры: index.html, style.css, script.js, codepen.html
AI.md                  — справочник API для нейросетей
tools/build.py         — собирает index.html и codepen.html примеров
```

Новая версия: поменять `VERSION` в `arcade.js`, `python tools/build.py`, ссылки `@1.0.0` в AI.md/README, коммит и тег `vX.Y.Z` — jsDelivr отдаёт файлы по тегу. Уже вышедшие версии не менять: на них опираются уроки.
