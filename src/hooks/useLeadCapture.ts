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

// Normalize phone to E.164 format
const normalizePhone = (phone?: string): string | null => {
  if (!phone) return null;
  return phone.replace(/[\s\-\(\)]/g, '');
};

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

  // Capture new lead - saves to BOTH leads table AND crm_leads for CRM tracking
  const captureLead = useCallback(async (
    data: LeadData, 
    source: string,
    contactType: 'client' | 'broker' = 'client'
  ): Promise<boolean> => {
    try {
      const normalizedEmail = data.email.toLowerCase().trim();
      const normalizedPhone = normalizePhone(data.phone);

      // 1. Save to leads table (existing behavior)
      const { error } = await supabase
        .from('leads')
        .upsert({
          email: normalizedEmail,
          full_name: data.fullName || null,
          phone: normalizedPhone,
          nationality: data.nationality || null,
          language: data.language || null,
          birthday: data.birthday || null,
          current_location: data.currentLocation || null,
          age_range: data.ageRange || null,
          source,
          page_source: typeof window !== 'undefined' ? window.location.pathname : null,
        }, {
          onConflict: 'email',
          ignoreDuplicates: false, // Update existing record
        });

      if (error && error.code !== '23505') {
        console.error('Error capturing lead to leads table:', error);
      }

      // 2. Also save to crm_leads table for CRM dashboard access
      const { error: crmError } = await supabase
        .from('crm_leads')
        .insert({
          full_name: data.fullName || normalizedEmail.split('@')[0],
          email_lower: normalizedEmail,
          phone_e164: normalizedPhone,
          nationality: data.nationality || null,
          preferred_language: data.language || null,
          current_location_country: data.currentLocation || null,
          age_range: data.ageRange || null,
          source: source,
          owner_type: 'company_assigned' as const,
          lead_source_type: 'website',
          contact_type: contactType,
          tags: [source.replace(/_/g, '-')], // Convert source to tag format
        });

      if (crmError) {
        // If duplicate (email already exists), that's okay
        if (crmError.code !== '23505') {
          console.warn('CRM lead save warning:', crmError);
        }
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
