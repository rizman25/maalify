-- Migration 014: Savings Goals
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.savings_goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id   UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  target_amount  NUMERIC(15,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline       DATE,
  icon           TEXT NOT NULL DEFAULT '🎯',
  color          TEXT NOT NULL DEFAULT '#3B82F6',
  is_completed   BOOLEAN NOT NULL DEFAULT false,
  created_by     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.savings_contributions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id    UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  wallet_id  UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  amount     NUMERIC(15,2) NOT NULL, -- positive = top up, negative = withdraw
  note       TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.savings_goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;

-- savings_goals policies
DROP POLICY IF EXISTS "savings_goals_select" ON public.savings_goals;
CREATE POLICY "savings_goals_select" ON public.savings_goals
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "savings_goals_insert" ON public.savings_goals;
CREATE POLICY "savings_goals_insert" ON public.savings_goals
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "savings_goals_update" ON public.savings_goals;
CREATE POLICY "savings_goals_update" ON public.savings_goals
  FOR UPDATE USING (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "savings_goals_delete" ON public.savings_goals;
CREATE POLICY "savings_goals_delete" ON public.savings_goals
  FOR DELETE USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
    OR created_by = auth.uid()
  );

-- savings_contributions policies
DROP POLICY IF EXISTS "savings_contributions_select" ON public.savings_contributions;
CREATE POLICY "savings_contributions_select" ON public.savings_contributions
  FOR SELECT USING (
    goal_id IN (
      SELECT id FROM public.savings_goals
      WHERE household_id IN (
        SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "savings_contributions_insert" ON public.savings_contributions;
CREATE POLICY "savings_contributions_insert" ON public.savings_contributions
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND goal_id IN (
      SELECT id FROM public.savings_goals
      WHERE household_id IN (
        SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "savings_contributions_delete" ON public.savings_contributions;
CREATE POLICY "savings_contributions_delete" ON public.savings_contributions
  FOR DELETE USING (created_by = auth.uid());
