# MDTechActive Design Guidelines

## 1. Visual System
### 1.1 Color Palette
Use the approved project palette:
- `#070F7A`
- `#C243FA`
- `#F5F404`
- `#F8FEC7`
- `#F625FB`
- `#FFCD01`
- `#0226FA`
- `#000000`
- `#44FD4E`
- `#A9FD3B`
- `#D9E8FF`
- `#47FED8`
- `#FD8200`
- `#FED9AC`

Use tokenized variables in shared styles before introducing one-off colors.

### 1.2 Typography and Readability
- Keep text high-contrast in both light and dark themes.
- Use clear heading hierarchy (`h1` to `h3`) with concise labels.
- Keep gameplay-critical text short and action-focused.

### 1.3 Component Style
- Prefer Bootstrap components for consistency.
- Apply custom classes for mode-specific visuals (map lanes, machine cards, duel panels).
- Keep interaction states obvious: hover, active, disabled, selected.

## 2. Layout and Structure
### 2.1 Global Layout
- Navbar at top, footer at bottom, content centered in a responsive container.
- Use card-based sections for mode modules and status blocks.
- Keep leaderboard visible beside or below gameplay based on viewport size.

### 2.2 Responsive Behavior
- Mobile-first interaction support.
- Stacked single-column mode on small screens.
- Ensure game controls remain reachable without horizontal scrolling.

## 3. Gameplay UX Standards
### 3.1 Shared Rules
- Do not hide room state transitions.
- Always show clear status when waiting, active, and ended.
- Keep score and progress visible during gameplay.

### 3.2 Tower Defence
- Show map lane, enemies, tower slots, and placement/upgrade cost.
- Use distinct visual markers for base, lane, and enemy movement.
- Keep placement action and cost messaging immediate and clear.

### 3.3 Factory
- Questions appear only after explicit user action ("Ready for more questions").
- Show machine inventory, per-tick output, and upgrade costs.
- Clarify when income is passive versus question-earned.

### 3.4 One on One
- Show queue status, duel state, and opponent information.
- Present same-question race clearly with lockout after answer.
- Display latest duel outcome with winner/attack feedback.
- Keep duel prompts short enough to read within the answer window.

## 4. Content Guidelines
- Question wording should be age-appropriate for 11-16.
- Keep options unambiguous and avoid trick phrasing.
- Prioritize technology roles, teamwork, safety, and real-world scenarios.
- One-on-One questions should be shorter and more direct than standard pool items.

## 5. Accessibility Guidelines
- Ensure form controls have labels.
- Preserve keyboard accessibility for all gameplay actions.
- Use status regions for important game updates and errors.
- Maintain WCAG AA contrast targets in both themes.

## 6. Engineering and Organization
- Keep client code grouped by feature in `components`, `pages`, `services`, `styles`, and `data`.
- Keep backend route behavior predictable and side effects explicit.
- Document any mode-specific logic in comments only when non-obvious.

## 7. Content and Mode Extension Checklist
### 7.1 Add or Update Question Types
Use the question bank as the source of truth.

Locations:
- [client/src/data/questionBank.js](client/src/data/questionBank.js)
- [client/src/pages/HostGame.jsx](client/src/pages/HostGame.jsx)
- [client/src/pages/JoinRoom.jsx](client/src/pages/JoinRoom.jsx)

Checklist:
1. Add the question type and labels.
2. Update the host configuration list.
3. Update answer UI rendering and validation.
4. Confirm the type is scored correctly in all minigames.

### 7.2 Add One-on-One Questions
Location:
- [server/src/routes/gameRoomRoutes.js](server/src/routes/gameRoomRoutes.js)

Checklist:
1. Add a new entry to `ONE_ON_ONE_QUESTIONS`.
2. Ensure `answer` matches one of the options exactly.
3. Keep options short and evenly paced for fast reading.

### 7.3 Add a New Minigame
Locations:
- [client/src/pages/HostGame.jsx](client/src/pages/HostGame.jsx)
- [client/src/pages/JoinRoom.jsx](client/src/pages/JoinRoom.jsx)

Checklist:
1. Add a mode option to host setup.
2. Add a mode label and a render branch for the new game.
3. Define scoring and sync with the leaderboard.
4. Update the design document with mode-specific rules.

### 7.4 Add Enemy Archetypes or Factories
Location:
- [client/src/pages/JoinRoom.jsx](client/src/pages/JoinRoom.jsx)

Checklist:
1. Add enemy entries in `ENEMY_ARCHETYPES` for Tower Defence.
2. Add factory definitions in `FACTORY_BLUEPRINTS`.
3. Rebalance rewards, costs, and payout timing if needed.
4. Re-test with at least one full wave/production cycle.

## 8. Change Management
When introducing new UX/gameplay features:
1. Update this guideline file.
2. Update the design document.
3. Confirm behavior with local build and route checks.