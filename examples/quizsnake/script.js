/* =========================================================
   QUIZ SNAKE — змейка + образовательный квиз + улучшения
   Чистый JavaScript и Canvas, графика из эмодзи
   ---------------------------------------------------------
   Как устроен файл (читайте сверху вниз):
     0. Лаборатория: 10 настроек для экспериментов
     1. Данные: миры, предметы, сложность
     2. Вопросы: математика, русский, английский, история
     3. Улучшения (перки)
     4. Настройки игрока и рекорд
     5. Звуки
     6. Холст и поле
     7. Состояние игры, змейка, ответы, враги
     8. Рисование: фон, змейка, ответы, частицы
     9. Окно вопроса (для режима «Ввод»)
    10. Экран улучшений
    11. Игровые действия
    12. Обновление мира за один кадр
    13. Рисование одного кадра
    14. Экраны и интерфейс
    15. Экран настроек
    16. Управление
    17. Игровой цикл и запуск
   ========================================================= */


/* ---------------------------------------------------------
   0. ЛАБОРАТОРИЯ ИГРЫ 🧪
   Поменяй одно значение, и игра изменится!
   Сейчас здесь обычные значения: игра такая, как задумано.
   --------------------------------------------------------- */

const LAB = {
  // 1. Название игры в меню: верхнее и нижнее слово (до 8 букв)
  titleTop: 'Quiz',
  titleBottom: 'Snake',

  // 2. Своя голова змейки-эмодзи, например '🐸'. Пусто '' — голова мира
  snakeHead: '',

  // 3. Длина змейки на старте: 4 — обычно, 10 — длинная
  startLength: 4,

  // 4. Жизни: 3 — обычно, 10 — много
  lives: 3,

  // 5. Скорость змейки: 1 — обычная, 0.6 — медленная, 1.5 — быстрая
  snakeSpeed: 1,

  // 6. Сколько врагов может быть на поле: 4 — обычно, 0 — без врагов
  maxEnemies: 4,

  // 7. На сколько змейка растёт за верный ответ: 2 — обычно, 5 — сильно
  growPerAnswer: 2,

  // 8. Сквозь стены: false — стена = минус жизнь, true — выход с другой стороны
  wrapWalls: false,

  // 9. Скорость врагов: 1 — обычная, 0.5 — медленные
  enemySpeed: 1,

  // 10. Радужная змейка: false — цвет мира, true — радуга
  rainbowSnake: false
};


/* ---------------------------------------------------------
   1. ДАННЫЕ: МИРЫ, ПРЕДМЕТЫ, СЛОЖНОСТЬ
   --------------------------------------------------------- */

const THEMES = [
  {
    id: 'fantasy', icon: '🏰', label: 'Фэнтези', desc: 'Рыцари и магия',
    accent: '#FFD700', body: '#d9a600',
    sky: ['#0b1030', '#1b1f5a'], board: 'rgba(40,46,110,0.55)', cellLight: 'rgba(255,255,255,0.035)',
    head: '🐲', enemies: ['👹', '💀'], boss: { emoji: '🐉', name: 'Дракон' }
  },
  {
    id: 'space', icon: '🚀', label: 'Космос', desc: 'Лазеры и НЛО',
    accent: '#00FFFF', body: '#00a8c0',
    sky: ['#000008', '#0d0a2e'], board: 'rgba(10,20,60,0.6)', cellLight: 'rgba(0,255,255,0.04)',
    head: '🤖', enemies: ['☄️', '🛸'], boss: { emoji: '👾', name: 'Мега-Мозг' }
  },
  {
    id: 'eco', icon: '🌿', label: 'Эко-Панк', desc: 'Защита природы',
    accent: '#39FF14', body: '#22b30c',
    sky: ['#04140c', '#123d22'], board: 'rgba(10,50,25,0.6)', cellLight: 'rgba(57,255,20,0.04)',
    head: '🐛', enemies: ['🗑️', '🦗'], boss: { emoji: '🧟', name: 'Токсичный Монстр' }
  }
];

const SUBJECTS = [
  { id: 'math', icon: '🧮', label: 'Математика', desc: 'Примеры' },
  { id: 'rus',  icon: '📝', label: 'Русский', desc: 'Пропущенная буква' },
  { id: 'eng',  icon: '🔤', label: 'Английский', desc: 'Перевод слов' },
  { id: 'hist', icon: '🏛️', label: 'История России', desc: 'Даты и люди' }
];

// «Кнопки» — 4 ответа лежат на поле, съешь правильный.
// «Ввод» — съешь ❓ и напечатай ответ
const INPUT_MODES = [
  { id: 'buttons',  icon: '👆', label: 'Кнопки', desc: 'Ответы на поле' },
  { id: 'keyboard', icon: '⌨️', label: 'Ввод', desc: 'Напечатать ответ' }
];

// Сложность: через сколько секунд змейка делает шаг и скорость врагов
const DIFFICULTIES = [
  { id: 'easy',   icon: '🙂', label: 'Легко',     desc: 'Спокойная змейка',         step: 0.18, enemy: 0.75, score: 1 },
  { id: 'normal', icon: '😎', label: 'Нормально', desc: 'Быстрее, очки ×1.5',        step: 0.14, enemy: 0.6,  score: 1.5 },
  { id: 'hard',   icon: '😈', label: 'Сложно',    desc: 'Очень быстро, очки ×2',     step: 0.11, enemy: 0.45, score: 2 }
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
   3. УЛУЧШЕНИЯ (ПЕРКИ)
   Каждые 3 верных ответа — новый уровень и выбор улучшения.
   Каждое можно взять один раз за игру
   --------------------------------------------------------- */

const PERKS = [
  { id: 'slow',   icon: '🐢', title: 'Спокойнее',        desc: 'Змейка на 15% медленнее',           apply: p => { p.stepBonus *= 1.15; } },
  { id: 'life',   icon: '❤️', title: '+1 жизнь',         desc: 'Ещё одна попытка',                  apply: p => { game.lives++; } },
  { id: 'wrap',   icon: '🌀', title: 'Сквозь стены',     desc: 'Выход с другой стороны поля',       apply: p => { p.wrap = true; } },
  { id: 'shield', icon: '🛡️', title: 'Щит',              desc: 'Один удар врага не страшен',        apply: p => { p.shield = true; } },
  { id: 'hint',   icon: '✂️', title: 'Подсказка 50/50',  desc: 'Неверных ответов на поле меньше',   apply: p => { p.hint = true; } },
  { id: 'score',  icon: '⭐', title: 'Двойные очки',     desc: 'Очки ×2',                           apply: p => { p.scoreMult *= 2; } },
  { id: 'freeze', icon: '❄️', title: 'Заморозка',        desc: 'Враги ходят медленнее',             apply: p => { p.enemySlow *= 1.6; } },
  { id: 'fruit',  icon: '🍎', title: 'Фрукты',           desc: 'На поле появляются яблоки',         apply: p => { p.fruit = true; } },
  { id: 'armor',  icon: '🦴', title: 'Гибкий хвост',     desc: 'Можно проходить сквозь себя',       apply: p => { p.armor = true; } },
  { id: 'hunter', icon: '🍽️', title: 'Охотник',          desc: 'Можно съедать врагов',              apply: p => { p.hunter = true; } },
  { id: 'safe',   icon: '⏳', title: 'Долгая защита',    desc: 'После промаха 4 с неуязвимости',   apply: p => { p.safeTime = 4; } },
  { id: 'short',  icon: '✂️', title: 'Короче хвост',     desc: 'Змейка короче на 3',                apply: p => { snake.splice(Math.max(3, snake.length - 3)); } }
];


/* ---------------------------------------------------------
   4. НАСТРОЙКИ ИГРОКА И РЕКОРД
   --------------------------------------------------------- */

const DEFAULT_SETTINGS = {
  theme: 'eco',
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
    const saved = JSON.parse(localStorage.getItem('quizsnake-settings'));
    return Object.assign({}, DEFAULT_SETTINGS, saved);
  } catch (error) {
    return Object.assign({}, DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  try {
    localStorage.setItem('quizsnake-settings', JSON.stringify(settings));
  } catch (error) {
    // Если браузер запретил сохранение — просто играем без него
  }
}

function loadBestScore() {
  try {
    return Number(localStorage.getItem('quizsnake-best')) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore() {
  try {
    localStorage.setItem('quizsnake-best', String(bestScore));
  } catch (error) {
    // ничего страшного
  }
}


/* ---------------------------------------------------------
   5. ЗВУКИ (Web Audio — звук играет мгновенно)
   --------------------------------------------------------- */

const isCodePen = location.hostname.includes('codepen') || location.hostname.includes('cdpn.io');
const SOUND_PATH = isCodePen ? 'https://si0683.github.io/QuizSnake/sound/' : 'sound/';

const SOUND_FILES = {
  jump:  'jump.wav',   // съели фрукт или врага
  coin:  'coin.mp3',   // верный ответ
  tick:  'tick.wav',   // отсчёт
  start: 'start.wav',  // новый уровень, босс
  crash: 'crash.wav'   // минус жизнь
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
   6. ХОЛСТ И ПОЛЕ
   Поле — сетка 20 × 13 клеток по 40 «игровых пикселей».
   Сверху полоса 64 пикселя для панели с вопросом.
   --------------------------------------------------------- */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const stage = document.getElementById('stage');

const CELL = 40;
const COLS = 20;
const ROWS = 13;
const TOP = 64;                 // отступ сверху под панель
const W = COLS * CELL;          // 800
const H = TOP + ROWS * CELL;    // 584
let scale = 1;

function resizeGame() {
  scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  stage.style.width = W * scale + 'px';
  stage.style.height = H * scale + 'px';
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(W * scale * ratio);
  canvas.height = Math.round(H * scale * ratio);
  ctx.setTransform(scale * ratio, 0, 0, scale * ratio, 0, 0);
}

// Центр клетки в пикселях
function cellX(c) { return c * CELL + CELL / 2; }
function cellY(r) { return TOP + r * CELL + CELL / 2; }


/* ---------------------------------------------------------
   7. СОСТОЯНИЕ ИГРЫ, ЗМЕЙКА, ОТВЕТЫ, ВРАГИ
   --------------------------------------------------------- */

// Состояния: 'menu', 'choose', 'countdown', 'playing',
// 'quiz' (вопрос в режиме «Ввод»), 'perk', 'paused', 'over'
const game = {
  state: 'menu',
  score: 0,
  lives: 0,         // ставится из LAB.lives при старте
  level: 1,
  correct: 0,        // верных ответов
  time: 0,
  stepTimer: 0,
  grow: 0,           // на сколько клеток змейка ещё вырастет
  safe: 0,           // секунды неуязвимости
  flash: 0,          // красная вспышка поля
  usedPerks: []
};

let perks = null;    // эффекты взятых улучшений

function resetPerks() {
  perks = {
    stepBonus: 1, wrap: LAB.wrapWalls, shield: false, hint: false, scoreMult: 1,
    enemySlow: 1, fruit: false, armor: false, hunter: false, safeTime: 2
  };
}

let snake = [];        // клетки змейки, [0] — голова: { c, r }
let direction = { x: 1, y: 0 };
let turnQueue = [];    // повороты, нажатые между шагами
let tokens = [];       // ответы на поле: { c, r, text, correct }
let enemies = [];      // { c, r, emoji, timer, boss, life }
let fruits = [];       // { c, r }
let particles = [];
let currentQuestion = null;

function headEmoji() {
  return LAB.snakeHead || currentTheme().head;
}

// Свободна ли клетка (нет змейки, ответов, врагов)
function isFree(c, r) {
  return !snake.some(s => s.c === c && s.r === r) &&
    !tokens.some(t => t.c === c && t.r === r) &&
    !enemies.some(e => e.c === c && e.r === r) &&
    !fruits.some(f => f.c === c && f.r === r);
}

// Случайная свободная клетка подальше от головы
function randomFreeCell(minDistance) {
  const head = snake[0] || { c: 10, r: 6 };
  for (let tries = 0; tries < 300; tries++) {
    const c = Math.floor(Math.random() * COLS);
    const r = Math.floor(Math.random() * ROWS);
    const far = Math.abs(c - head.c) + Math.abs(r - head.r) >= minDistance;
    if (far && isFree(c, r)) return { c: c, r: r };
  }
  return { c: 0, r: 0 };
}

function placeSnake(length) {
  snake = [];
  const r = Math.floor(ROWS / 2);
  for (let i = 0; i < length; i++) snake.push({ c: 6 - i, r: r });
  direction = { x: 1, y: 0 };
  turnQueue = [];
}

// Новый вопрос: ответы на поле или один ❓
function newQuestion() {
  tokens = [];
  currentQuestion = nextQuestion();
  if (settings.inputMode === 'keyboard') {
    const cell = randomFreeCell(5);
    tokens.push({ c: cell.c, r: cell.r, text: '❓', quiz: true });
  } else {
    // С подсказкой 50/50 на поле только 2 ответа: верный и один неверный
    let options = currentQuestion.options;
    if (perks.hint) {
      const wrong = options.filter(o => normalize(o) !== normalize(currentQuestion.answer));
      options = shuffle([currentQuestion.answer, wrong[0]]);
    }
    for (const text of options) {
      // Пузыри с длинными ответами не ставим вплотную друг к другу
      let cell = randomFreeCell(5);
      for (let tries = 0; tries < 60; tries++) {
        const tooClose = tokens.some(t => Math.abs(t.c - cell.c) < 4 && Math.abs(t.r - cell.r) < 2);
        if (!tooClose) break;
        cell = randomFreeCell(5);
      }
      tokens.push({ c: cell.c, r: cell.r, text: text, correct: isRightAnswer(currentQuestion, text) });
    }
  }
  updateBanner();
}

function spawnEnemy(isBoss) {
  const theme = currentTheme();
  const cell = randomFreeCell(7);
  enemies.push({
    c: cell.c, r: cell.r,
    emoji: isBoss ? theme.boss.emoji : theme.enemies[Math.floor(Math.random() * theme.enemies.length)],
    timer: 1,
    boss: isBoss,
    life: isBoss ? 15 : Infinity    // босс уходит через 15 секунд
  });
}


/* ---------------------------------------------------------
   8. РИСОВАНИЕ: ФОН, ЗМЕЙКА, ОТВЕТЫ, ЧАСТИЦЫ
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
  const n = parseInt(color.slice(1), 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
}

function drawBackground() {
  const theme = currentTheme();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, theme.sky[0]);
  g.addColorStop(1, theme.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Мерцающие звёзды или светлячки
  for (let i = 0; i < 60; i++) {
    ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(game.time * 1.5 + i));
    drawCircle(seeded(i) * W, seeded(i + 50) * H, 0.8 + seeded(i + 9) * 1.4, theme.id === 'eco' ? '#9dff8a' : '#ffffff');
  }
  ctx.globalAlpha = 1;

  // Игровое поле: шахматка
  ctx.fillStyle = game.flash > 0 ? 'rgba(255,60,90,' + (0.25 + game.flash) + ')' : theme.board;
  ctx.fillRect(0, TOP, W, ROWS * CELL);
  ctx.fillStyle = theme.cellLight;
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if ((c + r) % 2 === 0) ctx.fillRect(c * CELL, TOP + r * CELL, CELL, CELL);
    }
  }
  // Рамка: если стены «проходимые» — пунктир
  ctx.strokeStyle = hexToRgba(theme.accent, 0.7);
  ctx.lineWidth = 3;
  ctx.setLineDash(perks && perks.wrap ? [10, 8] : []);
  ctx.strokeRect(1.5, TOP + 1.5, W - 3, ROWS * CELL - 3);
  ctx.setLineDash([]);
}

function drawSnake() {
  const theme = currentTheme();
  // Тело рисуем с хвоста, чтобы голова была сверху
  for (let i = snake.length - 1; i >= 1; i--) {
    const s = snake[i];
    const x = cellX(s.c);
    const y = cellY(s.r);
    const size = CELL * (0.42 - i / snake.length * 0.12);
    const color = LAB.rainbowSnake ? 'hsl(' + ((i * 25 + game.time * 120) % 360) + ', 90%, 55%)' : (i % 2 ? theme.accent : theme.body);
    drawCircle(x, y, size, color);
    drawCircle(x - size * 0.3, y - size * 0.3, size * 0.3, 'rgba(255,255,255,0.35)');
  }
  const head = snake[0];
  if (!head) return;
  // Неуязвимость — змейка мигает
  if (game.safe > 0 && Math.floor(game.time * 10) % 2 === 0) ctx.globalAlpha = 0.4;
  drawGlow(cellX(head.c), cellY(head.r), CELL, hexToRgba(theme.accent, 0.5));
  drawEmoji(headEmoji(), cellX(head.c), cellY(head.r), CELL * 0.95);
  if (perks.shield) {
    ctx.strokeStyle = 'rgba(127,220,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cellX(head.c), cellY(head.r), CELL * 0.62, 0, TAU);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Ответ на поле — светящийся пузырь с текстом
function drawTokens() {
  const theme = currentTheme();
  const pulse = 1 + Math.sin(game.time * 4) * 0.06;
  for (const t of tokens) {
    const x = cellX(t.c);
    const y = cellY(t.r);
    if (t.quiz) {
      drawGlow(x, y, CELL * 1.1, 'rgba(255,215,0,0.5)');
      drawEmoji('❓', x, y, CELL * 0.9 * pulse);
      continue;
    }
    drawGlow(x, y, CELL * 1.1, hexToRgba(theme.accent, 0.35));
    ctx.fillStyle = 'rgba(10,14,40,0.9)';
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    // Ширина пузыря зависит от длины текста
    ctx.font = 'bold 18px "Russo One", Rubik, sans-serif';
    const width = Math.max(CELL * 0.9, ctx.measureText(t.text).width + 14) * pulse;
    ctx.beginPath();
    ctx.roundRect(x - width / 2, y - CELL * 0.4 * pulse, width, CELL * 0.8 * pulse, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.text, x, y + 1);
  }
}

function drawEnemies() {
  for (const e of enemies) {
    const x = cellX(e.c);
    const y = cellY(e.r);
    if (e.boss) drawGlow(x, y, CELL * 1.4, 'rgba(255,60,90,0.45)');
    if (perks.hunter) drawGlow(x, y, CELL, 'rgba(57,255,120,0.35)'); // можно съесть
    drawEmoji(e.emoji, x, y, CELL * (e.boss ? 1.25 : 0.9));
  }
  for (const f of fruits) drawEmoji('🍎', cellX(f.c), cellY(f.r), CELL * 0.8);
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
    p.vy += 150 * dt;
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
   9. ОКНО ВОПРОСА (для режима «Ввод»: съели ❓)
   --------------------------------------------------------- */

let quizLocked = false;

function openQuiz() {
  game.state = 'quiz';
  quizLocked = false;
  const subject = findById(SUBJECTS, settings.subject);
  document.getElementById('quizSubject').textContent = subject.icon + ' ' + subject.label;
  document.getElementById('quizQuestion').innerHTML = currentQuestion.text +
    (currentQuestion.hint ? '<small>' + currentQuestion.hint + '</small>' : '');
  // Длинный вопрос (история) — шрифт поменьше
  document.getElementById('quizQuestion').classList.toggle('long', currentQuestion.text.length > 12);
  document.getElementById('quizOptions').classList.toggle('long', currentQuestion.options.some(o => o.length > 9));
  document.getElementById('quizHint').textContent = perks.hint
    ? 'Подсказка: начинается на «' + String(currentQuestion.answer)[0] + '»'
    : 'Верный ответ — змейка растёт!';
  document.getElementById('quizCard').classList.remove('flash-bad', 'flash-good');
  document.getElementById('quizOptions').classList.add('hidden');
  document.getElementById('quizForm').classList.remove('hidden');
  const inputEl = document.getElementById('quizInput');
  inputEl.value = '';
  inputEl.inputMode = currentQuestion.numeric ? 'numeric' : 'text';
  showScreen('quiz');
  setTimeout(() => inputEl.focus(), 50);
}

function answerQuiz(text) {
  if (quizLocked || game.state !== 'quiz') return;
  quizLocked = true;
  const correct = isRightAnswer(currentQuestion, text);
  restartAnimation(document.getElementById('quizCard'), correct ? 'flash-good' : 'flash-bad');
  if (correct) {
    setTimeout(() => {
      game.state = 'playing';
      showScreen(null);
      rightAnswer(snake[0]);
    }, 500);
  } else {
    playSound('crash');
    document.getElementById('quizHint').textContent = 'Правильно: ' + currentQuestion.answer;
    setTimeout(() => {
      game.state = 'playing';
      showScreen(null);
      wrongAnswer(snake[0]);
    }, 1100);
  }
}

document.getElementById('quizForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const value = document.getElementById('quizInput').value;
  if (value.trim()) answerQuiz(value);
});


/* ---------------------------------------------------------
   10. ЭКРАН УЛУЧШЕНИЙ
   --------------------------------------------------------- */

let perkOffer = [];

function openPerks() {
  const free = PERKS.filter(perk => !game.usedPerks.includes(perk.id));
  if (free.length === 0) return;
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
  perk.apply(perks);
  game.usedPerks.push(perk.id);
  playSound('start');
  showToast(perk.icon + ' ' + perk.title);
  game.state = 'playing';
  game.safe = 1;   // секунда, чтобы осмотреться
  showScreen(null);
  // С подсказкой сразу убираем лишние ответы
  if (perk.id === 'hint') newQuestion();
  updateHud();
}


/* ---------------------------------------------------------
   11. ИГРОВЫЕ ДЕЙСТВИЯ
   --------------------------------------------------------- */

function addScore(points) {
  game.score += Math.round(points * difficulty().score * perks.scoreMult);
}

// Съели верный ответ
function rightAnswer(cell) {
  game.correct++;
  game.grow += LAB.growPerAnswer;
  addScore(10 * game.level);
  playSound('coin');
  spawnParticles(cellX(cell.c), cellY(cell.r), 24, currentTheme().accent, 220);
  showToast('Верно! +' + LAB.growPerAnswer);
  newQuestion();

  // Каждые 3 верных ответа — новый уровень: быстрее, ещё враг, улучшение
  if (game.correct % 3 === 0) {
    game.level++;
    if (enemies.filter(e => !e.boss).length < LAB.maxEnemies) spawnEnemy(false);
    if (game.correct % 9 === 0) {
      spawnEnemy(true);
      showToast('Босс: ' + currentTheme().boss.name + '!');
    }
    openPerks();
  }
  updateHud();
}

// Съели неверный ответ: минус жизнь и подсказка
function wrongAnswer(cell) {
  showToast('Правильно: ' + currentQuestion.answer);
  loseLife(false);
  if (game.state !== 'over') newQuestion();
}

// Минус жизнь. respawn — вернуть змейку в центр (после стены или врага)
function loseLife(respawn) {
  game.lives--;
  game.flash = 0.4;
  playSound('crash');
  const head = snake[0];
  spawnParticles(cellX(head.c), cellY(head.r), 26, '#ff4d6d', 240);
  if (game.lives <= 0) {
    game.lives = 0;
    gameOver();
    return;
  }
  if (respawn) {
    placeSnake(Math.max(LAB.startLength, snake.length));
    // Враги рядом с центром отходят
    enemies = enemies.filter(e => Math.abs(e.c - 5) + Math.abs(e.r - 6) > 4);
  }
  game.safe = perks.safeTime;
  updateHud();
}

// Удар врага: щит может спасти
function hitByEnemy(enemy) {
  if (game.safe > 0) return;
  if (perks.hunter && !enemy.boss) {
    enemies = enemies.filter(e => e !== enemy);
    addScore(20);
    game.grow += 1;
    playSound('jump');
    spawnParticles(cellX(enemy.c), cellY(enemy.r), 18, '#39d97a', 200);
    setTimeout(() => { if (game.state === 'playing') spawnEnemy(false); }, 3000);
    return;
  }
  if (perks.shield) {
    perks.shield = false;
    game.safe = 1.5;
    showToast('🛡️ Щит!');
    return;
  }
  loseLife(true);
}

function gameOver() {
  game.state = 'over';
  const isRecord = game.score > bestScore;
  if (isRecord) {
    bestScore = game.score;
    saveBestScore();
  }
  document.getElementById('finalScore').textContent = game.score;
  document.getElementById('finalLength').textContent = snake.length;
  document.getElementById('finalAnswers').textContent = game.correct;
  document.getElementById('finalBest').textContent = bestScore;
  document.getElementById('newRecord').classList.toggle('hidden', !isRecord || game.score === 0);
  setTimeout(() => showScreen('over'), 700);
}

function resetGame() {
  resetPerks();
  game.score = 0;
  game.lives = LAB.lives;
  game.level = 1;
  game.correct = 0;
  game.grow = 0;
  game.safe = 0;
  game.flash = 0;
  game.stepTimer = 0;
  game.usedPerks = [];
  tokens = [];
  enemies = [];
  fruits = [];
  particles = [];
  placeSnake(LAB.startLength);
  buildQuestionPool();
  newQuestion();
  if (LAB.maxEnemies > 0) spawnEnemy(false);
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
  game.state = 'menu';
  showScreen('menu');
}

// Поворот: нельзя развернуться назад, в себя
function turn(x, y) {
  const last = turnQueue.length ? turnQueue[turnQueue.length - 1] : direction;
  if (last.x === -x && last.y === -y) return;
  if (last.x === x && last.y === y) return;
  if (turnQueue.length < 2) turnQueue.push({ x: x, y: y });
}


/* ---------------------------------------------------------
   12. ОБНОВЛЕНИЕ МИРА ЗА ОДИН КАДР
   Змейка двигается шагами по клеткам: раз в stepTime секунд
   --------------------------------------------------------- */

function stepTime() {
  const base = difficulty().step / LAB.snakeSpeed * perks.stepBonus;
  return Math.max(0.06, base * Math.pow(0.95, game.level - 1));
}

function update(dt) {
  if (['quiz', 'perk', 'paused'].includes(game.state)) return;
  game.time += dt;
  updateParticles(dt);
  if (game.flash > 0) game.flash -= dt;
  if (game.state !== 'playing') return;
  if (game.safe > 0) game.safe -= dt;

  game.stepTimer += dt;
  if (game.stepTimer >= stepTime()) {
    game.stepTimer = 0;
    moveSnake();
  }
  if (game.state === 'playing') updateEnemies(dt);
}

function moveSnake() {
  if (turnQueue.length) direction = turnQueue.shift();
  const head = snake[0];
  let c = head.c + direction.x;
  let r = head.r + direction.y;

  // Стены
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) {
    if (perks.wrap) {
      c = (c + COLS) % COLS;
      r = (r + ROWS) % ROWS;
    } else {
      loseLife(true);
      return;
    }
  }

  // Врезались в себя
  if (!perks.armor && game.safe <= 0 && snake.some((s, i) => i > 0 && i < snake.length - 1 && s.c === c && s.r === r)) {
    loseLife(true);
    return;
  }

  snake.unshift({ c: c, r: r });
  if (game.grow > 0) game.grow--;
  else snake.pop();

  // Съели ответ?
  const token = tokens.find(t => t.c === c && t.r === r);
  if (token) {
    if (token.quiz) {
      tokens = [];
      openQuiz();
    } else if (token.correct) {
      rightAnswer(token);
    } else {
      wrongAnswer(token);
    }
  }

  // Съели фрукт?
  const fruit = fruits.find(f => f.c === c && f.r === r);
  if (fruit) {
    fruits = fruits.filter(f => f !== fruit);
    game.grow += 1;
    addScore(5);
    playSound('jump');
    spawnParticles(cellX(c), cellY(r), 12, '#ff5c5c', 160);
  }
  if (perks.fruit && fruits.length < 2 && Math.random() < 0.02) fruits.push(randomFreeCell(3));

  // Наткнулись на врага?
  const enemy = enemies.find(e => e.c === c && e.r === r);
  if (enemy) hitByEnemy(enemy);
  updateHud();
}

// Враги ходят по клеткам: обычные — случайно, босс — за головой
function updateEnemies(dt) {
  const head = snake[0];
  for (const e of enemies) {
    e.life -= dt;
    e.timer -= dt;
    if (e.timer > 0) continue;
    e.timer = difficulty().enemy / LAB.enemySpeed * perks.enemySlow * (e.boss ? 0.8 : 1);
    let options = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    if (e.boss) {
      // Босс выбирает шаг, который ближе к голове змейки
      options.sort((a, b) =>
        (Math.abs(e.c + a[0] - head.c) + Math.abs(e.r + a[1] - head.r)) -
        (Math.abs(e.c + b[0] - head.c) + Math.abs(e.r + b[1] - head.r)));
    } else {
      options = shuffle(options);
    }
    for (const [dx, dy] of options) {
      const c = e.c + dx;
      const r = e.r + dy;
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS) continue;
      if (tokens.some(t => t.c === c && t.r === r)) continue;
      if (enemies.some(o => o !== e && o.c === c && o.r === r)) continue;
      e.c = c;
      e.r = r;
      break;
    }
    if (e.c === head.c && e.r === head.r) hitByEnemy(e);
    if (game.state !== 'playing') return;
  }
  // Босс уходит, когда время вышло
  enemies = enemies.filter(e => e.life > 0);
}


/* ---------------------------------------------------------
   13. РИСОВАНИЕ ОДНОГО КАДРА
   --------------------------------------------------------- */

function draw() {
  drawBackground();
  if (game.state !== 'menu' && snake.length) {
    drawTokens();
    drawEnemies();
    drawSnake();
  }
  drawParticles();
}


/* ---------------------------------------------------------
   14. ЭКРАНЫ И ИНТЕРФЕЙС
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

function updateBanner() {
  const banner = document.getElementById('questionBanner');
  // Длинный вопрос (история) — в две строки, шрифт меньше
  banner.classList.toggle('long', settings.inputMode !== 'keyboard' && currentQuestion.text.length > 12);
  if (settings.inputMode === 'keyboard') {
    banner.innerHTML = 'Съешь ❓<small>и ответь на вопрос</small>';
  } else {
    banner.innerHTML = currentQuestion.text + (currentQuestion.hint ? '<small>' + currentQuestion.hint + '</small>' : '<small>Съешь правильный ответ</small>');
  }
}

function updateHud() {
  document.getElementById('lives').textContent = game.lives > 6 ? '❤️×' + game.lives : '❤️'.repeat(game.lives) || '💔';
  document.getElementById('score').textContent = game.score;
  document.getElementById('length').textContent = snake.length;
  document.getElementById('level').textContent = game.level;
  document.getElementById('perkChips').innerHTML = game.usedPerks
    .map(id => '<span class="chip">' + PERKS.find(p => p.id === id).icon + '</span>').join('');
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
   15. ЭКРАН НАСТРОЕК
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
   16. УПРАВЛЕНИЕ
   --------------------------------------------------------- */

document.addEventListener('keydown', (event) => {
  if (document.activeElement && document.activeElement.id === 'quizInput') return;
  const code = event.code;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(code)) event.preventDefault();

  if (game.state === 'playing' || game.state === 'countdown') {
    if (code === 'ArrowLeft' || code === 'KeyA') turn(-1, 0);
    if (code === 'ArrowRight' || code === 'KeyD') turn(1, 0);
    if (code === 'ArrowUp' || code === 'KeyW') turn(0, -1);
    if (code === 'ArrowDown' || code === 'KeyS') turn(0, 1);
  }

  const digit = Number(event.key);
  if (digit >= 1 && digit <= 3) {
    let list = null;
    if (isVisible(screens.difficulty)) list = document.querySelectorAll('#difficultyChoices .choice');
    else if (game.state === 'perk') list = document.querySelectorAll('#perkChoices .choice');
    if (list && list[digit - 1]) list[digit - 1].click();
  }

  if (code === 'Space' || code === 'Enter') {
    if (isVisible(screens.menu)) openDifficultySelect();
    else if (isVisible(screens.over)) startGame();
  }
  if (code === 'Escape' || code === 'KeyP') {
    if (game.state === 'playing') pauseGame();
    else if (game.state === 'paused') resumeGame();
    else if (isVisible(screens.settings)) showScreen('menu');
  }
});

// Свайпы: запоминаем, где палец коснулся, и куда сдвинулся
let swipeStart = null;

canvas.addEventListener('pointerdown', (event) => {
  swipeStart = { x: event.clientX, y: event.clientY };
});

canvas.addEventListener('pointerup', (event) => {
  if (!swipeStart) return;
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0);
  else turn(0, dy > 0 ? 1 : -1);
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
   17. ИГРОВОЙ ЦИКЛ И ЗАПУСК
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
resetPerks();
resizeGame();
applyTheme();
showScreen('menu');
requestAnimationFrame(loop);
