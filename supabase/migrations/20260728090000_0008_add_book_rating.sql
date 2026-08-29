/*
# Add rating to books

1. Modified Tables
- `books`: add `rating` numeric(2,1) NOT NULL DEFAULT 0.0 — average customer rating
  out of 5, shown as stars on the catalog, book card, and book detail page.
  Merged in from the "online_library_2" catalog design, which tracked rating
  per book from the start; this brings the same field into the main catalog
  schema without disturbing existing rows (defaults to 0, admins can edit it
  from the admin book form).

2. Notes
- No RLS changes needed — `rating` is just another public-readable column on
  `books`, covered by the existing `books_read_public` / `books_write_admin`
  policies from migration 0002.
*/

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS rating numeric(2,1) NOT NULL DEFAULT 0.0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'books_rating_range'
  ) THEN
    ALTER TABLE books ADD CONSTRAINT books_rating_range CHECK (rating >= 0 AND rating <= 5);
  END IF;
END $$;
