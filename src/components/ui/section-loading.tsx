import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionLoadingProps {
  className?: string;
}

/**
 * Premium section loading animation component
 * Shows a subtle shimmer effect while content loads
 */
export const SectionLoading = ({ className }: SectionLoadingProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "relative overflow-hidden rounded-xl",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      <div className="h-full w-full bg-[#1A1A1A]/50 backdrop-blur-sm" />
    </motion.div>
  );
};

/**
 * Animation variants for section fade-in
 */
export const sectionFadeIn = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.98
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

/**
 * Stagger container for child animations
 */
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

/**
 * Card animation variant
 */
export const cardFadeIn = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

/**
 * Text animation variant
 */
export const textFadeIn = {
  hidden: { 
    opacity: 0, 
    y: 15
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export default SectionLoading;
