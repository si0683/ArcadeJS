/* Star Patrol — the ship fires on its own, shoot down the invaders.
   ← → or finger to move. Every 10 kills: pick an upgrade.
   Shows difficulty (game.diff), hit points and auto-fire. */

// ===== Settings =====
const CONFIG = {
  title: 'Star Patrol',
  ship: '🚀',
  enemies: ['👾', '🛸', '☄️'],
  shipSpeed: 420,
  fireEvery: 0.3,            // a shot every N seconds
  bulletSpeed: 700,
  enemyEvery: 0.9,           // a new enemy every N seconds
  enemySpeed: 140,
  lives: 3,
  bulletColor: '#ffe066'
};

Arcade.create({
  title: CONFIG.title,
  emoji: CONFIG.ship,
  subtitle: "Don't let the invaders reach the bottom",
  width: 600, height: 800,
  world: 'space', worlds: true,
  difficulty: true,                  // easy / normal / hard in settings → game.diff
  lives: CONFIG.lives,
  buttons: ['left', 'right'],

  setup(game) {
    const d = game.data;
    d.ship = game.add({ emoji: CONFIG.ship, x: game.width / 2, y: game.height - 80, size: 56, angle: -Math.PI / 4, tag: 'ship', inside: true });
    d.fireEvery = CONFIG.fireEvery;
    d.double = false;
    d.kills = 0;
    d.fireTimer = 0;
    game.every(CONFIG.enemyEvery / game.diff, spawnEnemy);
  },

  update(game, dt) {
    const d = game.data, ship = d.ship;

    ship.vx = 0;
    if (game.key.left) ship.vx = -CONFIG.shipSpeed;
    if (game.key.right) ship.vx = CONFIG.shipSpeed;
    if (game.pointer.down) ship.x += (game.pointer.x - ship.x) * Math.min(1, dt * 12);

    // Auto-fire
    d.fireTimer -= dt;
    if (d.fireTimer <= 0) {
      d.fireTimer = d.fireEvery;
      const shots = d.double ? [-14, 14] : [0];
      shots.forEach(dx => game.add({ shape: 'circle', size: 10, x: ship.x + dx, y: ship.y - 30, vy: -CONFIG.bulletSpeed, color: CONFIG.bulletColor, glow: CONFIG.bulletColor, tag: 'bullet', removeOffscreen: true }));
      game.sound('tick', 0.15);
    }

    game.all('enemy').forEach(enemy => {
      const bullet = game.hitAny(enemy, 'bullet');
      if (bullet) {
        bullet.remove();
        enemy.hp -= 1;
        if (enemy.hp <= 0) {
          enemy.remove();
          game.burst(enemy.x, enemy.y, { count: 18 });
          game.addScore(10, enemy.x, enemy.y);
          game.sound('crash', 0.3);
          d.kills++;
          if (d.kills % 10 === 0) upgrade(game);
        }
      }
      if (game.hit(enemy, ship)) { enemy.remove(); game.loseLife(); ship.blink = 1; }
      if (enemy.y > game.height + 30) { enemy.remove(); game.loseLife(); }
    });
  }
});

function spawnEnemy(game) {
  const hp = game.chance(0.2) ? 3 : 1; // sometimes a tough one
  game.add({
    emoji: game.pick(CONFIG.enemies), x: game.rand(40, game.width - 40), y: -40,
    size: hp > 1 ? 62 : 46, hp: hp,
    vy: CONFIG.enemySpeed * game.diff * game.rand(0.8, 1.3), vx: game.rand(-40, 40),
    spin: game.rand(-1, 1), tag: 'enemy'
  });
}

function upgrade(game) {
  const d = game.data;
  game.choose([
    { icon: '⚡', title: 'Rapid fire', text: 'Shoot 25% faster', apply: () => { d.fireEvery *= 0.75; } },
    { icon: '✌️', title: 'Double shot', text: 'Two bullets at once', apply: () => { d.double = true; } },
    { icon: '❤️', title: '+1 life', text: 'One more try', apply: () => game.addLife() }
  ]).then(card => { card.apply(); game.nextLevel(); });
}
