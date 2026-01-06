import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Send, MessageCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Message, AGENT, SERVICES } from './types';
import { CONTACT_INFO } from '@/constants/stats';

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
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {message.role === 'user' ? (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gold/20 text-gold">
                  <User className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gold/30">
                  <img 
                    src={AGENT.photo} 
                    alt={AGENT.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-xl ${
                  message.role === 'user'
                    ? 'bg-gold/20 text-white'
                    : 'bg-white/10 text-white'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-[10px] text-white/40 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
          {isLoading && messages[messages.length - 1]?.content === '' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gold/30">
                <img 
                  src={AGENT.photo} 
                  alt={AGENT.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="bg-white/10 p-3 rounded-xl flex items-center gap-1">
                  <motion.span
                    className="w-2 h-2 bg-gold rounded-full"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.span
                    className="w-2 h-2 bg-gold rounded-full"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                  />
                  <motion.span
                    className="w-2 h-2 bg-gold rounded-full"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                  />
                </div>
                <p className="text-zinc-400 text-xs italic ml-1">{AGENT.name} is typing...</p>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="px-4 py-2 border-t border-zinc-800 flex gap-2">
        {isExistingUser && (
          <a
            href={`https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(`Hi, I'm ${userFirstName}. I was chatting with the AI about ${serviceName}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm py-2 rounded-md transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        )}
        <Button
          onClick={onSubmitToTeam}
          className={`${isExistingUser ? 'flex-1' : 'w-full'} bg-emerald-600 hover:bg-emerald-500 text-white text-sm py-2`}
        >
          <Shield className="w-4 h-4 mr-2" />
          Submit to Team
        </Button>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gold/20 bg-black/20">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-white/10 border-gold/20 text-white placeholder:text-white/40"
            disabled={isLoading}
          />
          <Button
            onClick={onSend}
            disabled={!input.trim() || isLoading}
            className="bg-gold hover:bg-gold/90 text-black"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default ChatMessages;
