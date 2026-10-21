/* Арканоид на ArcadeJS: отбивай шар и разбивай кирпичи.
   Мышь, палец или стрелки — платформа. Пробел или касание — запуск шара. */

// ===== 0. ЛАБОРАТОРИЯ ИГРЫ 🧪 =====
const LAB = {
  title: 'Космо-арканоид', // название в меню
  ball: '🔵',              // шар
  paddleWidth: 130,        // ширина платформы
  paddleColor: '#00e5ff',  // цвет платформы
  ballSpeed: 380,          // скорость шара
  rows: 4,                 // рядов кирпичей на 1 уровне
  cols: 9,                 // кирпичей в ряду
  lives: 3,                // жизни
  colors: ['#ff4d6d', '#ffb703', '#8ac926', '#4cc9f0', '#b388ff'], // цвета рядов
  world: 'space'           // мир
};

Arcade.create({
  title: LAB.title,
  emoji: '🧱',
  subtitle: 'Разбей все кирпичи',
  help: 'Мышь, палец или ← → — платформа · Пробел или касание — запуск',
  world: LAB.world, worlds: true,
  lives: LAB.lives,
  buttons: ['left', 'right', 'action'],

  setup(game) {
    const d = game.data;
    d.width = LAB.paddleWidth;
    d.speed = LAB.ballSpeed;
    d.paddle = game.add({ x: game.width / 2, y: game.height - 40, w: d.width, h: 18, radius: 9, color: LAB.paddleColor, glow: LAB.paddleColor });
    d.ball = game.add({ emoji: LAB.ball, size: 24, x: 0, y: 0, tag: 'ball', hitbox: 1 });
    d.stuck = true;                 // шар лежит на платформе до запуска
    buildBricks(game, LAB.rows);
  },

  update(game, dt) {
    const d = game.data, paddle = d.paddle, ball = d.ball;

    // Платформа: клавиши или мышь/палец
    if (game.key.left) paddle.x -= 600 * dt;
    if (game.key.right) paddle.x += 600 * dt;
    if (game.pointer.down) paddle.x = game.pointer.x;
    paddle.w = d.width;
    paddle.x = game.clamp(paddle.x, paddle.w / 2, game.width - paddle.w / 2);

    if (d.stuck) {
      ball.x = paddle.x; ball.y = paddle.y - 24; ball.vx = 0; ball.vy = 0;
      if (game.pressed('action')) { d.stuck = false; launch(game, -0.3); }
      return;
    }

    // Стены
    if (ball.x < 12 || ball.x > game.width - 12) { ball.vx *= -1; ball.x = game.clamp(ball.x, 12, game.width - 12); }
    if (ball.y < 12) { ball.vy = Math.abs(ball.vy); }
    if (ball.y > game.height + 20) {
      d.stuck = true;
      game.loseLife();
      return;
    }

    // Платформа: угол отскока зависит от места удара
    if (ball.vy > 0 && game.hit(ball, paddle)) {
      launch(game, (ball.x - paddle.x) / (paddle.w / 2) * 0.9);
      game.sound('jump', 0.5);
    }

    // Кирпич
    const brick = game.hitAny(ball, 'brick');
    if (brick) {
      brick.remove();
      ball.vy *= -1;
      game.addScore(10, brick.x, brick.y);
      game.burst(brick.x, brick.y, { color: brick.color, count: 12 });
      game.sound('coin', 0.4);
      if (game.count('brick') === 0) levelUp(game);
    }
  }
});

// Запуск шара под углом: -1 — влево, 0 — вверх, 1 — вправо
function launch(game, side) {
  const a = -Math.PI / 2 + side;
  game.data.ball.vx = Math.cos(a) * game.data.speed;
  game.data.ball.vy = Math.sin(a) * game.data.speed;
}

function buildBricks(game, rows) {
  const w = (game.width - 60) / LAB.cols;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < LAB.cols; c++) {
      game.add({ x: 30 + w * c + w / 2, y: 80 + r * 34, w: w - 8, h: 26, radius: 6, color: LAB.colors[r % LAB.colors.length], tag: 'brick', hitbox: 1 });
    }
  }
}

// Все кирпичи разбиты: выбор улучшения и новый уровень
function levelUp(game) {
  const d = game.data;
  d.stuck = true;
  game.choose([
    { icon: '↔️', title: 'Шире', text: 'Платформа +30', apply: () => { d.width += 30; } },
    { icon: '🐢', title: 'Медленнее', text: 'Шар на 15% медленнее', apply: () => { d.speed *= 0.85; } },
    { icon: '❤️', title: '+1 жизнь', text: 'Ещё одна попытка', apply: () => game.addLife() }
  ]).then(card => {
    card.apply();
    const level = game.nextLevel();
    d.speed *= 1.08;
    buildBricks(game, Math.min(LAB.rows + level - 1, 8));
  });
}
