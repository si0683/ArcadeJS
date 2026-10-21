# ArcadeJS 1.1.0 — справочник для нейросетей

Ты пишешь браузерную 2D-игру на ArcadeJS. Результат — ровно 3 файла: HTML, CSS, JS (чистый JavaScript, без TypeScript, React, import/export, npm). Меню, настройки, отсчёт 3-2-1, пауза, «Игра окончена», рекорд, панель очков и жизней, звуки, кнопки для телефона уже есть во фреймворке — **не пиши их сам**. Пиши только правила своей игры.

## 1. HTML (для CodePen — целиком в окно HTML)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/si0683/ArcadeJS@1.1.0/arcade.css">
<script src="https://cdn.jsdelivr.net/gh/si0683/ArcadeJS@1.1.0/arcade.js"></script>
<div id="game"></div>
```

## 2. CSS

Можно оставить почти пустым. Свой цвет кнопок: `.arc-root { --arc-accent: #ff4d6d; }`

## 3. JS — каркас игры

```js
// ===== 0. ЛАБОРАТОРИЯ ИГРЫ 🧪 ===== (настройки для детей, 5–10 строк)
const LAB = { title: 'Моя игра', hero: '🐸', speed: 400, lives: 3, world: 'sky' };

Arcade.create({
  title: LAB.title,            // название в меню
  emoji: LAB.hero,             // большая картинка в меню
  subtitle: 'Цель игры',       // строка под названием
  help: '← → — движение',      // подсказка (по умолчанию — из buttons)
  width: 800, height: 600,     // размер мира; для телефона удобно 480 × 720
  world: LAB.world,            // sky, space, forest, ocean, night, candy, desert, city
  worlds: true,                // выбор мира в настройках
  lives: LAB.lives,            // 0 — без жизней
  quiz: false,                 // true — вопросы game.ask() и выбор предмета в настройках
  difficulty: false,           // true — выбор сложности → game.diff (0.75 / 1 / 1.35)
  buttons: ['left', 'right', 'action'], // кнопки на телефоне: left right up down action
  actionLabel: '●',            // надпись на кнопке action
  music: 'adventure',          // фоновая музыка: adventure, action, boss, calm, menu (false — без музыки)
  sounds: ['laser', 'explosion'], // звуки Kenney, которые загрузить заранее (остальные грузятся при первом вызове)
  emojiStyle: 'twemoji',       // эмодзи картинками Twemoji (одинаково везде); 'system' — шрифтом компьютера

  setup(game) { /* начало каждой игры: создать объекты и таймеры */ },
  update(game, dt) { /* каждый кадр: управление, столкновения; dt — секунды */ },
  draw(game, ctx) { /* необязательно: своё рисование поверх объектов */ },
  drawBehind(game, ctx) { /* необязательно: рисование под объектами */ },
  onOver(game, win) { /* необязательно: после конца игры */ }
});
```

Свои переменные храни в `game.data` (обнуляется при каждом старте): `game.data.hero = game.add({...})`. Свои функции объявляй ниже `Arcade.create` и передавай в них `game`.

## 4. Объекты

```js
const hero = game.add({ emoji: '🐸', x: 100, y: 300, size: 50, tag: 'hero' });
```

| Свойство | Что делает |
|---|---|
| `x, y` | центр объекта (в пикселях мира) |
| `emoji` / `image` / `text` / `shape: 'rect' \| 'circle'` | вид: эмодзи, спрайт Kenney (`image: 'knight'`, раздел 10) или своя картинка (`image: 'https://…png'`), надпись, фигура |
| `size` или `w, h` | размер (у эмодзи — размер шрифта) |
| `color, radius, glow` | цвет фигуры, скругление прямоугольника, свечение |
| `vx, vy` | скорость (пикс/с), `ax, ay` — ускорение, `gravity` — притяжение вниз |
| `friction, maxSpeed` | торможение, предел скорости |
| `angle, spin` | поворот (радианы) и скорость вращения |
| `flip, alpha, z, blink` | отражение, прозрачность, порядок рисования, мигание N секунд |
| `pose, animSpeed` | поза анимированного спрайта (`idle`, `walk`, `jump`, `fall`, `hurt`, `cheer`, `duck`, `attack`) — без `pose` выбирается сама; кадров в секунду |
| `tag` | группа: `'enemy'`, `'coin'`… |
| `bounce, wrap, inside` | отскок от краёв экрана / выход с другой стороны / не выходить за край |
| `removeOffscreen: true` | удалить, когда улетел далеко за экран (для пуль и падающих предметов) |
| `life: 2, fade: true` | исчезнуть через 2 с, плавно бледнея |
| `oneWay: true` | платформа, сквозь которую прыгают снизу (для `game.collide`) |
| `fixed: true` | не двигается с камерой (интерфейс) |
| `hitbox: 0.8` | доля размера для столкновений; `hp` — здоровье; любые свои поля тоже можно |

| Функция | Что делает |
|---|---|
| `obj.remove()` / `game.remove(obj)` | удалить |
| `game.all('enemy')`, `game.first('hero')`, `game.count('coin')`, `game.clear('enemy')` | найти, посчитать, удалить группу |
| `game.hit(a, b)` | столкнулись ли a и b |
| `game.hitAny(a, 'coin')` | первый объект группы, который касается a, или null |
| `game.hitAll(a, 'coin')` | все такие объекты |
| `game.collide(a, 'ground')` | выталкивает a из твёрдых объектов группы; возвращает `{ top, bottom, left, right }`, ставит `a.onGround` |
| `game.follow(hero, { atX: 0.4, minX: 0, maxX: 3000 })` | камера едет за героем (`game.camera.x/y`) |

## 5. Управление

| Код | Что значит |
|---|---|
| `game.key.left / right / up / down / action` | клавиша зажата (стрелки, WASD, пробел/Enter, кнопки на телефоне) |
| `game.pressed('action')` | нажата в этом кадре (прыжок, выстрел). Касание экрана = `action` |
| `game.pressed('left')` и т.д. | нажатие стрелки **или свайп** в эту сторону |
| `game.isDown('KeyF')`, `game.pressed('KeyF')` | любая клавиша по коду |
| `game.pointer.x / y / down` | мышь или палец (координаты мира) |

## 6. Очки, жизни, уровни, экраны

| Функция | Что делает |
|---|---|
| `game.addScore(10, x, y)` | очки (+ всплывающая надпись в x, y) |
| `game.loseLife()` | минус жизнь, тряска, звук, неуязвимость `hurtTime` с; при 0 — конец игры. Вернёт false, если герой ещё неуязвим |
| `game.addLife()` | плюс жизнь |
| `game.nextLevel()` | уровень +1 и надпись «Уровень N»; `game.level` |
| `game.hud('⏱', 30)` | своя строка на панели |
| `game.message('Текст', 2)` | надпись по центру на 2 с |
| `game.over()` / `game.win()` | конец игры: проигрыш / победа (рекорд сохранится сам) |
| `game.score, game.lives, game.level, game.time, game.diff, game.width, game.height, game.state` | состояние |

## 7. Таймеры, эффекты, звуки, рисование

| Функция | Что делает |
|---|---|
| `game.every(1.5, fn)`, `game.after(3, fn)` | повтор / один раз через N секунд; `fn(game)`; на паузе стоят |
| `game.burst(x, y, { emoji: '✨', color, count: 16 })` | взрыв частиц |
| `game.popup(x, y, '+10', color)`, `game.shake(8, 0.3)`, `game.flash('#fff')` | надпись, тряска, вспышка |
| `game.sound('coin', 0.5)` | звук и громкость: встроенные, Kenney и ZzFX — раздел 9 |
| `game.text(t, x, y, { size, color })`, `game.emoji(e, x, y, size)`, `game.rect(x, y, w, h, color, { radius })`, `game.circle(x, y, r, color)`, `game.line(x1, y1, x2, y2, color, width)` | рисование в `draw` |
| `game.rand(a, b)`, `game.randInt(a, b)`, `game.pick(list)`, `game.chance(0.3)`, `game.clamp(v, a, b)`, `game.dist(a, b)`, `game.angleTo(a, b)` | помощники |

## 8. Вопросы и выбор улучшения

```js
// quiz: true в Arcade.create; предмет (математика, русский, английский, история России) — в настройках
game.ask().then(ok => { if (ok) game.addScore(10); else game.loseLife(); });
// Свой вопрос:
game.ask({ text: 'Столица России?', answer: 'Москва', options: ['Москва', 'Казань', 'Сочи', 'Омск'] });

// Выбор 1 из нескольких карточек (игра на паузе, пока не выбрали):
game.choose([
  { icon: '⚡', title: 'Быстрее', text: '+20% скорости', apply: () => { game.data.speed *= 1.2; } },
  { icon: '❤️', title: '+1 жизнь', text: 'Ещё попытка', apply: () => game.addLife() }
]).then(card => card.apply());
```

## 9. Звуки и музыка

```js
game.sound('coin');            // встроенный звук (12 шт.)
game.sound('laser', 0.7);      // звук Kenney (67 шт., грузится при первом вызове)
game.sound('retro-jump');      // 8-битный звук, синтезатор ZzFX (без файлов)
game.sound([, , 800, , .02, .05, 1]); // свой звук ZzFX: числа из конструктора https://killedbyapixel.github.io/ZzFX/
game.music('boss');            // сменить фоновую музыку; game.music(false) — выключить
```

- Встроенные: jump, coin, crash, flap, hit, score, start, tick, bonus, lose, click, win.
- Kenney (CC0): back, bell, bong, book, boom, chop, close, cloth, coins, computer, confirm, creak, door, door-close, drop, engine, error, explosion, forcefield, glass, glass-break, glitch, high-up, jingle-hit, jingle-nes, jingle-pizzi, jingle-sax, jingle-steel, knife, laser, laser-big, laser-retro, laser-small, laser2, laser3, low-down, metal, metal-click, mining, open, pep, phase-jump, phaser, phaser-down, plate, pluck, pot, powerup, powerup2, punch, punch-heavy, question, scroll, select, slime, space-trash, step, step-snow, step-wood, switch, sword, three-tone, thruster, thud, toggle, wood, zap.
- ZzFX: retro-coin, retro-jump, retro-laser, retro-explosion, retro-boom, retro-hit, retro-powerup, retro-levelup, retro-win, retro-error, retro-blip, retro-click, retro-select, retro-bounce, retro-bubble, retro-magic, retro-whoosh, retro-splash, retro-alarm, retro-step.
- Музыка (`music` в Arcade.create): adventure, action, boss, calm, menu. Играет во время игры, молчит в меню и на паузе, выключается в настройках.

## 10. Спрайты Kenney и эмодзи-картинки

```js
game.add({ image: 'knight', x: 100, y: 300, size: 64 });                 // картинка из набора
game.add({ image: 'adventurer', x, y, w: 44, h: 62, gravity: 1900 });     // персонаж: ходьба, прыжок и падение включаются сами
game.add({ image: 'slime', x, y, size: 46, vx: -70 });                     // анимированный враг
```

Картинка вписывается в `size` (или `w × h`) без искажений; пиксельные спрайты не размываются. Мультяшные персонажи смотрят вправо (`flip: true` — влево), эмодзи — влево.

| Набор | Имена |
|---|---|
| Персонажи с анимацией (ходьба, прыжок, падение, удар, радость) | adventurer, explorer, robot, zombie, woman, man |
| Пиксельные персонажи (2 кадра ходьбы) | alien-green, alien-blue, alien-pink, alien-yellow, bat, slime, crab |
| Пиксельные блоки и предметы | grass, dirt, snow, crate, block-coin, block-gold, plank, ladder, water, water-top, spikes, spring, lever, door, flag, sign, pipe, key, chest-gold, coin, gem, heart, heart-half, heart-empty, mushroom, plant, tree, cactus, snowman, cloud, block-angry, saw, spike-bot |
| Подземелье (пиксели) | knight, hero, wizard, dwarf, viking, elf, princess, old-man, rogue, orc, skeleton, ghost, spider, cyclops, crab-red, sword, axe, hammer, dagger, potion-red, potion-green, potion-blue, chest, barrel |
| Космос | ship-blue, ship-green, ship-red, ship-orange, ufo-red, ufo-green, ufo-blue, ufo-yellow, enemy-black, enemy-blue, enemy-green, enemy-red, meteor-big, meteor, meteor-small, meteor-grey, laser-blue, laser-red, laser-green, powerup-shield, powerup-bolt, powerup-star, pill, star-gold |
| Животные (круглые) | elephant, giraffe, hippo, monkey, panda, parrot, penguin, pig, rabbit, snake |

Все имена — `Arcade.sprites`. В 3D: `game.add3d({ image: 'robot', w: 2, h: 2.6 })`.

Эмодзи (`emoji: '🐸'`) рисуются картинками Twemoji — одинаково на Windows, телефоне и Mac. Если картинка не загрузилась, эмодзи рисуется шрифтом.

## 11. Физика (Matter.js) — `physics: true`

Для игр, где всё падает, катится, складывается в башни и разлетается (как Angry Birds). Matter.js загрузится сам.

```js
Arcade.create({
  physics: { gravity: 1, walls: true, drag: 'ball' }, // walls — стены и пол по краям; drag — какие объекты можно тянуть мышью/пальцем (true — любые)
  setup(game) {
    game.add({ x: 400, y: 585, w: 800, h: 30, color: '#6ab04c', body: 'static' });       // неподвижная опора
    game.add({ emoji: '📦', bodyShape: 'box', x: 500, y: 300, size: 60, body: true, tag: 'box' }); // ящик
    const ball = game.add({ emoji: '⚽', x: 200, y: 100, size: 50, body: true, restitution: 0.8, tag: 'ball' }); // мяч, упругий
    game.onCollide('ball', 'box', (ball, box) => { box.remove(); game.addScore(10); });
  }
});
```

| Код | Что делает |
|---|---|
| `body: true` / `body: 'static'` | объект подчиняется физике / неподвижная опора |
| `bodyShape: 'box' \| 'circle'` | форма тела (по умолчанию: эмодзи и круги — круг, остальное — прямоугольник) |
| `restitution` (0…1), `density`, `friction` | упругость, тяжесть, трение |
| `game.velocity(obj, vx, vy)`, `game.push(obj, vx, vy)` | задать / добавить скорость (пикс/с) |
| `game.onCollide('a', 'b', (a, b) => …)` | столкнулись объекты двух групп |
| `game.link(a, b, { length, stiffness })` | верёвка/пружина между объектами; `b` может быть точкой `{ x, y }`. `game.unlink(link)` — убрать |
| `game.physics.Matter`, `game.physics.engine` | сам Matter.js для сложного |

Положение физических объектов (`x, y, angle, vx, vy`) обновляется само — не меняй их напрямую, используй `game.velocity`.

## 12. 3D (Three.js) — `mode: '3d'`

Меню, панель, звуки, очки, жизни, `game.key`, `game.pressed`, `game.every`, `game.hit` работают как в 2D. Three.js загрузится сам. Оси: x — вправо, y — вверх, z — к камере (вдаль — отрицательные z).

```js
Arcade.create({
  mode: '3d', world: 'space', buttons: ['left', 'right', 'action'],
  setup(game) {
    game.add3d({ shape: 'plane', w: 10, d: 200, z: -90, color: '#2b2d42' });              // пол
    game.data.hero = game.add3d({ emoji: '🛸', w: 1.8, h: 1.8, y: 0.9, gravity: 24, tag: 'hero' }); // эмодзи в 3D
    game.follow(game.data.hero, { offset: { x: 0, y: 3.5, z: 7 } });                     // камера сзади
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

| `game.add3d({...})` | Что значит |
|---|---|
| `shape` | `box`, `sphere`, `cylinder`, `cone`, `plane` (пол), `emoji` (картинка-эмодзи, всегда смотрит в камеру; ставится сама, если указан `emoji`) |
| `x, y, z`, `w, h, d` или `size` | положение и размер (в метрах) |
| `vx, vy, vz`, `gravity`, `spin` | скорость, притяжение вниз (объект встаёт на пол y = 0, `onGround`), вращение |
| `color, tag, life, blink, removeOffscreen` | как в 2D (`removeOffscreen` — удалить, когда пролетел за камеру) |
| `game.follow(obj, { offset: { x, y, z } })` | камера едет за объектом |
| `game.three.THREE / scene / camera / renderer / sun` | сам Three.js для сложного |

## 13. Полный пример (лови фрукты)

```js
const LAB = { title: 'Фруктопад', hero: '🧺', speed: 500, lives: 3 };

Arcade.create({
  title: LAB.title, emoji: '🍉', subtitle: 'Лови фрукты, не лови бомбы',
  world: 'sky', worlds: true, lives: LAB.lives, buttons: ['left', 'right'],
  setup(game) {
    game.data.hero = game.add({ emoji: LAB.hero, x: game.width / 2, y: game.height - 60, size: 70, inside: true });
    game.every(0.7, drop);
  },
  update(game, dt) {
    const hero = game.data.hero;
    hero.vx = 0;
    if (game.key.left) hero.vx = -LAB.speed;
    if (game.key.right) hero.vx = LAB.speed;
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

Ещё примеры (каждый — 3 файла): https://github.com/si0683/ArcadeJS/tree/main/examples — `starter` (лови фрукты), `flappy` (птичка), `snake` (змейка + вопросы), `breakout` (арканоид + выбор улучшения), `platformer` (карта из символов, камера, платформы), `shooter` (автострельба, сложность), `angry` (физика Matter.js: рогатка и башня), `runner3d` (3D на Three.js), `adventure` (спрайты и звуки Kenney, музыка).

## Правила

- Комментарии в коде — на русском, код простой: функции, без классов.
- В начале JS — объект `LAB` (настройки для детей), дальше `Arcade.create`, ниже свои функции.
- Не используй `requestAnimationFrame`, `setInterval`, свои меню и свой `<canvas>`: всё это уже делает ArcadeJS. Для повторов — `game.every`.
- Объекты, которые улетают с экрана (пули, падающие предметы), создавай с `removeOffscreen: true`.
- Графика — эмодзи, спрайты Kenney (`image`) и фигуры. Чужие картинки из интернета не нужны.
