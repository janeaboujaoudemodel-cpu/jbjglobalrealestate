import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { SquareChatIcon } from '@/components/ui/SquareChatIcon';

interface CollapsedChatButtonProps {
  onToggle: () => void;
  showAttentionPulse?: boolean;
}

const CollapsedChatButton = ({ onToggle, showAttentionPulse = false }: CollapsedChatButtonProps) => {
  const { isRTL } = useLanguage();

  return (
    <div className={`fixed bottom-24 ${isRTL ? 'left-4' : 'right-4'} z-[9000]`}>
      {/* Attention-grabbing banner when showAttentionPulse is true (desktop only) - using champagne active color */}
      <AnimatePresence>
        {showAttentionPulse && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute -top-20 right-0 w-64 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-black/20 rounded-2xl p-4 shadow-2xl shadow-black/20 hidden sm:block"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-[#D4C4A8]" />
              </div>
              <div>
                <p className="text-black font-bold text-sm">Need Help?</p>
                <p className="text-black/80 text-xs mt-0.5">
                  Chat with us now – we're online and ready to assist!
                </p>
              </div>
            </div>
            {/* Pointer arrow */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-[#D4C4A8] rotate-45 border-r border-b border-black/20" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button with optional pulse ring - Premium champagne styling */}
      <div className="relative">
        {showAttentionPulse && (
          <>
            <span className="absolute inset-0 rounded-xl bg-[#D4C4A8]/40 animate-ping pointer-events-none" />
            <span className="absolute inset-0 rounded-xl bg-[#E8DCC8]/30 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Mobile: always icon-only button - Premium white square style with black border */}
        <button
          onClick={onToggle}
          aria-label="Open chat support"
          className="relative flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-2 border-black shadow-2xl shadow-black/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300 group hover:scale-105 sm:hidden"
        >
          <SquareChatIcon className="w-6 h-6 text-black" size={24} />
        </button>

        {/* Desktop: full button - Premium white/champagne style with black elements */}
        <button
          onClick={onToggle}
          aria-label="Open chat support"
          className="relative hidden sm:flex items-center gap-3 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-2 border-black rounded-xl px-5 py-3.5 shadow-2xl shadow-black/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300 group hover:scale-105"
        >
          <div className="w-11 h-11 rounded-lg bg-white border-2 border-black flex items-center justify-center flex-shrink-0 shadow-md">
            <SquareChatIcon className="w-5 h-5 text-black" size={20} />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-black text-sm font-bold">JBJ Support</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span className="text-gold text-xs font-medium">Available 24/7</span>
            </div>
          </div>
          {isRTL ? (
            <ChevronRight className="w-5 h-5 text-black group-hover:translate-x-1 transition-transform" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-black group-hover:-translate-x-1 transition-transform" />
          )}
        </button>
      </div>
    </div>
  );
};

export default CollapsedChatButton;

