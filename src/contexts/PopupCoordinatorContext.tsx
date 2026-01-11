import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Popup priority levels (lower number = higher priority)
 * STRICT: Only ONE popup visible at a time on ALL devices.
 * Popups must register and request visibility through this system.
 */
export type PopupId = 
  | 'welcome-modal'
  | 'role-selection-modal'
  | 'lead-intent-modal'
  | 'app-download-popup'
  | 'free-tools-banner'
  | 'cookies-consent'
  | 'install-app-button';

interface PopupPriority {
  id: PopupId;
  priority: number;
}

// Priority order: lower number = shows first (STRICT enforcement)
const POPUP_PRIORITIES: PopupPriority[] = [
  { id: 'welcome-modal', priority: 1 },
  { id: 'role-selection-modal', priority: 2 },
  { id: 'lead-intent-modal', priority: 3 },
  { id: 'cookies-consent', priority: 4 },
  { id: 'app-download-popup', priority: 5 },
  { id: 'free-tools-banner', priority: 6 },
  { id: 'install-app-button', priority: 10 }, // Lowest priority - floating button
];

interface PopupRequest {
  id: PopupId;
  wantsToShow: boolean;
  priority: number;
}

interface PopupCoordinatorContextType {
  /**
   * Register that a popup wants to show. The coordinator decides if it can.
   */
  requestShow: (id: PopupId) => void;
  
  /**
   * Notify that a popup is done showing (dismissed/closed).
   */
  notifyDismissed: (id: PopupId) => void;
  
  /**
   * Check if this popup is currently allowed to show.
   */
  canShow: (id: PopupId) => boolean;
  
  /**
   * Get the currently active popup (if any).
   */
  activePopup: PopupId | null;
  
  /**
   * Check if we're on mobile (stricter coordination).
   */
  isMobile: boolean;
}

const PopupCoordinatorContext = createContext<PopupCoordinatorContextType | undefined>(undefined);

interface PopupCoordinatorProviderProps {
  children: ReactNode;
}

export const PopupCoordinatorProvider: React.FC<PopupCoordinatorProviderProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState<Map<PopupId, PopupRequest>>(new Map());
  const [activePopup, setActivePopup] = useState<PopupId | null>(null);
  
  // QA Mode: Skip all popups when ?qa=1 is in URL (for testing/screenshots)
  const isQAMode = useMemo(() => searchParams.get('qa') === '1', [searchParams]);

  // Get priority for a popup
  const getPriority = useCallback((id: PopupId): number => {
    const found = POPUP_PRIORITIES.find(p => p.id === id);
    return found?.priority ?? 100;
  }, []);

  // Request to show a popup
  const requestShow = useCallback((id: PopupId) => {
    setRequests(prev => {
      const newRequests = new Map(prev);
      newRequests.set(id, {
        id,
        wantsToShow: true,
        priority: getPriority(id),
      });
      return newRequests;
    });
  }, [getPriority]);

  // Notify that a popup is dismissed
  const notifyDismissed = useCallback((id: PopupId) => {
    setRequests(prev => {
      const newRequests = new Map(prev);
      newRequests.delete(id);
      return newRequests;
    });
  }, []);

  // STRICT: Determine which popup should be active - ONLY ONE at a time
  useEffect(() => {
    const pendingRequests = Array.from(requests.values())
      .filter(r => r.wantsToShow)
      .sort((a, b) => a.priority - b.priority);

    if (pendingRequests.length === 0) {
      setActivePopup(null);
    } else {
      // STRICT: Only ONE popup at a time - highest priority wins
      // Modal popups take precedence over floating buttons
      const modals = pendingRequests.filter(r => r.id !== 'install-app-button');
      const installButton = pendingRequests.find(r => r.id === 'install-app-button');
      
      if (modals.length > 0) {
        // Show only the highest priority modal
        setActivePopup(modals[0].id);
      } else if (installButton) {
        // Only show install button when no modals are active
        setActivePopup(installButton.id);
      } else {
        setActivePopup(null);
      }
    }
  }, [requests]);

  // STRICT: Only active popup can show - no exceptions
  const canShow = useCallback((id: PopupId): boolean => {
    // QA Mode: Block all popups for testing/screenshots
    if (isQAMode) return false;
    
    const request = requests.get(id);
    if (!request?.wantsToShow) return false;

    // Install button can show when no modals are active
    if (id === 'install-app-button') {
      const activeIsModal = activePopup && activePopup !== 'install-app-button';
      return !activeIsModal;
    }
    
    // All other popups: only if they are the active popup
    return activePopup === id;
  }, [requests, activePopup, isQAMode]);

  return (
    <PopupCoordinatorContext.Provider
      value={{
        requestShow,
        notifyDismissed,
        canShow,
        activePopup,
        isMobile,
      }}
    >
      {children}
    </PopupCoordinatorContext.Provider>
  );
};

export const usePopupCoordinator = (): PopupCoordinatorContextType => {
  const context = useContext(PopupCoordinatorContext);
  if (!context) {
    throw new Error('usePopupCoordinator must be used within PopupCoordinatorProvider');
  }
  return context;
};

/**
 * Hook for individual popups to use. Handles registration and visibility.
 */
export const usePopupVisibility = (id: PopupId) => {
  const { requestShow, notifyDismissed, canShow, isMobile } = usePopupCoordinator();
  const [wantsToShow, setWantsToShow] = useState(false);

  // When the popup wants to show, register with coordinator
  useEffect(() => {
    if (wantsToShow) {
      requestShow(id);
    } else {
      notifyDismissed(id);
    }
  }, [wantsToShow, id, requestShow, notifyDismissed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      notifyDismissed(id);
    };
  }, [id, notifyDismissed]);

  return {
    /**
     * Call this when the popup determines it should try to show.
     */
    requestToShow: () => setWantsToShow(true),
    
    /**
     * Call this when the popup is dismissed.
     */
    dismiss: () => setWantsToShow(false),
    
    /**
     * Whether the popup is currently allowed to render/show.
     */
    isVisible: wantsToShow && canShow(id),
    
    /**
     * Whether we're on mobile (for additional UI adjustments).
     */
    isMobile,
  };
};
