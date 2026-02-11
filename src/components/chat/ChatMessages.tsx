import { useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Send, MessageCircle, Shield, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Message, SERVICES, getRandomAgent } from './types';
import { CONTACT_INFO } from '@/constants/stats';
import { T } from '@/components/ui/T';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onSubmitToTeam: () => void;
  userFirstName: string;
  isExistingUser: boolean;
  selectedService: string | null;
}

const ChatMessages = ({
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
  const agent = useMemo(() => getRandomAgent(), []);
  const { t } = useLanguage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const serviceName = SERVICES.find(s => s.id === selectedService)?.label || 'property inquiries';

  return (
    <>
      <ScrollArea className="flex-1 p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 group ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {message.role === 'user' ? (
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-gold text-black shadow-lg shadow-gold/20">
                  <User className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-gold shadow-lg shadow-gold/20">
                  <img 
                    src={agent.photo} 
                    alt={agent.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col max-w-[80%]">
                <div
                  className={`p-3.5 rounded-2xl shadow-md select-text cursor-text ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border border-gold/30 rounded-tr-sm'
                      : 'bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black border border-gold/20 rounded-tl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium select-text">{message.content}</p>
                  <p className="text-[10px] mt-1.5 text-black/60 select-none">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {/* Copy Button */}
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(message.content);
                    toast.success(t('chat.messageCopied') || 'Message copied');
                  }}
                  className={`flex items-center gap-1 mt-1 text-[10px] text-zinc-500 hover:text-gold transition-colors opacity-0 group-hover:opacity-100 ${
                    message.role === 'user' ? 'self-end mr-1' : 'self-start ml-1'
                  }`}
                >
                  <Copy className="w-3 h-3" />
                  <span>{t('chat.copy') || 'Copy'}</span>
                </button>
              </div>
            </motion.div>
          ))}
          {isLoading && messages[messages.length - 1]?.content === '' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-gold shadow-lg shadow-gold/20">
                <img 
                  src={agent.photo} 
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] p-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5 border border-gold/20 shadow-sm">
                  <motion.span
                    className="w-2.5 h-2.5 bg-gold rounded-full"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.span
                    className="w-2.5 h-2.5 bg-gold rounded-full"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                  />
                  <motion.span
                    className="w-2.5 h-2.5 bg-gold rounded-full"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                  />
                </div>
                <p className="text-gold text-xs font-medium ml-1"><T>{`${agent.name} is typing...`}</T></p>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Action Buttons - Premium styling */}
      <div className="px-4 py-3 border-t border-gold/30 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] flex gap-2">
        {isExistingUser && (
          <a
            href={`https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(`Hi, I'm ${userFirstName}. I was chatting with the AI about ${serviceName}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm py-2.5 rounded-lg transition-colors font-semibold shadow-lg"
          >
            <MessageCircle className="w-4 h-4" />
            <T>WhatsApp</T>
          </a>
        )}
        <Button
          onClick={onSubmitToTeam}
          className={`${isExistingUser ? 'flex-1' : 'w-full'} bg-gold hover:bg-gold-light text-black text-sm py-2.5 font-bold shadow-lg shadow-gold/20`}
        >
          <Shield className="w-4 h-4 mr-2" />
          <T>Submit to Team</T>
        </Button>
      </div>

      {/* Input - Premium dark styling */}
      <div className="p-4 border-t border-gold/30 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
        <div className="flex gap-3">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-white/80 border-gold/30 text-black placeholder:text-black/40 focus:border-gold focus:ring-gold/30 h-12 rounded-xl text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={onSend}
            disabled={!input.trim() || isLoading}
            className="bg-gold hover:bg-gold-light hover:shadow-[0_6px_20px_rgba(200,167,102,0.5)] active:bg-gold-dark text-black h-12 w-12 rounded-xl transition-all duration-200"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default ChatMessages;
