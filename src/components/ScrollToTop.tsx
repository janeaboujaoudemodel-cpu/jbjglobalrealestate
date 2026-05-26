import { useEffect, useLayoutEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Scrolls to top on route change
export const ScrollToTopOnMount = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

// Floating "Back to Top" button — hidden on internal owner/admin workspaces
export const ScrollToTopButton = () => {
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  const internal =
    pathname.startsWith("/owner") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/broker") ||
    pathname.startsWith("/developers-portal") ||
    pathname.startsWith("/developer-hub");

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (internal) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-gradient-to-r from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border-2 border-[#B89555]/50 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:from-black hover:via-black hover:to-black rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(200,167,102,0.4)]"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTopButton;