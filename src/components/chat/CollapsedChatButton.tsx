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
      {/* Daily attention banner - shows medium rectangle on first daily load */}
      <AnimatePresence>
        {showAttentionPulse && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute -top-20 right-0 w-64 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-2xl p-4 shadow-2xl shadow-gold/20 hidden sm:block"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-black font-bold text-sm">Need Help?</p>
                <p className="text-black/80 text-xs mt-0.5">
                  Chat with us now – we're online and ready to assist!
                </p>
              </div>
            </div>
            {/* Pointer arrow */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-[#D4C4A8] rotate-45 border-r border-b border-gold/40" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button - single click opens full chat */}
      <div className="relative">
        {showAttentionPulse && (
          <>
            <span className="absolute inset-0 rounded-xl bg-gold/30 animate-ping pointer-events-none" />
            <span className="absolute inset-0 rounded-xl bg-gold/20 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Mobile: always icon-only button - clicks open full chat */}
        <button
          onClick={onToggle}
          aria-label="Open chat support"
          className="relative flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-2 border-gold shadow-2xl shadow-gold/20 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] transition-all duration-300 group hover:scale-105 sm:hidden"
        >
          <SquareChatIcon className="w-6 h-6 text-gold" size={24} />
        </button>

        {/* Desktop: Show medium box on first daily load, otherwise small icon */}
        {showAttentionPulse ? (
          /* Medium box state - first daily load - click opens full chat */
          <button
            onClick={onToggle}
            aria-label="Open chat support"
            className="relative hidden sm:flex items-center gap-3 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-2 border-gold rounded-xl px-5 py-3.5 shadow-2xl shadow-gold/20 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] transition-all duration-300 group hover:scale-105"
          >
            <div className="w-11 h-11 rounded-lg bg-white border-2 border-gold flex items-center justify-center flex-shrink-0 shadow-md shadow-gold/20">
              <SquareChatIcon className="w-5 h-5 text-gold" size={20} />
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
          /* Small icon state - shown after first interaction or subsequent visits same day */
          <button
            onClick={onToggle}
            aria-label="Open chat support"
            className="relative hidden sm:flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-2 border-gold shadow-2xl shadow-gold/20 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] transition-all duration-300 group hover:scale-105"
          >
            <SquareChatIcon className="w-6 h-6 text-gold" size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CollapsedChatButton;

