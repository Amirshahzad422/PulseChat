-- Drop existing policies first
DROP POLICY IF EXISTS "Users see own account bots" ON bots;
DROP POLICY IF EXISTS "Users see own account knowledge" ON knowledge_sources;
DROP POLICY IF EXISTS "Users see own account conversations" ON conversations;
DROP POLICY IF EXISTS "Users see own account messages" ON messages;
DROP POLICY IF EXISTS "Widget can read active bots" ON bots;

-- ACCOUNTS policies
CREATE POLICY "Authenticated users can create accounts" ON accounts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view own account" ON accounts
  FOR SELECT USING (
    id IN (
      SELECT account_id FROM staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own account" ON accounts
  FOR UPDATE USING (
    id IN (
      SELECT account_id FROM staff WHERE user_id = auth.uid()
    )
  );

-- STAFF policies
CREATE POLICY "Authenticated users can create staff" ON staff
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users see own account staff" ON staff
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM staff WHERE user_id = auth.uid()
    )
  );

-- BOTS policies
CREATE POLICY "Widget can read active bots" ON bots
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users see own account bots" ON bots
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bots" ON bots
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own bots" ON bots
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own bots" ON bots
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM staff WHERE user_id = auth.uid()
    )
  );

-- KNOWLEDGE_SOURCES policies
CREATE POLICY "Users see own account knowledge" ON knowledge_sources
  FOR SELECT USING (
    bot_id IN (
      SELECT id FROM bots WHERE account_id IN (
        SELECT account_id FROM staff WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create knowledge" ON knowledge_sources
  FOR INSERT WITH CHECK (
    bot_id IN (
      SELECT id FROM bots WHERE account_id IN (
        SELECT account_id FROM staff WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own knowledge" ON knowledge_sources
  FOR DELETE USING (
    bot_id IN (
      SELECT id FROM bots WHERE account_id IN (
        SELECT account_id FROM staff WHERE user_id = auth.uid()
      )
    )
  );

-- CONVERSATIONS policies
CREATE POLICY "Users see own account conversations" ON conversations
  FOR SELECT USING (
    bot_id IN (
      SELECT id FROM bots WHERE account_id IN (
        SELECT account_id FROM staff WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    bot_id IN (
      SELECT id FROM bots WHERE account_id IN (
        SELECT account_id FROM staff WHERE user_id = auth.uid()
      )
    )
  );

-- MESSAGES policies
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

CREATE POLICY "Widget can insert messages" ON messages
  FOR INSERT WITH CHECK (true);
