/* =========================================================
   QUIZ TOWER — оборона замка + образовательный квиз
   Чистый JavaScript и Canvas, графика из эмодзи
   ---------------------------------------------------------
   Как устроен файл (читайте сверху вниз):
     0. Лаборатория: 10 настроек для экспериментов
     1. Данные: миры, башни, предметы, сложность
     2. Вопросы: математика, русский, английский, история
     3. Улучшения после волны
     4. Настройки игрока и рекорд
     5. Звуки
     6. Холст и карта
     7. Состояние игры, враги, башни, снаряды
     8. Рисование: карта, башни, враги, частицы
     9. Окно вопроса (квиз)
    10. Экран улучшений
    11. Игровые действия: башни, волны, урон
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
  titleBottom: 'Tower',

  // 2. Монеты на старте: 120 — обычно, 1000 — богатый старт
  startCoins: 120,

  // 3. Жизни замка: 20 — обычно, 50 — крепость
  baseLives: 20,

  // 4. Монеты за верный ответ: 50 — обычно, 200 — щедро
  questionReward: 50,

  // 5. Сила башен: 1 — обычная, 2 — в два раза сильнее
  towerPower: 1,

  // 6. Скорость врагов: 1 — обычная, 0.5 — медленные, 1.5 — быстрые
  enemySpeed: 1,

  // 7. Врагов в первой волне: 6 — обычно, 15 — толпа
  waveSize: 6,

  // 8. Босс приходит каждые N волн: 5 — обычно, 2 — часто
  bossEvery: 5,

  // 9. Бесплатные башни: false — за монеты, true — даром
  freeTowers: false,

  // 10. Радужные снаряды: false — цвет мира, true — радуга
  rainbowShots: false
};


/* ---------------------------------------------------------
   1. ДАННЫЕ: МИРЫ, БАШНИ, ПРЕДМЕТЫ, СЛОЖНОСТЬ
   --------------------------------------------------------- */

// Три вида башен:
//   fast   — быстро стреляет по одному врагу
//   splash — медленно, но бьёт по всем рядом с целью
//   slow   — слабый урон, зато замедляет врагов
// cost — цена, damage — урон, range — дальность (пикс),
// rate — выстрелов в секунду
const TOWER_KINDS = {
  fast:   { cost: 50, damage: 8,  range: 140, rate: 2.0, desc: 'Быстрые выстрелы' },
  splash: { cost: 80, damage: 14, range: 125, rate: 0.8, splash: 60, desc: 'Урон по площади' },
  slow:   { cost: 60, damage: 4,  range: 115, rate: 1.2, slow: 0.5, desc: 'Замедляет врагов' }
};

// Цена улучшения башни до 2 и до 3 уровня
const UPGRADE_COST = [0, 70, 120];

const THEMES = [
  {
    id: 'fantasy', icon: '🏰', label: 'Фэнтези', desc: 'Рыцари и магия',
    accent: '#FFD700',
    ground: '#17213d', groundDots: 'rgba(120,140,255,0.08)', path: '#4b4566', pathEdge: '#2e2a45',
    base: { emoji: '🏰', name: 'Замок' },
    towers: { fast: { emoji: '🏹', name: 'Лучник' }, splash: { emoji: '🔮', name: 'Маг' }, slow: { emoji: '❄️', name: 'Ледяная' } },
    enemies: ['👹', '💀'],
    boss: { emoji: '🐉', name: 'Дракон' },
    props: ['🌲', '🪨', '🌲', '🍄']
  },
  {
    id: 'space', icon: '🚀', label: 'Космос', desc: 'Лазеры и НЛО',
    accent: '#00FFFF',
    ground: '#070a1c', groundDots: 'rgba(0,255,255,0.06)', path: '#16224a', pathEdge: '#00b7c7',
    base: { emoji: '🛰️', name: 'Станция' },
    towers: { fast: { emoji: '🔫', name: 'Лазер' }, splash: { emoji: '🚀', name: 'Ракеты' }, slow: { emoji: '🧊', name: 'Крио' } },
    enemies: ['☄️', '🛸'],
    boss: { emoji: '👾', name: 'Мега-Мозг' },
    props: ['🪐', '✨', '🌑', '✨']
  },
  {
    id: 'eco', icon: '🌿', label: 'Эко-Панк', desc: 'Защита природы',
    accent: '#39FF14',
    ground: '#0c2516', groundDots: 'rgba(57,255,20,0.06)', path: '#4a3a26', pathEdge: '#2c2216',
    base: { emoji: '🌳', name: 'Древо' },
    towers: { fast: { emoji: '🌵', name: 'Кактус' }, splash: { emoji: '🍄', name: 'Гриб' }, slow: { emoji: '💧', name: 'Родник' } },
    enemies: ['🗑️', '🦗'],
    boss: { emoji: '🧟', name: 'Токсичный Монстр' },
    props: ['🌿', '🌼', '🌲', '🪵']
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

// Сложность: здоровье и скорость врагов, множитель очков
const DIFFICULTIES = [
  { id: 'easy',   icon: '🙂', label: 'Легко',     desc: 'Слабые враги',            enemyHp: 0.8, speed: 0.9, score: 1 },
  { id: 'normal', icon: '😎', label: 'Нормально', desc: 'Честная битва, очки ×1.5', enemyHp: 1.2, speed: 1.05, score: 1.5 },
  { id: 'hard',   icon: '😈', label: 'Сложно',    desc: 'Толстые враги, очки ×2',   enemyHp: 1.7, speed: 1.2, score: 2 }
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
   3. УЛУЧШЕНИЯ ПОСЛЕ ВОЛНЫ
   Верный ответ на бонусный вопрос → 3 случайных улучшения.
   Каждое можно взять один раз за игру
   --------------------------------------------------------- */

const PERKS = [
  { id: 'dmg',    icon: '💥', title: 'Урон +25%',         desc: 'Все башни бьют сильнее',         apply: b => { b.damage *= 1.25; } },
  { id: 'rate',   icon: '⚡', title: 'Скорострельность',  desc: 'Башни стреляют на 20% чаще',     apply: b => { b.rate *= 1.2; } },
  { id: 'range',  icon: '🔭', title: 'Дальность +15%',    desc: 'Башни видят дальше',             apply: b => { b.range *= 1.15; } },
  { id: 'coins',  icon: '🪙', title: 'Богатая добыча',    desc: 'Монеты за врагов +50%',          apply: b => { b.coins *= 1.5; } },
  { id: 'lives',  icon: '❤️', title: 'Крепкие стены',     desc: '+5 жизней базы',                 apply: b => { game.lives += 5; } },
  { id: 'sale',   icon: '🏷️', title: 'Скидка 20%',        desc: 'Башни и улучшения дешевле',      apply: b => { b.cost *= 0.8; } },
  { id: 'frost',  icon: '❄️', title: 'Морозные снаряды',  desc: 'Все башни немного замедляют',    apply: b => { b.frost = true; } },
  { id: 'crit',   icon: '🍀', title: 'Крит 20%',          desc: 'Шанс двойного урона',            apply: b => { b.crit += 0.2; } },
  { id: 'blast',  icon: '💣', title: 'Взрыв врага',       desc: 'Побеждённый враг ранит соседей', apply: b => { b.blast = true; } },
  { id: 'nerd',   icon: '🎓', title: 'Отличник',          desc: '+25 монет за каждый ответ',      apply: b => { b.questionBonus += 25; } },
  { id: 'poison', icon: '☠️', title: 'Яд',                desc: 'Снаряды отравляют врагов',       apply: b => { b.poison = true; } },
  { id: 'double', icon: '🔁', title: 'Двойной выстрел',   desc: '15% шанс выстрелить дважды',     apply: b => { b.double += 0.15; } },
  { id: 'magnet', icon: '🧲', title: 'Магнит',            desc: '+40 монет в начале волны',       apply: b => { b.waveIncome += 40; } },
  { id: 'boss',   icon: '👑', title: 'Охотник на боссов', desc: 'Урон по боссам +50%',            apply: b => { b.bossDamage *= 1.5; } },
  { id: 'repair', icon: '🛠️', title: 'Ремонт',            desc: '+10 жизней базы',                apply: b => { game.lives += 10; } }
];


/* ---------------------------------------------------------
   4. НАСТРОЙКИ ИГРОКА И РЕКОРД
   --------------------------------------------------------- */

const DEFAULT_SETTINGS = {
  theme: 'fantasy',
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
    const saved = JSON.parse(localStorage.getItem('quiztower-settings'));
    return Object.assign({}, DEFAULT_SETTINGS, saved);
  } catch (error) {
    return Object.assign({}, DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  try {
    localStorage.setItem('quiztower-settings', JSON.stringify(settings));
  } catch (error) {
    // Если браузер запретил сохранение — просто играем без него
  }
}

function loadBestScore() {
  try {
    return Number(localStorage.getItem('quiztower-best')) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore() {
  try {
    localStorage.setItem('quiztower-best', String(bestScore));
  } catch (error) {
    // ничего страшного
  }
}


/* ---------------------------------------------------------
   5. ЗВУКИ (Web Audio — звук играет мгновенно)
   В CodePen своей папки нет — звуки берутся с GitHub Pages
   --------------------------------------------------------- */

const isCodePen = location.hostname.includes('codepen') || location.hostname.includes('cdpn.io');
const SOUND_PATH = isCodePen ? 'https://si0683.github.io/QuizTowerDefense/sound/' : 'sound/';

const SOUND_FILES = {
  jump:  'jump.wav',   // башня построена
  coin:  'coin.mp3',   // верный ответ, монеты
  tick:  'tick.wav',   // начало волны
  start: 'start.wav',  // улучшение, босс
  crash: 'crash.wav'   // враг дошёл до базы, неверный ответ
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
   6. ХОЛСТ И КАРТА
   Карта — сетка 16 × 10 клеток по 60 «игровых пикселей».
   Дорога задаётся точками-поворотами, места для башен — списком.
   --------------------------------------------------------- */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const stage = document.getElementById('stage');

const CELL = 60;
const COLS = 16;
const ROWS = 10;
const W = COLS * CELL;  // 960
const H = ROWS * CELL;  // 600
let scale = 1;

// Повороты дороги (столбец, строка). Первая точка — за краем карты
const WAYPOINTS = [[-1, 3], [3, 3], [3, 7], [7, 7], [7, 2], [11, 2], [11, 7], [14, 7], [14, 4], [15, 4]];

// Места, где можно строить башни
const PADS = [[2, 2], [4, 4], [2, 6], [5, 6], [6, 4], [8, 3], [9, 1], [10, 4], [12, 4], [13, 6], [12, 8], [8, 8]];

// Центр клетки в пикселях
function cellCenter(col, row) {
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
}

const PATH_POINTS = WAYPOINTS.map(([c, r]) => cellCenter(c, r));

// Все клетки дороги (чтобы рисовать её и не ставить на неё декор)
const PATH_CELLS = new Set();
for (let i = 0; i < WAYPOINTS.length - 1; i++) {
  let [c, r] = WAYPOINTS[i];
  const [c2, r2] = WAYPOINTS[i + 1];
  while (c !== c2 || r !== r2) {
    PATH_CELLS.add(c + ',' + r);
    c += Math.sign(c2 - c);
    r += Math.sign(r2 - r);
  }
  PATH_CELLS.add(c2 + ',' + r2);
}

// Карта целиком помещается в экран, по краям могут быть поля
function resizeGame() {
  scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  stage.style.width = W * scale + 'px';
  stage.style.height = H * scale + 'px';
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(W * scale * ratio);
  canvas.height = Math.round(H * scale * ratio);
  ctx.setTransform(scale * ratio, 0, 0, scale * ratio, 0, 0);
}


/* ---------------------------------------------------------
   7. СОСТОЯНИЕ ИГРЫ, ВРАГИ, БАШНИ, СНАРЯДЫ
   --------------------------------------------------------- */

// Состояния:
//   'menu'   — меню
//   'choose' — выбор сложности
//   'build'  — между волнами: строим башни и отвечаем на вопросы
//   'wave'   — идёт волна
//   'quiz'   — вопрос (игра на паузе)
//   'perk'   — выбор улучшения (пауза)
//   'paused' — пауза
//   'over'   — игра окончена
const game = {
  state: 'menu',
  stateBeforeQuiz: 'build',
  coins: 0,
  lives: 20,
  wave: 0,
  score: 0,
  answers: 0,
  time: 0,
  speed: 1,           // ×1 или ×2
  toSpawn: 0,         // сколько врагов волны ещё не вышло
  spawnTimer: 0,
  bossInWave: false,
  quizLock: 0,        // после неверного ответа кнопка «Вопрос» отдыхает
  stateBeforePause: 'build',
  usedPerks: []
};

// Общие бонусы всех башен (меняются улучшениями)
let bonus = null;

function resetBonus() {
  bonus = {
    damage: LAB.towerPower, rate: 1, range: 1, coins: 1, cost: 1,
    frost: false, crit: 0, blast: false, questionBonus: 0, poison: false,
    double: 0, waveIncome: 0, bossDamage: 1
  };
}

let enemies = [];
let towers = [];      // { pad, kind, level, cooldown }
let shots = [];       // снаряды
let particles = [];
let selectedPad = -1; // на каком месте открыто меню

function towerCost(kind) {
  if (LAB.freeTowers) return 0;
  return Math.round(TOWER_KINDS[kind].cost * bonus.cost);
}

function upgradeCost(level) {
  if (LAB.freeTowers) return 0;
  return Math.round(UPGRADE_COST[level] * bonus.cost);
}

// Характеристики башни с учётом уровня и улучшений
function towerStats(tower) {
  const base = TOWER_KINDS[tower.kind];
  const levelBoost = Math.pow(1.6, tower.level - 1);
  return {
    damage: base.damage * levelBoost * bonus.damage,
    range: (base.range + (tower.level - 1) * 15) * bonus.range,
    rate: base.rate * Math.pow(1.15, tower.level - 1) * bonus.rate,
    splash: base.splash || 0,
    slow: base.slow || (bonus.frost ? 0.8 : 0)
  };
}

function spawnEnemy(isBoss) {
  const theme = currentTheme();
  const d = difficulty();
  const waveHp = 18 * Math.pow(1.18, game.wave - 1) * d.enemyHp;
  const hp = Math.round(isBoss ? waveHp * 12 : waveHp);
  const start = PATH_POINTS[0];
  enemies.push({
    emoji: isBoss ? theme.boss.emoji : theme.enemies[Math.floor(Math.random() * theme.enemies.length)],
    boss: isBoss,
    x: start.x,
    y: start.y,
    target: 1,                  // к какой точке-повороту идёт
    travelled: 0,               // сколько прошёл (чтобы башни били первого)
    hp: hp,
    maxHp: hp,
    speed: Math.min(110, (48 + game.wave * 1.5) * d.speed * LAB.enemySpeed) * (isBoss ? 0.6 : 1),
    slowTimer: 0,
    slowFactor: 1,
    poison: 0,
    hit: 0
  });
}


/* ---------------------------------------------------------
   8. РИСОВАНИЕ: КАРТА, БАШНИ, ВРАГИ, ЧАСТИЦЫ
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

function drawMap() {
  const theme = currentTheme();
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, 0, W, H);

  // Узор на земле
  for (let i = 0; i < 160; i++) {
    drawCircle(seeded(i) * W, seeded(i + 99) * H, 1 + seeded(i + 7) * 2, theme.groundDots);
  }

  // Дорога: широкая линия по точкам-поворотам
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [color, width] of [[theme.pathEdge, CELL * 0.92], [theme.path, CELL * 0.78]]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    PATH_POINTS.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  }
  // Бегущие светящиеся точки по дороге — видно, куда идут враги
  drawPathFlow(theme.accent);

  // Декорации в пустых клетках
  for (let c = 0; c < COLS; c++) {
    for (let r = 1; r < ROWS; r++) {
      if (PATH_CELLS.has(c + ',' + r) || PADS.some(p => p[0] === c && p[1] === r)) continue;
      const n = c * 31 + r * 7;
      if (seeded(n) < 0.2) {
        const p = cellCenter(c, r);
        ctx.globalAlpha = 0.55;
        drawEmoji(theme.props[Math.floor(seeded(n + 1) * theme.props.length)], p.x + (seeded(n + 2) - 0.5) * 20, p.y + (seeded(n + 3) - 0.5) * 20, 26);
        ctx.globalAlpha = 1;
      }
    }
  }

  // База в конце дороги
  const end = PATH_POINTS[PATH_POINTS.length - 1];
  drawGlow(end.x, end.y, 70, hexToRgba(theme.accent, 0.35));
  drawEmoji(theme.base.emoji, end.x, end.y, 58);
}

function drawPathFlow(color) {
  ctx.fillStyle = hexToRgba(color, 0.35);
  let total = 0;
  for (let i = 0; i < PATH_POINTS.length - 1; i++) {
    const a = PATH_POINTS[i];
    const b = PATH_POINTS[i + 1];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    for (let d = (40 - (game.time * 40 - total) % 40) % 40; d < length; d += 40) {
      const t = d / length;
      ctx.beginPath();
      ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 3, 0, TAU);
      ctx.fill();
    }
    total += length;
  }
}

function drawPads() {
  PADS.forEach(([c, r], index) => {
    const p = cellCenter(c, r);
    const tower = towers.find(t => t.pad === index);
    const selected = index === selectedPad;
    if (!tower) {
      ctx.fillStyle = selected ? hexToRgba(currentTheme().accent, 0.35) : 'rgba(255,255,255,0.08)';
      ctx.strokeStyle = hexToRgba(currentTheme().accent, selected ? 0.9 : 0.35);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(p.x - 24, p.y - 24, 48, 48, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = hexToRgba(currentTheme().accent, 0.7);
      ctx.font = 'bold 22px Rubik, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', p.x, p.y + 1);
    }
  });
}

function drawTowers() {
  const theme = currentTheme();
  towers.forEach(tower => {
    const [c, r] = PADS[tower.pad];
    const p = cellCenter(c, r);
    const stats = towerStats(tower);
    if (tower.pad === selectedPad) {
      // Круг дальности у выбранной башни
      ctx.strokeStyle = hexToRgba(theme.accent, 0.6);
      ctx.fillStyle = hexToRgba(theme.accent, 0.08);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, stats.range, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    drawCircle(p.x, p.y + 4, 25, 'rgba(0,0,0,0.35)');
    drawCircle(p.x, p.y, 25, hexToRgba(theme.accent, 0.25 + tower.level * 0.12));
    const pop = tower.flash > 0 ? 1.15 : 1;
    drawEmoji(theme.towers[tower.kind].emoji, p.x, p.y - 2, 32 * pop);
    // Звёзды уровня
    ctx.fillStyle = '#ffd84a';
    ctx.font = 'bold 12px Rubik, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★'.repeat(tower.level), p.x, p.y + 25);
  });
}

function drawEnemies() {
  for (const e of enemies) {
    const size = e.boss ? 62 : 34;
    if (e.slowTimer > 0) drawGlow(e.x, e.y, size * 0.8, 'rgba(150,220,255,0.45)');
    if (e.poison > 0) drawGlow(e.x, e.y, size * 0.8, 'rgba(140,255,90,0.35)');
    drawEmoji(e.emoji, e.x, e.y, size * (e.hit > 0 ? 1.12 : 1));
    const w = e.boss ? 70 : 36;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(e.x - w / 2, e.y - size / 2 - 10, w, 5);
    ctx.fillStyle = e.hp / e.maxHp > 0.4 ? '#39d97a' : '#ff4d6d';
    ctx.fillRect(e.x - w / 2, e.y - size / 2 - 10, w * Math.max(0, e.hp / e.maxHp), 5);
  }
}

function drawShots() {
  const accent = currentTheme().accent;
  for (const s of shots) {
    const color = LAB.rainbowShots ? 'hsl(' + Math.round((game.time * 300 + s.x) % 360) + ', 100%, 60%)' : s.color || accent;
    drawGlow(s.x, s.y, 14, hexToRgba(color, 0.6));
    drawCircle(s.x, s.y, s.kind === 'splash' ? 6 : 4, color);
  }
}

function spawnParticles(x, y, count, color, power) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * TAU;
    const speed = (0.3 + Math.random()) * power;
    particles.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.4 + Math.random() * 0.4, size: 2 + Math.random() * 3, color: color });
  }
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.94;
    p.vy *= 0.94;
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
   9. ОКНО ВОПРОСА (КВИЗ)
   Пока открыт вопрос, игра стоит на паузе.
   onCorrect — что сделать после верного ответа
   --------------------------------------------------------- */

let currentQuestion = null;
let quizLocked = false;
let quizReward = null;   // функция-награда за верный ответ

function openQuiz(hintText, onCorrect) {
  closeBuildMenu();
  game.stateBeforeQuiz = game.state;
  game.state = 'quiz';
  currentQuestion = nextQuestion();
  quizLocked = false;
  quizReward = onCorrect;
  const subject = findById(SUBJECTS, settings.subject);

  document.getElementById('quizSubject').textContent = subject.icon + ' ' + subject.label;
  document.getElementById('quizQuestion').innerHTML = currentQuestion.text +
    (currentQuestion.hint ? '<small>' + currentQuestion.hint + '</small>' : '');
  // Длинный вопрос (история) — шрифт поменьше
  document.getElementById('quizQuestion').classList.toggle('long', currentQuestion.text.length > 12);
  document.getElementById('quizOptions').classList.toggle('long', currentQuestion.options.some(o => o.length > 9));
  document.getElementById('quizHint').textContent = hintText;
  document.getElementById('quizCard').classList.remove('flash-bad', 'flash-good');

  const options = document.getElementById('quizOptions');
  const form = document.getElementById('quizForm');
  const inputEl = document.getElementById('quizInput');

  if (settings.inputMode === 'keyboard') {
    options.classList.add('hidden');
    form.classList.remove('hidden');
    inputEl.value = '';
    inputEl.inputMode = currentQuestion.numeric ? 'numeric' : 'text';
    showScreen('quiz');
    setTimeout(() => inputEl.focus(), 50);
  } else {
    form.classList.add('hidden');
    options.classList.remove('hidden');
    options.innerHTML = '';
    currentQuestion.options.forEach((text, i) => {
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
  const card = document.getElementById('quizCard');
  if (button) button.classList.add(correct ? 'right' : 'wrong');
  restartAnimation(card, correct ? 'flash-good' : 'flash-bad');

  if (correct) {
    game.answers++;
    game.score += 20;
    playSound('coin');
    setTimeout(() => {
      closeQuiz();
      if (quizReward) quizReward();
    }, 500);
  } else {
    playSound('crash');
    game.quizLock = 3; // кнопка «Вопрос» отдыхает 3 секунды
    for (const b of document.querySelectorAll('.quiz-option')) {
      if (normalize(b.textContent) === normalize(currentQuestion.answer)) b.classList.add('right');
    }
    document.getElementById('quizHint').textContent = 'Правильно: ' + currentQuestion.answer;
    setTimeout(closeQuiz, 1100);
  }
}

function closeQuiz() {
  if (game.state !== 'quiz') return;
  game.state = game.stateBeforeQuiz;
  showScreen(null);
  updateHud();
}

document.getElementById('quizForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const value = document.getElementById('quizInput').value;
  if (value.trim()) answerQuiz(value, null);
});


/* ---------------------------------------------------------
   10. ЭКРАН УЛУЧШЕНИЙ
   --------------------------------------------------------- */

let perkOffer = [];

function openPerks() {
  const free = PERKS.filter(perk => !game.usedPerks.includes(perk.id));
  if (free.length === 0) {
    game.coins += 100;
    showToast('Все улучшения собраны! +100🪙');
    return;
  }
  game.stateBeforeQuiz = game.state;
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
  perk.apply(bonus);
  game.usedPerks.push(perk.id);
  playSound('start');
  showToast(perk.icon + ' ' + perk.title);
  game.state = game.stateBeforeQuiz;
  showScreen(null);
  updateHud();
}


/* ---------------------------------------------------------
   11. ИГРОВЫЕ ДЕЙСТВИЯ: БАШНИ, ВОЛНЫ, УРОН
   --------------------------------------------------------- */

// Кнопка «Вопрос»: верный ответ даёт монеты
function askForCoins() {
  if (!['build', 'wave'].includes(game.state) || game.quizLock > 0) return;
  const reward = LAB.questionReward + bonus.questionBonus;
  openQuiz('Верный ответ — +' + reward + ' монет!', () => {
    game.coins += reward;
    showToast('+' + reward + ' 🪙');
    updateHud();
  });
}

function buildTower(padIndex, kind) {
  const cost = towerCost(kind);
  if (game.coins < cost || towers.some(t => t.pad === padIndex)) return;
  game.coins -= cost;
  towers.push({ pad: padIndex, kind: kind, level: 1, cooldown: 0, flash: 0.3 });
  const [c, r] = PADS[padIndex];
  const p = cellCenter(c, r);
  spawnParticles(p.x, p.y, 16, currentTheme().accent, 160);
  playSound('jump');
  closeBuildMenu();
  updateHud();
}

function upgradeTower(tower) {
  if (tower.level >= 3) return;
  const cost = upgradeCost(tower.level);
  if (game.coins < cost) return;
  game.coins -= cost;
  tower.level++;
  tower.flash = 0.3;
  playSound('start');
  closeBuildMenu();
  updateHud();
}

function startWave() {
  if (game.state !== 'build') return;
  game.wave++;
  game.toSpawn = LAB.waveSize + (game.wave - 1) * 2;
  game.bossInWave = game.wave % LAB.bossEvery === 0;
  game.spawnTimer = 0.5;
  game.state = 'wave';
  if (bonus.waveIncome) game.coins += bonus.waveIncome;
  closeBuildMenu();
  playSound('tick');
  showToast(game.bossInWave ? 'Волна ' + game.wave + ': БОСС!' : 'Волна ' + game.wave);
  updateHud();
}

// Волна закончилась: награда и бонусный вопрос
function finishWave() {
  game.state = 'build';
  const prize = 30 + game.wave * 5;
  game.coins += prize;
  game.score += Math.round(100 * game.wave * difficulty().score);
  showToast('Волна пройдена! +' + prize + '🪙');
  updateHud();
  // Сразу бонусный вопрос: верный ответ — улучшение для всех башен
  openQuiz('Бонус за волну: верный ответ — улучшение для всех башен!', openPerks);
}

function damageEnemy(enemy, damage) {
  if (enemy.boss) damage *= bonus.bossDamage;
  if (Math.random() < bonus.crit) damage *= 2;
  enemy.hp -= damage;
  enemy.hit = 0.1;
}

function killEnemy(enemy) {
  enemy.dead = true;
  const reward = Math.round((enemy.boss ? 60 : 5 + game.wave) * bonus.coins);
  game.coins += reward;
  game.score += Math.round(enemy.maxHp / 2 * difficulty().score);
  spawnParticles(enemy.x, enemy.y, enemy.boss ? 50 : 16, currentTheme().accent, enemy.boss ? 260 : 170);
  if (bonus.blast) {
    for (const other of enemies) {
      if (!other.dead && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 70) damageEnemy(other, enemy.maxHp * 0.3);
    }
  }
  if (enemy.boss) {
    showToast('Босс побеждён! +' + reward + '🪙');
    playSound('start');
  }
  updateHud();
}

function gameOver() {
  game.state = 'over';
  closeBuildMenu();
  const isRecord = game.score > bestScore;
  if (isRecord) {
    bestScore = game.score;
    saveBestScore();
  }
  document.getElementById('finalScore').textContent = game.score;
  document.getElementById('finalWaves').textContent = game.wave - 1;
  document.getElementById('finalAnswers').textContent = game.answers;
  document.getElementById('finalBest').textContent = bestScore;
  document.getElementById('newRecord').classList.toggle('hidden', !isRecord || game.score === 0);
  setTimeout(() => showScreen('over'), 600);
}

function resetGame() {
  resetBonus();
  game.coins = LAB.startCoins;
  game.lives = LAB.baseLives;
  game.wave = 0;
  game.score = 0;
  game.answers = 0;
  game.speed = 1;
  game.quizLock = 0;
  game.usedPerks = [];
  enemies = [];
  towers = [];
  shots = [];
  particles = [];
  selectedPad = -1;
  buildQuestionPool();
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

function startGame() {
  if (audioContext.state === 'suspended') audioContext.resume();
  resetGame();
  game.state = 'build';
  showScreen(null);
  showToast('Строй башни и жми «Волна»!');
  playSound('start');
}

function pauseGame() {
  if (!['build', 'wave'].includes(game.state)) return;
  game.stateBeforePause = game.state;
  game.state = 'paused';
  closeBuildMenu();
  showScreen('pause');
}

function resumeGame() {
  if (game.state !== 'paused') return;
  game.state = game.stateBeforePause;
  showScreen(null);
}

function goToMenu() {
  game.state = 'menu';
  closeBuildMenu();
  showScreen('menu');
}


/* ---------------------------------------------------------
   12. ОБНОВЛЕНИЕ МИРА ЗА ОДИН КАДР
   --------------------------------------------------------- */

function update(dt) {
  if (['quiz', 'perk', 'paused'].includes(game.state)) return; // жёсткая пауза
  game.time += dt;
  updateParticles(dt);
  if (game.quizLock > 0) {
    game.quizLock -= dt;
    if (game.quizLock <= 0) updateHud();
  }
  if (!['build', 'wave'].includes(game.state)) return;

  // Ускорение ×2: просто считаем два маленьких шага вместо одного
  for (let step = 0; step < game.speed; step++) {
    updateSpawning(dt);
    updateEnemies(dt);
    updateTowers(dt);
    updateShots(dt);
    if (game.state === 'over') return;
  }

  if (game.state === 'wave' && game.toSpawn === 0 && !game.bossInWave && enemies.length === 0) finishWave();
}

function updateSpawning(dt) {
  if (game.state !== 'wave') return;
  game.spawnTimer -= dt;
  if (game.spawnTimer > 0) return;
  if (game.toSpawn > 0) {
    spawnEnemy(false);
    game.toSpawn--;
    game.spawnTimer = Math.max(0.45, 1.1 - game.wave * 0.03);
  } else if (game.bossInWave) {
    spawnEnemy(true);           // босс выходит последним
    game.bossInWave = false;
    showToast('Босс: ' + currentTheme().boss.name + '!');
    playSound('start');
  }
}

function updateEnemies(dt) {
  for (const e of enemies) {
    if (e.hit > 0) e.hit -= dt;
    if (e.slowTimer > 0) e.slowTimer -= dt;
    if (e.poison > 0) {
      e.poison -= dt;
      e.hp -= 4 * dt;
    }
    const speed = e.speed * (e.slowTimer > 0 ? e.slowFactor : 1);
    let move = speed * dt;
    // Идём к следующей точке-повороту
    while (move > 0 && e.target < PATH_POINTS.length) {
      const goal = PATH_POINTS[e.target];
      const dist = Math.hypot(goal.x - e.x, goal.y - e.y);
      if (dist <= move) {
        e.x = goal.x;
        e.y = goal.y;
        e.target++;
        move -= dist;
        e.travelled += dist;
      } else {
        e.x += (goal.x - e.x) / dist * move;
        e.y += (goal.y - e.y) / dist * move;
        e.travelled += move;
        move = 0;
      }
    }
    // Дошёл до базы
    if (e.target >= PATH_POINTS.length) {
      e.dead = true;
      game.lives -= e.boss ? 5 : 1;
      playSound('crash');
      spawnParticles(e.x, e.y, 20, '#ff4d6d', 200);
      if (game.lives <= 0) {
        game.lives = 0;
        updateHud();
        gameOver();
        return;
      }
      updateHud();
    }
    if (e.hp <= 0 && !e.dead) killEnemy(e);
  }
  enemies = enemies.filter(e => !e.dead);
}

// Башня бьёт первого врага (дальше всех прошедшего) в радиусе
function updateTowers(dt) {
  for (const tower of towers) {
    if (tower.flash > 0) tower.flash -= dt;
    tower.cooldown -= dt;
    if (tower.cooldown > 0) continue;
    const stats = towerStats(tower);
    const [c, r] = PADS[tower.pad];
    const p = cellCenter(c, r);
    let target = null;
    for (const e of enemies) {
      if (Math.hypot(e.x - p.x, e.y - p.y) <= stats.range && (!target || e.travelled > target.travelled)) target = e;
    }
    if (!target) continue;
    fire(tower, p, target, stats);
    if (Math.random() < bonus.double) fire(tower, p, target, stats);
    tower.cooldown = 1 / stats.rate;
  }
}

function fire(tower, from, target, stats) {
  shots.push({
    x: from.x, y: from.y - 10, target: target, kind: tower.kind,
    damage: stats.damage, splash: stats.splash, slow: stats.slow,
    color: tower.kind === 'slow' ? '#9fe6ff' : tower.kind === 'splash' ? '#ff9f43' : null
  });
}

function updateShots(dt) {
  for (const s of shots) {
    const t = s.target;
    if (t.dead) { s.dead = true; continue; }   // цель уже побеждена
    const dist = Math.hypot(t.x - s.x, t.y - s.y);
    const step = 460 * dt;
    if (dist <= step) {
      s.dead = true;
      hitByShot(s, t);
    } else {
      s.x += (t.x - s.x) / dist * step;
      s.y += (t.y - s.y) / dist * step;
    }
  }
  shots = shots.filter(s => !s.dead);
}

function hitByShot(shot, target) {
  const victims = shot.splash
    ? enemies.filter(e => Math.hypot(e.x - target.x, e.y - target.y) <= shot.splash)
    : [target];
  for (const e of victims) {
    damageEnemy(e, shot.damage);
    if (shot.slow) {
      e.slowTimer = 1.5;        // замедлен полторы секунды
      e.slowFactor = shot.slow;
    }
    if (bonus.poison) e.poison = 3;
  }
  spawnParticles(target.x, target.y, shot.splash ? 14 : 5, shot.color || currentTheme().accent, shot.splash ? 180 : 110);
}


/* ---------------------------------------------------------
   13. РИСОВАНИЕ ОДНОГО КАДРА
   --------------------------------------------------------- */

function draw() {
  drawMap();
  if (game.state !== 'menu') {
    drawPads();
    drawTowers();
    drawEnemies();
    drawShots();
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

function updateHud() {
  document.getElementById('coins').textContent = game.coins;
  document.getElementById('lives').textContent = game.lives;
  document.getElementById('wave').textContent = Math.max(1, game.wave);
  document.getElementById('score').textContent = game.score;
  const quizButton = document.getElementById('quizButton');
  quizButton.disabled = game.quizLock > 0;
  quizButton.textContent = '❓ Вопрос +' + (LAB.questionReward + (bonus ? bonus.questionBonus : 0)) + '🪙';
  const waveButton = document.getElementById('waveButton');
  waveButton.disabled = game.state !== 'build';
  waveButton.textContent = game.state === 'wave' ? '⚔️ Идёт волна ' + game.wave : '▶ Волна ' + (game.wave + 1);
  document.getElementById('speedButton').textContent = '⏩ ×' + game.speed;
  document.getElementById('perkChips').innerHTML = game.usedPerks
    .map(id => '<span class="chip">' + PERKS.find(p => p.id === id).icon + '</span>').join('');
}

// Меню постройки или улучшения возле места
function openBuildMenu(padIndex) {
  selectedPad = padIndex;
  const theme = currentTheme();
  const menu = document.getElementById('buildMenu');
  const tower = towers.find(t => t.pad === padIndex);
  let html = '';
  if (!tower) {
    html += '<div class="build-title">Построить башню</div>';
    ['fast', 'splash', 'slow'].forEach((kind, i) => {
      const cost = towerCost(kind);
      html += '<button class="build-item" data-kind="' + kind + '"' + (game.coins < cost ? ' disabled' : '') + '>' +
        '<span class="build-icon">' + theme.towers[kind].emoji + '</span>' +
        '<span class="build-name">' + (i + 1) + '. ' + theme.towers[kind].name + '<small>' + TOWER_KINDS[kind].desc + '</small></span>' +
        '<span class="build-cost">' + cost + '🪙</span></button>';
    });
  } else {
    const name = theme.towers[tower.kind].name;
    if (tower.level < 3) {
      const cost = upgradeCost(tower.level);
      html += '<div class="build-title">' + name + ' · уровень ' + tower.level + '</div>' +
        '<button class="build-item" data-upgrade="1"' + (game.coins < cost ? ' disabled' : '') + '>' +
        '<span class="build-icon">⬆️</span><span class="build-name">1. Улучшить<small>Урон ×1.6, дальность +15</small></span>' +
        '<span class="build-cost">' + cost + '🪙</span></button>';
    } else {
      html += '<div class="build-title">' + name + ' · максимум ★★★</div>';
    }
  }
  menu.innerHTML = html;
  menu.querySelectorAll('[data-kind]').forEach(b => b.addEventListener('click', () => buildTower(padIndex, b.dataset.kind)));
  menu.querySelectorAll('[data-upgrade]').forEach(b => b.addEventListener('click', () => upgradeTower(tower)));

  // Ставим меню рядом с местом, но не за краем экрана
  const [c, r] = PADS[padIndex];
  const p = cellCenter(c, r);
  menu.classList.remove('hidden');
  const left = clamp(p.x * scale + 34 * scale, 4, W * scale - menu.offsetWidth - 4);
  // Сверху меню не заезжает на панель, снизу — на кнопки
  const hudBottom = document.querySelector('.hud-top').getBoundingClientRect().bottom - stage.getBoundingClientRect().top + 6;
  const top = clamp(p.y * scale - menu.offsetHeight / 2, hudBottom, H * scale - menu.offsetHeight - 60);
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
}

function closeBuildMenu() {
  selectedPad = -1;
  document.getElementById('buildMenu').classList.add('hidden');
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
  document.getElementById('baseLabel').textContent = theme.base.emoji + ' ' + theme.base.name;
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

// Нажатие на карту: место для башни → меню, иначе меню закрывается
canvas.addEventListener('pointerdown', (event) => {
  if (!['build', 'wave'].includes(game.state)) return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width * W;
  const y = (event.clientY - rect.top) / rect.height * H;
  const padIndex = PADS.findIndex(([c, r]) => {
    const p = cellCenter(c, r);
    return Math.abs(p.x - x) < 30 && Math.abs(p.y - y) < 30;
  });
  if (padIndex >= 0 && padIndex !== selectedPad) openBuildMenu(padIndex);
  else closeBuildMenu();
});

document.addEventListener('keydown', (event) => {
  if (document.activeElement && document.activeElement.id === 'quizInput') return;
  const code = event.code;
  if (code === 'Space') event.preventDefault();

  // Цифры 1–4: вариант ответа, сложность, улучшение или пункт меню башни
  const digit = Number(event.key);
  if (digit >= 1 && digit <= 4) {
    let list = null;
    if (game.state === 'quiz') list = document.querySelectorAll('.quiz-option');
    else if (isVisible(screens.difficulty)) list = document.querySelectorAll('#difficultyChoices .choice');
    else if (game.state === 'perk') list = document.querySelectorAll('#perkChoices .choice');
    else if (selectedPad >= 0) list = document.querySelectorAll('#buildMenu .build-item');
    if (list && list[digit - 1]) list[digit - 1].click();
  }

  if (code === 'KeyQ') askForCoins();
  if (code === 'KeyF') toggleSpeed();
  if (code === 'Space' || code === 'Enter') {
    if (isVisible(screens.menu)) openDifficultySelect();
    else if (isVisible(screens.over)) startGame();
    else if (game.state === 'build') startWave();
  }
  if (code === 'Escape' || code === 'KeyP') {
    if (selectedPad >= 0) closeBuildMenu();
    else if (['build', 'wave'].includes(game.state)) pauseGame();
    else if (game.state === 'paused') resumeGame();
    else if (isVisible(screens.settings)) showScreen('menu');
  }
});

function toggleSpeed() {
  if (!['build', 'wave'].includes(game.state)) return;
  game.speed = game.speed === 1 ? 2 : 1;
  updateHud();
}

document.getElementById('quizButton').addEventListener('click', askForCoins);
document.getElementById('waveButton').addEventListener('click', startWave);
document.getElementById('speedButton').addEventListener('click', toggleSpeed);
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

window.addEventListener('resize', () => {
  resizeGame();
  closeBuildMenu();
});


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
resetBonus();
resizeGame();
applyTheme();
showScreen('menu');
requestAnimationFrame(loop);
