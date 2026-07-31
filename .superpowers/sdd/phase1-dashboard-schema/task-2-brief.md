# Task 2: Create Database Schema SQL

## Goal
Create SQL scripts for the Supabase database schema, seed data, and RLS policies.

## Files to Create
- `supabase/sql/schema.sql`
- `supabase/sql/seed.sql`
- `supabase/sql/policies.sql`

## Requirements

### 1. schema.sql
Create all tables with proper constraints and indexes:

```sql
-- PulseChat Multi-Tenant Schema

-- 1. ACCOUNTS (businesses)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STAFF (users linked to accounts)
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, user_id)
);

-- 3. BOTS (per-account chatbots)
CREATE TABLE bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand_color TEXT DEFAULT '#3B82F6',
  avatar_url TEXT,
  welcome_message TEXT DEFAULT 'Hello! How can I help you?',
  persona_instructions TEXT DEFAULT 'You are a helpful assistant.',
  position TEXT DEFAULT 'bottom-right' CHECK (position IN ('bottom-right', 'bottom-left')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. KNOWLEDGE_SOURCES (documents/URLs per bot)
CREATE TABLE knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('document', 'url')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(768),
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CONVERSATIONS
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  visitor_session TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MESSAGES
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('visitor', 'bot')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bots_account_id ON bots(account_id);
CREATE INDEX idx_knowledge_bot_id ON knowledge_sources(bot_id);
CREATE INDEX idx_conversations_bot_id ON conversations(bot_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- pgvector index
CREATE INDEX idx_knowledge_embedding ON knowledge_sources 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### 2. seed.sql
Create sample data for testing:

```sql
-- Sample accounts
INSERT INTO accounts (id, name, email) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Acme Corp', 'admin@acme.com'),
  ('a2222222-2222-2222-2222-222222222222', 'TechStart', 'info@techstart.com');

-- Sample bots
INSERT INTO bots (id, account_id, name, brand_color, welcome_message) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Acme Bot', '#3B82F6', 'Hello! I''m Acme Bot. How can I help?'),
  ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'TechBot', '#10B981', 'Hi! I''m TechBot. Ask me anything!');
```

### 3. policies.sql
Create RLS policies for multi-tenant isolation:

```sql
-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Bots: users can only see their account's bots
CREATE POLICY "Users see own account bots" ON bots
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM staff WHERE user_id = auth.uid()
    )
  );

-- Knowledge: users can only see their account's knowledge
CREATE POLICY "Users see own account knowledge" ON knowledge_sources
  FOR SELECT USING (
    bot_id IN (
      SELECT id FROM bots WHERE account_id IN (
        SELECT account_id FROM staff WHERE user_id = auth.uid()
      )
    )
  );

-- Conversations: users can only see their account's conversations
CREATE POLICY "Users see own account conversations" ON conversations
  FOR SELECT USING (
    bot_id IN (
      SELECT id FROM bots WHERE account_id IN (
        SELECT account_id FROM staff WHERE user_id = auth.uid()
      )
    )
  );

-- Messages: users can only see messages in their account's conversations
CREATE POLICY "Users see own account messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE bot_id IN (
        SELECT id FROM bots WHERE account_id IN (
          SELECT account_id FROM staff WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Widget: public read access to active bot config only
CREATE POLICY "Widget can read active bots" ON bots
  FOR SELECT USING (status = 'active');
```

## Verification
1. Verify all three files exist in `supabase/sql/`
2. Check SQL syntax is valid (no obvious errors)

## Commit
```bash
git add supabase/sql/
git commit -m "feat: add database schema, seed, and RLS policies"
```
