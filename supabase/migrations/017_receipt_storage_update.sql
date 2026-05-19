-- Update transaction-attachments bucket to support larger files and PDF
UPDATE storage.buckets
SET
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/heic','application/pdf']
WHERE id = 'transaction-attachments';
