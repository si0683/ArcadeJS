"""Собирает служебные файлы ArcadeJS.

Запускать из папки ArcadeJS после изменения примеров:

    python tools/build.py

Что делает:
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


if __name__ == '__main__':
    for folder, title in EXAMPLES.items():
        d = ROOT / 'examples' / folder
        (d / 'index.html').write_text(index_html(title), encoding='utf-8', newline='\n')
        (d / 'codepen.html').write_text(CODEPEN + '\n', encoding='utf-8', newline='\n')
        if not (d / 'style.css').exists():
            (d / 'style.css').write_text(STYLE, encoding='utf-8', newline='\n')
        print(f'examples/{folder}: готово')
    check_platformer_map()
