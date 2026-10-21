/* «Космо-раннер 3D» на ArcadeJS + Three.js.
   ← → — полоса, пробел или ↑ — прыжок. Собирай монеты, перепрыгивай камни. */

// ===== 0. ЛАБОРАТОРИЯ ИГРЫ 🧪 =====
const LAB = {
  title: 'Космо-раннер 3D', // название в меню
  ship: '🛸',               // герой
  rock: '#8d6e63',          // цвет камней
  coin: '#ffd60a',          // цвет монет
  road: '#2b2d42',          // цвет дороги
  speed: 18,                // скорость на старте
  jump: 9,                  // сила прыжка
  gravity: 24,              // притяжение
  lives: 3,                 // жизни
  world: 'space'            // мир
};

const LANES = [-3, 0, 3]; // три полосы

Arcade.create({
  title: LAB.title,
  emoji: LAB.ship,
  subtitle: 'Лети по трассе, собирай монеты',
  help: '← → — полоса · Пробел или ↑ — прыжок · свайпы на телефоне',
  mode: '3d',                         // 3D-режим: Three.js загрузится сам
  world: LAB.world, worlds: true,
  lives: LAB.lives,
  buttons: ['left', 'right', 'action'], actionLabel: '⤒',

  setup(game) {
    const d = game.data;
    d.lane = 1;
    d.speed = LAB.speed * game.diff;
    game.add3d({ shape: 'plane', w: 10, d: 220, z: -90, color: LAB.road });
    d.ship = game.add3d({ emoji: LAB.ship, w: 1.8, h: 1.8, x: 0, y: 0.9, z: 0, gravity: LAB.gravity, tag: 'ship' });
    game.follow(d.ship, { offset: { x: 0, y: 3.5, z: 7 }, smooth: 6 });
    game.every(0.7, spawnRow);
    game.every(0.25, spawnStripes);
  },

  update(game, dt) {
    const d = game.data, ship = d.ship;
    if (game.pressed('left')) d.lane = Math.max(0, d.lane - 1);
    if (game.pressed('right')) d.lane = Math.min(2, d.lane + 1);
    if ((game.pressed('action') || game.pressed('up')) && ship.onGround) { ship.vy = LAB.jump; game.sound('jump', 0.5); }
    ship.x += (LANES[d.lane] - ship.x) * Math.min(1, dt * 12); // плавно в свою полосу

    d.speed += dt * 0.25;                                   // постепенно быстрее
    game.all().forEach(o => { if (o.tag === 'rock' || o.tag === 'coin' || o.tag === 'stripe') o.vz = d.speed; });

    const coin = game.hitAny(ship, 'coin');
    if (coin) { coin.remove(); game.addScore(10); game.sound('coin', 0.5); }
    const rock = game.hitAny(ship, 'rock');
    if (rock && game.loseLife()) { rock.remove(); ship.blink = 1; }
    game.hud('🚀', Math.round(d.speed * 10) + ' км/ч');
  }
});

// Ряд впереди: камень на одной полосе, монеты на другой
function spawnRow(game) {
  const lanes = game.shuffle([0, 1, 2]);
  game.add3d({ shape: 'box', size: 1.6, x: LANES[lanes[0]], y: 0.8, z: -100, color: LAB.rock, tag: 'rock', removeOffscreen: true, spin: 1 });
  if (game.chance(0.6)) {
    for (let i = 0; i < 3; i++) game.add3d({ shape: 'sphere', size: 0.7, x: LANES[lanes[1]], y: 0.9, z: -100 - i * 3, color: LAB.coin, tag: 'coin', removeOffscreen: true });
  }
}

// Полоски по краям дороги — чтобы чувствовалась скорость
function spawnStripes(game) {
  [-5.2, 5.2].forEach(x => game.add3d({ shape: 'box', w: 0.2, h: 0.1, d: 2, x: x, y: 0.05, z: -100, color: '#00e5ff', tag: 'stripe', removeOffscreen: true, shadow: false }));
}
