import { Button } from '@/components/ui/button';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { CONTACT_INFO } from '@/constants/stats';

interface ChatSubmittedProps {
  userFirstName: string;
  onStartNewChat: () => void;
}

const ChatSubmitted = ({ userFirstName, onStartNewChat }: ChatSubmittedProps) => {
  return (
    <div className="flex-1 p-6 flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gold/20 to-gold/10 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-gold" />
      </div>
      <h4 className="text-black text-lg font-semibold mb-2">Submitted to Our Team!</h4>
      <p className="text-zinc-600 text-sm text-center mb-6 max-w-[280px]">
        Our team will review your inquiry and get back to you within 24 hours.
      </p>
      
      <div className="space-y-3 w-full max-w-xs">
        <a
          href={`https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(`Hi, I'm ${userFirstName}. I just submitted an inquiry through your AI chat.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Continue on WhatsApp
        </a>
        
        <Button
          variant="outline"
          onClick={onStartNewChat}
          className="w-full border-gold/40 text-zinc-700 hover:bg-gold/10"
        >
          Start New Chat
        </Button>
      </div>
    </div>
  );
};

export default ChatSubmitted;
