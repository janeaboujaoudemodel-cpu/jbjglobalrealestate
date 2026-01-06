import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AGENT } from './types';

interface CollapsedChatButtonProps {
  onToggle: () => void;
}

const CollapsedChatButton = ({ onToggle }: CollapsedChatButtonProps) => {
  const { isRTL } = useLanguage();

  return (
    <div className={`fixed top-1/2 -translate-y-1/2 ${isRTL ? 'left-0' : 'right-0'} z-40`}>
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 bg-zinc-900/95 backdrop-blur-xl border border-gold/30 ${isRTL ? 'rounded-r-xl border-l-0 pl-2 pr-3' : 'rounded-l-xl border-r-0 pr-2 pl-3'} py-4 shadow-xl hover:bg-zinc-800/95 transition-colors group`}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold/40 flex-shrink-0">
          <img 
            src={AGENT.photo} 
            alt={AGENT.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-white text-sm font-medium">{AGENT.name}</span>
          <span className="text-gold text-xs">Chat with me</span>
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
