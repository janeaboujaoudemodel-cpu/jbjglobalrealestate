import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TourSpotlightProps {
  targetSelector: string;
  isActive: boolean;
  children?: ReactNode;
  onClose?: () => void;
  arrowPosition?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * TourSpotlight Component
 * Creates a spotlight overlay that highlights a specific UI element
 * with an animated arrow pointing to it.
 */
export const TourSpotlight = ({
  targetSelector,
  isActive,
  children,
  onClose,
  arrowPosition = 'bottom'
}: TourSpotlightProps) => {
  const [position, setPosition] = useState<SpotlightPosition | null>(null);

  useEffect(() => {
    if (!isActive || !targetSelector) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [targetSelector, isActive]);

  if (!isActive || !position) return null;

  // Calculate arrow position
  const getArrowStyle = () => {
    const padding = 8;
    switch (arrowPosition) {
      case 'top':
        return {
          top: position.top - 24 - padding,
          left: position.left + position.width / 2 - 12,
          transform: 'rotate(180deg)',
        };
      case 'bottom':
        return {
          top: position.top + position.height + padding,
          left: position.left + position.width / 2 - 12,
        };
      case 'left':
        return {
          top: position.top + position.height / 2 - 12,
          left: position.left - 24 - padding,
          transform: 'rotate(90deg)',
        };
      case 'right':
        return {
          top: position.top + position.height / 2 - 12,
          left: position.left + position.width + padding,
          transform: 'rotate(-90deg)',
        };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] pointer-events-none"
      >
        {/* Dark overlay with spotlight cutout */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <motion.rect
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                x={position.left - 8}
                y={position.top - 8}
                width={position.width + 16}
                height={position.height + 16}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Glowing border around highlighted element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute rounded-xl pointer-events-none"
          style={{
            top: position.top - 8,
            left: position.left - 8,
            width: position.width + 16,
            height: position.height + 16,
            border: '2px solid hsl(40 32% 51%)',
            boxShadow: '0 0 20px hsl(40 32% 51% / 0.5), 0 0 40px hsl(40 32% 51% / 0.3)',
          }}
        />

        {/* Animated Arrow */}
        <motion.div
          initial={{ opacity: 0, y: arrowPosition === 'bottom' ? -10 : 10 }}
          animate={{ 
            opacity: 1, 
            y: 0,
          }}
          transition={{ 
            delay: 0.2,
            y: {
              duration: 0.8,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }
          }}
          className="absolute pointer-events-none"
          style={{
            ...getArrowStyle(),
          }}
        >
          <div 
            className="w-6 h-6"
            style={{
              background: 'linear-gradient(135deg, hsl(40 45% 55%) 0%, hsl(40 32% 51%) 100%)',
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              boxShadow: '0 0 20px hsl(40 32% 51% / 0.8)',
            }}
          />
        </motion.div>

        {/* Tooltip content container */}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute pointer-events-auto"
            style={{
              top: arrowPosition === 'bottom' 
                ? position.top + position.height + 50 
                : position.top - 150,
              left: Math.max(16, Math.min(position.left + position.width / 2 - 150, window.innerWidth - 316)),
              width: 300,
            }}
          >
            {children}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default TourSpotlight;
