-- Add installment support to debts
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS installment_months SMALLINT;
