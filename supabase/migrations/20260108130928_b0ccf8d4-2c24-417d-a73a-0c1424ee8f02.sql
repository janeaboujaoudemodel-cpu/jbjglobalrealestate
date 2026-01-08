-- Create table to track PWA install events and performance
CREATE TABLE public.pwa_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN ('button_click', 'prompt_shown', 'install_accepted', 'install_dismissed', 'app_opened', 'app_uninstalled')),
    device_type TEXT, -- 'mobile', 'tablet', 'desktop'
    platform TEXT, -- 'ios', 'android', 'windows', 'macos', 'linux'
    browser TEXT, -- 'chrome', 'safari', 'firefox', 'edge'
    user_agent TEXT,
    referrer TEXT,
    page_url TEXT,
    session_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pwa_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for tracking (public facing)
CREATE POLICY "Anyone can insert PWA analytics"
ON public.pwa_analytics
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Admins can view PWA analytics"
ON public.pwa_analytics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Create index for faster queries
CREATE INDEX idx_pwa_analytics_event_type ON public.pwa_analytics(event_type);
CREATE INDEX idx_pwa_analytics_created_at ON public.pwa_analytics(created_at DESC);
CREATE INDEX idx_pwa_analytics_platform ON public.pwa_analytics(platform);