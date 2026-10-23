# Игра для ПК и Steam

[Electron](https://www.electronjs.org) открывает `dist/` в собственном окне: Windows, macOS, Linux. Код игры тот же, что для браузера.

## Шаги

```bash
npm run desktop:init    # один раз: Electron и electron-builder (~150 МБ)
npm run desktop         # сборка и игра в окне
npm run desktop:check   # проверка без окна: игра запускается (подходит для CI)
npm run desktop:build   # папка с приложением: release/win-unpacked (на macOS и Linux — свои)
```

В окне: F11 или Alt+Enter — полный экран. Сохранения хранятся в профиле приложения (`localStorage` адреса `app://game`).

Настройки сборки — `desktop/electron-builder.json`: `appId`, `productName`, иконка (`"win": { "icon": "desktop/icon.ico" }`), установщик (`"target": "nsis"` вместо `dir`). Собирайте на той системе, для которой выпускаете: Windows-версию — на Windows.

## Steam

1. Купите место в Steamworks и получите **App ID**.
2. Запишите App ID в `desktop/steam_appid.txt` (только число) и поставьте мост к Steam:

   ```bash
   npm i steamworks.js
   ```

3. Достижения: в Steamworks → **Stats & Achievements** заведите достижения с **API Name**, равными `id` из `src/achievements.ts` (`first_win`, `no_damage`, `coins_100`, `all_stars`). Игра открывает их сама: `src/desktop.ts` вызывается из `unlockAchievements()`.
4. Запустите Steam и выполните `npm run desktop`. В консоли появится «Steam: <ваше имя>», Shift+Tab откроет оверлей.
5. Загрузка билда: `npm run desktop:build`, затем папку `release/win-unpacked` загрузите через SteamPipe ([ContentBuilder из Steamworks SDK](https://partner.steamgames.com/doc/sdk/uploading)). Исполняемый файл для запуска — `My Game.exe` (имя задаёт `productName`).

Без Steam (нет App ID, Steam не запущен, нет `steamworks.js`) игра работает как обычно, достижения просто не отправляются.

## Чего ещё ждёт Steam

- Управление с геймпада уже есть (`src/input.ts`). Для пометки Steam Deck Verified нужен ещё экранный ввод текста (если в игре есть поля ввода) и читаемый шрифт на экране 1280×800.
- Окно должно правильно меняться в размере: игра растягивается сама (`Scale.FIT`).
- Настройки громкости и полного экрана есть в меню.
