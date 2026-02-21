import React, { useState, useRef, useCallback } from 'react';
import { Send, ArrowRight, User, Mail, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateEmail, validateE164Phone, getRandomAgent } from './types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatConversationalCollectProps {
  onComplete: (info: { firstName: string; lastName: string; email: string; phone: string }) => void;
  onPreferForm: () => void;
  initialEmail?: string;
  detectedFullName?: string;
}

type CollectStep = 'confirm_name' | 'name' | 'email' | 'phone' | 'complete';

const ChatConversationalCollect = React.memo(({ onComplete, onPreferForm, initialEmail = '', detectedFullName }: ChatConversationalCollectProps) => {
  const { t } = useLanguage();
  const agent = getRandomAgent();
  
  const [collectStep, setCollectStep] = useState<CollectStep>(detectedFullName ? 'confirm_name' : 'name');
  const [fullName, setFullName] = useState(detectedFullName || '');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [nameConfirmed, setNameConfirmed] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const simulateTyping = useCallback((callback: () => void, delay = 400) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, delay);
  }, []);

  const handleConfirmName = useCallback(() => {
    setNameConfirmed(true);
    setError('');
    simulateTyping(() => {
      if (initialEmail) {
        setCollectStep('phone');
      } else {
        setCollectStep('email');
      }
    }, 400);
  }, [initialEmail, simulateTyping]);

  const handleNameSubmit = useCallback(() => {
    if (!fullName.trim() || fullName.trim().split(' ').length < 1) {
      setError('Please enter your full name');
      return;
    }
    setError('');
    setNameConfirmed(true);
    simulateTyping(() => {
      if (initialEmail) {
        setCollectStep('phone');
      } else {
        setCollectStep('email');
      }
    }, 400);
  }, [fullName, initialEmail, simulateTyping]);

  const handleEmailSubmit = useCallback(() => {
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    simulateTyping(() => setCollectStep('phone'), 400);
  }, [email, simulateTyping]);

  const handlePhoneSubmit = useCallback(() => {
    if (!validateE164Phone(phone)) {
      setError('Please enter a valid phone number (e.g., +971501234567)');
      return;
    }
    setError('');
    
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    onComplete({ firstName, lastName, email, phone });
  }, [phone, fullName, email, onComplete]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, handler: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handler();
    }
  }, []);

  const renderAgentMessage = (message: string, key: string) => (
    <div key={key} className="flex gap-3 mb-4">
      <img
        src={agent.photo}
        alt={agent.name}
        className="w-10 h-10 rounded-full object-cover border-2 border-gold/40 shrink-0"
      />
      <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gold/20 max-w-[85%]">
        <p className="text-black text-sm">{message}</p>
      </div>
    </div>
  );

  const renderUserMessage = (message: string, key: string) => (
    <div key={key} className="flex justify-end mb-4">
      <div className="bg-gradient-to-br from-gold/20 to-gold/10 rounded-2xl rounded-tr-none px-4 py-3 shadow-sm border border-gold/30 max-w-[85%]">
        <p className="text-black text-sm font-medium">{message}</p>
      </div>
    </div>
  );

  const renderTypingIndicator = () => (
    <div className="flex gap-3 mb-4">
      <img
        src={agent.photo}
        alt={agent.name}
        className="w-10 h-10 rounded-full object-cover border-2 border-gold/40 shrink-0"
      />
      <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gold/20">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 p-4 overflow-y-auto">
        {detectedFullName ? (
          renderAgentMessage(
            `Hi, ${detectedFullName}! 👋 I can see you're already a member. Could you please confirm that your full name is **${detectedFullName}**? If it's not correct, please type your correct full name below.`,
            'greeting'
          )
        ) : (
          renderAgentMessage(`Hi there! 👋 I'm ${agent.name}, and I'll be helping you today. To get started, may I know your full name?`, 'greeting')
        )}
        
        {detectedFullName && nameConfirmed && collectStep !== 'confirm_name' && (
          <>
            {renderUserMessage(fullName === detectedFullName ? `Yes, that's correct ✓` : fullName, 'user-name')}
            {renderAgentMessage(`Great, ${fullName.split(' ')[0]}! ${initialEmail ? "What is your phone number? (Please include country code, e.g., +971...)" : "What is the best email address to reach you at?"}`, 'ask-email')}
          </>
        )}

        {!detectedFullName && collectStep !== 'name' && fullName && (
          <>
            {renderUserMessage(fullName, 'user-name')}
            {renderAgentMessage(`Nice to meet you, ${fullName.split(' ')[0]}! ${initialEmail ? "What is your phone number?" : "What is the best email address to reach you at?"}`, 'ask-email')}
          </>
        )}

        {collectStep !== 'name' && collectStep !== 'email' && email && !initialEmail && (
          <>
            {renderUserMessage(email, 'user-email')}
            {renderAgentMessage("Perfect! And what's your phone number? (Please include country code, e.g., +971...)", 'ask-phone')}
          </>
        )}

        {collectStep === 'complete' && phone && (
          renderUserMessage(phone, 'user-phone')
        )}

        {isTyping && renderTypingIndicator()}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gold/30 bg-white/50">
        {collectStep === 'confirm_name' && detectedFullName && (
          <div className="space-y-3">
            <Button
              onClick={handleConfirmName}
              className="w-full bg-gold hover:bg-gold-light hover:shadow-[0_4px_15px_rgba(200,167,102,0.5)] active:bg-gold-dark text-black font-medium rounded-lg transition-all duration-200"
            >
              Yes, my name is {detectedFullName} ✓
            </Button>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold z-10" />
              <input
                ref={nameInputRef}
                type="text"
                defaultValue={fullName !== detectedFullName ? fullName : ''}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleNameSubmit)}
                placeholder="Or type your correct full name..."
                inputMode="text"
                enterKeyHint="send"
                autoComplete="off"
                className="w-full pl-10 pr-12 h-10 rounded-xl border-2 border-gold bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-gold/50"
              />
              <Button
                size="icon"
                onClick={handleNameSubmit}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 bg-gold hover:bg-gold-light rounded-lg"
              >
                <Send className="w-4 h-4 text-black" />
              </Button>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
        )}

        {collectStep === 'name' && (
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold z-10" />
              <input
                ref={nameInputRef}
                type="text"
                defaultValue={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleNameSubmit)}
                placeholder="Enter your full name..."
                inputMode="text"
                enterKeyHint="send"
                autoComplete="off"
                autoFocus
                className="w-full pl-10 pr-12 h-10 rounded-xl border-2 border-gold bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-gold/50"
              />
              <Button
                size="icon"
                onClick={handleNameSubmit}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 bg-gold hover:bg-gold-light rounded-lg"
              >
                <Send className="w-4 h-4 text-black" />
              </Button>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
        )}

        {collectStep === 'email' && (
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold z-10" />
              <input
                ref={emailInputRef}
                type="email"
                defaultValue={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleEmailSubmit)}
                placeholder="Enter your email address..."
                inputMode="email"
                enterKeyHint="send"
                autoComplete="off"
                autoFocus
                className="w-full pl-10 pr-12 h-10 rounded-xl border-2 border-gold bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-gold/50"
              />
              <Button
                size="icon"
                onClick={handleEmailSubmit}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 bg-gold hover:bg-gold-light rounded-lg"
              >
                <Send className="w-4 h-4 text-black" />
              </Button>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
        )}

        {collectStep === 'phone' && (
          <div className="space-y-3">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold z-10" />
              <input
                ref={phoneInputRef}
                type="tel"
                defaultValue={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handlePhoneSubmit)}
                placeholder="+971 50 123 4567"
                inputMode="tel"
                enterKeyHint="send"
                autoComplete="off"
                autoFocus
                className="w-full pl-10 pr-12 h-10 rounded-xl border-2 border-gold bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-gold/50"
              />
              <Button
                size="icon"
                onClick={handlePhoneSubmit}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 bg-gold hover:bg-gold-light rounded-lg"
              >
                <Send className="w-4 h-4 text-black" />
              </Button>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
        )}

        <button
          onClick={onPreferForm}
          className="w-full mt-3 text-center text-xs text-black/50 hover:text-gold transition-colors flex items-center justify-center gap-1"
        >
          <FileText className="w-3 h-3" />
          Prefer to fill a form instead?
        </button>
      </div>
    </div>
  );
});

ChatConversationalCollect.displayName = 'ChatConversationalCollect';

export default ChatConversationalCollect;
