/**
 * Employee Chat Panel - JBJ Global Real Estate
 * Enables direct chat with any employee persona
 * Supports text messages and voice notes
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, X, MessageSquare, 
  Phone, Video, MoreVertical, Paperclip,
  Smile, ChevronDown, CheckCheck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TeamMember } from "@/config/team-members";
import { generatePersonaTrainingPrompt } from "@/config/ai-role-specific-training";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type: 'text' | 'voice';
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

interface EmployeeChatPanelProps {
  employee: TeamMember;
  onClose: () => void;
  currentUserId?: string;
  currentUserName?: string;
}

const EmployeeChatPanel: React.FC<EmployeeChatPanelProps> = ({
  employee,
  onClose,
  currentUserId = 'founder',
  currentUserName = 'Jane',
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history from database
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user?.id) return;

        const { data: existingMessages, error } = await supabase
          .from('internal_chat_messages')
          .select('*')
          .eq('user_id', session.session.user.id)
          .eq('employee_id', employee.id)
          .order('created_at', { ascending: true })
          .limit(50);

        if (error) {
          console.error('Error loading chat history:', error);
        } else if (existingMessages && existingMessages.length > 0) {
          // Convert DB messages to our Message format
          const loadedMessages: Message[] = existingMessages.map((msg) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.message,
            timestamp: new Date(msg.created_at),
            type: 'text',
            status: 'read',
          }));
          setMessages(loadedMessages);
          return; // Don't show welcome if we have history
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }

      // Show welcome message only if no history
      const welcomeMessages = [
        `Hi ${currentUserName}! How can I help you today?`,
        `Hello ${currentUserName}, good to hear from you. What do you need?`,
        `Hey ${currentUserName}! I'm here to assist. What's on your mind?`,
        `Hi there ${currentUserName}! How may I assist you today?`,
      ];
      
      const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      
      setTimeout(() => {
        setMessages([{
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: randomWelcome,
          timestamp: new Date(),
          type: 'text',
          status: 'read',
        }]);
      }, 500);
    };

    loadChatHistory();
  }, [employee.id, currentUserName]);

  // Save message to database
  const persistMessage = async (message: Message) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return;

      await supabase.from('internal_chat_messages').insert({
        user_id: session.session.user.id,
        employee_id: employee.id,
        employee_name: employee.name,
        message: message.content,
        role: message.role,
      });
    } catch (err) {
      console.error('Failed to persist message:', err);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      type: 'text',
      status: 'sent',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Persist user message
    await persistMessage(userMessage);

    try {
      // Generate persona-specific context
      const personaPrompt = generatePersonaTrainingPrompt(employee);
      
      // Build conversation history
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call AI endpoint
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            { role: 'system', content: personaPrompt },
            ...conversationHistory,
            { role: 'user', content: inputValue.trim() },
          ],
          max_tokens: 500,
          persona_id: employee.id,
        },
      });

      if (error) throw error;

      // Simulate realistic typing delay
      const typingDelay = Math.min(1000 + (data?.response?.length || 0) * 10, 3000);
      
      await new Promise(resolve => setTimeout(resolve, typingDelay));

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data?.response || "I'll get back to you shortly on that.",
        timestamp: new Date(),
        type: 'text',
        status: 'delivered',
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Persist assistant message
      await persistMessage(assistantMessage);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback response
      const fallbackResponses = [
        "I'm currently reviewing some documents. Let me get back to you on that.",
        "Good question. Let me check and confirm the details for you.",
        "I'll look into that and update you shortly.",
        "Thanks for bringing that up. I'll follow up with the relevant team.",
      ];
      
      const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      const fallbackMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fallback,
        timestamp: new Date(),
        type: 'text',
        status: 'delivered',
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      
      // Persist fallback message
      await persistMessage(fallbackMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle voice transcript from VoiceInputButton
  const handleVoiceTranscript = (text: string) => {
    setInputValue(prev => prev ? `${prev} ${text}` : text);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#FDFBF7] border-l border-[#1A1A1A] z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1A1A1A] bg-[#FDFBF7]">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-[#B89555]/30">
            <AvatarImage src={employee.avatar} alt={employee.name} />
            <AvatarFallback className="bg-[#EFE6D6]/20 text-[#1A1A1A]">
              {employee.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-white font-semibold text-sm">{employee.name}</h3>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-white/90 text-xs">Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/70 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Employee Info Banner */}
      <div className="p-3 bg-[#FDFBF7]/50 border-b border-[#1A1A1A]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#1A1A1A] text-xs font-medium">{employee.role}</p>
            <p className="text-white/90 text-xs">{employee.department}</p>
          </div>
          <Badge variant="outline" className="text-xs border-[#1A1A1A] text-white/70">
            {employee.languages?.slice(0, 2).join(', ')}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user' 
                      ? 'bg-[#EFE6D6] text-[#1A1A1A] rounded-br-sm' 
                      : 'bg-[#1A1A1A] text-white rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className={`flex items-center gap-1 mt-1 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span className={`text-xs ${
                      message.role === 'user' ? 'text-[#1A1A1A]/60' : 'text-white/90'
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                    {message.role === 'user' && (
                      <CheckCheck className={`h-3 w-3 ${
                        message.status === 'read' ? 'text-blue-500' : 'text-[#1A1A1A]/40'
                      }`} />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-[#1A1A1A] rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[#B89555] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-[#B89555] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-[#B89555] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-[#1A1A1A] bg-[#FDFBF7]">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="bg-[#1A1A1A] border-[#1A1A1A] pr-10"
              disabled={isLoading}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 text-white/70 hover:text-white h-7 w-7"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          
          <VoiceInputButton
            onTranscript={handleVoiceTranscript}
            disabled={isLoading}
            variant="ghost"
            size="icon"
            className="shrink-0 text-white/70 hover:text-white"
          />
          
          <Button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default EmployeeChatPanel;
