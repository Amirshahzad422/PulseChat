# Task 2.2 - Create Bot Page

## Status: Complete

## What was created
`apps/dashboard/app/dashboard/bots/new/page.tsx`

## Implementation details
- Client component (`'use client'`) using browser Supabase client
- Form fields: Name, Brand Color (color picker + text), Avatar URL, Welcome Message, Persona Instructions, Position (select)
- Fetches user auth, then staff record to get `account_id`
- Inserts into `bots` table with status `active`
- Redirects to `/dashboard/bots` on success
- Error handling with inline message display
- Tailwind CSS styling consistent with existing pages (e.g., `bots/page.tsx`)

## Dependencies
- `@/lib/supabase/client` (browser Supabase client)
- `next/link`, `next/navigation` (routing)
- `lucide-react` (ArrowLeft, Bot icons)
- `react` (useState, FormEvent)
