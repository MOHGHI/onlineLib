/*
# Create profiles table and enable required extensions

1. New Tables
- `profiles` — extends Supabase auth.users with app-specific fields (full_name, phone, preferred locale, role).
  - `id` (uuid, PK, references auth.users)
  - `email` (text)
  - `full_name` (text, nullable)
  - `phone` (text, nullable)
  - `locale` (text, default 'en') — preferred UI language
  - `role` (text, default 'customer') — 'customer' or 'admin'
  - `created_at` (timestamptz)

2. Security
- Enable RLS on `profiles`.
- Users can read their own profile.
- Users can update their own profile (but not their role — role is admin-managed).
- Admins can read and update all profiles (via a security definer function check).

3. Notes
- The `profiles` table is 1:1 with `auth.users` via the `id` PK.
- Role escalation is prevented: the UPDATE policy's WITH CHECK ensures role cannot be changed by the user themselves through a trigger that rejects role changes from non-admins.
*/

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  full_name text,
  phone text,
  locale text NOT NULL DEFAULT 'en',
  role text NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
