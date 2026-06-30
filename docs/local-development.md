# Local Development

This setup runs the full local development stack in Docker Compose:

- PostgreSQL on host port `5433`
- Next.js dev server on `http://localhost:3000`

Pressing Play for `docker-compose.local.yml` in Docker Desktop starts both services.

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

## Keys Needed For Full Behavior

Full collaborative canvas and AI behavior requires additional keys in `.env.local`:

- `LIVEBLOCKS_SECRET_KEY` for Liveblocks room auth and collaboration.
- `TRIGGER_SECRET_KEY` and `NEXT_PUBLIC_TRIGGER_PUBLIC_API_KEY` for Trigger.dev run creation and run status.
- `GOOGLE_AI_API_KEY` for Gemini-backed AI design/spec generation.

Without these keys, local auth and database-backed project flows can still be tested, but Liveblocks, Trigger.dev, and Google AI calls will fail when reached.
