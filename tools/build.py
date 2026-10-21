"""Собирает служебные файлы ArcadeJS.

Запускать из папки ArcadeJS после изменения примеров:

    python tools/build.py

Что делает:
0. Вписывает в arcade.js звуки Kenney и спрайты (inject_assets).
1. examples/<игра>/index.html и style.css — одинаковая заготовка для каждого примера
   (style.css создаётся, только если его ещё нет).
2. examples/<игра>/codepen.html — часть для окна HTML в CodePen.
3. Проверяет, что строки карты платформера одной длины.
"""
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')  # русский текст в консоли Windows

ROOT = Path(__file__).resolve().parent.parent
VERSION = re.search(r"VERSION = '([\d.]+)'", (ROOT / 'arcade.js').read_text(encoding='utf-8')).group(1)
CDN = f'https://cdn.jsdelivr.net/gh/si0683/ArcadeJS@{VERSION}'

EXAMPLES = {
    'starter': 'Фруктопад',
    'flappy': 'Флаппи',
    'snake': 'Змейка-умник',
    'breakout': 'Космо-арканоид',
    'platformer': 'Лисёнок',
    'shooter': 'Звёздный патруль',
    'angry': 'Злые эмодзи',
    'runner3d': 'Космо-раннер 3D',
    'adventure': 'Приключение',
}

CODEPEN = f'''<!-- Библиотека ArcadeJS: оформление и движок игры -->
<link rel="stylesheet" href="{CDN}/arcade.css">
<script src="{CDN}/arcade.js"></script>

<!-- Сюда ArcadeJS сам добавит игру: холст, меню, панель очков -->
<div id="game"></div>'''

STYLE = '''/* Свои стили игры. Всё оформление уже есть в arcade.css.
   Например, свой цвет кнопок и заголовков:
   .arc-root { --arc-accent: #ff4d6d; } */
'''


def index_html(title):
    return f'''<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — ArcadeJS</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

<!-- ↓↓↓ Для CodePen копируйте в окно HTML всё, что ниже этой строки ↓↓↓ -->
{CODEPEN}
<!-- ↑↑↑ Для CodePen: конец части для окна HTML ↑↑↑ -->

<script src="script.js"></script>
</body>
</html>
'''


def check_platformer_map():
    text = (ROOT / 'examples' / 'platformer' / 'script.js').read_text(encoding='utf-8')
    rows = re.findall(r"^  '([^']*)',?$", text.split('const MAP = [')[1].split('];')[0], re.M)
    lengths = {len(r) for r in rows}
    if len(lengths) != 1:
        raise SystemExit(f'Карта платформера: строки разной длины {sorted(lengths)}')
    print(f'Карта платформера: {len(rows)} строк по {lengths.pop()} клеток')


def replace_block(js, mark, block):
    """Заменяет всё между // MARK:START и // MARK:END."""
    start, end = f'  // {mark}:START\n', f'  // {mark}:END'
    return js.split(start)[0] + start + block + '\n' + end + js.split(end, 1)[1]


def inject_assets():
    """Вписывает в arcade.js список звуков Kenney (sounds/kenney) и спрайтов (tools/sprites.json)."""
    import json
    js_path = ROOT / 'arcade.js'
    js = js_path.read_text(encoding='utf-8')
    names = sorted(f.stem for f in (ROOT / 'sounds' / 'kenney').glob('*.wav'))
    block = '  const KENNEY_SOUNDS = [' + ', '.join(repr(n) for n in names) + '];'
    js = replace_block(js, 'KENNEY', block)
    data = json.loads((ROOT / 'tools' / 'sprites.json').read_text(encoding='utf-8'))
    anims = json.dumps(data['anims'], ensure_ascii=False, separators=(',', ':'))
    block = '  const SPRITE_NAMES = ' + json.dumps(data['images']) + ';\n  const SPRITE_ANIMS = ' + anims + ';'
    js = replace_block(js, 'SPRITES', block)
    js_path.write_text(js, encoding='utf-8', newline='\n')
    print(f'arcade.js: {len(names)} звуков Kenney, {len(data["images"])} спрайтов, {len(data["anims"])} анимаций')


if __name__ == '__main__':
    inject_assets()
    for folder, title in EXAMPLES.items():
        d = ROOT / 'examples' / folder
        (d / 'index.html').write_text(index_html(title), encoding='utf-8', newline='\n')
        (d / 'codepen.html').write_text(CODEPEN + '\n', encoding='utf-8', newline='\n')
        if not (d / 'style.css').exists():
            (d / 'style.css').write_text(STYLE, encoding='utf-8', newline='\n')
        print(f'examples/{folder}: готово')
    check_platformer_map()
