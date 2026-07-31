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

-- ACCOUNTS: authenticated users can create new accounts (signup)
CREATE POLICY "Authenticated users can create accounts" ON accounts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ACCOUNTS: users can update their own account
CREATE POLICY "Users can update own account" ON accounts
  FOR UPDATE USING (
    id IN (
      SELECT account_id FROM staff WHERE user_id = auth.uid()
    )
  );

-- STAFF: authenticated users can insert staff records (signup)
CREATE POLICY "Authenticated users can create staff" ON staff
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- STAFF: users can view staff in their account
CREATE POLICY "Users see own account staff" ON staff
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM staff WHERE user_id = auth.uid()
    )
  );

-- BOTS: users can insert bots in their account
CREATE POLICY "Users can create bots" ON bots
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM staff WHERE user_id = auth.uid()
    )
  );

-- BOTS: users can update their account's bots
CREATE POLICY "Users can update own bots" ON bots
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM staff WHERE user_id = auth.uid()
    )
  );

-- BOTS: users can delete their account's bots
CREATE POLICY "Users can delete own bots" ON bots
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM staff WHERE user_id = auth.uid()
    )
  );

-- KNOWLEDGE: users can insert knowledge in their account's bots
CREATE POLICY "Users can create knowledge" ON knowledge_sources
  FOR INSERT WITH CHECK (
    bot_id IN (
      SELECT id FROM bots WHERE account_id IN (
        SELECT account_id FROM staff WHERE user_id = auth.uid()
      )
    )
  );

-- KNOWLEDGE: users can delete their account's knowledge
CREATE POLICY "Users can delete own knowledge" ON knowledge_sources
  FOR DELETE USING (
    bot_id IN (
      SELECT id FROM bots WHERE account_id IN (
        SELECT account_id FROM staff WHERE user_id = auth.uid()
      )
    )
  );

-- CONVERSATIONS: users can insert conversations for their bots
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    bot_id IN (
      SELECT id FROM bots WHERE account_id IN (
        SELECT account_id FROM staff WHERE user_id = auth.uid()
      )
    )
  );

-- MESSAGES: users can insert messages in their conversations
CREATE POLICY "Users can create messages" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE bot_id IN (
        SELECT id FROM bots WHERE account_id IN (
          SELECT account_id FROM staff WHERE user_id = auth.uid()
        )
      )
    )
  );

-- MESSAGES: widget can insert messages (for chat)
CREATE POLICY "Widget can insert messages" ON messages
  FOR INSERT WITH CHECK (true);
