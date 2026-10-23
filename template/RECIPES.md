# Рецепты: как развивать игру

Пошаговые инструкции для частых задач. Каждый рецепт заканчивается проверкой: `npm run check` (линтер, типы, тесты, сборка) и `npm run test:e2e` (игра в браузере).

## Новый враг

Пример — летучая мышь, которая летает влево-вправо. Враг — отдельный класс в `src/entities/`, как `Slime.ts`.

1. **Картинка.** Положите `public/assets/sprites/bat.png` (кадры 24×24 в одну строку). Автора и лицензию допишите в `public/assets/CREDITS.md`.
2. **Загрузка и анимация** в `src/scenes/PreloadScene.ts`:
   ```ts
   this.load.spritesheet("bat", "sprites/bat.png", { frameWidth: 24, frameHeight: 24 })
   // в create():
   this.anims.create({ key: "bat-fly", frames: this.anims.generateFrameNumbers("bat", { start: 0, end: 1 }), frameRate: 8, repeat: -1 })
   ```
3. **Числа** — в `src/config.ts`: `export const BAT_SPEED = 60`, `export const BAT_POINTS = 10`.
4. **Класс** `src/entities/Bat.ts` — по образцу `Slime.ts`: `start()` задаёт тело и скорость (вызывать **после** `group.add()` — группа сбрасывает настройки тела), `step()` — поведение в каждом кадре:
   ```ts
   start() {
     this.body.setAllowGravity(false)
     this.setVelocityX(-BAT_SPEED).play("bat-fly")
     return this
   }
   step() {
     if (this.body.blocked.left || this.body.blocked.right) this.setVelocityX(-this.body.velocity.x)
   }
   ```
   Если у врага несколько режимов (патруль → погоня → атака), заведите `StateMachine` из `src/fsm.ts` — см. «Автомат состояний».
5. **Расстановка** — в Tiled: точки с именем `bat` в слое `objects`. В `GameScene.create()` рядом со слизнями: `const bat = new Bat(this, x, y - 12); this.bats.add(bat); bat.start()`; группа, коллизии и `overlap` с игроком — как у `slimes`, в `update()` — `bat.step()`.
6. **Отклик:** при победе над врагом — `this.fx.sparks(...)`, `this.fx.hitstop()`, `this.fx.popText(...)` (см. «Ощущение от игры»).
7. **Правило** (когда враг погибает, сколько даёт очков) — функцией в `src/rules.ts` и тестом в `src/rules.test.ts`.
8. **Проверка в браузере** — шаг в `e2e/game.spec.ts`, если враг меняет основной цикл игры.

## Новый уровень

1. В Tiled: «Файл → Сохранить как…» → `public/assets/maps/level2.tmj`. Имена слоёв (`decor`, `ground`, `objects`) и точек не меняйте.
2. `PreloadScene`: `this.load.tilemapTiledJSON("level2", "maps/level2.tmj")`.
3. `GameScene`: номер уровня передаётся в сцену — `goTo(this, "game", { level: 2 })`, в `create(data)` — `` this.make.tilemap({ key: `level${data.level ?? 1}` }) ``.
4. Победа на уровне N запускает уровень N + 1; после последнего — экран победы. Открытые уровни храните в сохранении (см. «Новое поле в сохранении»).

## Новый звук

1. Файл — в `public/assets/sounds/` (короткие эффекты — `.wav` или `.ogg`, музыка — `.mp3`). Автора — в `CREDITS.md`.
2. `PreloadScene`: `this.load.audio("shoot", "sounds/shoot.wav")`.
3. Воспроизведение — **только** через `src/audio.ts`, тогда работают настройки громкости:
   ```ts
   playSfx(this, "shoot", 0.5) // эффект: 0.5 — собственная громкость звука
   playMusic(this, "boss", 0.3) // музыка: зацикленная
   ```

## Новое поле в сохранении

Сохранение одно на игрока — `src/save.ts`. Пример: открытые уровни.

1. Добавьте поле в `Save` и в `DEFAULT_SAVE`: `levels: 1`.
2. В `parseSave()` — проверку: `levels: toNumber(data.levels, 1, 1, 99)`. Старые сохранения без поля получат значение по умолчанию.
3. Сохраняйте через `save.update({ levels: 3 })` — остальные поля сохранятся сами.
4. Тест в `src/save.test.ts`: старое сохранение без поля читается.

Порталы ограничивают частоту сохранений (Яндекс: 100 раз за 5 минут). Сохраняйте в конце уровня, а не в каждом кадре; для частых изменений — `save.update(patch, 1000)`.

## Новый экран (магазин, выбор уровня, настройки)

Образец — `src/scenes/PauseScene.ts`: экран поверх уровня со списком пунктов.

1. Сцена `src/scenes/LevelsScene.ts` (`class LevelsScene extends Phaser.Scene`, ключ `"levels"`), добавьте её в список `scene` в `src/main.ts`.
2. **Пункты — через `MenuList` из `src/ui.ts`:** он сам работает со стрелками, геймпадом, мышью и тапом и подсвечивает выбранный пункт (видимый фокус — требование доступности):
   ```ts
   this.controls = new Controls(this)
   this.menu = new MenuList(this, width / 2, 200, [
     { label: "Уровень 1", action: () => goTo(this, "game", { level: 1 }) },
     { label: () => volumeLabel("sound", save.get().settings.sound), action: () => { /* … */ } },
   ], this.controls)
   // update(): this.controls.update(); this.menu.update()
   ```
3. **Поверх игры:** `this.scene.launch("shop"); this.scene.pause()`; закрыть: `this.scene.stop(); this.scene.resume("game")`. Во время такого экрана — `platform.gameplayStop()`, при возврате — `platform.gameplayStart()` (требование порталов).
4. **Вместо игры:** переход с затемнением — `goTo(this, "levels")` из `src/transition.ts`, а в `create()` новой сцены — `fadeIn(this)`.

## Новый язык

1. В `src/i18n.ts` добавьте набор `tr: { … }` с теми же ключами, что у `ru`. Тест `i18n.test.ts` проверит, что ничего не пропущено.
2. В `pickLanguage()` верните `"tr"` для `lang === "tr"`.
3. Тексты в коде — только через `t("ключ")`, без строк в сценах.

## Новая покупка

Покупки идут через `shop` из `src/shop.ts` — он знает, что куплено, и не выдаст товар дважды. Пример в шаблоне — «Убрать рекламу» (`no_ads`).

1. **Товар на портале.** Создайте его в консоли площадки (Яндекс Игры: вкладка «Покупки») с id, например `skin_gold`. Название и цена в игре придут оттуда.
2. **Постоянный товар** (скин, уровни, без рекламы): добавьте id в `PRODUCTS` в `src/shop.ts` и проверяйте `shop.has(PRODUCTS.skinGold)`.
3. **Расходуемый товар** (монеты, жизни): передайте выдачу вторым аргументом — `createShop(platform, { coins_100: () => addCoins(100) })`. Магазин выдаст товар и вызовет `consumePurchase`; оплаченный, но не выданный (закрыли вкладку) — выдаст при следующем запуске.
4. **Кнопка:** только если `shop.available` (на площадке есть покупки), подпись — `shop.product(id).price`. Покупка — `await shop.buy(id)`: `true` — оплачено и выдано, `false` — игрок закрыл окно или оплата не прошла.
5. **Проверка:** в `npm run dev` без SDK покупки бесплатные и мгновенные (хранятся в localStorage, сброс — очистить данные сайта). Тест — в `src/shop.test.ts`, шаг покупки — в `e2e/game.spec.ts`.

## Реклама за награду

```ts
const rewarded = await platform.showRewardedAd()
if (rewarded) this.registry.inc("lives", 1) // только если досмотрел
```

Показывайте только по кнопке игрока («+1 жизнь за рекламу»), никогда во время игры. Если реклама не загрузилась, `showRewardedAd()` вернёт `false` — игра продолжится без награды.

## Ассеты

- **Структура:** `public/assets/sprites`, `sounds`, `maps`, `atlas`; авторы — `CREDITS.md`.
- **Спрайты:** кадры одной анимации — в одной картинке (spritesheet). Когда спрайтов много — **атлас**: см. «Атлас спрайтов». Атлас — один запрос и одна текстура вместо десятков.
- **Анимации из Aseprite** — см. рецепт ниже: без ручной нарезки кадров.
- **Размер:** картинки — PNG, сжатие без потерь через [Squoosh](https://squoosh.app) или `oxipng`; музыка — MP3 96–128 кбит/с; эффекты — короткие WAV/OGG. Порталы ограничивают размер игры и время первой загрузки; `npm run size` (входит в `npm run check`) следит за бюджетом — лимиты в `scripts/size.mjs`.
- **Пиксель-арт:** `pixelArt: true` уже включён; размеры кадров — кратные тайлу.

## Доступность и удобство

- Всё управление дублируется: клавиатура + геймпад + тач. Код игры спрашивает **действия** (`controls.isDown("jump")`), а не клавиши — см. «Управление».
- Громкость звука и музыки — в меню (S и M) и в паузе; новые звуки — только через `src/audio.ts`.
- Настройка «Эффекты» (E в меню, пункт в паузе) выключает тряску, вспышки, стоп-кадры и фильтры. Новые резкие эффекты — только через `Fx`, он её учитывает.
- Без резких вспышек на весь экран: тряска камеры и мигание — короткие (до 0,5 с).
- Важное не передавайте только цветом: враг отличается формой, не только оттенком.
- Текст на экране — не мельче 16 px при ширине 960.

## Производительность

- Цель — **60 FPS на среднем телефоне**. FPS виден в отладочной панели (F1 в `npm run dev`). Проверка под нагрузкой: Chrome → DevTools → Performance, режим «4× slowdown».
- Пули, частицы, враги, которые появляются часто, — через пул: `group.get(x, y)` и `setActive(false).setVisible(false)` вместо `destroy()`. Частицы в `Fx` уже в пулах: один эмиттер, `explode()` сколько угодно раз.
- Не создавайте объекты в `update()` (векторы, массивы, строки текста) — переиспользуйте.
- Тексты, которые меняются каждый кадр, обновляйте только при изменении значения (как HUD через `changedata`).
- Фильтры дорогие: один фильтр на слой (`look.glowLayer()`), а не на каждый спрайт. На слабых устройствах игрок выключит «Эффекты».
- Размер сборки — `npm run size`: JS (gzip) и общий вес `dist/`.

## Ощущение от игры («сочность»)

Игра ощущается хорошей, когда на каждое действие есть отклик. Всё нужное — в `src/fx.ts`, в сцене — `this.fx`:

| Момент | Отклик |
|---|---|
| Прыжок | `fx.squash(sprite, -0.2)` — вытянуться вверх, `fx.dust(x, y)` — пыль из-под ног |
| Приземление | `fx.squash(sprite)` — сплющиться, пыль |
| Подбор предмета | `fx.sparks(x, y, цвет)`, `fx.popText(x, y, "+1")`, звук |
| Удар по врагу | `fx.hitstop()` — стоп-кадр 70 мс, `fx.sparks`, лёгкий `fx.shake()` |
| Урон игроку | `fx.flash(sprite)` — белая вспышка, `fx.shake()`, стоп-кадр подольше |

Числа (сила тряски, длина стоп-кадра, сплющивание) — в `FX` в `src/config.ts`, подбираются вживую на панели F2.

Движение героя уже «прощает» игрока (`src/movement.ts`, числа — `PLAYER` в `config.ts`):

- **coyote time** — прыжок ещё срабатывает 90 мс после схода с края;
- **буфер прыжка** — нажатие за 120 мс до приземления сработает при касании земли;
- **высота прыжка зависит от нажатия** — отпустили раньше, прыжок ниже (`jumpCut`);
- **разгон и торможение** (`accel`, `decel`), слабее в воздухе (`airControl`);
- **быстрое падение** (`fallGravity`) — прыжок не «ватный».

Камера: плавное следование, мёртвая зона и взгляд вперёд по ходу бега (`CAMERA` в `config.ts`).

## Свечение и фильтры (Phaser 4)

`src/look.ts` — «картинка» игры, только WebGL:

- **камера:** мягкая виньетка и лёгкая цветокоррекция (`LOOK` — сила и насыщенность);
- **светящийся слой:** `const glow = this.look.glowLayer()` и `glow.add(объект)` — один фильтр на все объекты слоя (монеты, искры, магия).

Свой фильтр на объект: `sprite.enableFilters(); sprite.filters!.internal.addGlow(0xff00ff, 4)`. Список фильтров — `node_modules/phaser/skills/filters-and-postfx/SKILL.md` (blur, glow, pixelate, wipe, shadow, color matrix, displacement…). Каждый новый фильтр подключайте так, чтобы настройка «Эффекты» его выключала.

## Анимации из Aseprite

[Aseprite](https://www.aseprite.org) — редактор пиксель-арта. Анимации (теги) приходят в игру без ручной нарезки кадров:

1. В Aseprite: «File → Export Sprite Sheet»: Layout — Packed, Output — PNG + JSON Data, формат **Array**, Meta — **Tags** включены.
2. Файлы `hero.png` и `hero.json` — в `public/assets/sprites/`.
3. `PreloadScene`: `this.load.aseprite("hero", "sprites/hero.png", "sprites/hero.json")`, в `create()` — `this.anims.createFromAseprite("hero")`.
4. Анимации называются как теги в Aseprite: `this.player.play("run")`. Длительность кадров — тоже из Aseprite.

## Атлас спрайтов

Много отдельных картинок → одна текстура (меньше запросов, спрайты рисуются одним пакетом):

1. Сложите PNG в `art/atlas/<имя атласа>/`, например `art/atlas/items/coin.png`, `art/atlas/items/gem.png`. Подпапки дают имена кадров с `/`: `art/atlas/hero/run/1.png` → кадр `run/1`.
2. `npm run atlas` → `public/assets/atlas/items.png` + `items.json`. Запускайте после каждого изменения картинок; исходники в `art/` храните в git.
3. `PreloadScene`: `this.load.atlas("items", "atlas/items.png", "atlas/items.json")`.
4. В игре: `this.add.image(x, y, "items", "coin")`; анимация из кадров атласа — `this.anims.generateFrameNames("hero", { prefix: "run/", start: 1, end: 6 })`.

## Управление: новое действие, геймпад

Код игры не знает о клавишах — только о действиях из `src/input.ts` (`left`, `right`, `up`, `down`, `jump`, `pause`, `confirm`).

1. **Новое действие** (например, `attack`): добавьте его в тип `Action`, клавиши — в `KEYS` (`attack: ["J", "X"]`), кнопку геймпада — в `PAD_BUTTONS` (`attack: [2]` — X / □).
2. **Сенсорная кнопка:** в `HudScene.addTouchButtons()` — `button(x, y, 46, "⚔", "attack")`.
3. **В сцене:** `this.controls.justPressed("attack")` — нажали в этом кадре; `isDown` — держат; `justReleased` — отпустили. `controls.axisX` — направление от −1 до 1 (стик или клавиши).
4. Геймпад включён в `src/main.ts` (`input.gamepad: true`); раскладка стандартная (Xbox, PlayStation, большинство USB-геймпадов).

## Настройка баланса прямо в игре (F2)

В `npm run dev` работают инструменты разработчика (`src/debug/`, в сборку для игроков не попадают):

| Клавиша | Что делает |
|---|---|
| F1 | панель: FPS, сцены, состояние героя, таймеры прыжка, последние события аналитики |
| F2 | ползунки: скорость, прыжок, гравитация, камера, эффекты — меняются сразу |
| F3 | хитбоксы физики |
| F4 | бессмертие |
| F6 | пройти уровень |

Подобрали ощущение — нажмите «Copy values for config.ts» и вставьте числа в `src/config.ts`. Новые числа добавляйте в объекты `PLAYER`, `CAMERA`, `FX` — и строкой `addBinding` в `src/debug/index.ts`.

## Автомат состояний

Когда у сущности есть режимы (герой: стоит / бежит / прыгает / падает; враг: патруль / погоня / атака), используйте `StateMachine` из `src/fsm.ts`, а не набор флагов:

```ts
this.states = new StateMachine<"patrol" | "chase" | "attack">({
  patrol: { update: () => this.walk() },
  chase: { enter: () => playSfx(this.scene, "alert"), update: () => this.follow(player) },
  attack: { enter: () => this.play("bat-bite") },
})
this.states.set("patrol")
// в step(): this.states.update(dt); переход — this.states.set("chase")
// states.elapsed — сколько мс в текущем состоянии (атака длится 400 мс и т. п.)
```

Пример — `src/entities/Player.ts`: состояние выбирает `pickPlayerState()`, а `enter` переключает анимации.

## Аналитика и ошибки

`src/telemetry.ts`: игра пишет события (`track("level_complete", { level, score, seconds })`), ошибки ловятся сами (`captureErrors()` в `main.ts`). Уже отправляются: `level_start`, `level_complete`, `game_over`, `death` (причина и место), `quit`, `error`.

Куда отправлять — решаете вы, добавив «приёмник» в `src/main.ts`:

```ts
// свой сервер: пачками, переживает закрытие вкладки
addSink(beaconSink("https://example.com/events"))
// Яндекс Метрика (счётчик подключён в index.html)
addSink((e) => (window as any).ym?.(12345678, "reachGoal", e.name, e.data))
```

Что смотреть: на каком уровне бросают игру (`level_start` без `level_complete`), где чаще всего умирают (`death` с координатами), какие ошибки у игроков. Соблюдайте правила порталов о сборе данных.

## Библиотеки под жанр

Стек намеренно лёгкий. Когда жанру нужно больше — проверенные пакеты (ставить с объяснением, зачем):

| Нужно | Пакет | Зачем |
|---|---|---|
| Поиск пути по тайлам (top-down, tower defense) | [easystarjs](https://github.com/prettymuchbryce/easystarjs) | A* по сетке слоя `ground` |
| Диалоги и ветвящиеся сюжеты | [inkjs](https://github.com/y-lohse/inkjs) | сценарии на [Ink](https://www.inklestudios.com/ink/) пишутся отдельно от кода |
| Сотни одинаковых сущностей (survivors, симуляции) | [bitecs](https://github.com/NateTheGreatt/bitECS) | ECS: быстрые данные вместо тысяч объектов |
| Сложный интерфейс (инвентарь, прокрутка) | DOM поверх canvas | HTML/CSS для меню, Phaser — для игры |
| Генерация уровней, шум | [simplex-noise](https://github.com/jwagner/simplex-noise.js) | пещеры, острова, облака |
| Звуковые эффекты без файлов | [jsfxr](https://github.com/chr15m/jsfxr) | 8-битные звуки генератором → WAV в `sounds/` |

Перед установкой проверьте, что пакет живой и работает с Phaser 4.
