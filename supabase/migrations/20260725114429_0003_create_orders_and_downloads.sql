/*
# Create orders, order_items, and digital_downloads tables

1. New Tables
- `orders` — customer orders.
  - id, order_number (unique), user_id (FK auth.users), total_amount, currency
  - payment_status ('pending'|'paid'|'failed'), order_status ('processing'|'shipped'|'completed'|'cancelled')
  - payment_method (text), shipping_address (jsonb, nullable for digital-only)
  - created_at
- `order_items` — line items in an order.
  - id, order_id (FK), book_id (FK), price, quantity, book_type
- `digital_downloads` — secure, time-limited download tokens for purchased e-books.
  - id, user_id (FK), book_id (FK), download_token (unique), download_count, max_downloads, expires_at
  - created_at

2. Indexes
- orders on user_id, payment_status, order_status, created_at
- order_items on order_id, book_id
- digital_downloads on user_id, book_id, download_token

3. Security
- Enable RLS on all three tables.
- Orders + order_items: customers can read their own; only admins can read all / update / delete.
  INSERT is done by the owning customer (user_id defaults to auth.uid()).
- digital_downloads: customers can read their own tokens; only admins can delete.
  INSERT is done by the owning customer or by an edge function using service role.
- Admin writes use is_admin() function defined in migration 0002.

4. Notes
- order_number is auto-generated via a BEFORE INSERT trigger as 'ORD-YYYYMMDD-NNNN'.
- download_token is a random UUID generated on insert.
- expires_at defaults to 7 days from creation.
*/

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  payment_status text NOT NULL DEFAULT 'pending',
  order_status text NOT NULL DEFAULT 'processing',
  payment_method text NOT NULL DEFAULT 'stripe',
  shipping_address jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- Trigger function to auto-generate order_number
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  seq_val integer;
  date_part text;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  SELECT count(*) + 1 INTO seq_val FROM public.orders WHERE created_at::date = now()::date;
  NEW.order_number := 'ORD-' || date_part || '-' || lpad(seq_val::text, 4, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_number ON orders;
CREATE TRIGGER trg_orders_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION public.set_order_number();

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own_or_admin" ON orders;
CREATE POLICY "orders_select_own_or_admin" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_update_admin" ON orders;
CREATE POLICY "orders_update_admin" ON orders FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "orders_delete_admin" ON orders;
CREATE POLICY "orders_delete_admin" ON orders FOR DELETE
  TO authenticated USING (public.is_admin());

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  price numeric(10,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  book_type text NOT NULL DEFAULT 'physical'
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_book ON order_items(book_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_own_or_admin" ON order_items;
CREATE POLICY "order_items_select_own_or_admin" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;
CREATE POLICY "order_items_insert_own" ON order_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "order_items_update_admin" ON order_items;
CREATE POLICY "order_items_update_admin" ON order_items FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "order_items_delete_admin" ON order_items;
CREATE POLICY "order_items_delete_admin" ON order_items FOR DELETE
  TO authenticated USING (public.is_admin());

-- Digital downloads
CREATE TABLE IF NOT EXISTS digital_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  download_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  download_count integer NOT NULL DEFAULT 0,
  max_downloads integer NOT NULL DEFAULT 5,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_downloads_user ON digital_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_book ON digital_downloads(book_id);
CREATE INDEX IF NOT EXISTS idx_downloads_token ON digital_downloads(download_token);

ALTER TABLE digital_downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "downloads_select_own_or_admin" ON digital_downloads;
CREATE POLICY "downloads_select_own_or_admin" ON digital_downloads FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "downloads_insert_own" ON digital_downloads;
CREATE POLICY "downloads_insert_own" ON digital_downloads FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "downloads_update_own" ON digital_downloads;
CREATE POLICY "downloads_update_own" ON digital_downloads FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "downloads_delete_admin" ON digital_downloads;
CREATE POLICY "downloads_delete_admin" ON digital_downloads FOR DELETE
  TO authenticated USING (public.is_admin());
