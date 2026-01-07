import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CollapsedChatButtonProps {
  onToggle: () => void;
}

const CollapsedChatButton = ({ onToggle }: CollapsedChatButtonProps) => {
  const { isRTL } = useLanguage();

  return (
    <div className={`fixed bottom-24 ${isRTL ? 'left-4' : 'right-4'} z-40`}>
      <button
        onClick={onToggle}
        className="flex items-center gap-3 bg-zinc-900/95 backdrop-blur-xl border border-gold/30 rounded-full px-4 py-3 shadow-xl hover:bg-zinc-800/95 transition-all duration-300 group hover:scale-105"
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
  );
};

export default CollapsedChatButton;
