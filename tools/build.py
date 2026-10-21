"""Build helper for ArcadeJS. Run from the repository root after changing the engine or examples:

    python tools/build.py

What it does:
0. Writes the Kenney sound list (sounds/kenney) and sprite list (tools/sprites.json) into arcade.js.
1. Writes examples/<name>/index.html (and style.css if missing) from one template.
2. Writes examples/<name>/codepen.html — the part for CodePen's HTML panel.
3. Writes arcade.mjs — the ES module entry for npm / bundlers.
4. Checks that the platformer map rows have equal length.
"""
import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parent.parent
VERSION = re.search(r"VERSION = '([\d.]+)'", (ROOT / 'arcade.js').read_text(encoding='utf-8')).group(1)
CDN = f'https://cdn.jsdelivr.net/gh/si0683/ArcadeJS@{VERSION}'

EXAMPLES = {
    'starter': 'Fruit Drop',
    'flappy': 'Flappy',
    'snake': 'Quiz Snake',
    'breakout': 'Space Breakout',
    'platformer': 'Little Fox',
    'shooter': 'Star Patrol',
    'angry': 'Angry Emoji',
    'runner3d': 'Space Runner 3D',
    'adventure': 'Adventure',
}

CODEPEN = f'''<!-- ArcadeJS: styles and engine -->
<link rel="stylesheet" href="{CDN}/arcade.css">
<script src="{CDN}/arcade.js"></script>

<!-- ArcadeJS adds the game here: canvas, menu, HUD -->
<div id="game"></div>'''

STYLE = '''/* Your own styles. Everything else is in arcade.css.
   Example — custom button and title colour:
   .arc-root { --arc-accent: #ff4d6d; } */
'''

ESM = f'''/*! ArcadeJS {VERSION} — ES module entry. MIT License. https://github.com/si0683/ArcadeJS */
// The engine is a browser script that defines window.Arcade; this file re-exports it.
// Sounds and sprites load from the CDN (or from config.assetsUrl).
import './arcade.js';

const Arcade = typeof window !== 'undefined' ? window.Arcade : undefined;
export default Arcade;
export const create = (config) => Arcade.create(config);
export const version = '{VERSION}';
'''


def index_html(title):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — ArcadeJS</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

<!-- ↓↓↓ CodePen: copy everything below this line into the HTML panel ↓↓↓ -->
{CODEPEN}
<!-- ↑↑↑ CodePen: end of the HTML panel part ↑↑↑ -->

<script src="script.js"></script>
</body>
</html>
'''


def check_platformer_map():
    text = (ROOT / 'examples' / 'platformer' / 'script.js').read_text(encoding='utf-8')
    rows = re.findall(r"^  '([^']*)',?$", text.split('const MAP = [')[1].split('];')[0], re.M)
    lengths = {len(r) for r in rows}
    if len(lengths) != 1:
        raise SystemExit(f'Platformer map: rows have different lengths {sorted(lengths)}')
    print(f'Platformer map: {len(rows)} rows × {lengths.pop()} tiles')


def replace_block(js, mark, block):
    """Replace everything between // MARK:START and // MARK:END."""
    start, end = f'  // {mark}:START\n', f'  // {mark}:END'
    return js.split(start)[0] + start + block + '\n' + end + js.split(end, 1)[1]


def inject_assets():
    """Write the Kenney sound list and the sprite catalogue into arcade.js."""
    js_path = ROOT / 'arcade.js'
    js = js_path.read_text(encoding='utf-8')
    names = sorted(f.stem for f in (ROOT / 'sounds' / 'kenney').glob('*.wav'))
    js = replace_block(js, 'KENNEY', '  const KENNEY_SOUNDS = [' + ', '.join(repr(n) for n in names) + '];')
    data = json.loads((ROOT / 'tools' / 'sprites.json').read_text(encoding='utf-8'))
    anims = json.dumps(data['anims'], ensure_ascii=False, separators=(',', ':'))
    js = replace_block(js, 'SPRITES', '  const SPRITE_NAMES = ' + json.dumps(data['images']) + ';\n  const SPRITE_ANIMS = ' + anims + ';')
    js_path.write_text(js, encoding='utf-8', newline='\n')
    print(f'arcade.js: {len(names)} Kenney sounds, {len(data["images"])} sprites, {len(data["anims"])} animations')


if __name__ == '__main__':
    inject_assets()
    for folder, title in EXAMPLES.items():
        d = ROOT / 'examples' / folder
        (d / 'index.html').write_text(index_html(title), encoding='utf-8', newline='\n')
        (d / 'codepen.html').write_text(CODEPEN + '\n', encoding='utf-8', newline='\n')
        if not (d / 'style.css').exists():
            (d / 'style.css').write_text(STYLE, encoding='utf-8', newline='\n')
        print(f'examples/{folder}: ok')
    (ROOT / 'arcade.mjs').write_text(ESM, encoding='utf-8', newline='\n')
    print('arcade.mjs: ok')
    check_platformer_map()
