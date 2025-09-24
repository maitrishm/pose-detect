# Contributing

## Prerequisites

- Node 18 (`nvm use` loads from `.nvmrc`)
- npm 9+

## Getting Started

```bash
npm install
npm run dev:client
npm run dev:server
```

## Branching

- `main`: stable
- Feature branches: `feat/<name>`; use conventional commits

## Commit Hooks

- Husky runs lint, type check (fast), and prettier via lint-staged.

## Testing

```bash
npm test          # runs workspace tests
```

Add tests for: geometry math, classification logic, KPI calculators, session engine behaviors.

## Pull Requests

- Reference PRD section if altering core contracts.
- Update `.github/copilot-instructions.md` & `PRD.md` together when changing PoseEngine or data boundaries.

## Code Style

- ESLint + Prettier enforced; no unused exports; prefer pure functions for math.

## Environment Vars (dev examples)

Create `.env.local` in `client`, `.env` in `server`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
MONGO_URI=mongodb://localhost:27017/bjj
JWT_SECRET=devsecret
```

## Privacy / Security

- Never log raw landmarks outside local dev console.
- Do not add endpoints returning per-frame data.
