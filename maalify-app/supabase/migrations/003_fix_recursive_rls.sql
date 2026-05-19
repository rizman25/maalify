-- ============================================================
-- Maalify — Migration 003: Fix Recursive RLS on household_members
-- ============================================================
-- Policy lama menggunakan subquery ke tabel yang sama (recursive)
-- sehingga RLS mengembalikan null secara silent.
-- Solusi: gunakan fungsi is_household_member() yang SECURITY DEFINER.

DROP POLICY IF EXISTS "members_read_same_household" ON public.household_members;

CREATE POLICY "members_read_same_household" ON public.household_members
  FOR SELECT USING (public.is_household_member(household_id));

DROP POLICY IF EXISTS "households_read_members" ON public.households;

CREATE POLICY "households_read_members" ON public.households
  FOR SELECT USING (public.is_household_member(id));
