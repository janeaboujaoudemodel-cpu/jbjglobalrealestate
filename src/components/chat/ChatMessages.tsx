import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Send, MessageCircle, Shield, Copy, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Message, SERVICES, getRandomAgent } from './types';
import { CONTACT_INFO } from '@/constants/stats';
import { T } from '@/components/ui/T';
import { useLanguage } from '@/contexts/LanguageContext';

const QUICK_PROMPTS: { label: string; prompt: string }[] = [
  { label: "Golden Visa", prompt: "Tell me about the UAE Golden Visa — eligibility, benefits, and how property investment qualifies." },
  { label: "ROI Calculator", prompt: "Which calculators on JBJ help me estimate ROI, rental yield, and mortgage on a Dubai property?" },
  { label: "Book Consultation", prompt: "How do I book a free consultation with a JBJ advisor?" },
  { label: "Marina < 2M", prompt: "Show me Dubai Marina apartments under 2M AED with strong rental yield." },
  { label: "Off-plan vs Ready", prompt: "What's the difference between off-plan and ready properties in Dubai for an investor?" },
  { label: "Payment Plans", prompt: "Which developers offer the best post-handover payment plans right now?" },
];


interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onSubmitToTeam: (inquirySummary?: string) => void;
  userFirstName: string;
  isExistingUser: boolean;
  selectedService: string | null;
}

const ChatMessages = React.memo(({
  messages,
  isLoading,
  input,
  onInputChange,
  onSend,
  onSubmitToTeam,
  userFirstName,
  isExistingUser,
  selectedService,
}: ChatMessagesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const localInputRef = useRef(input);
  const agent = useMemo(() => getRandomAgent(), []);
  const { t } = useLanguage();
  const [showSubmitPanel, setShowSubmitPanel] = useState(false);
  const [inquirySummary, setInquirySummary] = useState('');

  const userMessageCount = messages.filter(m => m.role === 'user').length;

  // Keep local ref in sync with prop (only when prop changes from outside, e.g. after send clears it)
  useEffect(() => {
    if (input !== localInputRef.current) {
      localInputRef.current = input;
      if (inputRef.current && inputRef.current.value !== input) {
        inputRef.current.value = input;
      }
    }
  }, [input]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleLocalInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    localInputRef.current = e.target.value;
    onInputChange(e.target.value);
  }, [onInputChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);

  const handleSubmitConfirm = () => {
    onSubmitToTeam(inquirySummary.trim() || undefined);
    setShowSubmitPanel(false);
    setInquirySummary('');
  };

  const serviceName = SERVICES.find(s => s.id === selectedService)?.label || 'property inquiries';

  return (
    <>
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>

        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 group ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {message.role === 'user' ? (
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-[#EFE6D6] text-[#1A1A1A] shadow-lg shadow-gold/20">
                  <User className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#B89555] shadow-lg shadow-gold/20">
                  <img 
                    src={agent.photo} 
                    alt={agent.name}
                    className="w-full h-full object-cover"
                   loading="lazy" decoding="async" />
                </div>
              )}
              <div className="flex flex-col max-w-[80%]">
                <div
                  className={`p-3.5 rounded-2xl shadow-md select-text cursor-text ${
 message.role === 'user'
 ? 'bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] text-[#1A1A1A] border border-[#B89555]/30 rounded-tr-sm'
 : 'bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/20 rounded-tl-sm'
 }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium select-text">{message.content}</p>
                  <p className="text-[10px] mt-1.5 text-[#1A1A1A]/60 select-none">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(message.content);
                    toast.success(t('chat.messageCopied') || 'Message copied');
                  }}
                  className={`flex items-center gap-1 mt-1 text-[10px] text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors opacity-0 group-hover:opacity-100 ${
 message.role === 'user' ? 'self-end mr-1' : 'self-start ml-1'
 }`}
                >
                  <Copy className="w-3 h-3" />
                  <span>{t('chat.copy') || 'Copy'}</span>
                </button>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.content === '' && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#B89555] shadow-lg shadow-gold/20">
                <img 
                  src={agent.photo} 
                  alt={agent.name}
                  className="w-full h-full object-cover"
                 loading="lazy" decoding="async" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5 border border-[#B89555]/20 shadow-sm">
                  <span className="w-2.5 h-2.5 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2.5 h-2.5 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2.5 h-2.5 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-[#1A1A1A] text-xs font-medium ml-1"><T>{`${agent.name} is typing...`}</T></p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Submit to Team Panel */}
      {showSubmitPanel && (
        <div className="border-t border-[#B89555]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#1A1A1A]">
                <T>Describe your inquiry</T>
              </p>
              <button onClick={() => setShowSubmitPanel(false)} className="text-[#1A1A1A]/70 hover:text-[#1A1A1A]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <Textarea
              value={inquirySummary}
              onChange={(e) => setInquirySummary(e.target.value)}
              placeholder="Please describe what you need from our team..."
              className="min-h-[80px] text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitConfirm}
                className="flex-1 bg-[#EFE6D6] hover:bg-[#EFE6D6]-light text-[#1A1A1A] text-sm font-bold shadow-lg shadow-gold/20"
              >
                <Shield className="w-4 h-4 mr-2" />
                <T>Submit Now</T>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSubmitPanel(false)}
                className="border-[#B89555]/30 text-[#1A1A1A]/70"
              >
                <T>Cancel</T>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!showSubmitPanel && (
        <div
          className="px-4 py-3 border-t border-[#B89555]/30 flex gap-2"
          style={{
            background: "linear-gradient(180deg, rgba(247,242,234,0.55) 0%, rgba(239,230,214,0.85) 100%)",
            backdropFilter: "blur(14px) saturate(140%)",
            WebkitBackdropFilter: "blur(14px) saturate(140%)",
          }}
        >
          {isExistingUser && (
            <a
              href={`https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(`Hi, I'm ${userFirstName}. I was chatting with the AI about ${serviceName}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 jj-surface-emerald hover:jj-surface-emerald text-white text-sm py-2.5 rounded-lg transition-colors font-semibold shadow-lg"
            >
              <MessageCircle className="w-4 h-4" />
              <T>WhatsApp</T>
            </a>
          )}
          {userMessageCount > 0 && (
            <Button
              onClick={() => setShowSubmitPanel(true)}
              className={`${isExistingUser ? 'flex-1' : 'w-full'} bg-[#EFE6D6] hover:bg-[#EFE6D6]-light text-[#1A1A1A] text-sm py-2.5 font-bold shadow-lg shadow-gold/20`}
            >
              <Shield className="w-4 h-4 mr-2" />
              <T>Submit to Team</T>
            </Button>
          )}
        </div>
      )}

      {/* Input — glass footer with quick prompts strip */}
      <div
        className="p-4 border-t border-[#B89555]/30 space-y-3"
        style={{
          background: "linear-gradient(180deg, rgba(247,242,234,0.55) 0%, rgba(239,230,214,0.85) 100%)",
          backdropFilter: "blur(14px) saturate(140%)",
          WebkitBackdropFilter: "blur(14px) saturate(140%)",
        }}
      >
        {/* Persistent quick prompts */}
        <div className="-mx-1 px-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1.5 w-max">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => {
                  if (isLoading) return;
                  onInputChange(q.prompt);
                  if (inputRef.current) inputRef.current.value = q.prompt;
                  localInputRef.current = q.prompt;
                  setTimeout(() => onSend(), 0);
                }}
                disabled={isLoading}
                data-no-contrast-guard
                title={q.prompt}
                className="shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11.5px] font-medium text-[#1A1A1A] border border-[#B89555]/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(247,242,234,0.85)_100%)] hover:border-[#B89555] hover:bg-[#FDFBF7] hover:shadow-[0_2px_10px_rgba(184,149,85,0.22)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles className="h-3 w-3 text-[#B89555]" />
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <input
            ref={inputRef}
            defaultValue={input}
            onChange={handleLocalInput}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            inputMode="text"
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="off"
            disabled={isLoading}
            className="flex-1 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(247,242,234,0.88)_100%)] border border-[#B89555]/55 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 focus:border-[#B89555] focus:ring-2 focus:ring-[#B89555]/30 h-12 rounded-xl text-sm px-4 py-2 outline-none transition-all duration-200 shadow-[0_1px_0_rgba(255,255,255,0.65)_inset,0_2px_8px_rgba(184,149,85,0.10)]"
          />
          <Button
            onClick={onSend}
            disabled={!input.trim() || isLoading}
            className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#FDFBF7] h-12 w-12 rounded-xl hover:shadow-[0_0_18px_rgba(184,149,85,0.40)] transition-all duration-200"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </>
  );
});

ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;
