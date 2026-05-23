-- Add recurring flag to budgets
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false;
