# PodCraft

PodCraft is an AI podcast script workspace.

You can:
- create and manage podcast projects
- generate scripts with Gemini
- regenerate and keep output versions (v1, v2, ...)
- roll back to older versions
- highlight any part of output and edit it quickly
- save your final draft to database
- download the current script as a `.txt` file

It includes authentication, user-specific project history, and a clean editor-style UI.

## Tech Stack

- Frontend: React + Vite + Tailwind + Framer Motion + Axios
- Backend: Node.js + Express + MongoDB (Mongoose)
- Auth: JWT
- AI: Google Gemini API

## Project Structure

This repository has two apps:

- `frontend` -> React client
- `Backend` -> Express API server

## Prerequisites

- Node.js 18+
- npm
- MongoDB connection string
- Gemini API key

## Environment Variables

Create a `.env` file inside `Backend`:

```env
MONGO_KEY=your_mongodb_connection_string
KEY=your_gemini_api_key
JWT_SECRET=your_strong_jwt_secret

# Optional
PORT=8000
JWT_EXPIRES_IN=7d
GEMINI_MODEL=gemini-2.5-flash
MAX_PROMPT_LENGTH=8000
```

Create a `.env` file inside `frontend` (optional if backend runs on `http://localhost:8000`):

```env
VITE_API_URL=http://localhost:8000
```

## Installation

From project root:

```bash
cd Backend && npm install
cd ../frontend && npm install
```

## Run Locally

Open two terminals from project root.

Terminal 1 (backend):

```bash
cd Backend
npm run dev
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

Frontend will run on Vite default URL, usually `http://localhost:5173`.

## Build

Frontend:

```bash
cd frontend
npm run build
```

Backend syntax check:

```bash
cd Backend
node --check server.js
```

## Main API Routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/projects`
- `POST /api/projects`
- `PUT /api/projects/:projectId`
- `POST /api/projects/generate`

## Typical Workflow

1. Sign up / log in.
2. Create a project and fill topic details.
3. Generate script.
4. Regenerate if needed and switch versions with pills (`v1`, `v2`, ...).
5. Edit specific lines using highlight popup.
6. Save project.
7. Download current version as `.txt`.

## Notes

- If `npm run build` fails in repository root, run it inside `frontend`.
- Folder name is `Backend` (capital `B`), use that exact path in commands.

