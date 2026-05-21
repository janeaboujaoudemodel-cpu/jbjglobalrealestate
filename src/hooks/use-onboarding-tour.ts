import { useState, useEffect } from "react";
import { usePopupVisibility } from "@/contexts/PopupCoordinatorContext";

const TOUR_COMPLETED_KEY = "jj_tour_completed";
const TOUR_LAST_SHOWN_KEY = "jj_tour_last_shown";

/**
 * Hook to manage the onboarding tour experience.
 * Shows the tour automatically for tablet users on first visit.
 * Provides functions to control tour visibility.
 */
export function useOnboardingTour() {
  const { requestToShow, dismiss, isVisible } = usePopupVisibility('guided-tour');
  const [tourRequested, setTourRequested] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    // Check if the device is a tablet (768px - 1366px viewport width)
    const checkDevice = () => {
      const width = window.innerWidth;
      return width >= 768 && width <= 1366;
    };

    setIsTablet(checkDevice());

    // Only auto-show on tablets that haven't completed the tour
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    const lastShown = localStorage.getItem(TOUR_LAST_SHOWN_KEY);
    const today = new Date().toDateString();

    // Show tour if:
    // 1. It's a tablet device
    // 2. Tour hasn't been completed
    // 3. Tour wasn't already shown today (prevents repeated triggers on same session)
    if (checkDevice() && !tourCompleted && lastShown !== today) {
      // Delay to let page load and render fully
      const timer = setTimeout(() => {
        setTourRequested(true);
        requestToShow();
        localStorage.setItem(TOUR_LAST_SHOWN_KEY, today);
      }, 2500);

      return () => clearTimeout(timer);
    }

    // Also listen for resize events
    const handleResize = () => {
      setIsTablet(checkDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [requestToShow]);

  const completeTour = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, "true");
    setTourRequested(false);
    dismiss();
  };

  const resetTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    localStorage.removeItem(TOUR_LAST_SHOWN_KEY);
  };

  const startTour = () => {
    setTourRequested(true);
    requestToShow();
  };

  const setShowTour = (next: boolean) => {
    setTourRequested(next);
    if (next) requestToShow();
    else dismiss();
  };

  return { 
    showTour: tourRequested && isVisible, 
    setShowTour, 
    completeTour, 
    resetTour, 
    startTour,
    isTablet 
  };
}
