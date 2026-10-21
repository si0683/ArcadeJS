/* Little Fox — a platformer: run, jump, collect candy and reach the flag.
   ← → run, ↑ or Space jump. Jump on enemies to defeat them.
   Shows a text-based level map, solid and one-way platforms, and the camera. */

// ===== Settings =====
const CONFIG = {
  title: 'Little Fox',
  hero: '🦊',
  enemy: '🐌',
  coin: '🍬',
  speed: 300,
  jump: 760,
  gravity: 1900,
  enemySpeed: 70,
  lives: 3,
  world: 'candy'
};

// Level map: one character per 48 × 48 tile
// # ground, = brick platform, - one-way platform, o coin,
// e enemy, P player start, F finish flag
const MAP = [
  '                                                                        ',
  '                                                                        ',
  '                                                                        ',
  '                    o o o                         o o                   ',
  '                    -----            o o         =====             F    ',
  '          o o                       =====                       ====    ',
  '         =====            o                 e           o o             ',
  '  P                ---         e         ======       -----      e      ',
  '              e         ####  ###     #####     e         e   ######    ',
  '####################   ##########   ###########################  #######',
  '####################   ##########   ###########################  #######'
];
const TILE = 48;

GameMonster.create({
  title: CONFIG.title,
  emoji: CONFIG.hero,
  subtitle: 'Reach the flag 🏁',
  width: 800, height: MAP.length * TILE,
  world: CONFIG.world, worlds: true,
  lives: CONFIG.lives,
  buttons: ['left', 'right', 'action'], actionLabel: '⤒',

  setup(game) {
    MAP.forEach((row, ty) => {
      [...row].forEach((ch, tx) => {
        const x = tx * TILE + TILE / 2, y = ty * TILE + TILE / 2;
        if (ch === '#') game.add({ x, y, w: TILE, h: TILE, color: ty > 0 && MAP[ty - 1][tx] === '#' ? '#a0522d' : '#6ab04c', tag: 'ground', hitbox: 1 });
        if (ch === '=') game.add({ x, y, w: TILE, h: TILE / 2, color: '#e17055', radius: 6, tag: 'ground', hitbox: 1 });
        if (ch === '-') game.add({ x, y: y - TILE / 4, w: TILE, h: 12, color: '#fdcb6e', radius: 6, tag: 'ground', oneWay: true, hitbox: 1 });
        if (ch === 'o') game.add({ emoji: CONFIG.coin, x, y, size: 30, tag: 'coin' });
        if (ch === 'e') game.add({ emoji: CONFIG.enemy, x, y, size: 40, h: 38, vx: -CONFIG.enemySpeed, gravity: CONFIG.gravity, tag: 'enemy' });
        if (ch === 'F') game.add({ emoji: '🏁', x, y, size: 56, tag: 'flag' });
        if (ch === 'P') game.data.start = { x, y };
      });
    });
    const s = game.data.start;
    game.data.hero = game.add({ emoji: CONFIG.hero, x: s.x, y: s.y, w: 38, h: 42, size: 46, gravity: CONFIG.gravity, tag: 'hero', z: 2 });
    game.follow(game.data.hero, { atX: 0.35, minX: 0, maxX: MAP[0].length * TILE - game.width });
  },

  update(game, dt) {
    const hero = game.data.hero;

    // Run and jump
    hero.vx = 0;
    if (game.key.left) { hero.vx = -CONFIG.speed; hero.flip = false; }
    if (game.key.right) { hero.vx = CONFIG.speed; hero.flip = true; }   // emoji face left
    if ((game.pressed('up') || game.pressed('action')) && hero.onGround) {
      hero.vy = -CONFIG.jump;
      game.sound('jump', 0.5);
    }
    game.collide(hero, 'ground');
    hero.x = Math.max(hero.w / 2, hero.x);

    // Enemies walk and turn at walls and ledges
    game.all('enemy').forEach(e => {
      const side = game.collide(e, 'ground');
      const ahead = { x: e.x + Math.sign(e.vx) * 26, y: e.y + 40, w: 4, h: 4, hitbox: 1 };
      if (side.left || side.right || (e.onGround && !game.all('ground').some(g => game.hit(ahead, g)))) {
        e.vx = e.vx > 0 ? -CONFIG.enemySpeed : CONFIG.enemySpeed;
      }
      e.flip = e.vx > 0;
      if (game.hit(hero, e)) {
        if (hero.vy > 0 && hero.y < e.y - 10) {
          // Stomp
          e.remove();
          hero.vy = -CONFIG.jump * 0.6;
          game.addScore(50, e.x, e.y);
          game.burst(e.x, e.y, { emoji: '💫', count: 6 });
          game.sound('crash', 0.4);
        } else if (game.loseLife()) {
          hero.blink = 1;
          hero.vy = -400;
        }
      }
    });

    const coin = game.hitAny(hero, 'coin');
    if (coin) {
      coin.remove();
      game.addScore(10, coin.x, coin.y);
      game.sound('coin', 0.5);
    }

    if (game.hitAny(hero, 'flag')) {
      game.addScore(100);
      game.burst(hero.x, hero.y, { emoji: '🎉', count: 20 });
      game.win();
    }

    // Fell into a pit
    if (hero.y > game.height + 60) {
      if (game.loseLife() && game.lives > 0) {
        hero.x = game.data.start.x; hero.y = game.data.start.y; hero.vy = 0; hero.blink = 1;
      }
    }
  }
});
