/* =========================================================
   SUBWAY SURF — 3D-раннер на JavaScript и библиотеке Three.js
   ---------------------------------------------------------
   Как устроен файл (читайте сверху вниз):
     0. Лаборатория: 10 настроек для экспериментов
     1. Данные: миры, цвета героя, сложность
     2. Настройки игрока и рекорд (сохраняются в браузере)
     3. Звуки
     4. Загрузка Three.js и 3D-сцена (камера, свет, туман)
     5. Состояние игры
     6. Строим мир: дорога и декорации
     7. Герой
     8. Препятствия и монетки
     9. Частицы (взрыв из кубиков)
    10. Игровые действия: полоса, прыжок, монетка, удар
    11. Обновление мира за один кадр
    12. Экраны и интерфейс
    13. Экран настроек
    14. Управление (клавиатура и свайпы)
    15. Игровой цикл и запуск
   ========================================================= */


/* ---------------------------------------------------------
   0. ЛАБОРАТОРИЯ ИГРЫ 🧪
   Поменяй одно значение, и игра изменится!
   Сейчас здесь обычные значения: игра такая, как задумано.
   --------------------------------------------------------- */

const LAB = {
  // 1. Название игры в меню: верхнее и нижнее слово (до 8 букв)
  titleTop: 'Subway',
  titleBottom: 'Surf',

  // 2. Свой цвет героя, например '#FFD84A' (жёлтый).
  //    Пусто '' — своего цвета нет. Цвет появится в «Настройках»
  myHeroColor: '',

  // 3. Гравитация: 1 — обычная, 0.5 — Луна (долгие прыжки), 2 — тяжело
  gravity: 1,

  // 4. Сила прыжка: 1 — обычная, 1.5 — суперпрыжок
  jumpPower: 1,

  // 5. Скорость игры: 1 — обычная, 0.7 — медленнее, 1.5 — турбо
  gameSpeed: 1,

  // 6. Размер героя: 1 — обычный, 1.5 — великан, 0.7 — малыш
  heroSize: 1,

  // 7. Сколько очков даёт одна монетка: 10 — обычно, 1000 — богач
  coinValue: 10,

  // 8. Расстояние между рядами препятствий: 22 — обычно, 35 — реже, 15 — чаще
  obstacleDistance: 22,

  // 9. Магнит для монеток: false — нет, true — монетки сами летят к герою
  coinMagnet: false,

  // 10. Высота камеры: 3.6 — обычно, 8 — вид сверху, 2 — у самой земли
  cameraHeight: 3.6
};


/* ---------------------------------------------------------
   1. ДАННЫЕ: МИРЫ, ЦВЕТА ГЕРОЯ, СЛОЖНОСТЬ
   Цвета в Three.js удобно писать числами: 0xff3fa4 = #ff3fa4
   --------------------------------------------------------- */

const WORLDS = [
  {
    id: 'tokyo',
    label: 'Неоновый Токио',
    emoji: '🌃',
    tagline: 'Ночной мегаполис, неон и мокрый асфальт',
    heroDefault: 'magenta',
    accent: '#ff5fa8',                 // цвет интерфейса
    accent2: '#7a5cff',
    thumb: 'linear-gradient(135deg, #0a0a23, #5a1f6e 60%, #ff3fa4)',
    sky: 0x0a0a23,                     // цвет неба и тумана
    road: 0x24242e,                    // асфальт
    lane: 0xff3fa4,                    // светящаяся разметка
    curb: 0x6b6b78,                    // бордюр
    side: 0x1a1a26,                    // тротуар
    ground: 0x0d0d1c,                  // земля за дорогой
    lightSky: 0x5a46b0,                // свет с неба
    lightGround: 0x120f24,             // свет от земли
    sun: 0x6a8cff,                     // основной свет
    sunPower: 1.1,
    skyPower: 0.8,                     // сила света неба
    exposure: 1.15,                    // общая яркость картинки
    coin: 0xb04dff,                    // монетки-иены
    particle: 0xff3fa4,                // кубики при ударе
    stars: true
  },
  {
    id: 'ruins',
    label: 'Древние руины',
    emoji: '🗿',
    tagline: 'Заброшенный храм в джунглях, солнце и мох',
    heroDefault: 'amber',
    accent: '#ffb84d',
    accent2: '#3e8f3a',
    thumb: 'linear-gradient(135deg, #2d4a22, #6b8f3a 55%, #e8c27a)',
    sky: 0x2d4a22,
    road: 0x9c8664,
    lane: 0x5bd97a,
    curb: 0x6e6452,
    side: 0x564e3e,
    ground: 0x2f4a24,
    lightSky: 0xfff1c0,
    lightGround: 0x3d5a2a,
    sun: 0xffd890,
    sunPower: 1.25,
    skyPower: 0.55,
    exposure: 0.85,
    coin: 0xffcc33,
    particle: 0xc9b48a,
    stars: false
  },
  {
    id: 'space',
    label: 'Космостанция',
    emoji: '🚀',
    tagline: 'Станция среди звёзд, металл и синий свет',
    heroDefault: 'cyan',
    accent: '#4fd6e8',
    accent2: '#3b5bff',
    thumb: 'linear-gradient(135deg, #050510, #16224f 55%, #3fd6ff)',
    sky: 0x050510,
    road: 0x5a6070,
    lane: 0x3fd6ff,
    curb: 0x8a93a6,
    side: 0x2a2f3d,
    ground: 0x0b0d18,
    lightSky: 0x8899ff,
    lightGround: 0x0a0a1a,
    sun: 0xcfe6ff,
    sunPower: 1.2,
    skyPower: 0.6,
    exposure: 1.05,
    coin: 0x3fd6ff,
    particle: 0x3fd6ff,
    stars: true
  }
];

// Цвета героя
const HERO_COLORS = [
  { id: 'cyan',    label: 'Голубой',  color: '#4fd6e8' },
  { id: 'amber',   label: 'Янтарный', color: '#ffb84d' },
  { id: 'magenta', label: 'Розовый',  color: '#ff5fa8' },
  { id: 'green',   label: 'Зелёный',  color: '#5bd97a' },
  { id: 'white',   label: 'Белый',    color: '#f2f5ff' }
];

// Свой цвет из Лаборатории — добавляем в конец списка
if (LAB.myHeroColor) {
  HERO_COLORS.push({ id: 'my', label: 'Мой цвет', color: LAB.myHeroColor });
}

// Сложность. Скорость — в метрах в секунду:
//   speed    — скорость на старте
//   maxSpeed — до какой скорости игра разгоняется
//   accel    — на сколько скорость растёт каждую секунду
const DIFFICULTIES = [
  { id: 'easy',   label: 'Лёгкая',     speed: 11, maxSpeed: 24, accel: 0.25 },
  { id: 'normal', label: 'Нормальная', speed: 14, maxSpeed: 29, accel: 0.35 },
  { id: 'hard',   label: 'Сложная',    speed: 17, maxSpeed: 34, accel: 0.45 }
];

// Найти элемент списка по id (если не нашли — берём первый)
function findById(list, id) {
  return list.find(item => item.id === id) || list[0];
}


/* ---------------------------------------------------------
   2. НАСТРОЙКИ ИГРОКА И РЕКОРД
   localStorage — «память» браузера: данные остаются после перезагрузки
   --------------------------------------------------------- */

const DEFAULT_SETTINGS = {
  world: 'tokyo',
  hero: 'magenta',
  heroTouched: false,   // выбирал ли игрок цвет сам
  difficulty: 'easy',
  sound: true,
  volume: 0.7
};

let settings = loadSettings();
let bestScore = loadBestScore();

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('subway-settings'));
    return Object.assign({}, DEFAULT_SETTINGS, saved);
  } catch (error) {
    return Object.assign({}, DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  try {
    localStorage.setItem('subway-settings', JSON.stringify(settings));
  } catch (error) {
    // Если браузер запретил сохранение — просто играем без него
  }
}

function loadBestScore() {
  try {
    return Number(localStorage.getItem('subway-best')) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore() {
  try {
    localStorage.setItem('subway-best', String(bestScore));
  } catch (error) {
    // ничего страшного
  }
}

function currentWorld() {
  return findById(WORLDS, settings.world);
}

function heroColor() {
  return findById(HERO_COLORS, settings.hero).color;
}

// Текущая сложность с учётом Лаборатории
function difficulty() {
  const d = findById(DIFFICULTIES, settings.difficulty);
  return {
    speed: d.speed * LAB.gameSpeed,
    maxSpeed: d.maxSpeed * LAB.gameSpeed,
    accel: d.accel * LAB.gameSpeed
  };
}


/* ---------------------------------------------------------
   3. ЗВУКИ
   Файлы лежат в папке sound/. В CodePen своей папки нет,
   поэтому там звуки загружаются с сайта игры на GitHub Pages.
   --------------------------------------------------------- */

const isCodePen = location.hostname.includes('codepen') || location.hostname.includes('cdpn.io');
const SOUND_PATH = isCodePen ? 'https://si0683.github.io/SubwaySurf/sound/' : 'sound/';

const SOUND_FILES = {
  jump:  'jump.wav',   // прыжок
  coin:  'coin.mp3',   // монетка
  tick:  'tick.wav',   // обратный отсчёт
  start: 'start.wav',  // старт и ускорение
  crash: 'crash.wav'   // удар
};

// С какой секунды начинать звук: в начале coin.mp3 есть тишина
const SOUND_START = {
  coin: 0.045
};

// Web Audio — «звуковой движок» браузера: играет звук мгновенно
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const sounds = {};

for (const name in SOUND_FILES) {
  fetch(SOUND_PATH + SOUND_FILES[name])
    .then(response => response.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data))
    .then(buffer => { sounds[name] = buffer; })
    .catch(() => {}); // не загрузился — игра идёт без этого звука
}

function playSound(name) {
  if (!settings.sound || !sounds[name]) return;
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
   4. ЗАГРУЗКА THREE.JS И 3D-СЦЕНА
   Three.js — библиотека, которая рисует 3D. Мы загружаем её сами,
   поэтому в HTML (и в CodePen) ничего подключать не нужно.
   --------------------------------------------------------- */

const THREE_URLS = [
  'https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js',
  'https://unpkg.com/three@0.149.0/build/three.min.js'
];

// Загрузить Three.js; если первый адрес не ответил — пробуем второй
function loadThree(onReady, index = 0) {
  if (window.THREE) {
    onReady();
    return;
  }
  const script = document.createElement('script');
  script.src = THREE_URLS[index];
  script.onload = onReady;
  script.onerror = () => {
    if (index + 1 < THREE_URLS.length) loadThree(onReady, index + 1);
  };
  document.head.appendChild(script);
}

const stage = document.getElementById('stage');

// Эти переменные заполнит функция createScene, когда Three.js загрузится
let renderer, scene, camera;
let hemiLight, ambientLight, sunLight;
let stars = null;

function createScene() {
  // Цвета вроде 0xff3fa4 будут выглядеть так же сочно, как на палитре
  THREE.ColorManagement.legacyMode = false;

  // Рендерер — «художник», который превращает 3D-сцену в картинку
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;                  // тени
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; // кинематографичные цвета
  renderer.toneMappingExposure = 1.15;
  renderer.outputEncoding = THREE.sRGBEncoding;
  stage.prepend(renderer.domElement);

  scene = new THREE.Scene();

  // Камера: угол обзора 60°, видит от 0.1 до 300 метров
  camera = new THREE.PerspectiveCamera(60, 1, 0.1, 300);

  // Свет: небо + общий + «солнце», которое отбрасывает тени
  hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 0.9);
  ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
  sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
  sunLight.position.set(6, 16, 8);
  sunLight.target.position.set(0, 0, -10);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  // Область, где считаются тени: вокруг героя
  sunLight.shadow.camera.left = -14;
  sunLight.shadow.camera.right = 14;
  sunLight.shadow.camera.top = 20;
  sunLight.shadow.camera.bottom = -20;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 60;
  scene.add(hemiLight, ambientLight, sunLight, sunLight.target);

  resizeGame();
}

function resizeGame() {
  if (!renderer) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  // На узком экране телефона расширяем обзор, чтобы были видны все 3 полосы
  camera.fov = camera.aspect < 1 ? 78 : 60;
  camera.updateProjectionMatrix();
}


/* ---------------------------------------------------------
   5. СОСТОЯНИЕ ИГРЫ
   --------------------------------------------------------- */

// В каком состоянии игра:
//   'loading'   — Three.js ещё загружается
//   'menu'      — меню (герой бежит на месте, мир едет)
//   'countdown' — отсчёт 3-2-1
//   'playing'   — играем
//   'paused'    — пауза
//   'crashed'   — врезались, летят кубики
//   'over'      — экран «Игра окончена»
const game = {
  state: 'loading',
  speed: 0,          // текущая скорость (метров в секунду)
  distance: 0,       // сколько пробежали
  coins: 0,          // сколько собрали монеток
  score: 0,
  time: 0,           // секунды с запуска — для анимаций
  rowTimer: 0,       // сколько метров до следующего ряда препятствий
  speedLevel: 0,     // для надписи «Быстрее!»
  crashTimer: 0,
  shake: 0,          // тряска камеры
  recordShown: false
};

const LANE_WIDTH = 2.4;            // ширина одной полосы
const SEGMENT_LENGTH = 24;         // длина одного куска дороги
const SEGMENT_COUNT = 8;           // сколько кусков дороги одновременно
const SPAWN_Z = -150;              // где появляются препятствия (далеко впереди)
const REMOVE_Z = 12;               // где они исчезают (за камерой)
const PLAYER_BASE_Y = 0;           // высота земли под ногами героя
const GRAVITY = 26 * LAB.gravity;  // сила тяжести
const JUMP_SPEED = 9.5 * LAB.jumpPower;

// Полосы: -1 — левая, 0 — средняя, 1 — правая
function laneX(lane) {
  return lane * LANE_WIDTH;
}


/* ---------------------------------------------------------
   6. СТРОИМ МИР: ДОРОГА И ДЕКОРАЦИИ
   Дорога — 8 кусков. Когда кусок уезжает за камеру, мы переносим
   его далеко вперёд (это называется «рециклинг»). Так дорога
   бесконечная, хотя кусков всего 8.
   --------------------------------------------------------- */

let worldGroup = null;   // всё, что едет навстречу герою
let segments = [];       // куски дороги
let mats = {};           // материалы (краски) текущего мира
let geo = {};            // общие формы, чтобы не создавать их заново

// Материал: цвет + свечение. emissive — «свечение изнутри»
function makeMat(color, options = {}) {
  return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.7 }, options));
}

function glowMat(color, power = 1) {
  // Сам цвет чёрный, светится только emissive. toneMapped: false — неон не выгорает в белый
  return new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: power, toneMapped: false });
}

function box(width, height, depth, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  return mesh;
}

// Случайное число от min до max
function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Построить весь мир заново (при запуске и при смене мира)
function buildWorld() {
  if (worldGroup) scene.remove(worldGroup);
  worldGroup = new THREE.Group();
  scene.add(worldGroup);
  segments = [];
  obstacles = [];
  coins = [];
  particles = [];

  const w = currentWorld();

  // Небо, туман и свет под цвет мира
  scene.background = new THREE.Color(w.sky);
  scene.fog = new THREE.Fog(w.sky, 30, 150);
  hemiLight.color.setHex(w.lightSky);
  hemiLight.groundColor.setHex(w.lightGround);
  sunLight.color.setHex(w.sun);
  sunLight.intensity = w.sunPower;
  hemiLight.intensity = w.skyPower;
  ambientLight.intensity = w.skyPower * 0.2;
  renderer.toneMappingExposure = w.exposure;
  document.documentElement.style.setProperty('--accent', w.accent);
  document.documentElement.style.setProperty('--accent-2', w.accent2);
  document.getElementById('worldTagline').textContent = w.emoji + ' ' + w.tagline;

  // Материалы мира
  mats = {
    road: makeMat(w.road, { roughness: w.id === 'tokyo' ? 0.25 : 0.8, metalness: w.id === 'ruins' ? 0 : 0.45 }),
    lane: glowMat(w.lane),
    curb: makeMat(w.curb),
    side: makeMat(w.side, { roughness: 0.9 }),
    ground: makeMat(w.ground, { roughness: 1 }),
    coin: new THREE.MeshStandardMaterial({ color: w.coin, emissive: w.coin, emissiveIntensity: 0.55, metalness: 0.7, roughness: 0.25 }),
    particle: glowMat(w.particle)
  };
  Object.assign(mats, worldMaterials(w.id));

  // Общие формы
  geo = {
    coin: w.id === 'space'
      ? new THREE.SphereGeometry(0.36, 20, 16)
      : new THREE.CylinderGeometry(0.45, 0.45, 0.1, 24),
    cube: new THREE.BoxGeometry(1, 1, 1)
  };

  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const segment = createSegment();
    segment.position.z = 12 - i * SEGMENT_LENGTH;
    worldGroup.add(segment);
    segments.push(segment);
  }

  // Звёзды на небе (для ночных миров)
  if (stars) scene.remove(stars);
  stars = null;
  if (w.stars) {
    const points = [];
    for (let i = 0; i < 700; i++) {
      points.push(rand(-200, 200), rand(15, 140), rand(-260, -120));
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, fog: false }));
    scene.add(stars);
  }
}

// Особые материалы для декораций каждого мира
function worldMaterials(id) {
  if (id === 'tokyo') {
    return {
      building: makeMat(0x17172b, { roughness: 0.6, metalness: 0.3 }),
      building2: makeMat(0x221c3a, { roughness: 0.6, metalness: 0.3 }),
      neon: [glowMat(0xff3fa4), glowMat(0x7a5cff), glowMat(0x3fa9ff)],
      window: glowMat(0xffd27a, 0.7),
      pole: makeMat(0x3a3a48, { metalness: 0.6 }),
      lantern: glowMat(0xff4a4a),
      obstacle: makeMat(0x1b1b2e, { metalness: 0.5, roughness: 0.4 }),
      obstacleGlow: glowMat(0xff3fa4),
      obstacleGlow2: glowMat(0x7a5cff)
    };
  }
  if (id === 'ruins') {
    return {
      stone: makeMat(0x8f8266, { roughness: 0.95 }),
      stoneDark: makeMat(0x7d7260, { roughness: 0.95 }),
      moss: makeMat(0x3e8f3a, { roughness: 1 }),
      leaf: makeMat(0x2f7a32, { roughness: 1 }),
      trunk: makeMat(0x6b4a2a, { roughness: 1 }),
      rune: glowMat(0x2ee6a0),
      rune2: glowMat(0xff8a2a),
      fire: glowMat(0xff8a2a),
      wood: makeMat(0x7a5a32, { roughness: 0.8 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xffcc33, emissive: 0x6b4a00, metalness: 0.9, roughness: 0.3 })
    };
  }
  return {
    metal: makeMat(0x8a93a6, { metalness: 0.8, roughness: 0.35 }),
    metalDark: makeMat(0x3a4152, { metalness: 0.8, roughness: 0.4 }),
    panel: new THREE.MeshStandardMaterial({ color: 0x14224f, emissive: 0x0d2a7a, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.3 }),
    blue: glowMat(0x3fd6ff),
    red: glowMat(0xff3b3b),
    hazard: makeMat(0xf2c12e, { roughness: 0.6 }),
    black: makeMat(0x15151a)
  };
}

// Один кусок дороги: асфальт, разметка, бордюры, тротуары, земля
function createSegment() {
  const segment = new THREE.Group();
  const roadWidth = LANE_WIDTH * 3;

  const road = box(roadWidth, 0.2, SEGMENT_LENGTH, mats.road);
  road.position.y = -0.1;
  road.receiveShadow = true;
  segment.add(road);

  // Светящиеся пунктиры между полосами
  for (const x of [-LANE_WIDTH / 2, LANE_WIDTH / 2]) {
    for (let z = -SEGMENT_LENGTH / 2 + 2; z < SEGMENT_LENGTH / 2; z += 6) {
      const dash = box(0.12, 0.03, 3, mats.lane);
      dash.position.set(x, 0.01, z);
      segment.add(dash);
    }
  }

  // Бордюры, тротуары и земля по бокам
  for (const sideSign of [-1, 1]) {
    const curb = box(0.4, 0.3, SEGMENT_LENGTH, mats.curb);
    curb.position.set(sideSign * (roadWidth / 2 + 0.2), 0.05, 0);
    curb.receiveShadow = true;
    segment.add(curb);

    const walk = box(3, 0.25, SEGMENT_LENGTH, mats.side);
    walk.position.set(sideSign * (roadWidth / 2 + 1.9), 0.02, 0);
    walk.receiveShadow = true;
    segment.add(walk);

    const ground = box(40, 0.1, SEGMENT_LENGTH, mats.ground);
    ground.position.set(sideSign * (roadWidth / 2 + 23), -0.1, 0);
    segment.add(ground);
  }

  segment.userData.decor = null;
  fillDecor(segment);
  return segment;
}

// Декорации куска дороги (каждый раз новые — так мир не повторяется)
function fillDecor(segment) {
  if (segment.userData.decor) segment.remove(segment.userData.decor);
  const decor = new THREE.Group();
  const id = currentWorld().id;
  for (const sideSign of [-1, 1]) {
    if (id === 'tokyo') decorTokyo(decor, sideSign);
    else if (id === 'ruins') decorRuins(decor, sideSign);
    else decorSpace(decor, sideSign);
  }
  segment.add(decor);
  segment.userData.decor = decor;
}

// Токио: небоскрёбы с неоновыми вывесками, фонари
function decorTokyo(decor, s) {
  let z = -SEGMENT_LENGTH / 2;
  while (z < SEGMENT_LENGTH / 2) {
    const width = rand(4, 7);
    const depth = rand(4, 7);
    const height = rand(10, 42);
    const x = s * (9 + width / 2 + rand(0, 3));
    const building = box(width, height, depth, Math.random() < 0.5 ? mats.building : mats.building2);
    building.position.set(x, height / 2, z + depth / 2);
    decor.add(building);

    // Вертикальная неоновая вывеска на стене к дороге
    const signHeight = rand(3, Math.min(10, height - 2));
    const sign = box(0.25, signHeight, rand(0.8, 1.6), pick(mats.neon));
    sign.position.set(x - s * (width / 2 + 0.15), rand(4, height - signHeight / 2), z + depth / 2);
    decor.add(sign);

    // Светящиеся полосы окон
    for (let i = 0; i < 3; i++) {
      const strip = box(0.1, 0.35, depth * 0.8, mats.window);
      strip.position.set(x - s * (width / 2 + 0.05), rand(2, height - 1), z + depth / 2);
      decor.add(strip);
    }
    z += depth + rand(0.5, 2);
  }

  // Фонарь у дороги
  const pole = box(0.15, 4, 0.15, mats.pole);
  pole.position.set(s * 6.4, 2, 0);
  decor.add(pole);
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), mats.lantern);
  lantern.position.set(s * 6.4, 4.2, 0);
  decor.add(lantern);
}

// Руины: колонны, пирамиды, деревья, факелы
function decorRuins(decor, s) {
  for (let i = 0; i < 2; i++) {
    const height = rand(3, 9);
    const radius = rand(0.5, 0.9);
    const column = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.1, height, 10), mats.stone);
    column.position.set(s * rand(7, 10), height / 2, rand(-10, 10));
    column.castShadow = true;
    decor.add(column);

    // Мох на верхушке и светящаяся руна
    const moss = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.05, radius * 1.05, 0.3, 10), mats.moss);
    moss.position.set(column.position.x, height, column.position.z);
    decor.add(moss);
    const rune = box(0.1, 0.6, 0.4, Math.random() < 0.5 ? mats.rune : mats.rune2);
    rune.position.set(column.position.x - s * (radius + 0.02), height * 0.5, column.position.z);
    decor.add(rune);
  }

  // Ступенчатая пирамида вдалеке
  if (Math.random() < 0.5) {
    const size = rand(8, 14);
    for (let step = 0; step < 4; step++) {
      const part = box(size - step * 2.4, 2, size - step * 2.4, mats.stoneDark);
      part.position.set(s * (size / 2 + 14), 1 + step * 2, rand(-4, 4));
      decor.add(part);
    }
  }

  // Деревья джунглей
  for (let i = 0; i < 2; i++) {
    const x = s * rand(11, 20);
    const z = rand(-11, 11);
    const trunk = box(0.4, 5, 0.4, mats.trunk);
    trunk.position.set(x, 2.5, z);
    decor.add(trunk);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(rand(1.8, 2.6), rand(4, 6), 7), mats.leaf);
    crown.position.set(x, 6.5, z);
    decor.add(crown);
  }

  // Факел у дороги
  const torch = box(0.15, 2.2, 0.15, mats.wood);
  torch.position.set(s * 6.2, 1.1, 0);
  decor.add(torch);
  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 8), mats.fire);
  fire.position.set(s * 6.2, 2.5, 0);
  decor.add(fire);
}

// Космостанция: отсеки, солнечные батареи, антенны, лазерные стойки
function decorSpace(decor, s) {
  const length = rand(8, 14);
  const module = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, length, 16), mats.metal);
  module.rotation.x = Math.PI / 2;
  module.position.set(s * rand(10, 13), rand(2, 6), rand(-6, 6));
  decor.add(module);

  // Иллюминаторы
  for (let i = 0; i < 3; i++) {
    const porthole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 12), Math.random() < 0.8 ? mats.blue : mats.red);
    porthole.rotation.z = Math.PI / 2;
    porthole.position.set(module.position.x - s * 2.2, module.position.y, module.position.z - length / 2 + (i + 1) * length / 4);
    decor.add(porthole);
  }

  // Солнечная батарея
  const panel = box(0.2, rand(3, 6), rand(6, 10), mats.panel);
  panel.position.set(s * rand(17, 22), rand(4, 9), rand(-6, 6));
  panel.rotation.z = s * 0.3;
  decor.add(panel);

  // Антенна с мигающим огоньком
  const antenna = box(0.1, 6, 0.1, mats.metalDark);
  antenna.position.set(module.position.x, module.position.y + 5, module.position.z);
  decor.add(antenna);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mats.red);
  light.position.set(module.position.x, module.position.y + 8, module.position.z);
  decor.add(light);

  // Лазерная стойка у дороги
  const post = box(0.25, 3, 0.25, mats.metalDark);
  post.position.set(s * 6.3, 1.5, 0);
  decor.add(post);
  const beam = box(0.08, 2.6, 0.08, mats.blue);
  beam.position.set(s * 6.0, 1.5, 0);
  decor.add(beam);
}


/* ---------------------------------------------------------
   7. ГЕРОЙ — человечек из простых фигур
   Ноги и руки вращаются вокруг «шарниров» (бёдер и плеч)
   --------------------------------------------------------- */

const hero = {
  group: null,
  legs: [],
  arms: [],
  bodyMat: null,
  lane: 0,            // текущая полоса
  x: 0,
  y: PLAYER_BASE_Y,
  vy: 0,              // скорость по вертикали
  isJumping: false,
  runPhase: 0         // фаза бега для анимации ног
};

function createHero() {
  const color = new THREE.Color(heroColor());
  hero.bodyMat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.18, roughness: 0.45 });
  const dark = makeMat(0x1f2233, { roughness: 0.6 });
  const skin = makeMat(0xffd2b0, { roughness: 0.8 });
  const white = makeMat(0xf2f5ff);

  const group = new THREE.Group();

  // Туловище и голова
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.5, 6, 12), hero.bodyMat);
  torso.position.y = 1.2;
  group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12), skin);
  head.position.y = 1.82;
  group.add(head);

  // Кепка с козырьком (козырёк смотрит вперёд, от камеры)
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), hero.bodyMat);
  cap.position.y = 1.86;
  group.add(cap);
  const visor = box(0.36, 0.05, 0.26, hero.bodyMat);
  visor.position.set(0, 1.88, -0.3);
  group.add(visor);

  // Рюкзак — его видно со спины
  const backpack = box(0.46, 0.5, 0.22, dark);
  backpack.position.set(0, 1.25, 0.3);
  group.add(backpack);

  // Ноги: шарнир в бедре, нога висит вниз
  hero.legs = [];
  for (const x of [-0.15, 0.15]) {
    const hip = new THREE.Group();
    hip.position.set(x, 0.8, 0);
    const leg = box(0.2, 0.7, 0.22, dark);
    leg.position.y = -0.35;
    const shoe = box(0.22, 0.12, 0.34, white);
    shoe.position.set(0, -0.74, -0.05);
    hip.add(leg, shoe);
    group.add(hip);
    hero.legs.push(hip);
  }

  // Руки: шарнир в плече
  hero.arms = [];
  for (const x of [-0.42, 0.42]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(x, 1.48, 0);
    const arm = box(0.15, 0.58, 0.17, hero.bodyMat);
    arm.position.y = -0.29;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), skin);
    hand.position.y = -0.62;
    shoulder.add(arm, hand);
    group.add(shoulder);
    hero.arms.push(shoulder);
  }

  group.traverse(part => { part.castShadow = true; });
  group.scale.setScalar(LAB.heroSize);

  if (hero.group) scene.remove(hero.group);
  hero.group = group;
  scene.add(group);
}

function updateHeroColor() {
  if (!hero.bodyMat) return;
  hero.bodyMat.color.set(heroColor());
  hero.bodyMat.emissive.set(heroColor());
}

// Анимация бега: ноги и руки качаются в разные стороны
function animateHero(dt, running) {
  const g = hero.group;
  if (!g) return;

  if (hero.isJumping) {
    // В прыжке ноги поджаты, руки вверх
    hero.legs[0].rotation.x = -0.7;
    hero.legs[1].rotation.x = 0.4;
    hero.arms[0].rotation.x = -2.4;
    hero.arms[1].rotation.x = -2.4;
  } else if (running) {
    hero.runPhase += dt * (8 + game.speed * 0.4);
    const swing = Math.sin(hero.runPhase);
    hero.legs[0].rotation.x = swing * 0.9;
    hero.legs[1].rotation.x = -swing * 0.9;
    hero.arms[0].rotation.x = -swing * 0.8;
    hero.arms[1].rotation.x = swing * 0.8;
  }

  // Плавное перестроение на нужную полосу с наклоном
  const targetX = laneX(hero.lane);
  hero.x += (targetX - hero.x) * Math.min(1, dt * 12);
  g.rotation.z = (hero.x - targetX) * 0.12;

  const bob = running && !hero.isJumping ? Math.abs(Math.sin(hero.runPhase)) * 0.08 : 0;
  g.position.set(hero.x, hero.y + bob, 0);
}


/* ---------------------------------------------------------
   8. ПРЕПЯТСТВИЯ И МОНЕТКИ
   Низкое препятствие можно перепрыгнуть, высокое — только обежать
   --------------------------------------------------------- */

let obstacles = [];  // { mesh, lane, low, height, depth }
let coins = [];      // { mesh, lane }

const LOW_HEIGHT = 0.95;
const HIGH_HEIGHT = 2.8;

// Сделать препятствие в стиле текущего мира
function makeObstacleMesh(low) {
  const id = currentWorld().id;
  const g = new THREE.Group();
  const width = LANE_WIDTH * 0.82;

  if (id === 'tokyo') {
    if (low) {
      // Кибер-барьер со светящейся полосой
      const base = box(width, LOW_HEIGHT, 0.4, mats.obstacle);
      base.position.y = LOW_HEIGHT / 2;
      const stripe = box(width + 0.02, 0.14, 0.42, mats.obstacleGlow);
      stripe.position.y = LOW_HEIGHT * 0.7;
      g.add(base, stripe);
    } else {
      // Высокие кибер-ворота
      const wall = box(width, HIGH_HEIGHT, 0.5, mats.obstacle);
      wall.position.y = HIGH_HEIGHT / 2;
      g.add(wall);
      for (const y of [0.4, 1.4, 2.4]) {
        const line = box(width + 0.02, 0.1, 0.52, mats.obstacleGlow2);
        line.position.y = y;
        g.add(line);
      }
    }
  } else if (id === 'ruins') {
    if (low) {
      // Упавшая колонна, лежит поперёк полосы
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, width, 12), mats.stone);
      column.rotation.z = Math.PI / 2;
      column.position.y = 0.45;
      const moss = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.3, 12), mats.moss);
      moss.rotation.z = Math.PI / 2;
      moss.position.set(width * 0.25, 0.45, 0);
      g.add(column, moss);
    } else {
      // Огромный сундук с золотой окантовкой
      const chest = box(width, HIGH_HEIGHT, 1.2, mats.wood);
      chest.position.y = HIGH_HEIGHT / 2;
      g.add(chest);
      for (const y of [0.3, HIGH_HEIGHT - 0.3]) {
        const band = box(width + 0.04, 0.16, 1.24, mats.gold);
        band.position.y = y;
        g.add(band);
      }
      const rune = box(0.5, 0.5, 0.05, mats.rune2);
      rune.position.set(0, HIGH_HEIGHT * 0.6, 0.62);
      g.add(rune);
    }
  } else {
    if (low) {
      // Лазерная перегородка: две стойки и красные лучи
      for (const x of [-width / 2, width / 2]) {
        const post = box(0.2, LOW_HEIGHT + 0.1, 0.2, mats.metalDark);
        post.position.set(x, (LOW_HEIGHT + 0.1) / 2, 0);
        g.add(post);
      }
      for (const y of [0.35, 0.75]) {
        const beam = box(width, 0.08, 0.08, mats.red);
        beam.position.y = y;
        g.add(beam);
      }
    } else {
      // Ящик с биоопасностью: жёлтый с чёрными полосами
      const crate = box(width, HIGH_HEIGHT, 1.4, mats.hazard);
      crate.position.y = HIGH_HEIGHT / 2;
      g.add(crate);
      for (let i = 0; i < 3; i++) {
        const stripe = box(width + 0.02, 0.22, 1.42, mats.black);
        stripe.position.y = 0.5 + i * 0.9;
        g.add(stripe);
      }
      const lamp = box(0.5, 0.15, 0.5, mats.blue);
      lamp.position.y = HIGH_HEIGHT + 0.08;
      g.add(lamp);
    }
  }

  g.traverse(part => { part.castShadow = true; });
  return g;
}

function addObstacle(lane, low, z) {
  const mesh = makeObstacleMesh(low);
  mesh.position.set(laneX(lane), 0, z);
  worldGroup.add(mesh);
  obstacles.push({
    mesh: mesh,
    lane: lane,
    low: low,
    height: low ? LOW_HEIGHT : HIGH_HEIGHT,
    depth: low ? 0.9 : 1.4
  });
}

function addCoin(lane, z, y = 1) {
  const mesh = new THREE.Mesh(geo.coin, mats.coin);
  if (currentWorld().id !== 'space') mesh.rotation.x = Math.PI / 2; // монетка стоит «на ребре»
  mesh.position.set(laneX(lane), y, z);
  mesh.castShadow = true;
  worldGroup.add(mesh);
  coins.push({ mesh: mesh, lane: lane });
}

// Ряд препятствий. Всегда остаётся хотя бы одна свободная полоса
function spawnRow(z) {
  const lanes = [-1, 0, 1].sort(() => Math.random() - 0.5);
  // Первые 300 метров — по одному препятствию, потом иногда по два
  const count = game.distance > 300 && Math.random() < 0.45 ? 2 : 1;

  for (let i = 0; i < count; i++) {
    addObstacle(lanes[i], Math.random() < 0.55, z);
  }

  // Дорожка из 5 монеток на свободной полосе, между рядами
  const freeLane = lanes[count];
  const gap = LAB.obstacleDistance;
  for (let i = 0; i < 5; i++) {
    addCoin(freeLane, z + gap * 0.3 + i * 2.4);
  }
}

// Подвинуть всё навстречу герою на distance метров
function moveWorld(distance) {
  for (const segment of segments) {
    segment.position.z += distance;
    // Кусок уехал за камеру — переносим его вперёд с новыми декорациями
    if (segment.position.z - SEGMENT_LENGTH / 2 > REMOVE_Z) {
      segment.position.z -= SEGMENT_COUNT * SEGMENT_LENGTH;
      fillDecor(segment);
    }
  }

  for (const o of obstacles) o.mesh.position.z += distance;
  for (const c of coins) c.mesh.position.z += distance;

  // Убираем то, что уехало за камеру
  obstacles = obstacles.filter(o => {
    if (o.mesh.position.z > REMOVE_Z) {
      worldGroup.remove(o.mesh);
      return false;
    }
    return true;
  });
  coins = coins.filter(c => {
    if (c.mesh.position.z > REMOVE_Z) {
      worldGroup.remove(c.mesh);
      return false;
    }
    return true;
  });
}


/* ---------------------------------------------------------
   9. ЧАСТИЦЫ — взрыв из разлетающихся кубиков с гравитацией
   --------------------------------------------------------- */

let particles = [];

function burst(x, y, z, count, material, power) {
  for (let i = 0; i < count; i++) {
    const size = rand(0.12, 0.3);
    const mesh = new THREE.Mesh(geo.cube, material);
    mesh.scale.setScalar(size);
    mesh.position.set(x, y, z);
    worldGroup.add(mesh);
    particles.push({
      mesh: mesh,
      vx: rand(-1, 1) * power,
      vy: rand(0.4, 1.4) * power,
      vz: rand(-1, 1) * power,
      spin: rand(-8, 8),
      life: rand(1, 1.8)
    });
  }
}

function updateParticles(dt) {
  for (const p of particles) {
    p.vy -= 18 * dt; // гравитация
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    if (p.mesh.position.y < 0.1) {
      p.mesh.position.y = 0.1;
      p.vy *= -0.4; // отскок от земли
    }
    p.mesh.rotation.x += p.spin * dt;
    p.mesh.rotation.y += p.spin * dt;
    p.life -= dt;
  }
  particles = particles.filter(p => {
    if (p.life <= 0) {
      worldGroup.remove(p.mesh);
      return false;
    }
    return true;
  });
}


/* ---------------------------------------------------------
   10. ИГРОВЫЕ ДЕЙСТВИЯ
   --------------------------------------------------------- */

function changeLane(direction) {
  if (game.state !== 'playing') return;
  hero.lane = Math.max(-1, Math.min(1, hero.lane + direction));
}

function jump() {
  if (game.state !== 'playing' || hero.isJumping) return;
  hero.vy = JUMP_SPEED;
  hero.isJumping = true;
  playSound('jump');
}

function collectCoin(c) {
  worldGroup.remove(c.mesh);
  game.coins++;
  burst(c.mesh.position.x, c.mesh.position.y, c.mesh.position.z, 5, mats.coin, 3);
  playSound('coin');
  const el = document.getElementById('coins');
  el.textContent = game.coins;
  restartAnimation(el, 'pop');
}

// Врезались: кубики, звук, тряска — и конец игры
function crash() {
  game.state = 'crashed';
  game.crashTimer = 1.2;
  game.shake = 0.5;
  playSound('crash');
  burst(hero.x, 1, 0, 40, mats.particle, 7);
  burst(hero.x, 1, 0, 12, hero.bodyMat, 6);
  hero.group.rotation.x = 1.2; // герой падает назад
  hero.group.position.y = 0.3;
}

function showResults() {
  game.state = 'over';
  const isRecord = game.score > bestScore;
  if (isRecord) {
    bestScore = game.score;
    saveBestScore();
  }
  document.getElementById('overTitle').textContent = LAB.titleTop + ' ' + LAB.titleBottom;
  document.getElementById('finalScore').textContent = game.score;
  document.getElementById('finalCoins').textContent = game.coins;
  document.getElementById('finalBest').textContent = bestScore;
  document.getElementById('newRecord').classList.toggle('hidden', !isRecord || game.score === 0);
  showScreen('over');
}

// Подготовить новый забег
function resetGame() {
  game.speed = difficulty().speed;
  game.distance = 0;
  game.coins = 0;
  game.score = 0;
  game.speedLevel = 0;
  game.shake = 0;
  game.recordShown = false;
  hero.lane = 0;
  hero.x = 0;
  hero.y = PLAYER_BASE_Y;
  hero.vy = 0;
  hero.isJumping = false;
  if (hero.group) hero.group.rotation.set(0, 0, 0);

  for (const o of obstacles) worldGroup.remove(o.mesh);
  for (const c of coins) worldGroup.remove(c.mesh);
  for (const p of particles) worldGroup.remove(p.mesh);
  obstacles = [];
  coins = [];
  particles = [];
  updateHud();
}

// Заранее расставляем ряды впереди, чтобы не ждать первое препятствие
function prefillRows() {
  let z = -45;
  while (z > SPAWN_Z) {
    spawnRow(z);
    z -= LAB.obstacleDistance;
  }
  // Следующий ряд «стоит» в точке z — он появится, когда доедет до SPAWN_Z
  game.rowTimer = SPAWN_Z - z;
}

let countdownTimer = null;

// Кнопка «Начать»: отсчёт 3-2-1, потом забег
function startGame() {
  if (!renderer) return; // Three.js ещё не загрузился
  if (audioContext.state === 'suspended') audioContext.resume();
  resetGame();
  prefillRows();
  showScreen(null);
  game.state = 'countdown';

  let number = 3;
  showCountdown(number);
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    number--;
    if (number > 0) {
      showCountdown(number);
    } else {
      clearInterval(countdownTimer);
      showCountdown('Вперёд!');
      game.state = 'playing';
      playSound('start');
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
   11. ОБНОВЛЕНИЕ МИРА ЗА ОДИН КАДР
   dt — сколько секунд прошло с прошлого кадра. Всё движение
   умножаем на dt, поэтому скорость одинакова на любом компьютере.
   --------------------------------------------------------- */

function update(dt) {
  game.time += dt;
  animateMaterials();

  if (game.state === 'menu') {
    moveWorld(8 * LAB.gameSpeed * dt);
    animateHero(dt, true);
  } else if (game.state === 'countdown') {
    moveWorld(3 * dt);
    animateHero(dt, true);
  } else if (game.state === 'playing') {
    updatePlaying(dt);
  } else if (game.state === 'crashed') {
    game.crashTimer -= dt;
    if (game.crashTimer <= 0) showResults();
  }

  if (game.state !== 'paused') {
    updateParticles(dt);
    spinCoins(dt);
  }
  updateCamera(dt);
}

function updatePlaying(dt) {
  const d = difficulty();

  // Скорость плавно растёт до предела
  game.speed = Math.min(d.maxSpeed, game.speed + d.accel * dt);
  const level = Math.floor((game.speed - d.speed) / (3 * LAB.gameSpeed));
  if (level > game.speedLevel) {
    game.speedLevel = level;
    showToast('Быстрее! 🚀');
    playSound('start');
  }

  const step = game.speed * dt;
  game.distance += step;
  moveWorld(step);

  // Новые ряды препятствий далеко впереди
  game.rowTimer -= step;
  if (game.rowTimer <= 0) {
    spawnRow(SPAWN_Z);
    game.rowTimer += LAB.obstacleDistance;
  }

  // Прыжок: скорость вверх уменьшается гравитацией
  if (hero.isJumping) {
    hero.vy -= GRAVITY * dt;
    hero.y += hero.vy * dt;
    // Приземление
    if (hero.y <= PLAYER_BASE_Y) {
      hero.y = PLAYER_BASE_Y;
      hero.vy = 0;
      hero.isJumping = false;
    }
  }
  animateHero(dt, true);

  checkObstacles();
  checkCoins(dt);

  game.score = Math.floor(game.distance) + game.coins * LAB.coinValue;
  if (!game.recordShown && bestScore > 0 && game.score > bestScore) {
    game.recordShown = true;
    showToast('Новый рекорд! 🏆');
  }
  updateHud();
}

// Столкновение: та же полоса, препятствие рядом и герой не перепрыгнул его
function checkObstacles() {
  const halfWidth = 0.45 * LAB.heroSize;
  for (const o of obstacles) {
    const z = o.mesh.position.z;
    const sameLane = Math.abs(hero.x - laneX(o.lane)) < LANE_WIDTH * 0.41 + halfWidth;
    const near = Math.abs(z) < o.depth / 2 + 0.3;
    const tooLow = hero.y < o.height - 0.05;
    if (sameLane && near && tooLow) {
      crash();
      return;
    }
  }
}

function checkCoins(dt) {
  coins = coins.filter(c => {
    const pos = c.mesh.position;

    // Магнит из Лаборатории: близкие монетки летят к герою
    if (LAB.coinMagnet && pos.z > -12 && pos.z < 2) {
      pos.x += (hero.x - pos.x) * Math.min(1, dt * 8);
      pos.y += (hero.y + 1 - pos.y) * Math.min(1, dt * 8);
    }

    const close = Math.abs(pos.x - hero.x) < 0.9 && Math.abs(pos.z) < 0.9 && Math.abs(pos.y - (hero.y + 1)) < 1.3;
    if (close) {
      collectCoin(c);
      return false;
    }
    return true;
  });
}

// Монетки крутятся вокруг своей оси
function spinCoins(dt) {
  for (const c of coins) {
    if (currentWorld().id === 'space') c.mesh.position.y = 1 + Math.sin(game.time * 3 + c.mesh.position.z) * 0.15;
    else c.mesh.rotation.z += dt * 3;
  }
}

// Мерцание неона, огня и огоньков
function animateMaterials() {
  const t = game.time;
  if (mats.fire) mats.fire.emissiveIntensity = 0.85 + Math.sin(t * 17) * 0.1 + Math.sin(t * 7) * 0.08;
  if (mats.red) mats.red.emissiveIntensity = 0.6 + Math.sin(t * 4) * 0.4;
  if (mats.lane) mats.lane.emissiveIntensity = 0.85 + Math.sin(t * 2) * 0.15;
}

// Камера плавно следует за героем сзади и сверху
function updateCamera(dt) {
  if (!camera) return;
  const targetX = hero.x * 0.6;
  camera.position.x += (targetX - camera.position.x) * Math.min(1, dt * 5);
  camera.position.y += (LAB.cameraHeight + hero.y * 0.3 - camera.position.y) * Math.min(1, dt * 5);
  camera.position.z = 7.5;

  // Тряска после удара
  if (game.shake > 0) {
    game.shake -= dt;
    camera.position.x += rand(-0.15, 0.15);
    camera.position.y += rand(-0.15, 0.15);
  }
  camera.lookAt(hero.x * 0.4, 1.2, -8);
}


/* ---------------------------------------------------------
   12. ЭКРАНЫ И ИНТЕРФЕЙС
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
  const inGame = name === null || name === 'pause';
  document.getElementById('hud').classList.toggle('hidden', !inGame);
  document.getElementById('menuBest').textContent = bestScore;
  // Убираем фокус с кнопки, чтобы пробел не «нажимал» её ещё раз
  if (document.activeElement) document.activeElement.blur();
}

function isVisible(el) {
  return !el.classList.contains('hidden');
}

function updateHud() {
  document.getElementById('score').textContent = game.score;
  document.getElementById('coins').textContent = game.coins;
  // Метры в секунду → километры в час
  document.getElementById('speed').textContent = Math.round(game.speed * 3.6);
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
   13. ЭКРАН НАСТРОЕК
   Кнопки создаются из списков в разделе 1
   --------------------------------------------------------- */

function worldPreview(item) {
  const thumb = document.createElement('div');
  thumb.className = 'world-thumb';
  thumb.style.background = item.thumb;
  thumb.textContent = item.emoji;
  return thumb;
}

function colorPreview(item) {
  const dot = document.createElement('div');
  dot.className = 'color-dot';
  dot.style.background = item.color;
  dot.style.color = item.color; // для свечения (box-shadow: currentColor)
  return dot;
}

// Создать группу кнопок: список вариантов → кнопки в контейнере
function buildOptions(containerId, items, settingName, makePreview, onPick) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option';
    if (settings[settingName] === item.id) button.classList.add('selected');

    if (makePreview) button.appendChild(makePreview(item));
    const label = document.createElement('span');
    if (item.tagline) {
      label.innerHTML = '<span class="world-name">' + item.label + '</span><span class="world-tagline">' + item.tagline + '</span>';
    } else {
      label.textContent = item.label;
    }
    button.appendChild(label);

    button.addEventListener('click', () => {
      settings[settingName] = item.id;
      if (onPick) onPick(item);
      saveSettings();
      buildSettings(); // перерисовать кнопки, чтобы выделить выбранную
    });

    container.appendChild(button);
  }
}

function buildSettings() {
  buildOptions('worldOptions', WORLDS, 'world', worldPreview, item => {
    // Если цвет героя не выбирали сами — берём цвет мира
    if (!settings.heroTouched) settings.hero = item.heroDefault;
    buildWorld();
    updateHeroColor();
  });
  buildOptions('heroOptions', HERO_COLORS, 'hero', colorPreview, () => {
    settings.heroTouched = true;
    updateHeroColor();
  });
  buildOptions('difficultyOptions', DIFFICULTIES, 'difficulty', null, null);

  document.getElementById('soundToggle').checked = settings.sound;
  document.getElementById('volumeRange').value = Math.round(settings.volume * 100);
  document.getElementById('volumeRange').disabled = !settings.sound;
}

document.getElementById('soundToggle').addEventListener('change', (event) => {
  settings.sound = event.target.checked;
  saveSettings();
  buildSettings();
  playSound('coin');
});

document.getElementById('volumeRange').addEventListener('change', (event) => {
  settings.volume = Number(event.target.value) / 100;
  saveSettings();
  playSound('coin'); // послушать новую громкость
});

document.getElementById('resetBestButton').addEventListener('click', () => {
  bestScore = 0;
  saveBestScore();
  showToast('Рекорд сброшен');
});


/* ---------------------------------------------------------
   14. УПРАВЛЕНИЕ
   --------------------------------------------------------- */

// Главное действие: пробел или тап
function onAction() {
  if (game.state === 'playing') {
    jump();
  } else if (isVisible(screens.menu) || isVisible(screens.over)) {
    startGame(); // в меню и после проигрыша — новый забег
  }
}

document.addEventListener('keydown', (event) => {
  const code = event.code;
  if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(code)) {
    event.preventDefault(); // чтобы страница не прокручивалась
  }
  if (event.repeat) return; // зажатая клавиша не считается

  if (code === 'ArrowLeft' || code === 'KeyA') changeLane(-1);
  if (code === 'ArrowRight' || code === 'KeyD') changeLane(1);
  if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') onAction();
  if (code === 'Escape' || code === 'KeyP') {
    if (game.state === 'playing') pauseGame();
    else if (game.state === 'paused') resumeGame();
    else if (isVisible(screens.settings)) showScreen('menu');
  }
});

// Свайпы на телефоне: запоминаем, где палец коснулся, и где отпустил
let touchStart = null;

stage.addEventListener('touchstart', (event) => {
  if (event.target.closest('button, input, .settings-panel')) return;
  const t = event.changedTouches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });

stage.addEventListener('touchend', (event) => {
  if (!touchStart) return;
  const t = event.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  touchStart = null;

  if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
    onAction(); // короткое касание — тап
  } else if (Math.abs(dx) > Math.abs(dy)) {
    changeLane(dx > 0 ? 1 : -1); // свайп влево/вправо
  } else if (dy < 0) {
    jump(); // свайп вверх
  }
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
   15. ИГРОВОЙ ЦИКЛ И ЗАПУСК
   requestAnimationFrame вызывает loop примерно 60 раз в секунду
   --------------------------------------------------------- */

let lastTime = performance.now();

function loop(now) {
  let dt = (now - lastTime) / 1000; // секунды с прошлого кадра
  lastTime = now;
  if (dt > 0.05) dt = 0.05;         // если вкладка «подвисла», не прыгаем далеко

  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

// Название игры из Лаборатории
document.querySelector('.title-top').textContent = LAB.titleTop;
document.querySelector('.title-bottom').textContent = LAB.titleBottom;
document.title = LAB.titleTop + ' ' + LAB.titleBottom;
showScreen('menu');

// Сначала загружаем Three.js, потом строим мир и запускаем цикл
loadThree(() => {
  createScene();
  buildWorld();
  createHero();
  resetGame();
  camera.position.set(0, LAB.cameraHeight, 7.5);
  game.state = 'menu';
  requestAnimationFrame(loop);
});
