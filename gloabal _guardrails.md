Global guardrails 
- Implement the “BJJ Tracker” PRD exactly as provided. Tech: MERN only. React 18 + TypeScript via CRA or Webpack (no Vite). Node 18 + Express + TypeScript. MongoDB Atlas + Mongoose. Zustand, Zod, Day.js, Tailwind or CSS Modules.
- Inference 100% in-browser: MediaPipe Tasks Pose Landmarker (primary), TF.js MoveNet MultiPose (fallback). Never upload video/audio frames. Only store users (name, email, password hash), sessions meta+config, and per-session aggregates in MongoDB. Per-frame events live only in IndexedDB.
- Deploy backend as Netlify Functions (serverless-http wrapping Express). Route /api/* to a single function. Frontend on Netlify too.
- Performance targets: ≥20 FPS (graceful degrade to ≥16) at 720p. Auto-resolution tuning. Hysteresis, confidence gating, Unknown/Scramble fallback. Identity tracking for two people.
- Mobile web: front/back camera toggle. Skeleton overlay toggle should not affect tracking.
- Tests: Jest for unit/integration, mongodb-memory-server, Supertest; Playwright for E2E. GitHub Actions CI must run lint, tests, builds. Fail fast on missing env vars.