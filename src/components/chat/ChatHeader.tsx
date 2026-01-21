import { Button } from '@/components/ui/button';
import { ChevronLeft, Minus, MessageCircle } from 'lucide-react';
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
    <div className="flex items-center justify-between p-4 border-b-2 border-gold/60 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] shadow-[0_2px_10px_rgba(200,167,102,0.3)]">
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
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold shadow-lg shadow-gold/20">
            <img 
              src={agent.photo} 
              alt={agent.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-white border-2 border-gold flex items-center justify-center shadow-lg shadow-gold/20">
            <MessageCircle className="w-5 h-5 text-gold" />
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
        {/* Minimize button instead of X */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-lg bg-white border-2 border-gold text-gold hover:bg-gold/10 hover:shadow-lg hover:shadow-gold/20 transition-all"
          title="Minimize chat"
        >
          <Minus className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
