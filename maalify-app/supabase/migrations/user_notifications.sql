-- ============================================================
-- Tabel: user_notifications
-- Digunakan untuk notifikasi personal per user (role change, dll)
-- Jalankan SQL ini di Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  message     text        NOT NULL,
  type        text        NOT NULL DEFAULT 'info',
  href        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index untuk query cepat per user + tanggal
CREATE INDEX IF NOT EXISTS idx_user_notif_user_created
  ON public.user_notifications (user_id, created_at DESC);

-- RLS: setiap user hanya bisa baca notifikasi miliknya sendiri
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_notifications: select own"
  ON public.user_notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role (server-side) dapat insert tanpa RLS restriction
-- (service role key bypasses RLS secara default)
