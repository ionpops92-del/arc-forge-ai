# Local Development

This setup runs the full local development stack in Docker Compose:

- PostgreSQL on host port `5433`
- Next.js dev server on `http://localhost:3000`
- Internal AI worker for queued design/spec tasks
- Internal realtime WebSocket service on `http://localhost:3001`

Pressing Play for `docker-compose.local.yml` in Docker Desktop starts all services.

## Prerequisites

- Docker Desktop running.
- Node.js and npm installed if you want to run host-side commands such as lint, build, or Prisma tools.

## 1. Optional Local Environment

Copy the example env file if you want to add optional service keys:

```bash
copy .env.local.example .env.local
```

Do not commit `.env.local`. It is ignored by git.

The database URL in `.env.local.example` is for tools running from Windows:

```env
DATABASE_URL=postgresql://arcforge:arcforge@localhost:5433/arcforge_ai?schema=public
```

Inside Docker Compose, the app service overrides `DATABASE_URL` to use the internal Docker hostname:

```env
DATABASE_URL=postgresql://arcforge:arcforge@postgres:5432/arcforge_ai?schema=public
```

## 2. Start The Full Stack

From the repository root:

```bash
npm run stack:local:up
```

`npm run dev:local` is an alias for the same full-stack command.

You can also press Play in Docker Desktop for `docker-compose.local.yml`.

The app container installs dependencies if needed, generates Prisma Client, applies committed migrations with `prisma migrate deploy`, then starts Next.js on `0.0.0.0:3000`.

The worker container waits for the app healthcheck, then starts the internal PostgreSQL-backed AI task runner.

The realtime container waits for PostgreSQL and the app healthcheck, then starts the internal WebSocket service. In this foundation phase it provides authenticated room tokens, room joins, presence updates, pings, and generic event broadcast. Liveblocks remains the active canvas runtime until the next cutover step, and React Flow remains the canvas renderer.

Open:

```text
http://localhost:3000
```

## Logs

View logs for the full stack:

```bash
npm run stack:local:logs
```

View PostgreSQL logs only:

```bash
npm run db:local:logs
```

View app logs only:

```bash
npm run app:local:logs
```

View AI worker logs only:

```bash
npm run worker:local:logs
```

View internal realtime logs only:

```bash
npm run realtime:local:logs
```

## Stop The Full Stack

```bash
npm run stack:local:down
```

The Docker named volume keeps local database data between starts. To remove that data, delete the `arc-forge-ai-postgres-data` Docker volume manually.

## Database-Only Mode

If you want to run the Next.js app directly on Windows, start only PostgreSQL:

```bash
npm run db:local:up
```

Then use the host database URL from `.env.local.example` and run host-side commands such as:

```bash
npm run db:migrate
npm run dev
```

Stop the database-only service with:

```bash
npm run db:local:down
```

Use `npm run stack:local:down` when the full stack is running.

## What Works With Only Local DB/Auth

With only the Docker PostgreSQL database and internal auth defaults, you can use:

- internal register/login/logout flows
- `/api/auth/me`
- local project creation and project navigation
- owner/collaborator database records
- internal realtime token issuance and realtime health checks

## Keys Needed For Full Behavior

Full collaborative canvas and AI behavior requires additional keys in `.env.local`:

- `LIVEBLOCKS_SECRET_KEY` for Liveblocks room auth and collaboration.
- `INTERNAL_REALTIME_TOKEN_SECRET` for internal realtime room token signing. Docker local mode provides a development-only placeholder if no local value is set.
- `BLOB_READ_WRITE_TOKEN` for Vercel Blob canvas/spec persistence.
- `GOOGLE_AI_API_KEY` for Gemini-backed AI design/spec generation.

Without these keys, local auth and database-backed project flows can still be tested, but Liveblocks, Vercel Blob, and Google AI calls will fail when reached. Missing AI service keys fail individual queued tasks safely without stopping the worker. The internal realtime service can be health-checked at:

```text
http://localhost:3001/health
```
