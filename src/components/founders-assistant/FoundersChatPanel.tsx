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
  Lightbulb,
  ArrowDown,
  X,
  File,
  Image,
  FileVideo,
  Upload,
  PanelLeftClose,
  PanelLeftOpen,
  FileDown,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { allTeamMembers, TeamMember } from '@/config/team-members';
import amandaPortrait from "@/assets/team/amanda-clarke-executive-assistant.png";
import { executeCommand, parseCommand } from '@/utils/slash-command-executor';
import { useFileUpload, formatFileSize, UploadedFile } from '@/hooks/useFileUpload';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { useFounderChatSessions } from '@/hooks/useFounderChatSessions';
import { ChatSessionSidebar } from './ChatSessionSidebar';

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

const SUGGESTED_COMMANDS = [
  { icon: Calendar, label: 'Schedule meeting', command: '/schedule meeting with', description: 'Book a meeting via JBJ Video Meet' },
  { icon: Mail, label: 'Send email', command: '/email to', description: 'Compose and send professional emails' },
  { icon: MessageSquare, label: 'Send WhatsApp', command: '/whatsapp to', description: 'Send WhatsApp messages' },
  { icon: Video, label: 'Create JBJ Meet', command: '/create-meeting', description: 'Generate instant video meeting link' },
  { icon: FileText, label: 'Generate report', command: '/report daily', description: 'Create daily/weekly reports' },
  { icon: Phone, label: 'Call client', command: '/call', description: 'Initiate voice call' },
];

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
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { files: uploadedFiles, isUploading: isUploadingFiles, uploadFiles, removeFile, clearFiles } = useFileUpload(user?.id);
  
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    messages: dbMessages,
    createSession,
    saveMessage,
    updateSessionTitle,
    deleteSession,
    bulkDeleteSessions,
    clearAllSessions,
    saveSummary,
  } = useFounderChatSessions();

  const displayName = userName || user?.email?.split('@')[0] || 'there';
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  // Convert DB messages to local format when session changes
  useEffect(() => {
    if (dbMessages.length > 0) {
      const converted: Message[] = dbMessages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at),
        mentions: m.mentions || undefined,
        taskStatus: m.task_status as any,
      }));
      setLocalMessages(converted);
      setShowSuggestions(false);
    } else if (!activeSessionId) {
      // Show welcome message when no session
      const hour = new Date().getHours();
      let greeting = 'Good evening';
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 17) greeting = 'Good afternoon';

      setLocalMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `${greeting}, Miss Jane!\n\nI'm **Amanda Clarke**, your personal executive assistant. I'm here to serve you and ensure everything runs seamlessly.\n\n**At your service:**\n• Manage all your communications - emails, WhatsApp, and social media\n• Schedule meetings and create JBJ Video Meet links\n• Generate reports and monitor team performance\n• Coordinate with all departments on your behalf\n• Track leads, payments, and follow-ups\n• Manage tasks and priorities\n• Collect daily reports from all department heads\n• Take notes from meetings, calls, and interviews\n\nJust type naturally or use commands like \`/schedule\`, \`/email\`, or mention team members with @name.\n\n*How may I assist you today, Miss Jane?*`,
        timestamp: new Date(),
      }]);
      setShowSuggestions(true);
    }
  }, [dbMessages, activeSessionId]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [localMessages, scrollToBottom]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setShowSuggestions(false);
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
    setShowCommands(value.startsWith('/'));
  };

  const insertMention = (member: TeamMember) => {
    const lastAtIndex = input.lastIndexOf('@');
    setInput(input.slice(0, lastAtIndex) + `@${member.name} `);
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
    // Don't hide suggestions - keep them visible for easy re-use
    inputRef.current?.focus();
  };

  const filteredMembers = allTeamMembers.filter(m => 
    m.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const uploaded = await uploadFiles(files);
      setPendingFiles(prev => [...prev, ...uploaded]);
      toast.success(`${files.length} file(s) ready to send`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
    removeFile(id);
  };

  // Start a new chat
  const handleNewChat = async () => {
    await createSession();
  };

  // Summarize & save current chat
  const handleSummarize = useCallback(async () => {
    if (!activeSessionId || localMessages.length < 3) {
      toast.error('Need at least a few messages to summarize');
      return;
    }
    setIsSummarizing(true);
    try {
      const chatContent = localMessages
        .filter(m => !m.isTyping && m.id !== 'welcome')
        .map(m => `${m.role === 'user' ? 'You' : 'Amanda'}: ${m.content}`)
        .join('\n');

      const { data, error } = await supabase.functions.invoke('executive-assistant', {
        body: {
          action: 'chat',
          data: {
            message: `Please summarize the following conversation into key points, action items, and decisions made. Be concise:\n\n${chatContent}`,
            conversationHistory: [],
          },
          context: 'Summarization',
        },
      });

      if (error) throw error;
      const summary = data?.response || 'Unable to generate summary';
      await saveSummary(activeSessionId, summary);
      
      // Auto-title based on first user message
      const firstUserMsg = localMessages.find(m => m.role === 'user');
      if (firstUserMsg) {
        const title = firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
        await updateSessionTitle(activeSessionId, title);
      }

      toast.success('Chat summarized and saved');
    } catch (err) {
      toast.error('Failed to summarize chat');
    } finally {
      setIsSummarizing(false);
    }
  }, [activeSessionId, localMessages, saveSummary, updateSessionTitle]);

  const handleSendMessage = useCallback(async () => {
    if ((!input.trim() && pendingFiles.length === 0) || isLoading) return;

    const mentionRegex = /@(\w+\s?\w+)/g;
    const mentions = [...input.matchAll(mentionRegex)].map(m => m[1]);
    const parsedCommand = parseCommand(input.trim());
    const attachments = pendingFiles.map(f => ({ name: f.name, type: f.type, url: f.url }));

    // Ensure we have an active session
    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = await createSession(input.trim().substring(0, 50));
    }
    if (!sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || `[Sent ${pendingFiles.length} file(s)]`,
      timestamp: new Date(),
      mentions,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    setLocalMessages(prev => [...prev, userMessage]);
    setInput('');
    setPendingFiles([]);
    clearFiles();
    setIsLoading(true);
    setShowCommands(false);
    setShowMentions(false);
    setShowSuggestions(false);

    // Save user message to DB
    await saveMessage(sessionId, 'user', userMessage.content, mentions, attachments.length > 0 ? attachments : undefined);

    // Typing indicator
    const typingId = 'typing-' + Date.now();
    setLocalMessages(prev => [...prev, {
      id: typingId, role: 'assistant', content: '', timestamp: new Date(), isTyping: true,
    }]);

    try {
      let assistantResponse: string;
      let taskStatus: 'pending' | 'completed' | 'failed' = 'completed';

      if (parsedCommand && user?.id) {
        const result = await executeCommand(input.trim(), user.id);
        assistantResponse = result.message;
        taskStatus = result.success ? 'completed' : 'failed';
      } else {
        const conversationHistory = localMessages
          .filter(m => !m.isTyping && m.id !== 'welcome')
          .slice(-20)
          .map(m => ({ role: m.role, content: m.content }));
        conversationHistory.push({ role: 'user', content: userMessage.content });

        const { data, error } = await supabase.functions.invoke('executive-assistant', {
          body: {
            action: 'chat',
            data: { message: userMessage.content, conversationHistory, mentions, attachments },
            context: 'Founder\'s Assistant - Full Access',
          },
        });

        if (error) throw error;
        assistantResponse = data?.response || "I apologize, but I'm having trouble processing that request.";
      }

      setLocalMessages(prev => {
        const filtered = prev.filter(m => m.id !== typingId);
        return [...filtered, {
          id: Date.now().toString(), role: 'assistant', content: assistantResponse,
          timestamp: new Date(), taskStatus,
        }];
      });

      // Save assistant message to DB
      await saveMessage(sessionId, 'assistant', assistantResponse, undefined, undefined, taskStatus);

      // Auto-title on first exchange
      if (localMessages.filter(m => m.role === 'user').length <= 1) {
        const title = userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? '...' : '');
        await updateSessionTitle(sessionId, title);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errMsg = "I apologize for the technical difficulty. Let me try to reconnect...";
      setLocalMessages(prev => {
        const filtered = prev.filter(m => m.id !== typingId);
        return [...filtered, {
          id: Date.now().toString(), role: 'assistant', content: errMsg,
          timestamp: new Date(), taskStatus: 'failed',
        }];
      });
      await saveMessage(sessionId, 'assistant', errMsg, undefined, undefined, 'failed');
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, localMessages, pendingFiles, user?.id, clearFiles, activeSessionId, createSession, saveMessage, updateSessionTitle]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(prev => prev ? `${prev} ${text}` : text);
  }, []);

  const handleFileUpload = () => { fileInputRef.current?.click(); };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.startsWith('video/')) return <FileVideo className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="flex h-[calc(100vh-320px)] min-h-[500px] border-2 border-[#C9A84C]/30 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
      {/* Chat History Sidebar */}
      {showSidebar && (
        <ChatSessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewChat={handleNewChat}
          onDeleteSession={deleteSession}
          onBulkDelete={bulkDeleteSessions}
          onClearAll={clearAllSessions}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept="*/*" />

        {/* Chat Header */}
        <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-b-2 border-[#C9A84C]/30 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-zinc-600 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </Button>
            <div className="relative">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#C9A84C]/50 shadow-md">
                <img src={amandaPortrait} alt="Amanda Clarke" className="w-full h-full object-cover" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h3 className="text-black font-semibold text-sm flex items-center gap-2">
                Amanda Clarke
                <Badge className="bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30 text-[10px]">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                  Online
                </Badge>
              </h3>
              <p className="text-zinc-600 text-xs">Your Personal Executive Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-600 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 h-8"
              onClick={handleSummarize}
              disabled={isSummarizing || localMessages.length < 3}
              title="Summarize & save chat"
            >
              {isSummarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <FileDown className="w-3.5 h-3.5 mr-1" />}
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-600 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 h-8"
              onClick={handleNewChat}
              title="Start new chat"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-[#FDFBF7] to-[#F5F0E6]" onScroll={handleScroll}>
          <div className="space-y-4">
            {localMessages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 border-2 border-[#C9A84C]/50 shadow-sm">
                    <img src={amandaPortrait} alt="Amanda Clarke" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`max-w-[80%] ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white' 
                    : 'bg-white text-black border border-[#C9A84C]/30 shadow-sm'
                } rounded-2xl px-4 py-3`}>
                  {message.isTyping ? (
                    <div className="flex gap-1.5 py-1 px-2">
                      <span className="w-2 h-2 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none">
                        {message.content.split('\n').map((line, i) => {
                          const escapeHtml = (text: string) => text
                            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
                          let rendered = escapeHtml(line);
                          rendered = rendered.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                          rendered = rendered.replace(/\*(.*?)\*/g, '<em>$1</em>');
                          rendered = rendered.replace(/`(.*?)`/g, '<code class="bg-[#C9A84C]/20 px-1 rounded text-[#C9A84C]">$1</code>');
                          const sanitized = DOMPurify.sanitize(rendered, {
                            ALLOWED_TAGS: ['strong', 'em', 'code', 'p', 'br'],
                            ALLOWED_ATTR: ['class']
                          });
                          return (
                            <p key={i} className={line.startsWith('•') ? 'pl-2' : ''}
                              dangerouslySetInnerHTML={{ __html: sanitized }} />
                          );
                        })}
                      </div>
                      {message.mentions && message.mentions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.mentions.map((mention, i) => (
                            <Badge key={i} className="bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30 text-xs">
                              @{mention}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {message.taskStatus && (
                        <div className="flex items-center gap-1 mt-2 text-xs">
                          {message.taskStatus === 'completed' && (
                            <span className="text-green-600 flex items-center gap-1">Task completed</span>
                          )}
                          {message.taskStatus === 'failed' && (
                            <span className="text-red-600 flex items-center gap-1">Connection issue</span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#B8973F] flex items-center justify-center ml-2 flex-shrink-0 shadow-sm">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Suggested prompts — always visible until user has sent multiple messages */}
          {showSuggestions && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-[#C9A84C]" />
                <span className="text-xs text-zinc-600 font-medium">Quick Actions & Suggested Prompts</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SUGGESTED_AI_PROMPTS.map((prompt, i) => (
                  <button key={i} onClick={() => handleSuggestedPrompt(prompt)}
                    className="text-left px-3 py-2 rounded-lg bg-white border border-[#C9A84C]/30 hover:border-[#C9A84C] text-sm text-black hover:shadow-md transition-all group">
                    <span className="text-[#C9A84C] group-hover:text-[#B8973F]">→</span> {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Scroll button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-24 right-6 w-10 h-10 rounded-full bg-[#C9A84C] text-white flex items-center justify-center shadow-lg hover:bg-[#B8973F] transition-colors">
              <ArrowDown className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Commands popup */}
        <AnimatePresence>
          {showCommands && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="border-t-2 border-[#C9A84C]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] p-3">
              <p className="text-xs text-zinc-600 mb-2 flex items-center gap-2">
                <Command className="w-3 h-3 text-[#C9A84C]" />
                Available Commands
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SUGGESTED_COMMANDS.map((cmd, i) => (
                  <button key={i} onClick={() => insertCommand(cmd.command)}
                    className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white border border-[#C9A84C]/30 hover:border-[#C9A84C] hover:shadow-md transition-all text-left group">
                    <cmd.icon className="w-4 h-4 text-[#C9A84C] mt-0.5" />
                    <div>
                      <p className="text-sm text-black group-hover:text-[#C9A84C] transition-colors">{cmd.label}</p>
                      <p className="text-xs text-zinc-500">{cmd.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {showMentions && filteredMembers.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="border-t-2 border-[#C9A84C]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] p-3 max-h-48 overflow-y-auto">
              <p className="text-xs text-zinc-600 mb-2 flex items-center gap-2">
                <AtSign className="w-3 h-3 text-[#C9A84C]" />
                Mention Team Member
              </p>
              <div className="space-y-1">
                {filteredMembers.slice(0, 6).map((member) => (
                  <button key={member.id} onClick={() => insertMention(member)}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-colors">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#C9A84C]/30 bg-white">
                      <img src={member.avatar} alt={member.name} className="w-full h-full"
                        style={{ objectFit: "cover", objectPosition: "center 15%" }} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm text-black">{member.name}</p>
                      <p className="text-xs text-zinc-500">{member.role}</p>
                    </div>
                    {member.isAI && <Sparkles className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending files */}
        {pendingFiles.length > 0 && (
          <div className="px-4 py-2 border-t-2 border-[#C9A84C]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
            <p className="text-xs text-zinc-600 mb-2 flex items-center gap-2">
              <Upload className="w-3 h-3 text-[#C9A84C]" /> Files ready to send ({pendingFiles.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {pendingFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-2 bg-white border border-[#C9A84C]/30 rounded-lg px-3 py-1.5 text-xs shadow-sm">
                  {getFileIcon(file.type)}
                  <span className="text-black truncate max-w-[120px]">{file.name}</span>
                  <span className="text-zinc-500">{formatFileSize(file.size)}</span>
                  <button onClick={() => removePendingFile(file.id)} className="text-zinc-500 hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t-2 border-[#C9A84C]/30 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
          <div className="flex items-center gap-2">
            <VoiceInputButton onTranscript={handleVoiceTranscript} disabled={isLoading} variant="ghost" size="icon"
              className="w-10 h-10 rounded-full bg-white/80 text-[#C9A84C] hover:bg-white border border-[#C9A84C]/30" />
            <button onClick={handleFileUpload} disabled={isUploadingFiles}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isUploadingFiles ? 'bg-[#C9A84C]/30 text-[#C9A84C] animate-pulse' : 'bg-white/80 text-[#C9A84C] hover:bg-white border border-[#C9A84C]/30'
              }`} title="Attach file">
              {isUploadingFiles ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <div className="relative flex-1">
              <Input ref={inputRef} value={input} onChange={handleInputChange} onKeyPress={handleKeyPress}
                placeholder="Type your message or command..."
                className="flex-1 bg-white border-2 border-[#C9A84C]/30 text-black placeholder:text-zinc-400 focus:border-[#C9A84C] pr-10 h-11"
                disabled={isLoading} />
              <button onClick={() => setShowCommands(!showCommands)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-[#C9A84C] transition-colors" title="Show commands">
                <Command className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={handleSendMessage} disabled={(!input.trim() && pendingFiles.length === 0) || isLoading}
              className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] hover:from-[#B8973F] hover:to-[#C9A84C] text-white w-11 h-11 p-0">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
          <p className="text-zinc-600 text-xs text-center mt-3 opacity-80">
            Use <span className="text-[#C9A84C] font-semibold">@name</span> to mention | <span className="text-[#C9A84C] font-semibold">/command</span> for actions | <span className="text-[#C9A84C] font-semibold">Attach files</span> (no size limit)
          </p>
        </div>
      </div>
    </div>
  );
};

export default FoundersChatPanel;
