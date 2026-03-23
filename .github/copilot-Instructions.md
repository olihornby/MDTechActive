# Copilot Execution Guide for This Project

This document explains exactly what Copilot should do, in order, to set up and build this project.
It is written as a practical checklist with clear outputs and validation checks.

## Project Goals

- Build a MERN project (MongoDB, Express.js, React, Node.js).
- Use Bootstrap for styling.
- Create a clean, scalable folder structure.
- Run the app locally with access limited to your machine.
- Build a React base page that can be expanded into the full app.
- Use the provided Brave Search link as implementation guidance.

## Rules Copilot Must Follow

- Prioritize MERN conventions over alternatives unless asked otherwise.
- Keep all changes understandable and beginner-friendly.
- Add brief comments only where code is not obvious.
- Do not expose local development services publicly.
- Verify each phase before moving to the next one.

## Step-by-Step Delivery Plan

### Phase 1: Verify and Prepare Instruction Files

- [x] Check whether `.github/copilot-Instructions.md` exists.
- [x] If it does not exist, create it and copy the content of this file into it.
- [x] Keep this file as the source of truth for future edits.

Success criteria:
- `.github/copilot-Instructions.md` exists and matches this instruction set.

### Phase 2: Scaffold the MERN Project Structure

- [x] Create a top-level `client` folder for React.
- [x] Create a top-level `server` folder for Express/Node API.
- [x] Add root files for project coordination (`README.md`, optional `.gitignore`, and script guidance).
- [x] In `server`, set up core folders such as `routes`, `controllers`, `models`, `middleware`, and `config`.
- [x] In `client`, set up `src` with `components`, `pages`, `services`, and `styles`.

Recommended baseline structure:

```text
.
|- .github/
|  |- copilot-Instructions.md
|- client/
|  |- src/
|  |  |- components/
|  |  |- pages/
|  |  |- services/
|  |  |- styles/
|  |  |- App.jsx
|  |  |- main.jsx
|  |- index.html
|- server/
|  |- src/
|  |  |- config/
|  |  |- controllers/
|  |  |- middleware/
|  |  |- models/
|  |  |- routes/
|  |  |- app.js
|  |- server.js
|- README.md
```

Success criteria:
- Folder layout is in place and cleanly separated into frontend and backend.

### Phase 3: Backend Setup (Node + Express)

- [x] Initialize Node project in `server`.
- [x] Install dependencies: `express`, `cors`, `dotenv`, `mongoose`.
- [x] Install development dependency: `nodemon`.
- [x] Create `server.js` entry and `src/app.js` app configuration.
- [x] Add one health-check route such as `/api/health`.

Local-only requirement:
- [x] Bind backend server to `127.0.0.1` (not `0.0.0.0`).
- [x] Use a local port (example: `5000`).

Success criteria:
- Backend starts with no errors.
- Visiting `http://127.0.0.1:5000/api/health` returns a valid response.

### Phase 4: Frontend Setup (React + Bootstrap)

- [ ] Initialize React app in `client` (Vite is preferred unless instructed otherwise).
- [ ] Install `bootstrap`.
- [ ] Import Bootstrap CSS in the React entry file (`main.jsx` or equivalent).
- [ ] Build a base page with:
	- [ ] Header/navbar
	- [ ] Main content section
	- [ ] Example Bootstrap grid/cards/buttons
	- [ ] Footer

Success criteria:
- Frontend runs locally and Bootstrap styles are visibly applied.

### Phase 5: Connect Frontend and Backend

- [ ] Add a frontend service utility for API calls.
- [ ] Call `/api/health` from React and display status on the page.
- [ ] Handle loading and error states clearly.

Success criteria:
- React page shows successful backend communication.

### Phase 6: MongoDB Integration (Mongoose)

- [ ] Add environment variables in `server/.env` (for example `MONGO_URI`, `PORT`).
- [ ] Create MongoDB connection logic in `server/src/config`.
- [ ] Connect DB during server startup.
- [ ] Add one sample model and one sample route/controller for CRUD foundation.

Success criteria:
- Server connects to MongoDB without crashing.
- Sample API endpoint can read/write test data.

### Phase 7: Local-Only Testing and Safety

- [ ] Confirm both client and server run on localhost only.
- [ ] Ensure CORS allows only local frontend origin(s) used by the project.
- [ ] Add clear run commands in README for local testing.

Success criteria:
- The app is testable from your machine and not exposed publicly.

### Phase 8: Use the Provided Research Link

Reference link:
- https://search.brave.com/search?q=how+would+i+implement+bootstrap+and+a+MERN+stack+into+a+project&summary=1&conversation=08db143a609d4d6b20ce9eb8a4ed00fa7461

Copilot should:
- [ ] Pull practical guidance from the link.
- [ ] Apply only relevant, up-to-date practices.
- [ ] Prefer official docs (React, Bootstrap, Express, MongoDB) when there is conflict.

Success criteria:
- Implemented setup reflects sound MERN + Bootstrap practices.

## Command Guidance (Reference)

Backend example commands:

```bash
cd server
npm init -y
npm install express cors dotenv mongoose
npm install -D nodemon
```

Frontend example commands:

```bash
cd client
npm create vite@latest .
npm install
npm install bootstrap
```

## Definition of Done

- [x] `.github/copilot-Instructions.md` exists and is current.
- [x] MERN structure is scaffolded and organized.
- [x] Backend runs locally on `127.0.0.1`.
- [ ] Frontend runs locally with Bootstrap styling.
- [ ] Frontend can call backend successfully.
- [ ] MongoDB is connected through Mongoose.
- [ ] Local testing instructions are documented in README.

## Notes for Future Tasks

- Keep tasks small and verifiable.
- Validate after each phase before adding new features.
- If requirements change, update this file first, then implement.
