# MDTechActive Design Document

## 1. Product Summary
MDTechActive is an educational, game-based web application for ages 11-16. Teachers host live rooms and students join to answer technology-career questions while competing through minigame systems.

Primary goals:
- Make technology and career pathways engaging for secondary school learners.
- Support classroom-led sessions where a teacher can host and control game flow.
- Reward participation and accuracy with leaderboard progression.

## 2. Current Scope
Implemented game modes:
- Tower Defence: question answers drive combat, map progression, tower placement, and upgrades.
- Factory: questions are pull-based using a "Ready for more questions" interaction; every 3 correct answers unlocks a machine; machines generate timed income; upgrades increase output.
- One on One: players queue, are randomly paired, answer the same question, and the fastest correct answer lands an attack.

Implemented question interaction types:
- Multiple Choice (single answer)
- True/False
- Select All That Apply
- Order the Steps
- Match the Role
- Scenario Choice
- Short Answer (typed)

Core room behavior:
- Host creates room with mode, timer, and enabled question types.
- Players join by room code and username.
- Leaderboard updates during gameplay.
- Room end conditions: host ends early or timer expires.
- Grace shutdown lifecycle: ended rooms remain readable briefly, then are removed; room codes become reusable.

## 3. Technology Stack
- Frontend: React + Vite + Bootstrap 5
- Backend: Node.js + Express
- Data: MongoDB via Mongoose (with in-memory fallback when no database URI is provided)
- Styling: Bootstrap plus custom CSS theme tokens

## 4. Architecture
### 4.1 Frontend
- Router-based page structure:
   - Home page
   - Host setup
   - Host dashboard
   - Join/play experience
- Implemented routes:
   - `/`
   - `/host`
   - `/host/:roomCode`
   - `/join/:roomCode`
- API wrapper centralizes fetch logic and error handling.
- Minigame logic is mode-driven in the player page.
- Theme + accessibility controls stored in localStorage (theme, high contrast, reduced motion, large text).
- Built-in text-to-speech controls for reading selected text or the full page.

### 4.2 Backend
- REST API under `/api`.
- Room lifecycle and gameplay state handled in route layer for current scope.
- Persistent entities:
   - GameRoom
   - Player
   - QuizQuestion
   - LeaderboardEntry
   - SampleItem
- Route groups:
   - `/api/health`
   - `/api/game-room`
   - `/api/quiz`
   - `/api/leaderboard`
   - `/api/sample-items`

### 4.3 Real-time Strategy
- Polling-based updates for room state and duel state.
- Timed intervals on client for income ticks and countdown visuals.
- Server is source of truth for leaderboard score and one-on-one outcomes.

## 5. UX and Accessibility
- Theme supports light and dark modes.
- Color palette follows project-defined scheme.
- Semantic headings, labels, button text, and status messages used across interactive views.
- Interfaces are responsive across desktop and mobile breakpoints.

## 6. Room and Data Lifecycle
- Active room: playable and joinable.
- Ended room: non-joinable, read-only during grace period.
- Shutdown: room, players, and room-scoped duel state are removed after grace expires.
- Reuse policy: host can recreate using the same code once prior instance is inactive/ended.

## 7. Local Safety Requirements
- Backend binds to localhost only.
- CORS restricted to local frontend origins used by the project.
- Intended for local classroom testing and development.

## 8. Extension Plan
Recommended next features:
- Dedicated host control surfaces per minigame.
- More tower/enemy archetypes and animated combat states.
- Expanded question authoring and import tooling.
- WebSocket migration for lower-latency multiplayer updates.

## 9. Project Update and Content Management
This section defines the operational process for safely updating MDTechActive, especially when adding new questions, categories, and game content.

### 9.1 Change Categories
Use these categories to scope work and testing effort:
- Content-only changes: question text, answer options, explanations, category labels.
- Gameplay tuning: scoring values, unlock thresholds, timer defaults, income/upgrade balance.
- Feature changes: new UI flows, API endpoints, new minigame mechanics.
- Platform/infra changes: package upgrades, config updates, DB model/schema changes.

### 9.2 Standard Update Workflow
Use this sequence for all updates:
1. Define change scope and expected player/teacher impact.
2. Update documentation first (design notes and any affected guidelines).
3. Implement changes in the smallest safe unit (content, then logic, then UI).
4. Run local verification for host flow, player flow, and mode-specific behavior.
5. Confirm no regressions in room lifecycle (create, join, active, ended, cleanup).
6. Record what changed and why in commit messages and PR notes.

### 9.3 Question Bank Management
Questions are a core asset and should be treated like versioned content.

Question design requirements:
- Audience: age-appropriate for 11-16.
- Clarity: one unambiguously correct answer.
- Relevance: technology careers, digital literacy, teamwork, and safety.
- Difficulty: mixed distribution (easy/medium/challenging) to avoid flat gameplay.
- Bias/safety: avoid stereotypes, region-only assumptions, and exclusionary wording.

Minimum question format:
- `id`: stable unique identifier.
- `prompt`: question sentence.
- `options`: answer choices in display order.
- `correctAnswer`: exact value or index used by scoring logic.
- `category`: content theme (example: Cybersecurity, Software, Data, Design).
- `difficulty`: easy/medium/hard.
- Optional: `explanation` for teacher review or post-question feedback.

Question writing checklist:
1. Verify the answer is factually correct and current.
2. Remove trick wording and double negatives.
3. Keep options similar in length and style to reduce guess bias.
4. Ensure distractor options are plausible but clearly wrong.
5. Read aloud once for clarity and reading level.

### 9.4 Adding New Questions
When adding questions, follow this operational flow:
1. Locate the active question source (local data file, seed file, or API-backed store).
2. Add new entries using the same schema and naming conventions.
3. Keep IDs unique and stable; never reuse deleted IDs for different prompts.
4. Group by category and tag difficulty for balanced randomization.
5. Validate that each question has exactly one correct answer.
6. Run local playthrough in each active game mode to check pacing and scoring impact.

#### 9.4.1 One-on-One Question Pool
One-on-One questions live in the backend route file and are separate from the general question bank.

Location:
- [server/src/routes/gameRoomRoutes.js](server/src/routes/gameRoomRoutes.js)

How to add a new One-on-One question:
1. Add an item to `ONE_ON_ONE_QUESTIONS` with `id`, `prompt`, `options`, and `answer`.
2. Keep the prompt short and the options distinct for fast-response duels.
3. Ensure the `answer` is exactly one of the option strings.
4. Avoid duplicate prompts to keep the duel cycle varied.

Notes:
- The duel system shuffles options per question and cycles questions before repeating.
- Duel answer window and scoring are controlled by constants in the same file.

Quality gates before merge:
- No broken rendering for long prompts/options on mobile.
- No category mismatch between host setup filter and served questions.
- No duplicate prompts or near-duplicates in the same category.
- No unresolved placeholders or test-only content.

### 9.5 Updating Existing Questions
Use these rules to avoid content drift:
- Minor text correction: keep the same `id`.
- Meaning change (different concept/expected answer): create a new `id` and retire old entry.
- Category/difficulty retune: update metadata and note reason in change log.
- If answer changes, re-verify all logic depending on correctness checks and score events.

### 9.6 Gameplay Balance Updates
Changes to question volume/difficulty affect each mode differently:
- Tower Defence: harder pools may slow damage progression and increase base pressure.
- Factory: question cadence affects machine unlock speed and income curve.
- One on One: short/clear prompts are critical because speed is part of duel outcome.

Balance pass checklist:
1. Run a short session per mode with mixed-correctness answers.
2. Observe time-to-progression milestones (first unlock, first duel win, leaderboard separation).
3. Adjust thresholds or rewards only after confirming question quality is not the root issue.

### 9.7 Regression and Verification Checklist
Run this checklist for content or feature updates:
1. Start backend and frontend locally with standard env settings.
2. Create a host room with multiple question types enabled.
3. Join as at least one player and submit correct/incorrect answers.
4. Confirm leaderboard updates and no stale state during polling.
5. End room and verify grace-period read-only behavior.
6. Confirm room cleanup and code reuse after shutdown.
7. Check console/logs for validation warnings or API errors.

### 9.8 Versioning and Release Hygiene
- Bundle related question updates into coherent releases (for example, "Cyber Week Set A").
- Keep commit messages explicit (what changed, why, expected impact).
- Document any teacher-facing behavior changes in README/release notes.
- When possible, keep gameplay tuning and large question imports in separate commits for easier rollback.

### 9.9 Roles and Ownership Guidance
- Content owner: prepares/validates question quality and metadata.
- Gameplay owner: checks scoring/balance impact across modes.
- Technical owner: validates data integrity, API behavior, and deployment safety.
- For small teams, one person can perform all roles, but review steps should still be followed explicitly.

### 9.10 Adding or Extending Question Types
Question types are defined in the client question bank and surfaced in the host flow and join UI.

Locations:
- [client/src/data/questionBank.js](client/src/data/questionBank.js)
- [client/src/pages/HostGame.jsx](client/src/pages/HostGame.jsx)
- [client/src/pages/JoinRoom.jsx](client/src/pages/JoinRoom.jsx)

Checklist:
1. Add a new builder to `QUESTION_BANK` with a stable `id` and `type` value.
2. Add a label to `QUESTION_TYPE_LABELS`.
3. Expose the new type in `QUESTION_TYPE_OPTIONS` for host setup.
4. Update `renderQuestionBody` in the join page to handle the new interaction.
5. Validate scoring logic for each minigame using that type.

### 9.11 Minigame Expansion Guide
Minigames are mode-driven and configured during room creation.

Locations:
- [client/src/pages/HostGame.jsx](client/src/pages/HostGame.jsx) (mode selector)
- [client/src/pages/JoinRoom.jsx](client/src/pages/JoinRoom.jsx) (mode UI and logic)
- [server/src/routes/gameRoomRoutes.js](server/src/routes/gameRoomRoutes.js) (room creation payload)

Checklist for a new minigame:
1. Add a new `minigameType` option in the host form.
2. Update `MODE_LABELS` and add a new render block in the join page.
3. Define scoring and sync behavior using `syncScore`.
4. Add any new backend endpoints if the mode needs shared state.
5. Add content/testing notes to this document and the guidelines.

### 9.12 Gameplay Tuning Variables
Core tuning values live in the join page for the current minigames.

Location:
- [client/src/pages/JoinRoom.jsx](client/src/pages/JoinRoom.jsx)

Tower Defence tuning:
- `TOWER_PLACE_COST`, `TOWER_UPGRADE_COST`
- `TOWER_ABILITY_CHARGE_PER_CORRECT`, `TOWER_ABILITY_DAMAGE`
- `TOWER_PREP_QUESTION_COUNT`
- `TOWER_TYPES` (tower stats)
- `ENEMY_ARCHETYPES` (speed, hp multipliers, rewards)
- `TOWER_MAP` (route and placement slots)
- `TOWER_QUESTION_REWARD_BY_TYPE`

Factory tuning:
- `FACTORY_PREP_QUESTION_COUNT`
- `FACTORY_BLUEPRINTS` (machine types)
- `FACTORY_SPRINT_BASE_COST`, `FACTORY_SPRINT_COST_STEP`
- `FACTORY_SPRINT_BOOST_MULTIPLIER`, `FACTORY_SPRINT_BOOST_MS`

One-on-One tuning:
- `DUEL_ROUND_SECONDS` in the client
- `ONE_ON_ONE_DAMAGE`, `ONE_ON_ONE_WIN_SCORE` in the server

Room lifecycle:
- `ROOM_SHUTDOWN_GRACE_MS` in the server

## 10. References
- React: https://react.dev/
- Vite: https://vitejs.dev/
- Express: https://expressjs.com/
- MongoDB: https://www.mongodb.com/docs/
- Bootstrap: https://getbootstrap.com/docs/

## 11. Additions Made on May 5, 2026
This section records the functionality added in today’s working session.

Frontend additions:
- Host flow now includes selectable mode and multi-select question type configuration before room creation.
- Host dashboard now shows room details, timer remaining, system stats, leaderboard, and player management controls.
- Join flow supports all active game modes (Tower Defence, Factory, One on One) with mode-specific gameplay panels.
- Player session includes final game-over modal with leaderboard snapshot and timed redirect.
- Tower Defence gameplay includes wave prep questions, tower placement on a route map, tower upgrades, and a special ability meter.
- Factory mode includes machine choice drafts, passive income ticks, upgrade costs, and sprint boosts.
- One-on-One mode includes duel queueing, answer window timer, and health-based elimination logic.
- Theme toggle, accessibility toggles, and text-to-speech controls are available in the global navbar.

Backend additions:
- Game room create endpoint auto-generates room codes and persists selected mode/question types.
- Room management endpoints added/expanded for join, score updates, end game, and kick player actions.
- One-on-one duel endpoints added for queueing, state polling, and answer submission:
  - `POST /api/game-room/one-on-one/ready`
  - `GET /api/game-room/one-on-one/state/:roomCode/:playerId`
  - `POST /api/game-room/one-on-one/answer`
- Room insight endpoints available for host dashboards:
  - `GET /api/game-room/:roomCode/stats`
  - `GET /api/game-room/:roomCode/leaderboard`

Data/model additions:
- New Mongoose models added for `GameRoom`, `Player`, `QuizQuestion`, and `LeaderboardEntry`.
- Sample CRUD foundation preserved and wired for `SampleItem` extension paths.
