-- ============================================================
-- Migration 010: Link transactions → project_items
-- Memungkinkan tracking per-termin/pembayaran per item project
-- ============================================================

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS project_item_id UUID REFERENCES public.project_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_project_item
  ON public.transactions(project_item_id)
  WHERE project_item_id IS NOT NULL;
