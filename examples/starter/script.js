/* Заготовка ArcadeJS: лови падающие фрукты, уворачивайся от бомб.
   Самая короткая игра — с неё удобно начинать свою. */

// ===== 0. ЛАБОРАТОРИЯ ИГРЫ 🧪 =====
const LAB = {
  title: 'Фруктопад',               // название в меню
  hero: '🧺',                       // герой
  fruits: ['🍎', '🍌', '🍇', '🍓'], // что ловим
  bomb: '💣',                       // от чего уворачиваемся
  speed: 500,                       // скорость героя
  fallSpeed: 220,                   // скорость падения
  spawnEvery: 0.7,                  // новый предмет каждые N секунд
  lives: 3,                         // жизни
  world: 'sky'                      // мир
};

Arcade.create({
  title: LAB.title,
  emoji: '🍉',
  subtitle: 'Лови фрукты, не лови бомбы',
  world: LAB.world, worlds: true,
  lives: LAB.lives,
  buttons: ['left', 'right'],

  // Начало игры: создаём героя и запускаем падение предметов
  setup(game) {
    game.data.hero = game.add({ emoji: LAB.hero, x: game.width / 2, y: game.height - 60, size: 70, inside: true });
    game.every(LAB.spawnEvery, drop);
  },

  // Каждый кадр: управление и столкновения
  update(game, dt) {
    const hero = game.data.hero;
    hero.vx = 0;
    if (game.key.left) hero.vx = -LAB.speed;
    if (game.key.right) hero.vx = LAB.speed;
    if (game.pointer.down) hero.x = game.pointer.x; // мышь или палец

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
    // Каждые 10 очков — новый уровень и всё быстрее
    if (game.score >= game.level * 10) game.nextLevel();
  }
});

// Новый падающий предмет: фрукт или (иногда) бомба
function drop(game) {
  const isBomb = game.chance(0.25);
  game.add({
    emoji: isBomb ? LAB.bomb : game.pick(LAB.fruits),
    x: game.rand(40, game.width - 40), y: -30, size: 48,
    vy: LAB.fallSpeed * (1 + game.level * 0.1), spin: game.rand(-2, 2),
    tag: isBomb ? 'bomb' : 'fruit', removeOffscreen: true
  });
}
