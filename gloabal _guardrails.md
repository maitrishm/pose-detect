# Global guardrails

- Implement “BJJ Tracker” per the PRD provided (Next.js frontend). Tech: MERN only. Next.js 14 (App Router) + React 18 + TypeScript. Node 18 + Express + TypeScript. MongoDB Atlas + Mongoose. Zustand, Zod, Day.js, Tailwind or CSS Modules. No Vite.
- Inference 100% in-browser: MediaPipe Tasks Pose Landmarker (primary), TF.js MoveNet MultiPose (fallback). Never upload video/audio frames. Only store users (name, email, password hash), sessions meta+config, and per-session aggregates in MongoDB. Per-frame events live only in IndexedDB.
- Deploy backend as Netlify Functions (serverless-http wrapping Express). Route /api/\* to a single function. Frontend on Netlify with @netlify/plugin-nextjs.
- Performance targets: ≥20 FPS (graceful degrade to ≥16) at 720p. Auto-resolution tuning. Hysteresis, confidence gating, Unknown/Scramble fallback. Identity tracking for two people.
- Mobile web: front/back camera toggle. Skeleton overlay toggle must not affect tracking.
- Tests: Jest for unit/integration (next/jest), mongodb-memory-server, Supertest; Playwright for E2E. GitHub Actions CI must run lint, tests, builds. Fail fast on missing env vars.
- Next.js specifics: camera/pose/TF.js code runs only in client components ("use client") or dynamically imported with ssr:false. No Next.js API routes; all backend is Express under /api/\*.
