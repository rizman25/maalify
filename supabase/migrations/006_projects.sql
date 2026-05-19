-- Migration 006: Project Keluarga
-- Run this in Supabase SQL Editor

-- Create enums
DO $$ BEGIN
  CREATE TYPE project_type AS ENUM (
    'trip', 'wedding', 'property', 'purchase',
    'education', 'vehicle', 'health', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('planning', 'active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID            NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  wallet_id     UUID            REFERENCES public.wallets(id),
  name          VARCHAR(100)    NOT NULL,
  type          project_type    NOT NULL DEFAULT 'other',
  description   TEXT,
  cover_emoji   VARCHAR(10),
  target_amount DECIMAL(15,2)   NOT NULL DEFAULT 0,
  current_amount DECIMAL(15,2)  NOT NULL DEFAULT 0,
  target_date   DATE            NOT NULL,
  status        project_status  NOT NULL DEFAULT 'planning',
  created_by    UUID            NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ     DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     DEFAULT NOW()
);

-- Create project_items table
CREATE TABLE IF NOT EXISTS public.project_items (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name            VARCHAR(150)  NOT NULL,
  planned_amount  DECIMAL(15,2) NOT NULL,
  actual_amount   DECIMAL(15,2),
  is_paid         BOOLEAN       DEFAULT FALSE,
  paid_at         DATE,
  transaction_id  UUID          REFERENCES public.transactions(id),
  sort_order      SMALLINT      DEFAULT 0,
  created_by      UUID          NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- Add project_id to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_items ENABLE ROW LEVEL SECURITY;

-- RLS: projects — all household members can read & write
DROP POLICY IF EXISTS "household_members_projects_all" ON public.projects;
CREATE POLICY "household_members_projects_all" ON public.projects
  FOR ALL
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

-- RLS: project_items — accessible if project belongs to same household
DROP POLICY IF EXISTS "household_members_project_items_all" ON public.project_items;
CREATE POLICY "household_members_project_items_all" ON public.project_items
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE household_id IN (
        SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects
      WHERE household_id IN (
        SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
      )
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_household_status ON public.projects(household_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_target_date ON public.projects(target_date);
CREATE INDEX IF NOT EXISTS idx_project_items_project_paid ON public.project_items(project_id, is_paid);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON public.transactions(project_id);
