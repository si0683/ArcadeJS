/* =========================================================
   QUIZ BREAKOUT — арканоид + образовательный квиз + бонусы
   Чистый JavaScript и Canvas, графика из эмодзи
   ---------------------------------------------------------
   Как устроен файл (читайте сверху вниз):
     0. Лаборатория: 10 настроек для экспериментов
     1. Данные: миры, предметы, сложность
     2. Вопросы: математика, русский, английский, история
     3. Бонусы (перки)
     4. Настройки игрока и рекорд
     5. Звуки
     6. Холст и размер игры
     7. Состояние игры, платформа, шары, кирпичи
     8. Строим уровень
     9. Рисование: фон, кирпичи, шары, частицы
    10. Окно вопроса (квиз)
    11. Экран бонусов
    12. Игровые действия
    13. Обновление мира за один кадр
    14. Рисование одного кадра
    15. Экраны и интерфейс
    16. Экран настроек
    17. Управление
    18. Игровой цикл и запуск
   ========================================================= */


/* ---------------------------------------------------------
   0. ЛАБОРАТОРИЯ ИГРЫ 🧪
   Поменяй одно значение, и игра изменится!
   Сейчас здесь обычные значения: игра такая, как задумано.
   --------------------------------------------------------- */

const LAB = {
  // 1. Название игры в меню: верхнее и нижнее слово (до 8 букв)
  titleTop: 'Quiz',
  titleBottom: 'Breakout',

  // 2. Свой герой-эмодзи на платформе, например '🐸'. Пусто '' — герой мира
  heroEmoji: '',

  // 3. Жизни: 3 — обычно, 10 — много
  lives: 3,

  // 4. Ширина платформы: 110 — обычная, 200 — широкая
  paddleWidth: 110,

  // 5. Скорость шара: 1 — обычная, 0.7 — медленный, 1.4 — быстрый
  ballSpeed: 1,

  // 6. Кирпичей с вопросом на уровне: 3 — обычно, 8 — много вопросов
  quizBricks: 3,

  // 7. Рядов кирпичей на первом уровне: 5 — обычно, 8 — стена
  brickRows: 5,

  // 8. Босс каждые N уровней: 3 — обычно, 1 — всегда
  bossEvery: 3,

  // 9. Шаров на старте: 1 — обычно, 3 — сразу мульти-шар
  startBalls: 1,

  // 10. Радужный шар: false — цвет мира, true — радуга
  rainbowBall: false
};


/* ---------------------------------------------------------
   1. ДАННЫЕ: МИРЫ, ПРЕДМЕТЫ, СЛОЖНОСТЬ
   --------------------------------------------------------- */

const THEMES = [
  {
    id: 'fantasy', icon: '🏰', label: 'Фэнтези', desc: 'Рыцари и магия',
    accent: '#FFD700',
    sky: ['#0b1030', '#1b1f5a', '#3a2a6a'],
    bricks: ['#ffd700', '#ff9f43', '#c084fc', '#60a5fa', '#34d399'],
    hero: '🧙', enemies: ['👹', '💀'], boss: { emoji: '🐉', name: 'Дракон', shot: '🔥' }
  },
  {
    id: 'space', icon: '🚀', label: 'Космос', desc: 'Лазеры и НЛО',
    accent: '#00FFFF',
    sky: ['#000008', '#05051a', '#0d0a2e'],
    bricks: ['#00ffff', '#3b82f6', '#a855f7', '#ec4899', '#22d3ee'],
    hero: '🧑‍🚀', enemies: ['☄️', '🛸'], boss: { emoji: '👾', name: 'Мега-Мозг', shot: '⚡' }
  },
  {
    id: 'eco', icon: '🌿', label: 'Эко-Панк', desc: 'Защита природы',
    accent: '#39FF14',
    sky: ['#04140c', '#0b2a18', '#123d22'],
    bricks: ['#39ff14', '#a3e635', '#facc15', '#2dd4bf', '#86efac'],
    hero: '🐼', enemies: ['🗑️', '🦗'], boss: { emoji: '🧟', name: 'Токсичный Монстр', shot: '☢️' }
  }
];

const SUBJECTS = [
  { id: 'math', icon: '🧮', label: 'Математика', desc: 'Примеры' },
  { id: 'rus',  icon: '📝', label: 'Русский', desc: 'Пропущенная буква' },
  { id: 'eng',  icon: '🔤', label: 'Английский', desc: 'Перевод слов' },
  { id: 'hist', icon: '🏛️', label: 'История России', desc: 'Даты и люди' }
];

const INPUT_MODES = [
  { id: 'buttons',  icon: '👆', label: 'Кнопки', desc: '4 варианта' },
  { id: 'keyboard', icon: '⌨️', label: 'Ввод', desc: 'Напечатать ответ' }
];

// Сложность: скорость шара, прочность кирпичей-врагов, множитель очков
const DIFFICULTIES = [
  { id: 'easy',   icon: '🙂', label: 'Легко',     desc: 'Спокойный шар',            speed: 340, enemyHp: 2, score: 1 },
  { id: 'normal', icon: '😎', label: 'Нормально', desc: 'Быстрее, очки ×1.5',        speed: 410, enemyHp: 3, score: 1.5 },
  { id: 'hard',   icon: '😈', label: 'Сложно',    desc: 'Очень быстро, очки ×2',     speed: 480, enemyHp: 4, score: 2 }
];

function findById(list, id) {
  return list.find(item => item.id === id) || list[0];
}

function currentTheme() {
  return findById(THEMES, settings.theme);
}

function difficulty() {
  return findById(DIFFICULTIES, settings.difficulty);
}


/* ---------------------------------------------------------
   2. ВОПРОСЫ
   Для каждого предмета — пул заданий. Задания перемешиваются
   и идут по очереди, поэтому подряд не повторяются.
   --------------------------------------------------------- */

// Русский язык: слово, номер пропущенной буквы (с нуля)
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

// История России: вопрос, верный ответ, три неверных варианта
// и короткие формы ответа, которые тоже засчитываются при вводе
const HISTORY = [
  ['Кто первым полетел в космос?', 'Гагарин', ['Титов', 'Леонов', 'Королёв'], ['Юрий Гагарин']],
  ['В каком году Гагарин полетел в космос?', '1961', ['1957', '1965', '1945']],
  ['Кто первым вышел в открытый космос?', 'Леонов', ['Гагарин', 'Титов', 'Терешкова'], ['Алексей Леонов']],
  ['Кто первая женщина-космонавт?', 'Терешкова', ['Савицкая', 'Кондакова', 'Кикина'], ['Валентина Терешкова']],
  ['В каком году запустили первый спутник Земли?', '1957', ['1961', '1945', '1969']],
  ['Кто был главным конструктором первых ракет?', 'Королёв', ['Гагарин', 'Туполев', 'Калашников'], ['Сергей Королёв']],
  ['Кто основал Санкт-Петербург?', 'Пётр I', ['Иван Грозный', 'Екатерина II', 'Александр I'], ['Пётр 1', 'Пётр Первый', 'Пётр']],
  ['В каком году основан Санкт-Петербург?', '1703', ['1613', '1812', '1147']],
  ['В каком году Москва впервые упомянута в летописи?', '1147', ['988', '1240', '1380']],
  ['Кто основал Москву?', 'Юрий Долгорукий', ['Иван Калита', 'Дмитрий Донской', 'Ярослав Мудрый'], ['Долгорукий']],
  ['В каком году крестили Русь?', '988', ['1147', '862', '1380']],
  ['Какой князь крестил Русь?', 'Владимир', ['Олег', 'Игорь', 'Святослав'], ['Князь Владимир']],
  ['В каком году была Куликовская битва?', '1380', ['1242', '1612', '1812']],
  ['Кто победил на Куликовом поле?', 'Дмитрий Донской', ['Александр Невский', 'Иван III', 'Пётр I'], ['Донской']],
  ['Кто победил в Ледовом побоище?', 'Александр Невский', ['Дмитрий Донской', 'Юрий Долгорукий', 'Владимир'], ['Невский']],
  ['В каком году было Ледовое побоище?', '1242', ['1240', '1380', '1480']],
  ['Кто стал первым русским царём?', 'Иван Грозный', ['Пётр I', 'Михаил Романов', 'Борис Годунов'], ['Грозный', 'Иван IV', 'Иван 4']],
  ['Кто освободил Москву в 1612 году?', 'Минин и Пожарский', ['Кутузов', 'Суворов', 'Ермак'], ['Минин', 'Пожарский']],
  ['В каком году была война с Наполеоном?', '1812', ['1612', '1914', '1941']],
  ['Кто командовал русской армией в 1812 году?', 'Кутузов', ['Суворов', 'Жуков', 'Багратион']],
  ['В каком году началась Великая Отечественная война?', '1941', ['1939', '1914', '1945']],
  ['В каком году закончилась Великая Отечественная война?', '1945', ['1941', '1943', '1918']],
  ['Какого числа празднуют День Победы?', '9 мая', ['12 июня', '4 ноября', '23 февраля']],
  ['Какого числа празднуют День России?', '12 июня', ['9 мая', '4 ноября', '1 сентября']],
  ['Кто создал таблицу химических элементов?', 'Менделеев', ['Ломоносов', 'Павлов', 'Королёв']],
  ['По чьей идее открыли Московский университет?', 'Ломоносов', ['Менделеев', 'Пушкин', 'Пётр I']],
  ['С какого царя началась династия Романовых?', 'Михаил', ['Пётр', 'Иван', 'Алексей'], ['Михаил Романов', 'Михаил Фёдорович']],
  ['Как звали последнего российского императора?', 'Николай II', ['Александр III', 'Пётр III', 'Павел I'], ['Николай 2', 'Николай Второй', 'Николай']],
  ['Какой город стал столицей при Петре I?', 'Санкт-Петербург', ['Новгород', 'Казань', 'Владимир'], ['Петербург', 'Питер', 'СПб']],
  ['Кто написал «Повесть временных лет»?', 'Нестор', ['Пимен', 'Кирилл', 'Мефодий'], ['Летописец Нестор']]
];

let questionPool = [];

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

// Один пример по математике. Чем сложнее игра — тем больше числа
function makeMathQuestion(level) {
  const kind = randInt(0, 2);
  let a, b, text, answer;
  if (kind === 0) {
    a = randInt(2, 10 + level * 20);
    b = randInt(2, 10 + level * 20);
    text = a + ' + ' + b + ' = ?';
    answer = a + b;
  } else if (kind === 1) {
    a = randInt(5, 15 + level * 20);
    b = randInt(1, a);           // без отрицательных ответов
    text = a + ' − ' + b + ' = ?';
    answer = a - b;
  } else {
    a = randInt(2, 5 + level * 2);
    b = randInt(2, 9);
    text = a + ' × ' + b + ' = ?';
    answer = a * b;
  }
  // Неверные варианты — близкие числа
  const wrong = new Set();
  while (wrong.size < 3) {
    const w = answer + randInt(-10, 10);
    if (w !== answer && w >= 0) wrong.add(w);
  }
  return { text: text, hint: '', answer: String(answer), options: shuffle([answer, ...wrong].map(String)), numeric: true };
}

function makeRusQuestion([word, index]) {
  const letter = word[index] === 'Ё' ? 'Е' : word[index];
  const text = word.slice(0, index) + '_' + word.slice(index + 1);
  const wrong = shuffle(VOWELS.filter(v => v !== letter)).slice(0, 3);
  return { text: text, hint: 'Какая буква пропущена?', answer: letter, options: shuffle([letter, ...wrong]) };
}

function makeEngQuestion([word, translation]) {
  const wrong = shuffle(ENG_WORDS.filter(w => w[1] !== translation)).slice(0, 3).map(w => w[1]);
  return { text: word, hint: 'Переведи на русский', answer: translation, options: shuffle([translation, ...wrong]) };
}

function makeHistoryQuestion([text, answer, wrong, accept]) {
  return {
    text: text,
    hint: /^\d+$/.test(answer) ? 'Напиши год' : '',
    answer: answer,
    accept: accept || [],                 // другие правильные формы ответа
    options: shuffle([answer, ...wrong]),
    numeric: /^\d+$/.test(answer)
  };
}

// Пул из 20+ заданий для выбранного предмета
function buildQuestionPool() {
  const subject = settings.subject;
  if (subject === 'rus') {
    questionPool = shuffle(RUS_WORDS).map(makeRusQuestion);
  } else if (subject === 'eng') {
    questionPool = shuffle(ENG_WORDS).map(makeEngQuestion);
  } else if (subject === 'hist') {
    questionPool = shuffle(HISTORY).map(makeHistoryQuestion);
  } else {
    const level = DIFFICULTIES.indexOf(findById(DIFFICULTIES, settings.difficulty));
    questionPool = [];
    for (let i = 0; i < 20; i++) questionPool.push(makeMathQuestion(level));
  }
}

function nextQuestion() {
  if (questionPool.length === 0) buildQuestionPool();
  return questionPool.pop();
}

// Сравнение ответов: без пробелов, без разницы в регистре, Ё = Е
function normalize(text) {
  return String(text).trim().toUpperCase().replace(/Ё/g, 'Е');
}

// Верный ли ответ: совпадает с ответом или с одной из его коротких форм
function isRightAnswer(question, text) {
  const value = normalize(text);
  return [question.answer, ...(question.accept || [])].some(a => normalize(a) === value);
}


/* ---------------------------------------------------------
   3. БОНУСЫ (ПЕРКИ)
   Верный ответ → 3 случайных бонуса. Каждый — один раз за игру
   --------------------------------------------------------- */

const PERKS = [
  { id: 'multi',  icon: '🔮', title: 'Мульти-шар',      desc: '+2 шара прямо сейчас',              apply: p => { splitBalls(); } },
  { id: 'wide',   icon: '↔️', title: 'Широкая платформа', desc: 'Платформа шире на 40%',           apply: p => { p.width *= 1.4; } },
  { id: 'fire',   icon: '🔥', title: 'Огненный шар',    desc: 'Пробивает кирпичи насквозь',        apply: p => { p.fire = true; } },
  { id: 'laser',  icon: '🔫', title: 'Лазеры',          desc: 'Платформа стреляет вверх',          apply: p => { p.laser = true; } },
  { id: 'slow',   icon: '🐢', title: 'Медленный шар',   desc: 'Шар на 20% медленнее',              apply: p => { p.speed *= 0.8; slowAllBalls(0.8); } },
  { id: 'life',   icon: '❤️', title: '+1 жизнь',        desc: 'Ещё одна попытка',                  apply: p => { game.lives++; } },
  { id: 'sticky', icon: '🍯', title: 'Липкая платформа', desc: 'Шар прилипает, запуск — пробел',   apply: p => { p.sticky = true; } },
  { id: 'score',  icon: '⭐', title: 'Двойные очки',    desc: 'Очки ×2',                           apply: p => { p.scoreMult *= 2; } },
  { id: 'big',    icon: '🔵', title: 'Большой шар',     desc: 'Шар больше и бьёт сильнее',         apply: p => { p.ballSize *= 1.5; p.damage += 1; } },
  { id: 'shield', icon: '🛡️', title: 'Щит снизу',       desc: 'Один раз спасёт упавший шар',       apply: p => { p.shield = true; } },
  { id: 'boom',   icon: '💣', title: 'Взрывной шар',    desc: 'Задевает соседние кирпичи',         apply: p => { p.explosive = true; } },
  { id: 'power',  icon: '💥', title: 'Сила ×2',         desc: 'Двойной урон кирпичам-врагам',      apply: p => { p.damage *= 2; } },
  { id: 'hint',   icon: '✂️', title: 'Подсказка 50/50', desc: 'В вопросе только 2 варианта',       apply: p => { p.hint = true; } },
  { id: 'magnet', icon: '🧲', title: 'Магнит',          desc: 'Шар тянется к платформе',           apply: p => { p.magnet = true; } }
];


/* ---------------------------------------------------------
   4. НАСТРОЙКИ ИГРОКА И РЕКОРД
   --------------------------------------------------------- */

const DEFAULT_SETTINGS = {
  theme: 'space',
  subject: 'math',
  inputMode: 'buttons',
  difficulty: 'easy',
  sound: true,
  volume: 0.7
};

let settings = loadSettings();
let bestScore = loadBestScore();

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('quizbreakout-settings'));
    return Object.assign({}, DEFAULT_SETTINGS, saved);
  } catch (error) {
    return Object.assign({}, DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  try {
    localStorage.setItem('quizbreakout-settings', JSON.stringify(settings));
  } catch (error) {
    // Если браузер запретил сохранение — просто играем без него
  }
}

function loadBestScore() {
  try {
    return Number(localStorage.getItem('quizbreakout-best')) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore() {
  try {
    localStorage.setItem('quizbreakout-best', String(bestScore));
  } catch (error) {
    // ничего страшного
  }
}


/* ---------------------------------------------------------
   5. ЗВУКИ (Web Audio — звук играет мгновенно)
   --------------------------------------------------------- */

const isCodePen = location.hostname.includes('codepen') || location.hostname.includes('cdpn.io');
const SOUND_PATH = isCodePen ? 'https://si0683.github.io/QuizBreakout/sound/' : 'sound/';

const SOUND_FILES = {
  jump:  'jump.wav',   // шар ударился о кирпич
  coin:  'coin.mp3',   // верный ответ
  tick:  'tick.wav',   // отсчёт, удар о платформу
  start: 'start.wav',  // бонус, уровень, босс
  crash: 'crash.wav'   // шар упал, неверный ответ
};

const SOUND_START = { coin: 0.045 };

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const sounds = {};

for (const name in SOUND_FILES) {
  fetch(SOUND_PATH + SOUND_FILES[name])
    .then(response => response.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data))
    .then(buffer => { sounds[name] = buffer; })
    .catch(() => {});
}

function playSound(name) {
  if (!settings.sound || !sounds[name]) return;
  if (audioContext.state === 'suspended') audioContext.resume();
  const source = audioContext.createBufferSource();
  source.buffer = sounds[name];
  const volume = audioContext.createGain();
  volume.gain.value = settings.volume;
  source.connect(volume);
  volume.connect(audioContext.destination);
  source.start(0, SOUND_START[name] || 0);
}


/* ---------------------------------------------------------
   6. ХОЛСТ И РАЗМЕР ИГРЫ
   Высота мира 720, ширина под экран (от 420 до 820)
   --------------------------------------------------------- */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const stage = document.getElementById('stage');

const H = 720;
let W = 640;
let scale = 1;

function resizeGame() {
  scale = window.innerHeight / H;
  W = window.innerWidth / scale;
  if (W < 420) {
    W = 420;
    scale = window.innerWidth / W;
  }
  if (W > 820) W = 820;
  stage.style.width = W * scale + 'px';
  stage.style.height = H * scale + 'px';
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(W * scale * ratio);
  canvas.height = Math.round(H * scale * ratio);
  ctx.setTransform(scale * ratio, 0, 0, scale * ratio, 0, 0);
  paddle.x = clamp(paddle.x, paddle.width / 2, W - paddle.width / 2);
}


/* ---------------------------------------------------------
   7. СОСТОЯНИЕ ИГРЫ, ПЛАТФОРМА, ШАРЫ, КИРПИЧИ
   --------------------------------------------------------- */

// Состояния: 'menu', 'choose', 'countdown', 'playing',
// 'quiz', 'perk', 'paused', 'over'
const game = {
  state: 'menu',
  score: 0,
  lives: 0,         // ставится из LAB.lives при старте
  level: 1,
  answers: 0,
  time: 0,
  laserTimer: 0,
  shake: 0,
  usedPerks: []
};

const PADDLE_Y = H - 70;

const paddle = {
  x: 320,
  width: 110,
  // Бонусы (меняются перками)
  speed: 1, fire: false, laser: false, sticky: false, scoreMult: 1, ballSize: 1,
  damage: 1, shield: false, explosive: false, hint: false, magnet: false
};

function resetPaddle() {
  paddle.width = LAB.paddleWidth;
  paddle.speed = LAB.ballSpeed;
  paddle.fire = false;
  paddle.laser = false;
  paddle.sticky = false;
  paddle.scoreMult = 1;
  paddle.ballSize = 1;
  paddle.damage = 1;
  paddle.shield = false;
  paddle.explosive = false;
  paddle.hint = false;
  paddle.magnet = false;
}

let balls = [];      // { x, y, vx, vy, stuck }
let bricks = [];     // { x, y, w, h, hp, maxHp, kind: 'plain'|'enemy'|'quiz', color, emoji }
let boss = null;
let bossShots = [];
let lasers = [];
let particles = [];

const keys = { left: false, right: false };
let pointerX = null;

function heroEmoji() {
  return LAB.heroEmoji || currentTheme().hero;
}

function ballRadius() {
  return 9 * paddle.ballSize;
}

function ballSpeed() {
  return difficulty().speed * paddle.speed * (1 + (game.level - 1) * 0.05);
}

// Новый шар, лежащий на платформе
function newBall() {
  return { x: paddle.x, y: PADDLE_Y - 14 - ballRadius(), vx: 0, vy: 0, stuck: true };
}

// Запустить прилипшие шары вверх под небольшим углом
function launchBalls() {
  for (const b of balls) {
    if (!b.stuck) continue;
    b.stuck = false;
    const angle = (Math.random() - 0.5) * 0.8;
    b.vx = Math.sin(angle) * ballSpeed();
    b.vy = -Math.cos(angle) * ballSpeed();
  }
  document.getElementById('launchHint').classList.add('hidden');
}

// Мульти-шар: каждый летящий шар делится на три
function splitBalls() {
  const source = balls.filter(b => !b.stuck);
  if (source.length === 0) {
    launchBalls();
    source.push(...balls);
  }
  for (const b of source.slice(0, 3)) {
    for (const turn of [-0.4, 0.4]) {
      const angle = Math.atan2(b.vx, -b.vy) + turn;
      balls.push({ x: b.x, y: b.y, vx: Math.sin(angle) * ballSpeed(), vy: -Math.cos(angle) * ballSpeed(), stuck: false });
    }
  }
}

function slowAllBalls(factor) {
  for (const b of balls) {
    b.vx *= factor;
    b.vy *= factor;
  }
}


/* ---------------------------------------------------------
   8. СТРОИМ УРОВЕНЬ
   Кирпичи: обычные (1 удар), враги (прочные, с эмодзи)
   и кирпичи-вопросы ❓. На босс-уровне сверху ходит босс
   --------------------------------------------------------- */

function buildLevel() {
  const theme = currentTheme();
  bricks = [];
  boss = null;
  bossShots = [];
  lasers = [];
  const isBossLevel = game.level % LAB.bossEvery === 0;
  const rows = Math.min(9, LAB.brickRows + Math.floor((game.level - 1) / 2)) - (isBossLevel ? 2 : 0);
  const cols = Math.max(6, Math.floor((W - 40) / 66));
  const gap = 6;
  const brickW = (W - 40 - gap * (cols - 1)) / cols;
  const brickH = 26;
  const top = isBossLevel ? 200 : 110;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Узор: иногда пропускаем кирпич, чтобы уровни были разными
      if (Math.random() < 0.12) continue;
      const enemy = Math.random() < 0.18 + game.level * 0.02;
      const hp = enemy ? difficulty().enemyHp + Math.floor(game.level / 3) : 1;
      bricks.push({
        x: 20 + c * (brickW + gap), y: top + r * (brickH + gap), w: brickW, h: brickH,
        hp: hp, maxHp: hp,
        kind: enemy ? 'enemy' : 'plain',
        color: theme.bricks[r % theme.bricks.length],
        emoji: enemy ? theme.enemies[Math.floor(Math.random() * theme.enemies.length)] : '',
        hit: 0
      });
    }
  }

  // Кирпичи-вопросы: заменяем случайные обычные
  const plain = shuffle(bricks.filter(b => b.kind === 'plain'));
  for (const b of plain.slice(0, LAB.quizBricks)) {
    b.kind = 'quiz';
    b.hp = b.maxHp = 1;
    b.emoji = '❓';
  }

  if (isBossLevel) {
    const hp = 18 + game.level * 4;
    boss = { x: W / 2, y: 120, size: 90, hp: hp, maxHp: hp, dir: 1, shotTimer: 2.5, hit: 0 };
    document.getElementById('bossName').textContent = theme.boss.emoji + ' ' + theme.boss.name;
  }

  balls = [];
  for (let i = 0; i < LAB.startBalls; i++) balls.push(newBall());
  document.getElementById('launchHint').classList.remove('hidden');
}


/* ---------------------------------------------------------
   9. РИСОВАНИЕ: ФОН, КИРПИЧИ, ШАРЫ, ЧАСТИЦЫ
   --------------------------------------------------------- */

const TAU = Math.PI * 2;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function seeded(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function drawCircle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

function drawGlow(x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function drawEmoji(emoji, x, y, size) {
  ctx.font = size + 'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y);
}

function hexToRgba(color, alpha) {
  if (!color.startsWith('#')) return color.replace('hsl(', 'hsla(').replace(')', ', ' + alpha + ')');
  const n = parseInt(color.slice(1), 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
}

function drawBackground() {
  const theme = currentTheme();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, theme.sky[0]);
  g.addColorStop(0.6, theme.sky[1]);
  g.addColorStop(1, theme.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    ctx.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(game.time * 1.3 + i));
    const y = (seeded(i + 30) * H + game.time * (6 + seeded(i) * 18)) % H;
    drawCircle(seeded(i) * W, y, 0.6 + seeded(i + 5) * 1.6, theme.id === 'eco' ? '#b6ff9a' : '#ffffff');
  }
  ctx.globalAlpha = 1;
  drawGlow(W * 0.2, H * 0.35, 260, hexToRgba(theme.accent, 0.08));
  // Пол-«опасная зона» внизу
  const danger = ctx.createLinearGradient(0, H - 40, 0, H);
  danger.addColorStop(0, 'rgba(255,60,90,0)');
  danger.addColorStop(1, 'rgba(255,60,90,0.25)');
  ctx.fillStyle = danger;
  ctx.fillRect(0, H - 40, W, 40);
  if (paddle.shield) {
    ctx.fillStyle = 'rgba(127,220,255,0.7)';
    ctx.fillRect(0, H - 8, W, 4);
  }
}

function drawBricks() {
  for (const b of bricks) {
    const color = b.kind === 'quiz' ? '#ffd84a' : b.color;
    const pop = b.hit > 0 ? 2 : 0;
    ctx.fillStyle = hexToRgba(color, b.kind === 'enemy' ? 0.35 + 0.5 * b.hp / b.maxHp : 0.85);
    ctx.beginPath();
    ctx.roundRect(b.x - pop, b.y - pop, b.w + pop * 2, b.h + pop * 2, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Блик сверху
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(b.x + 4, b.y + 3, b.w - 8, 4);
    if (b.kind === 'quiz') {
      drawGlow(b.x + b.w / 2, b.y + b.h / 2, 30 + Math.sin(game.time * 5) * 4, 'rgba(255,215,0,0.5)');
      drawEmoji('❓', b.x + b.w / 2, b.y + b.h / 2 + 1, 20);
    } else if (b.kind === 'enemy') {
      drawEmoji(b.emoji, b.x + 16, b.y + b.h / 2 + 1, 20);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px "Russo One", Rubik, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Math.ceil(b.hp), b.x + b.w - 14, b.y + b.h / 2 + 1);
    }
  }
}

function drawBoss() {
  if (!boss) return;
  drawGlow(boss.x, boss.y, boss.size * 1.1, 'rgba(255,60,90,0.35)');
  drawEmoji(currentTheme().boss.emoji, boss.x, boss.y, boss.size * (boss.hit > 0 ? 1.1 : 1));
  for (const s of bossShots) drawEmoji(currentTheme().boss.shot, s.x, s.y, 28);
}

function drawPaddle() {
  const theme = currentTheme();
  const x = paddle.x - paddle.width / 2;
  drawGlow(paddle.x, PADDLE_Y, paddle.width, hexToRgba(theme.accent, 0.25));
  const g = ctx.createLinearGradient(0, PADDLE_Y - 8, 0, PADDLE_Y + 8);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.4, paddle.sticky ? '#ffb84d' : theme.accent);
  g.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, PADDLE_Y - 8, paddle.width, 16, 8);
  ctx.fill();
  if (paddle.laser) {
    ctx.fillStyle = '#ff4d6d';
    ctx.fillRect(x + 4, PADDLE_Y - 16, 6, 10);
    ctx.fillRect(x + paddle.width - 10, PADDLE_Y - 16, 6, 10);
  }
  // Герой стоит на платформе
  drawEmoji(heroEmoji(), paddle.x, PADDLE_Y + 30, 34);
}

function drawBalls() {
  const theme = currentTheme();
  for (const b of balls) {
    const color = LAB.rainbowBall ? 'hsl(' + Math.round((game.time * 300) % 360) + ', 100%, 60%)'
      : paddle.fire ? '#ff7a2a' : theme.accent;
    drawGlow(b.x, b.y, ballRadius() * 3, hexToRgba(color, 0.5));
    drawCircle(b.x, b.y, ballRadius(), color);
    drawCircle(b.x - ballRadius() * 0.3, b.y - ballRadius() * 0.3, ballRadius() * 0.35, 'rgba(255,255,255,0.8)');
  }
  for (const l of lasers) {
    ctx.fillStyle = '#ff4d6d';
    ctx.fillRect(l.x - 2, l.y - 10, 4, 14);
  }
}

function spawnParticles(x, y, count, color, power) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * TAU;
    const speed = (0.3 + Math.random()) * power;
    particles.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.4 + Math.random() * 0.5, size: 2 + Math.random() * 4, color: color });
  }
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 400 * dt;
    p.life -= dt;
  }
  particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    drawCircle(p.x, p.y, p.size, p.color);
  }
  ctx.globalAlpha = 1;
}


/* ---------------------------------------------------------
   10. ОКНО ВОПРОСА (КВИЗ)
   --------------------------------------------------------- */

let currentQuestion = null;
let quizLocked = false;

function openQuiz() {
  game.state = 'quiz';
  keys.left = keys.right = false;
  currentQuestion = nextQuestion();
  quizLocked = false;
  const subject = findById(SUBJECTS, settings.subject);

  document.getElementById('quizSubject').textContent = subject.icon + ' ' + subject.label;
  document.getElementById('quizQuestion').innerHTML = currentQuestion.text +
    (currentQuestion.hint ? '<small>' + currentQuestion.hint + '</small>' : '');
  // Длинный вопрос (история) — шрифт поменьше
  document.getElementById('quizQuestion').classList.toggle('long', currentQuestion.text.length > 12);
  document.getElementById('quizOptions').classList.toggle('long', currentQuestion.options.some(o => o.length > 9));
  document.getElementById('quizHint').textContent = 'Верный ответ — бонус!';
  document.getElementById('quizCard').classList.remove('flash-bad', 'flash-good');

  const options = document.getElementById('quizOptions');
  const form = document.getElementById('quizForm');
  const inputEl = document.getElementById('quizInput');

  if (settings.inputMode === 'keyboard') {
    options.classList.add('hidden');
    form.classList.remove('hidden');
    inputEl.value = '';
    inputEl.inputMode = currentQuestion.numeric ? 'numeric' : 'text';
    if (paddle.hint) document.getElementById('quizHint').textContent = 'Подсказка: начинается на «' + String(currentQuestion.answer)[0] + '»';
    showScreen('quiz');
    setTimeout(() => inputEl.focus(), 50);
  } else {
    form.classList.add('hidden');
    options.classList.remove('hidden');
    options.innerHTML = '';
    let list = currentQuestion.options;
    if (paddle.hint) {
      const wrong = list.filter(o => normalize(o) !== normalize(currentQuestion.answer));
      list = shuffle([currentQuestion.answer, wrong[0]]);
    }
    list.forEach((text, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quiz-option';
      button.textContent = text;
      button.title = 'Клавиша ' + (i + 1);
      button.addEventListener('click', () => answerQuiz(text, button));
      options.appendChild(button);
    });
    showScreen('quiz');
  }
}

function answerQuiz(text, button) {
  if (quizLocked || game.state !== 'quiz') return;
  quizLocked = true;
  const correct = isRightAnswer(currentQuestion, text);
  if (button) button.classList.add(correct ? 'right' : 'wrong');
  restartAnimation(document.getElementById('quizCard'), correct ? 'flash-good' : 'flash-bad');
  if (correct) {
    game.answers++;
    addScore(30);
    playSound('coin');
    setTimeout(openPerks, 500);
  } else {
    playSound('crash');
    for (const b of document.querySelectorAll('.quiz-option')) {
      if (normalize(b.textContent) === normalize(currentQuestion.answer)) b.classList.add('right');
    }
    document.getElementById('quizHint').textContent = 'Правильно: ' + currentQuestion.answer;
    setTimeout(resumeAfterQuiz, 1100);
  }
}

function resumeAfterQuiz() {
  game.state = 'playing';
  showScreen(null);
  updateHud();
}

document.getElementById('quizForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const value = document.getElementById('quizInput').value;
  if (value.trim()) answerQuiz(value, null);
});


/* ---------------------------------------------------------
   11. ЭКРАН БОНУСОВ
   --------------------------------------------------------- */

let perkOffer = [];

function openPerks() {
  const free = PERKS.filter(perk => !game.usedPerks.includes(perk.id));
  if (free.length === 0) {
    addScore(100);
    showToast('Все бонусы собраны! +100');
    resumeAfterQuiz();
    return;
  }
  game.state = 'perk';
  perkOffer = shuffle(free).slice(0, 3);
  const box = document.getElementById('perkChoices');
  box.innerHTML = '';
  perkOffer.forEach((perk, i) => {
    box.appendChild(makeChoice(perk.icon, perk.title, perk.desc, () => pickPerk(perk), i + 1));
  });
  showScreen('perk');
}

function pickPerk(perk) {
  if (game.state !== 'perk') return;
  perk.apply(paddle);
  game.usedPerks.push(perk.id);
  playSound('start');
  showToast(perk.icon + ' ' + perk.title);
  resumeAfterQuiz();
}


/* ---------------------------------------------------------
   12. ИГРОВЫЕ ДЕЙСТВИЯ
   --------------------------------------------------------- */

function addScore(points) {
  game.score += Math.round(points * difficulty().score * paddle.scoreMult);
}

// Удар по кирпичу. Возвращает true, если кирпич разбит
function hitBrick(brick, damage) {
  brick.hp -= brick.kind === 'enemy' ? damage : 1;
  brick.hit = 0.1;
  if (brick.hp > 0) {
    playSound('tick');
    return false;
  }
  bricks = bricks.filter(b => b !== brick);
  spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.kind === 'enemy' ? 18 : 10, brick.kind === 'quiz' ? '#ffd84a' : brick.color, 200);
  playSound('jump');
  addScore(brick.kind === 'enemy' ? 15 * brick.maxHp : 10);
  if (brick.kind === 'quiz') openQuiz();
  return true;
}

// Взрывной шар: задевает кирпичи рядом
function explodeAround(brick) {
  const cx = brick.x + brick.w / 2;
  const cy = brick.y + brick.h / 2;
  for (const other of bricks.slice()) {
    if (Math.hypot(other.x + other.w / 2 - cx, other.y + other.h / 2 - cy) < 80 && other.kind !== 'quiz') hitBrick(other, paddle.damage);
  }
  spawnParticles(cx, cy, 16, '#ff9f43', 260);
}

function hitBoss(damage) {
  boss.hp -= damage;
  boss.hit = 0.15;
  playSound('tick');
  spawnParticles(boss.x, boss.y, 10, '#ff4d6d', 200);
  if (boss.hp <= 0) {
    spawnParticles(boss.x, boss.y, 60, currentTheme().accent, 340);
    addScore(500);
    showToast(currentTheme().boss.name + ' побеждён! +500');
    playSound('start');
    boss = null;
    bossShots = [];
  }
  updateHud();
}

// Все шары упали — минус жизнь
function loseLife() {
  game.lives--;
  game.shake = 0.35;
  playSound('crash');
  if (game.lives <= 0) {
    game.lives = 0;
    gameOver();
    return;
  }
  balls = [newBall()];
  document.getElementById('launchHint').classList.remove('hidden');
  showToast('Шар упал!');
  updateHud();
}

function nextLevel() {
  game.level++;
  addScore(200 * (game.level - 1));
  buildLevel();
  playSound('start');
  showToast('Уровень ' + game.level + (game.level % LAB.bossEvery === 0 ? ': БОСС!' : ''));
  updateHud();
}

function gameOver() {
  game.state = 'over';
  const isRecord = game.score > bestScore;
  if (isRecord) {
    bestScore = game.score;
    saveBestScore();
  }
  document.getElementById('finalScore').textContent = game.score;
  document.getElementById('finalLevels').textContent = game.level - 1;
  document.getElementById('finalAnswers').textContent = game.answers;
  document.getElementById('finalBest').textContent = bestScore;
  document.getElementById('newRecord').classList.toggle('hidden', !isRecord || game.score === 0);
  setTimeout(() => showScreen('over'), 600);
}

function resetGame() {
  resetPaddle();
  game.score = 0;
  game.lives = LAB.lives;
  game.level = 1;
  game.answers = 0;
  game.laserTimer = 0;
  game.usedPerks = [];
  particles = [];
  paddle.x = W / 2;
  buildQuestionPool();
  buildLevel();
  updateHud();
}

// Быстрый выбор предмета прямо на экране сложности
function buildSubjectQuick() {
  const box = document.getElementById('subjectQuick');
  box.innerHTML = '';
  for (const item of SUBJECTS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option' + (settings.subject === item.id ? ' selected' : '');
    button.innerHTML = '<span class="option-icon">' + item.icon + '</span><span class="option-title">' + item.label + '</span>';
    button.addEventListener('click', () => {
      settings.subject = item.id;
      saveSettings();
      applyTheme();
      buildSubjectQuick();
    });
    box.appendChild(button);
  }
}

function openDifficultySelect() {
  buildSubjectQuick();
  game.state = 'choose';
  const box = document.getElementById('difficultyChoices');
  box.innerHTML = '';
  DIFFICULTIES.forEach((d, i) => {
    box.appendChild(makeChoice(d.icon, d.label, d.desc, () => {
      settings.difficulty = d.id;
      saveSettings();
      startGame();
    }, i + 1));
  });
  showScreen('difficulty');
}

let countdownTimer = null;

function startGame() {
  if (audioContext.state === 'suspended') audioContext.resume();
  resetGame();
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
      showCountdown('Старт!');
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
  game.state = 'menu';
  showScreen('menu');
}


/* ---------------------------------------------------------
   13. ОБНОВЛЕНИЕ МИРА ЗА ОДИН КАДР
   --------------------------------------------------------- */

function update(dt) {
  if (['quiz', 'perk', 'paused'].includes(game.state)) return;
  game.time += dt;
  updateParticles(dt);
  if (game.shake > 0) game.shake -= dt;
  if (!['playing', 'countdown'].includes(game.state)) return;

  updatePaddle(dt);
  if (game.state !== 'playing') return;

  // Шар двигаем маленькими шагами, чтобы он не «проскакивал» кирпичи
  const steps = 3;
  for (let i = 0; i < steps; i++) {
    updateBalls(dt / steps);
    if (game.state !== 'playing') return;
  }
  updateLasers(dt);
  if (game.state !== 'playing') return;
  updateBoss(dt);
  for (const b of bricks) if (b.hit > 0) b.hit -= dt;

  // Все кирпичи и босс побеждены — следующий уровень
  if (game.state === 'playing' && bricks.length === 0 && !boss) nextLevel();
}

function updatePaddle(dt) {
  let move = 0;
  if (keys.left) move -= 1;
  if (keys.right) move += 1;
  paddle.x += move * 620 * dt;
  if (pointerX !== null) paddle.x += (pointerX - paddle.x) * Math.min(1, dt * 18);
  paddle.x = clamp(paddle.x, paddle.width / 2, W - paddle.width / 2);
  // Прилипший шар едет вместе с платформой
  for (const b of balls) {
    if (b.stuck) {
      b.x = paddle.x + (b.offset || 0);
      b.y = PADDLE_Y - 8 - ballRadius();
    }
  }
}

function updateBalls(dt) {
  const r = ballRadius();
  for (const b of balls) {
    if (b.stuck) continue;
    // Магнит тянет шар к платформе, когда он падает
    if (paddle.magnet && b.vy > 0) b.vx += clamp(paddle.x - b.x, -1, 1) * 260 * dt;

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Стены и потолок
    if (b.x < r) { b.x = r; b.vx = Math.abs(b.vx); }
    if (b.x > W - r) { b.x = W - r; b.vx = -Math.abs(b.vx); }
    if (b.y < r) { b.y = r; b.vy = Math.abs(b.vy); }

    // Платформа: угол отскока зависит от того, куда попал шар
    if (b.vy > 0 && b.y + r >= PADDLE_Y - 8 && b.y + r <= PADDLE_Y + 10 && Math.abs(b.x - paddle.x) <= paddle.width / 2 + r) {
      const hit = clamp((b.x - paddle.x) / (paddle.width / 2), -1, 1);
      const angle = hit * 1.05;               // до ~60° в сторону
      const speed = ballSpeed();
      b.vx = Math.sin(angle) * speed;
      b.vy = -Math.cos(angle) * speed;
      b.y = PADDLE_Y - 8 - r;
      if (paddle.sticky) {
        b.stuck = true;
        b.offset = b.x - paddle.x;
        document.getElementById('launchHint').classList.remove('hidden');
      }
      playSound('tick');
    }

    // Кирпичи
    for (const brick of bricks) {
      const nearX = clamp(b.x, brick.x, brick.x + brick.w);
      const nearY = clamp(b.y, brick.y, brick.y + brick.h);
      if (Math.hypot(b.x - nearX, b.y - nearY) > r) continue;
      // Огненный шар пробивает насквозь (кроме прочных врагов)
      const broken = hitBrick(brick, paddle.damage);
      if (paddle.explosive) explodeAround(brick);
      if (!(paddle.fire && broken)) {
        // Отскок: по той оси, где перекрытие меньше
        const overlapX = Math.min(b.x + r - brick.x, brick.x + brick.w - (b.x - r));
        const overlapY = Math.min(b.y + r - brick.y, brick.y + brick.h - (b.y - r));
        if (overlapX < overlapY) b.vx = b.x < brick.x + brick.w / 2 ? -Math.abs(b.vx) : Math.abs(b.vx);
        else b.vy = b.y < brick.y + brick.h / 2 ? -Math.abs(b.vy) : Math.abs(b.vy);
      }
      break; // за шаг — один кирпич
    }
    if (game.state !== 'playing') return;

    // Босс
    if (boss && Math.hypot(b.x - boss.x, b.y - boss.y) < boss.size * 0.45 + r) {
      b.vy = Math.abs(b.vy);
      b.vx += (b.x - boss.x) * 2;
      hitBoss(paddle.damage);
    }
  }

  // Упавшие шары
  for (const b of balls) {
    if (b.y - r > H) {
      if (paddle.shield) {
        paddle.shield = false;
        b.y = H - r - 10;
        b.vy = -Math.abs(b.vy);
        showToast('🛡️ Щит!');
      } else {
        b.lost = true;
      }
    }
  }
  balls = balls.filter(b => !b.lost);
  if (balls.length === 0) loseLife();
}

function updateLasers(dt) {
  if (paddle.laser) {
    game.laserTimer -= dt;
    if (game.laserTimer <= 0) {
      game.laserTimer = 0.45;
      lasers.push({ x: paddle.x - paddle.width / 2 + 7, y: PADDLE_Y - 16 });
      lasers.push({ x: paddle.x + paddle.width / 2 - 7, y: PADDLE_Y - 16 });
    }
  }
  for (const l of lasers) {
    l.y -= 700 * dt;
    const brick = bricks.find(b => l.x > b.x && l.x < b.x + b.w && l.y > b.y && l.y < b.y + b.h);
    if (brick) {
      l.dead = true;
      hitBrick(brick, 1);
      if (game.state !== 'playing') return;
    } else if (boss && Math.hypot(l.x - boss.x, l.y - boss.y) < boss.size * 0.45) {
      l.dead = true;
      hitBoss(1);
    }
  }
  lasers = lasers.filter(l => !l.dead && l.y > -20);
}

// Босс ходит из стороны в сторону и стреляет вниз
function updateBoss(dt) {
  if (!boss) return;
  if (boss.hit > 0) boss.hit -= dt;
  boss.x += boss.dir * (90 + game.level * 6) * dt;
  if (boss.x < 70 || boss.x > W - 70) boss.dir *= -1;
  boss.shotTimer -= dt;
  if (boss.shotTimer <= 0) {
    boss.shotTimer = Math.max(1, 2.4 - game.level * 0.08);
    bossShots.push({ x: boss.x, y: boss.y + 40 });
  }
  for (const s of bossShots) {
    s.y += 200 * dt;
    // Попал в платформу — тряска и минус 20 очков
    if (s.y > PADDLE_Y - 14 && s.y < PADDLE_Y + 14 && Math.abs(s.x - paddle.x) < paddle.width / 2) {
      s.dead = true;
      game.shake = 0.25;
      playSound('crash');
      spawnParticles(s.x, PADDLE_Y, 14, '#ff4d6d', 200);
      addScore(-20);
    }
  }
  bossShots = bossShots.filter(s => !s.dead && s.y < H + 20);
}


/* ---------------------------------------------------------
   14. РИСОВАНИЕ ОДНОГО КАДРА
   --------------------------------------------------------- */

function draw() {
  ctx.save();
  if (game.shake > 0) ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
  drawBackground();
  if (game.state !== 'menu') {
    drawBricks();
    drawBoss();
    drawPaddle();
    drawBalls();
  }
  drawParticles();
  ctx.restore();
  updateBossBar();
}


/* ---------------------------------------------------------
   15. ЭКРАНЫ И ИНТЕРФЕЙС
   --------------------------------------------------------- */

const screens = {
  menu: document.getElementById('menuScreen'),
  difficulty: document.getElementById('difficultyScreen'),
  quiz: document.getElementById('quizScreen'),
  perk: document.getElementById('perkScreen'),
  settings: document.getElementById('settingsScreen'),
  pause: document.getElementById('pauseScreen'),
  over: document.getElementById('gameOverScreen')
};

function showScreen(name) {
  for (const key in screens) {
    screens[key].classList.toggle('hidden', key !== name);
  }
  const inGame = name === null || ['pause', 'quiz', 'perk'].includes(name);
  document.getElementById('hud').classList.toggle('hidden', !inGame);
  document.getElementById('menuBest').textContent = bestScore;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}

function isVisible(el) {
  return !el.classList.contains('hidden');
}

function makeChoice(icon, title, desc, onPick, key) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'choice';
  button.innerHTML = '<span class="choice-icon">' + icon + '</span><span><span class="choice-title">' + title + '</span>' +
    (desc ? '<br><span class="choice-desc">' + desc + '</span>' : '') + '</span>';
  button.title = 'Клавиша ' + key;
  button.addEventListener('click', onPick);
  return button;
}

function updateHud() {
  document.getElementById('lives').textContent = game.lives > 6 ? '❤️×' + game.lives : '❤️'.repeat(game.lives) || '💔';
  document.getElementById('score').textContent = game.score;
  document.getElementById('level').textContent = game.level;
  document.getElementById('perkChips').innerHTML = game.usedPerks
    .map(id => '<span class="chip">' + PERKS.find(p => p.id === id).icon + '</span>').join('');
}

function updateBossBar() {
  const bar = document.getElementById('bossBar');
  bar.classList.toggle('hidden', !boss || game.state === 'menu');
  if (boss) document.getElementById('bossFill').style.width = Math.max(0, boss.hp / boss.maxHp * 100) + '%';
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

function restartAnimation(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

function applyTheme() {
  const theme = currentTheme();
  const subject = findById(SUBJECTS, settings.subject);
  document.documentElement.style.setProperty('--accent', theme.accent);
  document.getElementById('menuInfo').textContent =
    theme.icon + ' ' + theme.label + ' · ' + subject.icon + ' ' + subject.label + ' · ' + findById(INPUT_MODES, settings.inputMode).label;
}


/* ---------------------------------------------------------
   16. ЭКРАН НАСТРОЕК
   --------------------------------------------------------- */

function buildOptions(containerId, items, settingName) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option' + (settings[settingName] === item.id ? ' selected' : '');
    button.innerHTML = '<span class="option-icon">' + item.icon + '</span><span class="option-title">' + item.label + '</span><span>' + item.desc + '</span>';
    button.addEventListener('click', () => {
      settings[settingName] = item.id;
      saveSettings();
      applyTheme();
      buildSettings();
    });
    container.appendChild(button);
  }
}

function buildSettings() {
  buildOptions('themeOptions', THEMES, 'theme');
  buildOptions('subjectOptions', SUBJECTS, 'subject');
  buildOptions('inputOptions', INPUT_MODES, 'inputMode');
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
  playSound('coin');
});

document.getElementById('resetBestButton').addEventListener('click', () => {
  bestScore = 0;
  saveBestScore();
  showToast('Рекорд сброшен');
});


/* ---------------------------------------------------------
   17. УПРАВЛЕНИЕ
   --------------------------------------------------------- */

document.addEventListener('keydown', (event) => {
  if (document.activeElement && document.activeElement.id === 'quizInput') return;
  const code = event.code;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(code)) event.preventDefault();

  if (code === 'ArrowLeft' || code === 'KeyA') { keys.left = true; pointerX = null; }
  if (code === 'ArrowRight' || code === 'KeyD') { keys.right = true; pointerX = null; }

  const digit = Number(event.key);
  if (digit >= 1 && digit <= 4) {
    let list = null;
    if (game.state === 'quiz') list = document.querySelectorAll('.quiz-option');
    else if (isVisible(screens.difficulty)) list = document.querySelectorAll('#difficultyChoices .choice');
    else if (game.state === 'perk') list = document.querySelectorAll('#perkChoices .choice');
    if (list && list[digit - 1]) list[digit - 1].click();
  }

  if (code === 'Space' || code === 'Enter' || code === 'ArrowUp') {
    if (isVisible(screens.menu)) openDifficultySelect();
    else if (isVisible(screens.over)) startGame();
    else if (game.state === 'playing') launchBalls();
  }
  if (code === 'Escape' || code === 'KeyP') {
    if (game.state === 'playing') pauseGame();
    else if (game.state === 'paused') resumeGame();
    else if (isVisible(screens.settings)) showScreen('menu');
  }
});

document.addEventListener('keyup', (event) => {
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') keys.left = false;
  if (event.code === 'ArrowRight' || event.code === 'KeyD') keys.right = false;
});

// Мышь и палец: платформа едет за указателем, тап — запуск шара
function toGameX(event) {
  const rect = canvas.getBoundingClientRect();
  return (event.clientX - rect.left) / rect.width * W;
}

canvas.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'mouse' || event.buttons) pointerX = toGameX(event);
});
canvas.addEventListener('pointerdown', (event) => {
  pointerX = toGameX(event);
  if (game.state === 'playing') launchBalls();
});

document.getElementById('startButton').addEventListener('click', openDifficultySelect);
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

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseGame();
});

window.addEventListener('resize', resizeGame);


/* ---------------------------------------------------------
   18. ИГРОВОЙ ЦИКЛ И ЗАПУСК
   --------------------------------------------------------- */

let lastTime = performance.now();

function loop(now) {
  let dt = (now - lastTime) / 1000;
  lastTime = now;
  if (dt > 0.05) dt = 0.05;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

document.querySelector('.title-top').textContent = LAB.titleTop;
document.querySelector('.title-bottom').textContent = LAB.titleBottom;
document.title = LAB.titleTop + ' ' + LAB.titleBottom;
resetPaddle();
resizeGame();
applyTheme();
showScreen('menu');
requestAnimationFrame(loop);
