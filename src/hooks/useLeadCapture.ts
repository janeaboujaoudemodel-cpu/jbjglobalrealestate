import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeadData {
  email: string;
  fullName?: string;
  phone?: string;
  nationality?: string;
  language?: string;
}

interface UseLeadCaptureResult {
  isLeadCaptured: boolean;
  leadData: LeadData | null;
  isLoading: boolean;
  checkLead: (email: string) => Promise<LeadData | null>;
  captureLead: (data: LeadData, source: string) => Promise<boolean>;
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

  // Capture new lead
  const captureLead = useCallback(async (data: LeadData, source: string): Promise<boolean> => {
    try {
      // Try to insert, on conflict do nothing (email already exists)
      const { error } = await supabase
        .from('leads')
        .upsert({
          email: data.email.toLowerCase(),
          full_name: data.fullName || null,
          phone: data.phone || null,
          nationality: data.nationality || null,
          language: data.language || null,
          source,
        }, {
          onConflict: 'email',
          ignoreDuplicates: false, // Update existing record
        });

      if (error) {
        // If it's a unique constraint violation, the lead already exists
        if (error.code === '23505') {
          // Still save locally as it means we have the lead
          localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(data));
          setLeadData(data);
          setIsLeadCaptured(true);
          return true;
        }
        console.error('Error capturing lead:', error);
        return false;
      }

      // Save to localStorage
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
