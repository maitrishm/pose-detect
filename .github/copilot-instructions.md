# Copilot project instructions — pose-detect (BJJ Tracker MVP)

Purpose
- Build a MERN web app that runs BJJ pose detection/classification entirely in-browser; only session metadata and aggregate KPIs are stored remotely. PRD is authoritative: see `PRD.md`.

Architecture (big picture)
- Frontend: React + TypeScript SPA (CRA/Webpack; no Vite). State: Zustand. Validation: Zod. Styling: Tailwind or CSS Modules. Inference on-device: MediaPipe Pose Landmarker (primary), TF.js MoveNet (fallback).
- Backend: Node + Express + MongoDB (Atlas). JWT auth. Email via Resend. Stores users, sessions (meta+config), aggregates only. No video/audio or per-frame data to server.
- Storage split: IndexedDB for raw events/timelines; MongoDB for aggregates/auth. Privacy-first.

Core modules and contracts (client)
- PoseEngine interface (keep stable): `init(videoEl)`, `start()`, `stop()`, `onResults(cb)`, `setRunningMode('video'|'image')`, `dispose()`; VIDEO mode, `numPoses=2`, degrade to 1 if slow.
- IdentityTracking (2 people): Hungarian matching; short dropout tolerance; optional user calibration (“raise right hand”).
- PositionClassification (Partner): labels Mount/Side/Back/KOB/NS/Guard/Turtle/Scramble; hysteresis 2–3 frames; min dwell 200–400 ms.
- SoloDrillDetection: per-drill `detectPhase` + `repCompleted`; thresholds in JSON; track left/right.
- SessionEngine: Start/Pause/Stop; round/rest; emits `position_change`, manual attempt tags, `solo_rep`, `note`. Live KPIs every 1s with smoothing.
- VoiceCueEngine: Web Speech API TTS; modes Basic/Technical/Motivational/Silent; throttled queue; obey per-session Goals/Focus.

Backend surface (highlights)
- Auth: `POST /auth/signup`, `/auth/login`, `/auth/verify {token}`, `/auth/resend-verify` (rate limit 3/day). Verification required in prod; only verified users count toward `SIGNUP_CAP`.
- Data: Sessions CRUD (meta+config) and Aggregates CRUD (per-session KPIs/charts). No raw per-frame endpoint in MVP.
- Security: store only verification token hashes (sha256) with TTL; JWT required for non-auth endpoints.

Non‑negotiables
- Privacy: never upload video/audio or per-frame landmarks; only aggregates remotely.
- Performance: target ≥20 FPS at 720p; degrade to keep ≥16 FPS; latency <150 ms median. Provide FPS meter (can be hidden) and auto-resolution tuning.
- Gating: unauthenticated → `/`; unverified users gated to `/verify` for protected routes; Resend flow supported.
- Session Focus: Goals/Focus affect suggestions/voice in-session only; persisted under `session.config` (not account defaults).
- Device vs account: TTS voice selection is device-local; do not store in DB.
- Data retention: remote aggregates retained 3 months (per PRD decisions).

Conventions and routing
- SPA routes: `/` (Landing), `/verify`, `/home`, `/drill?mode=partner|solo`, `/account`. Redirect unauthenticated to `/`; redirect unverified to `/verify`.
- Libraries: Zustand for state, Zod for schemas, Day.js for dates. CRA/Webpack expected (avoid Vite).
- Config data: Tips/Drills as JSON keyed by `(label+role)` with tags `focusAreas[]` and `trainingGoals[]`; thresholds and phrases are data-driven.

Developer workflows (once scaffolding exists)
- Client/server scripts: use CRA/Webpack and ts-node/nodemon; confirm exact commands from `package.json`.
- Required env vars: `MONGO_URI`, `JWT_SECRET`, `SIGNUP_CAP`, `RESEND_API_KEY`, `EMAIL_FROM`, `APP_BASE_URL`, `EMAIL_VERIFICATION_TTL_HOURS`, `EMAIL_VERIFICATION_REQUIRED`.
- Tests focus: feature math (angles/EMA), classifiers, KPI calculators; E2E for auth → verify → drill → recap → account flows.

PRD anchors to reference
- Sections 5 & 10 for PoseEngine contracts, smoothing, thresholds; Sections 8 & 9 for data models and API contracts; KPI definitions under “KPIs and Recap”.

Gotchas
- Queue voice cues to avoid overlap; flush on Stop. Apply hysteresis to reduce label ping‑pong and false transition counts. Downsample recap timeline; keep IndexedDB as the source of raw local events.

Change policy
- If code diverges from this doc, prefer `PRD.md` and current code. Update this file alongside structural changes.