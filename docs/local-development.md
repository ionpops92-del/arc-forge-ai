# Local Development

This setup runs the full local development stack in Docker Compose:

- PostgreSQL on host port `5433`
- Next.js dev server on `http://localhost:3000`
- Internal AI worker for queued design/spec tasks
- Internal realtime WebSocket service on `http://localhost:3001` with browser WebSocket URL `ws://localhost:3001/ws`
- Local filesystem artifact storage under `.local-storage`
- Deterministic mock AI provider for local design/spec tasks with no external AI key

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

The worker container waits for the app healthcheck, then starts the internal PostgreSQL-backed AI task runner. Docker local mode sets `AI_PROVIDER=mock`, so design and spec tasks complete deterministically without Google, OpenAI-compatible, or other external AI credentials.

The realtime container waits for PostgreSQL and the app healthcheck, then starts the internal WebSocket service. It provides authenticated room tokens, room joins, presence updates, chat/status events, canvas synchronization, and bounded payload handling. React Flow remains the canvas renderer.

The app and worker containers share `./.local-storage:/app/.local-storage`. Local canvas snapshots and generated specs are written through the provider-agnostic storage layer with `STORAGE_PROVIDER=local_fs` and `LOCAL_STORAGE_ROOT=/app/.local-storage`.

Local HTTP and WS URLs are development-only. Any staging, preview, or production environment must use HTTPS for the app and WSS for the realtime WebSocket URL; insecure non-local configuration fails closed.
The browser bundle uses `NEXT_PUBLIC_APP_ENV=local` to allow `ws://localhost:3001/ws` only for local browser sessions. Server-side services use `APP_ENV=local`; internal realtime publish URL fallback to localhost is local-only.

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

The Docker named volume keeps local database data between starts. The `.local-storage/` directory keeps local canvas/spec artifacts between starts and is ignored by git. To remove local data, delete the `arc-forge-ai-postgres-data` Docker volume and/or the `.local-storage/` directory manually.

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
- internal realtime token issuance, realtime health checks, presence, chat/status events, and canvas synchronization
- canvas autosave and reload through local filesystem artifact storage
- secure spec preview/download routes for specs stored through the local provider
- deterministic mock AI design and spec generation through the internal task worker

## Keys Needed For Full Behavior

Full local artifact persistence does not require an external object storage key. Local AI smoke does not require an external AI key because `AI_PROVIDER=mock` is the default:

- `INTERNAL_REALTIME_TOKEN_SECRET` for internal realtime room token signing. Docker local mode provides a development-only placeholder if no local value is set.
- `INTERNAL_REALTIME_SERVICE_SECRET` for app/worker-to-realtime internal publish calls. Docker local mode provides a development-only placeholder if no local value is set.
- `NEXT_PUBLIC_APP_ENV=local` and `NEXT_PUBLIC_REALTIME_URL=ws://localhost:3001/ws` for local browser realtime connections.
- `STORAGE_PROVIDER=local_fs` and `LOCAL_STORAGE_ROOT=.local-storage` for host-side local artifact storage. Docker overrides the root to `/app/.local-storage`.
- `BLOB_READ_WRITE_TOKEN` only when `STORAGE_PROVIDER=vercel_blob`.
- `AI_PROVIDER=mock` for deterministic local design/spec generation without external keys.
- `AI_PROVIDER=google` plus `GOOGLE_AI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` for Gemini-backed design/spec generation. `GOOGLE_AI_MODEL` and `GOOGLE_AI_SPEC_MODEL` can override the default `gemini-2.5-flash`.
- `AI_PROVIDER=openai_compatible` plus `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` for hosted or self-hosted OpenAI-compatible APIs. `AI_SPEC_MODEL` defaults to `AI_MODEL` when omitted.

Without external AI keys, local auth, database-backed project flows, realtime room connectivity, canvas persistence, mock AI design/spec tasks, and provider-backed spec preview/download can be tested. If an external provider is selected without required env, individual queued tasks fail safely without stopping the worker. The internal realtime service can be health-checked at:

```text
http://localhost:3001/health
```
