-- Migration 007: Recurring Transactions
-- Run this in Supabase SQL Editor

-- Enums (safe if already exists)
DO $$ BEGIN
  CREATE TYPE recurring_frequency AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create recurring_transactions table
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID          NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  wallet_id     UUID          NOT NULL REFERENCES public.wallets(id),
  category_id   UUID          NOT NULL REFERENCES public.categories(id),
  type          TEXT          NOT NULL CHECK (type IN ('income','expense')),
  amount        DECIMAL(15,2) NOT NULL,
  description   VARCHAR(200)  NOT NULL,
  frequency     recurring_frequency NOT NULL DEFAULT 'monthly',
  start_date    DATE          NOT NULL,
  end_date      DATE,
  last_generated DATE,
  is_active     BOOLEAN       DEFAULT TRUE,
  created_by    UUID          NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "household_members_recurring_all" ON public.recurring_transactions;
CREATE POLICY "household_members_recurring_all" ON public.recurring_transactions
  FOR ALL
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_recurring_household_active
  ON public.recurring_transactions(household_id, is_active);
