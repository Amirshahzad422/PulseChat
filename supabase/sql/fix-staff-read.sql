-- Simple fix: allow authenticated users to read their own staff record
DROP POLICY IF EXISTS "Users see own account staff" ON staff;
DROP POLICY IF EXISTS "Authenticated users can create staff" ON staff;

-- Allow authenticated users to read staff records where they are the user
CREATE POLICY "Users read own staff" ON staff
  FOR SELECT USING (user_id = auth.uid());

-- Allow authenticated users to insert staff records (for signup)
CREATE POLICY "Authenticated users can create staff" ON staff
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to read their account
DROP POLICY IF EXISTS "Users can view own account" ON accounts;
CREATE POLICY "Users can view own account" ON accounts
  FOR SELECT USING (
    id IN (SELECT account_id FROM staff WHERE user_id = auth.uid())
  );
