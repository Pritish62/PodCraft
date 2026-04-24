# PodCraft

PodCraft is an AI podcast script workspace where you can go from idea to a polished draft in one flow.

It is built for quick iteration: write your topic brief, generate a script, tweak specific lines, compare versions, and keep everything saved per user.

## Live Demo

- Frontend: https://pod-craft25.vercel.app/
# Screnshot 

https://github.com/Pritish62/PodCraft/blob/a8228ffc5ed8e4ae8b95abe9c2e96b73288aee7f/Screenshot%202026-04-24%20113536.png

## What You Can Do

- Sign up and log in securely.
- Create a new project from the sidebar.
- Fill your brief with topic and topic details.
- Choose language, tone, and number of hosts.
- Generate a script with Gemini.
- Regenerate to create version history (`v1`, `v2`, ...).
- Switch to any version using version pills.
- Select any output text and edit it via the inline highlight popup.
- Save project updates to the backend.
- Download the current visible output as a `.txt` file.
- Browse and search recent projects from the sidebar.
- Use built-in confirmation popups for logout and missing options.

## Stack

- Frontend: React + Vite + Tailwind CSS + Framer Motion + Axios
- Backend: Node.js + Express + MongoDB (Mongoose)
- Authentication: JWT (Bearer token)
- AI Generation: Google Gemini API

## Project Structure

This repo has two apps:

- `frontend` -> React client
- `Backend` -> Express API server

## Prerequisites

- Node.js 18+
- npm
- MongoDB connection string
- Gemini API key

## Environment Setup

### 1) Backend env (`Backend/.env`)

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

### 2) Frontend env (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
```

## Install

From the project root:

```bash
cd Backend && npm install
cd ../frontend && npm install
```

## Run Locally

Open two terminals from the project root.

Backend terminal:

```bash
cd Backend
npm run dev
```

Frontend terminal:

```bash
cd frontend
npm run dev
```

Frontend usually runs at `http://localhost:5173`.

## Build and Checks

Frontend production build:

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
- `GET /api/history`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PUT /api/projects/:projectId`
- `POST /api/projects/generate`

## Typical User Flow

1. Sign up or log in.
2. Click **New Project**.
3. Enter topic and details.
4. Select language, tone, and hosts.
5. Click **Generate Answer**.
6. Regenerate if needed to create more versions.
7. Switch between `v1`, `v2`, and later versions.
8. Highlight any output text, edit it, and apply changes.
9. Save the project.
10. Download the final script as `.txt`.

## Deployment Notes (Important)

- Frontend API URL must be set using `VITE_API_URL` in Vercel environment variables.
- The frontend environment source is `src/envirnment.js` (spelling is intentional in this project).
- If you see requests like `/undefined/api/...`, your `VITE_API_URL` is missing or not picked up at build time.
- Backend folder name is `Backend` (capital `B`). Keep that exact casing in local commands.
- Root `vercel.json` is configured for monorepo deployment and builds from `frontend`.

## Final Note

PodCraft is designed to feel practical: fast generation, easy revision, and version-safe editing without losing your earlier drafts.

