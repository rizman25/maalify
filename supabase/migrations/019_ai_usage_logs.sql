-- AI Usage Logs — track setiap request ke Scan Struk & Maali AI
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  household_id        UUID REFERENCES public.households(id) ON DELETE SET NULL,
  feature             TEXT NOT NULL, -- 'scan_struk' | 'ai_chat'
  model               TEXT,
  prompt_tokens       INT DEFAULT 0,
  completion_tokens   INT DEFAULT 0,
  total_tokens        INT DEFAULT 0,
  estimated_cost_usd  NUMERIC(10,6) DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_feature ON public.ai_usage_logs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);

-- RLS: hanya service role yang bisa insert/select (via API route)
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.ai_usage_logs
  USING (true)
  WITH CHECK (true);
