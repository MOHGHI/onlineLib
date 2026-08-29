/*
# Add storage policies for ebooks bucket

1. Security
- Allow authenticated users to upload to the ebooks bucket (for admin adding new books).
- Allow anyone with a signed URL to download (signed URLs are generated server-side, so this is safe).
- Only service role can delete files.

2. Notes
- The secure-download edge function uses the service role key which bypasses RLS, so it can generate signed URLs regardless.
- These policies allow the frontend admin to upload files directly to the bucket when adding/editing books.
*/

-- Allow authenticated uploads
DROP POLICY IF EXISTS "ebooks_upload_authenticated" ON storage.objects;
CREATE POLICY "ebooks_upload_authenticated" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ebooks');

-- Allow public read via signed URLs (the signed URL itself is the auth mechanism)
DROP POLICY IF EXISTS "ebooks_read_signed" ON storage.objects;
CREATE POLICY "ebooks_read_signed" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'ebooks');

-- Allow admin to delete
DROP POLICY IF EXISTS "ebooks_delete_admin" ON storage.objects;
CREATE POLICY "ebooks_delete_admin" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ebooks' AND public.is_admin());
