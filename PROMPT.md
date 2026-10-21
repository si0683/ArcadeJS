# Prompt template: any game with GameMonsterJS

Fill in the **MY GAME** block and paste the whole prompt into any LLM (ChatGPT, Claude, Gemini, Qwen, GigaChat, DeepSeek…). You get a complete game in 3 files that runs locally, on any static hosting or in CodePen. The prompt contains a compact API cheat sheet, so it works even when the model cannot open links.

Русская версия — [PROMPT.ru.md](PROMPT.ru.md). Full API — [AI.md](AI.md).

````text
You are a senior game developer. Build a complete browser game with the GameMonsterJS framework.

MY GAME:
Title: Space Cat
Idea: a cat flies a rocket, catches fish and dodges meteors; every 10 fish the game speeds up
Controls: arrow keys or A/D; on phones — on-screen buttons and swipes
Look: space world; emoji graphics (or built-in Kenney sprites); background music
Extras: levels, an upgrade choice between levels, a boss every 3 levels
Interface language: English

OUTPUT — exactly 3 files, each in its own code block with the file name above it:
1) index.html — a full HTML document that connects
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/si0683/GameMonsterJS@3.0.0/gamemonster.css">
   <script src="https://cdn.jsdelivr.net/gh/si0683/GameMonsterJS@3.0.0/gamemonster.js"></script>
   plus style.css, an empty <div id="game"></div> and script.js at the end of <body>;
2) style.css — usually almost empty (optional accent colour: .arc-root { --arc-accent: #ff4d6d; });
3) script.js — plain JavaScript: a CONFIG object with tweakable settings, then GameMonster.create({...}), then helper functions.
Plain HTML/CSS/JavaScript only: no TypeScript, React, npm, import/export, no build step.

GameMonsterJS reference (read it first): https://cdn.jsdelivr.net/gh/si0683/GameMonsterJS@3.0.0/AI.md
Backup: https://raw.githubusercontent.com/si0683/GameMonsterJS/main/AI.md

If you cannot open the links, use this summary:
- GameMonsterJS already has: menu, settings, 3-2-1 countdown, pause, game over, high score, HUD (score/lives/level), keyboard/mouse/touch/swipe input, on-screen buttons, sounds, music, particles, sprites, camera. Do NOT write your own menus, canvas, requestAnimationFrame or setInterval.
- GameMonster.create({ title, emoji, subtitle, help, width: 800, height: 600, world: 'sky'|'space'|'forest'|'ocean'|'night'|'candy'|'desert'|'city', worlds: true, lives: 3, buttons: ['left','right','up','down','action'], music: 'adventure'|'action'|'boss'|'calm'|'menu', lang: 'en'|'ru', quiz, difficulty, physics, mode: '3d', setup(game) {...}, update(game, dt) {...}, draw(game, ctx) {...} }). Keep your variables in game.data.
- Objects: game.add({ emoji: '🐱' | image: 'knight' | text | shape: 'rect'|'circle', x, y, size or w/h, color, vx, vy, gravity, spin, angle, flip, tag, bounce, wrap, inside, removeOffscreen: true, life, blink, hitbox, hp }). obj.remove(); game.all(tag); game.first(tag); game.count(tag); game.clear(tag).
- Collisions: game.hit(a, b); game.hitAny(a, 'tag') → object or null; game.collide(a, 'ground') → solid platforms, sets a.onGround (oneWay: true for jump-through); game.follow(hero) — camera.
- Input: game.key.left/right/up/down/action (held); game.pressed('action') (this frame; tap = action); game.pressed('left') also fires on swipe; game.pointer.x/y/down.
- Game: game.addScore(10, x, y), game.loseLife() (auto game over at 0), game.addLife(), game.nextLevel(), game.over(), game.win(), game.message('Text'), game.hud('⏱', 30); state: game.score, lives, level, time, diff, width, height.
- Timers & effects: game.every(sec, fn), game.after(sec, fn) — fn(game); game.burst(x, y, { emoji: '✨', count }), game.popup(x, y, '+10'), game.shake(), game.flash(color).
- Sounds: game.sound(name, volume) — built-in jump, coin, crash, flap, hit, score, start, tick, bonus, lose, click, win; Kenney laser, explosion, boom, powerup, coins, sword, punch, door, zap, step, error, confirm, jingle-nes…; 8-bit retro-jump, retro-coin, retro-laser, retro-explosion, retro-powerup, retro-win… game.music('boss').
- Sprites (image: name): animated characters adventurer, explorer, robot, zombie, woman, man (walk/jump/fall automatically, face right); pixel alien-green, slime, bat, knight, wizard, orc, skeleton, ghost, spider; tiles grass, dirt, crate, plank, spikes, coin, gem, heart, flag, door, key; space ship-blue, ufo-red, enemy-red, meteor, laser-blue, powerup-star; animals panda, penguin, rabbit, monkey, pig.
- Upgrades: game.choose([{ icon, title, text, apply }]).then(card => card.apply()). Quiz: quiz: { questions: [{ text, answer, wrong: [...] }] } and game.ask().then(ok => ...).
- Physics (physics: { walls: true, drag: true }): game.add({ ..., body: true | 'static', bodyShape: 'box', restitution }); game.velocity(obj, vx, vy); game.onCollide('a', 'b', fn); game.link(a, b).
- 3D (mode: '3d'): game.add3d({ shape: 'box'|'sphere'|'plane'|'emoji', emoji, x, y, z, size, vz, gravity, color, tag }); game.follow(hero, { offset: { x: 0, y: 3.5, z: 7 } }).
- Helpers: game.rand(a, b), game.randInt(a, b), game.pick(list), game.chance(p), game.clamp(v, a, b), game.dist(a, b).

QUALITY BAR:
- The game must run on the first try with no console errors; use only the API above.
- Fun from the first second: clear goal, rising difficulty, feedback (sounds, particles, popups) on every action.
- Works on desktop and phones (buttons/swipes); objects leaving the screen use removeOffscreen: true.
- Readable code with short comments; all tuning values in CONFIG.

ANSWER FORMAT: two or three lines about the game, then the 3 files, then a short list of CONFIG values worth tweaking.
````

## Tips

- **CodePen:** put only the two CDN lines and `<div id="game"></div>` into the HTML panel, `style.css` into CSS, `script.js` into JS.
- **Iterating:** ask for changes as "change CONFIG.x to …" or "add …, show only the changed functions".
- **Errors:** paste the console error back to the model: "Fix this error: …".
- **Pin the version** (`@3.0.0`) in production; new versions never break old links.
