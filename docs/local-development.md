# Local Development

This setup runs PostgreSQL in Docker and runs the Next.js app directly on Windows with npm.

## Prerequisites

- Docker Desktop running.
- Node.js and npm installed.
- Dependencies installed with `npm install`.

## 1. Configure Local Environment

Copy the example env file:

```bash
copy .env.local.example .env.local
```

The local database URL is:

```env
DATABASE_URL=postgresql://arcforge:arcforge@localhost:5433/arcforge_ai?schema=public
```

Do not commit `.env.local`. It is ignored by git.

## 2. Start Local PostgreSQL

```bash
npm run db:local:up
```

View logs if needed:

```bash
npm run db:local:logs
```

## 3. Apply Prisma Migrations

```bash
npm run db:migrate
```

This creates the local schema in the Docker PostgreSQL database.

## 4. Start the App

```bash
npm run dev:local
```

Open:

```text
http://localhost:3000
```

## What Works With Only Local DB

With only `DATABASE_URL` and `AUTH_SESSION_COOKIE_NAME` configured, you can use:

- internal register/login/logout flows
- `/api/auth/me`
- local project creation and project navigation
- owner/collaborator database records

## Keys Needed for Full Behavior

Full collaborative canvas and AI behavior requires additional keys:

- `LIVEBLOCKS_SECRET_KEY` for Liveblocks room auth and collaboration.
- `TRIGGER_SECRET_KEY` and `NEXT_PUBLIC_TRIGGER_PUBLIC_API_KEY` for Trigger.dev run creation and run status.
- `GOOGLE_AI_API_KEY` for Gemini-backed AI design/spec generation.

Without these keys, local auth and database-backed project flows can still be tested, but Liveblocks, Trigger.dev, and Google AI calls will fail when reached.

## Stop Local PostgreSQL

```bash
npm run db:local:down
```

The Docker named volume keeps local database data between starts. To remove that data, delete the `arc-forge-ai-postgres-data` Docker volume manually.
