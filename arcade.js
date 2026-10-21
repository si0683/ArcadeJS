/* ============================================================
   ArcadeJS 1.0.0 — фреймворк для быстрых 2D-игр в браузере.
   Подключение (две строки в HTML):
     <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/si0683/ArcadeJS@1.0.0/arcade.css">
     <script src="https://cdn.jsdelivr.net/gh/si0683/ArcadeJS@1.0.0/arcade.js"></script>
   Игра: Arcade.create({ title, setup(game), update(game, dt) }).
   Фреймворк сам делает меню, настройки, отсчёт, паузу, экран
   «Игра окончена», рекорд, панель очков и жизней, управление
   с клавиатуры, мыши и телефона, звуки, частицы и вопросы-квиз.
   Документация: https://github.com/si0683/ArcadeJS (AI.md — для нейросетей).
   Разделы файла:
   1. Константы: звуки, миры, клавиши
   2. Вопросы для квиза
   3. Помощники
   4. Создание игры: Arcade.create
   ============================================================ */
(function () {
  'use strict';

  const VERSION = '1.0.0';

  // Адрес папки, откуда загружен arcade.js: рядом лежат звуки
  const SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';
  const BASE = SCRIPT_SRC ? SCRIPT_SRC.replace(/[^/]*$/, '') : 'https://cdn.jsdelivr.net/gh/si0683/ArcadeJS@' + VERSION + '/';

  /* ---------------------------------------------------------
     1. КОНСТАНТЫ
     --------------------------------------------------------- */

  // Встроенные звуки: game.sound('coin')
  const SOUNDS = {
    jump: 'jump.wav', coin: 'coin.mp3', crash: 'crash.wav', flap: 'flap.wav',
    hit: 'hit.wav', score: 'score.mp3', start: 'start.wav', tick: 'tick.wav',
    bonus: 'bonus.wav', lose: 'lose.wav', click: 'click.wav', win: 'win.mp3'
  };

  // Миры: цвета фона, акцент для кнопок и украшения на фоне
  const WORLDS = {
    sky:    { name: 'Небо',    icon: '☁️', top: '#5ab8f5', bottom: '#d6f1ff', accent: '#ff8a3d', deco: 'clouds' },
    space:  { name: 'Космос',  icon: '🚀', top: '#04010d', bottom: '#1d0b40', accent: '#00e5ff', deco: 'stars' },
    forest: { name: 'Лес',     icon: '🌲', top: '#1d5e3a', bottom: '#9bd770', accent: '#ffd23f', deco: 'leaves' },
    ocean:  { name: 'Океан',   icon: '🌊', top: '#023e8a', bottom: '#4cc9f0', accent: '#ffd166', deco: 'bubbles' },
    night:  { name: 'Ночь',    icon: '🌙', top: '#0b1026', bottom: '#3b2a7a', accent: '#f472b6', deco: 'stars' },
    candy:  { name: 'Сладости', icon: '🍭', top: '#ff9ec7', bottom: '#fff0f6', accent: '#7b2cbf', deco: 'hearts' },
    desert: { name: 'Пустыня', icon: '🏜️', top: '#f6a65a', bottom: '#ffecc2', accent: '#c0392b', deco: 'sun' },
    city:   { name: 'Город',   icon: '🏙️', top: '#1f2235', bottom: '#5c6784', accent: '#ff4d6d', deco: 'buildings' }
  };

  // Имена клавиш: game.key.left, game.pressed('action')
  const KEYMAP = {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
    up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
    action: ['Space', 'Enter']
  };

  // Внешние библиотеки: грузятся с CDN, только если игра их просит
  const LIBS = {
    matter: 'https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js',   // physics: true
    three: 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js'  // mode: '3d'
  };

  // Сложность из настроек: game.diff — множитель скорости и силы врагов
  const DIFFICULTIES = [
    { id: 'easy', label: '🙂 Легко', value: 0.75 },
    { id: 'normal', label: '😎 Нормально', value: 1 },
    { id: 'hard', label: '😈 Сложно', value: 1.35 }
  ];

  /* ---------------------------------------------------------
     2. ВОПРОСЫ ДЛЯ КВИЗА (quiz: true)
     --------------------------------------------------------- */

  const SUBJECTS = [
    { id: 'math', label: '🧮 Математика' },
    { id: 'rus', label: '📝 Русский' },
    { id: 'eng', label: '🔤 Английский' },
    { id: 'hist', label: '🏛️ История России' }
  ];

  // Русский язык: слово и номер пропущенной буквы (с нуля)
  const RUS_WORDS = [
    ['МОЛОКО', 1], ['СОБАКА', 1], ['КОРОВА', 1], ['ВОРОНА', 1], ['БЕРЁЗА', 1],
    ['ЗАЯЦ', 1], ['ПЕТУХ', 1], ['ЛИСИЦА', 1], ['МЕДВЕДЬ', 1], ['КАРАНДАШ', 1],
    ['ТЕТРАДЬ', 1], ['ПЕНАЛ', 1], ['ЯГОДА', 3], ['МАГАЗИН', 1], ['ГОРОД', 1],
    ['УЧЕНИК', 2], ['ДЕЖУРНЫЙ', 1], ['РЕБЯТА', 1], ['КАПУСТА', 1], ['ПОГОДА', 1],
    ['СОРОКА', 1], ['ВЕТЕР', 1], ['МОРКОВЬ', 1], ['ПАЛЬТО', 1], ['ОГУРЕЦ', 2],
    ['ХОРОШО', 1], ['ДЕВОЧКА', 1], ['ЯЗЫК', 1]
  ];
  const VOWELS = ['А', 'О', 'Е', 'И', 'Я', 'У'];

  // Английский: слово и перевод
  const ENG_WORDS = [
    ['APPLE', 'Яблоко'], ['DOG', 'Собака'], ['CAT', 'Кошка'], ['SPACE', 'Космос'],
    ['STAR', 'Звезда'], ['SUN', 'Солнце'], ['MOON', 'Луна'], ['HOUSE', 'Дом'],
    ['BOOK', 'Книга'], ['WATER', 'Вода'], ['TREE', 'Дерево'], ['BIRD', 'Птица'],
    ['FISH', 'Рыба'], ['SCHOOL', 'Школа'], ['FRIEND', 'Друг'], ['MOTHER', 'Мама'],
    ['FATHER', 'Папа'], ['GREEN', 'Зелёный'], ['RED', 'Красный'], ['BIG', 'Большой'],
    ['MILK', 'Молоко'], ['BREAD', 'Хлеб'], ['SKY', 'Небо'], ['EARTH', 'Земля'],
    ['FLOWER', 'Цветок'], ['CAR', 'Машина']
  ];

  // История России: вопрос, ответ, три неверных варианта
  const HISTORY = [
    ['Кто первым полетел в космос?', 'Гагарин', ['Титов', 'Леонов', 'Королёв']],
    ['В каком году Гагарин полетел в космос?', '1961', ['1957', '1965', '1945']],
    ['Кто первым вышел в открытый космос?', 'Леонов', ['Гагарин', 'Титов', 'Терешкова']],
    ['Кто первая женщина-космонавт?', 'Терешкова', ['Савицкая', 'Кондакова', 'Кикина']],
    ['В каком году запустили первый спутник Земли?', '1957', ['1961', '1945', '1969']],
    ['Кто был главным конструктором первых ракет?', 'Королёв', ['Гагарин', 'Туполев', 'Калашников']],
    ['Кто основал Санкт-Петербург?', 'Пётр I', ['Иван Грозный', 'Екатерина II', 'Александр I']],
    ['В каком году основан Санкт-Петербург?', '1703', ['1613', '1812', '1147']],
    ['В каком году Москва впервые упомянута в летописи?', '1147', ['988', '1240', '1380']],
    ['Кто основал Москву?', 'Юрий Долгорукий', ['Иван Калита', 'Дмитрий Донской', 'Ярослав Мудрый']],
    ['В каком году крестили Русь?', '988', ['1147', '862', '1380']],
    ['Какой князь крестил Русь?', 'Владимир', ['Олег', 'Игорь', 'Святослав']],
    ['В каком году была Куликовская битва?', '1380', ['1242', '1612', '1812']],
    ['Кто победил на Куликовом поле?', 'Дмитрий Донской', ['Александр Невский', 'Иван III', 'Пётр I']],
    ['Кто победил в Ледовом побоище?', 'Александр Невский', ['Дмитрий Донской', 'Юрий Долгорукий', 'Владимир']],
    ['В каком году было Ледовое побоище?', '1242', ['1240', '1380', '1480']],
    ['Кто стал первым русским царём?', 'Иван Грозный', ['Пётр I', 'Михаил Романов', 'Борис Годунов']],
    ['Кто освободил Москву в 1612 году?', 'Минин и Пожарский', ['Кутузов', 'Суворов', 'Ермак']],
    ['В каком году была война с Наполеоном?', '1812', ['1612', '1914', '1941']],
    ['Кто командовал русской армией в 1812 году?', 'Кутузов', ['Суворов', 'Жуков', 'Багратион']],
    ['В каком году началась Великая Отечественная война?', '1941', ['1939', '1914', '1945']],
    ['В каком году закончилась Великая Отечественная война?', '1945', ['1941', '1943', '1918']],
    ['Какого числа празднуют День Победы?', '9 мая', ['12 июня', '4 ноября', '23 февраля']],
    ['Какого числа празднуют День России?', '12 июня', ['9 мая', '4 ноября', '1 сентября']],
    ['Кто создал таблицу химических элементов?', 'Менделеев', ['Ломоносов', 'Павлов', 'Королёв']],
    ['По чьей идее открыли Московский университет?', 'Ломоносов', ['Менделеев', 'Пушкин', 'Пётр I']],
    ['С какого царя началась династия Романовых?', 'Михаил', ['Пётр', 'Иван', 'Алексей']],
    ['Как звали последнего российского императора?', 'Николай II', ['Александр III', 'Пётр III', 'Павел I']],
    ['Какой город стал столицей при Петре I?', 'Санкт-Петербург', ['Новгород', 'Казань', 'Владимир']],
    ['Кто написал «Повесть временных лет»?', 'Нестор', ['Пимен', 'Кирилл', 'Мефодий']]
  ];

  function makeMathQuestion(level) {
    const kind = randInt(0, 2);
    let a, b, text, answer;
    if (kind === 0) {
      a = randInt(2, 10 + level * 15); b = randInt(2, 10 + level * 15);
      text = a + ' + ' + b + ' = ?'; answer = a + b;
    } else if (kind === 1) {
      a = randInt(5, 15 + level * 15); b = randInt(1, a);
      text = a + ' − ' + b + ' = ?'; answer = a - b;
    } else {
      a = randInt(2, 5 + level * 2); b = randInt(2, 9);
      text = a + ' × ' + b + ' = ?'; answer = a * b;
    }
    const wrong = new Set();
    while (wrong.size < 3) {
      const w = answer + randInt(-10, 10);
      if (w !== answer && w >= 0) wrong.add(w);
    }
    return { text: text, hint: 'Реши пример', answer: String(answer), options: shuffle([answer].concat([...wrong])).map(String) };
  }

  function makeQuestion(subject, level) {
    if (subject === 'rus') {
      const [word, i] = pick(RUS_WORDS);
      const letter = word[i] === 'Ё' ? 'Е' : word[i];
      const wrong = shuffle(VOWELS.filter(v => v !== letter)).slice(0, 3);
      return { text: word.slice(0, i) + '_' + word.slice(i + 1), hint: 'Какая буква пропущена?', answer: letter, options: shuffle([letter].concat(wrong)) };
    }
    if (subject === 'eng') {
      const [word, tr] = pick(ENG_WORDS);
      const wrong = shuffle(ENG_WORDS.filter(w => w[1] !== tr)).slice(0, 3).map(w => w[1]);
      return { text: word, hint: 'Переведи на русский', answer: tr, options: shuffle([tr].concat(wrong)) };
    }
    if (subject === 'hist') {
      const [text, answer, wrong] = pick(HISTORY);
      return { text: text, hint: 'История России', answer: answer, options: shuffle([answer].concat(wrong)) };
    }
    return makeMathQuestion(level);
  }

  /* ---------------------------------------------------------
     3. ПОМОЩНИКИ
     --------------------------------------------------------- */

  function rand(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function chance(p) { return Math.random() < p; }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function angleTo(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }

  // Сохранение в браузере: без ошибок, даже если localStorage запрещён
  function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* без сохранения */ }
  }

  const loaded = {};
  function loadScript(url) {
    if (!loaded[url]) {
      loaded[url] = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = url;
        s.onload = resolve;
        s.onerror = () => reject(new Error('ArcadeJS: не загрузилась библиотека ' + url));
        document.head.appendChild(s);
      });
    }
    return loaded[url];
  }

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

  /* ---------------------------------------------------------
     4. СОЗДАНИЕ ИГРЫ
     --------------------------------------------------------- */

  let created = null; // на странице одна игра

  function create(config) {
    if (created) { console.warn('ArcadeJS: игра уже создана, второй вызов Arcade.create пропущен'); return created; }
    config = Object.assign({
      title: 'Моя игра', subtitle: '', emoji: '🎮', help: '',
      width: 800, height: 600,
      world: 'sky', worlds: false,
      lives: 3, heart: '❤️', hurtTime: 1,
      quiz: false, difficulty: false, countdown: true,
      physics: false, mode: '2d',
      buttons: null, actionLabel: '●',
      sound: true, volume: 0.6,
      setup: null, update: null, draw: null, drawBehind: null, onOver: null
    }, config || {});

    const id = 'arcade-' + String(config.title).toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-');
    const settings = Object.assign({
      sound: config.sound,
      world: config.world,
      subject: (config.quiz && config.quiz.subject) || 'math',
      difficulty: 'normal'
    }, load(id + '-settings', {}));

    // ---------- Объект игры: всё, что доступно в setup/update/draw ----------
    const game = {
      version: VERSION,
      width: config.width, height: config.height,
      state: 'menu',
      score: 0, best: load(id + '-best', 0), lives: config.lives, level: 1,
      time: 0, frame: 0,
      objects: [],
      camera: { x: 0, y: 0 },
      pointer: { x: 0, y: 0, down: false },
      swipe: null,
      hurt: 0,
      diff: 1,
      data: {},          // для своих переменных игры
      config: config,
      settings: settings,
      world: null,
      key: {}
    };
    created = game;
    window.Arcade.game = game; // доступ из консоли: Arcade.game.score

    // ---------- DOM: сцена, холст, панель, экраны ----------
    const root = el('div', 'arc-root');
    const stage = el('div', 'arc-stage');
    const canvas = el('canvas', 'arc-canvas');
    const ctx = canvas.getContext('2d');
    game.canvas = canvas;
    game.ctx = ctx;

    const hud = el('div', 'arc-hud arc-hidden');
    const hudLeft = el('div', 'arc-hud-side');
    const hudRight = el('div', 'arc-hud-side arc-hud-right');
    const livesBox = el('div', 'arc-pill arc-lives');
    const scoreBox = el('div', 'arc-pill');
    const levelBox = el('div', 'arc-pill arc-hidden');
    const pauseBtn = el('button', 'arc-icon-btn', '⏸');
    pauseBtn.type = 'button';
    pauseBtn.setAttribute('aria-label', 'Пауза');
    hudLeft.append(livesBox, scoreBox);
    hudRight.append(levelBox, pauseBtn);
    const hudCenter = el('div', 'arc-hud-center');
    hud.append(hudLeft, hudCenter, hudRight);
    const customHud = {};

    const screens = {};
    ['menu', 'settings', 'pause', 'over', 'quiz', 'choose'].forEach(name => {
      screens[name] = el('div', 'arc-screen arc-hidden arc-screen-' + name);
    });
    const countBox = el('div', 'arc-count arc-hidden');
    const banner = el('div', 'arc-banner');
    const touch = el('div', 'arc-touch arc-hidden');

    stage.append(canvas, hud, countBox, banner, touch);
    Object.values(screens).forEach(s => stage.appendChild(s));
    root.appendChild(stage);

    const parent = (typeof config.parent === 'string' ? document.querySelector(config.parent) : config.parent) || document.getElementById('game') || document.body;
    parent.appendChild(root);

    // ---------- Размер: игра вписывается в окно с сохранением пропорций ----------
    let scale = 1;
    function resize() {
      const w = root.clientWidth || window.innerWidth;
      const h = root.clientHeight || window.innerHeight;
      scale = Math.min(w / game.width, h / game.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      stage.style.width = game.width * scale + 'px';
      stage.style.height = game.height * scale + 'px';
      stage.style.fontSize = Math.max(11, 16 * scale) + 'px';
      canvas.width = Math.round(game.width * scale * dpr);
      canvas.height = Math.round(game.height * scale * dpr);
      ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
      game.pixel = scale * dpr;
      if (renderer) { renderer.setPixelRatio(dpr); renderer.setSize(game.width * scale, game.height * scale, false); }
      if (game.state !== 'play') render();
    }
    window.addEventListener('resize', resize);

    // ---------- Мир и украшения фона ----------
    let deco = [];
    function setWorld(name) {
      const world = WORLDS[name] || WORLDS.sky;
      game.world = Object.assign({ id: WORLDS[name] ? name : 'sky' }, world);
      root.style.setProperty('--arc-accent', world.accent);
      // Текст на кнопках: тёмный на светлом цвете, белый на тёмном
      const rgb = world.accent.match(/\w\w/g).map(h => parseInt(h, 16));
      const light = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 > 150;
      root.style.setProperty('--arc-on-accent', light ? '#10132a' : '#ffffff');
      root.style.background = world.top;
      if (typeof apply3dWorld === 'function' && scene) apply3dWorld();
      deco = [];
      const n = { stars: 70, clouds: 6, leaves: 14, bubbles: 18, hearts: 12, sun: 1, buildings: 14 }[world.deco] || 0;
      for (let i = 0; i < n; i++) {
        deco.push({ x: rand(0, game.width), y: rand(0, game.height), s: rand(0.5, 1.5), p: rand(0, 6.28), w: rand(40, 110), h: rand(80, game.height * 0.45) });
      }
    }

    function drawWorld(dt) {
      const w = game.world;
      if (typeof config.background === 'function') { config.background(game, ctx); return; }
      if (typeof config.background === 'string') {
        ctx.fillStyle = config.background; ctx.fillRect(0, 0, game.width, game.height);
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, game.height);
        g.addColorStop(0, w.top); g.addColorStop(1, w.bottom);
        ctx.fillStyle = g; ctx.fillRect(0, 0, game.width, game.height);
      }
      const shift = game.camera.x * 0.2;
      deco.forEach(d => {
        d.p += dt;
        const x = ((d.x - shift) % (game.width + 120) + game.width + 120) % (game.width + 120) - 60;
        if (w.deco === 'stars') {
          ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(d.p * d.s));
          ctx.fillStyle = '#fff';
          ctx.fillRect(x, d.y, 2 * d.s, 2 * d.s);
        } else if (w.deco === 'clouds') {
          ctx.globalAlpha = 0.85;
          d.x -= 8 * d.s * dt;
          drawEmojiRaw('☁️', x, d.y * 0.5, 40 + 30 * d.s);
        } else if (w.deco === 'leaves' || w.deco === 'hearts') {
          ctx.globalAlpha = 0.5;
          d.y += (w.deco === 'leaves' ? 25 : -25) * d.s * dt;
          if (d.y > game.height + 30) d.y = -30;
          if (d.y < -30) d.y = game.height + 30;
          drawEmojiRaw(w.deco === 'leaves' ? '🍃' : '💗', x + Math.sin(d.p) * 15, d.y, 14 + 10 * d.s);
        } else if (w.deco === 'bubbles') {
          ctx.globalAlpha = 0.35;
          d.y -= 30 * d.s * dt;
          if (d.y < -20) d.y = game.height + 20;
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x + Math.sin(d.p) * 8, d.y, 4 + 6 * d.s, 0, 7); ctx.stroke();
        } else if (w.deco === 'sun') {
          ctx.globalAlpha = 0.9;
          drawEmojiRaw('☀️', game.width * 0.82, game.height * 0.16, 70);
        } else if (w.deco === 'buildings') {
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = '#0b0d1a';
          const bx = ((d.x - shift * 1.5) % (game.width + 200) + game.width + 200) % (game.width + 200) - 100;
          ctx.fillRect(bx, game.height - d.h, d.w, d.h);
        }
      });
      ctx.globalAlpha = 1;
    }

    function drawEmojiRaw(emoji, x, y, size) {
      ctx.font = size + 'px ' + EMOJI_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, x, y);
    }

    /* ---------- Объекты ---------- */

    // game.add({ emoji: '🐸', x: 100, y: 200, size: 50, vx: 100, tag: 'enemy' })
    game.add = function (props) {
      const o = Object.assign({
        x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0, gravity: 0, friction: 0, maxSpeed: 0,
        size: 40, w: 0, h: 0, emoji: '', text: '', shape: '', color: '#ffffff', radius: 0,
        angle: 0, spin: 0, alpha: 1, flip: false, z: 0, tag: '', fixed: false,
        bounce: false, wrap: false, inside: false, solid: false, oneWay: false,
        life: 0, fade: false, removeOffscreen: false, blink: 0, glow: '',
        hitbox: 0.8, hp: 1, dead: false, onGround: false
      }, props || {});
      if (!o.w) o.w = o.size;
      if (!o.h) o.h = o.size;
      if (!o.shape) o.shape = o.emoji ? 'emoji' : o.text ? 'text' : 'rect';
      o.startLife = o.life;
      o.prevX = o.x; o.prevY = o.y;
      o.remove = function () { o.dead = true; };
      if (o.body) addBody(o);
      game.objects.push(o);
      return o;
    };
    game.remove = function (o) { if (o) o.dead = true; };
    game.all = function (tag) { return game.objects.filter(o => !o.dead && (!tag || o.tag === tag)); };
    game.first = function (tag) { return game.objects.find(o => !o.dead && o.tag === tag) || null; };
    game.count = function (tag) { return game.all(tag).length; };
    game.clear = function (tag) { game.all(tag).forEach(o => { o.dead = true; }); };

    // Столкновение двух объектов (хитбокс чуть меньше картинки)
    game.hit = function (a, b) {
      if (!a || !b || a.dead || b.dead || a === b) return false;
      if (a.is3d || b.is3d) {
        return Math.abs(a.x - b.x) < (a.w * a.hitbox + b.w * b.hitbox) / 2 &&
               Math.abs(a.y - b.y) < (a.h * a.hitbox + b.h * b.hitbox) / 2 &&
               Math.abs((a.z || 0) - (b.z || 0)) < ((a.d || a.w) * a.hitbox + (b.d || b.w) * b.hitbox) / 2;
      }
      const round = s => s.shape === 'circle' || s.shape === 'emoji';
      if (round(a) && round(b)) {
        const ra = Math.min(a.w, a.h) / 2 * a.hitbox;
        const rb = Math.min(b.w, b.h) / 2 * b.hitbox;
        return dist(a, b) < ra + rb;
      }
      return Math.abs(a.x - b.x) < (a.w * a.hitbox + b.w * b.hitbox) / 2 &&
             Math.abs(a.y - b.y) < (a.h * a.hitbox + b.h * b.hitbox) / 2;
    };
    // Первый объект с тегом, который касается a (или null)
    game.hitAny = function (a, tag) { return game.all(tag).find(o => game.hit(a, o)) || null; };
    game.hitAll = function (a, tag) { return game.all(tag).filter(o => game.hit(a, o)); };

    // Твёрдые объекты: выталкивает a из объектов с тегом (стены, платформы).
    // Возвращает, с какой стороны был удар: { top, bottom, left, right }
    game.collide = function (a, tag) {
      const side = { top: false, bottom: false, left: false, right: false };
      a.onGround = false;
      game.all(tag).forEach(s => {
        if (s === a) return;
        const dx = a.x - s.x;
        const dy = a.y - s.y;
        const ox = (a.w + s.w) / 2 - Math.abs(dx);
        const oy = (a.h + s.h) / 2 - Math.abs(dy);
        if (ox <= 0 || oy <= 0) return;
        if (s.oneWay) {
          // Платформа «снизу насквозь»: держит, только если падаем сверху
          const wasAbove = a.prevY + a.h / 2 <= s.y - s.h / 2 + 1;
          if (!(a.vy >= 0 && wasAbove)) return;
          a.y = s.y - (a.h + s.h) / 2; a.vy = 0; a.onGround = true; side.bottom = true;
          return;
        }
        if (oy < ox) {
          if (dy < 0) { a.y -= oy; if (a.vy > 0) a.vy = 0; a.onGround = true; side.bottom = true; }
          else { a.y += oy; if (a.vy < 0) a.vy = 0; side.top = true; }
        } else {
          if (dx < 0) { a.x -= ox; if (a.vx > 0) a.vx = 0; side.right = true; }
          else { a.x += ox; if (a.vx < 0) a.vx = 0; side.left = true; }
        }
      });
      return side;
    };

    function updateObject(o, dt) {
      if (o.physBody) return;          // такими объектами управляет Matter.js
      if (o.is3d) { update3d(o, dt); return; }
      o.prevX = o.x; o.prevY = o.y;
      o.vx += o.ax * dt;
      o.vy += (o.ay + o.gravity) * dt;
      if (o.friction) { const f = Math.max(0, 1 - o.friction * dt); o.vx *= f; o.vy *= f; }
      if (o.maxSpeed) {
        const sp = Math.hypot(o.vx, o.vy);
        if (sp > o.maxSpeed) { o.vx *= o.maxSpeed / sp; o.vy *= o.maxSpeed / sp; }
      }
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.angle += o.spin * dt;
      if (o.blink > 0) o.blink -= dt;
      if (o.startLife) {
        o.life -= dt;
        if (o.fade) o.alpha = clamp(o.life / o.startLife, 0, 1);
        if (o.life <= 0) o.dead = true;
      }
      const W = game.width, H = game.height;
      if (o.bounce) {
        if (o.x < o.w / 2) { o.x = o.w / 2; o.vx = Math.abs(o.vx); }
        if (o.x > W - o.w / 2) { o.x = W - o.w / 2; o.vx = -Math.abs(o.vx); }
        if (o.y < o.h / 2) { o.y = o.h / 2; o.vy = Math.abs(o.vy); }
        if (o.y > H - o.h / 2) { o.y = H - o.h / 2; o.vy = -Math.abs(o.vy); }
      }
      if (o.inside) {
        o.x = clamp(o.x, o.w / 2, W - o.w / 2);
        o.y = clamp(o.y, o.h / 2, H - o.h / 2);
      }
      if (o.wrap) {
        if (o.x < -o.w / 2) o.x += W + o.w; else if (o.x > W + o.w / 2) o.x -= W + o.w;
        if (o.y < -o.h / 2) o.y += H + o.h; else if (o.y > H + o.h / 2) o.y -= H + o.h;
      }
      if (o.removeOffscreen) {
        const sx = o.fixed ? o.x : o.x - game.camera.x;
        const sy = o.fixed ? o.y : o.y - game.camera.y;
        if (sx < -W * 0.5 || sx > W * 1.5 || sy < -H * 0.5 || sy > H * 1.5) o.dead = true;
      }
    }

    function drawObject(o) {
      if (o.is3d) return;              // 3D-объекты рисует Three.js
      if (o.blink > 0 && Math.floor(o.blink * 12) % 2 === 0) return;
      ctx.save();
      ctx.globalAlpha = o.alpha;
      ctx.translate(o.fixed ? o.x : o.x - game.camera.x, o.fixed ? o.y : o.y - game.camera.y);
      if (o.angle) ctx.rotate(o.angle);
      if (o.flip) ctx.scale(-1, 1);
      if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 18; }
      ctx.fillStyle = o.color;
      if (o.shape === 'emoji') {
        drawEmojiRaw(o.emoji, 0, 0, Math.min(o.w, o.h));
      } else if (o.shape === 'text') {
        ctx.font = (o.font || '700 ' + o.size + 'px Rubik, sans-serif');
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(o.text, 0, 0);
      } else if (o.shape === 'circle') {
        ctx.beginPath(); ctx.arc(0, 0, Math.min(o.w, o.h) / 2, 0, Math.PI * 2); ctx.fill();
      } else {
        roundRect(-o.w / 2, -o.h / 2, o.w, o.h, o.radius);
        ctx.fill();
      }
      ctx.restore();
    }

    function roundRect(x, y, w, h, r) {
      r = Math.min(r || 0, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    // Рисование «вручную» в draw(game, ctx): учитывают камеру, если не fixed
    function cam(x, y, fixed) { return fixed ? [x, y] : [x - game.camera.x, y - game.camera.y]; }
    game.text = function (text, x, y, o) {
      o = o || {};
      const [px, py] = cam(x, y, o.fixed);
      ctx.save();
      ctx.font = (o.bold === false ? '' : '700 ') + (o.size || 24) + 'px ' + (o.font || 'Rubik, sans-serif');
      ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
      if (o.shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 6; }
      ctx.fillStyle = o.color || '#fff';
      ctx.fillText(text, px, py);
      ctx.restore();
    };
    game.emoji = function (emoji, x, y, size, o) {
      const [px, py] = cam(x, y, o && o.fixed);
      drawEmojiRaw(emoji, px, py, size || 40);
    };
    game.rect = function (x, y, w, h, color, o) {
      const [px, py] = cam(x, y, o && o.fixed);
      ctx.fillStyle = color || '#fff';
      roundRect(px - w / 2, py - h / 2, w, h, (o && o.radius) || 0);
      ctx.fill();
    };
    game.circle = function (x, y, r, color, o) {
      const [px, py] = cam(x, y, o && o.fixed);
      ctx.fillStyle = color || '#fff';
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    };
    game.line = function (x1, y1, x2, y2, color, width, o) {
      const [a, b] = cam(x1, y1, o && o.fixed);
      const [c, d] = cam(x2, y2, o && o.fixed);
      ctx.strokeStyle = color || '#fff'; ctx.lineWidth = width || 2;
      ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke();
    };

    /* ---------- Камера ---------- */
    let followTarget = null;
    let followOpts = {};
    // game.follow(hero, { x: true, y: false, atX: 0.35 }) — камера едет за героем
    game.follow = function (obj, opts) {
      followTarget = obj;
      followOpts = Object.assign({ x: true, y: false, atX: 0.4, atY: 0.5, smooth: 8 }, opts || {});
    };
    function updateCamera(dt) {
      if (!followTarget || followTarget.dead) return;
      const k = Math.min(1, dt * followOpts.smooth);
      if (followTarget.is3d && camera3) {
        // 3D: камера сзади и сверху от героя
        const off = followOpts.offset || { x: 0, y: 4, z: 8 };
        camera3.position.x += (followTarget.x + off.x - camera3.position.x) * k;
        camera3.position.y += (followTarget.y + off.y - camera3.position.y) * k;
        camera3.position.z += (followTarget.z + off.z - camera3.position.z) * k;
        camera3.lookAt(followTarget.x, followTarget.y + (followOpts.lookUp || 1), followTarget.z - 4);
        return;
      }
      if (followOpts.x) game.camera.x += (followTarget.x - game.width * followOpts.atX - game.camera.x) * k;
      if (followOpts.y) game.camera.y += (followTarget.y - game.height * followOpts.atY - game.camera.y) * k;
      if (followOpts.minX !== undefined) game.camera.x = Math.max(followOpts.minX, game.camera.x);
      if (followOpts.maxX !== undefined) game.camera.x = Math.min(followOpts.maxX, game.camera.x);
      if (followOpts.minY !== undefined) game.camera.y = Math.max(followOpts.minY, game.camera.y);
      if (followOpts.maxY !== undefined) game.camera.y = Math.min(followOpts.maxY, game.camera.y);
    }

    /* ---------- Физика: Matter.js (physics: true) ---------- */
    // game.add({ emoji: '📦', x, y, size: 60, body: true }) — объект падает и сталкивается.
    // body: 'static' — неподвижная опора. restitution — упругость (0…1), density — тяжесть.
    let M = null, engine = null, links = [], collideHandlers = [], dragLink = null, physAcc = 0;
    const physOpts = Object.assign({ gravity: 1, walls: false, drag: false }, typeof config.physics === 'object' ? config.physics : {});

    function setupPhysics() {
      M = window.Matter;
      engine = M.Engine.create();
      engine.gravity.y = physOpts.gravity;
      game.physics = { Matter: M, engine: engine };
      M.Events.on(engine, 'collisionStart', ev => ev.pairs.forEach(pair => {
        const a = pair.bodyA.plugin.obj, b = pair.bodyB.plugin.obj;
        if (!a || !b) return;
        collideHandlers.forEach(h => {
          if (a.tag === h.a && b.tag === h.b) h.fn(a, b, game);
          else if (b.tag === h.a && a.tag === h.b) h.fn(b, a, game);
        });
      }));
    }

    function addBody(o) {
      if (!engine) { console.warn('ArcadeJS: для body: true включите physics: true в Arcade.create'); return; }
      const opts = {
        isStatic: o.body === 'static', angle: o.angle,
        restitution: o.restitution === undefined ? 0.3 : o.restitution,
        friction: o.friction || 0.1, density: o.density || 0.001
      };
      // Форма тела: круг для эмодзи и кругов; bodyShape: 'box' — прямоугольник (ящики, кирпичи)
      const round = o.bodyShape ? o.bodyShape === 'circle' : (o.shape === 'circle' || o.shape === 'emoji');
      const b = round ? M.Bodies.circle(o.x, o.y, Math.min(o.w, o.h) / 2 * 0.9, opts) : M.Bodies.rectangle(o.x, o.y, o.w, o.h, opts);
      if (o.vx || o.vy) M.Body.setVelocity(b, { x: o.vx / 60, y: o.vy / 60 });
      b.plugin.obj = o;
      o.physBody = b;
      M.Composite.add(engine.world, b);
    }

    function resetPhysics() {
      if (!engine) return;
      M.Composite.clear(engine.world, false);
      links = []; dragLink = null; collideHandlers = []; physAcc = 0;
      if (physOpts.walls) {
        const W = game.width, H = game.height, t = 100;
        M.Composite.add(engine.world, [
          M.Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }),
          M.Bodies.rectangle(-t / 2, H / 2, t, H * 3, { isStatic: true }),
          M.Bodies.rectangle(W + t / 2, H / 2, t, H * 3, { isStatic: true })
        ]);
      }
    }

    function stepPhysics(dt) {
      if (!engine) return;
      // Перетаскивание мышью или пальцем: physics: { drag: true } или drag: 'тег'
      if (physOpts.drag) {
        if (game.pointer.down && !dragLink) {
          const p = { x: game.pointer.worldX, y: game.pointer.worldY };
          const found = M.Query.point(M.Composite.allBodies(engine.world), p)
            .find(b => !b.isStatic && b.plugin.obj && (physOpts.drag === true || b.plugin.obj.tag === physOpts.drag));
          if (found) {
            dragLink = M.Constraint.create({ pointA: p, bodyB: found, pointB: { x: 0, y: 0 }, stiffness: 0.08, length: 0 });
            M.Composite.add(engine.world, dragLink);
          }
        }
        if (dragLink) {
          dragLink.pointA = { x: game.pointer.worldX, y: game.pointer.worldY };
          if (!game.pointer.down) { M.Composite.remove(engine.world, dragLink); dragLink = null; }
        }
      }
      physAcc += dt;
      while (physAcc >= 1 / 60) { M.Engine.update(engine, 1000 / 60); physAcc -= 1 / 60; }
      game.objects.forEach(o => {
        const b = o.physBody;
        if (!b) return;
        if (o.dead) { M.Composite.remove(engine.world, b); o.physBody = null; return; }
        o.x = b.position.x; o.y = b.position.y; o.angle = b.angle;
        o.vx = b.velocity.x * 60; o.vy = b.velocity.y * 60;
        if (o.removeOffscreen && (o.y > game.height * 1.6 + game.camera.y || o.x < game.camera.x - game.width || o.x > game.camera.x + game.width * 2)) o.dead = true;
      });
    }

    // Скорость физического объекта (пикс/с) и толчок
    game.velocity = function (o, vx, vy) { if (o.physBody) M.Body.setVelocity(o.physBody, { x: vx / 60, y: vy / 60 }); else { o.vx = vx; o.vy = vy; } };
    game.push = function (o, vx, vy) { game.velocity(o, o.vx + vx, o.vy + vy); };
    // Столкновение физических объектов: game.onCollide('ball', 'box', (ball, box) => { ... })
    game.onCollide = function (tagA, tagB, fn) { collideHandlers.push({ a: tagA, b: tagB, fn: fn }); };
    // Связь (верёвка, пружина): game.link(a, b) или game.link(a, { x: 400, y: 50 })
    game.link = function (a, b, o) {
      o = o || {};
      const c = M.Constraint.create({
        bodyA: a.physBody, bodyB: b.physBody || undefined, pointB: b.physBody ? undefined : { x: b.x, y: b.y },
        length: o.length, stiffness: o.stiffness === undefined ? 0.9 : o.stiffness
      });
      M.Composite.add(engine.world, c);
      links.push({ c: c, color: o.color || 'rgba(255,255,255,0.8)', width: o.width || 3 });
      return c;
    };
    game.unlink = function (c) {
      if (!c) return;
      M.Composite.remove(engine.world, c);
      links = links.filter(l => l.c !== c);
    };
    function drawLinks() {
      links.forEach(l => {
        const a = M.Constraint.pointAWorld(l.c), b = M.Constraint.pointBWorld(l.c);
        game.line(a.x, a.y, b.x, b.y, l.color, l.width);
      });
    }

    /* ---------- 3D: Three.js (mode: '3d') ---------- */
    // game.add3d({ shape: 'box', w: 1, h: 1, d: 1, color: '#ff0', x: 0, y: 0, z: -10, vz: 5, tag: 'rock' })
    // Формы: box, sphere, cylinder, cone, plane, emoji (эмодзи-картинка, всегда смотрит в камеру)
    let T = null, renderer = null, scene = null, camera3 = null, canvas3d = null;
    const keep3d = [];

    function setup3d(THREE) {
      T = THREE;
      renderer = new T.WebGLRenderer({ antialias: true });
      renderer.shadowMap.enabled = true;
      canvas3d = renderer.domElement;
      canvas3d.className = 'arc-canvas3d';
      stage.insertBefore(canvas3d, canvas);
      scene = new T.Scene();
      camera3 = new T.PerspectiveCamera(60, game.width / game.height, 0.1, 1000);
      camera3.position.set(0, 5, 10);
      camera3.lookAt(0, 0, 0);
      const hemi = new T.HemisphereLight(0xffffff, 0x445566, 1.4);
      const sun = new T.DirectionalLight(0xffffff, 2.2);
      sun.position.set(5, 12, 8);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30 });
      scene.add(hemi, sun);
      keep3d.push(hemi, sun);
      game.three = { THREE: T, scene: scene, camera: camera3, renderer: renderer, sun: sun };
      apply3dWorld();
      resize();
    }
    function apply3dWorld() {
      if (!scene) return;
      scene.background = new T.Color(game.world.top);
      scene.fog = new T.Fog(game.world.top, 30, 90);
    }

    function emojiTexture(emoji) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const x = c.getContext('2d');
      x.font = '100px ' + EMOJI_FONT;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(emoji, 64, 72);
      const tex = new T.CanvasTexture(c);
      tex.colorSpace = T.SRGBColorSpace;
      return tex;
    }

    game.add3d = function (props) {
      if (!T) { console.warn('ArcadeJS: для add3d включите mode: "3d" в Arcade.create'); return null; }
      const o = Object.assign({
        shape: 'box', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, gravity: 0,
        w: 1, h: 1, d: 1, size: 0, color: '#ffffff', emoji: '',
        rx: 0, ry: 0, rz: 0, spin: 0, tag: '', hitbox: 0.9, life: 0,
        shadow: true, dead: false, is3d: true, onGround: false
      }, props || {});
      if (o.size) { o.w = o.h = o.d = o.size; }
      if (o.emoji && !props.shape) o.shape = 'emoji';
      let mesh;
      if (o.shape === 'emoji') {
        mesh = new T.Sprite(new T.SpriteMaterial({ map: emojiTexture(o.emoji), transparent: true }));
        mesh.scale.set(o.w, o.h, 1);
      } else {
        const g = {
          box: () => new T.BoxGeometry(o.w, o.h, o.d),
          sphere: () => new T.SphereGeometry(o.w / 2, 24, 16),
          cylinder: () => new T.CylinderGeometry(o.w / 2, o.w / 2, o.h, 24),
          cone: () => new T.ConeGeometry(o.w / 2, o.h, 24),
          plane: () => new T.PlaneGeometry(o.w, o.d)
        }[o.shape] || (() => new T.BoxGeometry(o.w, o.h, o.d));
        mesh = new T.Mesh(g(), new T.MeshStandardMaterial({ color: o.color, roughness: 0.6, metalness: 0.1 }));
        if (o.shape === 'plane') mesh.rotation.x = -Math.PI / 2;
        mesh.castShadow = o.shadow; mesh.receiveShadow = true;
      }
      o.mesh = mesh;
      o.startLife = o.life;
      o.remove = function () { o.dead = true; };
      scene.add(mesh);
      syncMesh(o);
      game.objects.push(o);
      return o;
    };
    function syncMesh(o) {
      o.mesh.position.set(o.x, o.y, o.z);
      if (o.shape !== 'plane' && o.shape !== 'emoji') o.mesh.rotation.set(o.rx, o.ry, o.rz);
      o.mesh.visible = !(o.blink > 0 && Math.floor(o.blink * 12) % 2 === 0);
    }
    function update3d(o, dt) {
      o.vy -= o.gravity * dt;
      o.x += o.vx * dt; o.y += o.vy * dt; o.z += o.vz * dt;
      o.ry += o.spin * dt;
      if (o.blink > 0) o.blink -= dt;
      if (o.startLife) { o.life -= dt; if (o.life <= 0) o.dead = true; }
      // Пол на высоте 0: объекты с гравитацией на него встают
      o.onGround = false;
      if (o.gravity && o.y - o.h / 2 <= 0) { o.y = o.h / 2; if (o.vy < 0) o.vy = 0; o.onGround = true; }
      if (o.removeOffscreen && camera3 && o.z > camera3.position.z + 5) o.dead = true;
      syncMesh(o);
    }
    function cleanup3d() {
      game.objects.forEach(o => { if (o.dead && o.mesh) { scene.remove(o.mesh); o.mesh = null; } });
    }
    function reset3d() {
      if (!scene) return;
      scene.children.slice().forEach(ch => { if (!keep3d.includes(ch)) scene.remove(ch); });
      camera3.position.set(0, 5, 10);
      camera3.lookAt(0, 0, 0);
      apply3dWorld();
    }

    /* ---------- Загрузка библиотек ---------- */
    const needs = [];
    if (config.physics) needs.push(loadScript(LIBS.matter).then(setupPhysics));
    if (config.mode === '3d') needs.push(import(LIBS.three).then(setup3d));
    let libsReady = needs.length === 0;
    game.ready = Promise.all(needs).then(() => { libsReady = true; }).catch(err => { console.error(err); });

    /* ---------- Эффекты: частицы, надписи, тряска, вспышка ---------- */
    let particles = [];
    let popups = [];
    let shakeTime = 0, shakePower = 0;
    let flashTime = 0, flashColor = '#fff', flashMax = 0.15;

    game.burst = function (x, y, o) {
      o = o || {};
      const count = o.count || 16;
      for (let i = 0; i < count; i++) {
        const a = rand(0, Math.PI * 2);
        const sp = rand(0.3, 1) * (o.speed || 240);
        particles.push({
          x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: rand(0.4, 0.9) * (o.time || 1), max: 1,
          color: o.color || game.world.accent, size: o.size || rand(3, 7),
          emoji: o.emoji || '', gravity: o.gravity === undefined ? 300 : o.gravity
        });
      }
      particles.forEach(p => { if (p.max === 1) p.max = p.life; });
    };
    game.popup = function (x, y, text, color) {
      popups.push({ x: x, y: y, text: String(text), color: color || '#fff', life: 1 });
    };
    game.shake = function (power, time) { shakePower = power || 8; shakeTime = time || 0.3; };
    game.flash = function (color, time) { flashColor = color || '#fff'; flashTime = flashMax = time || 0.15; };

    function updateEffects(dt) {
      particles.forEach(p => {
        p.vy += p.gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      });
      particles = particles.filter(p => p.life > 0);
      popups.forEach(p => { p.y -= 50 * dt; p.life -= dt; });
      popups = popups.filter(p => p.life > 0);
      if (shakeTime > 0) shakeTime -= dt;
      if (flashTime > 0) flashTime -= dt;
    }

    function drawEffects() {
      particles.forEach(p => {
        ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
        const [px, py] = cam(p.x, p.y);
        if (p.emoji) drawEmojiRaw(p.emoji, px, py, p.size * 3);
        else { ctx.fillStyle = p.color; ctx.fillRect(px - p.size / 2, py - p.size / 2, p.size, p.size); }
      });
      ctx.globalAlpha = 1;
      popups.forEach(p => {
        game.text(p.text, p.x, p.y, { size: 26, color: p.color });
      });
    }

    /* ---------- Таймеры: работают только во время игры ---------- */
    let timers = [];
    let timerId = 0;
    game.every = function (sec, fn) { timers.push({ id: ++timerId, left: sec, every: sec, fn: fn }); return timerId; };
    game.after = function (sec, fn) { timers.push({ id: ++timerId, left: sec, every: 0, fn: fn }); return timerId; };
    game.stopTimer = function (tid) { timers = timers.filter(t => t.id !== tid); };
    function updateTimers(dt) {
      timers.slice().forEach(t => {
        t.left -= dt;
        if (t.left <= 0) {
          if (t.every) t.left += t.every; else timers = timers.filter(x => x !== t);
          t.fn(game);
        }
      });
    }

    /* ---------- Управление: клавиатура, мышь, касания, кнопки ---------- */
    const down = new Set();
    const pressed = new Set();

    function codesFor(name) { return KEYMAP[name] || [name]; }
    game.isDown = function (name) { return down.has('btn:' + name) || codesFor(name).some(c => down.has(c)); };
    game.pressed = function (name) { return pressed.has('btn:' + name) || codesFor(name).some(c => pressed.has(c)); };
    Object.keys(KEYMAP).forEach(name => {
      Object.defineProperty(game.key, name, { get: () => game.isDown(name) });
    });

    window.addEventListener('keydown', e => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code) && game.state === 'play') e.preventDefault();
      if (!down.has(e.code)) pressed.add(e.code);
      down.add(e.code);
      if ((e.code === 'Escape' || e.code === 'KeyP') && (game.state === 'play' || game.state === 'pause')) togglePause();
      else if (game.state === 'quiz' || game.state === 'choose') {
        const n = parseInt(e.key, 10);
        const btns = screens[game.state].querySelectorAll('[data-n]');
        if (n >= 1 && n <= btns.length) btns[n - 1].click();
      }
    });
    window.addEventListener('keyup', e => { down.delete(e.code); });
    window.addEventListener('blur', () => down.clear());

    function toGame(e) {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
    }
    let swipeStart = null;
    canvas.addEventListener('pointerdown', e => {
      const p = toGame(e);
      Object.assign(game.pointer, p, { down: true });
      game.pointer.worldX = p.x + game.camera.x; game.pointer.worldY = p.y + game.camera.y;
      swipeStart = { x: e.clientX, y: e.clientY, t: performance.now() };
      pressed.add('btn:tap');
      pressed.add('btn:action'); // касание = действие (прыжок, выстрел) сразу при нажатии
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* старый браузер */ }
    });
    canvas.addEventListener('pointermove', e => {
      const p = toGame(e);
      Object.assign(game.pointer, p);
      game.pointer.worldX = p.x + game.camera.x; game.pointer.worldY = p.y + game.camera.y;
    });
    canvas.addEventListener('pointerup', e => {
      game.pointer.down = false;
      if (!swipeStart) return;
      const dx = e.clientX - swipeStart.x, dy = e.clientY - swipeStart.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 30 && performance.now() - swipeStart.t < 600) {
        const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        game.swipe = dir;
        pressed.add('btn:' + dir);
      }
      swipeStart = null;
    });
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Экранные кнопки для телефона: buttons: ['left', 'right', 'action']
    const TOUCH_LABELS = { left: '◀', right: '▶', up: '▲', down: '▼' };
    if (config.buttons && config.buttons.length) {
      const isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      if (isTouch || config.alwaysButtons) touch.classList.remove('arc-hidden');
      config.buttons.forEach(name => {
        const b = el('button', 'arc-touch-btn arc-touch-' + name, name === 'action' ? config.actionLabel : (TOUCH_LABELS[name] || name));
        b.type = 'button';
        const on = e => { e.preventDefault(); if (!down.has('btn:' + name)) pressed.add('btn:' + name); down.add('btn:' + name); };
        const off = e => { e.preventDefault(); down.delete('btn:' + name); };
        b.addEventListener('pointerdown', on);
        b.addEventListener('pointerup', off);
        b.addEventListener('pointerleave', off);
        b.addEventListener('pointercancel', off);
        touch.appendChild(b);
      });
    }

    /* ---------- Звук: Web Audio ---------- */
    let audio = null;
    const buffers = {};
    function unlockAudio() {
      if (audio) { if (audio.state === 'suspended') audio.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audio = new AC();
      Object.keys(SOUNDS).forEach(name => {
        fetch(BASE + 'sounds/' + SOUNDS[name])
          .then(r => r.arrayBuffer())
          .then(data => audio.decodeAudioData(data))
          .then(buf => { buffers[name] = buf; })
          .catch(() => { /* звук не загрузился — играем без него */ });
      });
    }
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, unlockAudio, { passive: true }));

    game.sound = function (name, volume) {
      if (!settings.sound || !audio || !buffers[name]) return;
      const src = audio.createBufferSource();
      const gain = audio.createGain();
      gain.gain.value = (volume === undefined ? 1 : volume) * config.volume;
      src.buffer = buffers[name];
      src.connect(gain).connect(audio.destination);
      src.start();
    };

    /* ---------- Очки, жизни, уровни ---------- */
    game.addScore = function (n, x, y) {
      n = n === undefined ? 1 : n;
      game.score += n;
      if (x !== undefined) game.popup(x, y, (n > 0 ? '+' : '') + n, game.world.accent);
      updateHud();
    };
    game.loseLife = function () {
      if (game.hurt > 0 || game.state !== 'play') return false;
      game.lives -= 1;
      game.hurt = config.hurtTime;
      game.shake(10, 0.35);
      game.flash('rgba(255,40,60,0.45)', 0.25);
      game.sound('hit');
      updateHud();
      if (game.lives <= 0) game.over();
      return true;
    };
    game.addLife = function (n) { game.lives += n || 1; updateHud(); };
    game.nextLevel = function () {
      game.level += 1;
      levelBox.classList.remove('arc-hidden');
      game.message('Уровень ' + game.level);
      game.sound('bonus');
      updateHud();
      return game.level;
    };
    // Своя строка на панели: game.hud('⏱', 30)
    game.hud = function (label, value) {
      if (!customHud[label]) {
        customHud[label] = el('div', 'arc-pill');
        hudCenter.appendChild(customHud[label]);
      }
      customHud[label].textContent = label + ' ' + value;
    };

    function updateHud() {
      if (config.lives > 0) {
        livesBox.classList.remove('arc-hidden');
        livesBox.textContent = game.lives > 5 ? config.heart + ' ×' + game.lives : config.heart.repeat(Math.max(0, game.lives)) || '💔';
      } else {
        livesBox.classList.add('arc-hidden');
      }
      scoreBox.textContent = '⭐ ' + game.score;
      levelBox.textContent = 'Уровень ' + game.level;
    }

    // Надпись по центру экрана на пару секунд
    let bannerTimer = null;
    game.message = function (text, sec) {
      banner.textContent = text;
      banner.classList.remove('arc-show');
      void banner.offsetWidth;
      banner.classList.add('arc-show');
      clearTimeout(bannerTimer);
      bannerTimer = setTimeout(() => banner.classList.remove('arc-show'), (sec || 1.6) * 1000);
    };

    /* ---------- Экраны ---------- */
    function show(name) {
      Object.keys(screens).forEach(k => screens[k].classList.toggle('arc-hidden', k !== name));
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }
    function button(text, cls, onClick, n) {
      const b = el('button', 'arc-btn ' + (cls || ''), text);
      b.type = 'button';
      if (n) b.dataset.n = n;
      b.addEventListener('click', () => { game.sound('click', 0.6); onClick(); });
      return b;
    }

    function buildMenu() {
      const s = screens.menu;
      s.innerHTML = '';
      const panel = el('div', 'arc-panel arc-menu');
      panel.append(
        el('div', 'arc-logo', config.emoji),
        el('h1', 'arc-title', config.title),
        config.subtitle ? el('p', 'arc-subtitle', config.subtitle) : '',
        el('p', 'arc-best', '🏆 Рекорд: ' + game.best)
      );
      const row = el('div', 'arc-row');
      row.append(button('▶ Играть', '', start));
      if (hasSettings()) row.append(button('⚙️ Настройки', 'arc-btn-2', () => { buildSettings(); show('settings'); }));
      panel.append(row);
      const help = config.help || defaultHelp();
      if (help) panel.append(el('p', 'arc-help', help));
      s.appendChild(panel);
    }

    function defaultHelp() {
      const parts = [];
      const b = config.buttons || [];
      if (b.includes('left') || b.includes('right')) parts.push('← → — движение');
      if (b.includes('up') || b.includes('down')) parts.push('↑ ↓ — вверх и вниз');
      if (b.includes('action')) parts.push('Пробел или касание — действие');
      parts.push('Esc — пауза');
      return parts.join(' · ');
    }

    function hasSettings() { return true; } // звук есть всегда

    function choiceRow(title, items, current, onPick) {
      const box = el('div', 'arc-setting');
      box.append(el('div', 'arc-setting-title', title));
      const row = el('div', 'arc-chips');
      items.forEach(item => {
        const chip = button(item.label, 'arc-chip' + (item.id === current ? ' arc-active' : ''), () => { onPick(item.id); buildSettings(); });
        row.appendChild(chip);
      });
      box.appendChild(row);
      return box;
    }

    function buildSettings() {
      const s = screens.settings;
      s.innerHTML = '';
      const panel = el('div', 'arc-panel');
      panel.append(el('h2', 'arc-title arc-title-small', '⚙️ Настройки'));
      panel.append(choiceRow('Звук', [{ id: true, label: '🔊 Вкл' }, { id: false, label: '🔇 Выкл' }], settings.sound, v => { settings.sound = v; }));
      if (config.worlds) {
        const names = Array.isArray(config.worlds) ? config.worlds : Object.keys(WORLDS);
        panel.append(choiceRow('Мир', names.filter(n => WORLDS[n]).map(n => ({ id: n, label: WORLDS[n].icon + ' ' + WORLDS[n].name })), settings.world, v => { settings.world = v; setWorld(v); render(); }));
      }
      if (config.quiz) panel.append(choiceRow('Вопросы', SUBJECTS, settings.subject, v => { settings.subject = v; }));
      if (config.difficulty) panel.append(choiceRow('Сложность', DIFFICULTIES, settings.difficulty, v => { settings.difficulty = v; }));
      panel.append(el('div', 'arc-row').appendChild(button('✔ Готово', '', () => { save(id + '-settings', settings); buildMenu(); show('menu'); })).parentNode);
      s.appendChild(panel);
    }

    function buildPause() {
      const s = screens.pause;
      s.innerHTML = '';
      const panel = el('div', 'arc-panel');
      const row = el('div', 'arc-row arc-col');
      row.append(
        button('▶ Продолжить', '', togglePause),
        button('🔄 Заново', 'arc-btn-2', start),
        button('🏠 В меню', 'arc-btn-2', toMenu)
      );
      panel.append(el('h2', 'arc-title arc-title-small', '⏸ Пауза'), row);
      s.appendChild(panel);
    }

    function buildOver(win) {
      const s = screens.over;
      s.innerHTML = '';
      const record = game.score > 0 && game.score >= game.best;
      const panel = el('div', 'arc-panel');
      panel.append(
        el('div', 'arc-logo', win ? '🏆' : '💥'),
        el('h2', 'arc-title arc-title-small', win ? 'Победа!' : 'Игра окончена'),
        el('p', 'arc-final', '⭐ ' + game.score),
        el('p', 'arc-best', record ? '🎉 Новый рекорд!' : '🏆 Рекорд: ' + game.best)
      );
      const row = el('div', 'arc-row');
      row.append(button('🔄 Играть снова', '', start), button('🏠 В меню', 'arc-btn-2', toMenu));
      panel.append(row);
      s.appendChild(panel);
    }

    /* ---------- Квиз и выбор улучшения ---------- */

    // const ok = await game.ask() — вопрос по предмету из настроек.
    // Своё задание: game.ask({ text: '2 + 2 = ?', answer: '4', options: ['3', '4', '5', '6'] })
    game.ask = function (question) {
      const q = question || (Array.isArray(config.quiz && config.quiz.questions) ? pick(config.quiz.questions) : makeQuestion(settings.subject, DIFFICULTIES.findIndex(d => d.id === settings.difficulty) + game.level - 1));
      const options = q.options || shuffle([q.answer].concat(q.wrong || []));
      return new Promise(resolve => {
        const before = game.state;
        game.state = 'quiz';
        const s = screens.quiz;
        s.innerHTML = '';
        const panel = el('div', 'arc-panel arc-quiz');
        panel.append(el('div', 'arc-quiz-hint', q.hint || 'Вопрос'), el('div', 'arc-quiz-text' + (String(q.text).length > 14 ? ' arc-long' : ''), q.text));
        const grid = el('div', 'arc-quiz-grid');
        let answered = false;
        options.forEach((opt, i) => {
          const b = button((i + 1) + '. ' + opt, 'arc-answer', () => {
            if (answered) return;
            answered = true;
            const ok = String(opt) === String(q.answer);
            b.classList.add(ok ? 'arc-right' : 'arc-wrong');
            if (!ok) grid.querySelectorAll('.arc-answer').forEach((x, k) => { if (String(options[k]) === String(q.answer)) x.classList.add('arc-right'); });
            game.sound(ok ? 'coin' : 'lose');
            setTimeout(() => {
              show(null);
              game.state = before === 'quiz' ? 'play' : before;
              last = performance.now();
              resolve(ok);
            }, ok ? 600 : 1300);
          }, i + 1);
          grid.appendChild(b);
        });
        panel.appendChild(grid);
        s.appendChild(panel);
        show('quiz');
      });
    };

    // const card = await game.choose([{ icon: '⚡', title: 'Быстрее', text: '+20% скорости' }, ...])
    game.choose = function (cards, title) {
      return new Promise(resolve => {
        const before = game.state;
        game.state = 'choose';
        const s = screens.choose;
        s.innerHTML = '';
        const panel = el('div', 'arc-panel arc-choose');
        panel.append(el('h2', 'arc-title arc-title-small', title || 'Выбери улучшение'));
        const row = el('div', 'arc-cards');
        cards.forEach((card, i) => {
          const b = button('<span class="arc-card-icon">' + (card.icon || '⭐') + '</span><b>' + (i + 1) + '. ' + (card.title || '') + '</b><small>' + (card.text || '') + '</small>', 'arc-card', () => {
            show(null);
            game.state = before === 'choose' ? 'play' : before;
            last = performance.now();
            game.sound('bonus');
            resolve(card);
          }, i + 1);
          row.appendChild(b);
        });
        panel.appendChild(row);
        s.appendChild(panel);
        show('choose');
      });
    };

    /* ---------- Ход игры ---------- */
    let countdownLeft = 0;
    let endingLeft = 0;
    let endingWin = false;

    function reset() {
      game.objects = [];
      particles = []; popups = []; timers = [];
      game.score = 0; game.lives = config.lives; game.level = 1;
      game.time = 0; game.frame = 0; game.hurt = 0;
      game.camera.x = 0; game.camera.y = 0;
      game.swipe = null;
      game.data = {};
      followTarget = null;
      Object.keys(customHud).forEach(k => { customHud[k].remove(); delete customHud[k]; });
      game.diff = (DIFFICULTIES.find(d => d.id === settings.difficulty) || DIFFICULTIES[1]).value;
      levelBox.classList.add('arc-hidden');
      down.clear(); pressed.clear();
      resetPhysics();
      reset3d();
    }

    function start() {
      if (!libsReady) { game.ready.then(start); return; } // ждём Matter.js / Three.js
      reset();
      setWorld(settings.world);
      if (config.setup) config.setup(game);
      updateHud();
      show(null);
      hud.classList.remove('arc-hidden');
      if (config.countdown) {
        game.state = 'countdown';
        countdownLeft = 3;
        showCount(3);
      } else {
        game.state = 'play';
        game.sound('start');
      }
      last = performance.now();
    }

    function showCount(n) {
      countBox.classList.remove('arc-hidden');
      countBox.textContent = n > 0 ? n : 'Вперёд!';
      countBox.classList.remove('arc-pop'); void countBox.offsetWidth; countBox.classList.add('arc-pop');
      game.sound(n > 0 ? 'tick' : 'start');
    }

    function togglePause() {
      if (game.state === 'play') { game.state = 'pause'; buildPause(); show('pause'); }
      else if (game.state === 'pause') { game.state = 'play'; show(null); last = performance.now(); }
    }
    pauseBtn.addEventListener('click', togglePause);
    document.addEventListener('visibilitychange', () => { if (document.hidden && game.state === 'play') togglePause(); });

    function toMenu() {
      game.state = 'menu';
      hud.classList.add('arc-hidden');
      countBox.classList.add('arc-hidden');
      buildMenu();
      show('menu');
    }

    // Конец игры: game.over() — проигрыш, game.win() — победа
    game.over = function (win) {
      if (game.state === 'over' || game.state === 'ending' || game.state === 'menu') return;
      endingWin = !!win;
      game.state = 'ending';
      endingLeft = 0.9;
      game.sound(win ? 'win' : 'crash');
    };
    game.win = function () { game.over(true); };
    game.restart = start;
    game.pause = togglePause;

    function finish() {
      game.state = 'over';
      if (game.score > game.best) { game.best = game.score; save(id + '-best', game.best); }
      if (config.onOver) config.onOver(game, endingWin);
      buildOver(endingWin);
      show('over');
    }

    // Один шаг игры. Можно вызвать вручную для проверки: game.step(1 / 60)
    game.step = function (dt) {
      if (game.state === 'countdown') {
        const before = Math.ceil(countdownLeft);
        countdownLeft -= dt;
        const now = Math.ceil(countdownLeft);
        if (now !== before) showCount(now);
        if (countdownLeft <= -0.4) { game.state = 'play'; countBox.classList.add('arc-hidden'); pressed.clear(); }
      } else if (game.state === 'play') {
        game.time += dt;
        game.frame += 1;
        if (game.hurt > 0) game.hurt -= dt;
        if (config.update) config.update(game, dt);
        if (game.state === 'play' || game.state === 'ending') {
          game.objects.forEach(o => { if (!o.dead) updateObject(o, dt); });
          stepPhysics(dt);
          cleanup3d();
          game.objects = game.objects.filter(o => !o.dead);
          updateTimers(dt);
        }
        updateCamera(dt);
        game.swipe = null;
        pressed.clear();
      } else if (game.state === 'ending') {
        endingLeft -= dt;
        if (endingLeft <= 0) finish();
      }
      if (game.state !== 'pause' && game.state !== 'quiz' && game.state !== 'choose') updateEffects(dt);
      render(dt);
    };

    function render(dt) {
      ctx.save();
      if (shakeTime > 0) ctx.translate(rand(-shakePower, shakePower), rand(-shakePower, shakePower));
      if (scene) ctx.clearRect(0, 0, game.width, game.height); // в 3D фон рисует Three.js
      else drawWorld(game.state === 'pause' ? 0 : (dt || 0));
      if (config.drawBehind) config.drawBehind(game, ctx);
      game.objects.slice().sort((a, b) => a.z - b.z).forEach(o => { if (!o.dead) drawObject(o); });
      if (engine) drawLinks();
      drawEffects();
      if (config.draw) config.draw(game, ctx);
      ctx.restore();
      if (flashTime > 0) {
        ctx.globalAlpha = clamp(flashTime / flashMax, 0, 1);
        ctx.fillStyle = flashColor;
        ctx.fillRect(0, 0, game.width, game.height);
        ctx.globalAlpha = 1;
      }
      if (renderer) renderer.render(scene, camera3);
    }

    let last = performance.now();
    function loop(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      game.step(dt);
      requestAnimationFrame(loop);
    }

    // Утилиты прямо в игре: game.rand(1, 5), game.pick(['🍎', '🍌'])
    Object.assign(game, { rand, randInt, pick, chance, clamp, shuffle, dist, angleTo });
    game.start = start;
    game.menu = toMenu;
    game.setWorld = function (name) { settings.world = name; setWorld(name); };

    // Запуск: мир, меню, цикл
    setWorld(settings.world);
    resize();
    buildMenu();
    show('menu');
    if (config.autoStart) start();
    requestAnimationFrame(loop);
    return game;
  }

  window.Arcade = {
    version: VERSION,
    create: create,
    worlds: Object.keys(WORLDS),
    sounds: Object.keys(SOUNDS),
    subjects: SUBJECTS.map(s => s.id),
    rand: rand, randInt: randInt, pick: pick, chance: chance, clamp: clamp, shuffle: shuffle, dist: dist, angleTo: angleTo
  };
})();
