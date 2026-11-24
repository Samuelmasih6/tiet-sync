# TIET-Sync — Thapar Academic OS

TIET-Sync is a React + Java/Spring Boot academic-management platform rebuilt from the supplied reference project. It preserves the reference’s restrained Thapar-maroon academic design while replacing its Express JSON store and browser-local state with PostgreSQL, Flyway, BCrypt, JWT authentication, and role-aware APIs.

> Seeded rooms, faculty information, directions, dates, and resources are **demonstration data**, not verified official TIET data. Verify them before operational use.

## Features

- Separate student and faculty portals, BCrypt passwords, JWT sessions, protected navigation, and faculty approval-on-registration.
- Student overview, assignment CRUD, 75% attendance monitor, persistent academic calendar/resource catalogue, classroom search, faculty directory, and consultation booking.
- Faculty consultation approval/rejection and availability-slot API.
- PostgreSQL UUID identifiers, foreign keys, unique constraints, indices, Flyway migrations, CORS, Actuator health, and OpenAPI UI.

## Architecture

```text
Browser → Vercel (React/Vite) → HTTPS REST → Render (Spring Boot) → Render PostgreSQL
```

## Local setup (Omarchy/Linux)

Prerequisites: Java 21, Maven 3.9+, Node 20+, Docker/Compose.

```bash
cp .env.example .env
docker compose up -d postgres
cd backend && mvn clean verify && mvn spring-boot:run
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173`. The API is `http://localhost:8080/api/v1`, health is `http://localhost:8080/actuator/health`, and Swagger is `http://localhost:8080/swagger-ui.html`.

Local demo accounts (only):

- Student: `student.demo@thapar.edu` / `demo123`
- Faculty: `faculty.demo@thapar.edu` / `demo123`

Faculty self-registration creates an unapproved account; approve it directly through an administrative workflow/database in a real deployment. This intentionally prevents arbitrary users from becoming active faculty.

## Environment

Copy `.env.example`; never commit its real values. For local Spring Boot running directly on the host, `DATABASE_URL` is `jdbc:postgresql://localhost:5433/tiet_sync`: Compose maps host port 5433 to PostgreSQL's unchanged container port 5432, avoiding a conflict with another local PostgreSQL container. The Compose `backend` service instead uses `jdbc:postgresql://postgres:5432/tiet_sync`, where `postgres` is the Compose service hostname. Set `JWT_SECRET` to a unique 32+ character secret and `FRONTEND_URL` to the exact Vercel origin once created. Frontend production needs `VITE_API_BASE_URL=https://YOUR-RENDER-HOST/api/v1`.

## Deployment

1. Create Render PostgreSQL, then a Render web service from `render.yaml`. Enter `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `JWT_SECRET`, and later `FRONTEND_URL` in Render’s environment panel. Render supplies `PORT`; the application honors it. Flyway runs automatically.
2. Import `frontend/` in Vercel, set build command `npm run build`, output `dist`, and set `VITE_API_BASE_URL` to your actual Render URL plus `/api/v1`.
3. Update Render’s `FRONTEND_URL` to the actual Vercel URL and redeploy the backend. Do not use the example host in this README as a live URL.

Direct navigation works via `frontend/vercel.json` SPA fallback.

## Tests and build status

The frontend production build was executed successfully in this workspace. Maven is not installed on this machine, so `mvn clean verify` has not been executed here; use the command above or the provided Dockerfile to build the backend.

## GitHub

The reference repository is left intact. To publish this new root only after reviewing changes:

```bash
git init
git add .
git commit -m "Build TIET-Sync academic platform"
git branch -M main
git remote add origin YOUR_NEW_REPOSITORY_URL
git push -u origin main
```
