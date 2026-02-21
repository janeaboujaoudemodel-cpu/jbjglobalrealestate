
-- Add AI-powered listing columns to portal_listings
ALTER TABLE public.portal_listings 
  ADD COLUMN IF NOT EXISTS ai_extracted_data jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_documents jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS gallery_images jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS floor_plan_images jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS listing_category text DEFAULT 'resale',
  ADD COLUMN IF NOT EXISTS ai_quality_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS developer_name text,
  ADD COLUMN IF NOT EXISTS project_name text,
  ADD COLUMN IF NOT EXISTS handover_date text,
  ADD COLUMN IF NOT EXISTS payment_plan text,
  ADD COLUMN IF NOT EXISTS amenities jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS key_features jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inquiry_count integer DEFAULT 0;

-- Create user listing notifications table
CREATE TABLE IF NOT EXISTS public.user_listing_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid REFERENCES public.portal_listings(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'status_update',
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_listing_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.user_listing_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.user_listing_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Create storage bucket for listing documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-documents', 'listing-documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload listing documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-documents');

CREATE POLICY "Anyone can view listing documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-documents');

CREATE POLICY "Users can delete their own listing documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'listing-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to auto-create notification on listing status change
CREATE OR REPLACE FUNCTION public.notify_listing_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.user_listing_notifications (user_id, listing_id, type, title, message)
    VALUES (
      NEW.user_id,
      NEW.id,
      'status_update',
      CASE NEW.status
        WHEN 'approved' THEN 'Listing Approved!'
        WHEN 'published' THEN 'Listing Published!'
        WHEN 'rejected' THEN 'Listing Needs Changes'
        WHEN 'draft' THEN 'Listing Saved as Draft'
        ELSE 'Listing Status Updated'
      END,
      CASE NEW.status
        WHEN 'approved' THEN 'Your listing "' || NEW.title || '" has been approved and is now live on the portal.'
        WHEN 'published' THEN 'Your listing "' || NEW.title || '" is now visible to potential buyers.'
        WHEN 'rejected' THEN 'Your listing "' || NEW.title || '" needs revisions. Reason: ' || COALESCE(NEW.rejection_reason, 'Please contact support.')
        ELSE 'Your listing "' || NEW.title || '" status has been updated to ' || NEW.status || '.'
      END
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER listing_status_notification
  AFTER UPDATE ON public.portal_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_listing_status_change();
