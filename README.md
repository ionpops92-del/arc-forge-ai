<div align="center">
  <br />
    <a href="https://youtu.be/14RP8liACqo" target="_blank">
      <img src="public/readme/readme-hero.webp" alt="Project Banner">
    </a>
  <br />

  <div>

<img src="https://img.shields.io/badge/-Next.js-black?style=for-the-badge&logo=nextdotjs&logoColor=white" />
<img src="https://img.shields.io/badge/-Typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/-Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/-shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white" /><br/>

<img src="https://img.shields.io/badge/-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
<img src="https://img.shields.io/badge/-PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
<img src="https://img.shields.io/badge/-Internal_Auth-0f766e?style=for-the-badge&logo=nextdotjs&logoColor=white" /><br/>

<img src="https://img.shields.io/badge/-Internal_AI_Tasks-22c55e?style=for-the-badge&logo=postgresql&logoColor=white" />
<img src="https://img.shields.io/badge/-Internal_Realtime-0891b2?style=for-the-badge&logo=websocket&logoColor=white" />
<img src="https://img.shields.io/badge/-CodeRabbit-orange?style=for-the-badge&logo=coderabbit&logoColor=white" />

  </div>

  <h3 align="center">AI-Powered Collaborative System Architect</h3>

   <div align="center">
     Build this project step by step with our detailed tutorial on <a href="https://www.youtube.com/watch?v=XUkNR-JfHwo" target="_blank"><b>JavaScript Mastery</b></a> YouTube. Join the JSM family!
    </div>
</div>

## 📋 <a name="table">Table of Contents</a>

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🤸 [Quick Start](#quick-start)
5. 🔗 [Assets](#links)
6. 🚀 [More](#more)

## 🚨 Tutorial

This repository contains the code corresponding to an in-depth tutorial available on our YouTube channel, <a href="https://www.youtube.com/@javascriptmastery/videos" target="_blank"><b>JavaScript Mastery</b></a>.

If you prefer visual learning, this is the perfect resource for you. Follow our tutorial to learn how to build projects like these step-by-step in a beginner-friendly manner!

<a href="https://youtu.be/14RP8liACqo" target="_blank"><img src="https://github.com/sujatagunale/EasyRead/assets/151519281/1736fca5-a031-4854-8c09-bc110e3bc16d" /></a>

## <a name="introduction">✨ Introduction</a>

Arc Forge AI is an agentic planning application built for software teams. A user submits a natural-language prompt (e.g., "Design a scalable e-commerce backend") and a provider-backed AI architect autonomously places nodes and edges onto a shared React Flow canvas in real time. Human teammates can watch the AI build the diagram live, then jump in to collaboratively refine it. Once the team is satisfied, a second AI background task converts the visual graph into a comprehensive, multi-page Markdown technical specification that can be downloaded directly from the app. Local development uses a deterministic mock AI provider by default, while Google Gemini and OpenAI-compatible APIs can be selected through server-side environment variables.

If you're getting started and need assistance or face any bugs, join our active Discord community with over **50k+** members. It's a place where people help each other out.

<a href="https://discord.com/invite/n6EdbFJ" target="_blank"><img src="https://github.com/sujatagunale/EasyRead/assets/151519281/618f4872-1e10-42da-8213-1d69e486d02e" /></a>

## <a name="tech-stack">⚙️ Tech Stack</a>

- **[Next.js](https://nextjs.org/)** is a production-ready React framework that offers server-side rendering, static site generation, and powerful routing features. It streamlines the development of full-stack web applications by providing a comprehensive ecosystem for performance optimization, data fetching, and API development.

- **[React](https://react.dev/)** is a popular JavaScript library for building declarative and component-based user interfaces. It excels at creating reusable UI components and efficient state management, making it the standard choice for building dynamic and interactive single-page applications.

- **[TypeScript](https://www.typescriptlang.org/)** is a strongly typed superset of JavaScript that adds static type definitions to your code. It significantly improves developer productivity and code reliability by catching errors during development, enhancing IDE support, and facilitating maintainability in large-scale projects.

- **Internal Authentication** uses server-verified sessions backed by PostgreSQL. Raw session tokens stay in httpOnly cookies, while only hashed tokens, password hashes, verification tokens, and password reset tokens are stored in the database. My Account, email verification, forgot/reset password, and logged-in password changes run on this internal auth foundation.

- **Internal AI Task Runner** is a PostgreSQL-backed worker system for durable AI jobs. API routes enqueue task runs after auth/project checks, and a separate worker leases queued runs, records attempts/events, handles retries, and executes design/spec handlers.

- **Provider-Agnostic AI Runtime** routes design and spec generation through a server-side provider contract. Local development defaults to `AI_PROVIDER=mock`, Google Gemini remains available with `AI_PROVIDER=google`, and hosted or self-hosted OpenAI-compatible APIs can be used with `AI_PROVIDER=openai_compatible`.

- **Internal Realtime Engine** is a standalone Node/WebSocket service backed by PostgreSQL. It issues short-lived room tokens through authenticated Next.js APIs, verifies room access, tracks ephemeral presence, syncs canvas snapshots, and broadcasts typed chat/status room events. React Flow remains the canvas renderer.

- **[Prisma ORM](https://www.prisma.io/)** is a next-generation ORM for Node.js and TypeScript that simplifies database interactions. By providing a type-safe client generated from your schema, it makes querying your database intuitive, readable, and highly efficient, effectively eliminating common SQL-related runtime errors.

- **[PostgreSQL](https://www.postgresql.org/)** is an advanced, open-source object-relational database system widely recognized for its reliability, extensibility, and standard compliance. It provides the persistent storage layer for your application, supporting complex queries, transactional integrity, and large-scale data handling.

- **Provider-Agnostic Artifact Storage** stores canvas snapshots and generated Markdown specs through a shared storage provider contract. Local development defaults to filesystem storage under `.local-storage`; Vercel Blob can be enabled as an optional external object store.

- **Provider-Agnostic Email Delivery** sends account verification and password reset emails through a small server-side email provider contract. Local development defaults to `EMAIL_PROVIDER=dev_console`; production can use generic SMTP.

- **[Tailwind CSS](https://tailwindcss.com/)** is a utility-first CSS framework that enables rapid custom UI development. By utilizing low-level utility classes directly in your markup, it removes the need to switch between CSS and HTML files, allowing for highly consistent and responsive design systems.

- **[shadcn/ui](https://ui.shadcn.com/)** is a collection of beautifully designed, accessible, and re-usable UI components that you can copy and paste directly into your projects. Built on top of Radix UI and Tailwind CSS, it grants you full control over your component code, avoiding the bloat of traditional component libraries.

- **[CodeRabbit](https://jsm.dev/ghost-coderabbit)** is an AI-powered code review assistant that automates pull request analysis. It provides line-by-line feedback, suggests code improvements, summarizes changes, and helps maintain high code quality by integrating seamlessly into your git-based development workflow.

## <a name="features">🔋 Features</a>

👉 **AI Architecture Agent**: Submit a plain-English prompt; the configured AI provider draws nodes and edges onto the live canvas in real time via the internal AI worker and internal realtime engine. Local mock AI works without external keys.

👉 **Multiplayer Canvas**: Full real-time collaboration powered by the internal WebSocket engine: synchronized node/edge state, live cursor positions, and presence avatars for connected users.

👉 **Internal Realtime Engine**: A dedicated WebSocket service provides authenticated room join, presence update, ping/pong, bounded message validation, canvas sync, chat/status events, and strict HTTPS/WSS fail-closed checks outside local development.

👉 **Custom Canvas Nodes**: Double-click to edit node labels inline; select to resize with NodeResizer; choose from 8 color swatches via a floating NodeToolbar — all synced across clients instantly.

👉 **AI Spec Generation**: One click converts the current graph into a detailed Markdown technical specification using the configured AI provider.

👉 **Multi-Spec Storage**: Each project stores multiple specs. Metadata lives in PostgreSQL (Prisma); Markdown content is stored through the configured artifact storage provider.

👉 **Downloadable Specs**: Every generated spec is available via a dedicated download API route.

👉 **Internal Authentication**: Server-side session checks protect app routes and API routes; realtime room tokens are only issued after project access is verified.

👉 **My Account & Recovery**: Users can verify their email, request password reset links, reset forgotten passwords, and change passwords while signed in.

👉 **Auto-Save Canvas**: The canvas state is debounced-saved through the configured artifact storage provider.

👉 **Project Management**: Create projects from a slide-in sidebar; project slugs auto-generate room IDs; the active room is highlighted.

👉 **Share**: One-click URL copy with a 1.5 s "Copied" confirmation.

And many more, including code architecture and reusability.

## <a name="quick-start">🤸 Quick Start</a>

Follow these steps to set up the project locally on your machine.

**Prerequisites**

Make sure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/) (Node Package Manager)

**Cloning the Repository**

```bash
git clone https://github.com/ionpops92-del/Arc-Forge-AI.git
cd Arc-Forge-AI
```

**Installation**

Install the project dependencies using npm:

```bash
npm install
```

**Set Up Environment Variables**

Create a new file named `.env` in the root of your project and add the following content:

```env
# Optional internal auth settings
AUTH_SESSION_COOKIE_NAME=arc_forge_session

APP_ENV=local
NEXT_PUBLIC_APP_ENV=local
APP_URL=http://localhost:3000
NEXT_PUBLIC_REALTIME_URL=ws://localhost:3001/ws

INTERNAL_REALTIME_TOKEN_SECRET=arc-forge-local-realtime-secret-change-me
INTERNAL_REALTIME_SERVICE_SECRET=arc-forge-local-realtime-service-secret-change-me
INTERNAL_REALTIME_INTERNAL_URL=http://localhost:3001/internal/broadcast

DATABASE_URL=

# Local artifact storage default
STORAGE_PROVIDER=local_fs
LOCAL_STORAGE_ROOT=.local-storage

# Optional: required only when STORAGE_PROVIDER=vercel_blob
BLOB_READ_WRITE_TOKEN=

# Local AI provider default: no external key required
AI_PROVIDER=mock

# Optional: required only when AI_PROVIDER=google
GOOGLE_AI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
GOOGLE_AI_MODEL=gemini-2.5-flash
GOOGLE_AI_SPEC_MODEL=gemini-2.5-flash

# Optional: required only when AI_PROVIDER=openai_compatible
AI_API_KEY=
AI_BASE_URL=
AI_MODEL=
AI_SPEC_MODEL=

# Local email provider default: no external provider required
EMAIL_PROVIDER=dev_console
EMAIL_FROM="Arc Forge AI <no-reply@localhost>"

# Optional: required only when EMAIL_PROVIDER=smtp
# Resend SMTP example:
# EMAIL_PROVIDER=smtp
# EMAIL_FROM="Arc Forge AI <no-reply@your-domain.com>"
# SMTP_HOST=smtp.resend.com
# SMTP_PORT=587
# SMTP_USER=resend
# SMTP_PASSWORD=<RESEND_API_KEY>
# SMTP_SECURE=false
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_SECURE=
```

Replace the placeholder values with your real credentials where required. Local development uses filesystem artifact storage, mock AI, and console email delivery by default, so it does not require `BLOB_READ_WRITE_TOKEN`, `GOOGLE_AI_API_KEY`, OpenAI-compatible credentials, SMTP credentials, or Resend for smoke testing. If you set `STORAGE_PROVIDER=vercel_blob`, add a Vercel Blob token. If you set `AI_PROVIDER=google`, add a key from [**Google AI Studio**](https://aistudio.google.com/). If you set `AI_PROVIDER=openai_compatible`, set `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL`; `AI_SPEC_MODEL` defaults to `AI_MODEL`. If you set `EMAIL_PROVIDER=smtp`, set the SMTP variables; Resend SMTP uses `SMTP_HOST=smtp.resend.com`, `SMTP_USER=resend`, and the Resend API key as `SMTP_PASSWORD` after your sending domain is verified. Use `SMTP_SECURE=false` for port 587 STARTTLS and `SMTP_SECURE=true` for port 465 implicit TLS. Local `http://` and `ws://` URLs are local-only. Browser code uses `NEXT_PUBLIC_APP_ENV=local` to permit localhost WS during local development; staging, preview, and production must use HTTPS and WSS.

**Running the Project**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the project.

For the full local Docker stack, start PostgreSQL, the app, the AI worker, realtime service, and persistent local artifact storage together:

```bash
npm run stack:local:up
```

**Run AI Worker (Background Tasks)**

In a second terminal, start the internal AI worker so queued AI tasks execute locally:

```bash
npm run ai:worker
```

**Run Internal Realtime Server**

In another terminal, start the internal realtime service for room token and WebSocket testing:

```bash
npm run realtime:server
```

## Available Scripts

| Command                   | Description                           |
| ------------------------- | ------------------------------------- |
| `npm run dev`             | Start Next.js development server      |
| `npm run build`           | Build for production                  |
| `npm run start`           | Start production server               |
| `npm run lint`            | Run ESLint                            |
| `npm run ai:worker`       | Run the internal AI worker            |
| `npm run stack:local:up`  | Start local PostgreSQL, app, worker, realtime |
| `npm run worker:local:logs` | Tail local AI worker logs           |
| `npm run realtime:local:logs` | Tail local realtime service logs  |
| `npm run realtime:server` | Run the internal realtime WebSocket server |
| `npm run test:storage`    | Smoke-test the storage provider contract |
| `npm run test:ai-providers` | Smoke-test AI provider selection and mock behavior |
| `npm run prisma:generate` | Regenerate Prisma client              |
| `npm run prisma:migrate`  | Create and apply a new migration      |
| `npm run prisma:deploy`   | Apply pending migrations (production) |
| `npm run prisma:studio`   | Open Prisma Studio GUI                |

---

## Project Structure

```
.
├── app/
│   ├── api/              # Next.js API routes (auth, AI, projects, specs)
│   ├── account/          # My Account page for verification and password changes
│   ├── editor/           # Canvas editor pages
│   ├── forgot-password/  # Password reset request page
│   ├── generated/prisma/ # Auto-generated Prisma client
│   ├── reset-password/   # Password reset confirmation page
│   ├── sign-in/          # Internal sign-in page
│   ├── sign-up/          # Internal sign-up page
│   └── verify-email/     # Email verification confirmation page
├── components/
│   ├── editor/           # Canvas UI components (editor, sidebar, AI chat)
│   └── ui/               # Reusable shadcn/ui primitives
├── docs/                 # Project documentation
├── hooks/                # Custom React hooks (auto-save, keyboard shortcuts)
├── lib/                  # Shared utilities (Prisma client, auth, AI tasks)
│   └── ai-tasks/         # Internal AI task service, handlers, worker loop
│   └── ai/               # AI provider contracts, provider adapters, design/spec helpers
│   └── realtime/         # Internal realtime token, protocol, and server modules
│   └── storage/          # Provider-agnostic artifact storage
│   └── email/            # Provider-agnostic account email delivery
├── prisma/               # Prisma schema and migrations
├── scripts/
│   ├── ai-worker.ts      # Internal AI worker entrypoint
│   └── realtime-server.ts # Internal realtime service entrypoint
└── types/                # Shared TypeScript types
```



## <a name="links">🔗 Assets</a>

Assets and snippets used in the project can be found in the **[video kit](https://jsmastery.com/video-kit/f94dd75a-4d9c-4c7c-af39-6e4668389421)**.

<a href="https://jsmastery.com/video-kit/f94dd75a-4d9c-4c7c-af39-6e4668389421" target="_blank">
  <img src="public/readme/readme-videokit.webp" alt="Video Kit Banner">
</a>

## <a name="more">🚀 More</a>

**Advance your skills with our Pro Courses**

Enjoyed creating this project? Dive deeper into our PRO courses for a richer learning adventure. They're packed with
detailed explanations, cool features, and exercises to boost your skills. Give it a go!

<a href="https://jsm.dev/ghost-jsm" target="_blank">
  <img src="public/readme/readme-jsmpro.webp" alt="Project Banner">
</a>
