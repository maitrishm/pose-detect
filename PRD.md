# PRD — BJJ Tracker (MERN, Next.js Frontend, In‑Browser Inference)

Owner: You
Audience: Random users; up to 50 registered accounts
Platform: Web (desktop/laptop/mobile: Chrome/Edge/Safari with webcam; mobile web with camera switch)
Inference: 100% in-browser (MediaPipe Tasks Pose Landmarker primary; TF.js MoveNet MultiPose fallback)
Scope: 4 routes (Landing, Home, Drill, Account), Partner and Solo modes
Storage policy: only session meta + per-session report metrics values and user auth info stored in MongoDB; no video/audio, no per-frame events

Tech stack updates (frontend)

- Frontend: Next.js 14 (App Router) + React 18 + TypeScript
- State: Zustand; Validation: Zod; Date: Day.js; Styles: Tailwind CSS or CSS Modules
- No Vite. Use next/dynamic for client-only modules. Heavy camera/pose code runs in client components with "use client" and dynamic imports (ssr: false).
- Backend unchanged: Node 18 + Express + TypeScript on Netlify Functions (serverless-http). Route /api/\* to a single function. Frontend and functions both deployed on Netlify.
- API base URL: same-origin /api when deployed; during local dev use env NEXT_PUBLIC_API_BASE_URL.

# 1. Problem, Vision, Goals

Problem

- BJJ athletes rarely get real-time, objective feedback during drills/rolling.
- Existing tools require wearables, manual notes, or post-video analysis.

Vision

- A web app that watches your drill via webcam, recognizes positions, speaks coaching cues, and shows clear metrics immediately after — all on-device.

MVP Goals

- Run pose detection and classification entirely in-browser (no uploads).
- Provide live KPIs and voice cues during a session.
- Deliver a clean account page with session history and all-time summary.
- Support Solo Mode with rep counting and tips.
- Support up to 50 users with login, signup, and basic profile management.
- Perfect recognition during scrambles; technique-level detection (specific passes/submissions).

Out of Scope (MVP)

- Native mobile apps or multi-camera capture.

# 2. Users, Personas, Success Metrics

Users

- Practitioner: drills alone or with a partner; wants feedback and simple progress stats.
- Coach (light): reviews a student’s session summaries.

Product success metrics (pilot)

- ≥70% perceived accuracy on core positions in staged drills.
- ≥20 FPS on mid-range laptops at 720p.
- ≥80% successful session saves without recovery issues.
- ≥60% of users complete at least 3 sessions in two weeks.
- <10% users report voice-cue “spam” (post-tuning).

# 3. Information Architecture and Navigation

Routes (Next.js pages)

- / (Landing: login/signup)
- /home (Home: start)
- /drill (Drill: live tracking UI)
- /account (Account: Summary, Session History with inline session reports, Edit)

Navigation rules

- Unauthenticated users are gated to / (Landing).
- After login/signup → /home.
- Top nav: Home, Drill, Account (only when authenticated).
- Direct links to /drill and /account redirect to / if unauthenticated.

Next.js specifics

- Use App Router with client components for interactive pages; server components allowed for static shells.
- Optional edge middleware can redirect unauthenticated requests to / for SSR-friendly UX; client-side guard still required.

# 4. Page Specifications and UX Flows

Landing (/)

- Tabs: Login, Signup
- Login: email, password; Forgot Password link
- Signup: name, email, password; checkbox to accept ToS/Privacy
- “Beta full” state when user cap reached; show sorry we can’t onboard you now
- Privacy note: “All analysis stays on your device. We never upload video.”
- Validation and UX: email format; password min 8; errors for invalid creds, cap reached, email in use; server rate limiting
- Acceptance: successful login/signup routes to /home; user cap blocks signup; waitlist stored

Home (/home)

- One large “Start Drill” button
- On click → modal with two options: Partner Drill → /drill?mode=partner; Solo Drill → /drill?mode=solo
- Modal is keyboard accessible
- Acceptance: mode selection via query param; modal accessible

Drill (/drill)

- Mode from query param (partner|solo)
- Pre-session: camera tile with “Click to enable camera”; after click → getUserMedia; on success → start pose engine
- Controls: Start, Pause, Stop; round/rest config; voice settings
- Camera options:
  - Desktop: device dropdown (enumerateDevices)
  - Mobile: toggle Front/Rear via facingMode; fallback to deviceId
- Skeleton overlay toggle; tracking continues when hidden
- Session Focus panel (per-session only): Training Goals + Focus Areas multi-select (Select All)
- During session: video with Canvas overlay; labels (Partner: Position+Role+Confidence; Solo: Drill+Phase); suggestion panel; manual tags; TTS voice cues
- Live KPIs (1 Hz, smoothed): Partner and Solo sets per PRD
- Recap: modal with KPIs and charts; Save & Continue / Save & Exit / Discard
- Camera/SSR note: this page uses client components and dynamic imports (ssr: false) for camera/pose modules to avoid SSR window/document errors.
- Acceptance: ≥20 FPS target (≥16 min); overlay stable; latency <150 ms; voice cues queued; Goals/Focus affect Drill only and are saved in session.config

Account (/account)

- Account Summary (all sessions): totals, partner/solo aggregates, consistency sparkline; export summary (CSV/JSON)
- Session History: table with inline “View” recap; export per-session; rename; delete
- Edit (Profile & Preferences): profile; preferences (engine, voice, theme, UI scale, units); data management (export all, clear local data, delete account)
- Acceptance: validations; edits persist; deleting session updates totals instantly; delete account purges remote and local data

# 5. Functional Requirements by Module

Pose Engines

- Interface: init(videoEl), start(), stop(), onResults(cb), setRunningMode('video'|'image'), dispose()
- Primary: MediaPipe Tasks Vision Pose Landmarker (VIDEO mode), target numPoses=2; fallback to 1 pose if slow
- Fallback: TF.js MoveNet MultiPose with WebGL/WebGPU; selectable in Preferences
- Assets: place WASM and model assets under /public/mediapipe; load via absolute paths (e.g., /mediapipe/wasm, /mediapipe/pose_landmarker_lite.task). Do not import .task via bundler.
- FPS meter overlay (hidden by default)

Feature Extraction (per frame)

- Per person: shoulderWidth, hipWidth, torsoLength; shoulderAngle, hipAngle, torso axis; headHeight; center of mass; EMA velocity
- Cross-person: distances knee/ankle/foot to opponent hip/torso; torso alignment; head direction alignment; IoU
- Normalization: by opponent shoulderWidth; clamp extremes

Identity Tracking

- Stable IDs for two people via Hungarian matching on bbox center, size, torso anchor; user calibration (“raise right hand”) to lock “you”; dropout tolerance 300–500 ms

Position Classification (Partner)

- Labels: Mount, Side Control, Back Control, Knee-on-Belly, North-South, Guard, Turtle, Scramble/Unknown
- Role: Top/Bottom when applicable
- Weighted rule scores; confidence = max − next; low-confidence → Scramble/Unknown
- Smoothing: hysteresis (2–3 frames) + min dwell (200–400 ms)

Solo Drill Detection

- Drills: shrimp/hip escape, bridge/upa, technical stand-up, sprawl, sit-out, penetration step
- detectPhase and repCompleted; thresholds from JSON; L/R symmetry where applicable

Suggestion Engine

- Tips JSON keyed by (label + role), tagged by focusAreas[] and trainingGoals[]
- getSuggestions filters by per-session Goals/Focus; Drill page only

Voice Cues

- Web Speech API TTS; modes (Basic/Technical/Motivational/Silent); frequency (Smart/30s/On Change/End); styles; queue to avoid overlap; flush on Stop

Session Engine

- Start/Pause/Stop; round/rest config; local-only events (IndexedDB): position_change, manual attempts (sub/escape/sweep), solo_rep, note
- Per-session Goals/Focus stored in session.config

KPIs and Recap (client-side)

- Partner: control time %, per-position time, transitions, transition efficiency, guard retention %, scramble win % (beta), attempts/success %, error counts, reaction speed, intensity, session consistency
- Solo: reps, best 30s tempo, ROM, symmetry, fatigue curve
- Save only aggregates (no per-frame data) to Mongo

Storage and Persistence

- Local: IndexedDB for events/timelines and temp queue; localStorage for UI toggles (overlay, last camera)
- Remote: Node/Express + MongoDB Atlas + JWT
- Remote stores only: users (name, email, password hash), sessions (meta+config), aggregates (per-session KPIs)
- Privacy: No video/audio frames stored or transmitted

# 6. Non-Functional Requirements

Performance

- ≥20 FPS at 720p (degrade to ≥16); pose + classification latency <150 ms; no tensor leaks (dispose)

Reliability & Offline

- Allow local sessions offline; queue sync of aggregates
- Auth-required routes gated; Landing always online
- Local write-through; remote sync best-effort

Security & Privacy

- TLS for all API calls
- JWT auth (Authorization: Bearer); passwords via bcrypt (12 rounds)
- Rate limiting, IP throttling, basic audit logs
- PII minimal; no video/audio uploaded
- Data retention (remote): 12 months default; user can delete

Accessibility

- Keyboard navigable; visible focus rings
- WCAG AA contrast; large targets
- Live KPI region non-announcing

Compatibility

- Desktop: Chrome/Edge latest; Safari 16.4+
- Mobile web (beta): iOS Safari 16.4+ and Android Chrome (front/rear toggle)
- WebGL2 required; WebGPU optional
- Camera: 720p recommended; 1080p supported if FPS holds

Next.js SSR/CSR specifics

- Camera, pose, and TF.js code must run in client components only (“use client”); load engines via next/dynamic({ ssr: false }).
- Avoid accessing window/document in server components.

# 7. System Architecture

Frontend (Next.js)

- Next.js 14 (App Router) + React 18 + TypeScript
- State: Zustand; Validation: Zod; Date: Day.js; Styles: Tailwind or CSS Modules
- Modules: CameraFeed, CanvasOverlay, PoseEngines, FeatureExtractor, PositionEngine, SuggestionEngine, VoiceCueEngine, SessionEngine, KPI calculators, Storage, Auth (client)
- API client: fetch/axios wrapper with base URL NEXT_PUBLIC_API_BASE_URL; attaches Authorization header when present
- Middleware (optional): redirect unauthenticated users to / for /home, /drill, /account

Backend (MERN)

- Node.js (TypeScript), Express, MongoDB Atlas (Mongoose), JWT, Zod validation, CORS, rate limiting
- Services:
  - Auth: signup/login/change-password, forgot/reset (optional)
  - User settings (non-sensitive UI prefs)
  - Sessions (meta+config) CRUD
  - Aggregates (per-session KPIs) CRUD
  - Signup cap enforcement and waitlist

# 8. Data Model

Unchanged from prior PRD. Users, sessions, aggregates, waitlist as specified; indexes for users.email (unique), sessions.userId+start, aggregates.sessionId (unique).

# 9. API Contracts (high level)

Unchanged endpoints and semantics. Base path /api/\* served by Netlify Function (Express). Next.js does not expose overlapping /api routes in MVP.

Auth

- POST /auth/signup → 201
- POST /auth/login → 200 {user, token}
- POST /auth/change-password → 204
- Optional forgot/reset

User

- GET /me; PUT /me
- GET /settings; PUT /settings

Data

- GET/POST/PUT/DELETE /sessions
- GET/POST/PUT /aggregates

Waitlist

- POST /waitlist

Security and Limits

- JWT required; rate limits; strict CORS to Next site origin

# 10. Algorithms, Heuristics, and Metrics

Unchanged: normalization, EMA velocity, IoU, classification scoring and smoothing, solo rep logic, derived metrics.

# 11. Content Requirements

Unchanged: suggestions.json, solo_drills.json, voice phrases, onboarding/help copy.

# 12. UI Specifications (key components)

- Camera tile: idle/requesting/live/error; device dropdown (desktop); front/rear toggle (mobile)
- Overlay toggle; debug labels optional
- Session Focus panel: Training Goals + Focus Areas (Select All)
- Live KPIs strip: responsive, 1 Hz updates
- Session History inline view: accessible expand/collapse
- Edit forms: inline validation; save/toasts

Next.js notes

- Use next/link for navigation; next/head (or metadata) for titles
- Client components where interactivity and browser APIs are needed
- Dynamic import ssr: false for pose engines and camera modules

# 13. Accessibility and Localization

Unchanged: WCAG AA, keyboard navigation, labeled controls, limited live regions, English-only MVP.

# 14. Testing and QA Plan

Unit tests (Jest)

- Use next/jest config
- Feature math, classifier scoring, KPI calculators

Integration tests

- Pose engine init/dispose (mocked), FPS meter, engine switch
- Voice engine queue/throttle
- Camera switching; overlay toggle

E2E tests (Playwright)

- Auth: signup/login/logout; cap enforcement; waitlist
- Flow: Landing → Home → Drill → Enable camera → Start/Pause/Stop → Recap → Save → Account Summary update → Session History inline View
- Drill options: Goals/Focus; saved in session.config; affect suggestions/voice only in session
- Account Edit: profile updates; preferences persist; delete session; export JSON/CSV

Manual scenarios

- Occlusions/scrambles; poor lighting; switching 1↔2 persons; camera disconnect; denied permissions and recovery
- Mobile: front↔rear toggle; permission prompts; orientation changes

Performance validation

- ≥20 FPS at 720p; downscale path verified
- Memory growth stable during 20-minute session

# 15. Acceptance Criteria (Definition of Done)

Unchanged functionally; plus:

- Drill page camera/pose code runs client-side only with Next.js; no SSR errors
- /api/\* requests go to Express Netlify Function; no Next.js API routes shipping in MVP

# 16. Rollout, Scale, and Operations

Scale and rollout unchanged.

Monitoring

- Client perf HUD (FPS, dropped frames, engine used)
- Server logs: auth attempts, API latencies, rate-limit triggers
- Error reporting: client (no PII/frames), server (structured logs)

# 17. Risks and Mitigations

Unchanged; add:

- SSR/CSR mismatch: ensure all browser APIs live in client components; use dynamic imports with ssr:false.

# 18. Implementation Plan (6 weeks)

- W1: MERN scaffold; Next.js app shell; Auth (Landing), Home; 50-user cap + waitlist; client state, routing
- W2: MediaPipe engine (2 persons), MoveNet fallback; FPS meter; Camera tile UX; camera selector; overlay toggle
- W3: Feature extraction + partner classifier; Identity tracker; Suggestion engine; Voice engine
- W4: Session engine; live KPIs; Recap modal; Solo drill detection + KPIs
- W5: Account Summary; Session History inline report; Edit (profile/preferences); exports; store only sessions+aggregates remotely
- W6: Tests (unit/integration/E2E), perf tuning, deploy, beta onboarding

# 19. Open Questions

Unchanged; plus:

- Use Next.js middleware for auth gating or rely on client-only guard? (Recommend middleware + client guard for best UX.)

# 20. Appendix: Copy and Error States

Unchanged text for privacy/camera denied/cap reached, validation rules, server error codes.

Deployment notes for Next.js on Netlify

- Use @netlify/plugin-nextjs for the frontend.
- Keep Express API as a separate Netlify function; in netlify.toml, route /api/\* to function "api" (serverless-http wrapping Express). Ensure this route takes precedence over Next’s routes.
- Set env vars in Netlify: MONGO_URI, JWT_SECRET, RATE_LIMIT, SIGNUP_CAP=50, CLIENT_ORIGIN (Next site origin), NEXT_PUBLIC_API_BASE_URL (same-origin or API URL).
- Place MediaPipe WASM and .task files under public/mediapipe and reference via absolute paths.
