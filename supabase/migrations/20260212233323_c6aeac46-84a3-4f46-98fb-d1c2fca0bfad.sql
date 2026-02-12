
-- Create storage buckets for area and news images
INSERT INTO storage.buckets (id, name, public) VALUES ('area-images', 'area-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', true) ON CONFLICT (id) DO NOTHING;

-- Public read access for area-images
CREATE POLICY "Public read access for area images" ON storage.objects FOR SELECT USING (bucket_id = 'area-images');

-- Public read access for news-images  
CREATE POLICY "Public read access for news images" ON storage.objects FOR SELECT USING (bucket_id = 'news-images');

-- Service role upload for area-images
CREATE POLICY "Service role upload for area images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'area-images');

-- Service role upload for news-images
CREATE POLICY "Service role upload for news images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'news-images');

-- Service role update for area-images
CREATE POLICY "Service role update for area images" ON storage.objects FOR UPDATE USING (bucket_id = 'area-images');

-- Service role update for news-images
CREATE POLICY "Service role update for news images" ON storage.objects FOR UPDATE USING (bucket_id = 'news-images');
