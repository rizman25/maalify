-- ── Wallet edit history ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallet_edit_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id   UUID        NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  old_balance NUMERIC     NOT NULL DEFAULT 0,
  new_balance NUMERIC     NOT NULL DEFAULT 0,
  reason      TEXT,
  edited_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wallet_edit_history ENABLE ROW LEVEL SECURITY;

-- Anggota household boleh baca history dompet milik household-nya
CREATE POLICY "household members can read wallet history"
  ON public.wallet_edit_history FOR SELECT
  USING (
    wallet_id IN (
      SELECT w.id FROM public.wallets w
      JOIN public.household_members hm ON hm.household_id = w.household_id
      WHERE hm.user_id = auth.uid()
    )
  );

-- ── Transfer admin fee ────────────────────────────────────────────────────
ALTER TABLE public.transfers
  ADD COLUMN IF NOT EXISTS admin_fee NUMERIC NOT NULL DEFAULT 0;
