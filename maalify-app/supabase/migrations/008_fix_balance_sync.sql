-- ── P0-3: Fix balance sync issues ────────────────────────────────────────────
--
-- Root causes fixed:
-- 1. handle_transfer_balance() didn't include admin_fee — manual code in
--    saveTransfer() tried to patch this but used a stale snapshot, creating
--    a race condition on concurrent writes.
-- 2. No DELETE trigger for transfers — deleting a transfer didn't restore
--    wallet balances.
--
-- Solution: make the DB trigger the single source of truth for all balance
-- mutations. Application code no longer touches current_balance directly
-- for transfers.
-- ─────────────────────────────────────────────────────────────────────────────

-- Fix 1: Include admin_fee in the INSERT trigger so the trigger handles the
-- full deduction atomically (no more manual UPDATE in application code).
CREATE OR REPLACE FUNCTION public.handle_transfer_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Source wallet: lose amount + admin fee
  UPDATE public.wallets
    SET current_balance = current_balance - NEW.amount - COALESCE(NEW.admin_fee, 0)
    WHERE id = NEW.from_wallet_id;

  -- Destination wallet: gains only the transferred amount (not the fee)
  UPDATE public.wallets
    SET current_balance = current_balance + NEW.amount
    WHERE id = NEW.to_wallet_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 2: Reverse balance when a transfer is deleted.
CREATE OR REPLACE FUNCTION public.handle_transfer_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Restore amount + admin fee to source wallet
  UPDATE public.wallets
    SET current_balance = current_balance + OLD.amount + COALESCE(OLD.admin_fee, 0)
    WHERE id = OLD.from_wallet_id;

  -- Remove the amount that was credited to destination wallet
  UPDATE public.wallets
    SET current_balance = current_balance - OLD.amount
    WHERE id = OLD.to_wallet_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger first in case it already exists, then recreate.
DROP TRIGGER IF EXISTS trg_transfer_balance_delete ON public.transfers;

CREATE TRIGGER trg_transfer_balance_delete
  AFTER DELETE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.handle_transfer_delete();
