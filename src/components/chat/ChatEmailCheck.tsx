import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, Bot } from 'lucide-react';
import { AGENT, validateEmail } from './types';

interface ChatEmailCheckProps {
  onEmailVerified: (email: string, isExisting: boolean, userData?: any) => void;
  checkEmailInDatabase: (email: string) => Promise<{ exists: boolean; data?: any }>;
}

const ChatEmailCheck = ({ onEmailVerified, checkEmailInDatabase }: ChatEmailCheckProps) => {
  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckEmail = async () => {
    if (!email.trim() || !validateEmail(email)) {
      return;
    }

    setIsChecking(true);
    try {
      const result = await checkEmailInDatabase(email.toLowerCase().trim());
      onEmailVerified(email.toLowerCase().trim(), result.exists, result.data);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col justify-center">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden border-2 border-gold/40">
          <img 
            src={AGENT.photo} 
            alt={AGENT.name}
            className="w-full h-full object-cover"
          />
        </div>
        <h4 className="text-white text-lg font-semibold mb-2">Nice to meet you!</h4>
        <p className="text-zinc-400 text-sm">Just pop in your email so I can give you personalized help</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-zinc-300 text-sm flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-gold" />
            Email Address
          </Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCheckEmail()}
            placeholder="your@email.com"
            className="bg-white/10 border-gold/20 text-white placeholder:text-white/40 h-12 text-base"
            autoFocus
          />
        </div>

        <Button
          onClick={handleCheckEmail}
          disabled={isChecking || !email.trim()}
          className="w-full h-12 bg-gradient-to-r from-gold to-gold/80 hover:from-gold/90 hover:to-gold/70 text-black font-semibold"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              Continue to AI Chat
              <Bot className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        <p className="text-zinc-500 text-xs text-center mt-4">
          Been here before? I'll remember you! New here? Quick intro and we're good to go.
        </p>
      </div>
    </div>
  );
};

export default ChatEmailCheck;
