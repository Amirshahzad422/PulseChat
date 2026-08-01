# PulseChat Phase 5-8: Conversations, Staff, Reports, Settings

**Date:** 2026-08-01
**Status:** Approved design

## Overview

Complete the remaining 4 sections of the PulseChat admin dashboard that are currently dead links in the sidebar: Conversations, Staff, Reports, and Settings. These add the operational capabilities a production SaaS chat product needs: viewing chat history, managing the team, understanding usage, and configuring the account.

## Current State

- Bots, Knowledge Base, Dashboard (stats), and Chat Engine (Gemini + RAG) are complete
- Sidebar has 7 nav items; 4 routes return 404
- Server components with `createClient()` (server Supabase client) are the established pattern
- Lucide icons + Tailwind CSS styling throughout
- Auth via Supabase (email/password + OAuth)

## 1. Conversations

### Routes

- `GET /dashboard/conversations` — conversation list
- `GET /dashboard/conversations/[id]` — message thread viewer

### List page

Server component. Query `conversations` joined with `bots (name, brand_color)` and `messages (content, created_at)` ordered by `started_at desc`.

Features:
- **Bot filter**: dropdown of the account's bots; filters via `?bot=<id>` search param
- **Search**: text input filtering by `visitor_session` (ilike); `?q=` search param
- **Columns**: bot (name + color dot), visitor session, message count, last message preview (truncated), started date
- Row links to `/dashboard/conversations/[id]`
- Empty state when no conversations

### Thread viewer

Server component. Query conversation by id, verify it belongs to the account's bots. Fetch all `messages` ordered by `created_at asc`.

- Header: bot name/color, visitor session, started at, back link
- Chat-style bubbles: visitor right (blue), bot left (gray + avatar initial)
- Timestamps under each message
- 404/redirect if conversation doesn't belong to account

## 2. Staff Management

### Route

- `GET /dashboard/staff` — staff list + management UI

### DB migration

```sql
ALTER TABLE staff ADD COLUMN IF NOT EXISTS email TEXT;
```

### API

- `POST /api/staff/invite` — body `{ email, role }`. Uses service-role client to:
  1. Look up the user in `auth.users` by email via `supabase.auth.admin.listUsers()`
  2. Insert staff row `{ account_id, user_id, email, name, role }`
  - Errors: email not found → 404 "No user with that email"; already on team → 409
- `PATCH /api/staff/:id` — body `{ role }`. Changes a member's role.
- `DELETE /api/staff/:id` — removes a member (prevents removing/demoting the last owner)

### UI (client component for mutations, server fetch for list)

- Table: avatar initial + name, email, role dropdown (owner/editor/viewer), joined date, remove button
- "Add Member" form: email input + role select + submit
- Own row shows "You" badge; owner role is not self-removable
- Roles come from the existing `staff.role` CHECK constraint (`owner | editor | viewer`)

## 3. Reports & Analytics

### Route

- `GET /dashboard/reports` — full analytics dashboard

### Data (last 30 days)

Queries against `conversations`, `messages`, `bots` for the account:
- Total conversations, total messages, active bots, distinct visitors
- Daily message counts (30 buckets) for line chart
- Message counts per bot for bar chart + per-bot summary table (conversations, messages, avg messages per conversation)

### UI

- **Client component** for charts (recharts) fed data fetched server-side, passed as props
- Summary stat cards (4)
- Line chart: "Messages over time" (30 days)
- Bar chart: "Messages per bot"
- Table: per-bot breakdown
- **CSV export**: button generates CSV client-side from the data prop and triggers download (no server endpoint needed)

### Dependency

- Add `recharts` to `apps/dashboard/package.json`

## 4. Settings

### Routes

- `GET /dashboard/settings` — account settings page (single page)

### DB migration

```sql
CREATE TABLE IF NOT EXISTS account_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  default_welcome_message TEXT DEFAULT 'Hello! How can I help you?',
  default_brand_color TEXT DEFAULT '#3B82F6',
  default_persona TEXT DEFAULT 'You are a helpful assistant.',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API

- `PATCH /api/settings` — body `{ account_id, name?, default_welcome_message?, default_brand_color?, default_persona? }`. Updates `accounts.name` and upserts `account_settings`.
- Bot creation form reads `account_settings` defaults (server component query) and pre-fills new bot fields.

### UI

- Account card: name (editable), email (read-only), plan badge
- Bot defaults card: welcome message input, brand color picker, persona textarea
- Plan card: current plan, static upgrade info
- Save buttons call the settings API; success/failure feedback

## Error Handling

- All pages use the existing `createClient()` pattern; unauthorized → redirect to `/login` (already handled by middleware)
- Conversation thread that isn't the account's → not found message
- Staff invite errors surfaced inline (email not found, already a member)
- API routes return JSON errors with appropriate status codes

## Testing

- Build must pass (`npm run build`)
- Chrome MCP verification of each page after implementation:
  - Conversations: list renders, thread opens, bot filter works
  - Staff: list renders, invite a member, change role, remove member
  - Reports: charts render, CSV downloads
  - Settings: edit account name, update defaults, save
- Commit + push after each phase passes testing

## Out of Scope

- Stripe/payment integration (static plan info only)
- Email invitation delivery (simple user-id-based invite)
- Satisfaction/CSAT metrics
- Conversation search by message content (session-only search)
