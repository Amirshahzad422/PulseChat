-- Phase 8: Settings
CREATE TABLE IF NOT EXISTS account_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  default_welcome_message TEXT DEFAULT 'Hello! How can I help you?',
  default_brand_color TEXT DEFAULT '#3B82F6',
  default_persona TEXT DEFAULT 'You are a helpful assistant.',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE account_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own account settings" ON account_settings
  FOR SELECT USING (
    account_id IN (SELECT account_id FROM staff WHERE user_id = auth.uid())
  );

CREATE POLICY "Users update own account settings" ON account_settings
  FOR UPDATE USING (
    account_id IN (SELECT account_id FROM staff WHERE user_id = auth.uid())
  );
