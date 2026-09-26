# NexCode — Frontend

A LeetCode-style coding platform frontend built with **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS 4**, and **shadcn/ui** (base-nova style, dark theme). Users browse problems, solve them in a Monaco editor, and get live judge verdicts over a WebSocket.

## Backend flow

```
Browser → POST /submission (backend)
        → JOBS_QUEUE (redis) → Worker judges (sandboxed) → COMPLETED_QUEUE
        → Backend updates DB + publishes submission_results
        → WS server → Browser (live verdict)
```

The solve page opens the WebSocket on load (always-on, CEX-style), POSTs on Run/Submit, shows `Processing`, then renders `Success` / `Failure` / `TLE` with the failing test case.

## Getting started

```bash
bun install
bun run dev
```

Open http://localhost:3001.

## Environment

Configured in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:8081/ws
```

## Scripts

- `bun run dev` — start the dev server
- `bun run build` — production build
- `bun run start` — serve the production build
- `bun run lint` — run ESLint

## Structure

- `app/` — routes (`/`, `/problems`, `/problems/[slug]`, `/submissions`)
- `components/` — UI (`solve-view`, `problems-table`, `site-header`, …) and `components/ui` primitives
- `lib/` — `api` (backend client), `problems` (dataset), `config`, `user`, `utils`
- `hooks/` — `use-submission-socket` (live judge connection)
