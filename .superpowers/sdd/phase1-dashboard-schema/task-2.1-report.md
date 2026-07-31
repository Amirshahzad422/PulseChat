# Task 2.1 - Bot List Page

## Status: Complete

## What was built
Server-rendered page at `/dashboard/bots` listing all bots for the authenticated user's account.

## Implementation details
- **File**: `apps/dashboard/app/dashboard/bots/page.tsx`
- **Component**: `BotsPage` (async server component)
- **Data flow**: `supabase.auth.getUser()` → `staff` table (get `account_id`) → `bots` table (filter by `account_id`, ordered by `created_at` desc)
- **UI**: Table with Name (avatar + name), Status badge, Color swatch, Created date, Edit/Delete actions
- **Empty state**: Icon, message, and "Create Bot" CTA
- **Dependencies**: `lucide-react` (already in package.json), `@/lib/supabase/server`, `next/link`

## Notes
- Delete action is a placeholder (client-side confirm only) — will need a server action or API route in a future task
- Edit links to `/dashboard/bots/[id]` — detail/edit page not yet created
