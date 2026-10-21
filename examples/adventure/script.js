/* «Приключение» на ArcadeJS 1.1: спрайты и звуки Kenney, музыка, звуки ZzFX.
   ← → — бег, ↑ или пробел — прыжок. Прыжок на слизня побеждает его. */

// ===== 0. ЛАБОРАТОРИЯ ИГРЫ 🧪 =====
const LAB = {
  title: 'Приключение',   // название в меню
  hero: 'adventurer',     // герой: adventurer, explorer, robot, zombie, woman, man
  enemy: 'slime',         // враг: slime, bat, crab, alien-green, alien-pink…
  coin: 'coin',           // монетка: coin, gem, star-gold…
  music: 'adventure',     // музыка: adventure, action, boss, calm, menu
  speed: 300,             // скорость бега
  jump: 780,              // сила прыжка
  gravity: 1900,          // притяжение
  lives: 3,               // жизни
  world: 'sky'            // мир
};

// Карта: # — земля, = — кирпичи, - — доска «снизу насквозь», o — монета,
// e — враг, ^ — шипы, P — старт, F — флаг
const MAP = [
  '                                                                  ',
  '                                                                  ',
  '                  o o o                        o o                ',
  '                  -----            o o        =====          F    ',
  '        o o                       =====                    ====   ',
  '       =====           o                  e          o o          ',
  '  P              ---         e         ======       -----     e   ',
  '            e         ####  ###    #####     e    ^^    e  ###### ',
  '##################   #########   ##########################  #####',
  '##################   #########   ##########################  #####'
];
const TILE = 54;

Arcade.create({
  title: LAB.title,
  emoji: '🗺️',
  subtitle: 'Собери монеты и дойди до флага',
  width: 820, height: MAP.length * TILE,
  world: LAB.world, worlds: true,
  lives: LAB.lives,
  music: LAB.music,                  // фоновая музыка (включается и в настройках)
  sounds: ['coins', 'punch'],        // звуки Kenney, которые загрузим заранее
  buttons: ['left', 'right', 'action'], actionLabel: '⤒',

  setup(game) {
    MAP.forEach((row, ty) => {
      [...row].forEach((ch, tx) => {
        const x = tx * TILE + TILE / 2, y = ty * TILE + TILE / 2;
        const top = ty === 0 || MAP[ty - 1][tx] !== '#';
        if (ch === '#') game.add({ image: top ? 'grass' : 'dirt', x, y, size: TILE + 1, tag: 'ground', hitbox: 1 });
        if (ch === '=') game.add({ image: 'block-gold', x, y, size: TILE + 1, tag: 'ground', hitbox: 1 });
        if (ch === '-') game.add({ image: 'plank', x, y: y - TILE / 4, w: TILE + 1, h: TILE / 3, tag: 'ground', oneWay: true, hitbox: 1 });
        if (ch === 'o') game.add({ image: LAB.coin, x, y, size: 34, tag: 'coin' });
        if (ch === '^') game.add({ image: 'spikes', x, y, size: TILE, tag: 'spikes', hitbox: 0.6 });
        if (ch === 'e') game.add({ image: LAB.enemy, x, y, size: 46, vx: -70, gravity: LAB.gravity, tag: 'enemy' });
        if (ch === 'F') game.add({ image: 'flag', x, y, size: TILE, tag: 'flag' });
        if (ch === 'P') game.data.start = { x, y };
      });
    });
    const s = game.data.start;
    // Герой: анимация ходьбы, прыжка и падения включается сама
    game.data.hero = game.add({ image: LAB.hero, x: s.x, y: s.y, w: 44, h: 62, gravity: LAB.gravity, tag: 'hero', z: 2 });
    game.follow(game.data.hero, { atX: 0.35, minX: 0, maxX: MAP[0].length * TILE - game.width });
  },

  update(game) {
    const hero = game.data.hero;
    hero.vx = 0;
    if (game.key.left) { hero.vx = -LAB.speed; hero.flip = true; }   // спрайты смотрят вправо
    if (game.key.right) { hero.vx = LAB.speed; hero.flip = false; }
    if ((game.pressed('up') || game.pressed('action')) && hero.onGround) {
      hero.vy = -LAB.jump;
      game.sound('retro-jump', 0.6);                                  // звук ZzFX
    }
    game.collide(hero, 'ground');
    hero.x = Math.max(hero.w / 2, hero.x);

    game.all('enemy').forEach(e => {
      const side = game.collide(e, 'ground');
      const ahead = { x: e.x + Math.sign(e.vx) * 26, y: e.y + 40, w: 4, h: 4, hitbox: 1 };
      if (side.left || side.right || (e.onGround && !game.all('ground').some(g => game.hit(ahead, g)))) e.vx *= -1;
      e.flip = e.vx > 0;
      if (game.hit(hero, e)) {
        if (hero.vy > 0 && hero.y < e.y - 12) {
          e.remove();
          hero.vy = -LAB.jump * 0.6;
          game.addScore(50, e.x, e.y);
          game.burst(e.x, e.y, { emoji: '💫', count: 6 });
          game.sound('punch');                                        // звук Kenney
        } else if (game.loseLife()) { hero.blink = 1; hero.vy = -400; }
      }
    });

    if (game.hitAny(hero, 'spikes') && game.loseLife()) { hero.blink = 1; hero.vy = -600; }

    const coin = game.hitAny(hero, 'coin');
    if (coin) { coin.remove(); game.addScore(10, coin.x, coin.y); game.sound('coins', 0.6); }

    if (game.hitAny(hero, 'flag')) {
      game.addScore(100);
      game.burst(hero.x, hero.y, { emoji: '🎉', count: 20 });
      game.sound('jingle-nes');
      game.win();
    }
    if (hero.y > game.height + 60 && game.loseLife() && game.lives > 0) {
      hero.x = game.data.start.x; hero.y = game.data.start.y; hero.vy = 0; hero.blink = 1;
    }
  }
});
