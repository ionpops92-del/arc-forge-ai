# Architecture Context

## Stack

| Layer            | Technology              | Role                                                           |
| ---------------- | ----------------------- | -------------------------------------------------------------- |
| Framework        | Next.js 16 + TypeScript | Full-stack app with server/client boundaries                   |
| UI               | Tailwind + shadcn/ui    | Component composition and styling                              |
| Auth             | Internal auth           | User identity, server-side sessions, and route protection      |
| Database         | Prisma + PostgreSQL     | Relational metadata: projects, collaborators, specs, task runs |
| Canvas           | Liveblocks + React Flow | Real-time collaborative canvas, presence, and cursors          |
| Background tasks | Internal AI task runner | PostgreSQL-backed durable AI generation workflows              |
| Artifact storage | Vercel Blob             | Canvas snapshots and generated Markdown specs                  |

## System Boundaries

- `app/api` — Authenticated request handlers: input validation, ownership checks, task triggering, and persistence.
- `lib/ai-tasks` — Long-running background jobs: task leasing, retries, AI design generation, and spec generation.
- `scripts/ai-worker.ts` — Worker process entrypoint for local and production task execution.
- `lib` — Shared infrastructure: Prisma client, access control helpers, and utilities.
- `components` — UI composition: canvas surfaces, sidebars, dialogs, and interactive elements.
- `prisma` — Database schema and generated client output.
- `data` — Legacy local directory. Not used for new artifacts.

## Storage Model

- **Database**: metadata, ownership, relationships, AI task runs/events/attempts, and project spec records.
- **Vercel Blob**: generated artifacts — canvas snapshots at `canvas/{projectId}.json` and specs at `specs/{projectId}/{specId}.md`.
- Project records, spec records, and AI task run records belong in PostgreSQL.
- Canvas content and Markdown output are stored in and retrieved from Vercel Blob.
- The blob URL is stored in the database (`canvasBlobUrl`, `filePath`) as the reference to the artifact.

## Auth and Collaboration Model

- Every project has a single owner (`User.id` from the internal auth system).
- Internal sessions are verified server-side. Raw session tokens live only in httpOnly cookies; only hashed tokens are stored in PostgreSQL.
- Projects can include additional collaborators by normalized email address.
- Only authenticated users can access protected routes.
- Only the owner or a collaborator can mutate shared project resources.
- Owner-only project administration remains restricted to the owner.
- Liveblocks room tokens are issued only after verifying project membership.

## Starter System Designs

- Prebuilt templates are static canvas snapshots stored in the codebase.
- Templates are loaded into the active Liveblocks room when a user imports one.
- Import can occur on canvas creation or from within the editor at any time.
- Template data follows the same node/edge schema as user-created canvas content.
- Templates do not require a separate database record; they are resolved by template ID at import time.

## AI Generation Model

### Design Generation

- Input: user prompt, project context, and current canvas state.
- Execution: durable background task via the internal PostgreSQL-backed AI task runner.
- Output: structured node and edge updates written into the shared Liveblocks room.

### Spec Generation

- Input: current canvas graph and project context.
- Execution: durable background task via the internal PostgreSQL-backed AI task runner.
- Output: Markdown technical spec saved to Vercel Blob and linked to the project in the database.

## Invariants

1. Request handlers do not run long-lived AI work — that belongs in background tasks.
2. Metadata and large generated artifacts are stored in separate layers.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema must remain consistent between user-created content and imported templates.
6. AI workers lease queued tasks from PostgreSQL before execution; API routes only enqueue tasks after auth and project access checks.
