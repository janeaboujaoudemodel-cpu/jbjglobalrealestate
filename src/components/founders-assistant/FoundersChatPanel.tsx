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
  Bot,
  Lightbulb,
  ArrowDown
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
  taskStatus?: 'pending' | 'completed' | 'failed';
}

interface FoundersChatPanelProps {
  userName?: string;
}

// Suggested commands with descriptions
const SUGGESTED_COMMANDS = [
  { icon: Calendar, label: 'Schedule meeting', command: '/schedule meeting with', description: 'Book a meeting via JBJ Video Meet' },
  { icon: Mail, label: 'Send email', command: '/email to', description: 'Compose and send professional emails' },
  { icon: MessageSquare, label: 'Send WhatsApp', command: '/whatsapp to', description: 'Send WhatsApp messages' },
  { icon: Video, label: 'Create JBJ Meet', command: '/create-meeting', description: 'Generate instant video meeting link' },
  { icon: FileText, label: 'Generate report', command: '/report daily', description: 'Create daily/weekly reports' },
  { icon: Phone, label: 'Call client', command: '/call', description: 'Initiate voice call' },
];

// AI suggested prompts
const SUGGESTED_AI_PROMPTS = [
  "What's my schedule for today?",
  "Show me my hot leads",
  "Draft an email to a new client about property viewing",
  "Create a follow-up task for lead Ahmed",
  "Summarize my team's performance this week",
  "Prepare a property brochure for Downtown project",
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
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

I'm **Olivia AI**, your personal executive assistant. I'm here to help you manage everything seamlessly.

**What I can do for you:**
• 📧 Manage emails, WhatsApp, and all communications
• 📅 Schedule meetings and create JBJ Video Meet links
• 📊 Generate reports and analyze data
• 👥 Coordinate with all team members and departments
• 🎯 Track leads and follow-ups
• 📋 Create and manage tasks

Just type naturally or use commands like \`/schedule\`, \`/email\`, or mention team members with @name.

*How may I assist you today?*`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [capitalizedName]);

  // Auto-scroll to bottom with smooth behavior
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Check if user has scrolled up
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  // Handle @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setShowSuggestions(false);

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

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    setShowSuggestions(false);
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
    setShowSuggestions(false);

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
          taskStatus: 'completed',
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
          taskStatus: 'failed',
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

  const handleFileUpload = () => {
    toast.info('File upload feature coming soon!');
  };

  return (
    <div className="bg-[#0E0E0E] border border-gold/20 rounded-xl overflow-hidden h-[calc(100vh-320px)] min-h-[500px] flex flex-col">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-[#0E0E0E] to-[#1A1A1A] border-b border-gold/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/30 to-gold/5 blur-sm animate-pulse" />
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gold/50">
              <img src={oliviaPortrait} alt="Olivia AI" className="w-full h-full object-cover" />
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#0A0A0A] rounded-full" />
          </div>
          <div>
            <h3 className="text-gold font-semibold text-sm flex items-center gap-2">
              Olivia AI
              <Badge className="bg-gold/10 text-gold border-gold/30 text-[10px]">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                AI Powered
              </Badge>
            </h3>
            <p className="text-gray-400 text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Online • Ready to assist
            </p>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          +971 54 716 7107
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4"
        onScroll={handleScroll}
      >
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
                  <div className="flex gap-1.5 py-1 px-2">
                    <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                      {message.content.split('\n').map((line, i) => {
                        // Simple markdown-like rendering
                        let rendered = line;
                        // Bold
                        rendered = rendered.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                        // Italic
                        rendered = rendered.replace(/\*(.*?)\*/g, '<em>$1</em>');
                        // Code
                        rendered = rendered.replace(/`(.*?)`/g, '<code class="bg-gold/20 px-1 rounded text-gold">$1</code>');
                        
                        return (
                          <p 
                            key={i} 
                            className={line.startsWith('•') ? 'pl-2' : ''}
                            dangerouslySetInnerHTML={{ __html: rendered }}
                          />
                        );
                      })}
                    </div>
                    {message.mentions && message.mentions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.mentions.map((mention, i) => (
                          <Badge key={i} className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                            @{mention}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {message.taskStatus && (
                      <div className="flex items-center gap-1 mt-2 text-xs">
                        {message.taskStatus === 'completed' && (
                          <span className="text-green-400 flex items-center gap-1">
                            ✅ Task completed
                          </span>
                        )}
                        {message.taskStatus === 'failed' && (
                          <span className="text-red-400 flex items-center gap-1">
                            ⚠️ Connection issue
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold/60 flex items-center justify-center ml-2 flex-shrink-0">
                  <User className="w-4 h-4 text-black" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Suggested AI Prompts - Show after welcome message */}
        {messages.length === 1 && showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-gold" />
              <span className="text-xs text-gray-400">Suggested prompts</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SUGGESTED_AI_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="text-left px-3 py-2 rounded-lg bg-[#1A1A1A] border border-gold/10 hover:border-gold/30 text-sm text-gray-300 hover:text-white transition-all group"
                >
                  <span className="text-gold group-hover:text-gold/80">→</span> {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 w-10 h-10 rounded-full bg-gold text-black flex items-center justify-center shadow-lg hover:bg-gold/90 transition-colors"
          >
            <ArrowDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Command/Mention Suggestions */}
      <AnimatePresence>
        {showCommands && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="border-t border-gold/20 bg-[#1A1A1A] p-3"
          >
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
              <Command className="w-3 h-3" />
              Available Commands
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SUGGESTED_COMMANDS.map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => insertCommand(cmd.command)}
                  className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#0E0E0E] border border-gold/10 hover:border-gold/30 transition-all text-left group"
                >
                  <cmd.icon className="w-4 h-4 text-gold mt-0.5" />
                  <div>
                    <p className="text-sm text-white group-hover:text-gold transition-colors">{cmd.label}</p>
                    <p className="text-xs text-gray-500">{cmd.description}</p>
                  </div>
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
            className="border-t border-gold/20 bg-[#1A1A1A] p-3 max-h-48 overflow-y-auto"
          >
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
              <AtSign className="w-3 h-3" />
              Mention Team Member
            </p>
            <div className="space-y-1">
              {filteredMembers.slice(0, 6).map((member) => (
                <button
                  key={member.id}
                  onClick={() => insertMention(member)}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gold/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gold/20">
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm text-white">{member.name}</p>
                    <p className="text-xs text-gray-400">{member.role}</p>
                  </div>
                  {member.isAI && (
                    <Badge className="bg-gold/10 text-gold border-gold/30 text-xs">
                      <Bot className="w-3 h-3 mr-1" />
                      AI
                    </Badge>
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
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button 
            onClick={handleFileUpload}
            className="w-10 h-10 rounded-full bg-gold/10 text-gold hover:bg-gold/20 flex items-center justify-center transition-all"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message or command..."
              className="flex-1 bg-[#1A1A1A] border-gold/20 text-white placeholder:text-gray-500 focus:border-gold pr-10 h-11"
              disabled={isLoading}
            />
            <button 
              onClick={() => setShowCommands(!showCommands)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold transition-colors"
              title="Show commands"
            >
              <Command className="w-4 h-4" />
            </button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-gold hover:bg-gold/90 text-black w-11 h-11 p-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-gray-500 text-xs text-center mt-3 opacity-80">
          Use <span className="text-gold">@name</span> to mention team members • Use <span className="text-gold">/command</span> for quick actions • <span className="text-gold">Suggested AI Prompts</span> available
        </p>
      </div>
    </div>
  );
};

export default FoundersChatPanel;
