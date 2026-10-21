/* Платформер на ArcadeJS: беги, прыгай, собирай монеты и дойди до флага.
   ← → — бег, ↑ или пробел — прыжок. Прыжок врагу на голову побеждает его. */

// ===== 0. ЛАБОРАТОРИЯ ИГРЫ 🧪 =====
const LAB = {
  title: 'Лисёнок',      // название в меню
  hero: '🦊',            // герой
  enemy: '🐌',           // враг
  coin: '🍬',            // монетка
  speed: 300,            // скорость бега
  jump: 760,             // сила прыжка
  gravity: 1900,         // притяжение
  enemySpeed: 70,        // скорость врагов
  lives: 3,              // жизни
  world: 'candy'         // мир
};

// Карта уровня: каждый символ — клетка 48 × 48
// # — земля, = — платформа, - — платформа «снизу насквозь»,
// o — монетка, e — враг, P — старт героя, F — флаг финиша
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

Arcade.create({
  title: LAB.title,
  emoji: LAB.hero,
  subtitle: 'Дойди до флага 🏁',
  width: 800, height: MAP.length * TILE,
  world: LAB.world, worlds: true,
  lives: LAB.lives,
  buttons: ['left', 'right', 'action'], actionLabel: '⤒',

  setup(game) {
    MAP.forEach((row, ty) => {
      [...row].forEach((ch, tx) => {
        const x = tx * TILE + TILE / 2, y = ty * TILE + TILE / 2;
        if (ch === '#') game.add({ x, y, w: TILE, h: TILE, color: ty > 0 && MAP[ty - 1][tx] === '#' ? '#a0522d' : '#6ab04c', tag: 'ground', hitbox: 1 });
        if (ch === '=') game.add({ x, y, w: TILE, h: TILE / 2, color: '#e17055', radius: 6, tag: 'ground', hitbox: 1 });
        if (ch === '-') game.add({ x, y: y - TILE / 4, w: TILE, h: 12, color: '#fdcb6e', radius: 6, tag: 'ground', oneWay: true, hitbox: 1 });
        if (ch === 'o') game.add({ emoji: LAB.coin, x, y, size: 30, tag: 'coin' });
        if (ch === 'e') game.add({ emoji: LAB.enemy, x, y, size: 40, h: 38, vx: -LAB.enemySpeed, gravity: LAB.gravity, tag: 'enemy' });
        if (ch === 'F') game.add({ emoji: '🏁', x, y, size: 56, tag: 'flag' });
        if (ch === 'P') game.data.start = { x, y };
      });
    });
    const s = game.data.start;
    game.data.hero = game.add({ emoji: LAB.hero, x: s.x, y: s.y, w: 38, h: 42, size: 46, gravity: LAB.gravity, tag: 'hero', z: 2 });
    game.follow(game.data.hero, { atX: 0.35, minX: 0, maxX: MAP[0].length * TILE - game.width });
  },

  update(game, dt) {
    const hero = game.data.hero;

    // Бег и прыжок
    hero.vx = 0;
    if (game.key.left) { hero.vx = -LAB.speed; hero.flip = false; }
    if (game.key.right) { hero.vx = LAB.speed; hero.flip = true; }
    if ((game.pressed('up') || game.pressed('action')) && hero.onGround) {
      hero.vy = -LAB.jump;
      game.sound('jump', 0.5);
    }
    game.collide(hero, 'ground');
    hero.x = Math.max(hero.w / 2, hero.x);

    // Враги ходят и разворачиваются у стен и края платформы
    game.all('enemy').forEach(e => {
      const side = game.collide(e, 'ground');
      const ahead = { x: e.x + Math.sign(e.vx) * 26, y: e.y + 40, w: 4, h: 4, hitbox: 1 };
      if (side.left || side.right || (e.onGround && !game.all('ground').some(g => game.hit(ahead, g)))) {
        e.vx = e.vx > 0 ? -LAB.enemySpeed : LAB.enemySpeed;
      }
      e.flip = e.vx > 0;
      if (game.hit(hero, e)) {
        if (hero.vy > 0 && hero.y < e.y - 10) {
          // Прыжок на голову
          e.remove();
          hero.vy = -LAB.jump * 0.6;
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

    // Упал в яму
    if (hero.y > game.height + 60) {
      if (game.loseLife() && game.lives > 0) {
        hero.x = game.data.start.x; hero.y = game.data.start.y; hero.vy = 0; hero.blink = 1;
      }
    }
  }
});
