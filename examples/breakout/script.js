/* Space Breakout — bounce the ball and break all the bricks.
   Mouse, finger or arrows move the paddle; Space or tap launches the ball.
   Shows game.choose() — pick an upgrade between levels. */

// ===== Settings =====
const CONFIG = {
  title: 'Space Breakout',
  ball: '🔵',
  paddleWidth: 130,
  paddleColor: '#00e5ff',
  ballSpeed: 380,
  rows: 4,                 // brick rows on level 1
  cols: 9,                 // bricks per row
  lives: 3,
  colors: ['#ff4d6d', '#ffb703', '#8ac926', '#4cc9f0', '#b388ff'],
  world: 'space'
};

Arcade.create({
  title: CONFIG.title,
  emoji: '🧱',
  subtitle: 'Break all the bricks',
  world: CONFIG.world, worlds: true,
  lives: CONFIG.lives,
  buttons: ['left', 'right', 'action'],

  setup(game) {
    const d = game.data;
    d.width = CONFIG.paddleWidth;
    d.speed = CONFIG.ballSpeed;
    d.paddle = game.add({ x: game.width / 2, y: game.height - 40, w: d.width, h: 18, radius: 9, color: CONFIG.paddleColor, glow: CONFIG.paddleColor });
    d.ball = game.add({ emoji: CONFIG.ball, size: 24, x: 0, y: 0, tag: 'ball', hitbox: 1 });
    d.stuck = true;                 // the ball sits on the paddle until launched
    buildBricks(game, CONFIG.rows);
  },

  update(game, dt) {
    const d = game.data, paddle = d.paddle, ball = d.ball;

    // Paddle: keys or mouse/finger
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

    // Walls
    if (ball.x < 12 || ball.x > game.width - 12) { ball.vx *= -1; ball.x = game.clamp(ball.x, 12, game.width - 12); }
    if (ball.y < 12) { ball.vy = Math.abs(ball.vy); }
    if (ball.y > game.height + 20) {
      d.stuck = true;
      game.loseLife();
      return;
    }

    // Paddle: bounce angle depends on where the ball hits
    if (ball.vy > 0 && game.hit(ball, paddle)) {
      launch(game, (ball.x - paddle.x) / (paddle.w / 2) * 0.9);
      game.sound('jump', 0.5);
    }

    // Brick
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

// Launch at an angle: -1 left, 0 up, 1 right
function launch(game, side) {
  const a = -Math.PI / 2 + side;
  game.data.ball.vx = Math.cos(a) * game.data.speed;
  game.data.ball.vy = Math.sin(a) * game.data.speed;
}

function buildBricks(game, rows) {
  const w = (game.width - 60) / CONFIG.cols;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < CONFIG.cols; c++) {
      game.add({ x: 30 + w * c + w / 2, y: 80 + r * 34, w: w - 8, h: 26, radius: 6, color: CONFIG.colors[r % CONFIG.colors.length], tag: 'brick', hitbox: 1 });
    }
  }
}

// All bricks broken: pick an upgrade, then the next level
function levelUp(game) {
  const d = game.data;
  d.stuck = true;
  game.choose([
    { icon: '↔️', title: 'Wider', text: 'Paddle +30', apply: () => { d.width += 30; } },
    { icon: '🐢', title: 'Slower', text: 'Ball 15% slower', apply: () => { d.speed *= 0.85; } },
    { icon: '❤️', title: '+1 life', text: 'One more try', apply: () => game.addLife() }
  ]).then(card => {
    card.apply();
    const level = game.nextLevel();
    d.speed *= 1.08;
    buildBricks(game, Math.min(CONFIG.rows + level - 1, 8));
  });
}
