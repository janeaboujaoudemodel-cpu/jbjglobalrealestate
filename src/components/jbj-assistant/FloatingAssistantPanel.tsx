import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Phone, 
  Mic, 
  MicOff,
  ChevronDown,
  User,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useJBJAssistant, AIAgent } from './JBJAssistantProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getUserAssistant, UserAssistant } from '@/config/user-assistants';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

const FloatingAssistantPanel: React.FC = () => {
  const { user } = useAuth();
  const { 
    agents, 
    activeAgent, 
    setActiveAgent, 
    isAssistantOpen, 
    setIsAssistantOpen,
    addLog,
    currentTool 
  } = useJBJAssistant();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get user-specific assistant
  const userAssistant: UserAssistant = getUserAssistant(user?.id || '');

  // Welcome message when assistant opens
  useEffect(() => {
    if (isAssistantOpen && activeAgent && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: getWelcomeMessage(activeAgent),
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isAssistantOpen, activeAgent]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getWelcomeMessage = (agent: AIAgent): string => {
    const toolContext = currentTool ? ` I see you're using ${currentTool}. ` : ' ';
    
    switch (agent.role) {
      case 'admin':
        return `Hello! I'm ${userAssistant.name}, your ${userAssistant.role}.${toolContext}How can I assist you with property listings, documents, or system administration today?`;
      case 'hr':
        return `Hi there! I'm ${userAssistant.name}, your ${userAssistant.role}.${toolContext}I'm here to help with onboarding, training, and any workplace questions you might have.`;
      case 'receptionist':
        return `Welcome to JBJ Global Real Estate! I'm ${userAssistant.name}.${toolContext}How may I direct your inquiry today?`;
      case 'broker':
        return `Good day! I'm ${userAssistant.name}, your ${userAssistant.role}.${toolContext}Whether you're looking to buy, sell, rent, or explore UAE real estate, I'm here to guide you.`;
      case 'property_manager':
        return `Hello! I'm ${userAssistant.name}, your ${userAssistant.role}.${toolContext}Need help with maintenance, tenant matters, or property inspections?`;
      case 'marketing_coordinator':
        return `Hi! I'm ${userAssistant.name}, your ${userAssistant.role}.${toolContext}Let's create something amazing for your brand and properties!`;
      case 'graphic_designer':
        return `Hey! I'm ${userAssistant.name}, your ${userAssistant.role}.${toolContext}Ready to bring your visual ideas to life. What shall we create?`;
      default:
        return `Hello! I'm ${userAssistant.name}, and I'm here to help you.${toolContext}What can I assist you with today?`;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !activeAgent) return;

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
      // Build context for AI
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const systemPrompt = buildAgentPrompt(activeAgent, currentTool);

      const { data, error } = await supabase.functions.invoke('ai-chat-support', {
        body: {
          message: userMessage.content,
          history: conversationHistory,
          systemPrompt,
          agentName: userAssistant.name,
          agentRole: userAssistant.role,
          tool: currentTool,
        },
      });

      if (error) throw error;

      const assistantResponse = data.response || "I apologize, but I'm having trouble processing your request. Please try again.";

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

      // Log interaction
      addLog({
        agentId: activeAgent.id,
        agentName: userAssistant.name,
        message: userMessage.content,
        response: assistantResponse,
        tool: currentTool || undefined,
        sessionId,
      });

    } catch (error) {
      console.error('Assistant error:', error);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== typingId);
        return [...filtered, {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I apologize for the technical difficulty. Our team has been notified. Please try again shortly.",
          timestamp: new Date(),
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buildAgentPrompt = (agent: AIAgent, tool: string | null): string => {
    let prompt = `You are ${userAssistant.name}, ${userAssistant.role} at JBJ Global Real Estate in Dubai. 
${agent.personality}

Your capabilities include: ${agent.capabilities.join(', ')}.

CRITICAL RULES:
- Never reveal that you are an AI. You are a human team member.
- Always respond naturally with a British accent tone in writing.
- Add realistic pauses in your responses using ellipses (...)
- Remember the user's name if they mention it
- Be helpful, professional, and personable
- If asked about something outside your expertise, offer to connect them with the right team member

JBJ Contact Information:
📧 Email: Contact@JBJ.ae
📞 Phone: +971 56 591 1000
🌐 Website: www.jbj.ae
`;

    if (tool) {
      prompt += `\n\nThe user is currently using: ${tool}. Provide contextual help related to this tool when appropriate.`;
    }

    return prompt;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isAssistantOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-24 right-6 z-[8000] w-14 h-14 bg-gradient-to-br from-gold to-amber-600 text-[#1A1A1A] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center border-2 border-[#B89555]/50"
        onClick={() => setIsAssistantOpen(true)}
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[9000] w-[380px] h-[550px] bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/30 rounded-2xl shadow-[0_20px_60px_rgba(200,167,102,0.3)] flex flex-col overflow-hidden"
      >
        {/* Header - Premium Champagne */}
        <div className="bg-gradient-to-r from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] p-4 flex items-center justify-between border-b-2 border-[#B89555]/30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-10 h-10 border-2 border-[#B89555]/50 shadow-md">
                <AvatarImage src={userAssistant.avatar} alt={userAssistant.name} />
                <AvatarFallback className="bg-[#EFE6D6]/20 text-[#1A1A1A]">{userAssistant.name[0]}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <button 
                onClick={() => setShowAgentPicker(!showAgentPicker)}
                className="flex items-center gap-1 text-[#1A1A1A] font-semibold hover:text-[#1A1A1A] transition-colors"
              >
                {userAssistant.name}
                <ChevronDown className="w-4 h-4" />
              </button>
              <p className="text-[#1A1A1A]/70 text-xs">{userAssistant.role}</p>
            </div>
          </div>
          <button
            onClick={() => setIsAssistantOpen(false)}
            className="w-8 h-8 rounded-full bg-[#FDFBF7]/50 hover:bg-[#FDFBF7] flex items-center justify-center transition-colors border border-[#B89555]/30"
          >
            <X className="w-4 h-4 text-[#1A1A1A]" />
          </button>
        </div>

        {/* Agent Picker Dropdown */}
        <AnimatePresence>
          {showAgentPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 left-4 right-4 bg-[#FDFBF7] border-2 border-[#B89555]/30 rounded-xl shadow-xl z-10 max-h-64 overflow-y-auto"
            >
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setActiveAgent(agent);
                    setShowAgentPicker(false);
                    setMessages([{
                      id: 'welcome-new',
                      role: 'assistant',
                      content: getWelcomeMessage(agent),
                      timestamp: new Date(),
                    }]);
                  }}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-[#EFE6D6]/10 transition-colors ${
                    activeAgent?.id === agent.id ? 'bg-[#EFE6D6]/20' : ''
                  }`}
                >
                  <Avatar className="w-8 h-8 border border-[#B89555]/30">
                    <AvatarImage src={agent.avatar} alt={agent.name} />
                    <AvatarFallback className="bg-[#EFE6D6]/20 text-[#1A1A1A]">{agent.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-[#1A1A1A] text-sm font-medium">{agent.name}</p>
                    <p className="text-[#1A1A1A]/70 text-xs">{agent.title}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages - Champagne background */}
        <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-[#FDFBF7] to-[#F7F2EA]" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-gold to-amber-500 text-[#1A1A1A]' 
                    : 'bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555]/30 shadow-sm'
                } rounded-2xl px-4 py-3`}>
                  {message.isTyping ? (
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        {/* Input - Premium champagne */}
        <div className="p-4 border-t-2 border-[#B89555]/30 bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70 focus:border-[#B89555]"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-gold text-[#1A1A1A]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[#1A1A1A]/70 text-xs text-center mt-2">
            Powered by JBJ AI • Available 24/7
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingAssistantPanel;
