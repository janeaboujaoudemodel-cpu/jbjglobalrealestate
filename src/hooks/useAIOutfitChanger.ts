/**
 * USE AI OUTFIT CHANGER HOOK
 * Hook for managing AI-powered outfit changes in video calls
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OutfitResult {
  imageUrl: string | null;
  message: string;
  requestId: string | null;
}

interface UseAIOutfitChangerReturn {
  isGenerating: boolean;
  currentOutfit: string | null;
  generatedImageUrl: string | null;
  error: string | null;
  generateOutfit: (prompt: string, imageBase64?: string, sessionId?: string) => Promise<OutfitResult | null>;
  clearOutfit: () => void;
}

export function useAIOutfitChanger(): UseAIOutfitChangerReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentOutfit, setCurrentOutfit] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateOutfit = useCallback(async (
    prompt: string, 
    imageBase64?: string,
    sessionId?: string
  ): Promise<OutfitResult | null> => {
    if (!prompt.trim()) {
      toast.error('Please describe your desired outfit');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-outfit-changer', {
        body: {
          prompt,
          imageBase64,
          sessionId,
        },
      });

      if (fnError) {
        throw fnError;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate outfit');
      }

      setCurrentOutfit(prompt);
      setGeneratedImageUrl(data.imageUrl);
      
      toast.success('Outfit applied successfully!');

      return {
        imageUrl: data.imageUrl,
        message: data.message,
        requestId: data.requestId,
      };
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to generate outfit';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearOutfit = useCallback(() => {
    setCurrentOutfit(null);
    setGeneratedImageUrl(null);
    setError(null);
  }, []);

  return {
    isGenerating,
    currentOutfit,
    generatedImageUrl,
    error,
    generateOutfit,
    clearOutfit,
  };
}