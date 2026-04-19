# Russian Cup iGaming — frontend

Клиент на **SvelteKit** + **TypeScript** + **SCSS** (мок-лобби, темы, навигация).

## Требования

- **Node.js** 20+ (рекомендуется LTS)
- **npm** (идёт с Node)

Проверка версий:

```sh
node -v
npm -v
```

## Установка зависимостей

В корне репозитория:

```sh
npm install
```

## Запуск в режиме разработки

```sh
npm run dev
```

По умолчанию Vite поднимет сервер (обычно `http://localhost:5173`). Адрес и порт будут в выводе терминала.

Чтобы открыть приложение в браузере автоматически:

```sh
npm run dev -- --open
```

Остановка: `Ctrl+C` в терминале.

## Сборка и предпросмотр production

Сборка:

```sh
npm run build
```

Локальный просмотр собранной версии:

```sh
npm run preview
```

## Проверка типов и Svelte

```sh
npm run check
```

В режиме наблюдения:

```sh
npm run check:watch
```
