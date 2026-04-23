# Quick Rooms – Frontend
### Столото

## Технологический стек

| Категория            | Технологии                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Фреймворк**        | [SvelteKit](https://kit.svelte.dev/) (маршрутизация, SSR/CSR, адаптеры)                                                                        |
| **UI-реактивность**  | [Svelte 5 Runes](https://svelte.dev/docs/svelte/$state) (`$state`, `$derived`, `$effect`) + классические Svelte‑сторы (`writable`)             |
| **Язык**             | [TypeScript](https://www.typescriptlang.org/) (строгая типизация, интерфейсы, дженерики)                                                         |
| **Сборщик**          | [Vite](https://vitejs.dev/) (встроен в SvelteKit, быстрая HMR)                                                                                 |
| **Стилизация**       | [SCSS](https://sass-lang.com/) (вложенные селекторы, переменные, модули) + CSS-переменные для тем                                                |
| **State‑менеджмент** | Svelte‑сторы (`writable`) для глобального состояния + Svelte 5 Runes для локальной реактивности компонентов                                     |
| **HTTP‑клиент**      | Собственная обёртка `requestJSON` на основе `fetch` (обработка ошибок, таймауты, авторизация)                                                   |
| **Реальное время**   | Server‑Sent Events (SSE) через `fetch` + `ReadableStream`, реализован вручную (`openSseStream`, `parseSseEvent`)                               |
| **Аутентификация**   | Bearer‑токен в `sessionStorage`, эндпоинты `/auth/mock-login`, `/users/me`, защита API‑запросов заголовком `Authorization`                      |
| **Роутинг**          | Файловая маршрутизация SvelteKit (`src/routes`)                                                                                               |
| **Контейнеризация**  | [Docker](https://www.docker.com/) (образ `node:20-bookworm-slim`, многоэтапная сборка, `npm run build` → `npm run preview`)                     |
| **Шрифты**           | [Google Fonts](https://fonts.google.com/) – Manrope (основной), Unbounded (акцидентный)                                                        |
| **Иконки**           | Инлайн‑SVG                                                                                                                                     |
| **Переменные окружения** | `PUBLIC_API_URL` (по умолчанию `http://localhost:8080/api`)                                                                                   |
| **Тестирование**     | Отсутствует (в текущем состоянии)                                                                                                              |

## Архитектура и ключевые решения

- **Адаптер SvelteKit** – `@sveltejs/adapter-auto` автоматически подбирает окружение (Node/Vercel/Cloudflare).
- **Раннее применение темы** – в `app.html` встроен `script`, который читает `localStorage` и выставляет `data-theme` до первого рендера компонентов.
- **Мгновенное обновление данных** – SSE‑стримы для лобби `/lobby/events` и комнаты `/room/events/{id}`; парсинг событий происходит в реальном времени без дополнительных библиотек.
- **API‑модули** – разделены на сервисы (`authApi`, `lobbyService`, `roomService`, `roomParticipantService` и др.) и мапперы DTO → фронтовые типы (`mapLobbyItemToRoom`, `mapRoomDetails` и пр.).
- **Игровые симуляции** – детерминированные анимации (колесо, рулетка, гонки, битва, динамит) с предопределённым победителем; логика сосредоточена в папке `src/lib/modules`.
- **Админ‑панель** – конфигуратор шаблонов комнат (`AdminConfigurator.svelte`) с полным CRUD и валидацией на клиенте.

## Быстрый старт (локальная разработка)

```bash
npm install
npm run dev
```

Сборка под продакшен:

```bash
npm run build
npm run preview  # порт 4173, --host 0.0.0.0
```

или через Docker:

```bash
docker build -t quick-rooms-frontend .
docker run -p 4173:4173 quick-rooms-frontend
```

Фронтенд ожидает API по адресу, указанному в `PUBLIC_API_URL` (по умолчанию `http://localhost:8080/api`).  
Для входа нужен Bearer‑токен (эндпоинт `/auth/mock-login`).

## Структура проекта (основные директории)

```
src/
├── lib/
│   ├── api/             # сервисы и мапперы API
│   ├── assets/          # статика (favicon.svg)
│   ├── components/      # переиспользуемые компоненты
│   ├── constants/       # константы (статусы комнат, игры, ключи)
│   ├── modules/         # логика игровых сценариев (wheel, battle и др.)
│   └── stores/          # Svelte‑сторы (auth, rooms, lobby, user…)
├── routes/              # страницы приложения
│   ├── admin/
│   ├── lobby/
│   ├── room/[id]/
│   ├── login/
│   ├── history/
│   └── …
└── app.html             # корневой HTML‑шаблон
```

## Примечания

- Проект активно использует **Svelte 5 Runes** – реактивность в компонентах реализована через `$state`, `$derived`, `$effect`, а не через `let` + реактивные выражения.
- Все важные утилиты (например, `requestJSON`) типизированы, ошибки оборачиваются в кастомный класс `APIError`.
- SSE-стримы корректно переподключаются при обрыве соединения с задержкой 1.5 с.
- Баланс пользователя обновляется периодически (интервал 10 с) и блокируется во время проигрывания анимации.
- Темы переключаются динамически через `data-theme` атрибут на `<html>` и сохраняются в `localStorage`.