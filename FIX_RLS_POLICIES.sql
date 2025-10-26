-- FIX RLS POLICIES FOR PROFILES TABLE
-- The 406 error means Row Level Security is blocking the query
-- Run this in Supabase SQL Editor

-- ==================================================
-- STEP 1: Check current RLS policies
-- ==================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';


-- ==================================================
-- STEP 2: Drop old restrictive policies (if any)
-- ==================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;


-- ==================================================
-- STEP 3: Create permissive SELECT policy
-- ==================================================
-- Allow users to read their own profile
CREATE POLICY "Enable read access for users to own profile"
ON public.profiles
FOR SELECT
USING (auth.uid()::text = auth_uid);

-- Allow authenticated users to read all profiles (for discovery/search)
CREATE POLICY "Enable read access for authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);


-- ==================================================
-- STEP 4: Create UPDATE policy
-- ==================================================
CREATE POLICY "Enable update for users to own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid()::text = auth_uid)
WITH CHECK (auth.uid()::text = auth_uid);


-- ==================================================
-- STEP 5: Create INSERT policy
-- ==================================================
CREATE POLICY "Enable insert for authenticated users"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = auth_uid);


-- ==================================================
-- STEP 6: Verify RLS is enabled
-- ==================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- ==================================================
-- STEP 7: Test the query
-- ==================================================
SELECT role, is_founder, user_type, is_admin
FROM public.profiles
WHERE auth_uid = '89cedd82-5a65-4b61-a3c8-05c707ac440c';

-- You should see your profile with admin flags!
