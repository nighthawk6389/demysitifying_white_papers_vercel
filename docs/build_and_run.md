# Build and Run Guide

This project is a Vite + React app located in `web/`.

## Prerequisites

- Node.js 20+ (Node 18 also works for most setups)
- npm 9+

## Local development

From the repository root:

```bash
cd web
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## Production build (local)

```bash
cd web
npm install
npm run build
npm run preview
```

- Build output: `web/dist`
- Preview URL: typically `http://localhost:4173`

## Deploying to Vercel (fix for first-launch 404)

A common first-launch 404 on Vercel happens when:

1. Vercel builds from the repository root instead of `web/`, or
2. SPA routes are not rewritten to `index.html`.

This repository includes a root `vercel.json` that:

- installs/builds using `web/`
- serves `web/dist`
- rewrites all routes to `index.html` so client-side routing works

### Vercel project settings checklist

If you configure through the Vercel UI, verify:

- **Framework Preset**: Vite (or Other)
- **Root Directory**: `.` (keep default, because `vercel.json` handles `web/`)
- **Install Command**: auto from `vercel.json`
- **Build Command**: auto from `vercel.json`
- **Output Directory**: auto from `vercel.json`

Then redeploy.

## Troubleshooting 404s

- If `/` 404s: confirm the deployment produced `web/dist/index.html`.
- If deep links 404 (for example `/paper/123`): confirm rewrite to `/index.html` is active.
- If build fails: run `cd web && npm run build` locally first and fix TypeScript/Vite errors.
