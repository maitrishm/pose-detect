# PRD — BJJ Tracker MVP (MERN, In‑Browser Inference)

Owner: You
Audience: Random users; up to 50 registered accounts (hard cap)
Platform: Web (desktop/laptop: Chrome/Edge/Safari with webcam; mobile web beta for camera toggle)
Inference: 100% in-browser (MediaPipe Tasks Pose Landmarker primary; TF.js MoveNet MultiPose fallback)
Scope: 4 routes (Landing, Home, Drill, Account), Partner and Solo modes
Storage policy: only session meta + per-session recap metrics (aggregates) and user auth info stored in MongoDB; no video/audio, no per-frame events

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

Out of Scope (MVP)
- Perfect recognition during scrambles; technique-level detection (specific passes/submissions).
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

Routes
- / (Landing: login/signup)
- /home (Home: start)
- /drill (Drill: live tracking UI)
- /account (Account: Summary, Session History with inline reports, Edit)

Navigation rules
- Unauthenticated users are gated to / (Landing).
- After login/signup → /home.
- Top nav: Home, Drill, Account (only when authenticated).
- Direct links to /drill and /account redirect to / if unauthenticated.

# 4. Page Specifications and UX Flows

Landing (/)
Purpose: authentication and 50-user cap handling
Content
- Tabs: Login, Signup
- Login: email, password; Forgot Password link
- Signup: name, email, password; checkbox to accept ToS/Privacy
- “Beta full” state when user cap reached; show waitlist form (email only)
- Privacy note: “All analysis stays on your device. We never upload video.”

Validation and UX
- Email format; password min 8 (recommend 12+), strength hint
- Errors: invalid credentials, cap reached, email in use
- Rate-limit login/signup attempts (server)

Acceptance
- Successful login/signup routes to /home
- User cap blocks signup; waitlist stored

Home (/home)
Purpose: fastest path to start a drill
Content
- One large “Start Drill” button
- On click → modal with two options:
  - Partner Drill → /drill?mode=partner
  - Solo Drill → /drill?mode=solo
Notes
- Keep minimal and fast; preferences live on Account > Edit

Acceptance
- Mode selection persists via query param
- Modal keyboard accessible

Drill (/drill)
Purpose: live pose, labels, KPIs, voice cues, per-session focus/goals
Pre-session flow
- Mode from query param (partner|solo)
- Camera tile: “Click to enable camera” (no permission until click)
- After click → request getUserMedia; on success → start pose engine
- Controls: Start, Pause, Stop; round/rest configuration; voice settings
- Camera options:
  - Desktop: device dropdown (enumerateDevices)
  - Mobile: toggle Front (default) / Rear via facingMode ('user'|'environment'), with graceful fallback to deviceId
- Skeleton overlay toggle: Show/Hide skeleton and debug labels; tracking continues when hidden
- Session Focus panel (per-session only; does not affect account defaults):
  - Training Goals (multi-select with Select All):
    - Positional Dominance, Escape Success, Submission Rate, Guard Retention, Takedown Success, Pressure Passing, Scramble Efficiency, Submission Chains, Positional Awareness
  - Focus Areas: Key Positions & Situational Guards (multi-select with Select All)
    - Attack Positions: Mount, Back Control, Side Control, Knee-on-Belly, North-South, Attacking Guard
    - Defensive Situations: Bottom Mount, Back Mount, Bottom Side Control, Bottom Knee-on-Belly, Bottom North-South, Turtle, Bottom of a Takedown Attempt, Defensive Guard
    - Transitional & Neutral: Half Guard, Open Guard, Leg Entanglements, Scramble Situations

During session
- Live video with Canvas overlay (skeletons; debug toggle)
- Partner label: Position + Role + Confidence; Solo label: Drill + Phase
- Suggestion panel: 1–3 short tips; filters by per-session Goals + Focus Areas; auto-hide with manual pin
- Manual tags: Submission Attempt, Escape Attempt, Sweep Attempt; toggle success at end of attempt
- Voice cues (Web Speech API TTS): obey mode/frequency; respect per-session Goals/Focus for technical cues

Live KPIs (update every 1s; smoothed)
Partner mode
- Current Position (label, role, confidence)
- Control Time (session mm:ss, % of active time)
- Transitions count
- Attempts (Sub/Escape/Sweep counts; success rates)
- Intensity (0–100 gauge; derived from EMA velocity)
- Round time (elapsed/remaining)

Solo mode
- Drill name + phase
- Reps count
- Tempo (reps/min; best 30s)
- ROM/hip height or lateral displacement gauge (normalized)
- L/R symmetry (if applicable)
- Round time (elapsed/remaining)

End-of-round/session recap (modal)
- Partner: time-per-position bar; attempts vs success; error counts (failed transitions, lost guard); KPIs snapshot (control %, transition efficiency, guard retention %, intensity, reaction speed, session consistency, optional scramble win %)
- Solo: reps/tempo graphs, ROM, symmetry; fatigue curve; intensity; session consistency
- Buttons: Save & Continue, Save & Exit to Account, Discard

Camera and permissions
- If denied: “Enable camera in browser settings” with Retry
- If device missing: show help text
- Auto-tune resolution to maintain ≥20 FPS target (start 1280×720, step down if needed)

Acceptance
- ≥20 FPS target (≥16 min) on target devices
- Overlay stable; latency <150 ms median
- Voice cues queued; no overlap
- Goals/Focus affect Drill page only (live tips/voice) and are saved in this session’s config

Account (/account)
Purpose: all-time summary + session history with inline reports + user edit
Sections

1) Account Summary (All Sessions)
- Totals: sessions count, total mat time, partner vs solo breakdown
- Partner aggregates (averages/percentages): Control Time %, Transition Efficiency %, Guard Retention %, Scramble Win % (beta), Attempts & Success %, Intensity, Reaction Speed, Error counts rate
- Solo aggregates: Total reps per drill, best 30s tempo, avg ROM, symmetry trend
- Consistency trend sparkline (last N sessions)
- Export summary (CSV/JSON)

2) Session History (table with inline "View")
- Columns: Date (local), Total Time, Drill Type (Partner/Solo), Report (View)
- Clicking “View” expands inline recap (single-open rule)
  - Partner: time-per-position chart, attempts/success, error counts, KPIs, timeline mini-view
  - Solo: reps/tempo graphs, KPIs, fatigue curve
  - Actions: Export session (CSV/JSON), Rename, Delete
- Filters: date range, Drill Type; Pagination (10–20 rows/page)
- Accessibility: expand/collapse announced; keyboard accessible

3) Edit (Profile & Preferences)
- Profile: name; email (change requires current password); change password
- Preferences:
  - Pose engine (MediaPipe default; MoveNet fallback)
  - Voice (mode, style, frequency, volume, rate)
  - Theme (dark default), Large UI toggle, Units (metric/imperial)
- Data management:
  - Export all data; Clear local data; Delete account (confirm with password)
- Modes:
  - Local-only mode: profile email/password disabled; settings stored locally
  - Synced mode: all profile fields enabled; show last sync time + Sync Now

Acceptance
- Validations enforced; helpful errors
- Edits persist (local and remote where applicable)
- Deleting a session updates totals instantly
- Deleting account purges remote and local data

# 5. Functional Requirements by Module

Pose Engines
- Interface: init(videoEl), start(), stop(), onResults(cb), setRunningMode('video'|'image'), dispose()
- Primary: MediaPipe Tasks Vision Pose Landmarker (VIDEO mode), target numPoses=2; fallback to one pose if slow
- Fallback: TF.js MoveNet MultiPose with WebGL/WebGPU; selectable in Preferences
- FPS meter overlay (hidden by default)

Feature Extraction (per frame)
- Per person:
  - shoulderWidth, hipWidth, torsoLength
  - shoulderAngle, hipAngle, torso axis vector
  - headHeight (y), center of mass
  - velocity: EMA of per-landmark speed over last N frames
- Cross-person:
  - Distances: each knee/ankle/foot to opponent hip/torso center
  - Torso alignment: dot product and relative angle
  - Head direction alignment
  - BBox overlap ratio (IoU)
- Normalization: distances by opponent shoulderWidth; clamp/extreme filtering

Identity Tracking
- Maintain stable IDs across frames for two people:
  - Hungarian matching on bbox center, size, and torso anchor distance
  - User calibration at start (“raise right hand”) to lock who is “you”
  - Short dropout tolerance (e.g., 300–500 ms)

Position Classification (Partner)
- Labels: Mount, Side Control, Back Control, Knee-on-Belly, North-South, Guard, Turtle, Scramble/Unknown
- Role: Top/Bottom when applicable
- Scoring:
  - Weighted rules per label; score ∈ [0,1]
  - Confidence = max(score) − next best; if below threshold → Scramble/Unknown
- Smoothing:
  - Hysteresis: require 2–3 consecutive frames before switching label
  - Minimum dwell: ignore changes <200–400 ms for transition counting

Solo Drill Detection
- Drills: shrimp/hip escape, bridge/upa, technical stand-up, sprawl, sit-out, penetration step
- For each:
  - detectPhase(landmarks) → phase enum
  - repCompleted(prevPhase, currPhase, metrics) → boolean
  - metrics include hipHeight, lateralDisplacement, torsoAngle, tempo; tunable thresholds (JSON)
- Symmetry: infer left/right where applicable; track L/R counts

Suggestion Engine
- Tips JSON keyed by (label + role) and tagged with focusAreas[] and trainingGoals[]
- API: getSuggestions(label, role, sessionGoals[], sessionFocus[]) → tips[]
- Drill page only: uses per-session Goals/Focus; does not read/write account defaults

Voice Cues
- Web Speech API (TTS)
- Modes: Basic (start/stop/transition), Technical (position tips), Motivational, Silent
- Frequency: Smart (throttled), Every 30s, On Position Change, End of Round
- Styles: Neutral Instructor, Encouraging Coach, Quiet; voice selection stored
- Queue to avoid overlap; flush on Stop

Session Engine
- Controls: Start, Pause, Stop; round/rest config
- Events (local only):
  - position_change {from, to, confidence}
  - manual tags: submission_attempt, escape_attempt, sweep_attempt {success?}
  - solo_rep {drillId, metrics}
  - note
- State:
  - Timeline with timestamps
  - Round timers and elapsed active time
  - Mode (partner/solo)
  - Per-session Goals/Focus stored in session.config

KPIs and Recap (computed client-side)
- Partner:
  - Control Time % = time in control positions / active time
  - Control time by position (ms, %)
  - Transition count, Transition Efficiency % = clean transitions / total transitions (no ping-pong within 3s)
  - Guard Retention % = regains within 5–8s / guard-loss events
  - Scramble Win % (beta) based on perspective config (top dominance or escape success)
  - Attempts & Success % from manual tags (subs/escapes/sweeps)
  - Error counts: failed transitions (ping-pong within 3s), lost guard (guard→top control without regain in 5–8s)
  - Reaction Speed = time to first significant movement
  - Intensity Score = normalized mean landmark velocity (0–100)
  - Session Consistency = cosine similarity vs last 5 sessions
- Solo:
  - Reps per drill, best 30s tempo, avg ROM, L/R symmetry, fatigue curve
- Save only aggregates (no per-frame data) to Mongo

Storage and Persistence
- Local: IndexedDB for raw events/timelines and local aggregates cache; localStorage for UI settings (overlay, last camera)
- Remote (auth + sync): Node/Express + MongoDB Atlas + JWT
- Remote stores only:
  - users: name, email, password hash
  - sessions: meta + config (including per-session Goals/Focus, camera, overlay)
  - aggregates: per-session KPIs and charts
- Privacy: No video/audio frames stored or transmitted

# 6. Non-Functional Requirements

Performance
- Target ≥20 FPS at 720p; degrade to maintain ≥16 FPS
- Pose + classification latency <150 ms median
- Memory <300 MB; no tensor leaks (dispose tensors properly)

Reliability & Offline
- If authenticated and server unavailable: allow local sessions; queue sync of aggregates
- Auth-required routes gated; Landing always online
- Local write-through; remote sync best-effort

Security & Privacy
- TLS for all API calls
- JWT auth (httpOnly cookie or Authorization header)
- Passwords hashed (bcrypt) with salts; rate limiting, IP throttling, basic audit logs
- PII minimal (name, email); no video/audio uploaded
- Data retention (remote): 12 months default; user can delete

Accessibility
- Keyboard navigable; visible focus rings
- WCAG AA contrast; large targets
- Live KPI region non-announcing (avoid screen reader spam)

Compatibility
- Desktop: Chrome/Edge latest; Safari 16.4+
- Mobile web (beta): iOS Safari 16.4+ and Android Chrome (front/rear camera toggle)
- WebGL2 required; WebGPU optional
- Camera: 720p recommended; 1080p supported if FPS holds

# 7. System Architecture

Frontend
- React + TypeScript (CRA or Webpack-based SPA; no Vite)
- State: Zustand
- Validation: Zod
- Date/time: Day.js
- Styles: Tailwind or CSS Modules
- Modules: CameraFeed, CanvasOverlay, PoseEngines, FeatureExtractor, PositionEngine, SuggestionEngine, VoiceCueEngine, SessionEngine, KPI calculators, Storage, Auth (client)

Backend (MERN)
- Node.js (TypeScript), Express, MongoDB Atlas (Mongoose), JWT, Zod validation, CORS, rate limiting
- Services:
  - Auth: signup/login/change-password, forgot/reset (optional)
  - User settings (non-sensitive UI prefs)
  - Sessions (meta+config) CRUD
  - Aggregates (per-session KPIs) CRUD
  - Signup cap enforcement and waitlist

Deployment
- Client: Netlify/Vercel (SPA build), cache-busting; optional PWA manifest
- Server: Render/Fly/Heroku tiny dyno; env vars: MONGO_URI, JWT_SECRET, RATE_LIMIT, SIGNUP_CAP=50, SMTP_… (optional)

# 8. Data Model

users
- id: ObjectId
- name: string (1–60)
- email: string (unique, lowercase)
- passwordHash: string (bcrypt)
- createdAt, updatedAt: Date
- settings:
  - engine: 'mediapipe'|'movenet'
  - voice: { mode:'basic'|'technical'|'motivational'|'silent', style:'neutral'|'encouraging'|'quiet', frequency:'smart'|'30s'|'on_change'|'end', volume:0–1, rate:0.5–1.5 }
  - theme: 'dark'|'light'
  - uiScale: 'large'|'normal'
  - units: 'metric'|'imperial'
- statsCache (optional): { totalSessions:number, totalMatTimeMs:number, lastSyncAt?:Date }

sessions
- id: ObjectId
- userId: ObjectId
- mode: 'partner'|'solo'
- start: Date
- end: Date
- config: {
    roundSec: number, restSec: number, voiceMode: string,
    focusAreas?: string[],           // per-session only
    trainingGoals?: string[],        // per-session only
    camera?: { deviceId?: string, facingMode?: 'user'|'environment' },
    overlay?: { skeleton: boolean }
  }
- engineVersion: string
- title?: string
- notes?: string

aggregates
- sessionId: ObjectId (unique)
- timePerPosition: Record<string, number> (ms)
- kpis: {
    controlTimePct?: number,
    transitionEfficiencyPct?: number,
    guardRetentionPct?: number,
    scrambleWinPct?: number,
    attempts?: {
      sub:{attempts:number, success:number},
      escape:{attempts:number, success:number},
      sweep:{attempts:number, success:number}
    },
    errors?: { failedTransitions:number, lostGuard:number },
    reactionSpeedMs?: number,
    intensityScore?: number,
    sessionConsistency?: number,
    solo?: {
      repsByDrill: Record<string, number>,
      best30sTempoByDrill: Record<string, number>,
      avgRomByDrill: Record<string, number>,
      symmetryByDrill?: Record<string, number>
    }
  }
- intensityCurve: Array<{ t:number, value:number }>
- timeline: Array<{ t:number, label:string }> // downsampled summary only
- meta: { mode:'partner'|'solo', durationMs:number }

waitlist
- id, email, createdAt

Indexes
- users.email unique
- sessions.userId + start desc
- aggregates.sessionId unique

# 9. API Contracts (high level)

Auth
- POST /auth/signup: {name,email,password} → 201 {user:{id,name,email}}
  - 409 if email exists; 403 if signup cap reached
- POST /auth/login: {email,password} → 200 {user, token}
  - 401 on invalid
- POST /auth/change-password: {currentPassword,newPassword} → 204
- POST /auth/forgot (optional): {email} → 204
- POST /auth/reset (optional): {token,newPassword} → 204

User
- GET /me → {user:{id,name,email,settings}}
- PUT /me: {name?,email?,settings?} → 200 {user}
  - email change requires password in payload or separate endpoint
- PUT /settings: {settings} → 200 {settings}

Data
- GET /sessions?limit&offset&mode&from&to → {items: Session[], total}
- POST /sessions: Session → 201 {session}
- PUT /sessions/:id: partial update (title, notes) → 200
- DELETE /sessions/:id → 204
- GET /aggregates?sessionId= → {aggregate}
- POST /aggregates: aggregate → 201
- PUT /aggregates/:sessionId → 200

Waitlist
- POST /waitlist: {email} → 201

Security and Limits
- JWT required (Bearer) for all non-auth endpoints
- Rate limit: 10 req/min/auth endpoints; 60 req/min general
- CORS allowlist to client origin

Note: No remote /events endpoint in MVP; raw events remain local-only.

# 10. Algorithms, Heuristics, and Metrics

Pose/Feature math
- Normalize distances by opponent shoulderWidth (fallback: hipWidth)
- EMA velocity v_t = α*|p_t - p_{t-1}| + (1-α)*v_{t-1}, α≈0.3
- Torso axis vector = midShoulders → midHips; angles via atan2
- BBox overlap = IoU

Classification scoring (pattern)
- score_mount_top = w1*knees_by_torso + w2*hips_over_abdomen + w3*bottom_horizontal - w4*distance_to_hips
- Confidence = maxScore − secondBest; if maxScore < 0.5 → Unknown/Scramble
- Smoothing: 2–3-frame hysteresis before changing label; min dwell 200–400 ms

Solo rep detection (tunable via JSON)
- Bridge: hipHeight > θ_high then return to baseline within Δt → rep++
- Shrimp: lateralDisplacement > θ_lat and torsoAngle within range → rep++
- Technical stand-up: sequence knee-down → post-hand → stand; total time < θ_ts

Derived metrics
- Intensity Score: normalized EMA velocity aggregated across selected landmarks to [0–100]
- Reaction Speed: Start → first frame with EMA velocity > θ_move for ≥N frames
- Transition Efficiency: clean transitions that don’t revert within 3s
- Guard Retention: guard-loss events with guard regain within 5–8s
- Error counts:
  - failedTransitions: label A→B→A within 3s
  - lostGuard: Guard→Top control (Mount/Side/Back/KOB/NS) with no Guard regain within 5–8s

# 11. Content Requirements

Technique Suggestions JSON (example)
- { label:'Mount', role:'Top', tips:['Isolate near-side arm','Climb to high mount'], focusAreas:['Mount'], trainingGoals:['Positional Dominance','Submission Chains'] }

Solo Drills JSON (example)
- { id:'shrimp', name:'Hip Escape', thresholds:{displacement:0.35, torsoAngleRange:[-20,20]}, phrases:{pace:'Keep the rhythm', tipLow:'Bigger hip movement', tipHigh:'Smooth control'} }

Voice Phrases
- Short, non-spammy lines per mode/style; throttle in Smart mode; optionally filtered by session Goals/Focus

Onboarding/Help Copy
- Camera distance (1.5–3.5 m), angle (side or 45°), lighting tips, privacy statement, safety disclaimer

# 12. UI Specifications (key components)

Camera tile (Drill)
- States: idle (click to enable), requesting, live, error
- Camera selector: desktop device dropdown; mobile Front/Rear toggle
- Overlay toggle: skeleton on/off; debug labels optional

Session Focus panel (Drill)
- Training Goals multi-select with Select All
- Focus Areas multi-select with Select All
- Collapsible sections; chips show active counts
- Per-session only; “Apply” affects live tips/voice immediately

Live KPIs strip
- Responsive cards; updates every second; smooth numeric transitions

Session History row expansion
- “View” toggles expansion; animate height; lazy-load charts
- Accessible: aria-expanded, focus management

Edit forms
- Inline validation; Save disabled until changes; toasts on save
- Email change prompts for password

# 13. Accessibility and Localization

- WCAG AA contrast; button sizes ≥44px
- Keyboard navigation for all interactive controls
- Screen readers: labeled controls and toggles; live region for important announcements only
- Language: English only in MVP; strings centralized for future i18n

# 14. Testing and QA Plan

Unit tests (Jest/Vitest)
- Feature math (angles, normalization, EMA velocity)
- Classifier scoring for synthetic poses
- KPI calculators (control time %, intensity, reaction speed, guard retention, error counts)

Integration tests
- Pose engine init/dispose; FPS meter; engine switch
- Voice engine queue/throttle behavior
- Camera switching (facingMode/deviceId); overlay toggle behavior

E2E tests (Playwright/Cypress)
- Auth: signup/login/logout; cap enforcement; waitlist
- Flow: Landing → Home → Drill → Enable camera → Start/Pause/Stop → Recap → Save → Account Summary update → Session History inline View
- Drill options: Training Goals/Focus Areas Select All toggles; affect suggestions/voice only for that session; saved in session.config
- Account Edit: profile changes; preferences persist; delete session; export JSON/CSV

Manual scenarios
- Occlusion/scrambles; poor lighting; switching 1↔2 persons; camera disconnect; denied permissions and recovery
- Mobile: front↔rear toggle; permission prompts; orientation changes

Performance validation
- ≥20 FPS at 720p on mid-range laptops; downscale path verified
- Memory growth stable during 20-minute session

# 15. Acceptance Criteria (Definition of Done)

- Landing: login/signup works; 50-user cap enforced; waitlist works when full
- Home: Start Drill → modal (Partner/Solo) → correct routing
- Drill:
  - Click-to-enable camera; camera selector works (desktop dropdown; mobile Front default with toggle to Rear)
  - Skeleton overlay toggle hides/shows overlay; tracking unaffected
  - Session Focus panel present: Training Goals + Focus Areas multi-select with Select All; affects suggestions/voice in-session only; saved in session.config
  - Partner: core position detection achieves ≥70% perceived accuracy in staged drills; live KPIs update
  - Solo: rep counting within ±20% error in clean setups; live KPIs update
  - Voice cues obey mode/frequency; no overlap
  - Recap shows: control time by position; attempts vs success; error counts; key KPIs; session consistency; Save persists aggregates
- Account:
  - Summary aggregates accurate; consistency trend visible
  - Session History inline report expands/collapses; charts match saved aggregates
  - Edit updates profile (name/email/password) securely; preferences persist
  - Export CSV/JSON works
- Privacy: No video/audio frames or per-frame events uploaded; only users, sessions (meta+config), aggregates stored in MongoDB
- Stability: No crashes across a 20-minute continuous session

# 16. Rollout, Scale, and Operations

Scale
- ≤50 users; ≤20 concurrent active
- MongoDB Atlas free/low tier; <1 GB/year estimated

Rollout
- Alpha (5 users): verify FPS, permission flows, basic accuracy
- Beta (25 users): tune thresholds, voice frequency, UI polish
- Full Beta (50 users): enable waitlist; monitor stability

Monitoring
- Client perf HUD (FPS, dropped frames, engine used)
- Server logs: auth attempts, API latencies, rate-limit triggers
- Error reporting: client (Sentry optional; no PII or frames), server (structured logs)

# 17. Risks and Mitigations

- Occlusions → mislabels: show confidence; camera setup tips; hysteresis smoothing; Unknown fallback
- Voice spam: Smart throttle; user-adjustable frequency; Silent mode
- Browser permissions: explicit click-to-enable; clear recovery steps
- Performance variance: resolution auto-tune; engine switch; lower detection cadence
- Data trust: transparent privacy messaging; store only aggregates/meta remotely

# 18. Implementation Plan (6 weeks)

- W1: MERN scaffold; Auth (Landing), Home; 50-user cap + waitlist; client state, routing
- W2: MediaPipe engine (2 persons), MoveNet fallback; FPS meter; Camera tile UX; camera selector; overlay toggle
- W3: Feature extraction + partner classifier; Identity tracker; Suggestion engine (Goals/Focus aware); Voice engine
- W4: Session engine; live KPIs; Recap modal; Solo drill detection + KPIs
- W5: Account Summary; Session History inline report; Edit (profile/preferences); exports; store only sessions+aggregates remotely
- W6: Tests (unit/integration/E2E), perf tuning, deploy, beta onboarding

# 19. Open Questions

- Allow “Guest session” (no login) for quick demo? Default off to enforce cap.
- Scramble Win % perspective default: top-dominance vs escape success?
- Email verification required for signup or optional (lower friction)?
- Store TTS voice selection per device or account? (account-level preferred)
- Data retention beyond 12 months configurable per user?

# 20. Appendix: Copy and Error States

Key messages
- Privacy: “All analysis happens in your browser. We never upload video.”
- Camera denied: “Camera access is blocked. Allow camera for this site in your browser settings and click Retry.”
- Cap reached: “Beta is currently full. Join the waitlist and we’ll email you when a spot opens.”

Validation rules
- Name: 1–60 chars; no control chars
- Email: RFC-ish; store lowercase
- Password: min 8 (recommend 12+), at least 1 letter + 1 number or symbol

Server error codes
- 400 invalid payload; 401 unauthorized; 403 cap reached; 409 email exists; 429 rate limited; 500 generic error

Notes specific to this MERN build
- SPA bundling via CRA or Webpack; no Vite
- Inference strictly in-browser; only session meta + per-session aggregates and user auth stored in MongoDB
- Per-frame events/timelines remain in IndexedDB; not synced remotely

