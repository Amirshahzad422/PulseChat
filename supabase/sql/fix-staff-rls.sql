-- Fix staff RLS policy to allow users to read their own record
DROP POLICY IF EXISTS "Users see own account staff" ON staff;

-- Users can read their own staff record (needed to find their account_id)
CREATE POLICY "Users see own account staff" ON staff
  FOR SELECT USING (
    user_id = auth.uid()
    OR account_id IN (
      SELECT account_id FROM staff WHERE user_id = auth.uid()
    )
  );
