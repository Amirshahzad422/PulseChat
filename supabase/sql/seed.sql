-- Sample accounts
INSERT INTO accounts (id, name, email) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Acme Corp', 'admin@acme.com'),
  ('a2222222-2222-2222-2222-222222222222', 'TechStart', 'info@techstart.com');

-- Sample bots
INSERT INTO bots (id, account_id, name, brand_color, welcome_message) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Acme Bot', '#3B82F6', 'Hello! I''m Acme Bot. How can I help?'),
  ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'TechBot', '#10B981', 'Hi! I''m TechBot. Ask me anything!');
