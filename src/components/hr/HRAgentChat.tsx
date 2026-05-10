import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Calendar, FileText, CheckCircle, Sparkles, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const stageBadges: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  greeting: { label: 'Welcome', color: 'bg-blue-500', icon: <Sparkles className="w-3 h-3" /> },
  cv_collection: { label: 'CV Collection', color: 'bg-amber-500', icon: <FileText className="w-3 h-3" /> },
  qualification: { label: 'Qualification', color: 'bg-purple-500', icon: <CheckCircle className="w-3 h-3" /> },
  interview: { label: 'Interview', color: 'bg-[#EFE6D6]', icon: <Bot className="w-3 h-3" /> },
  assessment: { label: 'Assessment', color: 'bg-emerald-500', icon: <CheckCircle className="w-3 h-3" /> },
  completed: { label: 'Completed', color: 'bg-green-600', icon: <CheckCircle className="w-3 h-3" /> }
};

export default function HRAgentChat() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [stage, setStage] = useState<string>('greeting');
  const [initializing, setInitializing] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      startConversation();
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startConversation = async () => {
    try {
      setInitializing(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please log in to continue');
        return;
      }

      const response = await supabase.functions.invoke('hr-ai-agent', {
        body: { action: 'start_conversation' }
      });

      if (response.error) throw response.error;

      const data = response.data;
      setConversationId(data.conversationId);
      setStage(data.stage);
      setMessages([{
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to connect to Jessica');
    } finally {
      setInitializing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await supabase.functions.invoke('hr-ai-agent', {
        body: {
          action: 'send_message',
          conversationId,
          message: input
        }
      });

      if (response.error) throw response.error;

      const data = response.data;
      setStage(data.stage);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentStageBadge = stageBadges[stage] || stageBadges.greeting;

  if (initializing) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-[#FDFBF7] to-[#F7F1E6] border-2 border-[#B89555]/30">
        <CardContent className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#1A1A1A] mx-auto" />
            <p className="text-[#1A1A1A]/70">Connecting to Jessica...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl bg-gradient-to-br from-[#FDFBF7] to-[#F7F1E6] border-2 border-[#B89555]/30">
      <CardHeader className="border-b border-[#B89555]/20 bg-gradient-to-r from-gold/10 to-gold/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-[#1A1A1A]" />
            </div>
            <div>
              <CardTitle className="text-lg text-[#1A1A1A]">Jessica</CardTitle>
              <p className="text-sm text-[#1A1A1A]/70">Available 24/7 to support you</p>
            </div>
          </div>
          <Badge className={`${currentStageBadge.color} text-white flex items-center gap-1`}>
            {currentStageBadge.icon}
            {currentStageBadge.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] p-4" ref={scrollRef}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex gap-3 group ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-[#EFE6D6] text-[#1A1A1A]' 
                      : 'bg-gradient-to-br from-[#FDFBF7] to-[#EFE6D6] border border-[#B89555]/20'
                  }`}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[#1A1A1A]" />}
                  </div>
                  <div className="flex flex-col max-w-[80%]">
                    <div className={`rounded-2xl px-4 py-3 select-text cursor-text ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] text-[#1A1A1A] border border-[#B89555]/30 shadow-md rounded-tr-none'
                        : 'bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/20 shadow-sm rounded-tl-none'
                    }`}>
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap text-[#1A1A1A] select-text">
                        {message.content}
                      </div>
                      <p className="text-xs mt-1 text-[#1A1A1A]/60 select-none">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
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
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FDFBF7] to-[#EFE6D6] border border-[#B89555]/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/20 rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {stage !== 'completed' && (
          <div className="border-t border-[#B89555]/20 p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 border-[#B89555]/30 focus:border-[#B89555]"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!input.trim() || loading}
                size="icon"
                className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-[#1A1A1A]/70 mt-2 text-center">
              Press Enter to send • AI-powered interview assistant
            </p>
          </div>
        )}

        {stage === 'completed' && (
          <div className="border-t border-[#B89555]/20 p-4 bg-emerald-50">
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Interview Complete - Assessment Generated</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
