# Игра как приложение для Android (Google Play, RuStore, AppGallery)

Сборка та же, что для браузера: [Capacitor](https://capacitorjs.com) кладёт `dist/` в приложение с WebView. Код игры менять не нужно.

## Что нужно

- Node.js 22+ (Capacitor 8).
- [Android Studio](https://developer.android.com/studio): он ставит Android SDK и собирает APK/AAB.

## Шаги

```bash
npm run mobile:init   # один раз: Capacitor, папка android/, экран зафиксирован горизонтально
npm run mobile        # сборка → копия в android/ → открывается Android Studio
```

В Android Studio: **Run ▶** — запуск на телефоне по USB или в эмуляторе. **Build → Generate Signed App Bundle** — файл `.aab` для Google Play и RuStore.

Папку `android/` коммитьте: в ней иконки, подпись и настройки приложения.

## Настройки

- **Название и id** — в `capacitor.config.json` (`appId` вида `ru.mysite.mygame` задаётся один раз: магазины узнают приложение по нему).
- **Ориентация** — `scripts/mobile.mjs`, константа `ORIENTATION` (`sensorLandscape` или `sensorPortrait`). Уже созданный проект: `android:screenOrientation` в `android/app/src/main/AndroidManifest.xml`.
- **Иконка и заставка**: `npx @capacitor/assets generate` из картинок `assets/icon.png` (1024×1024) и `assets/splash.png`.

## Что работает иначе, чем на площадке

- Платформа — `none` (как свой сайт): сохранения в памяти WebView, рекламы и покупок нет. С игровым сервером (`VITE_BACKEND_URL`) прогресс хранится и на сервере, а код переноса из настроек переносит его на телефон.
- **Кнопка «Назад».** Без плагина она закрывает приложение. Чтобы она открывала паузу, поставьте `npm i @capacitor/app` и добавьте в `src/main.ts`:

  ```ts
  import { App } from "@capacitor/app"
  App.addListener("backButton", () => (game.scene.getScene("game") as GameScene).pause())
  ```

- **Реклама и покупки в магазинах** — через плагины: например, [AdMob](https://github.com/capacitor-community/admob), [Yandex Mobile Ads](https://ads.yandex.com/helpcenter/ru/dev/android/), RuStore Billing. Подключайте их как новую платформу в `src/platform/` (интерфейс `types.ts`), тогда код игры не изменится.
