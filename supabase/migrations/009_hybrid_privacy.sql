-- Migration 009: Hybrid Privacy System
-- Roles: super_admin (Suami), admin (Istri), member (Anak)
-- Wallet privacy: is_shared (Bersama) vs private (Pribadi)
-- Run this in Supabase SQL Editor

-- ─── 1. Add is_shared to wallets ───────────────────────────────────────────
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT true NOT NULL;

-- ─── 2. Wallet RLS ─────────────────────────────────────────────────────────
DO $$ DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'wallets' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY %I ON public.wallets', pol.policyname); END LOOP;
END $$;

-- SELECT: shared wallets → all members; private wallets → owner or super_admin only
CREATE POLICY "wallet select" ON public.wallets FOR SELECT USING (
  household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
  AND (
    is_shared = true
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.household_members
      WHERE user_id = auth.uid() AND household_id = wallets.household_id AND role = 'super_admin'
    )
  )
);

-- INSERT: only admin and super_admin can create wallets
CREATE POLICY "wallet insert" ON public.wallets FOR INSERT WITH CHECK (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- UPDATE: admin/super_admin OR own wallet
CREATE POLICY "wallet update" ON public.wallets FOR UPDATE USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.household_members
    WHERE user_id = auth.uid() AND household_id = wallets.household_id AND role IN ('admin', 'super_admin')
  )
);

-- DELETE: admin/super_admin only
CREATE POLICY "wallet delete" ON public.wallets FOR DELETE USING (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- ─── 3. Transaction RLS ────────────────────────────────────────────────────
DO $$ DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'transactions' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY %I ON public.transactions', pol.policyname); END LOOP;
END $$;

-- SELECT: shared wallet transactions → all members; private wallet → owner or super_admin
CREATE POLICY "transaction select" ON public.transactions FOR SELECT USING (
  household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE user_id = auth.uid() AND household_id = transactions.household_id AND role = 'super_admin'
    )
    OR wallet_id IN (SELECT id FROM public.wallets WHERE is_shared = true)
    OR created_by = auth.uid()
  )
);

-- INSERT: all members can add transactions
CREATE POLICY "transaction insert" ON public.transactions FOR INSERT WITH CHECK (
  household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
);

-- UPDATE: own transaction OR admin/super_admin
CREATE POLICY "transaction update" ON public.transactions FOR UPDATE USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.household_members
    WHERE user_id = auth.uid() AND household_id = transactions.household_id AND role IN ('admin', 'super_admin')
  )
);

-- DELETE: own transaction OR admin/super_admin
CREATE POLICY "transaction delete" ON public.transactions FOR DELETE USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.household_members
    WHERE user_id = auth.uid() AND household_id = transactions.household_id AND role IN ('admin', 'super_admin')
  )
);

-- ─── 4. Debts RLS (admin + super_admin only) ───────────────────────────────
DO $$ DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'debts' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY %I ON public.debts', pol.policyname); END LOOP;
END $$;

CREATE POLICY "debts select" ON public.debts FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);
CREATE POLICY "debts insert" ON public.debts FOR INSERT WITH CHECK (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);
CREATE POLICY "debts update" ON public.debts FOR UPDATE USING (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);
CREATE POLICY "debts delete" ON public.debts FOR DELETE USING (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- ─── 5. Recurring transactions RLS (member: read-only) ─────────────────────
DO $$ DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'recurring_transactions' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY %I ON public.recurring_transactions', pol.policyname); END LOOP;
END $$;

CREATE POLICY "recurring select" ON public.recurring_transactions FOR SELECT USING (
  household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
);
CREATE POLICY "recurring insert" ON public.recurring_transactions FOR INSERT WITH CHECK (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);
CREATE POLICY "recurring update" ON public.recurring_transactions FOR UPDATE USING (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);
CREATE POLICY "recurring delete" ON public.recurring_transactions FOR DELETE USING (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- ─── 6. Budgets RLS (member: view only) ────────────────────────────────────
DO $$ DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'budgets' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY %I ON public.budgets', pol.policyname); END LOOP;
END $$;

CREATE POLICY "budgets select" ON public.budgets FOR SELECT USING (
  household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
);
CREATE POLICY "budgets insert" ON public.budgets FOR INSERT WITH CHECK (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);
CREATE POLICY "budgets update" ON public.budgets FOR UPDATE USING (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);
CREATE POLICY "budgets delete" ON public.budgets FOR DELETE USING (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- ─── 7. Update existing admin members → super_admin (first member = founder) ─
-- Optional: promote the creator of each household to super_admin
-- Uncomment if you want to auto-upgrade existing admins to super_admin:
-- UPDATE public.household_members SET role = 'super_admin'
-- WHERE role = 'admin'
-- AND user_id IN (SELECT created_by FROM public.households WHERE id = household_id);
