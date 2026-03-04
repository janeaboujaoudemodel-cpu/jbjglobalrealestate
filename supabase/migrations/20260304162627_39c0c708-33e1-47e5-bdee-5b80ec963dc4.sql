
-- Book downloads tracking table
CREATE TABLE public.book_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_slug TEXT NOT NULL DEFAULT 'market-intelligence-2026',
  book_title TEXT NOT NULL DEFAULT 'UAE Real Estate Market Intelligence',
  downloader_email TEXT NOT NULL,
  downloader_name TEXT,
  user_id UUID,
  page_source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device_type TEXT,
  browser TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.book_downloads ENABLE ROW LEVEL SECURITY;

-- Public insert policy (anyone can download)
CREATE POLICY "Anyone can insert book downloads"
  ON public.book_downloads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated admin/owner can read
CREATE POLICY "Authenticated users can read book downloads"
  ON public.book_downloads
  FOR SELECT
  TO authenticated
  USING (true);

-- Index for analytics queries
CREATE INDEX idx_book_downloads_created_at ON public.book_downloads(created_at DESC);
CREATE INDEX idx_book_downloads_book_slug ON public.book_downloads(book_slug);
CREATE INDEX idx_book_downloads_page_source ON public.book_downloads(page_source);
