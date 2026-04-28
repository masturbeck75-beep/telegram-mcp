# Telegram MCP

Минимальный MCP-сервер для ChatGPT Agent Builder, который отправляет сообщения в Telegram через бота.

## Что умеет

Инструмент:

- `send_telegram_message`

## Переменные окружения

Обязательные:

- `TELEGRAM_BOT_TOKEN` — токен Telegram-бота

Необязательные:

- `DEFAULT_CHAT_ID` — чат по умолчанию
- `PORT` — порт, по умолчанию `3000`

## Локальный запуск

```bash
npm install
npm start
```

Проверка health:

```bash
http://localhost:3000/health
```

SSE endpoint для MCP:

```bash
http://localhost:3000/sse
```

## Deploy на Render

### Build Command
```bash
npm install
```

### Start Command
```bash
npm start
```

### Environment Variables
Добавь в Render:

- `TELEGRAM_BOT_TOKEN=...`
- `DEFAULT_CHAT_ID=...` (если хочешь чат по умолчанию)

## Подключение в ChatGPT Builder

В Custom MCP:

- **Название**: `Telegram Reports`
- **Описание**: `Отправка отчетов в Telegram`
- **URL-адрес MCP-сервера**: `https://YOUR-RENDER-URL.onrender.com/sse`

Аутентификацию можно пока не включать, если сначала хочешь просто проверить запуск.

## Важно

Если бот пишет в тему/ветку Telegram, передавай `message_thread_id`.
Если `DEFAULT_CHAT_ID` не задан, `chat_id` нужно передавать в вызове инструмента.
