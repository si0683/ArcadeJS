/* «Злые эмодзи» на ArcadeJS + физика Matter.js.
   Оттяни птичку мышью или пальцем и отпусти — сбей всех свинок! */

// ===== 0. ЛАБОРАТОРИЯ ИГРЫ 🧪 =====
const LAB = {
  title: 'Злые эмодзи', // название в меню
  bird: '🐦',            // чем стреляем
  pig: '🐷',             // кого сбиваем
  crate: '📦',           // ящики башни
  birds: 4,              // сколько выстрелов
  power: 0.06,           // сила рогатки
  gravity: 1,            // притяжение: 0.5 — Луна
  bounce: 0.3,           // упругость ящиков (0…1)
  floors: 4,             // этажей в башне
  world: 'sky'           // мир
};

const SLING = { x: 160, y: 430 }; // где висит птичка

Arcade.create({
  title: LAB.title,
  emoji: LAB.bird,
  subtitle: 'Оттяни птичку и отпусти — сбей всех свинок',
  help: 'Мышь или палец: тяни птичку назад и отпускай · Esc — пауза',
  world: LAB.world, worlds: true,
  lives: 0,                                             // жизней нет: считаем птичек
  physics: { gravity: LAB.gravity, walls: true, drag: 'bird' }, // Matter.js; тянуть можно только птичку

  setup(game) {
    const d = game.data;
    d.birdsLeft = LAB.birds;
    // Земля — неподвижная опора
    game.add({ x: 400, y: 585, w: 800, h: 30, color: '#6ab04c', body: 'static' });
    buildTower(game, 590, LAB.floors);
    // Свинка, попавшая под удар, исчезает
    game.onCollide('bird', 'pig', (bird, pig) => popPig(game, pig));
    game.after(1, () => { d.ready = true; }); // секунда, чтобы башня встала
    nextBird(game);
  },

  update(game, dt) {
    const d = game.data, bird = d.bird;
    // Отпустили оттянутую птичку: резинка тянет её вперёд,
    // а когда птичка пролетела рогатку — отпускает
    if (d.armed && !game.pointer.down && bird && game.dist(bird, SLING) > 30) d.released = true;
    if (d.armed && d.released && bird.x > SLING.x + 10) {
      game.unlink(d.sling);
      d.armed = false;
      d.released = false;
      game.sound('flap');
      game.after(4, () => nextBird(game));
    }
    // Свинка упала или её сильно ударило ящиком
    if (d.ready) {
      game.all('pig').forEach(pig => {
        if (pig.y > game.height + 50 || Math.hypot(pig.vx, pig.vy) > 520) popPig(game, pig);
      });
    }
    if (d.ready && game.count('pig') === 0) game.win();
    game.hud('🐦', d.birdsLeft);
  },

  // Резинка рогатки
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
    game.add({ emoji: LAB.crate, bodyShape: 'box', x: x - 50, y: y, size: 56, body: true, restitution: LAB.bounce, tag: 'crate' });
    game.add({ emoji: LAB.crate, bodyShape: 'box', x: x + 50, y: y, size: 56, body: true, restitution: LAB.bounce, tag: 'crate' });
    game.add({ x: x, y: y - 40, w: 170, h: 18, color: '#c47f3b', radius: 4, body: true, tag: 'plank' });
    game.add({ emoji: LAB.pig, x: x, y: y - 74, size: 44, body: true, tag: 'pig' });
  }
}

function nextBird(game) {
  const d = game.data;
  if (d.birdsLeft <= 0) {
    // Птички кончились: даём башне упасть и проверяем
    game.after(3, () => { if (game.count('pig') > 0) game.over(); });
    return;
  }
  d.birdsLeft--;
  d.bird = game.add({ emoji: LAB.bird, x: SLING.x, y: SLING.y, size: 46, body: true, density: 0.004, restitution: 0.4, tag: 'bird', removeOffscreen: true });
  d.sling = game.link(d.bird, SLING, { length: 0, stiffness: LAB.power, color: 'transparent' });
  d.armed = true;
}

function popPig(game, pig) {
  if (pig.dead) return;
  pig.remove();
  game.burst(pig.x, pig.y, { emoji: '💥', count: 8 });
  game.addScore(100, pig.x, pig.y);
  game.sound('crash', 0.5);
}
