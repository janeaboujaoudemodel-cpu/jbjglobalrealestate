import { ChevronLeft, ChevronRight, Minus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SquareChatIcon } from '@/components/ui/SquareChatIcon';
import { useIsMobile } from '@/hooks/use-mobile';

interface CollapsedChatButtonProps {
  onToggle: () => void;
  onMinimize?: () => void;
  showAttentionPulse?: boolean;
}

const CollapsedChatButton = ({ onToggle, onMinimize, showAttentionPulse = false }: CollapsedChatButtonProps) => {
  const { isRTL, t } = useLanguage();
  const isMobile = useIsMobile();

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMinimize?.();
  };

  return (
    <div className={`fixed bottom-6 ${isRTL ? 'left-4' : 'right-4'} z-[10050]`}>
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
          <div className="relative">
            <button
              onClick={onToggle}
              aria-label={t('chat.openChat', 'Open chat support')}
              className="relative flex items-center gap-3 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 shadow-2xl shadow-gold/20 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] transition-all duration-300 group hover:scale-105"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold flex items-center justify-center flex-shrink-0 shadow-md shadow-gold/20">
                <SquareChatIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gold" size={20} />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-black text-sm font-bold">{t('chat.title', 'JBJ Support')}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                  <span className="text-gold text-xs font-medium">{t('chat.available247', 'Available 24/7')}</span>
                </div>
              </div>
              {isRTL ? (
                <ChevronRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform hidden sm:block" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gold group-hover:-translate-x-1 transition-transform hidden sm:block" />
              )}
            </button>
            {/* Minimize button - always visible on all devices */}
            {onMinimize && (
              <button
                onClick={handleMinimize}
                aria-label={t('chat.minimize', 'Minimize chat')}
                className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-gold rounded-full flex items-center justify-center shadow-lg hover:bg-gold/10 transition-colors z-10"
              >
                <Minus className="w-4 h-4 text-gold" />
              </button>
            )}
          </div>
        ) : (
          /* Small icon state - ACTIVE COLOR */
          <button
            onClick={onToggle}
            aria-label={t('chat.openChat', 'Open chat support')}
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
