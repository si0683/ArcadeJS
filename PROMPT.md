# Промт: любая игра на ArcadeJS

Шаблон промта для быстрой разработки: ученик (или вы) меняет строки «МОЯ ИГРА» — название, идею, управление и мир, а нейросеть (Qwen, ChatGPT, GigaChat, DeepSeek…) пишет игру на ArcadeJS. Получается 3 файла — HTML, CSS, JS — для CodePen. Скопируйте промт **одной кнопкой** (два квадратика в правом верхнем углу блока).

Полный справочник движка — [AI.md](AI.md), примеры — [examples](examples).

<!-- Файл создаётся скриптом CreateGame01PROMT/tools/build.py (D:\02GameBrowser\CreateGame01PROMT) — правьте там. -->

<!-- Для ИИ-агентов: ВЕСЬ промт — один блок ````text. Шпаргалка API внутри промта нужна, если нейросеть не откроет ссылку на AI.md.
     Версия ArcadeJS в ссылках — ARCADE_VERSION в tools/build.py. -->

````text
Ты — разработчик браузерных игр. Сделай игру для CodePen на моём игровом движке ArcadeJS.

МОЯ ИГРА (меняю только эти строки):
Название: Космический кот
Идея: кот летает на ракете, ловит рыбок и уворачивается от метеоритов
Управление: стрелки влево-вправо, на телефоне кнопки
Мир: космос

Миры: небо (sky), космос (space), лес (forest), океан (ocean), ночь (night), сладости (candy), пустыня (desert), город (city).
В идею можно добавить: вопросы по математике, русскому, английскому или истории; физику (всё падает и сталкивается); 3D.

Должно получиться ровно 3 файла, как три окна в CodePen: HTML, CSS, JS.
Только обычный HTML, CSS и ЧИСТЫЙ JavaScript. НЕ используй TypeScript, React, JSX, Vue, npm, import и export, свой <canvas>, requestAnimationFrame и setInterval.

Полный справочник движка: https://cdn.jsdelivr.net/gh/si0683/ArcadeJS@1.0.0/AI.md
Запасная ссылка: https://raw.githubusercontent.com/si0683/ArcadeJS/main/AI.md
Готовые примеры: https://github.com/si0683/ArcadeJS/tree/main/examples

Если ссылки не открываются, вот главное:
- HTML — ровно эти 3 строки:
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/si0683/ArcadeJS@1.0.0/arcade.css">
<script src="https://cdn.jsdelivr.net/gh/si0683/ArcadeJS@1.0.0/arcade.js"></script>
<div id="game"></div>
- CSS — почти пустой, можно свой цвет кнопок: .arc-root { --arc-accent: #ff4d6d; }
- JS: сначала const LAB = { ... } — 6–10 настроек для детей с комментариями (название, герой-эмодзи, скорость, жизни…), потом
  Arcade.create({ title, emoji, subtitle, help, world, worlds: true, lives, buttons: ['left', 'right', 'action'], quiz, physics, mode, setup(game) { ... }, update(game, dt) { ... } })
  и ниже свои функции. Свои переменные храни в game.data. Меню, настройки, отсчёт, пауза, «Игра окончена», рекорд, панель очков и жизней уже есть — не пиши их.
- Объекты: const hero = game.add({ emoji: '🐱', x, y, size: 60, vx, vy, gravity, tag: 'hero', inside: true }); враги и предметы — с tag и removeOffscreen: true.
  Свойства: x, y (центр), size или w, h, emoji / text / shape: 'rect' | 'circle', color, vx, vy, gravity, spin, angle, flip, bounce, wrap, inside, life, blink, hitbox.
- obj.remove(), game.all('tag'), game.first('tag'), game.count('tag'), game.hit(a, b), game.hitAny(a, 'tag'), game.collide(a, 'ground') — твёрдые платформы (a.onGround), game.follow(hero) — камера.
- Управление: game.key.left / right / up / down / action — зажато; game.pressed('action') — нажато сейчас (пробел, касание); game.pressed('left') — стрелка или свайп; game.pointer.x / y / down — мышь и палец.
- game.addScore(10, x, y), game.loseLife(), game.addLife(), game.nextLevel(), game.over(), game.win(), game.message('Текст'), game.hud('⏱', 30).
- game.every(1.5, fn), game.after(2, fn) — таймеры; game.burst(x, y, { emoji: '✨' }), game.popup(x, y, '+10'), game.shake(); game.sound('coin') — jump, coin, crash, flap, hit, score, start, tick, bonus, lose, click, win.
- game.rand(a, b), game.randInt(a, b), game.pick(list), game.chance(0.3), game.clamp(v, a, b).
- Вопросы (quiz: true): game.ask().then(ok => { ... }). Выбор улучшения: game.choose([{ icon, title, text, apply }]).then(card => card.apply()).
- Физика (physics: { walls: true, drag: true }): game.add({ ..., body: true }) или body: 'static'; game.velocity(obj, vx, vy), game.onCollide('a', 'b', fn), game.link(a, b).
- 3D (mode: '3d'): game.add3d({ shape: 'box' | 'sphere' | 'emoji', emoji, x, y, z, size, vz, gravity, color, tag }), пол — shape: 'plane'; game.follow(hero, { offset: { x: 0, y: 3.5, z: 7 } }).

Пример игры целиком:
const LAB = { title: 'Фруктопад', hero: '🧺', speed: 500, lives: 3 };
Arcade.create({
  title: LAB.title, emoji: '🍉', subtitle: 'Лови фрукты', world: 'sky', worlds: true, lives: LAB.lives, buttons: ['left', 'right'],
  setup(game) {
    game.data.hero = game.add({ emoji: LAB.hero, x: game.width / 2, y: game.height - 60, size: 70, inside: true });
    game.every(0.7, g => g.add({ emoji: g.pick(['🍎', '🍌', '💣']), x: g.rand(40, g.width - 40), y: -30, size: 48, vy: 220, tag: 'item', removeOffscreen: true }));
  },
  update(game, dt) {
    const hero = game.data.hero;
    hero.vx = game.key.left ? -LAB.speed : game.key.right ? LAB.speed : 0;
    if (game.pointer.down) hero.x = game.pointer.x;
    const item = game.hitAny(hero, 'item');
    if (item) { item.remove(); if (item.emoji === '💣') game.loseLife(); else { game.addScore(1, item.x, item.y); game.sound('coin'); } }
  }
});

Как выдавать код:
- Сначала одной строкой опиши, какой будет игра. Потом файлы, без долгих рассуждений.
- По одному файлу за ответ: HTML, после моего «дальше» — CSS, после следующего «дальше» — JS.
- Перед каждым блоком кода одна строка: «Файл 1 из 3 — HTML. Вставьте в окно HTML и напишите: дальше» (так же для CSS и JS).
- Комментарии в коде на русском. Код без ошибок, игра работает с первого раза.

Когда игра будет готова, я буду просить изменения. Меняй по возможности только объект LAB в начале JS и отвечай коротко: строка «было» и строка «стало». Если я напишу «настройки», перечисли настройки LAB с номерами.

Начинай.
````

> **Только для преподавателя.** Здесь нейросеть действительно пишет игру сама, но на нашем движке: ей не нужно писать меню, физику, звуки и экраны, поэтому код короткий и почти всегда работает с первого раза. Если игра не заработала, скопируйте красную ошибку из консоли CodePen и отправьте Qwen: «Исправь ошибку: …».

## Как менять игру на уроке

1. Вставьте промт в Qwen, **не отправляя**, и вместе с учеником перепишите четыре строки «МОЯ ИГРА»: название, идею одним предложением, управление и мир.
2. Режим Qwen: ❌ без «Web Dev» и «Мышления», ✅ с «Поиском» (чтобы открыть справочник).
3. Три ответа Qwen вставьте в окна **HTML**, **CSS**, **JS** на [codepen.io/pen](https://codepen.io/pen/).
4. Идеи для учеников: «кот ловит рыбок в космосе», «змейка в лесу ест ягоды и отвечает на вопросы по математике», «башня из ящиков, которую надо сбить мячом» (физика), «гонка по 3D-трассе» (3D).

Готовые примеры игр на ArcadeJS: [Фруктопад](https://si0683.github.io/ArcadeJS/examples/starter/) · [Флаппи](https://si0683.github.io/ArcadeJS/examples/flappy/) · [Змейка-умник](https://si0683.github.io/ArcadeJS/examples/snake/) · [Космо-арканоид](https://si0683.github.io/ArcadeJS/examples/breakout/) · [Лисёнок](https://si0683.github.io/ArcadeJS/examples/platformer/) · [Звёздный патруль](https://si0683.github.io/ArcadeJS/examples/shooter/) · [Злые эмодзи](https://si0683.github.io/ArcadeJS/examples/angry/) · [Космо-раннер 3D](https://si0683.github.io/ArcadeJS/examples/runner3d/)
