# PulseChat Production Deployment — Vercel

**Date:** 2026-08-05
**Status:** Approved

## Goal

Deploy PulseChat to production on Vercel so it is publicly accessible at `https://pulsechat.vercel.app`.

## Architecture

- **Hosting:** Vercel (Next.js native, free tier)
- **Domain:** Vercel subdomain (`pulsechat.vercel.app`)
- **Database/Auth:** Supabase (already cloud-hosted, no changes needed)
- **AI:** Gemini API (already cloud-hosted, no changes needed)
- **Repo:** GitHub — auto-deploy on push to `main`

## Changes Required

### 1. Fix hardcoded localhost in embed snippet

**File:** `apps/dashboard/app/dashboard/bots/[id]/page.tsx`

The embed snippet currently hardcodes `http://localhost:3000/widget.js`. Replace with `NEXT_PUBLIC_SITE_URL` env var, with a client-side fallback to `window.location.origin`.

```tsx
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
const embedSnippet = `<script src="${siteUrl}/widget.js" data-bot-id="${botId}" async></script>`
```

Since the page is a client component, use `window.location.origin` as the default.

### 2. Add `NEXT_PUBLIC_SITE_URL` environment variable

New env var: `NEXT_PUBLIC_SITE_URL`

Set in Vercel dashboard to `https://pulsechat.vercel.app`.

### 3. Create `vercel.json` at project root

```json
{
  "buildCommand": "cd apps/dashboard && npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "rootDirectory": "apps/dashboard"
}
```

This tells Vercel to:
- Install deps from the monorepo root
- Build from the dashboard app
- Use Next.js framework detection

### 4. Environment variables in Vercel

Set these in Vercel dashboard (Settings → Environment Variables):

| Variable | Value | Environment |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://qpwccmnrmfsqzixqbayf.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_YgeHYvy0DfzDdsxsgG4I1Q_q2a8zZ1L` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` (full key) | Production |
| `GEMINI_API_KEY` | `AQ.Ab8RN6...` (full key) | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://pulsechat.vercel.app` | Production |

### 5. Supabase redirect URLs

In Supabase dashboard → Authentication → URL Configuration:
- Add `https://pulsechat.vercel.app` to **Redirect URLs**
- This allows login/signup redirects to work in production

### 6. GitHub integration

Connect the GitHub repo (`AliHaiderBajwa/GenericMultiTenantChatBot` or `verxeon-ai/PulseChat`) to Vercel:
- Vercel auto-deploys on push to `main`
- Preview deployments on PRs

## Manual Steps (user)

1. Go to [vercel.com](https://vercel.com), sign in with GitHub
2. Import the PulseChat repo
3. Set root directory to `apps/dashboard` (or rely on `vercel.json`)
4. Add all 5 env vars in Vercel dashboard
5. Deploy
6. In Supabase dashboard, add the Vercel URL to redirect URLs
7. Test login, bot creation, widget embed on a test HTML page

## Scope

- 2 code files changed (`bots/[id]/page.tsx`, new `vercel.json`)
- 1 new env var (`NEXT_PUBLIC_SITE_URL`)
- Manual Vercel + Supabase dashboard configuration
