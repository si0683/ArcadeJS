/* =========================================================
   FLAPPY BIRD — логика игры на чистом JavaScript
   ---------------------------------------------------------
   Как устроен файл (читайте сверху вниз):
     0. Лаборатория: 10 настроек для экспериментов
     1. Данные для настроек (цвета, фоны, сложность)
     2. Настройки игрока и рекорд (сохраняются в браузере)
     3. Звуки
     4. Холст и размер игры
     5. Состояние игры, птица и препятствия
     6. Рисование: помощники, фоны, земля, препятствия, птица
     7. Частицы (перья, искры)
     8. Игровые действия: взмах, очко, удар, конец игры
     9. Обновление мира за один кадр
    10. Рисование одного кадра
    11. Экраны и интерфейс
    12. Экран настроек
    13. Управление (клавиатура, мышь, касание)
    14. Игровой цикл и запуск
   ========================================================= */


/* ---------------------------------------------------------
   0. ЛАБОРАТОРИЯ ИГРЫ 🧪
   Поменяй одно значение, и игра изменится!
   Сейчас здесь обычные значения: игра такая, как задумано.
   --------------------------------------------------------- */

const LAB = {
  // 1. Название игры в меню: верхнее и нижнее слово (до 8 букв)
  titleTop: 'Flappy',
  titleBottom: 'Bird',

  // 2. Свой цвет птички, например '#FF7EB6' (розовый).
  //    Пусто '' — своего цвета нет. Цвет появится в «Настройках»
  myBirdColor: '',

  // 3. Гравитация: 1 — обычная, 0.5 — Луна, 2 — Юпитер
  gravity: 1,

  // 4. Размер птички (радиус): 20 — обычная, 30 — большая, 14 — маленькая
  birdSize: 20,

  // 5. Скорость игры: 1 — обычная, 0.5 — замедление, 1.5 — турбо
  gameSpeed: 1,

  // 6. Добавка к просвету между трубами: 0 — как есть, 60 — легче, -30 — труднее
  gapBonus: 0,

  // 7. Расстояние между препятствиями: 270 — обычное, 200 — чаще, 400 — реже
  obstacleDistance: 270,

  // 8. Сколько очков за одно препятствие: 1 — обычно, 100 — огромные числа
  pointsPerObstacle: 1,

  // 9. Салют за очко: false — жёлтые искры, true — разноцветный салют
  fireworks: false,

  // 10. Радужный хвост за птичкой: false — нет, true — есть
  rainbowTrail: false
};


/* ---------------------------------------------------------
   1. ДАННЫЕ ДЛЯ НАСТРОЕК
   --------------------------------------------------------- */

// Цвета главного персонажа
const CHARACTER_COLORS = [
  { id: 'blue',   label: 'Синий',      color: '#4A9DFF' },
  { id: 'green',  label: 'Зелёный',    color: '#5BD97A' },
  { id: 'red',    label: 'Красный',    color: '#FF5C5C' },
  { id: 'yellow', label: 'Жёлтый',     color: '#FFD84A' },
  { id: 'purple', label: 'Фиолетовый', color: '#B47AFF' }
];

// Виды препятствий
const OBSTACLE_TYPES = [
  { id: 'pipes',   label: 'Трубы' },
  { id: 'columns', label: 'Колонны' }
];

// Цвета препятствий: основной цвет и тёмный (для теней и обводки)
const OBSTACLE_COLORS = [
  { id: 'green', label: 'Зелёный',    color: '#4CAF6B', dark: '#2f7a47' },
  { id: 'gray',  label: 'Серый',      color: '#9099A6', dark: '#5f6778' },
  { id: 'brown', label: 'Коричневый', color: '#9B6B43', dark: '#6b4527' },
  { id: 'black', label: 'Чёрный',     color: '#4a505e', dark: '#22252c' }
];

// Фоны
const BACKGROUNDS = [
  { id: 'day',      label: 'Дневное небо' },
  { id: 'space',    label: 'Космос' },
  { id: 'city',     label: 'Ночной город' },
  { id: 'mountain', label: 'Горы' }
];

// Сложность. Здесь живёт вся «физика» игры — попробуйте поменять числа!
//   gravity  — гравитация: насколько быстро птица падает
//   jump     — сила взмаха (минус = вверх, потому что ось Y на холсте идёт вниз)
//   speed    — скорость препятствий на старте
//   maxSpeed — максимальная скорость, до которой игра разгоняется
//   gap      — ширина просвета между верхней и нижней частью препятствия
const DIFFICULTIES = [
  { id: 'easy',   label: 'Лёгкая',     gravity: 0.22, jump: -5.6, speed: 2.0, maxSpeed: 3.4, gap: 210 },
  { id: 'normal', label: 'Нормальная', gravity: 0.30, jump: -6.4, speed: 2.6, maxSpeed: 4.2, gap: 175 },
  { id: 'hard',   label: 'Сложная',    gravity: 0.38, jump: -7.2, speed: 3.2, maxSpeed: 5.0, gap: 150 }
];

// Сколько жизней можно выбрать
const LIVES_CHOICES = [
  { id: 1, label: '1' },
  { id: 2, label: '2' },
  { id: 3, label: '3' },
  { id: 4, label: '4' },
  { id: 5, label: '5' }
];

// Свой цвет из Лаборатории — добавляем в конец списка цветов
if (LAB.myBirdColor) {
  CHARACTER_COLORS.push({ id: 'my', label: 'Мой цвет', color: LAB.myBirdColor });
}

// Найти элемент списка по id (если не нашли — берём первый)
function findById(list, id) {
  return list.find(item => item.id === id) || list[0];
}


/* ---------------------------------------------------------
   2. НАСТРОЙКИ ИГРОКА И РЕКОРД
   localStorage — «память» браузера: данные остаются после перезагрузки
   --------------------------------------------------------- */

const DEFAULT_SETTINGS = {
  character: 'blue',
  obstacleType: 'pipes',
  obstacleColor: 'green',
  background: 'day',
  difficulty: 'easy',
  lives: 3,
  sound: true,
  volume: 0.7,
  training: false
};

let settings = loadSettings();
let bestScore = loadBestScore();

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('flappy-settings'));
    return Object.assign({}, DEFAULT_SETTINGS, saved);
  } catch (error) {
    return Object.assign({}, DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  try {
    localStorage.setItem('flappy-settings', JSON.stringify(settings));
  } catch (error) {
    // Если браузер запретил сохранение — просто играем без него
  }
}

function loadBestScore() {
  try {
    return Number(localStorage.getItem('flappy-best')) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore() {
  try {
    localStorage.setItem('flappy-best', String(bestScore));
  } catch (error) {
    // ничего страшного
  }
}

// Текущая сложность (из списка DIFFICULTIES) с учётом Лаборатории
function difficulty() {
  const d = findById(DIFFICULTIES, settings.difficulty);
  return {
    gravity: d.gravity * LAB.gravity,
    // Прыжок меняем вместе с гравитацией, чтобы высота взмаха осталась прежней
    jump: d.jump * Math.sqrt(LAB.gravity),
    speed: d.speed * LAB.gameSpeed,
    maxSpeed: d.maxSpeed * LAB.gameSpeed,
    gap: d.gap + LAB.gapBonus
  };
}


/* ---------------------------------------------------------
   3. ЗВУКИ
   Файлы лежат в папке sounds/. В CodePen своей папки нет,
   поэтому там звуки загружаются с сайта игры на GitHub Pages.
   --------------------------------------------------------- */

const isCodePen = location.hostname.includes('codepen') || location.hostname.includes('cdpn.io');
const SOUND_PATH = isCodePen ? 'https://si0683.github.io/FlappyBird/sounds/' : 'sounds/';

const SOUND_FILES = {
  flap:  'flap.wav',   // взмах крыльями
  score: 'score.mp3',  // пролетели препятствие
  tick:  'tick.wav',   // обратный отсчёт
  start: 'start.wav',  // старт и ускорение
  hit:   'hit.wav'     // удар
};

// С какой секунды начинать звук: в начале score.mp3 есть тишина,
// без пропуска звук очка опаздывал бы
const SOUND_START = {
  score: 0.045
};

// Web Audio — «звуковой движок» браузера. Он играет звук мгновенно,
// в отличие от тега <audio>, у которого есть заметная задержка.
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const sounds = {}; // сюда попадут загруженные звуки

// Загружаем каждый файл и превращаем его в готовый к игре звук
for (const name in SOUND_FILES) {
  fetch(SOUND_PATH + SOUND_FILES[name])
    .then(response => response.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data))
    .then(buffer => { sounds[name] = buffer; })
    .catch(() => {}); // не загрузился — игра идёт без этого звука
}

function playSound(name) {
  if (!settings.sound || !sounds[name]) return;
  // Браузер «будит» звук только после первого клика или нажатия
  if (audioContext.state === 'suspended') audioContext.resume();

  const source = audioContext.createBufferSource(); // проигрыватель
  source.buffer = sounds[name];
  const volume = audioContext.createGain();          // регулятор громкости
  volume.gain.value = settings.volume;
  source.connect(volume);
  volume.connect(audioContext.destination);          // → колонки
  source.start(0, SOUND_START[name] || 0);
}


/* ---------------------------------------------------------
   4. ХОЛСТ И РАЗМЕР ИГРЫ
   Игра всегда считает, что её высота 600 «игровых пикселей».
   Ширина подстраивается под экран, а потом всё масштабируется.
   --------------------------------------------------------- */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // ctx — «кисточка», которой мы рисуем
const stage = document.getElementById('stage');

const H = 600;                      // высота игрового мира
const GROUND_HEIGHT = 70;           // высота земли
const GROUND_Y = H - GROUND_HEIGHT; // где начинается земля
const MIN_WIDTH = 280;
const MAX_WIDTH = 900;

let W = 800;   // ширина игрового мира (меняется под экран)
let scale = 1; // во сколько раз увеличить мир, чтобы он занял экран

function resizeGame() {
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  scale = screenH / H;
  W = screenW / scale;

  if (W < MIN_WIDTH) {      // очень узкий экран — подгоняем по ширине
    W = MIN_WIDTH;
    scale = screenW / W;
  }
  if (W > MAX_WIDTH) {      // очень широкий экран — по бокам будут поля
    W = MAX_WIDTH;
  }

  const cssWidth = W * scale;
  const cssHeight = H * scale;
  stage.style.width = cssWidth + 'px';
  stage.style.height = cssHeight + 'px';

  // devicePixelRatio — чтобы на телефонах и Retina-экранах картинка была чёткой
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssWidth * ratio);
  canvas.height = Math.round(cssHeight * ratio);
  ctx.setTransform(scale * ratio, 0, 0, scale * ratio, 0, 0);

  bird.x = clamp(W * 0.28, 90, 250);
}


/* ---------------------------------------------------------
   5. СОСТОЯНИЕ ИГРЫ, ПТИЦА И ПРЕПЯТСТВИЯ
   --------------------------------------------------------- */

// В каком состоянии игра:
//   'menu'      — меню (на фоне птица летит сама)
//   'countdown' — отсчёт 3-2-1
//   'playing'   — играем
//   'paused'    — пауза
//   'falling'   — жизни кончились, птица падает
//   'over'      — экран «Игра окончена»
const game = {
  state: 'menu',
  score: 0,
  passed: 0,         // сколько препятствий пролетели (для ускорения)
  lives: 3,
  speed: 2,          // текущая скорость препятствий
  targetSpeed: 2,    // к этой скорости игра плавно разгоняется
  distance: 0,       // сколько пролетели — для движения фона
  time: 0,           // сколько миллисекунд прошло — для анимаций
  invulnerable: 0,   // сколько ещё миллисекунд птица неуязвима
  shake: 0,          // тряска экрана после удара
  recordShown: false
};

const bird = {
  x: 200,
  y: H / 2,
  vy: 0,        // скорость по вертикали (velocity y)
  r: LAB.birdSize, // радиус птицы (меняется в Лаборатории)
  angle: 0,     // наклон
  wing: 0,      // фаза взмаха крыльев
  blink: false, // моргает ли сейчас
  dead: false
};

const OBSTACLE_WIDTH = 78;
const OBSTACLE_SPACING = LAB.obstacleDistance; // расстояние между препятствиями
let obstacles = [];           // массив препятствий: { x, gapY, gap, passed, broken }

function spawnObstacle() {
  const gap = difficulty().gap;
  const minY = 70 + gap / 2;
  const maxY = GROUND_Y - 50 - gap / 2;
  let gapY = minY + Math.random() * (maxY - minY);

  // Чтобы просвет не прыгал слишком резко от препятствия к препятствию
  const last = obstacles[obstacles.length - 1];
  if (last) {
    gapY = clamp(gapY, last.gapY - 170, last.gapY + 170);
  }

  obstacles.push({ x: W + 40, gapY: gapY, gap: gap, passed: false, broken: false });
}


/* ---------------------------------------------------------
   6. РИСОВАНИЕ
   --------------------------------------------------------- */

/* ---- 6.1 Помощники ---- */

const TAU = Math.PI * 2; // полный круг в радианах

// Ограничить число границами: clamp(15, 0, 10) → 10
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// «Заворачивает» координату, чтобы облака и звёзды бесконечно повторялись
function wrap(value, length) {
  return ((value % length) + length) % length;
}

// Псевдослучайное число 0..1, которое для одного n всегда одинаковое.
// Так дома и звёзды не «скачут» от кадра к кадру.
function seeded(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Смешать два цвета: t = 0 → первый цвет, t = 1 → второй
function mixColors(hex1, hex2, t) {
  const a = parseInt(hex1.slice(1), 16);
  const b = parseInt(hex2.slice(1), 16);
  const r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t);
  const g = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t);
  const bl = Math.round((a & 255) * (1 - t) + (b & 255) * t);
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

function drawCircle(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
}

// Вертикальный градиент: colors — список цветов сверху вниз
function fillGradient(c, w, h, colors) {
  const g = c.createLinearGradient(0, 0, 0, h);
  colors.forEach((color, i) => g.addColorStop(i / (colors.length - 1), color));
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}

// Мягкое свечение (для солнца, луны, туманностей)
function drawGlow(c, x, y, r, color) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

// Холмы или горы из волн (синусов)
function drawHills(c, w, offset, baseY, height, freq, color) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, H);
  for (let x = 0; x <= w + 10; x += 10) {
    const p = x + offset;
    const y = baseY - (Math.sin(p * freq) * 0.6 + Math.sin(p * freq * 2.3 + 1.7) * 0.4) * height;
    c.lineTo(x, y);
  }
  c.lineTo(w, H);
  c.closePath();
  c.fill();
}

// Острые горные вершины («пила» вместо волны)
function drawPeaks(c, w, offset, baseY, height, width, color, snow) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, H);
  const first = Math.floor(offset / width) - 1;
  for (let i = first; i * width - offset < w + width; i++) {
    const x = i * width - offset;
    const peak = baseY - height * (0.55 + seeded(i) * 0.45);
    c.lineTo(x, baseY);
    c.lineTo(x + width / 2, peak);
  }
  c.lineTo(w, baseY);
  c.lineTo(w, H);
  c.closePath();
  c.fill();

  if (!snow) return;
  // Снежные шапки на вершинах
  c.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = first; i * width - offset < w + width; i++) {
    const x = i * width - offset + width / 2;
    const peakH = height * (0.55 + seeded(i) * 0.45);
    const peak = baseY - peakH;
    const cap = peakH * 0.22;
    const half = (width / 2) * (cap / peakH);
    c.beginPath();
    c.moveTo(x, peak);
    c.lineTo(x + half, peak + cap);
    c.lineTo(x + half * 0.3, peak + cap * 0.75);
    c.lineTo(x - half * 0.3, peak + cap);
    c.lineTo(x - half, peak + cap);
    c.closePath();
    c.fill();
  }
}

// Облако из нескольких кругов
function drawCloud(c, x, y, size, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, 22 * size, 0, TAU);
  c.arc(x + 26 * size, y - 12 * size, 26 * size, 0, TAU);
  c.arc(x + 56 * size, y, 22 * size, 0, TAU);
  c.arc(x + 28 * size, y + 6 * size, 20 * size, 0, TAU);
  c.fill();
}

/* ---- 6.2 Фоны ----
   Каждый фон рисуется слоями: дальние слои двигаются медленнее
   ближних — так получается эффект глубины (параллакс).
   dist — сколько пролетели, time — время для мерцания. */

function drawBackground(c, id, w, dist, time) {
  if (id === 'space') drawSpace(c, w, dist, time);
  else if (id === 'city') drawCity(c, w, dist, time);
  else if (id === 'mountain') drawMountain(c, w, dist, time);
  else drawDay(c, w, dist, time);
}

function drawDay(c, w, dist, time) {
  fillGradient(c, w, H, ['#4fb0ff', '#8fd3ff', '#d8f1ff']);

  drawGlow(c, w * 0.8, 110, 140, 'rgba(255,240,160,0.7)');
  drawCircle(c, w * 0.8, 110, 42, '#ffe066');

  // Облака плывут сами и немного сдвигаются от полёта
  for (let i = 0; i < 7; i++) {
    const x = wrap(seeded(i) * 1500 - dist * 0.15 - time * 0.008 * (1 + seeded(i + 3)), 1500) - 200;
    const y = 50 + seeded(i + 10) * 200;
    const size = 0.6 + seeded(i + 20) * 0.8;
    drawCloud(c, x, y, size, 'rgba(255,255,255,0.92)');
  }

  drawHills(c, w, dist * 0.2, GROUND_Y - 70, 40, 0.008, '#9ad98a');
  drawHills(c, w, dist * 0.45 + 300, GROUND_Y - 25, 30, 0.012, '#6cc46a');
}

function drawSpace(c, w, dist, time) {
  fillGradient(c, w, H, ['#04051a', '#120b38', '#2a1458']);

  // Туманности
  drawGlow(c, w * 0.25 + Math.sin(time * 0.0003) * 30, 180, 260, 'rgba(255,95,168,0.20)');
  drawGlow(c, w * 0.7, 330 + Math.cos(time * 0.0004) * 20, 240, 'rgba(79,214,232,0.16)');

  // Мерцающие звёзды трёх «глубин»
  for (let i = 0; i < 140; i++) {
    const depth = 0.04 + (i % 3) * 0.06;
    const x = wrap(seeded(i) * 1400 - dist * depth, 1400) - 100;
    const y = seeded(i + 500) * GROUND_Y;
    const r = 0.6 + seeded(i + 900) * 1.6;
    c.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(time * 0.0015 + i));
    drawCircle(c, x, y, r, '#ffffff');
  }
  c.globalAlpha = 1;

  // Планета с кольцом
  const px = w * 0.78;
  const py = 130;
  const g = c.createRadialGradient(px - 18, py - 18, 6, px, py, 52);
  g.addColorStop(0, '#e2dcff');
  g.addColorStop(1, '#6b5bd6');
  c.fillStyle = g;
  c.beginPath();
  c.arc(px, py, 48, 0, TAU);
  c.fill();
  c.strokeStyle = 'rgba(255,214,140,0.8)';
  c.lineWidth = 5;
  c.beginPath();
  c.ellipse(px, py, 80, 18, -0.35, 0, TAU);
  c.stroke();
}

function drawCity(c, w, dist, time) {
  fillGradient(c, w, H, ['#0b0a2a', '#22184f', '#53307a']);

  for (let i = 0; i < 40; i++) {
    c.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(time * 0.001 + i));
    drawCircle(c, seeded(i) * w, seeded(i + 50) * 260, 1.2, '#ffffff');
  }
  c.globalAlpha = 1;

  drawGlow(c, w * 0.82, 100, 120, 'rgba(244,238,203,0.35)');
  drawCircle(c, w * 0.82, 100, 36, '#f4eecb');
  drawCircle(c, w * 0.82 + 10, 92, 7, 'rgba(0,0,0,0.07)');

  drawBuildings(c, w, dist * 0.2, 60, 100, 170, '#1f1b4d', false, time);
  drawBuildings(c, w, dist * 0.45, 90, 70, 200, '#130f33', true, time);
}

// Ряд домов. slot — ширина места под один дом
function drawBuildings(c, w, offset, slot, minH, maxH, color, windows, time) {
  const first = Math.floor(offset / slot) - 1;
  for (let i = first; i * slot - offset < w; i++) {
    const x = i * slot - offset;
    const bw = slot * (0.7 + seeded(i) * 0.3);
    const bh = minH + seeded(i + 100) * maxH;
    const top = GROUND_Y - bh;
    c.fillStyle = color;
    c.fillRect(x, top, bw, bh);

    if (!windows) continue;
    // Окна: одни горят, другие нет, некоторые медленно мигают
    for (let row = 0; top + 14 + row * 20 < GROUND_Y - 10; row++) {
      for (let col = 0; 8 + col * 16 < bw - 10; col++) {
        const s = seeded(i * 97 + row * 13 + col);
        const lit = s + 0.08 * Math.sin(time * 0.0008 + s * 60) > 0.55;
        if (lit) {
          c.fillStyle = s > 0.85 ? '#ff9fd0' : '#ffd479';
          c.fillRect(x + 8 + col * 16, top + 14 + row * 20, 7, 9);
        }
      }
    }
  }
}

function drawMountain(c, w, dist, time) {
  fillGradient(c, w, H, ['#ff9a8b', '#ffc58f', '#ffe3b3']);

  drawGlow(c, w * 0.3, 320, 200, 'rgba(255,243,206,0.8)');
  drawCircle(c, w * 0.3, 320, 56, '#fff3ce');

  for (let i = 0; i < 4; i++) {
    const x = wrap(seeded(i + 40) * 1500 - dist * 0.1 - time * 0.006, 1500) - 200;
    drawCloud(c, x, 80 + seeded(i + 60) * 120, 0.7, 'rgba(255,240,230,0.6)');
  }

  drawPeaks(c, w, dist * 0.12, GROUND_Y - 20, 300, 260, '#9b7bb5', true);
  drawPeaks(c, w, dist * 0.25 + 90, GROUND_Y, 220, 200, '#6f5a96', false);
  drawHills(c, w, dist * 0.5, GROUND_Y - 10, 25, 0.015, '#4a3d68');
}

/* ---- 6.3 Земля ---- */

function drawGround(c, id, w, dist) {
  // Цвета земли для каждого фона: верхняя полоса, основа, полоски
  const styles = {
    day:      { top: '#7ed957', edge: '#4fa83a', base: '#deb06a', stripe: '#c99550' },
    space:    { top: '#8a8fb0', edge: '#5d6285', base: '#4b4f6b', stripe: '#3f4360' },
    city:     { top: '#3b3866', edge: '#25234a', base: '#1a1a2e', stripe: '#ffd479' },
    mountain: { top: '#6aa655', edge: '#467a3a', base: '#7a5a3a', stripe: '#694b2f' }
  };
  const s = styles[id] || styles.day;

  c.fillStyle = s.base;
  c.fillRect(0, GROUND_Y, w, GROUND_HEIGHT);

  // Полоски бегут вместе с препятствиями — так видна скорость
  const shift = wrap(dist, 40);
  c.fillStyle = s.stripe;
  if (id === 'city') {
    // У города — разметка на дороге
    for (let x = -shift; x < w; x += 40) {
      c.fillRect(x, GROUND_Y + 38, 22, 4);
    }
  } else {
    for (let x = -shift - 40; x < w + 40; x += 40) {
      c.beginPath();
      c.moveTo(x, GROUND_Y + 16);
      c.lineTo(x + 20, GROUND_Y + 16);
      c.lineTo(x + 40, H);
      c.lineTo(x + 20, H);
      c.closePath();
      c.fill();
    }
  }

  // Верхняя полоса (трава / тротуар / лунный грунт)
  c.fillStyle = s.top;
  c.fillRect(0, GROUND_Y, w, 14);
  c.fillStyle = s.edge;
  c.fillRect(0, GROUND_Y + 14, w, 4);

  // У космоса — кратеры
  if (id === 'space') {
    const offset = dist;
    const first = Math.floor(offset / 120) - 1;
    for (let i = first; i * 120 - offset < w + 120; i++) {
      const x = i * 120 - offset + seeded(i) * 60;
      c.fillStyle = 'rgba(0,0,0,0.18)';
      c.beginPath();
      c.ellipse(x, GROUND_Y + 40 + seeded(i + 7) * 16, 14 + seeded(i + 3) * 10, 5, 0, 0, TAU);
      c.fill();
    }
  }
}

/* ---- 6.4 Препятствия ---- */

// Нарисовать пару (верх и низ) с просветом. bottomY — где заканчивается нижняя часть
function drawObstacle(c, x, gapY, gap, bottomY) {
  const type = settings.obstacleType;
  const colors = findById(OBSTACLE_COLORS, settings.obstacleColor);
  const topEnd = gapY - gap / 2;    // низ верхней части
  const bottomStart = gapY + gap / 2; // верх нижней части

  if (type === 'columns') {
    drawColumn(c, x, -20, topEnd + 20, colors, 'top');
    drawColumn(c, x, bottomStart, bottomY - bottomStart, colors, 'bottom');
  } else {
    drawPipe(c, x, -20, topEnd + 20, colors, 'top');
    drawPipe(c, x, bottomStart, bottomY - bottomStart, colors, 'bottom');
  }
}

// Труба с «шапкой» у просвета. side: 'top' — верхняя, 'bottom' — нижняя
function drawPipe(c, x, y, h, colors, side) {
  const w = OBSTACLE_WIDTH;
  const capH = 28;

  // Градиент слева направо даёт объём: тёмный край → блик → тёмный край
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, colors.dark);
  g.addColorStop(0.3, mixColors(colors.color, '#ffffff', 0.35));
  g.addColorStop(0.55, colors.color);
  g.addColorStop(1, colors.dark);

  c.fillStyle = g;
  c.strokeStyle = colors.dark;
  c.lineWidth = 3;
  c.fillRect(x + 5, y, w - 10, h);
  c.strokeRect(x + 5, y, w - 10, h);

  const capY = side === 'top' ? y + h - capH : y;
  c.beginPath();
  c.roundRect(x - 2, capY, w + 4, capH, 6);
  c.fill();
  c.stroke();

  // Блик на шапке
  c.fillStyle = 'rgba(255,255,255,0.25)';
  c.fillRect(x + 8, capY + 5, 8, capH - 10);
}

// Каменная колонна с капителью у просвета
function drawColumn(c, x, y, h, colors, side) {
  const w = OBSTACLE_WIDTH;
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, colors.dark);
  g.addColorStop(0.35, mixColors(colors.color, '#ffffff', 0.25));
  g.addColorStop(1, colors.dark);

  c.fillStyle = g;
  c.fillRect(x + 8, y, w - 16, h);

  // Вертикальные желобки
  c.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 1; i <= 3; i++) {
    c.fillRect(x + 8 + i * (w - 16) / 4 - 1.5, y, 3, h);
  }

  // Швы между каменными блоками
  c.fillStyle = 'rgba(0,0,0,0.25)';
  const startY = side === 'top' ? y + h : y;
  const dir = side === 'top' ? -1 : 1;
  for (let k = 36; k < h; k += 36) {
    c.fillRect(x + 8, startY + dir * k, w - 16, 3);
  }

  // Капитель (широкая плита в два уровня)
  c.fillStyle = g;
  c.strokeStyle = colors.dark;
  c.lineWidth = 2;
  const slabY = side === 'top' ? y + h - 14 : y;
  const stepY = side === 'top' ? y + h - 24 : y + 14;
  c.fillRect(x - 4, slabY, w + 8, 14);
  c.strokeRect(x - 4, slabY, w + 8, 14);
  c.fillRect(x + 2, stepY, w - 4, 10);
  c.strokeRect(x + 2, stepY, w - 4, 10);
}

/* ---- 6.5 Птица ----
   Все размеры считаются от радиуса r, поэтому птицу
   можно нарисовать любого размера (например, в настройках). */

function drawBird(c, b, color) {
  const r = b.r;
  const dark = mixColors(color, '#000000', 0.3);
  const light = mixColors(color, '#ffffff', 0.45);

  c.save();
  c.translate(b.x, b.y);
  c.rotate(b.angle);

  // Хвост
  c.fillStyle = dark;
  c.beginPath();
  c.moveTo(-r * 0.8, -r * 0.1);
  c.lineTo(-r * 1.45, -r * 0.45);
  c.lineTo(-r * 1.35, r * 0.25);
  c.closePath();
  c.fill();

  // Тело с объёмным градиентом
  const g = c.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.2, 0, 0, r * 1.2);
  g.addColorStop(0, light);
  g.addColorStop(0.55, color);
  g.addColorStop(1, dark);
  c.fillStyle = g;
  c.strokeStyle = dark;
  c.lineWidth = r * 0.1;
  c.beginPath();
  c.ellipse(0, 0, r * 1.1, r, 0, 0, TAU);
  c.fill();
  c.stroke();

  // Животик
  c.fillStyle = mixColors(color, '#ffffff', 0.6);
  c.beginPath();
  c.ellipse(r * 0.1, r * 0.45, r * 0.6, r * 0.38, 0, 0, TAU);
  c.fill();

  // Крыло машет: угол меняется по синусу
  c.save();
  c.translate(-r * 0.2, r * 0.1);
  c.rotate(Math.sin(b.wing) * 0.6);
  c.fillStyle = dark;
  c.beginPath();
  c.ellipse(-r * 0.1, 0, r * 0.55, r * 0.32, -0.3, 0, TAU);
  c.fill();
  c.restore();

  // Глаз
  const ex = r * 0.45;
  const ey = -r * 0.32;
  drawCircle(c, ex, ey, r * 0.36, '#ffffff');
  c.strokeStyle = 'rgba(0,0,0,0.2)';
  c.lineWidth = r * 0.06;
  c.stroke();

  c.strokeStyle = '#12172e';
  c.lineWidth = r * 0.1;
  c.lineCap = 'round';
  if (b.dead) {
    // Глаз-крестик
    const s = r * 0.15;
    c.beginPath();
    c.moveTo(ex - s, ey - s);
    c.lineTo(ex + s, ey + s);
    c.moveTo(ex + s, ey - s);
    c.lineTo(ex - s, ey + s);
    c.stroke();
  } else if (b.blink) {
    // Моргнула — глаз-чёрточка
    c.beginPath();
    c.moveTo(ex - r * 0.2, ey);
    c.lineTo(ex + r * 0.2, ey);
    c.stroke();
  } else {
    drawCircle(c, ex + r * 0.12, ey + r * 0.02, r * 0.17, '#12172e');
    drawCircle(c, ex + r * 0.18, ey - r * 0.06, r * 0.06, '#ffffff');
  }

  // Румянец
  drawCircle(c, r * 0.5, r * 0.18, r * 0.13, 'rgba(255,110,150,0.45)');

  // Клюв: верхняя и нижняя половинки
  c.fillStyle = '#ffb84d';
  c.beginPath();
  c.moveTo(r * 0.85, -r * 0.08);
  c.lineTo(r * 1.55, r * 0.1);
  c.lineTo(r * 0.85, r * 0.2);
  c.closePath();
  c.fill();
  c.fillStyle = '#e8862a';
  c.beginPath();
  c.moveTo(r * 0.85, r * 0.2);
  c.lineTo(r * 1.4, r * 0.15);
  c.lineTo(r * 0.85, r * 0.38);
  c.closePath();
  c.fill();

  c.restore();
}


/* ---------------------------------------------------------
   7. ЧАСТИЦЫ — перья при ударе, искры за очко, облачка от взмаха
   --------------------------------------------------------- */

let particles = [];

function spawnParticles(x, y, count, color, kind) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * TAU;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 1,              // 1 → 0, когда исчезнет
      size: kind === 'puff' ? 4 + Math.random() * 4 : 3 + Math.random() * 4,
      spin: Math.random() * TAU,
      color: color,
      kind: kind            // 'feather', 'spark', 'puff', 'chunk' или 'trail'
    });
  }
}

function updateParticles(k) {
  for (const p of particles) {
    p.x += p.vx * k;
    p.y += p.vy * k;
    // У каждого вида частиц своя «тяжесть»
    if (p.kind === 'chunk') p.vy += 0.3 * k;
    else if (p.kind === 'feather') p.vy += 0.08 * k;
    else if (p.kind !== 'trail') p.vy += 0.02 * k; // хвост не падает
    p.vx *= 0.98;
    p.spin += 0.1 * k;
    p.life -= (p.kind === 'puff' ? 0.05 : 0.02) * k;
  }
  particles = particles.filter(p => p.life > 0);
}

function drawParticles(c) {
  for (const p of particles) {
    c.globalAlpha = Math.max(0, p.life);
    if (p.kind === 'feather') {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.spin);
      c.fillStyle = p.color;
      c.beginPath();
      c.ellipse(0, 0, p.size * 1.6, p.size * 0.6, 0, 0, TAU);
      c.fill();
      c.restore();
    } else if (p.kind === 'chunk') {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.spin);
      c.fillStyle = p.color;
      c.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
      c.restore();
    } else if (p.kind === 'spark') {
      drawStar(c, p.x, p.y, p.size * p.life + 1, p.color);
    } else if (p.kind === 'trail') {
      drawCircle(c, p.x, p.y, p.size * p.life, p.color); // хвост уменьшается
    } else {
      drawCircle(c, p.x, p.y, p.size * (1.5 - p.life), p.color);
    }
  }
  c.globalAlpha = 1;
}

// Звёздочка с 4 лучами
function drawStar(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const len = i % 2 === 0 ? r * 2 : r * 0.6;
    const a = (i / 8) * TAU;
    c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
  }
  c.closePath();
  c.fill();
}


/* ---------------------------------------------------------
   8. ИГРОВЫЕ ДЕЙСТВИЯ
   --------------------------------------------------------- */

// Взмах крыльями: просто задаём скорость вверх
function flap(withSound) {
  bird.vy = difficulty().jump;
  bird.wing = 0;
  spawnParticles(bird.x - bird.r, bird.y + bird.r * 0.4, 3, 'rgba(255,255,255,0.7)', 'puff');
  if (withSound) playSound('flap');
}

function addPoint() {
  game.score += LAB.pointsPerObstacle;
  game.passed++;
  showScore();
  playSound('score');

  if (LAB.fireworks) {
    // Разноцветный салют: по 8 искр каждого цвета
    for (const color of ['#ff5c5c', '#ffd84a', '#5bd97a', '#4a9dff', '#b47aff']) {
      spawnParticles(bird.x, bird.y, 8, color, 'spark');
    }
  } else {
    spawnParticles(bird.x, bird.y, 10, '#ffd84a', 'spark');
  }

  // Каждые 10 препятствий игра становится чуть быстрее
  if (game.passed % 10 === 0) {
    const d = difficulty();
    game.targetSpeed = Math.min(d.maxSpeed, game.targetSpeed + d.speed * 0.12);
    showToast('Быстрее! 🚀');
    playSound('start');
  }

  // Побили рекорд прямо во время игры
  if (!game.recordShown && bestScore > 0 && game.score > bestScore) {
    game.recordShown = true;
    showToast('Новый рекорд! 🏆');
  }
}

// Столкновение с препятствием или землёй
function hit(fromGround) {
  if (game.state !== 'playing') return; // уже проиграли в этом кадре
  if (game.invulnerable > 0) return;

  const color = findById(CHARACTER_COLORS, settings.character).color;
  spawnParticles(bird.x, bird.y, 12, color, 'feather');
  playSound('hit');
  game.shake = 300;

  if (!settings.training) {
    game.lives--;
    updateHearts();
  }

  if (game.lives <= 0) {
    gameOver();
    return;
  }

  // Ещё есть жизни: 1.5 секунды неуязвимости, чтобы не потерять сразу все
  game.invulnerable = 1500;
  if (fromGround) bird.vy = difficulty().jump * 1.2; // отскок от земли
}

// Препятствие рассыпается на кусочки своего цвета
function breakObstacle(o) {
  o.broken = true;
  const color = findById(OBSTACLE_COLORS, settings.obstacleColor).color;
  for (let i = 0; i < 18; i++) {
    const y = clamp(bird.y + (Math.random() - 0.5) * 220, 0, GROUND_Y);
    spawnParticles(o.x + Math.random() * OBSTACLE_WIDTH, y, 1, color, 'chunk');
  }
}

function gameOver() {
  game.state = 'falling';
  bird.dead = true;
  bird.vy = -4; // птица подпрыгивает и падает
}

// Птица упала на землю — показываем итоги
function showResults() {
  game.state = 'over';
  const isRecord = game.score > bestScore;
  if (isRecord) {
    bestScore = game.score;
    saveBestScore();
  }
  document.getElementById('finalScore').textContent = game.score;
  document.getElementById('finalBest').textContent = bestScore;
  document.getElementById('newRecord').classList.toggle('hidden', !isRecord || game.score === 0);
  setTimeout(() => showScreen('over'), 500);
}

// Подготовить новую игру
function resetGame() {
  const d = difficulty();
  game.score = 0;
  game.passed = 0;
  game.lives = settings.lives;
  game.speed = d.speed;
  game.targetSpeed = d.speed;
  game.invulnerable = 0;
  game.shake = 0;
  game.recordShown = false;
  bird.y = H * 0.42;
  bird.vy = 0;
  bird.angle = 0;
  bird.dead = false;
  obstacles = [];
  particles = [];
  showScore();
  updateHearts();
}

let countdownTimer = null;

// Кнопка «Начать»: отсчёт 3-2-1, потом игра
function startGame() {
  resetGame();
  showScreen(null);
  game.state = 'countdown';
  document.getElementById('trainingBadge').classList.toggle('hidden', !settings.training);
  document.getElementById('hearts').classList.toggle('hidden', settings.training);

  let number = 3;
  showCountdown(number);
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    number--;
    if (number > 0) {
      showCountdown(number);
    } else {
      clearInterval(countdownTimer);
      showCountdown('Старт!');
      game.state = 'playing';
      playSound('start');
      flap(false);
    }
  }, 750);
}

function pauseGame() {
  if (game.state !== 'playing') return;
  game.state = 'paused';
  showScreen('pause');
}

function resumeGame() {
  if (game.state !== 'paused') return;
  game.state = 'playing';
  showScreen(null);
}

function goToMenu() {
  clearInterval(countdownTimer);
  hideCountdown();
  resetGame();
  game.state = 'menu';
  showScreen('menu');
}


/* ---------------------------------------------------------
   9. ОБНОВЛЕНИЕ МИРА ЗА ОДИН КАДР
   k — «множитель кадра»: 1, если кадр длился 1/60 секунды.
   Благодаря ему скорость игры одинаковая на любом компьютере.
   --------------------------------------------------------- */

function update(k, dt) {
  game.time += dt;
  updateBirdLook(k);
  updateParticles(k);
  if (game.shake > 0) game.shake -= dt;

  if (game.state === 'menu') updateMenu(k);
  else if (game.state === 'countdown') updateCountdown(k);
  else if (game.state === 'playing') updatePlaying(k, dt);
  else if (game.state === 'falling') updateFalling(k);
}

// Наклон, крылья и моргание — работают всегда
function updateBirdLook(k) {
  const targetAngle = clamp(bird.vy * 0.07, -0.45, 1.3);
  bird.angle += (targetAngle - bird.angle) * 0.2 * k;
  bird.wing += (bird.vy < 0 ? 0.55 : 0.2) * k;
  bird.blink = game.time % 3200 < 130;
}

// Гравитация: каждый кадр скорость падения растёт
function applyGravity(k) {
  bird.vy += difficulty().gravity * k;
  bird.vy = Math.min(bird.vy, 9); // не падаем быстрее 9
  bird.y += bird.vy * k;
}

function moveObstacles(speed, k) {
  for (const o of obstacles) {
    o.x -= speed * k;
  }
  // Убираем ушедшие за левый край
  obstacles = obstacles.filter(o => o.x + OBSTACLE_WIDTH > -20);

  const last = obstacles[obstacles.length - 1];
  if (!last || last.x < W - OBSTACLE_SPACING) spawnObstacle();
}

// В меню птица летит сама (автопилот) — так видно настройки «вживую»
function updateMenu(k) {
  const speed = 2 * LAB.gameSpeed;
  game.distance += speed * k;
  moveObstacles(speed, k);

  applyGravity(k);
  const next = obstacles.find(o => o.x + OBSTACLE_WIDTH > bird.x - 10);
  const targetY = next ? next.gapY + 15 : H * 0.45;
  if (bird.y > targetY && bird.vy > 0) flap(false);
}

// Во время отсчёта птица парит на месте
function updateCountdown(k) {
  game.distance += game.speed * k;
  bird.y = H * 0.42 + Math.sin(game.time * 0.005) * 10;
  bird.vy = Math.cos(game.time * 0.005) * 1.5;
}

function updatePlaying(k, dt) {
  // Скорость плавно догоняет целевую
  game.speed += (game.targetSpeed - game.speed) * 0.02 * k;
  game.distance += game.speed * k;
  if (game.invulnerable > 0) game.invulnerable -= dt;

  // Радужный хвост: каждый кадр новый кружок, цвет плавно меняется по радуге
  if (LAB.rainbowTrail) {
    particles.push({
      x: bird.x - bird.r * 0.8, y: bird.y, vx: -game.speed, vy: 0,
      life: 1, size: bird.r * 0.45, spin: 0,
      color: 'hsl(' + Math.round(game.time * 0.3) % 360 + ', 90%, 60%)',
      kind: 'trail'
    });
  }

  applyGravity(k);
  moveObstacles(game.speed, k);

  // Потолок: не улетаем за верх экрана
  if (bird.y < bird.r) {
    bird.y = bird.r;
    bird.vy = 0;
  }

  // Земля
  if (bird.y + bird.r > GROUND_Y) {
    bird.y = GROUND_Y - bird.r;
    if (game.invulnerable > 0) bird.vy = difficulty().jump;
    else hit(true);
  }

  for (const o of obstacles) {
    // Очко — как только центр птицы прошёл середину препятствия
    if (!o.passed && o.x + OBSTACLE_WIDTH / 2 < bird.x) {
      o.passed = true;
      addPoint();
    }
    // Врезались — препятствие рассыпается, поэтому птица
    // никогда не пролетает сквозь него
    if (birdHitsObstacle(o)) {
      breakObstacle(o);
      hit(false);
    }
  }
  obstacles = obstacles.filter(o => !o.broken);
}

// После проигрыша птица падает на землю
function updateFalling(k) {
  game.distance += game.speed * 0.3 * k;
  applyGravity(k);
  if (bird.y + bird.r > GROUND_Y) {
    bird.y = GROUND_Y - bird.r;
    bird.vy = 0;
    showResults();
  }
}

// Столкновение круга (птицы) с прямоугольником (частью препятствия)
function circleHitsRect(cx, cy, r, rx, ry, rw, rh) {
  // Ближайшая к центру круга точка прямоугольника
  const nearX = clamp(cx, rx, rx + rw);
  const nearY = clamp(cy, ry, ry + rh);
  const dx = cx - nearX;
  const dy = cy - nearY;
  return dx * dx + dy * dy < r * r; // теорема Пифагора
}

function birdHitsObstacle(o) {
  const r = bird.r * 0.8; // чуть меньше картинки — так честнее для игрока
  const topH = o.gapY - o.gap / 2;
  const bottomY = o.gapY + o.gap / 2;
  return circleHitsRect(bird.x, bird.y, r, o.x, -100, OBSTACLE_WIDTH, topH + 100) ||
         circleHitsRect(bird.x, bird.y, r, o.x, bottomY, OBSTACLE_WIDTH, GROUND_Y - bottomY);
}


/* ---------------------------------------------------------
   10. РИСОВАНИЕ ОДНОГО КАДРА
   Порядок важен: что нарисовано позже — то сверху.
   --------------------------------------------------------- */

function draw() {
  ctx.save();

  // Тряска экрана после удара
  if (game.shake > 0) {
    const power = game.shake / 40;
    ctx.translate((Math.random() - 0.5) * power, (Math.random() - 0.5) * power);
  }

  drawBackground(ctx, settings.background, W, game.distance, game.time);

  for (const o of obstacles) {
    drawObstacle(ctx, o.x, o.gapY, o.gap, GROUND_Y);
  }

  drawGround(ctx, settings.background, W, game.distance);
  drawParticles(ctx);

  // Во время неуязвимости птица мигает
  const blinking = game.invulnerable > 0 && Math.floor(game.time / 100) % 2 === 0;
  ctx.globalAlpha = blinking ? 0.35 : 1;
  drawBird(ctx, bird, findById(CHARACTER_COLORS, settings.character).color);
  ctx.globalAlpha = 1;

  ctx.restore();
}


/* ---------------------------------------------------------
   11. ЭКРАНЫ И ИНТЕРФЕЙС
   --------------------------------------------------------- */

const screens = {
  menu: document.getElementById('menuScreen'),
  settings: document.getElementById('settingsScreen'),
  pause: document.getElementById('pauseScreen'),
  over: document.getElementById('gameOverScreen')
};

// Показать один экран (или ни одного, если name = null)
function showScreen(name) {
  for (const key in screens) {
    screens[key].classList.toggle('hidden', key !== name);
  }
  // Панель со счётом видна, когда идёт игра
  const inGame = name === null || name === 'pause';
  document.getElementById('hud').classList.toggle('hidden', !inGame);
  document.getElementById('menuBest').textContent = bestScore;
  // Убираем фокус с кнопки, чтобы пробел не «нажимал» её ещё раз
  if (document.activeElement) document.activeElement.blur();
}

function showScore() {
  const el = document.getElementById('score');
  el.textContent = game.score;
  restartAnimation(el, 'pop');
}

const HEART_SVG = '<svg viewBox="0 0 24 24"><path fill="#ff4d6d" stroke="#1b1f3b" stroke-width="1.8" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/><path fill="#fff" opacity=".5" d="M6.5 7.2c-1.4.3-2.2 1.6-2 3 .1.5.8.5.9 0 .2-.9.7-1.6 1.4-1.9.5-.2.3-1.2-.3-1.1z"/></svg>';

function updateHearts() {
  const el = document.getElementById('hearts');
  el.innerHTML = '';
  for (let i = 0; i < settings.lives; i++) {
    const heart = document.createElement('span');
    heart.className = i < game.lives ? 'heart' : 'heart lost';
    heart.innerHTML = HEART_SVG;
    el.appendChild(heart);
  }
}

function showCountdown(value) {
  const el = document.getElementById('countdown');
  el.classList.remove('hidden');
  const isText = typeof value === 'string';
  el.innerHTML = '<span class="' + (isText ? 'go' : '') + '">' + value + '</span>';
  if (!isText) playSound('tick');
  if (isText) setTimeout(hideCountdown, 600);
}

function hideCountdown() {
  document.getElementById('countdown').classList.add('hidden');
}

function showToast(text) {
  const el = document.getElementById('toast');
  el.textContent = text;
  restartAnimation(el, 'show');
}

// Перезапустить CSS-анимацию: убрать класс и добавить снова
function restartAnimation(el, className) {
  el.classList.remove(className);
  void el.offsetWidth; // заставляет браузер «заметить», что класс убран
  el.classList.add(className);
}


/* ---------------------------------------------------------
   12. ЭКРАН НАСТРОЕК
   Кнопки выбора создаются из списков в разделе 1.
   Добавьте в список новый цвет — и появится новая кнопка!
   --------------------------------------------------------- */

// Маленький холст для картинок-превью внутри кнопок
function makeThumb(width, height) {
  const thumb = document.createElement('canvas');
  const ratio = window.devicePixelRatio || 1;
  thumb.width = width * ratio;
  thumb.height = height * ratio;
  thumb.style.width = width + 'px'; // высоту браузер посчитает сам (CSS height: auto)
  const c = thumb.getContext('2d');
  c.scale(ratio, ratio);
  return { canvas: thumb, c: c };
}

// Превью: птица выбранного цвета
function birdPreview(item) {
  const t = makeThumb(52, 44);
  drawBird(t.c, { x: 26, y: 23, r: 14, angle: -0.15, wing: 1, blink: false, dead: false }, item.color);
  return t.canvas;
}

// Превью: квадратик цвета
function colorPreview(item) {
  const dot = document.createElement('div');
  dot.className = 'color-dot';
  dot.style.background = item.color;
  return dot;
}

// Превью: вид препятствия (рисуем той же функцией, что и в игре)
function obstaclePreview(item) {
  const t = makeThumb(84, 64);
  const savedType = settings.obstacleType;
  settings.obstacleType = item.id;
  t.c.fillStyle = '#1b2350';
  t.c.fillRect(0, 0, 84, 64);
  t.c.scale(0.3, 0.3);
  drawObstacle(t.c, 101, 107, 90, 214);
  settings.obstacleType = savedType;
  return t.canvas;
}

// Превью: фон (тот же рисунок, что в игре, только уменьшенный)
function backgroundPreview(item) {
  const t = makeThumb(156, 78);
  t.c.scale(0.13, 0.13);
  drawBackground(t.c, item.id, 1200, 0, 0);
  drawGround(t.c, item.id, 1200, 0);
  return t.canvas;
}

// Создать группу кнопок: список вариантов → кнопки в контейнере
function buildOptions(containerId, items, settingName, makePreview) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option';
    if (settings[settingName] === item.id) button.classList.add('selected');

    if (makePreview) button.appendChild(makePreview(item));
    const label = document.createElement('span');
    label.textContent = item.label;
    button.appendChild(label);

    button.addEventListener('click', () => {
      settings[settingName] = item.id;
      saveSettings();
      buildSettings(); // перерисовать кнопки, чтобы выделить выбранную
    });

    container.appendChild(button);
  }
}

function buildSettings() {
  buildOptions('characterOptions', CHARACTER_COLORS, 'character', birdPreview);
  buildOptions('obstacleTypeOptions', OBSTACLE_TYPES, 'obstacleType', obstaclePreview);
  buildOptions('obstacleColorOptions', OBSTACLE_COLORS, 'obstacleColor', colorPreview);
  buildOptions('backgroundOptions', BACKGROUNDS, 'background', backgroundPreview);
  buildOptions('difficultyOptions', DIFFICULTIES, 'difficulty', null);
  buildOptions('livesOptions', LIVES_CHOICES, 'lives', null);

  document.getElementById('soundToggle').checked = settings.sound;
  document.getElementById('volumeRange').value = Math.round(settings.volume * 100);
  document.getElementById('volumeRange').disabled = !settings.sound;
  document.getElementById('trainingToggle').checked = settings.training;
}

document.getElementById('soundToggle').addEventListener('change', (event) => {
  settings.sound = event.target.checked;
  saveSettings();
  buildSettings();
  playSound('flap');
});

document.getElementById('volumeRange').addEventListener('change', (event) => {
  settings.volume = Number(event.target.value) / 100;
  saveSettings();
  playSound('flap'); // послушать новую громкость
});

document.getElementById('trainingToggle').addEventListener('change', (event) => {
  settings.training = event.target.checked;
  saveSettings();
});

document.getElementById('resetBestButton').addEventListener('click', () => {
  bestScore = 0;
  saveBestScore();
  showToast('Рекорд сброшен');
});


/* ---------------------------------------------------------
   13. УПРАВЛЕНИЕ
   --------------------------------------------------------- */

// Главное действие: пробел, клик или касание
function onAction() {
  if (game.state === 'playing') {
    flap(true);
  } else if (isVisible(screens.menu) || isVisible(screens.over)) {
    startGame(); // в меню и после проигрыша пробел запускает игру
  }
}

function isVisible(el) {
  return !el.classList.contains('hidden');
}

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
    event.preventDefault(); // чтобы страница не прокручивалась
    if (event.repeat) return; // зажатая клавиша не считается
    onAction();
  }
  if (event.code === 'Escape' || event.code === 'KeyP') {
    if (game.state === 'playing') pauseGame();
    else if (game.state === 'paused') resumeGame();
    else if (isVisible(screens.settings)) showScreen('menu');
  }
});

// pointerdown срабатывает сразу и для мыши, и для пальца
canvas.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  if (game.state === 'playing') flap(true);
});

// Кнопки экранов
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('settingsButton').addEventListener('click', () => {
  buildSettings();
  showScreen('settings');
});
document.getElementById('settingsClose').addEventListener('click', () => showScreen('menu'));
document.getElementById('settingsDone').addEventListener('click', () => showScreen('menu'));
document.getElementById('pauseButton').addEventListener('click', pauseGame);
document.getElementById('resumeButton').addEventListener('click', resumeGame);
document.getElementById('pauseMenuButton').addEventListener('click', goToMenu);
document.getElementById('restartButton').addEventListener('click', startGame);
document.getElementById('overMenuButton').addEventListener('click', goToMenu);

// Переключились на другую вкладку — ставим паузу
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseGame();
});

window.addEventListener('resize', resizeGame);


/* ---------------------------------------------------------
   14. ИГРОВОЙ ЦИКЛ И ЗАПУСК
   requestAnimationFrame вызывает loop примерно 60 раз в секунду
   --------------------------------------------------------- */

let lastTime = performance.now();

function loop(now) {
  let dt = now - lastTime; // сколько миллисекунд прошло с прошлого кадра
  lastTime = now;
  if (dt > 50) dt = 50;    // если вкладка «подвисла», не прыгаем далеко вперёд

  const k = dt / (1000 / 60);
  update(k, dt);
  draw();

  requestAnimationFrame(loop);
}

// Название игры из Лаборатории
document.querySelector('.title-top').textContent = LAB.titleTop;
document.querySelector('.title-bottom').textContent = LAB.titleBottom;

resizeGame();
resetGame();
showScreen('menu');
// Шрифты загружаются не сразу — после загрузки обновим превью
document.fonts.ready.then(buildSettings);
requestAnimationFrame(loop);
