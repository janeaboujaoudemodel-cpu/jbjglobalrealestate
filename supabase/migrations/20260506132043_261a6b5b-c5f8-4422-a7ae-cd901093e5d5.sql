-- Allow all common contract document formats in the e-signature bucket
UPDATE storage.buckets
SET 
  file_size_limit = 104857600, -- 100MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg','image/png','image/webp','image/heic','image/heif','image/gif','image/tiff',
    'text/plain','text/html','text/markdown','text/rtf','application/rtf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text'
  ]
WHERE id = 'esign-documents';