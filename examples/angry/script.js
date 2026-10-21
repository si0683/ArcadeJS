/* Angry Emoji — Matter.js physics: pull the bird back and let go to knock over the pigs.
   Shows physics: { walls, drag }, bodyShape, onCollide, link / unlink. */

// ===== Settings =====
const CONFIG = {
  title: 'Angry Emoji',
  bird: '🐦',
  pig: '🐷',
  crate: '📦',
  birds: 4,              // shots
  power: 0.06,           // slingshot stiffness
  gravity: 1,            // 0.5 = Moon
  bounce: 0.3,           // crate bounciness (0…1)
  floors: 4,             // tower floors
  world: 'sky'
};

const SLING = { x: 160, y: 430 }; // where the bird hangs

GameMonster.create({
  title: CONFIG.title,
  emoji: CONFIG.bird,
  subtitle: 'Pull the bird back and let go',
  help: 'Mouse or finger: drag the bird back and release · Esc — pause',
  world: CONFIG.world, worlds: true,
  lives: 0,                                                       // no lives: we count birds
  physics: { gravity: CONFIG.gravity, walls: true, drag: 'bird' }, // only the bird can be dragged

  setup(game) {
    const d = game.data;
    d.birdsLeft = CONFIG.birds;
    game.add({ x: 400, y: 585, w: 800, h: 30, color: '#6ab04c', body: 'static' }); // ground
    buildTower(game, 590, CONFIG.floors);
    game.onCollide('bird', 'pig', (bird, pig) => popPig(game, pig));
    game.after(1, () => { d.ready = true; }); // let the tower settle
    nextBird(game);
  },

  update(game, dt) {
    const d = game.data, bird = d.bird;
    // Released: the band pulls the bird forward and lets go once it passes the sling
    if (d.armed && !game.pointer.down && bird && game.dist(bird, SLING) > 30) d.released = true;
    if (d.armed && d.released && bird.x > SLING.x + 10) {
      game.unlink(d.sling);
      d.armed = false;
      d.released = false;
      game.sound('flap');
      game.after(4, () => nextBird(game));
    }
    // A pig fell off or got hit hard by a crate
    if (d.ready) {
      game.all('pig').forEach(pig => {
        if (pig.y > game.height + 50 || Math.hypot(pig.vx, pig.vy) > 520) popPig(game, pig);
      });
    }
    if (d.ready && game.count('pig') === 0) game.win();
    game.hud('🐦', d.birdsLeft);
  },

  // Slingshot post and band
  drawBehind(game) {
    game.rect(SLING.x, 510, 14, 140, '#8b5a2b', { radius: 6 });
    const bird = game.data.bird;
    if (game.data.armed && bird) {
      game.line(SLING.x - 8, SLING.y, bird.x, bird.y, '#5a3311', 5);
      game.line(SLING.x + 8, SLING.y, bird.x, bird.y, '#5a3311', 5);
    }
  }
});

function buildTower(game, x, floors) {
  for (let f = 0; f < floors; f++) {
    const y = 545 - f * 112;
    game.add({ emoji: CONFIG.crate, bodyShape: 'box', x: x - 50, y: y, size: 56, body: true, restitution: CONFIG.bounce, tag: 'crate' });
    game.add({ emoji: CONFIG.crate, bodyShape: 'box', x: x + 50, y: y, size: 56, body: true, restitution: CONFIG.bounce, tag: 'crate' });
    game.add({ x: x, y: y - 40, w: 170, h: 18, color: '#c47f3b', radius: 4, body: true, tag: 'plank' });
    game.add({ emoji: CONFIG.pig, x: x, y: y - 74, size: 44, body: true, tag: 'pig' });
  }
}

function nextBird(game) {
  const d = game.data;
  if (d.birdsLeft <= 0) {
    // Out of birds: let the tower fall, then check
    game.after(3, () => { if (game.count('pig') > 0) game.over(); });
    return;
  }
  d.birdsLeft--;
  d.bird = game.add({ emoji: CONFIG.bird, x: SLING.x, y: SLING.y, size: 46, body: true, density: 0.004, restitution: 0.4, tag: 'bird', removeOffscreen: true });
  d.sling = game.link(d.bird, SLING, { length: 0, stiffness: CONFIG.power, color: 'transparent' });
  d.armed = true;
}

function popPig(game, pig) {
  if (pig.dead) return;
  pig.remove();
  game.burst(pig.x, pig.y, { emoji: '💥', count: 8 });
  game.addScore(100, pig.x, pig.y);
  game.sound('crash', 0.5);
}
