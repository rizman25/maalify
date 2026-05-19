-- RLS policies for custom categories (household-owned, non-default)
-- Default categories have household_id = NULL and are read-only for all users

-- Allow household members to read all categories (default + their custom)
-- (SELECT policy likely already exists, this ensures it covers inserts too)

-- INSERT: only admin/super_admin of the household can create custom categories
CREATE POLICY "categories_insert_admin"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    household_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = categories.household_id
        AND household_members.user_id = auth.uid()
        AND household_members.role IN ('admin', 'super_admin')
    )
  );

-- UPDATE: only admin/super_admin can edit their own household's custom categories
CREATE POLICY "categories_update_admin"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    household_id IS NOT NULL
    AND is_default = false
    AND EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = categories.household_id
        AND household_members.user_id = auth.uid()
        AND household_members.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    household_id IS NOT NULL
    AND is_default = false
  );

-- DELETE: only admin/super_admin can delete their own household's custom categories
CREATE POLICY "categories_delete_admin"
  ON categories FOR DELETE
  TO authenticated
  USING (
    household_id IS NOT NULL
    AND is_default = false
    AND EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = categories.household_id
        AND household_members.user_id = auth.uid()
        AND household_members.role IN ('admin', 'super_admin')
    )
  );
