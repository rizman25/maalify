-- Migration 008: Multi-user Household Management
-- Run this in Supabase SQL Editor

-- Allow admins to update member roles
DROP POLICY IF EXISTS "admin can update member roles" ON public.household_members;
CREATE POLICY "admin can update member roles" ON public.household_members
  FOR UPDATE USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to remove members (and members to remove themselves)
DROP POLICY IF EXISTS "admin can delete members" ON public.household_members;
CREATE POLICY "admin can delete members" ON public.household_members
  FOR DELETE USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    user_id = auth.uid()
  );

-- Allow users to insert themselves when joining via invite code
DROP POLICY IF EXISTS "users can join household" ON public.household_members;
CREATE POLICY "users can join household" ON public.household_members
  FOR INSERT WITH CHECK (user_id = auth.uid());
