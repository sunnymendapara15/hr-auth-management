# HR Auth Management Portal

This repository implements the Trello tickets created on [my Trello board](https://trello.com/b/4US9iliw/my-trello-board) inside the new **HR Tasks** list. It contains backend APIs and a React-based frontend for the HR authentication experience.

## Trello context

- Board: `my-trello-board`
- List: `HR Tasks`
- Cards added:
  1. HR login
  2. HR signup
  3. HR user CRUD

## Project structure

- `backend/` — Express + SQLite API with JWT authentication.
- `frontend/` — Create React App that talks to the backend.

## Backend quick start

1. `cd backend`
2. Copy `.env.example` to `.env` and set a strong `JWT_SECRET` (and `ALLOWED_ORIGINS` if needed).
3. `npm install`
4. `npm run dev` (or `npm start` for production)

The API exposes `/api/auth` for login/signup and `/api/users` for authenticated user management.

## Frontend quick start

1. `cd frontend`
2. `npm install`
3. `npm start` (proxied to the backend at `http://localhost:4000` by default)

Use the supplied forms to register, log in, and manage HR users.
