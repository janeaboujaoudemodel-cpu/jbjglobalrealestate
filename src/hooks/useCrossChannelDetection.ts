import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { allTeamMembers } from '@/config/team-members';

interface RecipientDetection {
  isRegistered: boolean;
  userId: string | null;
  displayName: string | null;
  teamMemberId: string | null;
  email: string | null;
  isLoading: boolean;
}

/**
 * Detects whether a recipient email belongs to a registered platform user.
 * First checks local team-members config, then queries backend profiles/CRM.
 */
export const useCrossChannelDetection = (recipientEmail: string) => {
  const [detection, setDetection] = useState<RecipientDetection>({
    isRegistered: false,
    userId: null,
    displayName: null,
    teamMemberId: null,
    email: null,
    isLoading: false,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const checkRecipient = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setDetection({ isRegistered: false, userId: null, displayName: null, teamMemberId: null, email: null, isLoading: false });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Step 1: Check local team members config (instant)
    const teamMatch = allTeamMembers.find(m => {
      const memberEmail = m.id + '@jbj.ae';
      return memberEmail === normalizedEmail || normalizedEmail.endsWith('@jbj.ae');
    });

    // Also check common JBJ domain emails
    if (normalizedEmail.endsWith('@jbj.ae')) {
      const localId = normalizedEmail.split('@')[0];
      const directMatch = allTeamMembers.find(m => m.id === localId || m.id === localId.replace(/-/g, ''));
      if (directMatch) {
        setDetection({
          isRegistered: true,
          userId: null,
          displayName: directMatch.name,
          teamMemberId: directMatch.id,
          email: normalizedEmail,
          isLoading: false,
        });
        return;
      }
    }

    // Step 2: Check backend profiles
    setDetection(prev => ({ ...prev, isLoading: true }));
    try {
      const { data, error } = await supabase.functions.invoke('send-owner-email', {
        body: { action: 'check_recipient', email: normalizedEmail },
      });

      if (!error && data) {
        setDetection({
          isRegistered: data.isRegistered ?? false,
          userId: data.userId ?? null,
          displayName: data.displayName ?? null,
          teamMemberId: data.teamMemberId ?? null,
          email: normalizedEmail,
          isLoading: false,
        });
      } else {
        setDetection({
          isRegistered: false,
          userId: null,
          displayName: null,
          teamMemberId: null,
          email: normalizedEmail,
          isLoading: false,
        });
      }
    } catch {
      setDetection(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => checkRecipient(recipientEmail), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [recipientEmail, checkRecipient]);

  return detection;
};

/**
 * Get a team member's email from their config (for cross-channel email sending from chat).
 */
export const getTeamMemberEmail = (memberId: string): string | null => {
  const member = allTeamMembers.find(m => m.id === memberId);
  if (!member) return null;
  // Construct email from team member ID
  return `${memberId}@jbj.ae`;
};
