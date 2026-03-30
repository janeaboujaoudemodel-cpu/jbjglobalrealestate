import { useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SquareChatIcon } from '@/components/ui/SquareChatIcon';

interface CollapsedChatButtonProps {
  onToggle: () => void;
  onMinimize?: () => void;
  showAttentionPulse?: boolean;
}

const CollapsedChatButton = ({ onToggle }: CollapsedChatButtonProps) => {
  const { isRTL, t } = useLanguage();

  return (
    <div
      className={`fixed bottom-20 ${isRTL ? 'left-4' : 'right-6'} z-[10050]`}
    >
      <div className="relative">
        <div
          onClick={onToggle}
          aria-label={t('chat.openChat', 'Open chat support')}
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold shadow-2xl shadow-gold/20 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] transition-shadow duration-300 cursor-pointer select-none"
        >
          <SquareChatIcon className="w-6 h-6 text-gold" size={24} />
        </div>
      </div>
    </div>
  );
};

export default CollapsedChatButton;
