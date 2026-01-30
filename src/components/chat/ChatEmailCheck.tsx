import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, ArrowRight, User, Phone } from 'lucide-react';
import { validateEmail } from './types';
import jbjMonogramLightBg from "@/assets/jbj-monogram-light-bg.png";

interface ChatEmailCheckProps {
  onEmailVerified: (email: string, isExisting: boolean, userData?: any) => void;
  checkEmailInDatabase: (email: string) => Promise<{ exists: boolean; data?: any }>;
}

const ChatEmailCheck = ({ onEmailVerified, checkEmailInDatabase }: ChatEmailCheckProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckEmail = async () => {
    if (!email.trim() || !validateEmail(email)) {
      return;
    }

    setIsChecking(true);
    try {
      const result = await checkEmailInDatabase(email.toLowerCase().trim());
      onEmailVerified(email.toLowerCase().trim(), result.exists, { ...result.data, name, phone });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex-1 p-4 flex flex-col">
      {/* Logo at top - reduced size */}
      <div className="text-center mb-3">
        <img
          src={jbjMonogramLightBg}
          alt="JBJ Global Real Estate"
          className="h-24 w-auto mx-auto object-contain"
        />
      </div>

      {/* Header */}
      <div className="text-center mb-4">
        <h4 className="text-gold text-lg font-semibold mb-1">Connect With Our Team</h4>
        <p className="text-zinc-700 text-sm">Share your details to receive personalized assistance</p>
      </div>

      {/* Form fields */}
      <div className="space-y-3 flex-1">
        <div>
          <Label className="text-black text-sm flex items-center gap-2 mb-1.5">
            <User className="w-4 h-4 text-gold" />
            Your Name
          </Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="bg-white border-gold/30 text-black placeholder:text-zinc-400 h-11"
          />
        </div>

        <div>
          <Label className="text-black text-sm flex items-center gap-2 mb-1.5">
            <Mail className="w-4 h-4 text-gold" />
            Email Address
          </Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCheckEmail()}
            placeholder="your@email.com"
            className="bg-white border-gold/30 text-black placeholder:text-zinc-400 h-11"
            autoFocus
          />
        </div>

        <div>
          <Label className="text-black text-sm flex items-center gap-2 mb-1.5">
            <Phone className="w-4 h-4 text-gold" />
            Phone Number <span className="text-zinc-400 text-xs">(optional)</span>
          </Label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+971 XX XXX XXXX"
            className="bg-white border-gold/30 text-black placeholder:text-zinc-400 h-11"
          />
        </div>

        <Button
          onClick={handleCheckEmail}
          disabled={isChecking || !email.trim()}
          className="w-full h-12 bg-gradient-to-r from-gold to-gold/80 hover:from-gold/90 hover:to-gold/70 text-black font-semibold mt-2"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              Continue to Support
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        <p className="text-zinc-500 text-xs text-center mt-2">
          Your information is secure and will only be used to provide you with the best service.
        </p>
      </div>
    </div>
  );
};

export default ChatEmailCheck;
