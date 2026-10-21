/* Флаппи на ArcadeJS: птичка летит между трубами.
   Пробел, клик или касание — взмах крыльями. */

// ===== 0. ЛАБОРАТОРИЯ ИГРЫ 🧪 =====
const LAB = {
  title: 'Флаппи',        // название в меню
  bird: '🐤',             // герой-эмодзи
  gravity: 1400,          // сила притяжения: меньше — птичка падает медленнее
  flapPower: 430,         // сила взмаха
  pipeGap: 190,           // просвет между трубами: больше — легче
  pipeSpeed: 200,         // скорость труб
  pipeEvery: 1.6,         // новая пара труб каждые N секунд
  pipeColor: '#3ecf5a',   // цвет труб
  lives: 1,               // жизни
  world: 'sky'            // мир: sky, space, forest, ocean, night, candy, desert, city
};

Arcade.create({
  title: LAB.title,
  emoji: LAB.bird,
  subtitle: 'Пролети между трубами',
  help: 'Пробел, клик или касание — взмах · Esc — пауза',
  width: 480, height: 720,          // вертикальная игра — удобно на телефоне
  world: LAB.world, worlds: true,   // мир можно сменить в настройках
  lives: LAB.lives,

  setup(game) {
    // Пока игрок не взмахнул первый раз, птичка висит, а трубы не едут
    game.data.bird = game.add({ emoji: LAB.bird, x: 140, y: 300, size: 50, tag: 'bird' });
    game.data.flying = false;
    game.message('Взмахни, чтобы начать!', 2);
  },

  update(game, dt) {
    const bird = game.data.bird;
    if (game.pressed('action')) {
      if (!game.data.flying) {
        game.data.flying = true;
        bird.gravity = LAB.gravity;
        addPipes(game);
        game.every(LAB.pipeEvery, addPipes);
      }
      bird.vy = -LAB.flapPower;
      game.sound('flap', 0.6);
    }
    if (!game.data.flying) {
      bird.y = 300 + Math.sin(game.time * 4) * 10; // покачивается на месте
      return;
    }
    bird.angle = game.clamp(bird.vy / 900, -0.5, 1); // нос вниз при падении

    // Пролетели трубу — очко
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

// Пара труб: сверху и снизу, между ними просвет
function addPipes(game) {
  const gapY = game.rand(170, game.height - 170);
  const x = game.width + 50;
  const topH = gapY - LAB.pipeGap / 2;
  const bottomH = game.height - (gapY + LAB.pipeGap / 2);
  const pipe = { x: x, w: 84, color: LAB.pipeColor, radius: 12, vx: -LAB.pipeSpeed, tag: 'pipe', removeOffscreen: true, hitbox: 0.92 };
  game.add(Object.assign({}, pipe, { y: topH / 2, h: topH, top: true }));
  game.add(Object.assign({}, pipe, { y: game.height - bottomH / 2, h: bottomH }));
}

function crash(game) {
  const bird = game.data.bird;
  game.burst(bird.x, bird.y, { emoji: '🪶', count: 8 });
  if (game.loseLife() && game.lives > 0) {
    // Ещё есть жизни: птичка снова в центре, трубы убираем
    bird.y = 300;
    bird.vy = 0;
    bird.blink = 1;
    game.clear('pipe');
    bird.vy = -LAB.flapPower; // сразу подбрасываем, чтобы не упасть снова
  }
}
