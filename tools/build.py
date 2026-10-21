"""Build helper for GameMonsterJS. Run from the repository root after changing the engine:

    python tools/build.py

What it does:
1. Writes the Kenney sound list (sounds/kenney) and sprite list (tools/sprites.json) into gamemonster.js.
2. Writes gamemonster.mjs — the ES module entry for npm / bundlers.

examples/ holds finished games copied as is from their own repositories; this script never touches them.
"""
import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parent.parent
VERSION = re.search(r"VERSION = '([\d.]+)'", (ROOT / 'gamemonster.js').read_text(encoding='utf-8')).group(1)

ESM = f'''/*! GameMonsterJS {VERSION} — ES module entry. MIT License. https://github.com/si0683/GameMonsterJS */
// The engine is a browser script that defines window.GameMonster; this file re-exports it.
// Sounds and sprites load from the CDN (or from config.assetsUrl).
import './gamemonster.js';

const GameMonster = typeof window !== 'undefined' ? window.GameMonster : undefined;
export default GameMonster;
export const create = (config) => GameMonster.create(config);
export const version = '{VERSION}';
'''


def replace_block(js, mark, block):
    """Replace everything between // MARK:START and // MARK:END."""
    start, end = f'  // {mark}:START\n', f'  // {mark}:END'
    return js.split(start)[0] + start + block + '\n' + end + js.split(end, 1)[1]


def inject_assets():
    """Write the Kenney sound list and the sprite catalogue into gamemonster.js."""
    js_path = ROOT / 'gamemonster.js'
    js = js_path.read_text(encoding='utf-8')
    names = sorted(f.stem for f in (ROOT / 'sounds' / 'kenney').glob('*.wav'))
    js = replace_block(js, 'KENNEY', '  const KENNEY_SOUNDS = [' + ', '.join(repr(n) for n in names) + '];')
    data = json.loads((ROOT / 'tools' / 'sprites.json').read_text(encoding='utf-8'))
    anims = json.dumps(data['anims'], ensure_ascii=False, separators=(',', ':'))
    js = replace_block(js, 'SPRITES', '  const SPRITE_NAMES = ' + json.dumps(data['images']) + ';\n  const SPRITE_ANIMS = ' + anims + ';')
    js_path.write_text(js, encoding='utf-8', newline='\n')
    print(f'gamemonster.js: {len(names)} Kenney sounds, {len(data["images"])} sprites, {len(data["anims"])} animations')


if __name__ == '__main__':
    inject_assets()
    (ROOT / 'gamemonster.mjs').write_text(ESM, encoding='utf-8', newline='\n')
    print('gamemonster.mjs: ok')
