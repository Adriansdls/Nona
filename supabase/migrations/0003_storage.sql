INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('case-images-original', 'case-images-original', false, 20971520,
   ARRAY['image/jpeg','image/png','image/webp']),
  ('case-images-public', 'case-images-public', true, 10485760,
   ARRAY['image/jpeg','image/png','image/webp']),
  ('posters', 'posters', true, 52428800,
   ARRAY['application/pdf','image/png','image/jpeg']),
  ('sighting-images', 'sighting-images', true, 10485760,
   ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public bucket read"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('case-images-public', 'posters', 'sighting-images'));

CREATE POLICY "Service role full access"
  ON storage.objects FOR ALL
  USING (true)
  WITH CHECK (true);
