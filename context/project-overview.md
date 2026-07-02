# Arc Forge AI

## Overview

Arc Forge v1 is a semantic architect and instruction generator, not an app builder. Users capture application architecture intent on a shared React Flow canvas; the product normalizes that graph into semantic canvas data and prepares a canonical Design IR foundation for later implementation instructions, prompt packs, technical specs, API contracts, and checklists for external coding agents.

## Goals

1. Let authenticated users create and manage architecture projects.
2. Provide a collaborative real-time semantic canvas for system design.
3. Let users import prebuilt starter system designs into the canvas.
4. Let AI generate an initial architecture from a natural language prompt.
5. Let collaborators refine the generated architecture and attach semantic metadata.
6. Convert the final graph into durable architecture artifacts such as Markdown technical specs, with Design IR prepared for future instruction generation.

## Core User Flow

1. User signs in.
2. User creates or selects a project.
3. User enters the project workspace.
4. User optionally imports a starter system design template into the canvas.
5. User prompts the AI to generate or extend the system design.
6. AI generates nodes and edges in the shared canvas.
7. Collaborators edit, classify, and refine the design.
8. User triggers spec generation.
9. App persists the generated Markdown spec.
10. User reviews or downloads the spec.

## Features

### Authentication and Projects

- User sign-in and route protection.
- My Account, email verification, forgot password, reset password, and logged-in password change flows.
- Provider-backed account email delivery with local console delivery and production SMTP support.
- Project creation, ownership, and collaborator access.
- Project list and workspace navigation.

### Collaborative Canvas

- Shared real-time canvas using the internal WebSocket collaboration engine and React Flow.
- Internal realtime provides authenticated room tokens, presence, chat/status events, and canvas synchronization.
- Live cursors, presence indicators, and node/edge editing.
- Semantic node and edge metadata with validation warnings for unclassified or incomplete technical meaning.
- Semantic templates for service, database, worker, and auth-module nodes.
- CanvasDoc v1 and Design IR v1 type foundations for future compiler and prompt-pack work.
- Canvas snapshots persisted through the configured artifact storage provider.

### Starter System Designs

- A curated library of prebuilt system design templates.
- Users can import a starter template into the canvas at any point during editing.
- Templates are static canvas snapshots loaded directly into the active room.
- Covers common patterns: monolith, microservices, event-driven, serverless, and more.

### AI Architecture Generation

- AI generates a system design from a user-supplied prompt through the configured AI provider.
- Local development uses a deterministic mock AI provider by default; Google Gemini and OpenAI-compatible providers can be selected with server-side environment variables.
- Output is structured as canvas nodes and edges persisted to canvas storage and published through the internal realtime room.
- Generation runs as a durable PostgreSQL-backed background task.

### Spec Generation

- The current canvas graph is converted into a Markdown technical specification through the configured AI provider.
- Specs are persisted through the configured artifact storage provider and linked to the project in the database.
- Users can view and download generated specs.

## Scope

### In Scope

- Authentication and route protection
- Account verification and password recovery
- Project creation and ownership
- Collaborator access by project
- Starter system design template library and import
- Real-time shared canvas with nodes, edges, and presence
- Internal realtime room/presence/event runtime for collaborative canvas state
- AI-powered architecture generation from prompts
- AI-powered Markdown spec generation from the canvas graph
- Persistent storage for project metadata and generated artifacts
- Spec download

### Out Of Scope

- Billing and subscription systems
- Enterprise permission tiers beyond owner and collaborator
- Versioned spec history and review workflows
- Advanced artifact retention/versioning policies
- Mobile-native applications
- In-app code generation, repository write-back, branch automation, pull request automation, sandbox execution, and autonomous app building

## Success Criteria

1. A signed-in user can create and open a project.
2. Multiple users can collaborate in the same canvas simultaneously.
3. A user can import a prebuilt starter design into the canvas.
4. AI can generate an architecture into the shared room from a prompt.
5. The graph can be converted into a persisted Markdown spec.
6. Project metadata and generated artifacts are stored in the correct layers.
7. Internal realtime room access is authenticated before any custom realtime connection is accepted.
8. Users can verify their email and recover or change passwords without an external auth provider.
