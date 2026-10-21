/* Fruit Drop — the smallest ArcadeJS game: catch fruit, dodge bombs.
   A good starting point for your own game. */

// ===== Settings =====
const CONFIG = {
  title: 'Fruit Drop',              // menu title
  hero: '🧺',                       // player emoji
  fruits: ['🍎', '🍌', '🍇', '🍓'], // things to catch
  bomb: '💣',                       // things to avoid
  speed: 500,                       // player speed, px/s
  fallSpeed: 220,                   // falling speed, px/s
  spawnEvery: 0.7,                  // a new item every N seconds
  lives: 3,
  world: 'sky'                      // sky, space, forest, ocean, night, candy, desert, city
};

Arcade.create({
  title: CONFIG.title,
  emoji: '🍉',
  subtitle: 'Catch the fruit, dodge the bombs',
  world: CONFIG.world, worlds: true,
  lives: CONFIG.lives,
  buttons: ['left', 'right'],

  // Called at the start of every round
  setup(game) {
    game.data.hero = game.add({ emoji: CONFIG.hero, x: game.width / 2, y: game.height - 60, size: 70, inside: true });
    game.every(CONFIG.spawnEvery, drop);
  },

  // Called every frame: input and collisions
  update(game, dt) {
    const hero = game.data.hero;
    hero.vx = 0;
    if (game.key.left) hero.vx = -CONFIG.speed;
    if (game.key.right) hero.vx = CONFIG.speed;
    if (game.pointer.down) hero.x = game.pointer.x; // mouse or finger

    const fruit = game.hitAny(hero, 'fruit');
    if (fruit) {
      fruit.remove();
      game.addScore(1, fruit.x, fruit.y);
      game.sound('coin', 0.5);
    }
    const bomb = game.hitAny(hero, 'bomb');
    if (bomb) {
      bomb.remove();
      game.burst(bomb.x, bomb.y, { emoji: '💥', count: 6 });
      game.loseLife();
    }
    // Every 10 points: next level, things fall faster
    if (game.score >= game.level * 10) game.nextLevel();
  }
});

// Drop a fruit or (sometimes) a bomb
function drop(game) {
  const isBomb = game.chance(0.25);
  game.add({
    emoji: isBomb ? CONFIG.bomb : game.pick(CONFIG.fruits),
    x: game.rand(40, game.width - 40), y: -30, size: 48,
    vy: CONFIG.fallSpeed * (1 + game.level * 0.1), spin: game.rand(-2, 2),
    tag: isBomb ? 'bomb' : 'fruit', removeOffscreen: true
  });
}
