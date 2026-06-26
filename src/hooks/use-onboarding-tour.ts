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
    // Check if the device is a *real* tablet: viewport in tablet range AND
    // a coarse (touch) primary pointer. Without the pointer check, laptops
    // at 1180–1366 wide were being treated as tablets and the auto-tour
    // overlay was hijacking page scroll on the homepage.
    const checkDevice = () => {
      if (typeof window === "undefined") return false;
      const width = window.innerWidth;
      const inRange = width >= 768 && width <= 1366;
      const isTouch =
        typeof window.matchMedia === "function" &&
        (window.matchMedia("(pointer: coarse)").matches ||
          window.matchMedia("(hover: none)").matches);
      return inRange && isTouch;
    };

    setIsTablet(checkDevice());

    // Only auto-show on tablets ONCE — if it has ever been shown or
    // completed, do not auto-open again. (Users complained about repeated
    // auto-opens on every fresh load.) They can still re-open it from the
    // help menu via startTour().
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    const everShown = localStorage.getItem(TOUR_LAST_SHOWN_KEY);

    if (checkDevice() && !tourCompleted && !everShown) {
      const timer = setTimeout(() => {
        setTourRequested(true);
        requestToShow();
        localStorage.setItem(TOUR_LAST_SHOWN_KEY, new Date().toISOString());
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
