import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ContactGatingData } from '@/components/ContactGatingModal';

// Actions that require contact gating
const GATED_ACTIONS = [
  'download',
  'tool_usage',
  'quiz',
  'chat_support',
  'inquiry',
  'calculator',
  'ai_tool',
  'form_submission',
  'document_view',
  'schedule_meeting',
];

export const useContactGating = () => {
  const { user } = useAuth();
  const [showGatingModal, setShowGatingModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [triggerSource, setTriggerSource] = useState<string>('');
  const [contactData, setContactData] = useState<ContactGatingData | null>(null);

  // Check if contact gating is already completed
  useEffect(() => {
    const savedData = localStorage.getItem('contact_gating_data');
    if (savedData) {
      try {
        setContactData(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to parse contact data:', e);
      }
    }
  }, []);

  const isGatingCompleted = useCallback((): boolean => {
    // If user is logged in, they don't need to complete gating
    if (user) return true;
    
    // Check localStorage for completion
    return localStorage.getItem('contact_gating_completed') === 'true';
  }, [user]);

  const requireGating = useCallback((action: string, callback: () => void) => {
    // Check if this action requires gating
    const requiresGating = GATED_ACTIONS.some(
      gatedAction => action.toLowerCase().includes(gatedAction)
    );

    if (!requiresGating || isGatingCompleted()) {
      // Action doesn't require gating or already completed
      callback();
      return;
    }

    // Show gating modal
    setTriggerSource(action);
    setPendingAction(() => callback);
    setShowGatingModal(true);
  }, [isGatingCompleted]);

  const handleGatingComplete = useCallback((data: ContactGatingData) => {
    setContactData(data);
    setShowGatingModal(false);
    
    // Execute pending action
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const closeGatingModal = useCallback(() => {
    setShowGatingModal(false);
    setPendingAction(null);
    setTriggerSource('');
  }, []);

  const getContactData = useCallback((): ContactGatingData | null => {
    if (contactData) return contactData;
    
    const savedData = localStorage.getItem('contact_gating_data');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [contactData]);

  return {
    showGatingModal,
    triggerSource,
    contactData,
    isGatingCompleted,
    requireGating,
    handleGatingComplete,
    closeGatingModal,
    getContactData,
  };
};

export default useContactGating;
