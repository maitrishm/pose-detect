## Copilot Project Instructions — pose-detect (BJJ Tracker MVP)

Source of truth: `PRD.md` (reflects updated Next.js + serverless deployment). Keep these instructions concise and current; update when architecture shifts.

1. Purpose & Privacy

   - On-device pose detection/classification (MediaPipe Pose Landmarker primary; TF.js MoveNet fallback). Never upload video/audio or per-frame landmarks. Only session meta + derived aggregates go to backend.

2. Stack Overview

   - Frontend (current PRD): Next.js 14 (App Router) + React 18 + TypeScript; Zustand state; Zod validation; Tailwind or CSS Modules; dynamic imports (`ssr:false`) for any camera/pose logic.
   - Backend: Node + Express (serverless function on Netlify) + MongoDB Atlas; JWT auth; Resend for email (verification/rate limit). Earlier CRA notes are legacy—prefer Next.js setup now.
   - Storage split: IndexedDB (raw local events & timelines); MongoDB (auth, session meta, aggregates). LocalStorage only for lightweight UI prefs (overlay toggle, last camera, etc.).

3. Core Client Contracts (DO NOT BREAK)

   - PoseEngine: `init(videoEl)`, `start()`, `stop()`, `onResults(cb)`, `setRunningMode('video'|'image')`, `dispose()`; run in client component; default `numPoses=2` degrade to 1 if FPS <16.
   - IdentityTracking: Hungarian matching; allow ~300–500 ms dropout; optional calibration gesture (“raise right hand”) to pin primary user.
   - PositionClassification (partner): Labels Mount, Side, Back, Knee-on-Belly, North-South, Guard, Turtle, Scramble. Apply hysteresis (2–3 frames) + min dwell (200–400 ms) before emitting change.
   - SoloDrillDetection: per-drill `detectPhase` + `repCompleted` using thresholds JSON; track left/right symmetry.
   - SessionEngine: emits events (`position_change`, `solo_rep`, manual attempt tags, `note`) and 1 Hz smoothed KPIs.
   - VoiceCueEngine: queued Web Speech TTS; modes Basic/Technical/Motivational/Silent; flush queue on Stop.

4. KPIs & Persistence

   - Partner KPIs: per-position time %, transitions & efficiency, guard retention %, scramble win %, attempts vs success, intensity metrics.
   - Solo KPIs: reps, best 30s tempo, symmetry, ROM, fatigue curve.
   - Only aggregates + session meta saved remotely; raw timeline stays IndexedDB (downsample for recap rendering if needed).

5. Routing & Gating

   - Routes: `/` (Landing), `/home`, `/drill?mode=partner|solo`, `/account`. Auth required for all but `/`. (If email verification enforced, unverified -> `/verify`).
   - Middleware (optional) may redirect unauthenticated; still keep client guard.

6. Performance Requirements

   - Target ≥20 FPS @720p; never let sustained FPS drop below 16 (auto-reduce resolution or `numPoses`). Median classification latency <150 ms. Provide (hideable) FPS meter.
   - Dispose/detach models & tensors on route leave / engine switch to avoid leaks.

7. Data & Security

   - Env vars (representative): `MONGO_URI`, `JWT_SECRET`, `SIGNUP_CAP`, `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_API_BASE_URL`, `EMAIL_VERIFICATION_*`.
   - Store only hashed email verification tokens (sha256 + TTL). JWT on all non-auth endpoints.

8. Conventions

   - Config JSON (tips/drills/phrases) keyed by `(label+role)` plus `focusAreas[]`, `trainingGoals[]` filters. Do NOT encode business logic in components—keep detection thresholds/data-driven.
   - Use Zod both client & server for shared validation (avoid silent divergence).
   - Engine / feature math: isolate pure functions (facilitates unit tests & WebWorker offload later).

9. Testing Priorities

   - Unit: geometry/feature extraction, classifier scoring & hysteresis, KPI calculators, rep detection logic.
   - Integration: engine init/dispose, identity tracking stability under dropout, voice queue throttling, camera switching & overlay toggle.
   - E2E: signup/login → drill start → events → recap save → account aggregates update flow.

10. Common Pitfalls / Gotchas

    - Do not access `window`/`document` in server components; wrap pose/camera modules in dynamic client-only imports.
    - Always queue TTS (no overlapping `speak()`); flush on Stop & unmount.
    - Apply classification hysteresis & dwell or KPI transition counts inflate.
    - Never send raw landmarks to backend (even for debugging); log locally only.
    - Keep stable PoseEngine interface—other modules depend on it (breaking change requires updating this file + PRD sections 5 & 10).

11. Change Policy

    - If implementation diverges from this doc vs `PRD.md`, align with `PRD.md`. Update both `PRD.md` and this file in the same PR when altering core contracts or data surfaces.

12. Minimum Add Task Checklist (for new feature)
    - Confirm privacy (no new raw frames/landmarks leaving device).
    - Ensure performance (measure FPS diff in dev HUD).
    - Add/update Zod schemas & types at boundary.
    - Provide test coverage for new math/logic.
    - Update tips/drills JSON if new labels or drills introduced.

Questions or ambiguity: prefer explicit clarification via updating `PRD.md` before large refactors.
