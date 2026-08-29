/*
# Create admin user for testing the admin dashboard

1. Purpose
- Insert a test admin user directly into auth.users so the admin dashboard is accessible.
- The user can sign in with email admin@kitoblar.uz and password Admin123!
- Their profile row is set to role='admin'.

2. Notes
- The encrypted password is a bcrypt hash of 'Admin123!' generated for Supabase auth.
- email_confirm is set to true so login works without email verification.
- This is a demo/testing user for the storefront admin panel.
*/

-- Insert admin user into auth.users
-- Using crypt() for password hashing compatible with Supabase auth
-- The password is 'Admin123!' — bcrypt hash:
-- $2a$10$... (we'll use the Supabase-compatible approach)

-- Generate the user with a known UUID for easy reference
DO $$
DECLARE
  admin_id uuid := 'a0000000-0000-0000-0000-000000000001';
  password_hash text;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@kitoblar.uz') THEN
    -- Create password hash using crypt (Supabase auth uses bcrypt)
    password_hash := crypt('Admin123!', gen_salt('bf', 10));
    
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at,
      last_sign_in_at
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@kitoblar.uz',
      password_hash,
      now(),
      jsonb_build_object('full_name', 'Store Manager', 'phone', ''),
      jsonb_build_object('provider', 'email'),
      now(),
      now(),
      now()
    );
    
    RAISE NOTICE 'Admin user created with id %', admin_id;
  ELSE
    admin_id := (SELECT id FROM auth.users WHERE email = 'admin@kitoblar.uz');
    RAISE NOTICE 'Admin user already exists with id %', admin_id;
  END IF;
  
  -- Upsert profile with admin role
  INSERT INTO public.profiles (id, email, full_name, phone, locale, role)
  VALUES (admin_id, 'admin@kitoblar.uz', 'Store Manager', '', 'en', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Store Manager';
  
  RAISE NOTICE 'Admin profile ensured';
END $$;
