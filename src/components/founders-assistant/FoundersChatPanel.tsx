import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import { 
  Send, 
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
  ArrowDown,
  X,
  File,
  Image,
  FileVideo,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { allTeamMembers, TeamMember } from '@/config/team-members';
import amandaPortrait from "@/assets/team/amanda-clarke-executive-assistant.png";
import { executeCommand, parseCommand } from '@/utils/slash-command-executor';
import { useFileUpload, formatFileSize, UploadedFile } from '@/hooks/useFileUpload';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';

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
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File upload hook
  const { files: uploadedFiles, isUploading: isUploadingFiles, uploadFiles, removeFile, clearFiles } = useFileUpload(user?.id);

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
        content: `${greeting}, Miss Jane! 👋

I'm **Amanda Clarke**, your personal executive assistant. I'm here to serve you and ensure everything runs seamlessly.

**At your service:**
• 📧 Manage all your communications - emails, WhatsApp, and social media
• 📅 Schedule meetings and create JBJ Video Meet links
• 📊 Generate reports and monitor team performance
• 👥 Coordinate with all departments on your behalf
• 🎯 Track leads, payments, and follow-ups
• 📋 Manage tasks and priorities
• 📈 Collect daily reports from all department heads
• 📝 Take notes from meetings, calls, and interviews

I speak English and Spanish fluently. For other languages, I use professional translation to ensure accurate communication.

Just type naturally or use commands like \`/schedule\`, \`/email\`, or mention team members with @name.

*How may I assist you today, Miss Jane?*`,
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

  // Handle file input change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const uploaded = await uploadFiles(files);
      setPendingFiles(prev => [...prev, ...uploaded]);
      toast.success(`${files.length} file(s) ready to send`);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePendingFile = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
    removeFile(id);
  };

  const handleSendMessage = useCallback(async () => {
    if ((!input.trim() && pendingFiles.length === 0) || isLoading) return;

    // Extract mentions
    const mentionRegex = /@(\w+\s?\w+)/g;
    const mentions = [...input.matchAll(mentionRegex)].map(m => m[1]);

    // Check if this is a slash command
    const parsedCommand = parseCommand(input.trim());

    // Include file attachments in message
    const attachments = pendingFiles.map(f => ({ name: f.name, type: f.type, url: f.url }));

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || `[Sent ${pendingFiles.length} file(s)]`,
      timestamp: new Date(),
      mentions,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setPendingFiles([]);
    clearFiles();
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
      let assistantResponse: string;
      let taskStatus: 'pending' | 'completed' | 'failed' = 'completed';

      // If it's a slash command, execute it
      if (parsedCommand && user?.id) {
        const result = await executeCommand(input.trim(), user.id);
        assistantResponse = result.message;
        taskStatus = result.success ? 'completed' : 'failed';
      } else {
        // Regular AI chat
        const conversationHistory = messages
          .filter(m => !m.isTyping)
          .slice(-20) // Keep last 20 messages for context
          .map(m => ({
            role: m.role,
            content: m.content,
          }));
        // Add the current user message to history
        conversationHistory.push({ role: 'user', content: userMessage.content });

        const { data, error } = await supabase.functions.invoke('executive-assistant', {
          body: {
            action: 'chat',
            data: {
              message: userMessage.content,
              conversationHistory,
              mentions,
              attachments,
            },
            context: 'Founder\'s Assistant - Full Access',
          },
        });

        if (error) throw error;

        assistantResponse = data?.response || "I apologize, but I'm having trouble processing that request. Could you please rephrase?";
      }

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== typingId);
        return [...filtered, {
          id: Date.now().toString(),
          role: 'assistant',
          content: assistantResponse,
          timestamp: new Date(),
          taskStatus,
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
  }, [input, isLoading, messages, pendingFiles, user?.id, clearFiles]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle voice transcript from VoiceInputButton
  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(prev => prev ? `${prev} ${text}` : text);
  }, []);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.startsWith('video/')) return <FileVideo className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 rounded-xl overflow-hidden h-[calc(100vh-320px)] min-h-[500px] flex flex-col shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
        accept="*/*"
      />
      
      {/* Chat Header - Premium Champagne */}
      <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-b-2 border-gold/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/30 to-gold/5 blur-sm animate-pulse" />
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gold/50 shadow-md">
              <img src={amandaPortrait} alt="Amanda Clarke" className="w-full h-full object-cover" />
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h3 className="text-black font-semibold text-sm flex items-center gap-2">
              Amanda Clarke
              <Badge className="bg-gold/10 text-gold border-gold/30 text-[10px]">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                Your Personal Assistant
              </Badge>
            </h3>
            <p className="text-zinc-600 text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Online • Ready to assist
            </p>
          </div>
        </div>
        <div className="text-xs text-zinc-500">
          +971 54 716 7107
        </div>
      </div>

      {/* Messages - Champagne background */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-[#FDFBF7] to-[#F5F0E6]"
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
                <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 border-2 border-gold/50 shadow-sm">
                  <img src={amandaPortrait} alt="Amanda Clarke" className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-gradient-to-r from-gold to-amber-500 text-black' 
                  : 'bg-white text-black border border-gold/30 shadow-sm'
              } rounded-2xl px-4 py-3`}>
                {message.isTyping ? (
                  <div className="flex gap-1.5 py-1 px-2">
                    <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none">
                      {message.content.split('\n').map((line, i) => {
                        // Escape HTML first to prevent XSS
                        const escapeHtml = (text: string) => text
                          .replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;')
                          .replace(/"/g, '&quot;')
                          .replace(/'/g, '&#039;');
                        
                        let rendered = escapeHtml(line);
                        // Bold (now safe after escaping)
                        rendered = rendered.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                        // Italic
                        rendered = rendered.replace(/\*(.*?)\*/g, '<em>$1</em>');
                        // Code
                        rendered = rendered.replace(/`(.*?)`/g, '<code class="bg-gold/20 px-1 rounded text-gold">$1</code>');
                        
                        // Sanitize with DOMPurify as defense-in-depth
                        const sanitized = DOMPurify.sanitize(rendered, {
                          ALLOWED_TAGS: ['strong', 'em', 'code', 'p', 'br'],
                          ALLOWED_ATTR: ['class']
                        });
                        
                        return (
                          <p 
                            key={i} 
                            className={line.startsWith('•') ? 'pl-2' : ''}
                            dangerouslySetInnerHTML={{ __html: sanitized }}
                          />
                        );
                      })}
                    </div>
                    {message.mentions && message.mentions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.mentions.map((mention, i) => (
                          <Badge key={i} className="bg-gold/20 text-gold border-gold/30 text-xs">
                            @{mention}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {message.taskStatus && (
                      <div className="flex items-center gap-1 mt-2 text-xs">
                        {message.taskStatus === 'completed' && (
                          <span className="text-green-600 flex items-center gap-1">
                            ✅ Task completed
                          </span>
                        )}
                        {message.taskStatus === 'failed' && (
                          <span className="text-red-600 flex items-center gap-1">
                            ⚠️ Connection issue
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center ml-2 flex-shrink-0 shadow-sm">
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
              <span className="text-xs text-zinc-600">Suggested prompts</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SUGGESTED_AI_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="text-left px-3 py-2 rounded-lg bg-white border border-gold/30 hover:border-gold text-sm text-black hover:shadow-md transition-all group"
                >
                  <span className="text-gold group-hover:text-amber-600">→</span> {prompt}
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

      {/* Command/Mention Suggestions - Champagne theme */}
      <AnimatePresence>
        {showCommands && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="border-t-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] p-3"
          >
            <p className="text-xs text-zinc-600 mb-2 flex items-center gap-2">
              <Command className="w-3 h-3 text-gold" />
              Available Commands
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SUGGESTED_COMMANDS.map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => insertCommand(cmd.command)}
                  className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white border border-gold/30 hover:border-gold hover:shadow-md transition-all text-left group"
                >
                  <cmd.icon className="w-4 h-4 text-gold mt-0.5" />
                  <div>
                    <p className="text-sm text-black group-hover:text-gold transition-colors">{cmd.label}</p>
                    <p className="text-xs text-zinc-500">{cmd.description}</p>
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
            className="border-t-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] p-3 max-h-48 overflow-y-auto"
          >
            <p className="text-xs text-zinc-600 mb-2 flex items-center gap-2">
              <AtSign className="w-3 h-3 text-gold" />
              Mention Team Member
            </p>
            <div className="space-y-1">
              {filteredMembers.slice(0, 6).map((member) => (
                <button
                  key={member.id}
                  onClick={() => insertMention(member)}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-colors"
                >
                  {/* GLOBAL IMAGE RULE - LOCKED (FINAL): max zoom, crop from bottom */}
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gold/30 bg-white">
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-full h-full"
                      style={{ objectFit: "cover", objectPosition: "center 15%" }}
                    />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm text-black">{member.name}</p>
                    <p className="text-xs text-zinc-500">{member.role}</p>
                  </div>
                  {/* Star indicator visible only to founder */}
                  {member.isAI && (
                    <Sparkles className="w-4 h-4 text-gold flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Files Preview - Champagne theme */}
      {pendingFiles.length > 0 && (
        <div className="px-4 py-2 border-t-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
          <p className="text-xs text-zinc-600 mb-2 flex items-center gap-2">
            <Upload className="w-3 h-3 text-gold" />
            Files ready to send ({pendingFiles.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {pendingFiles.map((file) => (
              <div 
                key={file.id}
                className="flex items-center gap-2 bg-white border border-gold/30 rounded-lg px-3 py-1.5 text-xs shadow-sm"
              >
                {getFileIcon(file.type)}
                <span className="text-black truncate max-w-[120px]">{file.name}</span>
                <span className="text-zinc-500">{formatFileSize(file.size)}</span>
                <button
                  onClick={() => removePendingFile(file.id)}
                  className="text-zinc-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input - Premium Champagne */}
      <div className="p-4 border-t-2 border-gold/30 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
        <div className="flex items-center gap-2">
          <VoiceInputButton
            onTranscript={handleVoiceTranscript}
            disabled={isLoading}
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-white/80 text-gold hover:bg-white border border-gold/30"
          />
          <button 
            onClick={handleFileUpload}
            disabled={isUploadingFiles}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isUploadingFiles 
                ? 'bg-gold/30 text-gold animate-pulse'
                : 'bg-white/80 text-gold hover:bg-white border border-gold/30'
            }`}
            title="Attach file (no size limit)"
          >
            {isUploadingFiles ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
          </button>
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message or command..."
              className="flex-1 bg-white border-2 border-gold/30 text-black placeholder:text-zinc-400 focus:border-gold pr-10 h-11"
              disabled={isLoading}
            />
            <button 
              onClick={() => setShowCommands(!showCommands)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-gold transition-colors"
              title="Show commands"
            >
              <Command className="w-4 h-4" />
            </button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={(!input.trim() && pendingFiles.length === 0) || isLoading}
            className="bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-gold text-black w-11 h-11 p-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-zinc-600 text-xs text-center mt-3 opacity-80">
          Use <span className="text-gold font-semibold">@name</span> to mention • <span className="text-gold font-semibold">/command</span> for actions • <span className="text-gold font-semibold">📎 Attach files</span> (no size limit)
        </p>
      </div>
    </div>
  );
};

export default FoundersChatPanel;
