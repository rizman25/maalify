-- Migration 010: Debt Payments & Installments

ALTER TABLE public.debts
  ADD COLUMN IF NOT EXISTS installment_months INTEGER;

CREATE TABLE IF NOT EXISTS public.debt_payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id     UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  wallet_id   UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  amount      NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  paid_at     DATE NOT NULL,
  note        TEXT,
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "debt_payments_select" ON public.debt_payments;
CREATE POLICY "debt_payments_select" ON public.debt_payments
  FOR SELECT USING (
    debt_id IN (
      SELECT d.id FROM public.debts d
      JOIN public.household_members m ON m.household_id = d.household_id
      WHERE m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "debt_payments_insert" ON public.debt_payments;
CREATE POLICY "debt_payments_insert" ON public.debt_payments
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND debt_id IN (
      SELECT d.id FROM public.debts d
      JOIN public.household_members m ON m.household_id = d.household_id
      WHERE m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "debt_payments_delete" ON public.debt_payments;
CREATE POLICY "debt_payments_delete" ON public.debt_payments
  FOR DELETE USING (created_by = auth.uid());
