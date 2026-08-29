/*
# Create categories, authors, and books tables

1. New Tables
- `categories` — book genres/categories with translatable name (JSONB) and slug, self-referencing parent.
  - id, name (jsonb: {en, uz, ru}), slug, parent_id (nullable self-ref), created_at
- `authors` — book authors with translatable bio and optional photo.
  - id, name, bio (jsonb), photo (nullable), created_at
- `books` — the core product table.
  - id, isbn (nullable), title (jsonb), description (jsonb), category_id (FK), author_id (FK)
  - price (numeric), sale_price (nullable), stock_quantity (int)
  - type ('digital' | 'physical' | 'both'), format ('hardcover'|'paperback'|'pdf'|'audio')
  - page_count (nullable), book_language (text)
  - cover_image (nullable), digital_file_path (nullable), sample_file_path (nullable)
  - is_active (bool), created_at

2. Indexes
- books on category_id, author_id, is_active, created_at
- categories on slug
- authors on name

3. Security
- Enable RLS on all three tables.
- Public read (anon + authenticated) for active books and all categories/authors.
- Only authenticated admins can INSERT/UPDATE/DELETE.
  Admin check uses a security definer function `is_admin()` that reads the requesting user's role from profiles.

4. Notes
- JSONB columns store translations as {"en":"...","uz":"...","ru":"..."}.
- `is_admin()` function is marked SECURITY DEFINER so it can read profiles even if RLS policies would otherwise restrict.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name jsonb NOT NULL DEFAULT '{"en":"","uz":"","ru":""}',
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_read_public" ON categories;
CREATE POLICY "categories_read_public" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_write_admin" ON categories;
CREATE POLICY "categories_write_admin" ON categories FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_update_admin" ON categories;
CREATE POLICY "categories_update_admin" ON categories FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_delete_admin" ON categories;
CREATE POLICY "categories_delete_admin" ON categories FOR DELETE
  TO authenticated USING (public.is_admin());

-- Authors
CREATE TABLE IF NOT EXISTS authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio jsonb NOT NULL DEFAULT '{"en":"","uz":"","ru":""}',
  photo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name);

ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authors_read_public" ON authors;
CREATE POLICY "authors_read_public" ON authors FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "authors_write_admin" ON authors;
CREATE POLICY "authors_write_admin" ON authors FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "authors_update_admin" ON authors;
CREATE POLICY "authors_update_admin" ON authors FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "authors_delete_admin" ON authors;
CREATE POLICY "authors_delete_admin" ON authors FOR DELETE
  TO authenticated USING (public.is_admin());

-- Books
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  isbn text,
  title jsonb NOT NULL DEFAULT '{"en":"","uz":"","ru":""}',
  description jsonb NOT NULL DEFAULT '{"en":"","uz":"","ru":""}',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES authors(id) ON DELETE SET NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  sale_price numeric(10,2),
  stock_quantity integer NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'physical',
  format text NOT NULL DEFAULT 'paperback',
  page_count integer,
  book_language text NOT NULL DEFAULT 'en',
  cover_image text,
  digital_file_path text,
  sample_file_path text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_active ON books(is_active);
CREATE INDEX IF NOT EXISTS idx_books_created ON books(created_at DESC);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "books_read_public" ON books;
CREATE POLICY "books_read_public" ON books FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "books_write_admin" ON books;
CREATE POLICY "books_write_admin" ON books FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "books_update_admin" ON books;
CREATE POLICY "books_update_admin" ON books FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "books_delete_admin" ON books;
CREATE POLICY "books_delete_admin" ON books FOR DELETE
  TO authenticated USING (public.is_admin());
