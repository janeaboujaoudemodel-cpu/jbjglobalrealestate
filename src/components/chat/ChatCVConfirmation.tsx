import { Button } from '@/components/ui/button';
import { CheckCircle2, Home, RefreshCw } from 'lucide-react';
import { T } from '@/components/ui/T';

interface ChatCVConfirmationProps {
  userFirstName: string;
  onStartNewChat: () => void;
  onGoToShortcuts: () => void;
}

const ChatCVConfirmation = ({ userFirstName, onStartNewChat, onGoToShortcuts }: ChatCVConfirmationProps) => {
  return (
    <div className="flex-1 p-6 flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      </div>
      <h4 className="text-black text-lg font-semibold mb-2 text-center">
        <T>Thank You! Your CV Has Been Received</T>
      </h4>
      <p className="text-gray-600 text-sm text-center mb-6 max-w-[280px]">
        <T>Your application has been submitted successfully. Our HR team will review your CV and contact you soon.</T>
      </p>
      
      <div className="space-y-3 w-full max-w-xs">
        <Button
          onClick={onGoToShortcuts}
          className="w-full bg-gold hover:bg-gold-light hover:shadow-[0_6px_20px_rgba(200,167,102,0.5)] text-black font-bold py-3 rounded-xl transition-all duration-200"
        >
          <Home className="w-5 h-5 mr-2" />
          <T>Back to Main Menu</T>
        </Button>
        
        <Button
          variant="outline"
          onClick={onStartNewChat}
          className="w-full border-gray-400 text-gray-700 hover:bg-gray-100"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          <T>Start New Chat</T>
        </Button>
      </div>
    </div>
  );
};

export default ChatCVConfirmation;
