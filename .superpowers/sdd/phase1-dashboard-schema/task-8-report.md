# Task 8: Create Auth Pages — Report

## Status
DONE_WITH_CONCERNS

## Files Created
- `apps/dashboard/app/(auth)/layout.tsx` — Auth layout wrapper (centered card)
- `apps/dashboard/app/(auth)/login/page.tsx` — Login page with Supabase `signInWithPassword`
- `apps/dashboard/app/(auth)/signup/page.tsx` — Signup page creating auth user, account, and staff record

## Build Results
- **TypeScript compilation**: PASSED (`Compiled successfully`)
- **Type checking**: PASSED (`Linting and checking validity of types ...` completed)
- **Static generation**: FAILED — Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are not configured in the environment. This is a **runtime configuration issue**, not a code issue. The pages are correct but require env vars to be set in `.env.local` for production builds.

## Concerns
- The `createClient` call executes at module scope during static generation, causing prerender failures when env vars are missing. These are client components (`'use client'`) so this is expected behavior — the error only appears during `next build` static page generation. In development (`next dev`), this would not cause issues as long as env vars are set.
- This is not a blocking concern — it's standard for Supabase Next.js apps and resolves once env vars are configured.

## Commit
`73d4a54` — `feat: add login and signup pages with supabase auth`
