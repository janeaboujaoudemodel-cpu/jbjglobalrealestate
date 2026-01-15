import { ChevronLeft, ChevronRight, MessageCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface CollapsedChatButtonProps {
  onToggle: () => void;
  showAttentionPulse?: boolean;
}

const CollapsedChatButton = ({ onToggle, showAttentionPulse = false }: CollapsedChatButtonProps) => {
  const { isRTL } = useLanguage();

  return (
    <div className={`fixed bottom-24 ${isRTL ? 'left-4' : 'right-4'} z-[9000]`}>
      {/* Attention-grabbing banner when showAttentionPulse is true (desktop only) */}
      <AnimatePresence>
        {showAttentionPulse && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute -top-20 right-0 w-64 bg-gradient-to-br from-gold via-gold-dark to-gold border border-gold/50 rounded-2xl p-4 shadow-2xl shadow-gold/30 hidden sm:block"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              <div>
                <p className="text-black font-bold text-sm">Need Help?</p>
                <p className="text-black/80 text-xs mt-0.5">
                  Chat with us now – we're online and ready to assist!
                </p>
              </div>
            </div>
            {/* Pointer arrow */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-gold rotate-45 border-r border-b border-gold/50" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button with optional pulse ring - Premium black/gold styling */}
      <div className="relative">
        {showAttentionPulse && (
          <>
            <span className="absolute inset-0 rounded-full bg-gold/40 animate-ping pointer-events-none" />
            <span className="absolute inset-0 rounded-full bg-gold/20 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Mobile: always icon-only button */}
        <button
          onClick={onToggle}
          aria-label="Open chat support"
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#0E0E0E] border-2 border-gold/40 shadow-2xl shadow-gold/20 hover:border-gold transition-all duration-300 group hover:scale-105 sm:hidden"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-lg shadow-gold/30">
            <MessageCircle className="w-4 h-4 text-black" />
          </div>
        </button>

        {/* Desktop: full button */}
        <button
          onClick={onToggle}
          aria-label="Open chat support"
          className="relative hidden sm:flex items-center gap-3 bg-[#0E0E0E] border-2 border-gold/40 rounded-full px-5 py-3.5 shadow-2xl shadow-gold/20 hover:border-gold transition-all duration-300 group hover:scale-105"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center flex-shrink-0 shadow-lg shadow-gold/30">
            <MessageCircle className="w-5 h-5 text-black" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-gold text-sm font-bold">JBJ Support</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Available 24/7</span>
            </div>
          </div>
          {isRTL ? (
            <ChevronRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gold group-hover:-translate-x-1 transition-transform" />
          )}
        </button>
      </div>
    </div>
  );
};

export default CollapsedChatButton;

