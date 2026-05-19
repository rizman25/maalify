-- Migration 012: Recurring Transaction Processing (DB function + pg_cron)
-- Run this in Supabase SQL Editor

-- ─── 1. DB function: process all active recurring transactions ────────────────
CREATE OR REPLACE FUNCTION public.process_all_recurring_transactions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec    RECORD;
  v_cursor DATE;
  v_last   DATE;
  v_count  INTEGER;
  v_total  INTEGER := 0;
  v_today  DATE    := CURRENT_DATE;
BEGIN
  FOR v_rec IN
    SELECT id, household_id, wallet_id, category_id, type, amount,
           description, frequency, start_date, end_date, last_generated, created_by
    FROM public.recurring_transactions
    WHERE is_active = true
      AND start_date <= v_today
  LOOP
    -- Determine next date to generate from
    IF v_rec.last_generated IS NOT NULL THEN
      v_cursor := CASE v_rec.frequency
        WHEN 'monthly' THEN v_rec.last_generated + INTERVAL '1 month'
        WHEN 'weekly'  THEN v_rec.last_generated + INTERVAL '7 days'
        ELSE                v_rec.last_generated + INTERVAL '1 day'
      END;
    ELSE
      v_cursor := v_rec.start_date;
    END IF;

    v_last  := NULL;
    v_count := 0;

    WHILE v_cursor <= v_today
      AND (v_rec.end_date IS NULL OR v_cursor <= v_rec.end_date)
      AND v_count < 36
    LOOP
      INSERT INTO public.transactions (
        household_id, wallet_id, category_id, user_id,
        recurring_id, type, amount, description, date
      ) VALUES (
        v_rec.household_id, v_rec.wallet_id, v_rec.category_id, v_rec.created_by,
        v_rec.id, v_rec.type, v_rec.amount, v_rec.description, v_cursor
      );

      v_last  := v_cursor;
      v_count := v_count + 1;
      v_total := v_total + 1;

      v_cursor := CASE v_rec.frequency
        WHEN 'monthly' THEN v_cursor + INTERVAL '1 month'
        WHEN 'weekly'  THEN v_cursor + INTERVAL '7 days'
        ELSE                v_cursor + INTERVAL '1 day'
      END;
    END LOOP;

    IF v_last IS NOT NULL THEN
      UPDATE public.recurring_transactions
      SET last_generated = v_last
      WHERE id = v_rec.id;
    END IF;
  END LOOP;

  RETURN v_total;
END;
$$;

-- ─── 2. pg_cron: jalankan setiap hari jam 01.00 UTC ──────────────────────────
-- Membutuhkan pg_cron extension (tersedia di semua plan Supabase).
-- Aktifkan dulu di: Dashboard → Database → Extensions → pg_cron
-- Lalu jalankan baris SELECT di bawah ini:

-- SELECT cron.schedule(
--   'process-recurring-daily',
--   '0 1 * * *',
--   'SELECT public.process_all_recurring_transactions()'
-- );

-- Untuk cek apakah sudah terjadwal:
-- SELECT * FROM cron.job WHERE jobname = 'process-recurring-daily';

-- Untuk hapus jadwal:
-- SELECT cron.unschedule('process-recurring-daily');
