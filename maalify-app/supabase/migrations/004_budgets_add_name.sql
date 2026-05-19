-- Add optional custom name to budgets
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS name TEXT;
