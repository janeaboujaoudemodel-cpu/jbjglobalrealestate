import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Loader2, Sparkles, BookOpen, X, Maximize2, Minimize2, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  relatedModules?: string[];
}

interface AIStudyTutorProps {
  moduleId?: string;
  moduleName?: string;
}

export function AIStudyTutor({ moduleId, moduleName }: AIStudyTutorProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Welcome message when expanded for first time
  useEffect(() => {
    if (isExpanded && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: moduleName 
          ? `Hi! 👋 I'm your Training Assistant. I'm here to help you understand "${moduleName}". Ask me anything about this module or the training content!`
          : `Hi! 👋 I'm your Training Assistant. Ask me any questions about your training modules and I'll help you understand the material better!`,
      }]);
    }
  }, [isExpanded, moduleName]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to use the tutor');
        return;
      }

      const { data, error } = await supabase.functions.invoke('hr-ai-tutor', {
        body: { question: userMessage, moduleId },
      });

      if (error) throw error;

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer || 'I couldn\'t generate a response. Please try again.',
        relatedModules: data.relatedModules,
      }]);
    } catch (error) {
      console.error('Tutor error:', error);
      toast.error('Failed to get response. Please try again.');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try asking your question again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Suggested questions based on module
  const suggestedQuestions = [
    "Summarize the key points",
    "What should I remember for the quiz?",
    "Explain this in simpler terms",
    "Give me an example",
  ];

  if (!isExpanded) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-medium">Study Tutor</span>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={`fixed z-50 bg-[#FDFBF7] border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 flex flex-col overflow-hidden ${
          isMaximized 
            ? 'inset-4' 
            : 'bottom-6 right-6 w-[380px] h-[520px]'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FDFBF7]/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">AI Study Tutor</h3>
              {moduleName && (
                <p className="text-white/70 text-xs truncate max-w-[180px]">{moduleName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 hover:bg-[#FDFBF7]/20 rounded-lg transition-colors"
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4 text-white" />
              ) : (
                <Maximize2 className="w-4 h-4 text-white" />
              )}
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 hover:bg-[#FDFBF7]/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 group ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-[#EFE6D6] text-[#1A1A1A]' 
                    : 'bg-gradient-to-br from-[#FDFBF7] to-[#EFE6D6] border border-[#B89555]/20'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4 text-[#1A1A1A]" />
                  )}
                </div>
                <div className="flex flex-col max-w-[80%]">
                  <div className={`rounded-2xl px-4 py-2.5 select-text cursor-text ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] text-[#1A1A1A] border border-[#B89555]/30 shadow-md rounded-br-md'
                      : 'bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/20 shadow-sm rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap select-text">{message.content}</p>
                  </div>
                  {/* Copy Button */}
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
                  {message.relatedModules && message.relatedModules.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.relatedModules.map((mod, i) => (
                        <span key={i} className="text-xs bg-[#EFE6D6]/20 text-[#1A1A1A] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {mod}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FDFBF7] to-[#EFE6D6] border border-[#B89555]/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/20 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1A1A1A]" />
                    <span className="text-[#1A1A1A]/60 text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="px-4 py-2 border-t border-[#1A1A1A]">
            <p className="text-xs text-[#1A1A1A]/70 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="text-xs bg-[#EFE6D6] hover:bg-[#F7F2EA] text-[#1A1A1A]/85 px-2.5 py-1 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-[#1A1A1A] bg-[#FDFBF7]/50">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the training..."
              className="flex-1 bg-[#1A1A1A] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70 focus:border-purple-500"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
