/* =========================================================
   QUIZ SHOOTER — автошутер + рогалик + образовательный квиз
   Чистый JavaScript и Canvas, графика из эмодзи
   ---------------------------------------------------------
   Как устроен файл (читайте сверху вниз):
     0. Лаборатория: 10 настроек для экспериментов
     1. Данные: миры, герои, предметы, сложность
     2. Вопросы: математика, русский, английский, история
     3. Улучшения (перки)
     4. Настройки игрока и рекорд
     5. Звуки
     6. Холст и размер игры
     7. Состояние игры, герой, враги, пули
     8. Рисование: фоны, эмодзи, частицы
     9. Окно вопроса (квиз)
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
  titleBottom: 'Shooter',

  // 2. Свой герой-эмодзи, например '🦄'. Пусто '' — своего героя нет
  myHeroEmoji: '',

  // 3. Добавка к здоровью героя на старте: 0 — обычно, 100 — танк
  startHpBonus: 0,

  // 4. Добавка к урону пуль: 0 — обычно, 20 — мощные пули
  damageBonus: 0,

  // 5. Скорострельность: 1 — обычная, 2 — в два раза чаще
  fireRateBoost: 1,

  // 6. Скорость врагов: 1 — обычная, 0.5 — медленные, 1.5 — быстрые
  enemySpeed: 1,

  // 7. Сколько врагов может быть на экране одновременно: 5 — обычно
  maxEnemies: 5,

  // 8. Босс появляется каждые N побеждённых врагов: 10 — обычно, 3 — часто
  bossEvery: 10,

  // 9. Вопрос после каждого N-го врага: 1 — после каждого, 3 — реже
  quizEvery: 1,

  // 10. Радужные пули: false — цвет мира, true — радуга
  rainbowBullets: false
};


/* ---------------------------------------------------------
   1. ДАННЫЕ: МИРЫ, ГЕРОИ, ПРЕДМЕТЫ, СЛОЖНОСТЬ
   --------------------------------------------------------- */

// Три типа героя. У каждого свои статы:
//   hp — здоровье, speed — скорость (пикс/с),
//   damage — урон пули, fireRate — выстрелов в секунду
const HERO_TYPES = {
  tank:   { hp: 140, speed: 260, damage: 10, fireRate: 2.4 },
  power:  { hp: 90,  speed: 300, damage: 16, fireRate: 1.9 },
  agile:  { hp: 110, speed: 390, damage: 8,  fireRate: 3.4 },
  normal: { hp: 115, speed: 320, damage: 11, fireRate: 2.6 }
};

const THEMES = [
  {
    id: 'fantasy', icon: '🏰', label: 'Фэнтези', desc: 'Рыцари и магия',
    accent: '#FFD700',
    sky: ['#0b1030', '#1b1f5a', '#3a2a6a'],
    heroes: [
      { emoji: '🤺', name: 'Рыцарь', type: 'tank' },
      { emoji: '🧙', name: 'Маг', type: 'power' },
      { emoji: '🧝‍♂️', name: 'Эльф', type: 'agile' }
    ],
    enemies: ['👹', '💀'],
    boss: { emoji: '🐉', name: 'Дракон', shot: '🔥' }
  },
  {
    id: 'space', icon: '🚀', label: 'Космос', desc: 'Лазеры и НЛО',
    accent: '#00FFFF',
    sky: ['#000008', '#05051a', '#0d0a2e'],
    heroes: [
      { emoji: '🤖', name: 'Робот', type: 'tank' },
      { emoji: '👽', name: 'Пришелец', type: 'power' },
      { emoji: '🧑‍🚀', name: 'Астронавт', type: 'agile' }
    ],
    enemies: ['☄️', '🛸'],
    boss: { emoji: '👾', name: 'Мега-Мозг', shot: '⚡' }
  },
  {
    id: 'eco', icon: '🌿', label: 'Эко-Панк', desc: 'Защита природы',
    accent: '#39FF14',
    sky: ['#04140c', '#0b2a18', '#123d22'],
    heroes: [
      { emoji: '🐼', name: 'Панда', type: 'tank' },
      { emoji: '🦉', name: 'Сова', type: 'power' },
      { emoji: '🧑‍🌾', name: 'Егерь', type: 'agile' }
    ],
    enemies: ['🗑️', '🦗'],
    boss: { emoji: '🧟', name: 'Токсичный Монстр', shot: '☢️' }
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

// Сложность: здоровье врагов, их скорость и множитель очков
const DIFFICULTIES = [
  { id: 'easy',   icon: '🙂', label: 'Легко',      desc: 'Слабые и медленные враги', enemyHp: 0.8, speed: 0.9,  score: 1 },
  { id: 'normal', icon: '😎', label: 'Нормально',  desc: 'Честная битва, очки ×1.5', enemyHp: 1.2, speed: 1.1,  score: 1.5 },
  { id: 'hard',   icon: '😈', label: 'Сложно',     desc: 'Толстые враги, очки ×2',   enemyHp: 1.7, speed: 1.3,  score: 2 }
];

// Найти элемент списка по id (если не нашли — берём первый)
function findById(list, id) {
  return list.find(item => item.id === id) || list[0];
}

function currentTheme() {
  return findById(THEMES, settings.theme);
}

// Герои текущего мира (+ свой герой из Лаборатории)
function heroList() {
  const heroes = currentTheme().heroes.slice();
  if (LAB.myHeroEmoji) heroes.push({ emoji: LAB.myHeroEmoji, name: 'Мой герой', type: 'normal' });
  return heroes;
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
   20 перков. Каждый можно взять один раз за игру.
   apply(p) навсегда меняет статы героя p
   --------------------------------------------------------- */

const PERKS = [
  { id: 'dmg',     icon: '💥', title: 'Урон +5',          desc: 'Пули бьют сильнее',            apply: p => { p.damage += 5; } },
  { id: 'double',  icon: '🔫', title: 'Двойные пули',     desc: '+1 пуля в залпе',              apply: p => { p.bullets += 1; } },
  { id: 'rate',    icon: '⚡', title: 'Скорострельность', desc: 'Стреляешь на 30% чаще',        apply: p => { p.fireRate *= 1.3; } },
  { id: 'ice',     icon: '❄️', title: 'Ледяные пули',     desc: 'Замедляют врагов',             apply: p => { p.ice = true; } },
  { id: 'homing',  icon: '🎯', title: 'Самонаведение',    desc: 'Пули сами летят к врагу',      apply: p => { p.homing = true; } },
  { id: 'vampire', icon: '🧛', title: 'Вампиризм',        desc: '+6 здоровья за врага',         apply: p => { p.vampire += 6; } },
  { id: 'pierce',  icon: '🗡️', title: 'Пробивание',       desc: 'Пуля пробивает +1 врага',      apply: p => { p.pierce += 1; } },
  { id: 'crit',    icon: '🍀', title: 'Крит 25%',         desc: 'Шанс двойного урона',          apply: p => { p.crit += 0.25; } },
  { id: 'maxhp',   icon: '❤️', title: 'Крепкое здоровье', desc: 'Макс. здоровье +30',           apply: p => { p.maxHp += 30; p.hp += 30; } },
  { id: 'heal',    icon: '💊', title: 'Аптечка',          desc: 'Полностью вылечиться',         apply: p => { p.hp = p.maxHp; } },
  { id: 'speed',   icon: '👟', title: 'Быстрые ноги',     desc: 'Герой на 25% быстрее',         apply: p => { p.speed *= 1.25; } },
  { id: 'big',     icon: '🔵', title: 'Большие пули',     desc: 'Больше и +2 урона',            apply: p => { p.bulletSize *= 1.5; p.damage += 2; } },
  { id: 'fast',    icon: '🚀', title: 'Быстрые пули',     desc: 'Пули летят на 40% быстрее',    apply: p => { p.bulletSpeed *= 1.4; } },
  { id: 'fire',    icon: '🔥', title: 'Огненные пули',    desc: 'Поджигают врагов',             apply: p => { p.fire = true; } },
  { id: 'shield',  icon: '🛡️', title: 'Щит',              desc: 'Блокирует удар, заряд 10 с',   apply: p => { p.shield = true; p.shieldReady = true; } },
  { id: 'side',    icon: '↗️', title: 'Боковые пули',     desc: '+2 пули по диагонали',         apply: p => { p.side = true; } },
  { id: 'boom',    icon: '💣', title: 'Взрывные пули',    desc: 'Урон по соседним врагам',      apply: p => { p.explosive = true; } },
  { id: 'score',   icon: '⭐', title: 'Больше очков',     desc: 'Очки ×1.5',                    apply: p => { p.scoreMult *= 1.5; } },
  { id: 'push',    icon: '🌀', title: 'Отталкивание',     desc: 'Пули отбрасывают врагов',      apply: p => { p.knockback = true; } },
  { id: 'regen',   icon: '🌱', title: 'Регенерация',      desc: '+2 здоровья в секунду',        apply: p => { p.regen += 2; } }
];


/* ---------------------------------------------------------
   4. НАСТРОЙКИ ИГРОКА И РЕКОРД
   localStorage — «память» браузера: данные остаются после перезагрузки
   --------------------------------------------------------- */

const DEFAULT_SETTINGS = {
  theme: 'space',
  subject: 'math',
  inputMode: 'buttons',
  difficulty: 'easy',
  hero: 0,            // номер героя в списке
  sound: true,
  volume: 0.7
};

let settings = loadSettings();
let bestScore = loadBestScore();

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('quizshooter-settings'));
    return Object.assign({}, DEFAULT_SETTINGS, saved);
  } catch (error) {
    return Object.assign({}, DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  try {
    localStorage.setItem('quizshooter-settings', JSON.stringify(settings));
  } catch (error) {
    // Если браузер запретил сохранение — просто играем без него
  }
}

function loadBestScore() {
  try {
    return Number(localStorage.getItem('quizshooter-best')) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore() {
  try {
    localStorage.setItem('quizshooter-best', String(bestScore));
  } catch (error) {
    // ничего страшного
  }
}


/* ---------------------------------------------------------
   5. ЗВУКИ (Web Audio — звук играет мгновенно)
   В CodePen своей папки нет — звуки берутся с GitHub Pages
   --------------------------------------------------------- */

const isCodePen = location.hostname.includes('codepen') || location.hostname.includes('cdpn.io');
const SOUND_PATH = isCodePen ? 'https://si0683.github.io/QuizShooter/sound/' : 'sound/';

const SOUND_FILES = {
  jump:  'jump.wav',   // враг побеждён
  coin:  'coin.mp3',   // верный ответ
  tick:  'tick.wav',   // обратный отсчёт
  start: 'start.wav',  // старт, улучшение, босс
  crash: 'crash.wav'   // урон и неверный ответ
};

// В начале coin.mp3 есть тишина — пропускаем её
const SOUND_START = { coin: 0.045 };

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
   Игра считает, что её высота 720 «игровых пикселей».
   Ширина подстраивается под экран, а потом всё масштабируется.
   --------------------------------------------------------- */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // ctx — «кисточка», которой мы рисуем
const stage = document.getElementById('stage');

const H = 720;
const MIN_WIDTH = 360;
const MAX_WIDTH = 960;
let W = 600;
let scale = 1;

function resizeGame() {
  scale = window.innerHeight / H;
  W = window.innerWidth / scale;
  if (W < MIN_WIDTH) {
    W = MIN_WIDTH;
    scale = window.innerWidth / W;
  }
  if (W > MAX_WIDTH) W = MAX_WIDTH;

  stage.style.width = W * scale + 'px';
  stage.style.height = H * scale + 'px';
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(W * scale * ratio);
  canvas.height = Math.round(H * scale * ratio);
  ctx.setTransform(scale * ratio, 0, 0, scale * ratio, 0, 0);

  if (player) player.x = clamp(player.x, 30, W - 30);
}


/* ---------------------------------------------------------
   7. СОСТОЯНИЕ ИГРЫ, ГЕРОЙ, ВРАГИ, ПУЛИ
   --------------------------------------------------------- */

// В каком состоянии игра:
//   'menu'      — меню (фон двигается)
//   'choose'    — выбор героя и сложности
//   'countdown' — отсчёт 3-2-1
//   'playing'   — играем
//   'quiz'      — жёсткая пауза: вопрос
//   'perk'      — жёсткая пауза: выбор улучшения
//   'paused'    — пауза
//   'over'      — игра окончена
const game = {
  state: 'menu',
  score: 0,
  kills: 0,          // побеждено врагов
  answers: 0,        // верных ответов
  threat: 1,         // индикатор угрозы: растёт с каждым улучшением
  time: 0,
  spawnTimer: 0,
  bossAlive: false,
  pendingBoss: false, // босс ждёт, пока экран очистится
  usedPerks: [],
  shake: 0
};

let player = null;
let enemies = [];
let bullets = [];
let enemyShots = [];  // снаряды босса
let particles = [];

const PLAYER_Y = H - 80;

function createPlayer() {
  const hero = heroList()[settings.hero] || heroList()[0];
  const type = HERO_TYPES[hero.type];
  player = {
    emoji: hero.emoji,
    name: hero.name,
    x: W / 2,
    hp: type.hp + LAB.startHpBonus,
    maxHp: type.hp + LAB.startHpBonus,
    speed: type.speed,
    damage: type.damage + LAB.damageBonus,
    fireRate: type.fireRate * LAB.fireRateBoost,
    fireTimer: 0,
    bullets: 1,
    bulletSpeed: 520,
    bulletSize: 1,
    pierce: 0,
    crit: 0,
    vampire: 0,
    regen: 0,
    scoreMult: 1,
    ice: false, fire: false, homing: false, explosive: false, side: false, knockback: false,
    shield: false, shieldReady: false, shieldTimer: 0,
    hurtTimer: 0
  };
}

function difficulty() {
  return findById(DIFFICULTIES, settings.difficulty);
}

// Новый враг сверху. Траектория: прямо, зигзаг или синусоида
function spawnEnemy() {
  const theme = currentTheme();
  const d = difficulty();
  const hp = Math.round(30 * d.enemyHp * (1 + (game.threat - 1) * 0.15));
  const x = 40 + Math.random() * (W - 80);
  enemies.push({
    emoji: theme.enemies[Math.floor(Math.random() * theme.enemies.length)],
    x: x,
    baseX: x,
    y: -40,
    size: 44,
    hp: hp,
    maxHp: hp,
    speed: (42 + Math.random() * 22 + game.threat * 2) * d.speed * LAB.enemySpeed,
    path: ['straight', 'zigzag', 'sine'][Math.floor(Math.random() * 3)],
    vx: Math.random() < 0.5 ? -70 : 70,
    t: Math.random() * 6,
    slow: 0,   // сколько секунд ещё заморожен
    burn: 0,   // сколько секунд ещё горит
    hit: 0,    // вспышка после попадания
    boss: false
  });
}

function spawnBoss() {
  const theme = currentTheme();
  const d = difficulty();
  const hp = Math.round(420 * d.enemyHp * (1 + (game.threat - 1) * 0.15));
  enemies.push({
    emoji: theme.boss.emoji, x: W / 2, baseX: W / 2, y: -80, size: 110,
    hp: hp, maxHp: hp, speed: 30, path: 'boss', vx: 0, t: 0,
    slow: 0, burn: 0, hit: 0, boss: true, shotTimer: 2
  });
  game.bossAlive = true;
  document.getElementById('bossName').textContent = theme.boss.emoji + ' ' + theme.boss.name;
  showToast('Босс! ' + theme.boss.name);
  playSound('start');
}


/* ---------------------------------------------------------
   8. РИСОВАНИЕ: ПОМОЩНИКИ, ФОНЫ, ЭМОДЗИ, ЧАСТИЦЫ
   --------------------------------------------------------- */

const TAU = Math.PI * 2;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// «Заворачивает» координату, чтобы звёзды бесконечно повторялись
function wrap(value, length) {
  return ((value % length) + length) % length;
}

// Псевдослучайное число 0..1, для одного n всегда одинаковое
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

// Эмодзи рисуется как текст нужного размера
function drawEmoji(emoji, x, y, size) {
  ctx.font = size + 'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y);
}

// Фон: слои двигаются вниз с разной скоростью — кажется, что летим вперёд
function drawBackground() {
  const theme = currentTheme();
  const t = game.time;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, theme.sky[0]);
  g.addColorStop(0.6, theme.sky[1]);
  g.addColorStop(1, theme.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  if (theme.id === 'space') drawSpace(t);
  else if (theme.id === 'eco') drawForest(t);
  else drawCastle(t);
}

function drawStars(t, count, speed, maxSize, alpha) {
  for (let i = 0; i < count; i++) {
    const x = seeded(i * 3 + speed) * W;
    const y = wrap(seeded(i * 7 + speed) * H + t * speed, H);
    ctx.globalAlpha = alpha * (0.5 + 0.5 * Math.abs(Math.sin(t * 2 + i)));
    drawCircle(x, y, 0.5 + seeded(i + speed) * maxSize, '#ffffff');
  }
  ctx.globalAlpha = 1;
}

function drawSpace(t) {
  drawGlow(W * 0.25, H * 0.3, 260, 'rgba(120,60,255,0.22)');
  drawGlow(W * 0.8, H * 0.65, 240, 'rgba(0,255,255,0.12)');
  drawStars(t, 70, 15, 1.2, 0.6);
  drawStars(t, 40, 45, 1.8, 0.8);
  drawStars(t, 18, 110, 2.4, 1);
  // Планета медленно проплывает
  const py = wrap(t * 8, H + 300) - 150;
  drawGlow(W * 0.82, py, 90, 'rgba(255,120,200,0.25)');
  drawCircle(W * 0.82, py, 46, '#3a2a7a');
  drawCircle(W * 0.82 - 12, py - 12, 30, '#4d3a9a');
}

function drawCastle(t) {
  drawStars(t, 60, 6, 1.4, 0.8);
  // Луна
  drawGlow(W * 0.78, 110, 120, 'rgba(255,215,0,0.25)');
  drawCircle(W * 0.78, 110, 38, '#fff3c4');
  // Облака плывут вниз
  ctx.fillStyle = 'rgba(160,150,220,0.12)';
  for (let i = 0; i < 5; i++) {
    const y = wrap(seeded(i) * H + t * 20, H + 120) - 60;
    const x = seeded(i + 9) * W;
    ctx.beginPath();
    ctx.ellipse(x, y, 90, 26, 0, 0, TAU);
    ctx.fill();
  }
  // Силуэты башен замка внизу
  ctx.fillStyle = '#0a0b24';
  for (let i = 0; i < 9; i++) {
    const w = 40 + seeded(i) * 50;
    const x = (i / 8) * W - w / 2;
    const h = 90 + seeded(i + 4) * 120;
    ctx.fillRect(x, H - h, w, h);
    ctx.beginPath();
    ctx.moveTo(x - 6, H - h);
    ctx.lineTo(x + w / 2, H - h - 50);
    ctx.lineTo(x + w + 6, H - h);
    ctx.fill();
    // Светящееся окно
    ctx.fillStyle = 'rgba(255,215,0,0.7)';
    ctx.fillRect(x + w / 2 - 4, H - h + 24, 8, 14);
    ctx.fillStyle = '#0a0b24';
  }
}

function drawForest(t) {
  drawStars(t, 40, 5, 1.2, 0.5);
  drawGlow(W * 0.2, 90, 110, 'rgba(57,255,20,0.15)');
  drawCircle(W * 0.2, 90, 32, '#d9ffd0');
  // Деревья по краям, два слоя
  for (const layer of [{ color: '#08261a', speed: 30, size: 1 }, { color: '#04170f', speed: 70, size: 1.4 }]) {
    ctx.fillStyle = layer.color;
    for (let i = 0; i < 8; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const x = side > 0 ? 20 + seeded(i + layer.speed) * 60 : W - 20 - seeded(i + layer.speed) * 60;
      const y = wrap(seeded(i * 5 + layer.speed) * H + t * layer.speed, H + 200) - 100;
      const s = 50 * layer.size;
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s * 0.6, y + s * 0.6);
      ctx.lineTo(x - s * 0.6, y + s * 0.6);
      ctx.fill();
    }
  }
  // Светлячки
  for (let i = 0; i < 26; i++) {
    const x = seeded(i) * W + Math.sin(t + i) * 20;
    const y = wrap(seeded(i + 40) * H + t * 12, H);
    ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i));
    drawGlow(x, y, 10, 'rgba(57,255,20,0.8)');
  }
  ctx.globalAlpha = 1;
}

// Частицы: взрывы и искры
function spawnParticles(x, y, count, color, power) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * TAU;
    const speed = (0.3 + Math.random()) * power;
    particles.push({
      x: x, y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.5,
      size: 2 + Math.random() * 4,
      color: color
    });
  }
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 200 * dt; // гравитация
    p.life -= dt;
  }
  particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life * 1.5);
    drawCircle(p.x, p.y, p.size, p.color);
  }
  ctx.globalAlpha = 1;
}


/* ---------------------------------------------------------
   9. ОКНО ВОПРОСА (КВИЗ)
   Игра стоит на жёсткой паузе, пока игрок не ответит
   --------------------------------------------------------- */

let currentQuestion = null;
let quizLocked = false; // пока показываем результат, второй ответ не принимаем

function openQuiz() {
  game.state = 'quiz';
  currentQuestion = nextQuestion();
  quizLocked = false;
  const subject = findById(SUBJECTS, settings.subject);

  document.getElementById('quizSubject').textContent = subject.icon + ' ' + subject.label;
  document.getElementById('quizQuestion').innerHTML = currentQuestion.text +
    (currentQuestion.hint ? '<small>' + currentQuestion.hint + '</small>' : '');
  // Длинный вопрос (история) — шрифт поменьше
  document.getElementById('quizQuestion').classList.toggle('long', currentQuestion.text.length > 12);
  document.getElementById('quizOptions').classList.toggle('long', currentQuestion.options.some(o => o.length > 9));
  document.getElementById('quizCard').classList.remove('flash-bad', 'flash-good');

  const options = document.getElementById('quizOptions');
  const form = document.getElementById('quizForm');
  const input = document.getElementById('quizInput');

  if (settings.inputMode === 'keyboard') {
    options.classList.add('hidden');
    form.classList.remove('hidden');
    input.value = '';
    input.inputMode = currentQuestion.numeric ? 'numeric' : 'text';
    showScreen('quiz');
    setTimeout(() => input.focus(), 50); // автофокус: можно сразу печатать
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
    addScore(25);
    playSound('coin');
    setTimeout(openPerks, 500);
  } else {
    playSound('crash');
    // Подсвечиваем правильный вариант, чтобы ребёнок его запомнил
    for (const b of document.querySelectorAll('.quiz-option')) {
      if (normalize(b.textContent) === normalize(currentQuestion.answer)) b.classList.add('right');
    }
    document.getElementById('quizHint').textContent = 'Правильно: ' + currentQuestion.answer;
    setTimeout(resumeAfterQuiz, 1100);
  }
}

function resumeAfterQuiz() {
  document.getElementById('quizHint').textContent = 'Верный ответ — улучшение героя!';
  game.state = 'playing';
  showScreen(null);
}

document.getElementById('quizForm').addEventListener('submit', (event) => {
  event.preventDefault(); // форма не перезагружает страницу
  const value = document.getElementById('quizInput').value;
  if (value.trim()) answerQuiz(value, null);
});


/* ---------------------------------------------------------
   10. ЭКРАН УЛУЧШЕНИЙ (РОГАЛИК)
   3 случайных перка, которые ещё не брали
   --------------------------------------------------------- */

let perkOffer = [];

function openPerks() {
  const free = PERKS.filter(perk => !game.usedPerks.includes(perk.id));
  if (free.length === 0) {
    // Все перки уже взяты — просто бонус к очкам
    addScore(100);
    showToast('Все улучшения собраны! +100');
    resumeAfterQuiz();
    return;
  }
  game.state = 'perk';
  perkOffer = shuffle(free).slice(0, 3);
  const box = document.getElementById('perkChoices');
  box.innerHTML = '';
  perkOffer.forEach((perk, i) => {
    box.appendChild(makeChoice(perk.icon, perk.title, perk.desc, null, () => pickPerk(perk), i + 1));
  });
  showScreen('perk');
}

function pickPerk(perk) {
  if (game.state !== 'perk') return;
  perk.apply(player);
  game.usedPerks.push(perk.id);
  game.threat++;             // все новые враги становятся толще
  playSound('start');
  showToast(perk.icon + ' ' + perk.title);
  updateHud();
  resumeAfterQuiz();
}


/* ---------------------------------------------------------
   11. ИГРОВЫЕ ДЕЙСТВИЯ
   --------------------------------------------------------- */

function addScore(points) {
  game.score += Math.round(points * (player ? player.scoreMult : 1));
}

// Выстрел: несколько пуль веером + боковые
function shoot() {
  const p = player;
  const spread = 14;
  for (let i = 0; i < p.bullets; i++) {
    const offset = (i - (p.bullets - 1) / 2) * spread;
    addBullet(p.x + offset, 0);
  }
  if (p.side) {
    addBullet(p.x - 10, -0.45);
    addBullet(p.x + 10, 0.45);
  }
}

function addBullet(x, angle) {
  bullets.push({
    x: x,
    y: PLAYER_Y - 30,
    vx: Math.sin(angle) * player.bulletSpeed,
    vy: -Math.cos(angle) * player.bulletSpeed,
    r: 5 * player.bulletSize,
    pierce: player.pierce,
    hits: []           // каких врагов эта пуля уже задела
  });
}

// Попадание пули во врага: урон и эффекты перков
function hitEnemy(enemy, damage) {
  const p = player;
  if (Math.random() < p.crit) {
    damage *= 2;
    spawnParticles(enemy.x, enemy.y, 6, '#ffffff', 160);
  }
  enemy.hp -= damage;
  enemy.hit = 0.12;
  if (p.ice) enemy.slow = 2;
  if (p.fire) enemy.burn = 3;
  if (p.knockback && !enemy.boss) enemy.y -= 14;
  spawnParticles(enemy.x, enemy.y, 4, currentTheme().accent, 120);
}

function killEnemy(enemy) {
  enemies = enemies.filter(e => e !== enemy);
  spawnParticles(enemy.x, enemy.y, enemy.boss ? 60 : 22, currentTheme().accent, enemy.boss ? 320 : 220);
  spawnParticles(enemy.x, enemy.y, 10, '#ffffff', 160);
  playSound('jump');
  game.kills++;
  addScore(enemy.maxHp * difficulty().score);
  if (player.vampire) player.hp = Math.min(player.maxHp, player.hp + player.vampire);

  if (enemy.boss) {
    game.bossAlive = false;
    showToast('Босс побеждён! +500');
    addScore(500);
  }
  updateHud();

  // Вопрос после каждого N-го врага
  if (game.kills % LAB.quizEvery === 0) openQuiz();

  // Каждые N врагов — босс
  if (!enemy.boss && game.kills % LAB.bossEvery === 0) {
    game.pendingBoss = true;
  }
}

// Герой получает урон (щит может его заблокировать)
function hurtPlayer(amount) {
  const p = player;
  if (p.shield && p.shieldReady) {
    p.shieldReady = false;
    p.shieldTimer = 10;
    showToast('🛡️ Щит!');
    spawnParticles(p.x, PLAYER_Y, 16, '#7fdcff', 200);
    return;
  }
  p.hp -= amount;
  p.hurtTimer = 0.4;
  game.shake = 0.3;
  playSound('crash');
  spawnParticles(p.x, PLAYER_Y, 14, '#ff4d6d', 200);
  if (p.hp <= 0) {
    p.hp = 0;
    gameOver();
  }
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
  document.getElementById('finalKills').textContent = game.kills;
  document.getElementById('finalAnswers').textContent = game.answers;
  document.getElementById('finalBest').textContent = bestScore;
  document.getElementById('newRecord').classList.toggle('hidden', !isRecord || game.score === 0);
  setTimeout(() => showScreen('over'), 600);
}

function resetGame() {
  game.score = 0;
  game.kills = 0;
  game.answers = 0;
  game.threat = 1;
  game.spawnTimer = 1;
  game.bossAlive = false;
  game.pendingBoss = false;
  game.usedPerks = [];
  game.shake = 0;
  enemies = [];
  bullets = [];
  enemyShots = [];
  particles = [];
  createPlayer();
  buildQuestionPool();
  updateHud();
}

// Меню → выбор героя → выбор сложности → отсчёт → игра
function openHeroSelect() {
  game.state = 'choose';
  const box = document.getElementById('heroChoices');
  box.innerHTML = '';
  heroList().forEach((hero, i) => {
    const type = HERO_TYPES[hero.type];
    const stats = [
      ['Здоровье', type.hp / 30],
      ['Скорость', type.speed / 80],
      ['Урон', type.damage / 3.4],
      ['Стрельба', type.fireRate * 1.4]
    ];
    box.appendChild(makeChoice(hero.emoji, hero.name, '', stats, () => {
      settings.hero = i;
      saveSettings();
      openDifficultySelect();
    }, i + 1));
  });
  showScreen('hero');
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
  const box = document.getElementById('difficultyChoices');
  box.innerHTML = '';
  DIFFICULTIES.forEach((d, i) => {
    box.appendChild(makeChoice(d.icon, d.label, d.desc, null, () => {
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
      showCountdown('В бой!');
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
  enemies = [];
  bullets = [];
  enemyShots = [];
  showScreen('menu');
}


/* ---------------------------------------------------------
   12. ОБНОВЛЕНИЕ МИРА ЗА ОДИН КАДР
   dt — секунды с прошлого кадра. Всё движение умножаем на dt
   --------------------------------------------------------- */

// Куда хочет идти игрок: -1 влево, 1 вправо, 0 стоит
const input = { left: false, right: false, pointerX: null };

function update(dt) {
  // В паузе, в вопросе и в выборе улучшения мир полностью стоит
  if (['quiz', 'perk', 'paused'].includes(game.state)) return;

  game.time += dt;
  updateParticles(dt);
  if (game.shake > 0) game.shake -= dt;
  if (game.state !== 'playing') return;

  updatePlayer(dt);
  updateSpawning(dt);
  updateBullets(dt);
  if (game.state !== 'playing') return; // победили врага — открылся вопрос
  updateEnemies(dt);
  updateEnemyShots(dt);
}

function updatePlayer(dt) {
  const p = player;
  let direction = 0;
  if (input.left) direction -= 1;
  if (input.right) direction += 1;
  // На телефоне герой идёт к пальцу
  if (input.pointerX !== null && Math.abs(input.pointerX - p.x) > 6) {
    direction = input.pointerX > p.x ? 1 : -1;
  }
  p.x = clamp(p.x + direction * p.speed * dt, 30, W - 30);

  // Автоматическая стрельба
  p.fireTimer -= dt;
  if (p.fireTimer <= 0) {
    shoot();
    p.fireTimer = 1 / p.fireRate;
  }

  if (p.regen) p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
  if (p.hurtTimer > 0) p.hurtTimer -= dt;
  if (p.shield && !p.shieldReady) {
    p.shieldTimer -= dt;
    if (p.shieldTimer <= 0) p.shieldReady = true;
  }
  updateHud();
}

// Враги появляются по одному, с промежутком; на экране не больше LAB.maxEnemies
function updateSpawning(dt) {
  if (game.pendingBoss && !game.bossAlive && enemies.length === 0) {
    game.pendingBoss = false;
    spawnBoss();
    return;
  }
  if (game.bossAlive || game.pendingBoss) return; // пока босс — без новых врагов

  game.spawnTimer -= dt;
  const maxAlive = Math.min(LAB.maxEnemies, 1 + Math.floor(game.kills / 2));
  if (game.spawnTimer <= 0 && enemies.length < maxAlive) {
    spawnEnemy();
    game.spawnTimer = Math.max(1.1, 3 - game.kills * 0.08);
  }
}

function updateBullets(dt) {
  for (const b of bullets) {
    // Самонаведение: пуля поворачивает к ближайшему врагу
    if (player.homing && enemies.length) {
      let target = null;
      let best = Infinity;
      for (const e of enemies) {
        const d = Math.hypot(e.x - b.x, e.y - b.y);
        if (d < best && e.y < b.y) { best = d; target = e; }
      }
      if (target) b.vx += clamp(target.x - b.x, -1, 1) * 900 * dt;
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    for (const e of enemies) {
      if (b.hits.includes(e)) continue;
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.size * 0.45 + b.r) {
        b.hits.push(e);
        hitEnemy(e, player.damage);
        // Взрывные пули задевают соседей
        if (player.explosive) {
          for (const other of enemies) {
            if (other !== e && Math.hypot(other.x - e.x, other.y - e.y) < 80) hitEnemy(other, player.damage * 0.5);
          }
          spawnParticles(e.x, e.y, 12, '#ff9f43', 260);
        }
        if (b.pierce > 0) b.pierce--;
        else { b.dead = true; break; }
      }
    }
  }
  bullets = bullets.filter(b => !b.dead && b.y > -30 && b.x > -30 && b.x < W + 30);

  // Убираем побеждённых врагов (по одному за кадр — после него может быть вопрос)
  const dead = enemies.find(e => e.hp <= 0);
  if (dead) killEnemy(dead);
}

function updateEnemies(dt) {
  for (const e of enemies) {
    e.t += dt;
    if (e.hit > 0) e.hit -= dt;
    let speed = e.speed;
    if (e.slow > 0) { e.slow -= dt; speed *= 0.5; }
    if (e.burn > 0) { e.burn -= dt; e.hp -= 5 * dt; }

    if (e.path === 'boss') {
      // Босс спускается до верха экрана и ходит из стороны в сторону
      if (e.y < 150) e.y += speed * dt;
      e.x = W / 2 + Math.sin(e.t * 0.8) * (W / 2 - 90);
      e.shotTimer -= dt;
      if (e.shotTimer <= 0) {
        e.shotTimer = Math.max(1.2, 2.4 - game.threat * 0.05);
        enemyShots.push({ x: e.x, y: e.y + 40, vy: 180, emoji: currentTheme().boss.shot });
      }
      continue;
    }

    e.y += speed * dt;
    if (e.path === 'zigzag') {
      e.x += e.vx * dt * (e.slow > 0 ? 0.5 : 1);
      if (e.x < 30 || e.x > W - 30) e.vx *= -1;
    } else if (e.path === 'sine') {
      e.x = clamp(e.baseX + Math.sin(e.t * 2) * 70, 30, W - 30);
    }

    // Враг врезался в героя
    if (Math.abs(e.x - player.x) < 40 && Math.abs(e.y - PLAYER_Y) < 40) {
      e.gone = true;
      spawnParticles(e.x, e.y, 18, '#ff4d6d', 220);
      hurtPlayer(20);
    } else if (e.y > H + 20) {
      // Враг долетел до низа
      e.gone = true;
      hurtPlayer(15);
    }
  }
  enemies = enemies.filter(e => !e.gone);
}

function updateEnemyShots(dt) {
  for (const s of enemyShots) {
    s.y += s.vy * dt;
    if (Math.abs(s.x - player.x) < 28 && Math.abs(s.y - PLAYER_Y) < 30) {
      s.dead = true;
      hurtPlayer(12);
    }
  }
  enemyShots = enemyShots.filter(s => !s.dead && s.y < H + 30);
}


/* ---------------------------------------------------------
   13. РИСОВАНИЕ ОДНОГО КАДРА
   --------------------------------------------------------- */

function draw() {
  ctx.save();
  if (game.shake > 0) ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);

  drawBackground();
  if (['playing', 'quiz', 'perk', 'paused', 'countdown', 'over'].includes(game.state) && player) {
    drawBullets();
    drawEnemies();
    for (const s of enemyShots) drawEmoji(s.emoji, s.x, s.y, 30);
    drawPlayer();
  }
  drawParticles();
  ctx.restore();
}

function drawPlayer() {
  const p = player;
  const accent = currentTheme().accent;
  drawGlow(p.x, PLAYER_Y + 10, 60, hexToRgba(accent, 0.35));
  if (p.hurtTimer > 0 && Math.floor(game.time * 20) % 2 === 0) ctx.globalAlpha = 0.4;
  drawEmoji(p.emoji, p.x, PLAYER_Y, 54);
  ctx.globalAlpha = 1;
  // Щит — светящееся кольцо
  if (p.shield && p.shieldReady) {
    ctx.strokeStyle = 'rgba(127,220,255,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, PLAYER_Y, 40 + Math.sin(game.time * 6) * 2, 0, TAU);
    ctx.stroke();
  }
}

function drawBullets() {
  const accent = currentTheme().accent;
  for (const b of bullets) {
    const color = LAB.rainbowBullets ? 'hsl(' + Math.round((game.time * 300 + b.x) % 360) + ', 100%, 60%)'
      : player.fire ? '#ff9f43' : player.ice ? '#9fe6ff' : accent;
    drawGlow(b.x, b.y, b.r * 3, hexToRgba(color, 0.5));
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.r, b.r * 2, 0, 0, TAU);
    ctx.fill();
    drawCircle(b.x, b.y, b.r * 0.5, '#ffffff');
  }
}

function drawEnemies() {
  for (const e of enemies) {
    const size = e.size * (e.hit > 0 ? 1.15 : 1);
    if (e.slow > 0) drawGlow(e.x, e.y, e.size, 'rgba(150,220,255,0.45)');
    if (e.burn > 0) drawGlow(e.x, e.y, e.size, 'rgba(255,120,40,0.45)');
    drawEmoji(e.emoji, e.x, e.y, size);

    // Мини-полоска здоровья над врагом (у босса — большая сверху в HUD)
    if (!e.boss) {
      const w = 44;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(e.x - w / 2, e.y - e.size / 2 - 12, w, 6);
      ctx.fillStyle = e.hp / e.maxHp > 0.4 ? '#39d97a' : '#ff4d6d';
      ctx.fillRect(e.x - w / 2, e.y - e.size / 2 - 12, w * Math.max(0, e.hp / e.maxHp), 6);
    }
  }
}

// '#00FFFF' + 0.5 → 'rgba(0,255,255,0.5)'
function hexToRgba(color, alpha) {
  if (!color.startsWith('#')) return color.replace('hsl(', 'hsla(').replace(')', ', ' + alpha + ')');
  const n = parseInt(color.slice(1), 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
}


/* ---------------------------------------------------------
   14. ЭКРАНЫ И ИНТЕРФЕЙС
   --------------------------------------------------------- */

const screens = {
  menu: document.getElementById('menuScreen'),
  hero: document.getElementById('heroScreen'),
  difficulty: document.getElementById('difficultyScreen'),
  quiz: document.getElementById('quizScreen'),
  perk: document.getElementById('perkScreen'),
  settings: document.getElementById('settingsScreen'),
  pause: document.getElementById('pauseScreen'),
  over: document.getElementById('gameOverScreen')
};

// Показать один экран (или ни одного, если name = null)
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

// Карточка выбора (герой, сложность, перк). stats — полоски «точек»
function makeChoice(icon, title, desc, stats, onPick, key) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'choice';
  let html = '<span class="choice-icon">' + icon + '</span><span><span class="choice-title">' + title + '</span>';
  if (desc) html += '<br><span class="choice-desc">' + desc + '</span>';
  if (stats) {
    html += '<span class="choice-stats">';
    for (const [label, value] of stats) {
      const dots = Math.round(clamp(value, 1, 5));
      html += '<span class="stat-row"><span>' + label + '</span><span class="stat-dots">' + '●'.repeat(dots) + '○'.repeat(5 - dots) + '</span></span>';
    }
    html += '</span>';
  }
  html += '</span>';
  button.innerHTML = html;
  button.title = 'Клавиша ' + key;
  button.addEventListener('click', onPick);
  return button;
}

function updateHud() {
  if (!player) return;
  const p = player;
  document.getElementById('hpFill').style.width = (p.hp / p.maxHp * 100) + '%';
  document.getElementById('hpFill').style.backgroundPosition = (100 - p.hp / p.maxHp * 100) + '% 0';
  document.getElementById('hpText').textContent = Math.ceil(p.hp) + ' / ' + p.maxHp;
  document.getElementById('score').textContent = game.score;
  document.getElementById('threat').textContent = game.threat;

  // Статы оружия
  const chips = ['💥 ' + Math.round(p.damage), '⚡ ' + p.fireRate.toFixed(1) + '/с', '🔫 ×' + p.bullets];
  if (p.side) chips.push('↗️');
  if (p.pierce) chips.push('🗡️' + p.pierce);
  if (p.crit) chips.push('🍀' + Math.round(p.crit * 100) + '%');
  if (p.ice) chips.push('❄️');
  if (p.fire) chips.push('🔥');
  if (p.homing) chips.push('🎯');
  if (p.explosive) chips.push('💣');
  if (p.shield) chips.push(p.shieldReady ? '🛡️' : '🛡️…');
  const html = chips.map(c => '<span class="chip">' + c + '</span>').join('');
  const box = document.getElementById('weaponStats');
  if (box.innerHTML !== html) box.innerHTML = html;

  // Полоска босса
  const boss = enemies.find(e => e.boss);
  document.getElementById('bossBar').classList.toggle('hidden', !boss);
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

// Перезапустить CSS-анимацию: убрать класс и добавить снова
function restartAnimation(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

// Цвет мира → в CSS и подпись в меню
function applyTheme() {
  const theme = currentTheme();
  const subject = findById(SUBJECTS, settings.subject);
  document.documentElement.style.setProperty('--accent', theme.accent);
  document.getElementById('menuInfo').textContent =
    theme.icon + ' ' + theme.label + ' · ' + subject.icon + ' ' + subject.label + ' · ' + findById(INPUT_MODES, settings.inputMode).label;
}


/* ---------------------------------------------------------
   15. ЭКРАН НАСТРОЕК
   Кнопки создаются из списков в разделе 1
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
      if (settingName === 'theme') settings.hero = 0;
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
  const code = event.code;
  // Пока печатаем ответ — клавиши игры не работают
  if (document.activeElement && document.activeElement.id === 'quizInput') return;

  if (['ArrowLeft', 'ArrowRight', 'Space', 'ArrowUp', 'ArrowDown'].includes(code)) event.preventDefault();
  if (code === 'ArrowLeft' || code === 'KeyA') input.left = true;
  if (code === 'ArrowRight' || code === 'KeyD') input.right = true;

  // Цифры 1–4 выбирают вариант ответа, героя, сложность или улучшение
  const digit = Number(event.key);
  if (digit >= 1 && digit <= 4) {
    let list = null;
    if (game.state === 'quiz') list = document.querySelectorAll('.quiz-option');
    else if (isVisible(screens.hero)) list = document.querySelectorAll('#heroChoices .choice');
    else if (isVisible(screens.difficulty)) list = document.querySelectorAll('#difficultyChoices .choice');
    else if (game.state === 'perk') list = document.querySelectorAll('#perkChoices .choice');
    if (list && list[digit - 1]) list[digit - 1].click();
  }

  if (code === 'Space' || code === 'Enter') {
    if (isVisible(screens.menu)) openHeroSelect();
    else if (isVisible(screens.over)) startGame();
  }
  if (code === 'Escape' || code === 'KeyP') {
    if (game.state === 'playing') pauseGame();
    else if (game.state === 'paused') resumeGame();
    else if (isVisible(screens.settings)) showScreen('menu');
  }
});

document.addEventListener('keyup', (event) => {
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') input.left = false;
  if (event.code === 'ArrowRight' || event.code === 'KeyD') input.right = false;
});

// Мышь и палец: герой идёт туда, где держишь
function pointerToGameX(event) {
  const rect = canvas.getBoundingClientRect();
  return (event.clientX - rect.left) / rect.width * W;
}

canvas.addEventListener('pointerdown', (event) => {
  input.pointerX = pointerToGameX(event);
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (input.pointerX !== null) input.pointerX = pointerToGameX(event);
});
canvas.addEventListener('pointerup', () => { input.pointerX = null; });
canvas.addEventListener('pointercancel', () => { input.pointerX = null; });

// Кнопки экранов
document.getElementById('startButton').addEventListener('click', openHeroSelect);
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
resizeGame();
applyTheme();
showScreen('menu');
requestAnimationFrame(loop);
