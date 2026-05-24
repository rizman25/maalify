-- ============================================================
-- Tabel: push_subscriptions
-- Menyimpan Web Push subscription per user/perangkat
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    text        NOT NULL,
  p256dh      text        NOT NULL,
  auth        text        NOT NULL,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user
  ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- User hanya bisa CRUD subscription miliknya sendiri
CREATE POLICY "push_subs: select own"
  ON public.push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "push_subs: insert own"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subs: delete own"
  ON public.push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "push_subs: update own"
  ON public.push_subscriptions FOR UPDATE
  USING (user_id = auth.uid());
