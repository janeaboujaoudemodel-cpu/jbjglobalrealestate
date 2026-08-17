import { useEffect, useLayoutEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUpToLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Scrolls to top on route change, or to the #hash target when one is present.
// Lazy-loaded route content may not exist in the DOM yet on the first pass
// (React.lazy + Suspense swap it in asynchronously), so retry briefly via
// rAF instead of giving up and stranding the anchor link at the page top.
export const ScrollToTopOnMount = () => {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      let attempts = 0;
      let frame: number;
      const tryScroll = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "instant", block: "start" });
        } else if (attempts++ < 30) {
          frame = requestAnimationFrame(tryScroll);
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
      };
      tryScroll();
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

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
          data-surface="emerald"
          data-emerald-ok="button"
          className="jj-surface-emerald fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center hover:-translate-y-0.5 transition-transform duration-300"
          aria-label="Scroll to top"
        >
          <ArrowUpToLine className="w-5 h-5" strokeWidth={2.25} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTopButton;