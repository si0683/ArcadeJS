# Third-party assets and libraries

GameMonsterJS code is MIT-licensed (see LICENSE). It ships with or loads the following:

| What | Where | Author | License |
|---|---|---|---|
| Sound effects | `sounds/kenney/` | [Kenney](https://kenney.nl) — Interface, Impact, Digital, Sci-fi, RPG audio, Music jingles | CC0 1.0 |
| Sprites | `sprites/` | [Kenney](https://kenney.nl) — Pixel Platformer, Tiny Dungeon, Space Shooter Remastered, Animal Pack, Toon Characters | CC0 1.0 |
| Background music | `sounds/music/` | Juhani Junkala ([OpenGameArt](https://opengameart.org/content/5-chiptunes-action), [Chiptune Adventures](https://opengameart.org/content/4-chiptunes-adventure)) | CC0 1.0 |
| Built-in sounds | `sounds/*.wav, *.mp3` | si0683 | MIT (with this package) |
| Sound synth | embedded in `gamemonster.js` | [ZzFX](https://github.com/KilledByAPixel/ZzFX) Micro 1.4.0 by Frank Force | MIT |
| Emoji images | loaded from jsDelivr | [Twemoji](https://github.com/jdecked/twemoji) (jdecked fork) | Graphics CC BY 4.0, code MIT |
| Physics (optional) | loaded from jsDelivr when `physics: true` | [Matter.js](https://brm.io/matter-js/) 0.20.0 | MIT |
| 3D (optional) | loaded from jsDelivr when `mode: '3d'` | [Three.js](https://threejs.org) 0.186.1 | MIT |
| Fonts | Google Fonts | Russo One, Rubik | SIL Open Font License 1.1 |

**Twemoji attribution.** Emoji graphics are © Twitter, Inc and other contributors, licensed under CC BY 4.0. If you ship a game that shows them, keep a credit line (for example in your About screen or README), or set `emojiStyle: 'system'` to use the device's own emoji font.
