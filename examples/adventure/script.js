/* Adventure — Kenney sprites and sounds, background music, ZzFX sounds.
   ← → run, ↑ or Space jump. Stomp the slimes. The hero animates by itself. */

// ===== Settings =====
const CONFIG = {
  title: 'Adventure',
  hero: 'adventurer',     // adventurer, explorer, robot, zombie, woman, man
  enemy: 'slime',         // slime, bat, crab, alien-green, alien-pink…
  coin: 'coin',           // coin, gem, star-gold…
  music: 'adventure',     // adventure, action, boss, calm, menu
  speed: 300,
  jump: 780,
  gravity: 1900,
  lives: 3,
  world: 'sky'
};

// Map: # ground, = gold blocks, - one-way plank, o coin, e enemy, ^ spikes, P start, F flag
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
  title: CONFIG.title,
  emoji: '🗺️',
  subtitle: 'Collect coins and reach the flag',
  width: 820, height: MAP.length * TILE,
  world: CONFIG.world, worlds: true,
  lives: CONFIG.lives,
  music: CONFIG.music,               // background music (toggle in settings)
  sounds: ['coins', 'punch'],        // Kenney sounds to preload
  buttons: ['left', 'right', 'action'], actionLabel: '⤒',

  setup(game) {
    MAP.forEach((row, ty) => {
      [...row].forEach((ch, tx) => {
        const x = tx * TILE + TILE / 2, y = ty * TILE + TILE / 2;
        const top = ty === 0 || MAP[ty - 1][tx] !== '#';
        if (ch === '#') game.add({ image: top ? 'grass' : 'dirt', x, y, size: TILE + 1, tag: 'ground', hitbox: 1 });
        if (ch === '=') game.add({ image: 'block-gold', x, y, size: TILE + 1, tag: 'ground', hitbox: 1 });
        if (ch === '-') game.add({ image: 'plank', x, y: y - TILE / 4, w: TILE + 1, h: TILE / 3, tag: 'ground', oneWay: true, hitbox: 1 });
        if (ch === 'o') game.add({ image: CONFIG.coin, x, y, size: 34, tag: 'coin' });
        if (ch === '^') game.add({ image: 'spikes', x, y, size: TILE, tag: 'spikes', hitbox: 0.6 });
        if (ch === 'e') game.add({ image: CONFIG.enemy, x, y, size: 46, vx: -70, gravity: CONFIG.gravity, tag: 'enemy' });
        if (ch === 'F') game.add({ image: 'flag', x, y, size: TILE, tag: 'flag' });
        if (ch === 'P') game.data.start = { x, y };
      });
    });
    const s = game.data.start;
    // Walk, jump and fall animations switch automatically
    game.data.hero = game.add({ image: CONFIG.hero, x: s.x, y: s.y, w: 44, h: 62, gravity: CONFIG.gravity, tag: 'hero', z: 2 });
    game.follow(game.data.hero, { atX: 0.35, minX: 0, maxX: MAP[0].length * TILE - game.width });
  },

  update(game) {
    const hero = game.data.hero;
    hero.vx = 0;
    if (game.key.left) { hero.vx = -CONFIG.speed; hero.flip = true; }   // sprites face right
    if (game.key.right) { hero.vx = CONFIG.speed; hero.flip = false; }
    if ((game.pressed('up') || game.pressed('action')) && hero.onGround) {
      hero.vy = -CONFIG.jump;
      game.sound('retro-jump', 0.6);                                    // ZzFX sound
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
          hero.vy = -CONFIG.jump * 0.6;
          game.addScore(50, e.x, e.y);
          game.burst(e.x, e.y, { emoji: '💫', count: 6 });
          game.sound('punch');                                          // Kenney sound
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
