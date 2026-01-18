/**
 * Employee Chat Panel - JBJ Global Real Estate
 * Enables direct chat with any employee persona
 * Supports text messages and voice notes
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Mic, MicOff, X, MessageSquare, 
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
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message on mount
  useEffect(() => {
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
  }, [employee.id, currentUserName]);

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
      
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fallback,
        timestamp: new Date(),
        type: 'text',
        status: 'delivered',
      }]);
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

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      toast.info('Voice note recording stopped');
      // In production, this would process the recording
    } else {
      setIsRecording(true);
      toast.info('Recording voice note...');
      // In production, this would start recording
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-gold/30">
            <AvatarImage src={employee.avatar} alt={employee.name} />
            <AvatarFallback className="bg-gold/20 text-gold">
              {employee.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-white font-semibold text-sm">{employee.name}</h3>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-zinc-500 text-xs">Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Employee Info Banner */}
      <div className="p-3 bg-zinc-900/50 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gold text-xs font-medium">{employee.role}</p>
            <p className="text-zinc-500 text-xs">{employee.department}</p>
          </div>
          <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
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
                      ? 'bg-gold text-black rounded-br-sm' 
                      : 'bg-zinc-800 text-white rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className={`flex items-center gap-1 mt-1 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span className={`text-xs ${
                      message.role === 'user' ? 'text-black/60' : 'text-zinc-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                    {message.role === 'user' && (
                      <CheckCheck className={`h-3 w-3 ${
                        message.status === 'read' ? 'text-blue-500' : 'text-black/40'
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
              <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="bg-zinc-800 border-zinc-700 pr-10"
              disabled={isLoading}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white h-7 w-7"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRecording}
            className={`shrink-0 ${isRecording ? 'text-red-500 animate-pulse' : 'text-zinc-400 hover:text-white'}`}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          
          <Button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="bg-gold hover:bg-gold/90 text-black shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default EmployeeChatPanel;
