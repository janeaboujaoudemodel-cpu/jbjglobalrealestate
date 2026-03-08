import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, Plus, Hash, AtSign, Smile, Paperclip, Settings,
  Users, Search, Bell, Phone, Video, MoreVertical, MessageSquare,
  Globe, Lock, ChevronDown, Check, X, Mic, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  allTeamMembers,
  companyChannels,
  getTeamMemberById,
  getChannelById,
  TeamMember,
  CompanyChannel,
} from '@/config/team-members';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  channelId: string;
  reactions?: { emoji: string; userIds: string[] }[];
  attachments?: { type: string; url: string; name: string }[];
  isTranslated?: boolean;
  originalLanguage?: string;
}

interface TranslationSettings {
  enabled: boolean;
  targetLanguage: string;
}

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية (Arabic)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'ru', name: 'Русский (Russian)' },
  { code: 'it', name: 'Italiano (Italian)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
];

const CompanyCommunicationHub = () => {
  const [activeChannel, setActiveChannel] = useState('general');
  const [activeDM, setActiveDM] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: 'jane-bou-jaoude',
      content: 'Good morning team! Welcome to our new communication hub. Let\'s make today productive! 🚀',
      timestamp: new Date(Date.now() - 3600000),
      channelId: 'general',
    },
    {
      id: '2',
      senderId: 'amanda-clarke',
      content: 'Good morning Jane! I\'ve prepared the agenda for today\'s executive meeting and sent calendar invites to all attendees.',
      timestamp: new Date(Date.now() - 3500000),
      channelId: 'general',
    },
    {
      id: '3',
      senderId: 'michael-anderson',
      content: 'Morning all! Sales team has 3 viewings scheduled today. Let\'s close some deals! 💪',
      timestamp: new Date(Date.now() - 3400000),
      channelId: 'general',
    },
    {
      id: '4',
      senderId: 'sarah-mitchell',
      content: 'I\'ve uploaded the new Sobha Hartland brochures to the portal. All listings are now live.',
      timestamp: new Date(Date.now() - 3300000),
      channelId: 'general',
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [translation, setTranslation] = useState<TranslationSettings>({
    enabled: false,
    targetLanguage: 'en',
  });
  const [channelUnread, setChannelUnread] = useState<Record<string, number>>({
    'announcements': 2,
    'sales-team': 5,
  });

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Current user (would come from auth in real app)
  const currentUser = getTeamMemberById('jane-bou-jaoude') || allTeamMembers[0];

  // Scroll to bottom of messages within the chat container only - never page scroll
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Auto-scroll when new messages arrive for the active channel
  useEffect(() => {
    const activeMessages = messages.filter(m => 
      activeDM ? (m.channelId === `dm-${activeDM}`) : (m.channelId === activeChannel)
    );
    if (activeMessages.length > 0) {
      // Small delay to ensure DOM has updated
      setTimeout(scrollToBottom, 50);
    }
  }, [messages, activeChannel, activeDM, scrollToBottom]);

  // Handle channel switch
  const handleChannelSwitch = (channelId: string) => {
    setActiveChannel(channelId);
    setActiveDM(null);
    // Clear unread for this channel
    setChannelUnread(prev => ({ ...prev, [channelId]: 0 }));
    // Scroll to bottom after channel switch
    setTimeout(scrollToBottom, 100);
  };

  // Handle DM switch
  const handleDMSwitch = (memberId: string) => {
    setActiveDM(memberId);
    setActiveChannel('');
    setTimeout(scrollToBottom, 100);
  };

  // Send message - prevent any page scroll
  const sendMessage = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      content: newMessage,
      timestamp: new Date(),
      channelId: activeDM ? `dm-${activeDM}` : activeChannel,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setShowMentions(false);

    // Scroll only within the messages container, not the page
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    });
  };

  // Handle input change with @mention detection
  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    // Check for @mention trigger
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentions(true);
      setMentionFilter('');
    } else if (lastAtIndex !== -1) {
      const textAfterAt = value.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setShowMentions(true);
        setMentionFilter(textAfterAt.toLowerCase());
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  // Insert mention
  const insertMention = (member: TeamMember) => {
    const lastAtIndex = newMessage.lastIndexOf('@');
    const newText = newMessage.slice(0, lastAtIndex) + `@${member.name} `;
    setNewMessage(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  // Filter messages for current channel/DM
  const currentMessages = messages.filter(m => 
    activeDM ? (m.channelId === `dm-${activeDM}`) : (m.channelId === activeChannel)
  );

  // Get filtered team members for mentions
  const filteredMembers = allTeamMembers.filter(m => 
    m.name.toLowerCase().includes(mentionFilter) ||
    m.role.toLowerCase().includes(mentionFilter)
  );

  // Add reaction to message
  const addReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const existingReaction = m.reactions?.find(r => r.emoji === emoji);
        if (existingReaction) {
          if (existingReaction.userIds.includes(currentUser.id)) {
            // Remove user's reaction
            return {
              ...m,
              reactions: m.reactions?.map(r => 
                r.emoji === emoji 
                  ? { ...r, userIds: r.userIds.filter(id => id !== currentUser.id) }
                  : r
              ).filter(r => r.userIds.length > 0)
            };
          } else {
            // Add user's reaction
            return {
              ...m,
              reactions: m.reactions?.map(r =>
                r.emoji === emoji
                  ? { ...r, userIds: [...r.userIds, currentUser.id] }
                  : r
              )
            };
          }
        } else {
          // New reaction
          return {
            ...m,
            reactions: [...(m.reactions || []), { emoji, userIds: [currentUser.id] }]
          };
        }
      }
      return m;
    }));
  };

  const activeChannelData = getChannelById(activeChannel);
  const activeDMUser = activeDM ? getTeamMemberById(activeDM) : null;

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-zinc-500',
  };

  return (
    <div className="h-[calc(100vh-120px)] bg-zinc-950 text-white flex rounded-xl overflow-hidden border border-zinc-800">
      {/* Sidebar */}
      <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        {/* Workspace Header */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center text-black font-bold text-sm">
                JJ
              </div>
              <div>
                <h1 className="font-bold text-sm">JBJ Global</h1>
                <p className="text-xs text-zinc-400">Real Estate</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-800 border-zinc-700 text-sm h-9"
            />
          </div>
        </div>

        {/* Translation Settings */}
        <div className="px-3 py-2 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-400">Translation</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  {translation.enabled ? AVAILABLE_LANGUAGES.find(l => l.code === translation.targetLanguage)?.name.split(' ')[0] : 'Off'}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                <DropdownMenuItem 
                  onClick={() => setTranslation({ enabled: false, targetLanguage: 'en' })}
                  className="text-xs"
                >
                  <X className="w-3 h-3 mr-2" />
                  Disable Translation
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-700" />
                {AVAILABLE_LANGUAGES.map(lang => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setTranslation({ enabled: true, targetLanguage: lang.code })}
                    className="text-xs"
                  >
                    {translation.targetLanguage === lang.code && translation.enabled && (
                      <Check className="w-3 h-3 mr-2" />
                    )}
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {translation.enabled && (
            <p className="text-[10px] text-zinc-500 mt-1">
              Messages will be translated to {AVAILABLE_LANGUAGES.find(l => l.code === translation.targetLanguage)?.name}
            </p>
          )}
        </div>

        {/* Channels List */}
        <ScrollArea className="flex-1">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Channels</span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => toast.info('Create channel coming soon')}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            {companyChannels.map((channel) => (
              <button
                key={channel.id}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors ${
                  activeChannel === channel.id && !activeDM
                    ? 'bg-gold/20 text-gold' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
                onClick={() => handleChannelSwitch(channel.id)}
              >
                <span className="flex items-center gap-2">
                  {channel.isPrivate ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Hash className="w-4 h-4" />
                  )}
                  <span className="truncate">{channel.name}</span>
                </span>
                {channelUnread[channel.id] > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center text-xs">
                    {channelUnread[channel.id]}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Direct Messages */}
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Direct Messages</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            {allTeamMembers.slice(0, 10).map((member) => (
              <button
                key={member.id}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                  activeDM === member.id
                    ? 'bg-gold/20 text-gold'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
                onClick={() => handleDMSwitch(member.id)}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="text-[10px] bg-zinc-700">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${statusColors[member.status || 'online']}`} />
                </div>
                <span className="truncate flex-1 text-left">{member.name}</span>
                {member.isAI && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-gold/50 text-gold">
                    AI
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Channel/DM Header */}
        <div className="h-14 border-b border-zinc-800 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {activeDM ? (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activeDMUser?.avatar} alt={activeDMUser?.name} />
                  <AvatarFallback className="bg-zinc-700">
                    {activeDMUser?.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-sm">{activeDMUser?.name}</h2>
                  <p className="text-xs text-zinc-400">{activeDMUser?.role}</p>
                </div>
                {activeDMUser?.isAI && (
                  <Badge variant="outline" className="text-[10px] border-gold/50 text-gold">AI Assistant</Badge>
                )}
              </>
            ) : (
              <>
                {activeChannelData?.isPrivate ? (
                  <Lock className="w-5 h-5 text-zinc-400" />
                ) : (
                  <Hash className="w-5 h-5 text-zinc-400" />
                )}
                <div>
                  <h2 className="font-semibold">{activeChannelData?.name}</h2>
                  <p className="text-xs text-zinc-400">{activeChannelData?.description}</p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm"
              className="h-8 px-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-md transition-all duration-200 hover:scale-105"
              onClick={() => toast.success('Starting voice call...')}
            >
              <Phone className="w-4 h-4 mr-1" />
              Call
            </Button>
            <Button 
              size="sm"
              className="h-8 px-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-md transition-all duration-200 hover:scale-105"
              onClick={() => toast.success('Starting video call...')}
            >
              <Video className="w-4 h-4 mr-1" />
              Video
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-800">
              <Users className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-800">
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages Container - Fixed height with internal scroll */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 min-h-0"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {currentMessages.map((message) => {
                const sender = getTeamMemberById(message.senderId);
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="group flex gap-3 hover:bg-zinc-900/50 rounded-lg p-2 -mx-2"
                  >
                    <Avatar className="h-9 w-9 mt-0.5 flex-shrink-0">
                      <AvatarImage src={sender?.avatar} alt={sender?.name} />
                      <AvatarFallback className="bg-gold/20 text-gold text-sm">
                        {sender?.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-sm">{sender?.name}</span>
                        {sender?.isAI && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-gold/50 text-gold">
                            AI
                          </Badge>
                        )}
                        <span className="text-xs text-zinc-500">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-zinc-300 text-sm break-words">{message.content}</p>
                      
                      {/* Reactions */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {message.reactions.map((reaction, i) => (
                            <button
                              key={i}
                              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-sm transition-colors ${
                                reaction.userIds.includes(currentUser.id)
                                  ? 'bg-gold/20 border border-gold/50'
                                  : 'bg-zinc-800 hover:bg-zinc-700'
                              }`}
                              onClick={() => addReaction(message.id, reaction.emoji)}
                            >
                              <span>{reaction.emoji}</span>
                              <span className="text-zinc-400 text-xs">{reaction.userIds.length}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 -mt-8">
                        <div className="flex gap-1 bg-zinc-800 rounded-lg p-1 shadow-lg border border-zinc-700">
                          {['👍', '❤️', '😂', '🎉', '🔥'].map((emoji) => (
                            <button
                              key={emoji}
                              className="hover:bg-zinc-700 rounded px-1.5 py-0.5 text-sm"
                              onClick={() => addReaction(message.id, emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                          <button className="hover:bg-zinc-700 rounded px-1.5 py-0.5">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* @Mention Suggestions - Shows ALL team members */}
        <AnimatePresence>
          {showMentions && filteredMembers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mx-4 mb-2 bg-zinc-800 rounded-lg border border-zinc-700 shadow-xl max-h-64 overflow-y-auto"
            >
              <div className="sticky top-0 bg-zinc-800 px-3 py-2 border-b border-zinc-700">
                <p className="text-xs text-zinc-400">{filteredMembers.length} team members</p>
              </div>
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-700 transition-colors"
                  onClick={() => insertMention(member)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="bg-zinc-600 text-xs">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{member.role} • {member.department}</p>
                  </div>
                  {member.isAI && (
                    <Badge variant="outline" className="ml-auto text-[9px] border-gold/50 text-gold flex-shrink-0">AI</Badge>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Input */}
        <div className="p-4 border-t border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={activeDM ? `Message ${activeDMUser?.name}` : `Message #${activeChannelData?.name}`}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  sendMessage(e);
                }
              }}
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <Mic className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <Smile className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <AtSign className="w-4 h-4" onClick={() => setShowMentions(true)} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button 
              size="icon" 
              type="button"
              className="h-8 w-8 bg-gold hover:bg-gold-light text-black flex-shrink-0"
              onClick={(e) => sendMessage(e)}
              disabled={!newMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Members Sidebar */}
      <div className="w-60 bg-zinc-900 border-l border-zinc-800 hidden xl:flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-400">
            {activeDM ? 'User Info' : `Members — ${activeChannelData?.members.length || 0}`}
          </h3>
        </div>
        <ScrollArea className="flex-1 p-4">
          {activeDM ? (
            // User profile for DM
            <div className="space-y-4">
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-3">
                  <AvatarImage src={activeDMUser?.avatar} alt={activeDMUser?.name} />
                  <AvatarFallback className="bg-gold/20 text-gold text-xl">
                    {activeDMUser?.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <h4 className="font-semibold">{activeDMUser?.name}</h4>
                <p className="text-sm text-zinc-400">{activeDMUser?.role}</p>
                {activeDMUser?.isAI && (
                  <Badge className="mt-2 bg-gold/20 text-gold border-gold/50">AI Assistant</Badge>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Department</span>
                  <span>{activeDMUser?.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Email</span>
                  <span className="text-gold truncate max-w-[120px]">{activeDMUser?.email}</span>
                </div>
                {activeDMUser?.languages && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Languages</span>
                    <span className="truncate max-w-[120px]">{activeDMUser.languages.slice(0, 2).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Channel members list
            <div className="space-y-2">
              {activeChannelData?.members.slice(0, 15).map((memberId) => {
                const member = getTeamMemberById(memberId);
                if (!member) return null;
                return (
                  <div key={member.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-800 transition-colors">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-zinc-700 text-xs">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${statusColors[member.status || 'online']}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{member.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{member.role}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default CompanyCommunicationHub;
