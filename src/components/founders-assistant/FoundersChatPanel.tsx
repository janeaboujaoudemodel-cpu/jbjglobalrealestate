import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Mic, 
  MicOff,
  Sparkles,
  User,
  Paperclip,
  Loader2,
  Command,
  AtSign,
  Video,
  Phone,
  Calendar,
  FileText,
  Mail,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { allTeamMembers, TeamMember } from '@/config/team-members';
import oliviaPortrait from "@/assets/team/olivia-executive-assistant.png";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  mentions?: string[];
  attachments?: { name: string; type: string }[];
}

interface FoundersChatPanelProps {
  userName?: string;
}

// Suggested commands
const SUGGESTED_COMMANDS = [
  { icon: Calendar, label: 'Schedule meeting', command: '/schedule meeting with' },
  { icon: Mail, label: 'Send email', command: '/email to' },
  { icon: MessageSquare, label: 'Send WhatsApp', command: '/whatsapp to' },
  { icon: Video, label: 'Create JBJ Meet', command: '/create-meeting' },
  { icon: FileText, label: 'Generate report', command: '/report daily' },
  { icon: Phone, label: 'Call client', command: '/call' },
];

const FoundersChatPanel: React.FC<FoundersChatPanelProps> = ({ userName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = userName || user?.email?.split('@')[0] || 'there';
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const hour = new Date().getHours();
      let greeting = 'Good evening';
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 17) greeting = 'Good afternoon';

      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `${greeting}, ${capitalizedName}! 👋

I'm Olivia, your personal AI executive assistant. I'm here to help you manage everything seamlessly.

**What I can do for you:**
• 📧 Manage emails, WhatsApp, and all communications
• 📅 Schedule meetings and create JBJ Video Meet links
• 📊 Generate reports and analyze data
• 👥 Coordinate with all team members and departments
• 🎯 Track leads and follow-ups
• 📋 Create and manage tasks

Just type naturally or use commands like \`/schedule\`, \`/email\`, or mention team members with @name.

How may I assist you today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [capitalizedName]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages]);

  // Handle @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Check for @ mention
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = value.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);

    // Check for / command
    if (value.startsWith('/')) {
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }
  };

  const insertMention = (member: TeamMember) => {
    const lastAtIndex = input.lastIndexOf('@');
    const newInput = input.slice(0, lastAtIndex) + `@${member.name} `;
    setInput(newInput);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const insertCommand = (command: string) => {
    setInput(command + ' ');
    setShowCommands(false);
    inputRef.current?.focus();
  };

  const filteredMembers = allTeamMembers.filter(m => 
    m.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    // Extract mentions
    const mentionRegex = /@(\w+\s?\w+)/g;
    const mentions = [...input.matchAll(mentionRegex)].map(m => m[1]);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      mentions,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowCommands(false);
    setShowMentions(false);

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
      const conversationHistory = messages.filter(m => !m.isTyping).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('executive-assistant', {
        body: {
          action: 'chat',
          data: {
            message: userMessage.content,
            conversationHistory,
            mentions,
          },
          context: 'Founder\'s Assistant - Full Access',
        },
      });

      if (error) throw error;

      const assistantResponse = data?.response || "I apologize, but I'm having trouble processing that request. Could you please rephrase?";

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== typingId);
        return [...filtered, {
          id: Date.now().toString(),
          role: 'assistant',
          content: assistantResponse,
          timestamp: new Date(),
        }];
      });

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== typingId);
        return [...filtered, {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I apologize for the technical difficulty. Let me try to reconnect... Is there anything else I can help you with?",
          timestamp: new Date(),
        }];
      });
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    if (!isListening) {
      toast.info('Voice input activated. Speak now...');
    } else {
      toast.info('Voice input deactivated');
    }
  };

  return (
    <div className="bg-[#0E0E0E] border border-gold/20 rounded-xl overflow-hidden h-[calc(100vh-320px)] min-h-[500px] flex flex-col">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-[#0E0E0E] to-[#1A1A1A] border-b border-gold/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gold/30">
              <img src={oliviaPortrait} alt="Olivia AI" className="w-full h-full object-cover" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0A0A0A] rounded-full" />
          </div>
          <div>
            <h3 className="text-gold font-semibold text-sm">Olivia AI</h3>
            <p className="text-gray-400 text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Online • Ready to assist
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-gold/10 text-gold border-gold/30 text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
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
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 border border-gold/30">
                  <img src={oliviaPortrait} alt="Olivia" className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-gold text-black' 
                  : 'bg-[#1A1A1A] text-gray-100 border border-gold/20'
              } rounded-2xl px-4 py-3`}>
                {message.isTyping ? (
                  <div className="flex gap-1 py-1">
                    <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    {message.mentions && message.mentions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.mentions.map((mention, i) => (
                          <Badge key={i} className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                            @{mention}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center ml-2 flex-shrink-0">
                  <User className="w-4 h-4 text-gray-300" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* Command/Mention Suggestions */}
      <AnimatePresence>
        {showCommands && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="border-t border-gold/20 bg-[#1A1A1A] p-3"
          >
            <p className="text-xs text-gray-400 mb-2">Suggested Commands</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_COMMANDS.map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => insertCommand(cmd.command)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 text-gold hover:bg-gold/20 transition-colors text-xs"
                >
                  <cmd.icon className="w-3 h-3" />
                  {cmd.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {showMentions && filteredMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="border-t border-gold/20 bg-[#1A1A1A] p-3 max-h-40 overflow-y-auto"
          >
            <p className="text-xs text-gray-400 mb-2">Mention Team Member</p>
            <div className="space-y-1">
              {filteredMembers.slice(0, 5).map((member) => (
                <button
                  key={member.id}
                  onClick={() => insertMention(member)}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gold/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gold/20">
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-white">{member.name}</p>
                    <p className="text-xs text-gray-400">{member.role}</p>
                  </div>
                  {member.isAI && (
                    <Badge className="ml-auto bg-gold/10 text-gold border-gold/30 text-xs">AI</Badge>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-4 border-t border-gold/20 bg-[#0E0E0E]">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoice}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-gold/10 text-gold hover:bg-gold/20'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button className="w-10 h-10 rounded-full bg-gold/10 text-gold hover:bg-gold/20 flex items-center justify-center transition-all">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message or command..."
              className="flex-1 bg-[#1A1A1A] border-gold/20 text-white placeholder:text-gray-500 focus:border-gold pr-10"
              disabled={isLoading}
            />
            <button 
              onClick={() => setShowCommands(!showCommands)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold transition-colors"
            >
              <Command className="w-4 h-4" />
            </button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-gold hover:bg-gold/90 text-black w-10 h-10 p-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-gray-500 text-xs text-center mt-3">
          Use @name to mention team members • Use /command for quick actions
        </p>
      </div>
    </div>
  );
};

export default FoundersChatPanel;
