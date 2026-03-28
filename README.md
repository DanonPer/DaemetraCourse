# DaemetraCourse

NestJS API с MongoDB, Redis и MinIO.

## Что нужно для запуска

- Node.js 22+
- npm
- Docker и Docker Compose

## Вариант 1. Быстрый запуск через Docker Compose

1. Убедитесь, что файл `.production.env` существует в корне проекта.
2. Запустите проект:

```bash
docker compose up --build
```

MongoDB в compose запускается как `replica set`, поэтому переводы с транзакциями будут работать без ручной настройки.

3. После запуска сервисы будут доступны по адресам:

- API: `http://localhost:5000`
- Swagger: `http://localhost:5000/api/docs`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

Для остановки:

```bash
docker compose down
```

## Вариант 2. Локальный запуск приложения

1. Установите зависимости:

```bash
npm install
```

2. Создайте файл `.development.env` на основе примера:

```bash
cp .development.env.example .development.env
```

Если вы работаете в PowerShell:

```powershell
Copy-Item .development.env.example .development.env
```

3. Поднимите зависимости отдельно. Проще всего через Docker:

```bash
docker compose up -d mongo redis minio
```

4. Проверьте значения в `.development.env`.

Если приложение запускается на хосте, а MongoDB/Redis/MinIO в Docker, обычно подходят такие значения:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nest-db?replicaSet=rs0

PRIVATE_KEY=private_keys
PUBLIC_KEY=public_key
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
REFRESH_TOKEN_DB_EXPIRES_DAYS=7
OLD_TOKENS_CLEANUP_DAYS=1

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=images

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

NODE_ENV=development
```

5. Запустите приложение:

```bash
npm run start:dev
```

После запуска:

- API: `http://localhost:5000`
- Swagger: `http://localhost:5000/api/docs`

## Полезные команды

Запуск без watch-режима с `NODE_ENV=production`:

```bash
npm run start
```

Сборка:

```bash
npm run build
```

Запуск собранного приложения:

```bash
npm run start:prod
```

Тесты:

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Примечание по env-файлам

Приложение выбирает env-файл по `NODE_ENV`:

- `NODE_ENV=development` -> `.development.env`
- `NODE_ENV=production` -> `.production.env`
