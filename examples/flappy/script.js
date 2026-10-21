/* Flappy — fly between the pipes.
   Space, click or tap to flap. */

// ===== Settings =====
const CONFIG = {
  title: 'Flappy',
  bird: '🐤',             // player emoji
  gravity: 1400,          // lower = falls slower
  flapPower: 430,
  pipeGap: 190,           // gap between pipes: bigger = easier
  pipeSpeed: 200,
  pipeEvery: 1.6,         // a new pair of pipes every N seconds
  pipeColor: '#3ecf5a',
  lives: 1,
  world: 'sky'
};

GameMonster.create({
  title: CONFIG.title,
  emoji: CONFIG.bird,
  subtitle: 'Fly between the pipes',
  width: 480, height: 720,          // portrait game: great on phones
  world: CONFIG.world, worlds: true,
  lives: CONFIG.lives,

  setup(game) {
    // The bird hovers until the first flap; pipes start after it
    game.data.bird = game.add({ emoji: CONFIG.bird, x: 140, y: 300, size: 50, tag: 'bird' });
    game.data.flying = false;
  },

  update(game, dt) {
    const bird = game.data.bird;
    if (game.pressed('action')) {
      if (!game.data.flying) {
        game.data.flying = true;
        bird.gravity = CONFIG.gravity;
        addPipes(game);
        game.every(CONFIG.pipeEvery, addPipes);
      }
      bird.vy = -CONFIG.flapPower;
      game.sound('flap', 0.6);
    }
    if (!game.data.flying) {
      bird.y = 300 + Math.sin(game.time * 4) * 10; // idle bobbing
      return;
    }
    bird.angle = game.clamp(bird.vy / 900, -0.5, 1); // nose down when falling

    // Passed a pipe: +1 point
    game.all('pipe').forEach(pipe => {
      if (pipe.top && !pipe.passed && pipe.x < bird.x) {
        pipe.passed = true;
        game.addScore(1);
        game.sound('score', 0.5);
      }
    });

    if (game.hitAny(bird, 'pipe') || bird.y > game.height - 10 || bird.y < -60) crash(game);
  }
});

// A pair of pipes with a gap between them
function addPipes(game) {
  const gapY = game.rand(170, game.height - 170);
  const x = game.width + 50;
  const topH = gapY - CONFIG.pipeGap / 2;
  const bottomH = game.height - (gapY + CONFIG.pipeGap / 2);
  const pipe = { x: x, w: 84, color: CONFIG.pipeColor, radius: 12, vx: -CONFIG.pipeSpeed, tag: 'pipe', removeOffscreen: true, hitbox: 0.92 };
  game.add(Object.assign({}, pipe, { y: topH / 2, h: topH, top: true }));
  game.add(Object.assign({}, pipe, { y: game.height - bottomH / 2, h: bottomH }));
}

function crash(game) {
  const bird = game.data.bird;
  game.burst(bird.x, bird.y, { emoji: '🪶', count: 8 });
  if (game.loseLife() && game.lives > 0) {
    // Lives left: reset the bird and clear the pipes
    bird.y = 300;
    bird.vy = -CONFIG.flapPower;
    bird.blink = 1;
    game.clear('pipe');
  }
}
