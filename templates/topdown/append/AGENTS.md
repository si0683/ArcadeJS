
## Genre: top-down

This project was created with `--template=topdown`. The shared template is a platformer; these files come from the genre template:

- `src/genre.ts` — `GENRE` (name, controls text, the dash on Space/Shift/X instead of jump, joystick-only touch controls, `HERO` as the dev panel tuning).
- `src/topdown.ts` — walking in eight directions with acceleration/friction and a dash with a cooldown (`HERO`), plain functions tested in `topdown.test.ts`.
- `src/entities/Hero.ts` (no gravity, invulnerable while dashing) and `src/entities/Chaser.ts` (wander/chase through `StateMachine`; Tiled properties `speed`, `sight`).
- `src/scenes/GameScene.ts` — world gravity 0; maps: layer `decor` is the floor, `ground` holds walls (`collides`) and water (`hazard`), `objects` — `player`, `coin`, `slime`, `checkpoint`, `hint`, `flag`. A dash defeats a slime, a touch hurts.
- Platformer files (`movement.ts`, `entities/Player.ts`, `Slime.ts`, `MovingPlatform.ts`, `parallax.ts`) stay as examples; remove them if not needed (keep `makeLevelTextures` used by PreloadScene or move it).
