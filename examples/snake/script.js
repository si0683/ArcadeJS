/* Quiz Snake — eat apples; eat a ❓ to get a quiz question.
   Arrows, WASD or swipes to turn. Shows the draw() hook, timers and game.ask(). */

// ===== Settings =====
const CONFIG = {
  title: 'Quiz Snake',
  head: '🐍',
  food: '🍎',
  bodyColor: '#7ee081',
  step: 0.13,             // seconds per move: bigger = slower
  startLength: 4,
  grow: 1,                // growth per apple
  quizEvery: 3,           // a ❓ appears after every N apples
  lives: 3,
  wrap: false             // true: go through walls
};

const CELL = 40, COLS = 20, ROWS = 15; // 20 × 15 grid (800 × 600)
const TOP = 1;                         // top row is reserved for the HUD

Arcade.create({
  title: CONFIG.title,
  emoji: CONFIG.head,
  subtitle: 'Eat apples and answer questions ❓',
  world: 'forest', worlds: true,
  // Quiz: math works in any language; add your own questions here
  quiz: {
    questions: [
      { text: 'Capital of France?', answer: 'Paris', wrong: ['Rome', 'Berlin', 'Madrid'] },
      { text: 'Largest planet?', answer: 'Jupiter', wrong: ['Mars', 'Venus', 'Saturn'] },
      { text: 'H₂O is…', answer: 'Water', wrong: ['Salt', 'Air', 'Gold'] }
    ]
  },
  difficulty: true,
  lives: CONFIG.lives,
  buttons: ['left', 'right', 'up', 'down'],

  setup(game) {
    const d = game.data;
    d.eaten = 0;
    resetSnake(game);
    d.food = freeCell(game);
    d.question = null;
    game.every(CONFIG.step / game.diff, step);
  },

  update(game) {
    const d = game.data;
    // Turn, but never straight back
    if (game.pressed('left') && d.dir.x === 0) d.next = { x: -1, y: 0 };
    if (game.pressed('right') && d.dir.x === 0) d.next = { x: 1, y: 0 };
    if (game.pressed('up') && d.dir.y === 0) d.next = { x: 0, y: -1 };
    if (game.pressed('down') && d.dir.y === 0) d.next = { x: 0, y: 1 };
  },

  // Custom drawing: board, snake, food
  draw(game) {
    const d = game.data;
    for (let y = TOP; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if ((x + y) % 2 === 0) game.rect(x * CELL + CELL / 2, y * CELL + CELL / 2, CELL, CELL, 'rgba(255,255,255,0.08)');
      }
    }
    game.emoji(CONFIG.food, d.food.x * CELL + CELL / 2, d.food.y * CELL + CELL / 2, 32);
    if (d.question) game.emoji('❓', d.question.x * CELL + CELL / 2, d.question.y * CELL + CELL / 2, 32);
    d.snake.forEach((part, i) => {
      const x = part.x * CELL + CELL / 2, y = part.y * CELL + CELL / 2;
      if (i === 0) game.emoji(CONFIG.head, x, y, 36);
      else game.rect(x, y, CELL - 6, CELL - 6, CONFIG.bodyColor, { radius: 10 });
    });
  }
});

function resetSnake(game) {
  const d = game.data;
  d.snake = [];
  for (let i = 0; i < CONFIG.startLength; i++) d.snake.push({ x: 6 - i, y: 8 });
  d.dir = { x: 1, y: 0 };
  d.next = d.dir;
  d.grow = 0;
}

// A random empty cell
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

  // Wall
  if (head.x < 0 || head.x >= COLS || head.y < TOP || head.y >= ROWS) {
    if (!CONFIG.wrap) return crash(game);
    head.x = (head.x + COLS) % COLS;
    head.y = head.y < TOP ? ROWS - 1 : head.y >= ROWS ? TOP : head.y;
  }
  // Own tail
  if (d.snake.some(p => p.x === head.x && p.y === head.y)) return crash(game);

  d.snake.unshift(head);
  if (d.grow > 0) d.grow--; else d.snake.pop();

  const px = head.x * CELL + CELL / 2, py = head.y * CELL + CELL / 2;
  if (head.x === d.food.x && head.y === d.food.y) {
    d.grow += CONFIG.grow;
    d.eaten++;
    game.addScore(1, px, py);
    game.sound('coin', 0.5);
    game.burst(px, py, { emoji: '✨', count: 6 });
    d.food = freeCell(game);
    if (d.eaten % CONFIG.quizEvery === 0 && !d.question) d.question = freeCell(game);
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
  game.burst(game.data.snake[0].x * CELL, game.data.snake[0].y * CELL, { color: CONFIG.bodyColor, count: 20 });
  if (game.loseLife() && game.lives > 0) resetSnake(game);
}
