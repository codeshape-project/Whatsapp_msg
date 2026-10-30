
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'organization-logos',
  'organization-logos',
  true,
  3145728,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id)
DO UPDATE SET
  public = true,
  file_size_limit = 3145728,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];
