-- Add attachment_url column to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Create storage bucket for transaction attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'transaction-attachments',
  'transaction-attachments',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg','image/png','image/webp','image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Allow household members to upload attachments
CREATE POLICY "attachments_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'transaction-attachments'
    AND auth.uid() IS NOT NULL
  );

-- Allow authenticated users to view attachments
CREATE POLICY "attachments_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'transaction-attachments');

-- Allow users to delete their own attachments
CREATE POLICY "attachments_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'transaction-attachments');
