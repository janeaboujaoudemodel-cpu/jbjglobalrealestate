import { Button } from '@/components/ui/button';
import { ChevronLeft, PanelRightClose, PanelRightOpen, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChatStep, getRandomAgent } from './types';
import { useMemo } from 'react';

interface ChatHeaderProps {
  step: ChatStep;
  isExistingUser: boolean;
  onBack: () => void;
  onToggleCollapse: () => void;
}

const ChatHeader = ({ step, isExistingUser, onBack, onToggleCollapse }: ChatHeaderProps) => {
  const { isRTL } = useLanguage();
  const agent = useMemo(() => getRandomAgent(), []);

  const getStatusText = () => {
    switch (step) {
      case 'welcome_choice': return 'How can we help you?';
      case 'check_email': return 'Just need your email';
      case 'collect_info': return "Let's get to know you";
      case 'chat_history': return 'Your conversations';
      case 'select_service': return "What can we help with?";
      case 'agent_joining': return 'Connecting you...';
      case 'chatting': return '🟢 Online • Here to help';
      case 'rating': return 'How did we do?';
      case 'submitted': return 'Thank you!';
      default: return '';
    }
  };

  const showBackButton = step !== 'welcome_choice' && step !== 'rating' && step !== 'submitted' && step !== 'agent_joining';
  const showAgentPhoto = step === 'chatting';

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
        {showAgentPhoto ? (
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold/40">
            <img 
              src={agent.photo} 
              alt={agent.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold/70 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-black" />
          </div>
        )}
        <div>
          <h3 className="text-white font-semibold text-sm">
            {showAgentPhoto ? agent.name : 'JBJ Global Real Estate'}
          </h3>
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
