# MD TechActive

MERN + Bootstrap starter workspace.

## Current Status

- Phase 1 complete: instruction files verified and synced.
- Phase 2 complete: project structure scaffolded for client and server.
- Remaining phases will add dependencies, runtime setup, API wiring, and MongoDB connection.

## Project Layout

```text
.
|- .github/
|- client/
|  |- src/
|     |- components/
|     |- pages/
|     |- services/
|     |- styles/
|- server/
|  |- src/
|     |- config/
|     |- controllers/
|     |- middleware/
|     |- models/
|     |- routes/
```

## Next Setup Commands

Backend:

```bash
cd server
npm init -y
npm install express cors dotenv mongoose
npm install -D nodemon
```

Frontend:

```bash
cd client
npm create vite@latest .
npm install
npm install bootstrap
```
