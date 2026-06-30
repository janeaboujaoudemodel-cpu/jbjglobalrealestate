import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Minus, Eraser } from 'lucide-react';
import { SquareChatIcon } from '@/components/ui/SquareChatIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChatStep, getRandomAgent } from './types';
import { useMemo } from 'react';

interface ChatHeaderProps {
  step: ChatStep;
  isExistingUser: boolean;
  onBack: () => void;
  onToggleCollapse: () => void;
  onClearChat?: () => void;
}

const ChatHeader = React.forwardRef<HTMLDivElement, ChatHeaderProps>(({ step, isExistingUser, onBack, onToggleCollapse, onClearChat }, ref) => {

  const { isRTL, t } = useLanguage();
  const agent = useMemo(() => getRandomAgent(), []);

  const getStatusText = () => {
    switch (step) {
      case 'welcome_choice': return t('chat.howCanWeHelp', 'How can we help you?');
      case 'check_email': return t('chat.justNeedEmail', 'Just need your email');
      case 'confirm_details': return t('chat.confirmYourDetails', 'Confirm your details');
      case 'collect_info': return t('chat.letsGetToKnow', "Let's get to know you");
      case 'chat_history': return t('chat.yourConversations', 'Your conversations');
      case 'select_service': return t('chat.whatCanWeHelp', "What can we help with?");
      case 'agent_joining': return t('chat.connectingYou', 'Connecting you...');
      case 'chatting': return t('chat.onlineHereToHelp', '🟢 Online • Here to help');
      case 'rating': return t('chat.howDidWeDo', 'How did we do?');
      case 'submitted': return t('chat.thankYou', 'Thank you!');
      default: return '';
    }
  };

  const showBackButton = step !== 'welcome_choice' && step !== 'rating' && step !== 'submitted' && step !== 'agent_joining';
  const showAgentPhoto = step === 'chatting';

  return (
    <div
      ref={ref}
      className="shrink-0 flex items-center justify-between p-4 border-b border-[#B89555]/30"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.70) 0%, rgba(247,242,234,0.45) 100%)",
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
      }}
    >

      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5 mr-1"
          >
            {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        )}
        {showAgentPhoto ? (
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#B89555] shadow-lg shadow-gold/20">
            <img 
              src={agent.photo} 
              alt={agent.name}
              className="w-full h-full object-cover"
             loading="lazy" decoding="async" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#FDFBF7] border-2 border-[#B89555] flex items-center justify-center shadow-lg shadow-gold/20">
            <SquareChatIcon className="w-5 h-5 text-[#1A1A1A]" size={20} />
          </div>
        )}
        <div>
          <h3 className="text-[#1A1A1A] font-bold text-sm flex items-center gap-1.5">
            {showAgentPhoto ? agent.name : t('chat.title', 'JBJ Support')}
          </h3>
          <p className="text-[#1A1A1A]/70 text-xs font-medium">{getStatusText()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-[#EFE6D6]/10 rounded-full border border-[#B89555]/40">
          <div className="w-2 h-2 rounded-full bg-[#EFE6D6] animate-pulse" />
          <span className="text-[#1A1A1A] text-[10px] font-semibold">{t('chat.available247', 'Available 24/7')}</span>
        </div>
        {onClearChat && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearChat}
            className="w-10 h-10 rounded-lg bg-[#FDFBF7] border border-[#B89555]/60 text-[#1A1A1A] hover:bg-[#EFE6D6]/40 hover:border-[#B89555] hover:shadow-lg hover:shadow-gold/20 transition-all"
            title={t('chat.clearChat', 'Clear chat')}
            aria-label={t('chat.clearChat', 'Clear chat')}
          >
            <Eraser className="w-4 h-4" />
          </Button>
        )}

        {/* Minimize button instead of X */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-lg bg-[#FDFBF7] border-2 border-[#B89555] text-[#1A1A1A] hover:bg-[#EFE6D6]/10 hover:shadow-lg hover:shadow-gold/20 transition-all"
          title={t('chat.minimize', 'Minimize chat')}
        >
          <Minus className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
});

ChatHeader.displayName = 'ChatHeader';

export default ChatHeader;
