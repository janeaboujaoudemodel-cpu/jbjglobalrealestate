import { Button } from '@/components/ui/button';
import { ChevronLeft, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AGENT, ChatStep } from './types';

interface ChatHeaderProps {
  step: ChatStep;
  isExistingUser: boolean;
  onBack: () => void;
  onToggleCollapse: () => void;
}

const ChatHeader = ({ step, isExistingUser, onBack, onToggleCollapse }: ChatHeaderProps) => {
  const { isRTL } = useLanguage();

  const getStatusText = () => {
    switch (step) {
      case 'welcome_choice': return 'How can I help you?';
      case 'check_email': return 'Just need your email';
      case 'collect_info': return "Let's get to know you";
      case 'chat_history': return 'Your conversations';
      case 'select_service': return "What can I help with?";
      case 'chatting': return '🟢 Online • Here to help';
      case 'rating': return 'How did I do?';
      case 'submitted': return 'Thank you!';
      default: return '';
    }
  };

  const showBackButton = step !== 'welcome_choice' && step !== 'rating' && step !== 'submitted';

  return (
    <div className="flex items-center justify-between p-4 border-b border-gold/20 bg-gradient-to-r from-gold/10 to-transparent">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white/60 hover:text-white hover:bg-white/10 mr-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold/40">
          <img 
            src={AGENT.photo} 
            alt={AGENT.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">{AGENT.name}</h3>
          <p className="text-white/50 text-xs">{getStatusText()}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleCollapse}
        className="text-white/60 hover:text-white hover:bg-white/10"
        title="Minimize chat"
      >
        {isRTL ? <PanelRightOpen className="w-5 h-5" /> : <PanelRightClose className="w-5 h-5" />}
      </Button>
    </div>
  );
};

export default ChatHeader;
