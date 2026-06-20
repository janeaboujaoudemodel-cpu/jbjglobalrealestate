import { useEffect, useLayoutEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUpToLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Scrolls to top on route change
export const ScrollToTopOnMount = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

// Floating "Back to Top" button — emerald brand pill, hidden on internal workspaces
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
          data-surface="dark"
          data-allow-dark-cta
          data-no-contrast-guard
          className="allow-white fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center border border-[#B89555]/60 text-white shadow-[0_14px_32px_-12px_rgba(6,78,59,0.55),0_0_0_1px_rgba(184,149,85,0.25)] hover:-translate-y-0.5 transition-transform duration-300"
          style={{ backgroundColor: "#064E3B" }}
          aria-label="Scroll to top"
        >
          <ArrowUpToLine className="w-5 h-5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.25} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTopButton;