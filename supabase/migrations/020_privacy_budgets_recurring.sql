-- Migration 020: Privacy for Budgets & Recurring Transactions
--
-- Changes:
--   budgets              → add user_id (NULL = shared, uuid = personal)
--   recurring_transactions → add is_private + user_id
--   RLS update for both tables
--   RLS update for transactions (hide private wallet txn from other users)
--   Ensure wallet RLS is active
--
-- Run in Supabase SQL Editor

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. budgets — tambah kolom user_id
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Index for performance
CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON public.budgets(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. recurring_transactions — tambah is_private dan user_id
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.recurring_transactions
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Index for performance
CREATE INDEX IF NOT EXISTS recurring_user_id_idx ON public.recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS recurring_is_private_idx ON public.recurring_transactions(is_private);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Pastikan RLS aktif di semua tabel yang relevan
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.wallets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions          ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Update RLS budgets
--    SELECT: shared (user_id IS NULL) ATAU milik sendiri (user_id = auth.uid())
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies
             WHERE tablename = 'budgets' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.budgets', pol.policyname); END LOOP;
END $$;

CREATE POLICY "budgets select" ON public.budgets FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  )
  AND (
    budgets.user_id IS NULL          -- anggaran bersama
    OR budgets.user_id = auth.uid()  -- anggaran pribadi milik sendiri
  )
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
  AND (
    budgets.user_id IS NULL
    OR budgets.user_id = auth.uid()
  )
);

CREATE POLICY "budgets delete" ON public.budgets FOR DELETE USING (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
  AND (
    budgets.user_id IS NULL
    OR budgets.user_id = auth.uid()
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Update RLS recurring_transactions
--    SELECT: shared (is_private = false) ATAU milik sendiri (user_id = auth.uid())
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies
             WHERE tablename = 'recurring_transactions' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.recurring_transactions', pol.policyname); END LOOP;
END $$;

CREATE POLICY "recurring select" ON public.recurring_transactions FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  )
  AND (
    is_private = false                                    -- transaksi berulang bersama
    OR recurring_transactions.user_id = auth.uid()        -- pribadi milik sendiri
  )
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
  AND (
    is_private = false
    OR recurring_transactions.user_id = auth.uid()
  )
);

CREATE POLICY "recurring delete" ON public.recurring_transactions FOR DELETE USING (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
  AND (
    is_private = false
    OR recurring_transactions.user_id = auth.uid()
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Update RLS transactions
--    Sembunyikan transaksi dari dompet pribadi milik user lain
--    Pengecualian: transfer dari dompet pribadi → bersama tetap muncul
--    (transfer ada di tabel transfers, bukan transactions — jadi ini aman)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies
             WHERE tablename = 'transactions' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.transactions', pol.policyname); END LOOP;
END $$;

CREATE POLICY "transactions select" ON public.transactions FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  )
  AND (
    -- Transaksi dari dompet bersama: semua boleh lihat
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = transactions.wallet_id AND w.is_shared = true
    )
    OR
    -- Transaksi dari dompet pribadi: hanya pemilik dompet
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = transactions.wallet_id
        AND w.is_shared = false
        AND w.created_by = auth.uid()
    )
    OR
    -- super_admin bisa lihat semua (untuk keperluan rekap keluarga)
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE user_id = auth.uid()
        AND household_id = transactions.household_id
        AND role = 'super_admin'
    )
  )
);

CREATE POLICY "transactions insert" ON public.transactions FOR INSERT WITH CHECK (
  household_id IN (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "transactions update" ON public.transactions FOR UPDATE USING (
  transactions.user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.household_members
    WHERE user_id = auth.uid()
      AND household_id = transactions.household_id
      AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "transactions delete" ON public.transactions FOR DELETE USING (
  transactions.user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.household_members
    WHERE user_id = auth.uid()
      AND household_id = transactions.household_id
      AND role IN ('admin', 'super_admin')
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Wallet RLS — pastikan private wallet hanya kelihatan ke pemilik + super_admin
--    (Re-create untuk memastikan konsisten)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies
             WHERE tablename = 'wallets' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.wallets', pol.policyname); END LOOP;
END $$;

CREATE POLICY "wallet select" ON public.wallets FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  )
  AND (
    is_shared = true
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.household_members
      WHERE user_id = auth.uid()
        AND household_id = wallets.household_id
        AND role = 'super_admin'
    )
  )
);

CREATE POLICY "wallet insert" ON public.wallets FOR INSERT WITH CHECK (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "wallet update" ON public.wallets FOR UPDATE USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.household_members
    WHERE user_id = auth.uid()
      AND household_id = wallets.household_id
      AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "wallet delete" ON public.wallets FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE user_id = auth.uid()
      AND household_id = wallets.household_id
      AND role IN ('admin', 'super_admin')
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SELESAI
-- Ringkasan perubahan:
--   ✓ budgets.user_id       — NULL=bersama, uuid=pribadi
--   ✓ recurring.is_private  — false=bersama, true=pribadi
--   ✓ recurring.user_id     — siapa pemilik jika pribadi
--   ✓ RLS budgets           — hanya lihat shared + milik sendiri
--   ✓ RLS recurring         — hanya lihat shared + milik sendiri
--   ✓ RLS transactions      — dompet pribadi → hanya pemilik + super_admin
--   ✓ RLS wallets           — private wallet → hanya pemilik + super_admin
-- ─────────────────────────────────────────────────────────────────────────────
