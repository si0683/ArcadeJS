/* Космический шутер на ArcadeJS: корабль стреляет сам, сбивай пришельцев.
   ← → или палец — движение. Каждые 10 побед — улучшение. */

// ===== 0. ЛАБОРАТОРИЯ ИГРЫ 🧪 =====
const LAB = {
  title: 'Звёздный патруль', // название в меню
  ship: '🚀',                // корабль
  enemies: ['👾', '🛸', '☄️'], // враги
  shipSpeed: 420,            // скорость корабля
  fireEvery: 0.3,            // выстрел каждые N секунд
  bulletSpeed: 700,          // скорость пуль
  enemyEvery: 0.9,           // новый враг каждые N секунд
  enemySpeed: 140,           // скорость врагов
  lives: 3,                  // жизни
  bulletColor: '#ffe066'     // цвет пуль
};

Arcade.create({
  title: LAB.title,
  emoji: LAB.ship,
  subtitle: 'Не пропусти пришельцев вниз',
  width: 600, height: 800,
  world: 'space', worlds: true,
  difficulty: true,                  // в настройках: легко / нормально / сложно → game.diff
  lives: LAB.lives,
  buttons: ['left', 'right'],

  setup(game) {
    const d = game.data;
    d.ship = game.add({ emoji: LAB.ship, x: game.width / 2, y: game.height - 80, size: 56, angle: -Math.PI / 4, tag: 'ship', inside: true });
    d.fireEvery = LAB.fireEvery;
    d.double = false;
    d.kills = 0;
    d.fireTimer = 0;
    game.every(LAB.enemyEvery / game.diff, spawnEnemy);
  },

  update(game, dt) {
    const d = game.data, ship = d.ship;

    ship.vx = 0;
    if (game.key.left) ship.vx = -LAB.shipSpeed;
    if (game.key.right) ship.vx = LAB.shipSpeed;
    if (game.pointer.down) ship.x += (game.pointer.x - ship.x) * Math.min(1, dt * 12);

    // Автоматическая стрельба
    d.fireTimer -= dt;
    if (d.fireTimer <= 0) {
      d.fireTimer = d.fireEvery;
      const shots = d.double ? [-14, 14] : [0];
      shots.forEach(dx => game.add({ shape: 'circle', size: 10, x: ship.x + dx, y: ship.y - 30, vy: -LAB.bulletSpeed, color: LAB.bulletColor, glow: LAB.bulletColor, tag: 'bullet', removeOffscreen: true }));
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
  const hp = game.chance(0.2) ? 3 : 1; // иногда крепкий враг
  game.add({
    emoji: game.pick(LAB.enemies), x: game.rand(40, game.width - 40), y: -40,
    size: hp > 1 ? 62 : 46, hp: hp,
    vy: LAB.enemySpeed * game.diff * game.rand(0.8, 1.3), vx: game.rand(-40, 40), bounce: false,
    spin: game.rand(-1, 1), tag: 'enemy'
  });
}

function upgrade(game) {
  const d = game.data;
  game.choose([
    { icon: '⚡', title: 'Скорострельность', text: 'Стреляешь на 25% чаще', apply: () => { d.fireEvery *= 0.75; } },
    { icon: '✌️', title: 'Двойной выстрел', text: 'Две пули сразу', apply: () => { d.double = true; } },
    { icon: '❤️', title: '+1 жизнь', text: 'Ещё одна попытка', apply: () => game.addLife() }
  ]).then(card => { card.apply(); game.nextLevel(); });
}
