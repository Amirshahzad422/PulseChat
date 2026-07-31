# Task 5: Create TypeScript Types

## Goal
Create shared TypeScript types for the database schema.

## Files to Create
- `packages/shared/types/index.ts`
- `packages/shared/package.json`

## Requirements

### 1. packages/shared/types/index.ts
```typescript
// packages/shared/types/index.ts

export interface Account {
  id: string
  name: string
  email: string
  plan: 'free' | 'pro' | 'enterprise'
  created_at: string
}

export interface Staff {
  id: string
  account_id: string
  user_id: string
  name: string
  role: 'owner' | 'editor' | 'viewer'
  created_at: string
}

export interface Bot {
  id: string
  account_id: string
  name: string
  brand_color: string
  avatar_url: string | null
  welcome_message: string
  persona_instructions: string
  position: 'bottom-right' | 'bottom-left'
  status: 'active' | 'inactive'
  created_at: string
}

export interface KnowledgeSource {
  id: string
  bot_id: string
  source_type: 'document' | 'url'
  title: string
  content: string
  embedding?: number[]
  metadata: Record<string, unknown>
  uploaded_at: string
}

export interface Conversation {
  id: string
  bot_id: string
  visitor_session: string
  started_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'visitor' | 'bot'
  content: string
  created_at: string
}
```

### 2. packages/shared/package.json
```json
{
  "name": "@pulsechat/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./types/index.ts",
  "types": "./types/index.ts"
}
```

## Verification
1. Verify both files exist
2. Check that types match the database schema

## Commit
```bash
git add packages/shared/
git commit -m "feat: add shared TypeScript types"
```
