# CollabDocs

A real-time, Google Docs-style collaborative editor built with CRDTs — multiple people can edit the same document simultaneously with conflict-free sync, live cursors, and offline support.

**Live demo:** [your-vercel-url]
**Tech stack:** Next.js · TipTap · Yjs · WebSockets · Node.js · PostgreSQL · Clerk

---

## What it does

- Real-time collaborative text editing — multiple users, same doc, no conflicts
- Live presence — colored cursors, selection highlighting, active-user pills
- Offline-safe — edits made offline queue locally and auto-sync on reconnect
- Persistent storage — documents survive server restarts (Postgres-backed)
- Authenticated — sign in via Clerk (email, Google, or GitHub)
- Rich text — bold, italic, headings, lists, quotes, code blocks

## Architecture
┌─────────────────┐ WebSocket ┌──────────────────┐
│ Next.js App │ ◄─────────────────────────► │ Node.js Sync │
│ (Vercel) │ (Yjs protocol) │ Server (Render) │
│ │ │ │
│ - TipTap Editor │ │ - y-websocket │
│ - Clerk Auth │ │ - Awareness │
│ - y-indexeddb │ │ (presence) │
│ (offline) │ └─────────┬──────────┘
└──────────────────┘ │
▼
┌──────────────────┐
│ PostgreSQL │
│ (Supabase) │
│ - Document state │
│ (Yjs binary) │
└──────────────────┘

**Why this architecture:** the frontend and sync engine are fully decoupled — the Next.js app never talks to the database directly. All real-time state lives in the sync-server, which is the single source of truth for conflict resolution (via Yjs CRDTs) and persistence. This mirrors how production collaborative tools (Figma, Notion) separate their edge/client layer from their real-time backend.

## How conflict-free sync works

Every edit is represented as a CRDT (Conflict-free Replicated Data Type) operation via [Yjs](https://github.com/yjs/yjs). Instead of locking or diffing full documents, each client applies operations that are mathematically guaranteed to converge to the same final state regardless of the order they're received in — this is what makes simultaneous multi-user editing possible without a central "who wins" arbiter.

## Known limitations (and what I'd add next)

- **Sync-server currently trusts any valid document ID** — a production version would verify a signed token per WebSocket connection, not just gate the frontend route
- **Single sync-server instance** — real horizontal scale would need shared awareness state (e.g. via Redis pub/sub) across multiple instances
- **No per-team document scoping yet** — Clerk Organizations is enabled but documents aren't yet scoped to a team/workspace
- **Free-tier hosting** — Render's free tier sleeps after 15 min idle (expect a ~30-50s cold start on first load)

## Local setup

```bash
# Frontend
cd frontend
npm install
npm run dev

# Sync server
cd sync-server
npm install
npm run dev
```

Requires `.env.local` (frontend) and `.env` (sync-server) with Clerk and Postgres credentials — see `.env.example` in each folder.