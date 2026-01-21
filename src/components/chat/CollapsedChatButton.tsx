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
      {/* Main button - On mobile and desktop, show medium box with pulse on first daily load */}
      <div className="relative">
        {showAttentionPulse && (
          <>
            <span className="absolute inset-0 rounded-xl bg-gold/30 animate-ping pointer-events-none" />
            <span className="absolute inset-0 rounded-xl bg-gold/20 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Show medium box with attention pulse (first daily load) on ALL devices */}
        {showAttentionPulse ? (
          <button
            onClick={onToggle}
            aria-label="Open chat support"
            className="relative flex items-center gap-3 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-2 border-gold rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 shadow-2xl shadow-gold/20 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] transition-all duration-300 group hover:scale-105"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white border-2 border-gold flex items-center justify-center flex-shrink-0 shadow-md shadow-gold/20">
              <SquareChatIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gold" size={20} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-black text-sm font-bold">JBJ Support</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <span className="text-gold text-xs font-medium">Available 24/7</span>
              </div>
            </div>
            {isRTL ? (
              <ChevronRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gold group-hover:-translate-x-1 transition-transform" />
            )}
          </button>
        ) : (
          /* Small icon state - ACTIVE COLOR */
          <button
            onClick={onToggle}
            aria-label="Open chat support"
            className="relative flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold shadow-2xl shadow-gold/20 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] transition-all duration-300 group hover:scale-105"
          >
            <SquareChatIcon className="w-6 h-6 text-gold" size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CollapsedChatButton;

