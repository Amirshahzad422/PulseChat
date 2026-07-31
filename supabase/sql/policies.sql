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
