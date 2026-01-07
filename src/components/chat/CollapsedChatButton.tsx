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
    <div className={`fixed bottom-24 ${isRTL ? 'left-4' : 'right-4'} z-40`}>
      {/* Attention-grabbing banner when showAttentionPulse is true */}
      <AnimatePresence>
        {showAttentionPulse && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute -top-20 right-0 w-64 bg-gradient-to-br from-gold via-gold-dark to-gold border border-gold/50 rounded-2xl p-4 shadow-2xl shadow-gold/30"
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

      {/* Main button with optional pulse ring */}
      <div className="relative">
        {showAttentionPulse && (
          <>
            <span className="absolute inset-0 rounded-full bg-gold/40 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-gold/20 animate-pulse" />
          </>
        )}
        <button
          onClick={onToggle}
          className="relative flex items-center gap-3 bg-zinc-900/95 backdrop-blur-xl border border-gold/30 rounded-full px-4 py-3 shadow-xl hover:bg-zinc-800/95 transition-all duration-300 group hover:scale-105"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold/70 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-black" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-white text-sm font-semibold">Chat Support</span>
            <span className="text-gold/80 text-xs">We're online</span>
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
