import { Button } from '@/components/ui/button';
import { ChevronLeft, X, MessageCircle } from 'lucide-react';
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
    <div className="flex items-center justify-between p-4 border-b-2 border-black bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6]">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-black hover:text-gold hover:bg-black/5 mr-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        {showAgentPhoto ? (
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-black shadow-lg">
            <img 
              src={agent.photo} 
              alt={agent.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-white border-2 border-black flex items-center justify-center shadow-lg">
            <MessageCircle className="w-5 h-5 text-black" />
          </div>
        )}
        <div>
          <h3 className="text-black font-bold text-sm flex items-center gap-1.5">
            {showAgentPhoto ? agent.name : 'JBJ Support'}
          </h3>
          <p className="text-zinc-600 text-xs font-medium">{getStatusText()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-gold/10 rounded-full border border-gold/40">
          <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <span className="text-gold text-[10px] font-semibold">Available 24/7</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-lg bg-white border-2 border-black text-black hover:bg-zinc-100 hover:shadow-lg transition-all"
          title="Close chat"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
