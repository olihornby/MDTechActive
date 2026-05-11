# MD TechActive

Local-first MERN + Bootstrap project scaffold.

## Stack

- Frontend: React (Vite) + Bootstrap
- Backend: Node.js + Express
- Database: MongoDB + Mongoose

## Local-Only Safety

- Backend binds to `127.0.0.1` by default.
- Frontend Vite dev server binds to `127.0.0.1`.
- CORS is restricted to local origins defined in `server/.env` (`CLIENT_ORIGIN`).

## Prerequisites

- Node.js 20+ recommended
- npm 10+
- Optional for persistent storage: local MongoDB instance on `127.0.0.1:27017`

## Environment

Server env file: `server/.env`

Default values:

```env
PORT=5000
HOST=127.0.0.1
MONGO_URI=mongodb://127.0.0.1:27017/mdtechactive
MONGO_TIMEOUT_MS=5000
CLIENT_ORIGIN=http://127.0.0.1:5173
```

If MongoDB is unavailable, the server gracefully falls back to in-memory mode for game room flows.

## Install

```bash
cd server
npm install

cd ../client
npm install
```

## Run Locally

Use two terminals.

Terminal 1 (API):

```bash
cd server
npm run dev
```

Terminal 2 (Client):

```bash
cd client
npm run dev
```

Local URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:5000`
- Health endpoint: `http://127.0.0.1:5000/api/health`

## Verify Key Phases

### Phase 4 (Frontend + Bootstrap)

- Bootstrap CSS/JS imported in `client/src/main.jsx`
- Base layout includes navbar, footer, cards, and buttons

### Phase 5 (Frontend to Backend)

- API utility at `client/src/services/api.js`
- Home page calls `/api/health`
- Loading and error states handled in `client/src/pages/HomePage.jsx`

### Phase 6 (Mongo + CRUD Foundation)

- DB connector: `server/src/config/db.js`
- Startup connection attempt: `server/server.js`
- Sample model: `server/src/models/SampleItem.js`
- Sample CRUD controller: `server/src/controllers/sampleItemController.js`
- Sample CRUD route: `server/src/routes/sampleItemRoutes.js`

Sample CRUD endpoints:

- `GET /api/sample-items`
- `GET /api/sample-items/:id`
- `POST /api/sample-items`
- `PATCH /api/sample-items/:id`
- `DELETE /api/sample-items/:id`

### Phase 7 (Local Testing)

- Host/join flow available via frontend routes:
  - `/host`
  - `/host/:roomCode`
  - `/join/:roomCode`

## Additional Implementation Notes (Phase 8)

Guidance from the provided Brave link was applied for:

- Installing Bootstrap in the React client
- Importing Bootstrap assets at the entry point
- Using Bootstrap utility/component classes for layout

Where guidance conflicts, this project follows official docs conventions for React, Bootstrap, Express, and MongoDB/Mongoose.
