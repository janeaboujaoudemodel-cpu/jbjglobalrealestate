import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SignedUrlCache {
  url: string;
  expiresAt: number;
}

const urlCache = new Map<string, SignedUrlCache>();
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function useSignedAttachmentUrl() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getSignedUrl = useCallback(async (publicUrl: string): Promise<string | null> => {
    // Check cache first
    const cached = urlCache.get(publicUrl);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    // Extract file path from public URL
    // Format: .../storage/v1/object/public/support-attachments/filename.ext
    const match = publicUrl.match(/support-attachments\/(.+)$/);
    if (!match) {
      console.error('Could not extract file path from URL:', publicUrl);
      return null;
    }
    const filePath = match[1];

    setLoading(prev => ({ ...prev, [publicUrl]: true }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[publicUrl];
      return newErrors;
    });

    try {
      const { data, error } = await supabase.storage
        .from('support-attachments')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        setErrors(prev => ({ ...prev, [publicUrl]: error.message }));
        return null;
      }

      if (data?.signedUrl) {
        // Cache the signed URL
        urlCache.set(publicUrl, {
          url: data.signedUrl,
          expiresAt: Date.now() + CACHE_DURATION_MS,
        });
        return data.signedUrl;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to get signed URL:', errorMessage);
      setErrors(prev => ({ ...prev, [publicUrl]: errorMessage }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, [publicUrl]: false }));
    }
  }, []);

  const clearCache = useCallback(() => {
    urlCache.clear();
  }, []);

  return {
    getSignedUrl,
    loading,
    errors,
    clearCache,
  };
}

// Helper to determine if a URL is an image
export function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.includes(ext));
}

// Helper to get filename from URL
export function getFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/');
    const filename = parts[parts.length - 1];
    // Remove timestamp prefix if present (format: timestamp-randomstring.ext)
    const cleanName = filename.replace(/^\d+-[a-z0-9]+\./, '');
    return cleanName || filename || 'Attachment';
  } catch {
    return 'Attachment';
  }
}
