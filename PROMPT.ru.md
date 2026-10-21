# Шаблон промта: любая игра на ArcadeJS

Заполните блок **МОЯ ИГРА** и вставьте весь промт в любую нейросеть (ChatGPT, Claude, Gemini, Qwen, GigaChat, DeepSeek…). Получите готовую игру из 3 файлов, которая работает локально, на любом хостинге или в CodePen. Внутри промта — краткая шпаргалка API, поэтому он работает, даже если нейросеть не открывает ссылки.

English version — [PROMPT.md](PROMPT.md). Полный справочник — [AI.md](AI.md).

````text
Ты — опытный разработчик браузерных игр. Сделай готовую игру на фреймворке ArcadeJS.

МОЯ ИГРА:
Название: Космический кот
Идея: кот летит на ракете, ловит рыбок и уворачивается от метеоритов; каждые 10 рыбок игра ускоряется
Управление: стрелки или A/D; на телефоне — экранные кнопки и свайпы
Вид: мир «космос»; графика эмодзи (или встроенные спрайты Kenney); фоновая музыка
Дополнительно: уровни, выбор улучшения между уровнями, босс каждые 3 уровня
Язык интерфейса: русский (lang: 'ru')

РЕЗУЛЬТАТ — ровно 3 файла, каждый в своём блоке кода с именем файла над ним:
1) index.html — полный HTML-документ, который подключает
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/si0683/ArcadeJS@2.0.0/arcade.css">
   <script src="https://cdn.jsdelivr.net/gh/si0683/ArcadeJS@2.0.0/arcade.js"></script>
   а также style.css, пустой <div id="game"></div> и script.js в конце <body>;
2) style.css — обычно почти пустой (можно свой цвет кнопок: .arc-root { --arc-accent: #ff4d6d; });
3) script.js — чистый JavaScript: объект CONFIG с настройками, затем Arcade.create({...}), ниже свои функции.
Только HTML, CSS и чистый JavaScript: без TypeScript, React, npm, import/export и сборки.

Справочник ArcadeJS (прочитай сначала): https://cdn.jsdelivr.net/gh/si0683/ArcadeJS@2.0.0/AI.md
Запасная ссылка: https://raw.githubusercontent.com/si0683/ArcadeJS/main/AI.md · Примеры: https://github.com/si0683/ArcadeJS/tree/main/examples

Если ссылки не открываются, вот главное:
- В ArcadeJS уже есть: меню, настройки, отсчёт 3-2-1, пауза, «Игра окончена», рекорд, панель очков/жизней/уровня, управление клавиатурой/мышью/касаниями/свайпами, экранные кнопки, звуки, музыка, частицы, спрайты, камера. НЕ пиши свои меню, <canvas>, requestAnimationFrame и setInterval.
- Arcade.create({ title, emoji, subtitle, help, width: 800, height: 600, world: 'sky'|'space'|'forest'|'ocean'|'night'|'candy'|'desert'|'city', worlds: true, lives: 3, buttons: ['left','right','up','down','action'], music: 'adventure'|'action'|'boss'|'calm'|'menu', lang: 'ru', quiz, difficulty, physics, mode: '3d', setup(game) {...}, update(game, dt) {...}, draw(game, ctx) {...} }). Свои переменные — в game.data.
- Объекты: game.add({ emoji: '🐱' | image: 'knight' | text | shape: 'rect'|'circle', x, y, size или w/h, color, vx, vy, gravity, spin, angle, flip, tag, bounce, wrap, inside, removeOffscreen: true, life, blink, hitbox, hp }). obj.remove(); game.all(tag); game.first(tag); game.count(tag); game.clear(tag).
- Столкновения: game.hit(a, b); game.hitAny(a, 'tag') → объект или null; game.collide(a, 'ground') — твёрдые платформы, ставит a.onGround (oneWay: true — сквозь снизу); game.follow(hero) — камера.
- Управление: game.key.left/right/up/down/action (зажато); game.pressed('action') (нажато сейчас; касание = action); game.pressed('left') срабатывает и на свайп; game.pointer.x/y/down.
- Игра: game.addScore(10, x, y), game.loseLife() (при 0 — конец игры), game.addLife(), game.nextLevel(), game.over(), game.win(), game.message('Текст'), game.hud('⏱', 30); состояние: game.score, lives, level, time, diff, width, height.
- Таймеры и эффекты: game.every(сек, fn), game.after(сек, fn) — fn(game); game.burst(x, y, { emoji: '✨', count }), game.popup(x, y, '+10'), game.shake(), game.flash(цвет).
- Звуки: game.sound(имя, громкость) — встроенные jump, coin, crash, flap, hit, score, start, tick, bonus, lose, click, win; Kenney laser, explosion, boom, powerup, coins, sword, punch, door, zap, step, error, confirm, jingle-nes…; 8-битные retro-jump, retro-coin, retro-laser, retro-explosion, retro-powerup, retro-win… game.music('boss').
- Спрайты (image: имя): персонажи с анимацией adventurer, explorer, robot, zombie, woman, man (ходьба/прыжок/падение сами, смотрят вправо); пиксельные alien-green, slime, bat, knight, wizard, orc, skeleton, ghost, spider; блоки grass, dirt, crate, plank, spikes, coin, gem, heart, flag, door, key; космос ship-blue, ufo-red, enemy-red, meteor, laser-blue, powerup-star; животные panda, penguin, rabbit, monkey, pig.
- Улучшения: game.choose([{ icon, title, text, apply }]).then(card => card.apply()). Вопросы: quiz: { questions: [{ text, answer, wrong: [...] }] } и game.ask().then(ok => ...).
- Физика (physics: { walls: true, drag: true }): game.add({ ..., body: true | 'static', bodyShape: 'box', restitution }); game.velocity(obj, vx, vy); game.onCollide('a', 'b', fn); game.link(a, b).
- 3D (mode: '3d'): game.add3d({ shape: 'box'|'sphere'|'plane'|'emoji', emoji, x, y, z, size, vz, gravity, color, tag }); game.follow(hero, { offset: { x: 0, y: 3.5, z: 7 } }).
- Помощники: game.rand(a, b), game.randInt(a, b), game.pick(список), game.chance(p), game.clamp(v, a, b), game.dist(a, b).

ТРЕБОВАНИЯ К КАЧЕСТВУ:
- Игра работает с первого запуска без ошибок в консоли; используй только API выше.
- Интересно с первой секунды: понятная цель, растущая сложность, отклик (звук, частицы, надписи) на каждое действие.
- Работает на компьютере и телефоне (кнопки, свайпы); улетающие объекты — с removeOffscreen: true.
- Понятный код с короткими комментариями; все числа для настройки — в CONFIG.

ФОРМАТ ОТВЕТА: две-три строки об игре, затем 3 файла, затем короткий список настроек CONFIG, которые стоит покрутить.
````

## Советы

- **CodePen:** в окно HTML — только две строки CDN и `<div id="game"></div>`, в CSS — style.css, в JS — script.js.
- **Доработки:** просите «поменяй CONFIG.x на …» или «добавь …, покажи только изменённые функции».
- **Ошибки:** вставьте нейросети текст ошибки из консоли: «Исправь ошибку: …».
- **Фиксируйте версию** (`@2.0.0`) в рабочих проектах: новые версии не ломают старые ссылки.
