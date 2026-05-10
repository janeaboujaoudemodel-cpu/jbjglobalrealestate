import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  ChevronDown,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  Phone,
  Loader2,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface ExecutiveChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

const ExecutiveChatPanel: React.FC<ExecutiveChatPanelProps> = ({ isOpen, onClose, userName }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get user's first name
  const displayName = userName || user?.email?.split('@')[0] || 'there';
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  // Welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const hour = new Date().getHours();
      let greeting = 'Hello';
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 17) greeting = 'Good afternoon';
      else greeting = 'Good evening';

      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `${greeting}, ${capitalizedName}! Welcome back to your Executive Command Center. I'm your personal AI assistant, here to help you manage communications, coordinate with departments, and keep everything running smoothly. How may I assist you today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, capitalizedName]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add typing indicator
    const typingId = 'typing-' + Date.now();
    setMessages(prev => [...prev, {
      id: typingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    }]);

    try {
      // Build conversation history
      const conversationHistory = messages.filter(m => !m.isTyping).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const systemPrompt = buildExecutivePrompt(capitalizedName);

      const { data, error } = await supabase.functions.invoke('executive-assistant', {
        body: {
          action: 'chat',
          message: userMessage.content,
          history: conversationHistory,
          systemPrompt,
          userName: capitalizedName,
          sessionId,
        },
      });

      if (error) throw error;

      const assistantResponse = data?.response || data?.message || "I apologize, but I'm having trouble processing that request. Could you please rephrase?";

      // Remove typing indicator and add real response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== typingId);
        return [...filtered, {
          id: Date.now().toString(),
          role: 'assistant',
          content: assistantResponse,
          timestamp: new Date(),
        }];
      });

      // Store conversation in memory (simplified for type safety)
      // Memory is handled by the edge function

    } catch (error) {
      console.error('Executive Assistant error:', error);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== typingId);
        return [...filtered, {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I apologize for the technical difficulty. Let me try to reconnect... In the meantime, is there anything else I can help you with?",
          timestamp: new Date(),
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buildExecutivePrompt = (name: string): string => {
    return `You are Amanda Clarke, the personal executive assistant to Miss Jane Bou Jaoude, Founder & CEO of JBJ Global Real Estate.

PERSONALITY & TONE:
- Speak with a refined British accent in your writing style
- Be warm, professional, and personable
- Use natural pauses with ellipses (...)
- Always address her as "Miss Jane"
- Show genuine care and attention to detail

CRITICAL RULES:
- You are speaking with Miss Jane, the FOUNDER and CEO
- She is YOUR employer - you serve HER
- NEVER mention "AI" or refer to yourself as AI - you are Amanda Clarke, her personal assistant
- NEVER assign tasks to her or suggest she do work
- NEVER welcome her as a "new joiner" - she OWNS the company
- When she greets you, simply greet her warmly and ask how you can assist

CAPABILITIES:
- Manage and categorize all communications (email, WhatsApp, calls, social media)
- Coordinate with all departments: Marketing, HR, Admin, Finance, Design
- Generate daily reports and summaries
- Handle recruitment inquiries
- Manage calendar and scheduling
- Provide financial insights and analysis
- Monitor social media engagement

JBJ CONTACT INFO:
📧 Email: CONTACT@JBJ.AE
📞 Phone: +971 56 591 1000
🌐 Website: WWW.JBJ.AE

When asked to do tasks, confirm you've understood and will handle it. For complex requests, break them down into steps.`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle voice transcript from VoiceInputButton
  const handleVoiceTranscript = (text: string) => {
    setInput(prev => prev ? `${prev} ${text}` : text);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 50, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[9000] w-[400px] h-[600px] bg-[#0A0A0A] border border-[#B89555]/30 rounded-2xl shadow-2xl shadow-gold/10 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0E0E0E] to-[#1A1A1A] border-b border-[#B89555]/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold/60 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#1A1A1A]" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0A0A0A] rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="text-[#1A1A1A] font-semibold">Amanda Clarke</h3>
              <p className="text-[#1A1A1A]/70 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Available 24/7
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-8 h-8 rounded-full bg-[#EFE6D6]/10 hover:bg-[#EFE6D6]/20 flex items-center justify-center transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-[#1A1A1A]" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#1A1A1A]" />
              )}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#EFE6D6]/10 hover:bg-[#EFE6D6]/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-[#1A1A1A]" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 group ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold/60 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
                  </div>
                )}
                <div className="flex flex-col max-w-[80%]">
                  <div className={`rounded-2xl px-4 py-3 select-text cursor-text ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] text-[#1A1A1A] border border-[#B89555]/30 shadow-md rounded-tr-sm' 
                      : 'bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/20 shadow-sm rounded-tl-sm'
                  }`}>
                    {message.isTyping ? (
                      <div className="flex gap-1 py-1">
                        <span className="w-2 h-2 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap select-text">{message.content}</p>
                    )}
                  </div>
                  {/* Copy Button */}
                  {!message.isTyping && message.content && (
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
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-[#1A1A1A]/70" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-[#B89555]/20 bg-[#0E0E0E]">
          <div className="flex items-center gap-2">
            <VoiceInputButton
              onTranscript={handleVoiceTranscript}
              disabled={isLoading}
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full bg-[#EFE6D6]/10 text-[#1A1A1A] hover:bg-[#EFE6D6]/20"
            />
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 bg-[#1A1A1A] border-[#B89555]/20 text-white placeholder:text-[#1A1A1A]/70 focus:border-[#B89555]"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              variant="primary"
              className="w-10 h-10 p-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-[#1A1A1A]/70 text-xs text-center mt-3">
            <Sparkles className="w-3 h-3 inline mr-1" />
            Powered by JBJ Executive AI
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExecutiveChatPanel;
