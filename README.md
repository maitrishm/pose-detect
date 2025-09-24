# BJJ Tracker Monorepo

Monorepo containing Next.js 14 (App Router) client and Express + TypeScript server for on-device BJJ pose detection.

## Packages

- `client`: Next.js frontend (all inference client-side; dynamic imports for camera/pose engines)
- `server`: Express API (Netlify function target) provides auth + session/aggregate endpoints

## High-Level Principles

- 100% on-device pose & classification (MediaPipe Pose Landmarker primary; TF.js MoveNet fallback)
- Never upload video/audio or per-frame landmarks. Only session meta + derived aggregates persisted remotely.
- IndexedDB stores raw local events/timelines; MongoDB stores auth, session meta, aggregates.

See `PRD.md` and `.github/copilot-instructions.md` for detailed contracts & constraints.

## Dev Quickstart

```bash
npm install
npm run dev:client   # starts Next.js app (client)
npm run dev:server   # starts Express API (server)
```

## Testing

```bash
npm test
```

## Build

```bash
npm run build
```

## Deploy

- Client: Netlify with `@netlify/plugin-nextjs`
- Server: Single Netlify function bundling Express under `/api/*`

## Repository Conventions

- Root TypeScript base config `tsconfig.base.json`
- Workspaces managed via root `package.json` (npm workspaces)
- Husky + lint-staged enforce formatting & lint pre-commit
