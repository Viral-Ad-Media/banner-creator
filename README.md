# Social Studio SaaS

Full-stack social creative SaaS for generating banner plans, producing AI backgrounds, and editing images, with authenticated users, usage metering, and plan-based limits.

Current workspace layout:

- Frontend repo: `banner-creator/`
- Backend app: `../banner-creator-backend/`

## Features

- Supabase Auth (email/password) for signup, login, and session persistence
- Protected backend API (Gemini key never exposed to browser)
- Banner campaign planning with structured JSON output
- Image generation and image editing workflows
- Project and generation history persistence
- Monthly credit metering per plan tier
- Mock billing upgrade and customer portal endpoints
- Public SaaS pages (`Home`, `Features`, `Pricing`, `About`, `Contact`, `Privacy`, `Terms`)
- Route-based app shell with protected `/app` workspace and dedicated `/auth` (login/signup)

## Architecture

### Frontend

- React 19 + TypeScript + Vite
- React Router for public and protected route management
- Supabase JS client for auth/session
- Backend API client for app data and generation calls

### Backend

- Express + TypeScript
- Supabase Postgres for application data
- Supabase Auth token verification via service role
- Gemini API integration through `@google/genai`
- Zod request validation and centralized error handling

### Data + Auth Flow

1. User signs in from frontend via Supabase Auth (`signInWithPassword` / `signUp`).
2. Frontend sends Supabase access token as `Authorization: Bearer ...` to backend.
3. Backend validates token with Supabase Admin API.
4. Backend creates/loads user profile in `app_users`.
5. Protected routes use `req.auth.userId` + `req.auth.plan`.

## Workspace Structure

```text
banner-maker/
├── banner-creator/
│   ├── App.tsx
│   ├── .env.example
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.ts
└── banner-creator-backend/
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    ├── supabase/schema.sql
    └── src/
```

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project
- Gemini API key

## Supabase Setup

1. Create a new Supabase project.
2. Open Supabase SQL editor.
3. Run the SQL in `../banner-creator-backend/supabase/schema.sql`.
4. In Supabase Auth settings:
   - Enable Email provider.
   - For local testing, disable email confirmation if you want immediate sign-in after signup.

## Environment Variables

### Frontend (`.env.local` at repo root)

Start from `.env.example`:

```bash
cp .env.example .env.local
```

Set:

```bash
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=http://localhost:4000
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Backend (`../banner-creator-backend/.env`)

Start from `../banner-creator-backend/.env.example`:

```bash
cp ../banner-creator-backend/.env.example ../banner-creator-backend/.env
```

Set:

```bash
NODE_ENV=development
PORT=4000
GEMINI_API_KEY=your-gemini-api-key
CORS_ORIGIN=http://localhost:3000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Local Development

1. Install dependencies:

```bash
npm install
npm --prefix ../banner-creator-backend install
```

2. Start backend:

```bash
npm run backend:dev
```

3. Start frontend:

```bash
npm run dev
```

4. Open:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## Build + Run

Frontend:

```bash
npm run typecheck
npm run build
npm run preview
```

Backend:

```bash
npm run backend:typecheck
npm run backend:build
npm run backend:start
```

## Deploy to Vercel (Required Steps)

With the current split layout, deploy the frontend and backend as **two separate projects**:

- `social-studio-web` from `banner-creator/`
- `social-studio-api` from `banner-creator-backend/`

### 1. Prepare production services

1. Create a production Supabase project.
2. Run the SQL in `../banner-creator-backend/supabase/schema.sql` in Supabase SQL Editor.
3. Get production keys:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Create/confirm your production Gemini API key.

### 2. Deploy backend project on Vercel

1. In Vercel, create a new project from the backend source directory or backend repo.
2. Set **Root Directory** to `banner-creator-backend` (or use the backend repo directly if it is split out).
3. Keep install/build defaults (`npm install`, `npm run build`).
4. Add backend environment variables:
   - `NODE_ENV=production`
   - `PORT=4000`
   - `GEMINI_API_KEY=...`
   - `SUPABASE_URL=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...`
   - `CORS_ORIGIN=https://<your-frontend-domain>`
5. Deploy and verify:
   - `https://<api-domain>/api/health` returns status JSON.

### 3. Deploy frontend project on Vercel

1. Create another Vercel project from the frontend source directory or frontend repo.
2. Set **Root Directory** to `banner-creator`.
3. Add frontend environment variables:
   - `VITE_API_BASE_URL=https://<api-domain>/api`
   - `VITE_BACKEND_URL=https://<api-domain>` (kept for proxy compatibility)
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`
4. Deploy.
5. Confirm deep-link routes work (`/pricing`, `/auth`, `/app`) using [`vercel.json`](vercel.json).

### 4. Post-deploy checks

1. Open frontend and complete signup/login.
2. Confirm authenticated APIs work:
   - `GET /api/auth/me`
   - `POST /api/generations/plan`
3. Verify CORS is correct (frontend domain allowed by backend `CORS_ORIGIN`).
4. Trigger one generation and confirm rows appear in Supabase tables (`app_users`, `generations`, `usage_events`).

### 5. Production hardening checklist

1. Rotate all placeholder secrets and use production-only values.
2. Configure Supabase Auth email templates and redirect URLs.
3. Add custom domains for web + api projects.
4. Replace mock billing endpoints with real Stripe checkout + webhooks.
5. Add monitoring/alerts (Vercel + Supabase logs).

## Frontend Routes

Public pages:

- `/`
- `/features`
- `/pricing`
- `/about`
- `/contact`
- `/privacy`
- `/terms`

Authentication:

- `/auth` (login)
- `/auth?mode=register` (signup)

Protected app:

- `/app`

## API Reference

Base URL: `/api`

### Health

- `GET /health`

### Auth (requires bearer token)

- `GET /auth/me`
- `PATCH /auth/me`

`PATCH /auth/me` body:

```json
{
  "name": "Updated Name"
}
```

### Projects (requires bearer token)

- `GET /projects`
- `POST /projects`
- `GET /projects/:projectId`
- `PATCH /projects/:projectId`
- `DELETE /projects/:projectId`

`POST /projects` body:

```json
{
  "name": "Campaign Q2",
  "prompt": "Summer campaign",
  "aspectRatio": "1:1",
  "data": {}
}
```

### Generations (requires bearer token)

- `GET /generations`
- `POST /generations/plan`
- `POST /generations/image`
- `POST /generations/edit`

`POST /generations/plan` body:

```json
{
  "userPrompt": "Launch campaign for product X",
  "aspectRatio": "1:1",
  "hasBackgroundImage": false,
  "hasAssetImage": false,
  "projectId": "optional-uuid"
}
```

`POST /generations/image` body:

```json
{
  "prompt": "Luxury product shot with natural light",
  "aspectRatio": "1:1",
  "referenceImages": [],
  "projectId": "optional-uuid"
}
```

`POST /generations/edit` body:

```json
{
  "base64Image": "data:image/png;base64,...",
  "prompt": "Make background warm and cinematic",
  "projectId": "optional-uuid"
}
```

### Billing (requires bearer token)

- `GET /billing/summary`
- `POST /billing/checkout-session` (mock)
- `POST /billing/portal-session` (mock)

`POST /billing/checkout-session` body:

```json
{
  "plan": "PRO"
}
```

## Plan and Credit Model

Plan tiers:

- `FREE`: 120 monthly credits, 5 projects
- `PRO`: 3000 monthly credits, 100 projects
- `ENTERPRISE`: 50000 monthly credits, 1000 projects

Credit costs:

- `BANNER_PLAN`: 3 credits
- `IMAGE_GENERATION`: 5 credits
- `IMAGE_EDIT`: 5 credits

Usage is tracked in `usage_events` and rolled up monthly by backend logic.

## Security Notes

- Gemini API key is backend-only.
- Backend validates Supabase JWT per request.
- Rate limiting enabled on `/api` and stricter on `/api/auth`.
- Schema includes RLS policies for user-scoped access.

## Billing Status

Billing endpoints are currently mock implementations for SaaS flow wiring.

To productionize billing:

1. Integrate Stripe checkout + customer portal.
2. Add webhook processing for subscription lifecycle.
3. Sync subscription status and plan transitions from webhooks.

## Troubleshooting

- `401 Invalid or expired token`: verify Supabase frontend keys and active session.
- `Backend environment validation failed`: check `../banner-creator-backend/.env` against `../banner-creator-backend/.env.example`.
- `Monthly credit limit reached`: upgrade plan via billing endpoint or adjust limits in `../banner-creator-backend/src/config/plans.ts`.
- Signup requires email confirmation: disable confirmation for local testing or confirm inbox first.
