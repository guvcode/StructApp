# Render Deployment Guide

## Architecture

| Component | Service Type | Root Directory |
|---|---|---|
| API Server | Web Service | `apps/api-server` |
| Frontend | Static Site | `apps/web-client` |
| Database | Supabase (existing) | — |

## Prerequisites

- GitHub repo with this codebase pushed
- Supabase project with `DATABASE_URL` connection string
- Render account (free tier works)

## Files

- `render.yaml` — Blueprint definition for both services
- `apps/api-server/.env.example` — documents required environment variables

## Deployment Steps

### 1. Push to GitHub

```bash
git add render.yaml deploy/
git commit -m "Add Render deployment config and guide"
git push origin main
```

### 2. Deploy via Render Blueprint (recommended)

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Blueprint**
3. Connect your GitHub repo
4. Render reads `render.yaml` and creates both services automatically
5. Before the first deploy completes, set the secret env var:

| Variable | Where to set | Value |
|---|---|---|
| `DATABASE_URL` | API server → Environment | Your Supabase connection string ending with `?sslmode=require` |
| `JWT_ACCESS_SECRET` | Auto-generated | — |
| `JWT_REFRESH_SECRET` | Auto-generated | — |

### 3. Manual deploy (alternative to Blueprint)

#### API Server

1. **New +** → **Web Service**
2. Connect repo → name: `structapp-api`
3. **Root Directory**: `apps/api-server`
4. **Build Command**: `npm install`
5. **Start Command**: `npm run start`
6. **Plan**: Free
7. Add environment variables:

| Key | Value |
|---|---|
| `DATABASE_URL` | Supabase connection string |
| `JWT_ACCESS_SECRET` | Random string (generate via `openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | Random string |
| `CORS_ORIGIN` | Set after frontend deploys (see below) |
| `NODE_ENV` | `production` |

#### Frontend

1. **New +** → **Static Site**
2. Connect repo → name: `structapp-web-client`
3. **Root Directory**: `apps/web-client`
4. **Build Command**: `npm install && npm run build`
5. **Publish Directory**: `dist`
6. Add environment variables:

| Key | Value |
|---|---|
| `VITE_API_URL` | The URL of your API server (e.g. `https://structapp-api.onrender.com`) |

7. After deploy, update the API server's `CORS_ORIGIN` to the frontend URL

### 4. Run Database Migrations

After the API server deploys, run migrations via **Render Shell** or a one-off script:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx node_modules/node-pg-migrate/bin/node-pg-migrate up
```

Or using the package script:

```bash
npm run migrate:prod
```

Then seed the default data:

```bash
npm run seed
```

## Environment Variables

### API Server (`apps/api-server`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens |
| `CORS_ORIGIN` | Yes | Frontend URL (e.g. `https://structapp-web-client.onrender.com`) |
| `NODE_ENV` | No | Defaults to `production` |
| `PORT` | No | Render sets this automatically |

### External services

These are not hosted on Render — set their env vars in the Render dashboard:

**Cloudinary** (image hosting)
1. Create account at [cloudinary.com](https://cloudinary.com) (free tier — 25GB storage)
2. Copy `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` from dashboard
3. Add as env vars to the API server in Render

**Resend** (email notifications)
1. Create account at [resend.com](https://resend.com) (free tier — 100 emails/day)
2. Generate API key → copy `re_xxxx`
3. Add `RESEND_API_KEY` as env var to the API server in Render

**AWS S3** (report storage, optional)
1. Create S3 bucket in AWS Console
2. Generate IAM credentials with `s3:PutObject` / `s3:GetObject`
3. Add `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME` as env vars

### Frontend (`apps/web-client`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend API URL (e.g. `https://structapp-api.onrender.com`) — **must be set manually** in the Render dashboard; `fromService` references do not work for static sites |

### Important: Set VITE_API_URL manually

After the frontend deploys, go to Render Dashboard → structapp-web-client → Environment → add `VITE_API_URL` with the value of your API server URL (e.g. `https://structapp-api.onrender.com`). Then trigger a manual deploy (Deploy → Clear build cache & deploy).

## Post-Deploy Verification

1. **Health check**: `https://<api-server-url>/health` → `{"status":"ok"}`
2. **Login**: Frontend login page at `https://<frontend-url>/login`
3. **API test**: `POST /api/v1/auth/login` with admin credentials from seed

## Supabase Network Configuration

If the API server cannot connect to Supabase:

1. Go to your Supabase project → **Settings** → **Database**
2. Under **Connection parameters**, note the connection string
3. If `?sslmode=require` is missing, append it
4. If Supabase has IP restrictions, add Render's outbound IP or disable the pooler restriction

## Notes

- Render free tier services **spin down after 15 minutes of inactivity** (cold start ~30s)
- The frontend static site does not spin down
- For zero-downtime and no cold starts, upgrade to a paid plan ($7/mo per service)
- Migrations must be run manually after deploy (not automated via `postDeploy` due to shell limitations)
- Dependencies are hoisted to the root `node_modules` — the build commands navigate up from `rootDir` to install at the project root before building
