/* Змейка-умник на ArcadeJS: ешь яблоки, а за знак вопроса — ответь на вопрос.
   Стрелки, WASD или свайпы — поворот. */

// ===== 0. ЛАБОРАТОРИЯ ИГРЫ 🧪 =====
const LAB = {
  title: 'Змейка-умник',  // название в меню
  head: '🐍',             // голова змейки
  food: '🍎',             // еда
  bodyColor: '#7ee081',   // цвет тела
  step: 0.13,             // шаг змейки в секундах: больше — медленнее
  startLength: 4,         // длина на старте
  grow: 1,                // рост за яблоко
  quizEvery: 3,           // вопрос ❓ появляется после каждых N яблок
  lives: 3,               // жизни
  wrap: false             // true — сквозь стены
};

const CELL = 40, COLS = 20, ROWS = 15; // поле 20 × 15 клеток (800 × 600)
const TOP = 1;                         // верхняя строка — под панель очков

Arcade.create({
  title: LAB.title,
  emoji: LAB.head,
  subtitle: 'Ешь яблоки и отвечай на вопросы ❓',
  world: 'forest', worlds: true,
  quiz: true,                // вопросы: предмет выбирают в настройках
  difficulty: true,
  lives: LAB.lives,
  buttons: ['left', 'right', 'up', 'down'],

  setup(game) {
    const d = game.data;
    d.eaten = 0;
    resetSnake(game);
    d.food = freeCell(game);
    d.question = null;
    game.every(LAB.step / game.diff, step);
  },

  update(game) {
    const d = game.data;
    // Поворот: нельзя развернуться назад
    if (game.pressed('left') && d.dir.x === 0) d.next = { x: -1, y: 0 };
    if (game.pressed('right') && d.dir.x === 0) d.next = { x: 1, y: 0 };
    if (game.pressed('up') && d.dir.y === 0) d.next = { x: 0, y: -1 };
    if (game.pressed('down') && d.dir.y === 0) d.next = { x: 0, y: 1 };
  },

  // Своё рисование: поле, змейка, еда
  draw(game) {
    const d = game.data;
    for (let y = TOP; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if ((x + y) % 2 === 0) game.rect(x * CELL + CELL / 2, y * CELL + CELL / 2, CELL, CELL, 'rgba(255,255,255,0.08)');
      }
    }
    game.emoji(LAB.food, d.food.x * CELL + CELL / 2, d.food.y * CELL + CELL / 2, 32);
    if (d.question) game.emoji('❓', d.question.x * CELL + CELL / 2, d.question.y * CELL + CELL / 2, 32);
    d.snake.forEach((part, i) => {
      const x = part.x * CELL + CELL / 2, y = part.y * CELL + CELL / 2;
      if (i === 0) game.emoji(LAB.head, x, y, 36);
      else game.rect(x, y, CELL - 6, CELL - 6, LAB.bodyColor, { radius: 10 });
    });
  }
});

function resetSnake(game) {
  const d = game.data;
  d.snake = [];
  for (let i = 0; i < LAB.startLength; i++) d.snake.push({ x: 6 - i, y: 8 });
  d.dir = { x: 1, y: 0 };
  d.next = d.dir;
  d.grow = 0;
}

// Случайная пустая клетка
function freeCell(game) {
  const d = game.data;
  while (true) {
    const c = { x: game.randInt(0, COLS - 1), y: game.randInt(TOP, ROWS - 1) };
    const busy = d.snake.some(p => p.x === c.x && p.y === c.y) || (d.food && d.food.x === c.x && d.food.y === c.y);
    if (!busy) return c;
  }
}

function step(game) {
  const d = game.data;
  d.dir = d.next;
  const head = { x: d.snake[0].x + d.dir.x, y: d.snake[0].y + d.dir.y };

  // Стена
  if (head.x < 0 || head.x >= COLS || head.y < TOP || head.y >= ROWS) {
    if (!LAB.wrap) return crash(game);
    head.x = (head.x + COLS) % COLS;
    head.y = head.y < TOP ? ROWS - 1 : head.y >= ROWS ? TOP : head.y;
  }
  // Свой хвост
  if (d.snake.some(p => p.x === head.x && p.y === head.y)) return crash(game);

  d.snake.unshift(head);
  if (d.grow > 0) d.grow--; else d.snake.pop();

  const px = head.x * CELL + CELL / 2, py = head.y * CELL + CELL / 2;
  if (head.x === d.food.x && head.y === d.food.y) {
    d.grow += LAB.grow;
    d.eaten++;
    game.addScore(1, px, py);
    game.sound('coin', 0.5);
    game.burst(px, py, { emoji: '✨', count: 6 });
    d.food = freeCell(game);
    if (d.eaten % LAB.quizEvery === 0 && !d.question) d.question = freeCell(game);
  }
  if (d.question && head.x === d.question.x && head.y === d.question.y) {
    d.question = null;
    game.ask().then(ok => {
      if (ok) { d.grow += 3; game.addScore(10, px, py); }
      else game.loseLife();
    });
  }
}

function crash(game) {
  game.burst(game.data.snake[0].x * CELL, game.data.snake[0].y * CELL, { color: LAB.bodyColor, count: 20 });
  if (game.loseLife() && game.lives > 0) resetSnake(game);
}
