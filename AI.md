# GameMonsterJS 2.0 — API reference (for developers and LLMs)

GameMonsterJS is a small browser game framework. A game is **3 files — HTML, CSS, JS** (plain JavaScript, no build step). The framework already provides: menu, settings, 3-2-1 countdown, pause, game-over screen, high score, HUD (score, lives, level), keyboard / mouse / touch / swipe input, on-screen buttons for phones, sounds and music, particles, sprites, camera, timers, quiz and upgrade picker, optional physics (Matter.js) and 3D (Three.js). **Do not re-implement these** — write only the rules of your game.

## 1. Install

**CDN (CodePen, plain HTML):**
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/si0683/GameMonsterJS@3.0.0/gamemonster.css">
<script src="https://cdn.jsdelivr.net/gh/si0683/GameMonsterJS@3.0.0/gamemonster.js"></script>
<div id="game"></div>
```

**npm (Vite, webpack, Next.js client components):**
```bash
npm install gamemonsterjs
```
```js
import GameMonster from 'gamemonsterjs';
import 'gamemonsterjs/gamemonster.css';
GameMonster.create({ /* ... */ });
```
TypeScript types are included. Importing on the server is safe (does nothing); create the game in the browser (e.g. inside `useEffect`).

## 2. Skeleton

```js
const CONFIG = { title: 'My game', hero: '🐸', speed: 400, lives: 3, world: 'sky' }; // your tweakable settings

GameMonster.create({
  title: CONFIG.title,          // menu title
  emoji: CONFIG.hero,           // big emoji in the menu
  subtitle: 'Goal of the game', // line under the title
  help: '← → move',             // controls hint (auto-generated from buttons if empty)
  width: 800, height: 600,      // world size; the game scales to the window. Phones: 480 × 720
  world: CONFIG.world,          // sky, space, forest, ocean, night, candy, desert, city
  worlds: true,                 // world picker in settings
  lives: CONFIG.lives,          // 0 = no lives
  buttons: ['left', 'right', 'action'], // on-screen buttons on touch devices: left right up down action
  actionLabel: '●',             // label of the action button
  music: 'adventure',           // background music: adventure, action, boss, calm, menu (false = none)
  sounds: ['laser'],            // Kenney sounds to preload (others load on first use)
  quiz: false,                  // true or { questions: [...] } — enables game.ask()
  difficulty: false,            // true: difficulty picker → game.diff (0.75 / 1 / 1.35)
  physics: false,               // true or { gravity, walls, drag } — Matter.js
  mode: '2d',                   // '3d' — Three.js and game.add3d
  lang: 'en',                   // 'en' | 'ru'; default: the browser language
  texts: { play: '▶ Start' },   // override any interface text
  emojiStyle: 'twemoji',        // emoji as Twemoji images (same on every device); 'system' — device font
  assetsUrl: '',                // serve sounds/ and sprites/ from your own host

  setup(game) { /* start of every round: create objects and timers */ },
  update(game, dt) { /* every frame: input and collisions; dt in seconds */ },
  draw(game, ctx) { /* optional: custom drawing over objects */ },
  drawBehind(game, ctx) { /* optional: custom drawing under objects */ },
  onOver(game, win) { /* optional: after the game ends */ }
});
```

Keep your variables in `game.data` (reset every round): `game.data.hero = game.add({...})`. Put helper functions below `GameMonster.create` and pass `game` to them.

## 3. Objects

```js
const hero = game.add({ emoji: '🐸', x: 100, y: 300, size: 50, tag: 'hero' });
```

| Property | Meaning |
|---|---|
| `x, y` | center, in world pixels |
| `emoji` / `image` / `text` / `shape: 'rect' \| 'circle'` | look: emoji, sprite (`image: 'knight'` or an image URL, section 7), text, shape |
| `size` or `w, h` | size (for emoji — font size) |
| `color, radius, glow` | shape colour, rectangle corner radius, glow colour |
| `vx, vy` | velocity (px/s); `ax, ay` — acceleration; `gravity` — downward pull |
| `friction, maxSpeed` | damping, speed limit |
| `angle, spin` | rotation (radians) and rotation speed |
| `flip, alpha, z, blink` | mirror, opacity, draw order, blink for N seconds |
| `pose, animSpeed` | animated sprite pose (`idle`, `walk`, `jump`, `fall`, `hurt`, `cheer`, `duck`, `attack`) — automatic if omitted; frames per second |
| `tag` | group name: `'enemy'`, `'coin'`… |
| `bounce, wrap, inside` | bounce off screen edges / wrap around / stay inside |
| `removeOffscreen: true` | remove when far off screen (bullets, falling items) |
| `life: 2, fade: true` | disappear after 2 s, fading out |
| `oneWay: true` | platform you can jump through from below (for `game.collide`) |
| `fixed: true` | does not move with the camera (UI) |
| `hitbox: 0.8` | fraction of the size used for collisions; `hp` — hit points; any custom fields are fine |

| Function | Meaning |
|---|---|
| `obj.remove()` / `game.remove(obj)` | remove |
| `game.all('enemy')`, `game.first('hero')`, `game.count('coin')`, `game.clear('enemy')` | find, count, remove a group |
| `game.hit(a, b)` | do a and b overlap |
| `game.hitAny(a, 'coin')` | first object of the group touching a, or null |
| `game.hitAll(a, 'coin')` | all of them |
| `game.collide(a, 'ground')` | pushes a out of solid objects of the group; returns `{ top, bottom, left, right }` and sets `a.onGround` |
| `game.follow(hero, { atX: 0.4, minX: 0, maxX: 3000 })` | camera follows the hero (`game.camera.x/y`) |

## 4. Input

| Code | Meaning |
|---|---|
| `game.key.left / right / up / down / action` | held (arrows, WASD, Space/Enter, on-screen buttons) |
| `game.pressed('action')` | pressed this frame (jump, shoot). A tap on the screen is `action` |
| `game.pressed('left')` etc. | arrow key **or swipe** in that direction |
| `game.isDown('KeyF')`, `game.pressed('KeyF')` | any key by `KeyboardEvent.code` |
| `game.pointer.x / y / down` | mouse or finger in world coordinates |

## 5. Score, lives, levels, screens

| Function | Meaning |
|---|---|
| `game.addScore(10, x, y)` | add points (+ popup at x, y) |
| `game.loseLife()` | lose a life: shake, sound, `hurtTime` s invulnerability; game over at 0. Returns false while invulnerable |
| `game.addLife()` | gain a life |
| `game.nextLevel()` | level +1 with a "Level N" banner; `game.level` |
| `game.hud('⏱', 30)` | custom HUD item |
| `game.message('Text', 2)` | centered banner for 2 s |
| `game.over()` / `game.win()` | end the game: lose / win (high score is saved) |
| `game.score, game.lives, game.level, game.time, game.diff, game.width, game.height, game.state, game.lang` | state |

## 6. Timers, effects, drawing

| Function | Meaning |
|---|---|
| `game.every(1.5, fn)`, `game.after(3, fn)` | repeat / once after N seconds; `fn(game)`; paused with the game |
| `game.burst(x, y, { emoji: '✨', color, count: 16 })` | particle burst |
| `game.popup(x, y, '+10', color)`, `game.shake(8, 0.3)`, `game.flash('#fff')` | popup text, screen shake, flash |
| `game.text(t, x, y, { size, color })`, `game.emoji(e, x, y, size)`, `game.rect(x, y, w, h, color, { radius })`, `game.circle(x, y, r, color)`, `game.line(x1, y1, x2, y2, color, width)` | drawing inside `draw` |
| `game.rand(a, b)`, `game.randInt(a, b)`, `game.pick(list)`, `game.chance(0.3)`, `game.clamp(v, a, b)`, `game.shuffle(list)`, `game.dist(a, b)`, `game.angleTo(a, b)` | helpers |

## 7. Sounds, music, sprites

```js
game.sound('coin');                    // built-in (12)
game.sound('laser', 0.7);              // Kenney sound (67), loads on first use
game.sound('retro-jump');              // 8-bit ZzFX preset (20), no files
game.sound([, , 800, , .02, .05, 1]);  // your own ZzFX sound — design one at https://killedbyapixel.github.io/ZzFX/
game.music('boss');                    // switch background music; game.music(false) — stop
```

- Built-in: jump, coin, crash, flap, hit, score, start, tick, bonus, lose, click, win.
- Kenney: back, bell, bong, book, boom, chop, close, cloth, coins, computer, confirm, creak, door, door-close, drop, engine, error, explosion, forcefield, glass, glass-break, glitch, high-up, jingle-hit, jingle-nes, jingle-pizzi, jingle-sax, jingle-steel, knife, laser, laser2, laser3, laser-big, laser-retro, laser-small, low-down, metal, metal-click, mining, open, pep, phase-jump, phaser, phaser-down, plate, pluck, pot, powerup, powerup2, punch, punch-heavy, question, scroll, select, slime, space-trash, step, step-snow, step-wood, switch, sword, three-tone, thruster, thud, toggle, wood, zap.
- ZzFX: retro-coin, retro-jump, retro-laser, retro-explosion, retro-boom, retro-hit, retro-powerup, retro-levelup, retro-win, retro-error, retro-blip, retro-click, retro-select, retro-bounce, retro-bubble, retro-magic, retro-whoosh, retro-splash, retro-alarm, retro-step.
- Music: adventure, action, boss, calm, menu — or a URL. Plays during the game, silent in menu and pause, toggle in settings.

```js
game.add({ image: 'knight', x: 100, y: 300, size: 64 });              // sprite
game.add({ image: 'adventurer', x, y, w: 44, h: 62, gravity: 1900 });  // character: walk/jump/fall animate automatically
game.add({ image: 'https://example.com/hero.png', x, y, size: 80 });   // your own image
```

| Set | Names |
|---|---|
| Animated characters (walk, jump, fall, hurt, cheer) | adventurer, explorer, robot, zombie, woman, man |
| Pixel characters (2-frame walk) | alien-green, alien-blue, alien-pink, alien-yellow, bat, slime, crab |
| Pixel tiles and items | grass, dirt, snow, crate, block-coin, block-gold, plank, ladder, water, water-top, spikes, spring, lever, door, flag, sign, pipe, key, chest-gold, coin, gem, heart, heart-half, heart-empty, mushroom, plant, tree, cactus, snowman, cloud, block-angry, saw, spike-bot |
| Dungeon (pixel) | knight, hero, wizard, dwarf, viking, elf, princess, old-man, rogue, orc, skeleton, ghost, spider, cyclops, crab-red, sword, axe, hammer, dagger, potion-red, potion-green, potion-blue, chest, barrel |
| Space | ship-blue, ship-green, ship-red, ship-orange, ufo-red, ufo-green, ufo-blue, ufo-yellow, enemy-black, enemy-blue, enemy-green, enemy-red, meteor-big, meteor, meteor-small, meteor-grey, laser-blue, laser-red, laser-green, powerup-shield, powerup-bolt, powerup-star, pill, star-gold |
| Animals (round) | elephant, giraffe, hippo, monkey, panda, parrot, penguin, pig, rabbit, snake |

Sprites fit `size` (or `w × h`) without distortion; pixel art stays crisp. Characters face right (`flip: true` — left); emoji face left. All names: `GameMonster.sprites`.

## 8. Quiz and upgrade picker

```js
// quiz: { questions: [...] } in GameMonster.create — your own questions (any language)
quiz: { questions: [{ text: 'Capital of France?', answer: 'Paris', wrong: ['Rome', 'Berlin', 'Madrid'] }] }

game.ask().then(ok => { if (ok) game.addScore(10); else game.loseLife(); });   // pauses the game
game.ask({ text: '2 + 2 = ?', answer: '4', wrong: ['3', '5', '6'] });         // a one-off question

// Pick 1 of N cards (the game is paused until chosen)
game.choose([
  { icon: '⚡', title: 'Faster', text: '+20% speed', apply: () => { game.data.speed *= 1.2; } },
  { icon: '❤️', title: '+1 life', text: 'One more try', apply: () => game.addLife() }
]).then(card => card.apply());
```

Built-in subjects: generated math (every language); with `lang: 'ru'` also Russian spelling, English–Russian words and Russian history.

## 9. Physics (Matter.js) — `physics: true`

For games where things fall, roll, stack and topple (Angry Birds-like). Matter.js loads automatically.

```js
GameMonster.create({
  physics: { gravity: 1, walls: true, drag: 'ball' }, // walls: invisible walls and floor; drag: which objects can be dragged (true = any)
  setup(game) {
    game.add({ x: 400, y: 585, w: 800, h: 30, color: '#6ab04c', body: 'static' });                  // fixed ground
    game.add({ emoji: '📦', bodyShape: 'box', x: 500, y: 300, size: 60, body: true, tag: 'box' });   // crate
    game.add({ emoji: '⚽', x: 200, y: 100, size: 50, body: true, restitution: 0.8, tag: 'ball' });  // bouncy ball
    game.onCollide('ball', 'box', (ball, box) => { box.remove(); game.addScore(10); });
  }
});
```

| Code | Meaning |
|---|---|
| `body: true` / `body: 'static'` | dynamic body / fixed support |
| `bodyShape: 'box' \| 'circle'` | body shape (default: circle for emoji and circles, box otherwise) |
| `restitution` (0…1), `density`, `friction` | bounciness, weight, friction |
| `game.velocity(obj, vx, vy)`, `game.push(obj, vx, vy)` | set / add velocity (px/s) |
| `game.onCollide('a', 'b', (a, b) => …)` | collision between two groups |
| `game.link(a, b, { length, stiffness })` | rope / spring; `b` can be a point `{ x, y }`. `game.unlink(link)` removes it |
| `game.physics.Matter`, `game.physics.engine` | raw Matter.js |

Physics objects update `x, y, angle, vx, vy` themselves — change velocity with `game.velocity`, not by assigning.

## 10. 3D (Three.js) — `mode: '3d'`

Menu, HUD, sounds, score, lives, `game.key`, `game.pressed`, `game.every`, `game.hit` work as in 2D. Three.js loads automatically. Axes: x right, y up, z toward the camera (far away is negative z).

```js
GameMonster.create({
  mode: '3d', world: 'space', buttons: ['left', 'right', 'action'],
  setup(game) {
    game.add3d({ shape: 'plane', w: 10, d: 200, z: -90, color: '#2b2d42' });                 // floor
    game.data.hero = game.add3d({ emoji: '🛸', w: 1.8, h: 1.8, y: 0.9, gravity: 24, tag: 'hero' });
    game.follow(game.data.hero, { offset: { x: 0, y: 3.5, z: 7 } });                        // chase camera
    game.every(0.8, g => g.add3d({ shape: 'box', size: 1.5, x: g.pick([-3, 0, 3]), y: 0.75, z: -100, vz: 20, color: '#8d6e63', tag: 'rock', removeOffscreen: true }));
  },
  update(game) {
    const hero = game.data.hero;
    if (game.pressed('left')) hero.x -= 3;
    if (game.pressed('right')) hero.x += 3;
    if (game.pressed('action') && hero.onGround) hero.vy = 9;
    if (game.hitAny(hero, 'rock')) game.loseLife();
  }
});
```

| `game.add3d({...})` | Meaning |
|---|---|
| `shape` | `box`, `sphere`, `cylinder`, `cone`, `plane` (floor), `emoji` / `image` (billboards facing the camera) |
| `x, y, z`, `w, h, d` or `size` | position and size (meters) |
| `vx, vy, vz`, `gravity`, `spin` | velocity, downward pull (stands on the floor y = 0, `onGround`), rotation |
| `color, tag, life, blink, removeOffscreen` | as in 2D (`removeOffscreen` — remove once behind the camera) |
| `game.follow(obj, { offset: { x, y, z } })` | chase camera |
| `game.three.THREE / scene / camera / renderer / sun` | raw Three.js |

## 11. Complete example

```js
const CONFIG = { title: 'Fruit Drop', hero: '🧺', speed: 500, lives: 3 };

GameMonster.create({
  title: CONFIG.title, emoji: '🍉', subtitle: 'Catch the fruit, dodge the bombs',
  world: 'sky', worlds: true, lives: CONFIG.lives, buttons: ['left', 'right'],
  setup(game) {
    game.data.hero = game.add({ emoji: CONFIG.hero, x: game.width / 2, y: game.height - 60, size: 70, inside: true });
    game.every(0.7, drop);
  },
  update(game, dt) {
    const hero = game.data.hero;
    hero.vx = 0;
    if (game.key.left) hero.vx = -CONFIG.speed;
    if (game.key.right) hero.vx = CONFIG.speed;
    if (game.pointer.down) hero.x = game.pointer.x;
    const fruit = game.hitAny(hero, 'fruit');
    if (fruit) { fruit.remove(); game.addScore(1, fruit.x, fruit.y); game.sound('coin'); }
    const bomb = game.hitAny(hero, 'bomb');
    if (bomb) { bomb.remove(); game.burst(bomb.x, bomb.y, { emoji: '💥' }); game.loseLife(); }
  }
});

function drop(game) {
  const isBomb = game.chance(0.25);
  game.add({ emoji: isBomb ? '💣' : game.pick(['🍎', '🍌', '🍇']), x: game.rand(40, game.width - 40), y: -30,
    size: 48, vy: 220, spin: game.rand(-2, 2), tag: isBomb ? 'bomb' : 'fruit', removeOffscreen: true });
}
```

## Rules for generated code

- Start the JS with a `CONFIG` object of tweakable settings, then `GameMonster.create`, then helper functions.
- Don't use `requestAnimationFrame`, `setInterval`, your own menus or your own `<canvas>` — GameMonsterJS does this. Use `game.every` for repeats.
- Give objects that fly off screen `removeOffscreen: true`.
- Graphics: emoji, built-in sprites (`image`) and shapes; no external images are required.
- Interface texts follow `lang`; for a single-language game set `lang` explicitly.
