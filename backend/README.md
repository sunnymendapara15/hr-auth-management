# Backend API

## Setup

1. `cd backend`
2. Copy `.env.example` to `.env` and provide a secure `JWT_SECRET`.
3. `npm install`

## Scripts

- `npm run dev` – start with nodemon for iterative development.
- `npm start` – run the production server.

## Environment variables

- `JWT_SECRET` – secret string for signing JWTs.
- `PORT` – server port (default 4000).
- `ALLOWED_ORIGINS` – comma-separated browsers allowed via CORS (defaults to http://localhost:3000).

## Endpoints

- `POST /api/auth/signup` – register and get a token.
- `POST /api/auth/login` – authenticate.
- `GET /api/users` – list users (requires `Authorization: Bearer token`).
- `POST /api/users` – create a user (authenticated).
- `PUT /api/users/:id` – update user metadata or password.
- `DELETE /api/users/:id` – delete a user.
