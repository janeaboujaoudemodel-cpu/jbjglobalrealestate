import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Calendar, FileText, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const stageBadges: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  greeting: { label: 'Welcome', color: 'bg-blue-500', icon: <Sparkles className="w-3 h-3" /> },
  cv_collection: { label: 'CV Collection', color: 'bg-amber-500', icon: <FileText className="w-3 h-3" /> },
  qualification: { label: 'Qualification', color: 'bg-purple-500', icon: <CheckCircle className="w-3 h-3" /> },
  interview: { label: 'Interview', color: 'bg-primary', icon: <Bot className="w-3 h-3" /> },
  assessment: { label: 'Assessment', color: 'bg-emerald-500', icon: <CheckCircle className="w-3 h-3" /> },
  completed: { label: 'Completed', color: 'bg-green-600', icon: <CheckCircle className="w-3 h-3" /> }
};

export default function HRAgentChat() {
  const { user } = useAuth();
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
      toast.error('Failed to connect to HR Agent');
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
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Connecting to HR Agent...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-primary/20">
      <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Jessica - HR AI Agent</CardTitle>
              <p className="text-sm text-muted-foreground">Broker Partner Program</p>
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
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-muted rounded-tl-none'
                  }`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
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
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {stage !== 'completed' && (
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!input.trim() || loading}
                size="icon"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send • AI-powered interview assistant
            </p>
          </div>
        )}

        {stage === 'completed' && (
          <div className="border-t p-4 bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Interview Complete - Assessment Generated</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
