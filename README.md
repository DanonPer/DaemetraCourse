# DaemetraCourse Monorepo

NestJS monorepo with two applications:

- `user-service` - main API with MongoDB, Redis, MinIO, Swagger, auth, users, avatars, roles, and background jobs
- `notification-service` - separate Nest application for notifications

## Structure

```text
apps/
  user-service/
  notification-service/
```

## Requirements

- Node.js 22+
- npm
- Docker and Docker Compose

## Quick Start With Docker

Make sure `.production.env` exists in the project root, then run:

```bash
docker compose up --build
```

Services:

- User API: `http://localhost:5000`
- Swagger: `http://localhost:5000/api/docs`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

Stop containers:

```bash
docker compose down
```

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create `.development.env` from the example:

```bash
cp .development.env.example .development.env
```

PowerShell:

```powershell
Copy-Item .development.env.example .development.env
```

3. Start infrastructure services:

```bash
docker compose up -d mongo mongo-init redis minio
```

If MongoDB was previously started without a replica set, rebuild volumes first:

```bash
docker compose down -v
docker compose up -d mongo mongo-init redis minio
```

4. Check `.development.env`. Typical local values:

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

## Run Applications

Run the main API in development mode:

```bash
npm run start:dev
```

Run `user-service` without watch mode:

```bash
npm run start
```

Run `notification-service` in development mode:

```bash
npm run start:notification-service:dev
```

Run `notification-service` without watch mode:

```bash
npm run start:notification-service
```

## Build Commands

Build `user-service`:

```bash
npm run build
```

Build `notification-service`:

```bash
npm run build:notification-service
```

Build both applications:

```bash
npm run build:all
```

Run production builds:

```bash
npm run start:prod
npm run start:notification-service:prod
```

## Tests

Unit tests:

```bash
npm run test
```

E2E tests for `user-service`:

```bash
npm run test:e2e
```

E2E tests for `notification-service`:

```bash
npm run test:e2e:notification-service
```

Coverage:

```bash
npm run test:cov
```

## Background Jobs

The `user-service` uses Bull and Redis for background processing.

Currently the project includes a balance reset module with:

- manual trigger via `POST /balance-reset`
- scheduled job creation every 10 minutes while the application is running

## Environment Files

The application selects the env file by `NODE_ENV`:

- `NODE_ENV=development` -> `.development.env`
- `NODE_ENV=production` -> `.production.env`
