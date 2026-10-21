# 👾 GameMonsterJS

**A tiny framework for fast browser games.** Two lines of HTML and your game already has a menu, settings, countdown, pause, game-over screen, high score, HUD, keyboard / mouse / touch / swipe controls, sounds and music, particles, sprites and a camera. You write only the rules — usually 50–150 lines.

Optional add-ons load on demand: **Matter.js physics** (`physics: true`) and **Three.js 3D** (`mode: '3d'`).

[Website & live demos](https://si0683.github.io/GameMonsterJS/) · [API reference](AI.md) · [AI prompt template](PROMPT.md) · [Русский](README.ru.md)

> **Formerly ArcadeJS.** Version 3.0.0 renamed the global `Arcade` → `GameMonster` and the files `arcade.*` → `gamemonster.*`; the API is unchanged. Old versions stay on the CDN — see [CHANGELOG](CHANGELOG.md).

| | | |
|---|---|---|
| [Fruit Drop](https://si0683.github.io/GameMonsterJS/examples/starter/) — 50 lines | [Flappy](https://si0683.github.io/GameMonsterJS/examples/flappy/) | [Quiz Snake](https://si0683.github.io/GameMonsterJS/examples/snake/) |
| [Space Breakout](https://si0683.github.io/GameMonsterJS/examples/breakout/) | [Little Fox](https://si0683.github.io/GameMonsterJS/examples/platformer/) — platformer | [Star Patrol](https://si0683.github.io/GameMonsterJS/examples/shooter/) — shooter |
| [Angry Emoji](https://si0683.github.io/GameMonsterJS/examples/angry/) — physics | [Space Runner 3D](https://si0683.github.io/GameMonsterJS/examples/runner3d/) — Three.js | [Adventure](https://si0683.github.io/GameMonsterJS/examples/adventure/) — sprites & music |

## Install

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/si0683/GameMonsterJS@3.0.0/gamemonster.css">
<script src="https://cdn.jsdelivr.net/gh/si0683/GameMonsterJS@3.0.0/gamemonster.js"></script>
<div id="game"></div>
```

or

```bash
npm install gamemonsterjs
```
```js
import GameMonster from 'gamemonsterjs';
import 'gamemonsterjs/gamemonster.css';
```

## A game in 20 lines

```js
GameMonster.create({
  title: 'Fruit Drop', emoji: '🍉', world: 'sky', lives: 3, buttons: ['left', 'right'],
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

## Features

- **Objects:** emoji, sprites, text, rectangles and circles with velocity, gravity, rotation, bouncing, lifetime and tags.
- **Collisions:** `hit`, `hitAny`, solid and one-way platforms (`collide`), camera `follow`.
- **Input:** keyboard, mouse, touch, swipes and on-screen buttons through one API — `game.key.left`, `game.pressed('action')`.
- **Screens:** menu, settings (sound, music, world, quiz subject, difficulty), countdown, pause, game over, high score saved in the browser.
- **Effects:** particles, popups, screen shake, flash; 8 animated background worlds.
- **Audio:** 12 built-in sounds, 67 Kenney sounds (loaded on demand), 20 ZzFX 8-bit presets plus your own ZzFX sounds, 5 background music tracks.
- **Sprites:** 201 Kenney images — animated characters that walk/jump/fall automatically, monsters, tiles, spaceships, animals (`image: 'knight'`). Emoji render as Twemoji images, identical on every device.
- **Quiz & upgrades:** `game.ask()` with your own questions, `game.choose()` to pick 1 of N cards — handy for roguelikes and educational games.
- **Physics:** `physics: true` — Matter.js bodies, constraints, collision events, drag-and-throw.
- **3D:** `mode: '3d'` — `game.add3d` boxes, spheres, emoji billboards, chase camera, shadows.
- **i18n:** English and Russian interface (`lang`), any text overridable (`texts`).
- **TypeScript types**, ES module, safe SSR import.

## Build games with AI

GameMonsterJS is designed so that an LLM (ChatGPT, Claude, Qwen, GigaChat, DeepSeek…) can write a complete game from a short description: [PROMPT.md](PROMPT.md) is a ready-to-use prompt template, [AI.md](AI.md) is a compact API reference the model can read.

## Repository

```
gamemonster.js / gamemonster.css   the framework (VERSION constant in gamemonster.js)
gamemonster.mjs / gamemonster.d.ts ES module entry and TypeScript types
sounds/ sprites/         audio and sprite assets
examples/<name>/         examples: index.html, style.css, script.js, codepen.html
AI.md                    API reference
PROMPT.md, PROMPT.ru.md  prompt templates for LLMs
tools/build.py           regenerates asset lists, example HTML and gamemonster.mjs
```

Release: bump `VERSION` in `gamemonster.js` and `package.json`, update `@x.y.z` links, run `python tools/build.py`, commit, tag `vX.Y.Z`, `npm publish`. Published versions are never changed — jsDelivr serves every tag forever.

## License

MIT — see [LICENSE](LICENSE). Assets and add-on libraries have their own licenses: [THIRD_PARTY.md](THIRD_PARTY.md) (Kenney and music are CC0; Twemoji requires attribution).
