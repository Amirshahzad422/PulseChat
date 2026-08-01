-- Phase 5: Allow anonymous widget to create conversations for active bots
CREATE POLICY "Widget can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    bot_id IN (SELECT id FROM bots WHERE status = 'active')
  );
