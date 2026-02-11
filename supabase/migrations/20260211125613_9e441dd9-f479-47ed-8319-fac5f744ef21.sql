-- Create storage bucket for AI-generated area images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('area-images', 'area-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Area images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'area-images');

-- Allow service role to upload
CREATE POLICY "Service role can upload area images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'area-images');
