import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeadData {
  email: string;
  fullName?: string;
  phone?: string;
  nationality?: string;
  language?: string;
  birthday?: string;
  currentLocation?: string;
  ageRange?: string;
  message?: string;
  context?: Record<string, unknown>;
}

interface UseLeadCaptureResult {
  isLeadCaptured: boolean;
  leadData: LeadData | null;
  isLoading: boolean;
  checkLead: (email: string) => Promise<LeadData | null>;
  captureLead: (data: LeadData, source: string, contactType?: 'client' | 'broker') => Promise<boolean>;
  clearLocalLead: () => void;
}

const LEAD_STORAGE_KEY = 'jj_captured_lead';

export const useLeadCapture = (): UseLeadCaptureResult => {
  const [isLeadCaptured, setIsLeadCaptured] = useState(false);
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check localStorage on mount
  useEffect(() => {
    const storedLead = localStorage.getItem(LEAD_STORAGE_KEY);
    if (storedLead) {
      try {
        const parsed = JSON.parse(storedLead);
        setLeadData(parsed);
        setIsLeadCaptured(true);
      } catch {
        localStorage.removeItem(LEAD_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Check if lead exists in localStorage (database queries restricted to admins for security)
  const checkLead = useCallback(async (email: string): Promise<LeadData | null> => {
    // Check local storage for existing lead data
    const storedLead = localStorage.getItem(LEAD_STORAGE_KEY);
    if (storedLead) {
      try {
        const parsed = JSON.parse(storedLead);
        if (parsed.email?.toLowerCase() === email.toLowerCase()) {
          setLeadData(parsed);
          setIsLeadCaptured(true);
          return parsed;
        }
      } catch {
        // Invalid stored data
      }
    }
    return null;
  }, []);

  // Capture new lead - uses backend edge function to bypass RLS restrictions
  const captureLead = useCallback(async (
    data: LeadData, 
    source: string,
    contactType: 'client' | 'broker' = 'client'
  ): Promise<boolean> => {
    try {
      // Call backend edge function which has service role access
      const { data: result, error } = await supabase.functions.invoke('capture-lead', {
        body: {
          email: data.email,
          fullName: data.fullName,
          phone: data.phone,
          nationality: data.nationality,
          language: data.language,
          birthday: data.birthday,
          currentLocation: data.currentLocation,
          ageRange: data.ageRange,
          message: data.message,
          context: data.context,
          source: source,
          pageSource: typeof window !== 'undefined' ? window.location.pathname : null,
          contactType: contactType,
        },
      });

      if (error) {
        console.error('Error capturing lead via edge function:', error);
        return false;
      }

      if ((result as any)?.error) {
        console.error('Lead capture error:', (result as any).error);
        return false;
      }

      // Save to localStorage on success
      localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(data));
      setLeadData(data);
      setIsLeadCaptured(true);
      return true;
    } catch (error) {
      console.error('Error capturing lead:', error);
      return false;
    }
  }, []);

  const clearLocalLead = useCallback(() => {
    localStorage.removeItem(LEAD_STORAGE_KEY);
    setLeadData(null);
    setIsLeadCaptured(false);
  }, []);

  return {
    isLeadCaptured,
    leadData,
    isLoading,
    checkLead,
    captureLead,
    clearLocalLead,
  };
};
