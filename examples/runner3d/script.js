/* Space Runner 3D — Three.js mode: switch lanes, jump over rocks, collect coins.
   ← → change lane, Space or ↑ jump, swipes on phones. */

// ===== Settings =====
const CONFIG = {
  title: 'Space Runner 3D',
  ship: '🛸',
  rock: '#8d6e63',
  coin: '#ffd60a',
  road: '#2b2d42',
  speed: 18,                // starting speed
  jump: 9,
  gravity: 24,
  lives: 3,
  world: 'space'
};

const LANES = [-3, 0, 3]; // three lanes

Arcade.create({
  title: CONFIG.title,
  emoji: CONFIG.ship,
  subtitle: 'Fly the track, grab the coins',
  help: '← → lane · Space or ↑ jump · swipes on phones',
  mode: '3d',                         // Three.js loads automatically
  world: CONFIG.world, worlds: true,
  lives: CONFIG.lives,
  buttons: ['left', 'right', 'action'], actionLabel: '⤒',

  setup(game) {
    const d = game.data;
    d.lane = 1;
    d.speed = CONFIG.speed * game.diff;
    game.add3d({ shape: 'plane', w: 10, d: 220, z: -90, color: CONFIG.road });
    d.ship = game.add3d({ emoji: CONFIG.ship, w: 1.8, h: 1.8, x: 0, y: 0.9, z: 0, gravity: CONFIG.gravity, tag: 'ship' });
    game.follow(d.ship, { offset: { x: 0, y: 3.5, z: 7 }, smooth: 6 });
    game.every(0.7, spawnRow);
    game.every(0.25, spawnStripes);
  },

  update(game, dt) {
    const d = game.data, ship = d.ship;
    if (game.pressed('left')) d.lane = Math.max(0, d.lane - 1);
    if (game.pressed('right')) d.lane = Math.min(2, d.lane + 1);
    if ((game.pressed('action') || game.pressed('up')) && ship.onGround) { ship.vy = CONFIG.jump; game.sound('jump', 0.5); }
    ship.x += (LANES[d.lane] - ship.x) * Math.min(1, dt * 12); // glide into the lane

    d.speed += dt * 0.25;                                       // slowly faster
    game.all().forEach(o => { if (o.tag === 'rock' || o.tag === 'coin' || o.tag === 'stripe') o.vz = d.speed; });

    const coin = game.hitAny(ship, 'coin');
    if (coin) { coin.remove(); game.addScore(10); game.sound('coin', 0.5); }
    const rock = game.hitAny(ship, 'rock');
    if (rock && game.loseLife()) { rock.remove(); ship.blink = 1; }
    game.hud('🚀', Math.round(d.speed * 10) + ' km/h');
  }
});

// A row ahead: a rock in one lane, coins in another
function spawnRow(game) {
  const lanes = game.shuffle([0, 1, 2]);
  game.add3d({ shape: 'box', size: 1.6, x: LANES[lanes[0]], y: 0.8, z: -100, color: CONFIG.rock, tag: 'rock', removeOffscreen: true, spin: 1 });
  if (game.chance(0.6)) {
    for (let i = 0; i < 3; i++) game.add3d({ shape: 'sphere', size: 0.7, x: LANES[lanes[1]], y: 0.9, z: -100 - i * 3, color: CONFIG.coin, tag: 'coin', removeOffscreen: true });
  }
}

// Edge stripes give a sense of speed
function spawnStripes(game) {
  [-5.2, 5.2].forEach(x => game.add3d({ shape: 'box', w: 0.2, h: 0.1, d: 2, x: x, y: 0.05, z: -100, color: '#00e5ff', tag: 'stripe', removeOffscreen: true, shadow: false }));
}
