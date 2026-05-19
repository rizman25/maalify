-- Migration 011: Invite Code Functions & User Signup Trigger
-- Run this in Supabase SQL Editor

-- ─── 1. RPC: Find household by invite code (SECURITY DEFINER bypasses RLS) ──
CREATE OR REPLACE FUNCTION public.find_household_by_invite_code(p_invite_code TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.households
  WHERE UPPER(invite_code) = UPPER(p_invite_code)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_household_by_invite_code(TEXT) TO authenticated;

-- ─── 2. Signup trigger: create profile + household or join on new user ────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id  UUID;
  v_invite_code   TEXT;
  v_household_name TEXT;
  v_name          TEXT;
BEGIN
  v_name           := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  v_invite_code    := NEW.raw_user_meta_data->>'invite_code';
  v_household_name := NEW.raw_user_meta_data->>'household_name';

  -- Always upsert user profile
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, v_name)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;

  IF v_invite_code IS NOT NULL AND v_invite_code <> '' THEN
    -- Join existing household via invite code
    SELECT id INTO v_household_id
    FROM public.households
    WHERE UPPER(invite_code) = UPPER(v_invite_code)
    LIMIT 1;

    IF v_household_id IS NOT NULL THEN
      INSERT INTO public.household_members (household_id, user_id, role)
      VALUES (v_household_id, NEW.id, 'member')
      ON CONFLICT DO NOTHING;
    END IF;

  ELSIF v_household_name IS NOT NULL AND v_household_name <> '' THEN
    -- Create new household
    INSERT INTO public.households (name, created_by, invite_code)
    VALUES (
      v_household_name,
      NEW.id,
      UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8))
    )
    RETURNING id INTO v_household_id;

    INSERT INTO public.household_members (household_id, user_id, role)
    VALUES (v_household_id, NEW.id, 'super_admin');
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger (drop first to avoid duplicate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
