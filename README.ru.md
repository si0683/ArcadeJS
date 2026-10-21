# 👾 GameMonsterJS

**Маленький фреймворк для быстрых браузерных игр.** Две строки в HTML — и у игры уже есть меню, настройки, отсчёт, пауза, экран «Игра окончена», рекорд, панель очков и жизней, управление с клавиатуры, мыши, касаний и свайпов, звуки и музыка, частицы, спрайты и камера. Вы пишете только правила — обычно 50–150 строк.

Дополнения грузятся по запросу: **физика Matter.js** (`physics: true`) и **3D на Three.js** (`mode: '3d'`).

[Сайт и живые примеры](https://si0683.github.io/GameMonsterJS/) · [Справочник API](AI.md) · [Шаблон промта для ИИ](PROMPT.ru.md) · [English](README.md)

Примеры игр — готовые браузерные игры в трёх файлах (HTML, CSS, JavaScript) с подробными комментариями:

| | | |
|---|---|---|
| [Flappy Bird](https://si0683.github.io/GameMonsterJS/examples/flappybird/) | [Subway Surf](https://si0683.github.io/GameMonsterJS/examples/subwaysurf/) — 3D-раннер на Three.js | [Quiz Shooter](https://si0683.github.io/GameMonsterJS/examples/quizshooter/) |
| [Quiz Tower](https://si0683.github.io/GameMonsterJS/examples/quiztowerdefense/) — башенная оборона | [Quiz Snake](https://si0683.github.io/GameMonsterJS/examples/quizsnake/) | [Quiz Jump](https://si0683.github.io/GameMonsterJS/examples/quizplatformer/) — платформер |
| [Quiz Breakout](https://si0683.github.io/GameMonsterJS/examples/quizbreakout/) | | |

> **Раньше называлась ArcadeJS.** В версии 3.0.0 глобальный объект `Arcade` стал `GameMonster`, файлы `arcade.*` — `gamemonster.*`; API тот же. Старые версии остаются на CDN — см. [CHANGELOG](CHANGELOG.md).

## Подключение

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/si0683/GameMonsterJS@3.0.0/gamemonster.css">
<script src="https://cdn.jsdelivr.net/gh/si0683/GameMonsterJS@3.0.0/gamemonster.js"></script>
<div id="game"></div>
```

или

```bash
npm install gamemonsterjs
```
```js
import GameMonster from 'gamemonsterjs';
import 'gamemonsterjs/gamemonster.css';
```

## Игра за 20 строк

```js
GameMonster.create({
  title: 'Фруктопад', emoji: '🍉', world: 'sky', lives: 3, buttons: ['left', 'right'], lang: 'ru',
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

## Возможности

- **Объекты:** эмодзи, спрайты, надписи, прямоугольники и круги со скоростью, гравитацией, вращением, отскоком, временем жизни и группами (тегами).
- **Столкновения:** `hit`, `hitAny`, твёрдые платформы и платформы «снизу насквозь» (`collide`), камера `follow`.
- **Управление:** клавиатура, мышь, касания, свайпы и экранные кнопки через один API — `game.key.left`, `game.pressed('action')`.
- **Экраны:** меню, настройки (звук, музыка, мир, вопросы, сложность), отсчёт, пауза, конец игры, рекорд в браузере.
- **Эффекты:** частицы, всплывающие надписи, тряска, вспышка; 8 анимированных миров.
- **Звук:** 12 встроенных звуков, 67 звуков Kenney (грузятся по требованию), 20 восьмибитных звуков ZzFX и свои звуки ZzFX, 5 фоновых мелодий.
- **Спрайты:** 201 картинка Kenney — персонажи с автоматической анимацией ходьбы и прыжка, монстры, блоки, космос, животные (`image: 'knight'`). Эмодзи рисуются картинками Twemoji — одинаково на любом устройстве.
- **Вопросы и улучшения:** `game.ask()` со своими вопросами, `game.choose()` — выбор 1 из N карточек (рогалики, образовательные игры).
- **Физика:** `physics: true` — тела Matter.js, связи, события столкновений, бросок мышью.
- **3D:** `mode: '3d'` — `game.add3d`: кубы, шары, эмодзи в 3D, камера за героем, тени.
- **Языки:** английский и русский интерфейс (`lang`), любой текст можно заменить (`texts`).
- **Типы TypeScript**, ES-модуль, безопасный импорт на сервере (SSR).

## Игры с помощью ИИ

GameMonsterJS сделан так, чтобы нейросеть (ChatGPT, Claude, Qwen, GigaChat, DeepSeek…) писала целую игру по короткому описанию: [PROMPT.ru.md](PROMPT.ru.md) — готовый шаблон промта, [AI.md](AI.md) — компактный справочник API.

## Лицензия

MIT — см. [LICENSE](LICENSE). У ресурсов и дополнений свои лицензии: [THIRD_PARTY.md](THIRD_PARTY.md) (Kenney и музыка — CC0; Twemoji требует указать авторство).
