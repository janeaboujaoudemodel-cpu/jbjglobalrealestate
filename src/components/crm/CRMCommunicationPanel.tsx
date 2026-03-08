import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { 
  MessageSquare, Video, Phone, FileText, Users, 
  Send, Paperclip, ExternalLink, Hash, AtSign,
  ChevronDown, UserPlus, UserMinus, Settings, X
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { allTeamMembers, teamByDepartment, type TeamMember as ConfigTeamMember } from "@/config/team-members";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'away' | 'offline';
  avatar?: string;
  department?: string;
  email?: string;
  languages?: string[];
  nationality?: string;
  joinDate?: string;
  reportsTo?: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  senderId: string;
  message: string;
  timestamp: string;
  isMe?: boolean;
  channelId: string;
}

interface Channel {
  id: string;
  name: string;
  unread: number;
  type: 'channel' | 'dm';
  members: string[];
}

// Convert config team members to local format with real photos
const convertTeamMember = (member: ConfigTeamMember): TeamMember => ({
  id: member.id,
  name: member.name,
  role: member.role,
  status: member.status || 'online',
  avatar: member.avatar,
  department: member.department,
  email: member.email,
  languages: member.languages,
  nationality: member.nationality,
  joinDate: member.joinDate,
  reportsTo: member.reportsTo,
});

// All team members synced from Employee Hub with real photos
const ALL_TEAM_MEMBERS: TeamMember[] = allTeamMembers.map(convertTeamMember);

const DEFAULT_CHANNELS: Channel[] = [
  { id: 'jbj-group', name: 'JBJ Group', unread: 0, type: 'channel', members: ALL_TEAM_MEMBERS.map(m => m.id) },
  { id: 'general', name: 'general', unread: 0, type: 'channel', members: ALL_TEAM_MEMBERS.map(m => m.id) },
  { id: 'sales', name: 'sales-team', unread: 0, type: 'channel', members: ALL_TEAM_MEMBERS.map(m => m.id) },
  { id: 'leads', name: 'hot-leads', unread: 0, type: 'channel', members: ALL_TEAM_MEMBERS.map(m => m.id) },
  { id: 'announcements', name: 'announcements', unread: 0, type: 'channel', members: ALL_TEAM_MEMBERS.map(m => m.id) },
];

// Initial messages per channel (independent)
const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'jbj-group': [
    { id: '1', sender: 'Jane Bou Jaoude', senderId: '1', message: 'Welcome to JBJ Group! This is our main company channel.', timestamp: '09:00 AM', channelId: 'jbj-group' },
    { id: '2', sender: 'Victoria Sterling', senderId: '7', message: 'Good morning everyone! Marketing report is ready.', timestamp: '09:15 AM', channelId: 'jbj-group' },
  ],
  'general': [
    { id: '1', sender: 'System', senderId: 'system', message: 'Welcome to #general channel', timestamp: '09:00 AM', channelId: 'general' },
    { id: '2', sender: 'Jessica', senderId: '2', message: 'Good morning team! New leads coming in from the website.', timestamp: '09:15 AM', channelId: 'general' },
  ],
  'sales': [
    { id: '1', sender: 'James Harrison', senderId: '5', message: 'Team, we have 3 hot leads for Downtown properties.', timestamp: '10:00 AM', channelId: 'sales' },
    { id: '2', sender: 'Michael Johnson', senderId: '6', message: 'I can follow up on 2 of them today.', timestamp: '10:05 AM', channelId: 'sales' },
  ],
  'leads': [
    { id: '1', sender: 'System', senderId: 'system', message: 'Hot leads will be posted here automatically.', timestamp: '08:00 AM', channelId: 'leads' },
  ],
  'announcements': [
    { id: '1', sender: 'Jane Bou Jaoude', senderId: '1', message: 'Team meeting tomorrow at 10 AM in the main conference room.', timestamp: '08:30 AM', channelId: 'announcements' },
  ],
};

const RECENT_FILES = [
  { id: '1', name: 'Q4_Sales_Report.pdf', type: 'pdf', size: '2.4 MB', date: '2 hours ago' },
  { id: '2', name: 'Lead_Import_Jan.xlsx', type: 'excel', size: '1.1 MB', date: 'Yesterday' },
  { id: '3', name: 'Property_Presentation.pptx', type: 'pptx', size: '8.5 MB', date: '3 days ago' },
];

const CRMCommunicationPanel = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedChannel, setSelectedChannel] = useState("jbj-group");
  const [newMessage, setNewMessage] = useState("");
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS);
  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<TeamMember[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callTarget, setCallTarget] = useState<TeamMember | null>(null);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [lastReadTimestamps, setLastReadTimestamps] = useState<Record<string, string>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Current user (would come from auth context in production)
  const currentUser = { id: 'current', name: 'You' };

  // Get messages for selected channel
  const currentMessages = allMessages[selectedChannel] || [];
  const currentChannel = channels.find(c => c.id === selectedChannel);
  const channelMembers = ALL_TEAM_MEMBERS.filter(m => currentChannel?.members.includes(m.id));

  // Calculate unread counts per channel
  const getUnreadCount = useCallback((channelId: string) => {
    const messages = allMessages[channelId] || [];
    const lastRead = lastReadTimestamps[channelId];
    if (!lastRead) return messages.filter(m => !m.isMe).length;
    return messages.filter(m => !m.isMe && m.timestamp > lastRead).length;
  }, [allMessages, lastReadTimestamps]);

  // Mark channel as read when selected
  useEffect(() => {
    if (selectedChannel) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastReadTimestamps(prev => ({ ...prev, [selectedChannel]: now }));
      // Update channel unread count to 0
      setChannels(prev => prev.map(ch => 
        ch.id === selectedChannel ? { ...ch, unread: 0 } : ch
      ));
    }
  }, [selectedChannel]);

  // No placeholder notifications/unread counters in CRM chat
  // (Real unread tracking will be based on real messages & activity logs.)

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto-scroll only on new messages in current channel, not on channel switch
  const prevChannelRef = useRef(selectedChannel);
  const prevMessageCountRef = useRef(currentMessages.length);

  useEffect(() => {
    const channelChanged = prevChannelRef.current !== selectedChannel;
    const hasNewMessage = currentMessages.length > prevMessageCountRef.current;
    
    // Only auto-scroll if we got a new message (not on channel switch)
    if (hasNewMessage && !channelChanged) {
      scrollToBottom();
    }
    
    prevChannelRef.current = selectedChannel;
    prevMessageCountRef.current = currentMessages.length;
  }, [currentMessages.length, selectedChannel, scrollToBottom]);

  // Handle scroll to detect if user scrolled up
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  }, []);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim()) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: 'You',
      senderId: currentUser.id,
      message: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      channelId: selectedChannel
    };
    
    setAllMessages(prev => ({
      ...prev,
      [selectedChannel]: [...(prev[selectedChannel] || []), message]
    }));
    
    setNewMessage("");
    setShowMentions(false);
    
    // Focus back to input
    inputRef.current?.focus();
  }, [newMessage, selectedChannel, currentUser.id]);

  // Handle @ mentions - search ALL team members, not just channel members
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Check for @ mention
    const lastWord = value.split(' ').pop() || '';
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      const searchTerm = lastWord.slice(1).toLowerCase();
      // Search ALL_TEAM_MEMBERS for broader suggestion pool
      const suggestions = ALL_TEAM_MEMBERS.filter(m => 
        m.name.toLowerCase().includes(searchTerm) ||
        m.role.toLowerCase().includes(searchTerm)
      ).slice(0, 5);
      setMentionSuggestions(suggestions);
      setShowMentions(suggestions.length > 0);
    } else if (lastWord === '@') {
      // Show first 5 team members when just @ is typed
      setMentionSuggestions(ALL_TEAM_MEMBERS.slice(0, 5));
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (member: TeamMember) => {
    const words = newMessage.split(' ');
    words.pop(); // Remove partial @mention
    words.push(`@${member.name}`);
    setNewMessage(words.join(' ') + ' ');
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const startCall = (member: TeamMember, type: 'voice' | 'video') => {
    setCallTarget(member);
    setCallType(type);
    setShowCallModal(true);
  };

  const addMemberToChannel = (memberId: string) => {
    setChannels(prev => prev.map(ch => {
      if (ch.id === selectedChannel && !ch.members.includes(memberId)) {
        return { ...ch, members: [...ch.members, memberId] };
      }
      return ch;
    }));
    toast.success("Member added to channel");
  };

  const removeMemberFromChannel = (memberId: string) => {
    setChannels(prev => prev.map(ch => {
      if (ch.id === selectedChannel) {
        return { ...ch, members: ch.members.filter(id => id !== memberId) };
      }
      return ch;
    }));
    toast.success("Member removed from channel");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-amber-500';
      default: return 'bg-zinc-500';
    }
  };

  return (
    <Card className="border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_8px_30px_rgba(200,167,102,0.18)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-black font-bold text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
              <MessageSquare className="h-4 w-4 text-black" />
            </div>
            Team Communication
          </div>
          <div className="flex items-center gap-2">
            <Link to="/video-meeting">
              <Button variant="secondary" size="sm" className="h-7 text-xs">
                <Video className="h-3 w-3 mr-1" />
                New Meeting
              </Button>
            </Link>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] grid grid-cols-4 rounded-none border-b border-[#C9A84C]/30">
            <TabsTrigger value="chat" className="tab-trigger-champagne text-black text-xs data-[state=active]:text-black">
              <Hash className="h-3 w-3 mr-1" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="team" className="tab-trigger-champagne text-black text-xs data-[state=active]:text-black">
              <Users className="h-3 w-3 mr-1" />
              Team
            </TabsTrigger>
            <TabsTrigger value="meetings" className="tab-trigger-champagne text-black text-xs data-[state=active]:text-black">
              <Video className="h-3 w-3 mr-1" />
              Meetings
            </TabsTrigger>
            <TabsTrigger value="files" className="tab-trigger-champagne text-black text-xs data-[state=active]:text-black">
              <FileText className="h-3 w-3 mr-1" />
              Files
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="m-0">
            <div className="flex h-[280px]">
              {/* Channels Sidebar */}
              <div className="w-1/3 border-r border-zinc-200 p-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-2 px-1">Channels</p>
                <div className="space-y-1">
                {channels.map(channel => {
                    const unreadCount = getUnreadCount(channel.id);
                    return (
                      <button
                        key={channel.id}
                        onClick={() => setSelectedChannel(channel.id)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs hover:bg-[#C9A84C]/10 transition-colors ${
                          selectedChannel === channel.id ? 'bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border border-[#C9A84C]/40' : 'text-zinc-600'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Hash className="h-3 w-3" />
                          <span className={unreadCount > 0 ? 'font-semibold text-zinc-900' : ''}>
                            {channel.name}
                          </span>
                        </span>
                        <div className="flex items-center gap-1">
                          {unreadCount > 0 && (
                            <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-gold text-black text-[10px] font-bold px-1">
                              {unreadCount}
                            </span>
                          )}
                          <span className="text-[9px] text-zinc-400">({channel.members.length})</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 flex flex-col relative">
                {/* Channel Header with member management */}
                <div className="px-3 py-2 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
                  <div className="flex items-center gap-2">
                    <Hash className="h-3 w-3 text-zinc-500" />
                    <span className="text-xs font-medium text-zinc-800">{currentChannel?.name}</span>
                    <Badge variant="secondary" className="text-[9px] bg-zinc-200 text-zinc-600">
                      {channelMembers.length} members
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-zinc-500 hover:text-gold"
                      onClick={() => setShowMemberModal(true)}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <ScrollArea 
                  className="flex-1 p-2" 
                  ref={scrollAreaRef}
                  onScrollCapture={handleScroll}
                >
                  <div className="space-y-3">
                    {currentMessages.map(msg => (
                      <div key={msg.id} className={`flex gap-2 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-zinc-200 text-zinc-700">
                            {msg.sender[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[70%] ${msg.isMe ? 'text-right' : ''}`}>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-medium text-zinc-800">{msg.sender}</span>
                            <span className="text-[9px] text-zinc-500">{msg.timestamp}</span>
                          </div>
                          <p className={`text-xs p-2 rounded-lg ${
                            msg.isMe ? 'bg-gold/20 text-zinc-800' : 'bg-zinc-100 text-zinc-800'
                          }`}>
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Scroll to bottom button */}
                {showScrollButton && (
                  <Button
                    size="sm"
                    className="absolute bottom-14 left-1/2 -translate-x-1/2 h-7 text-xs bg-gold text-black hover:bg-gold/90 shadow-lg"
                    onClick={scrollToBottom}
                  >
                    <ChevronDown className="h-3 w-3 mr-1" />
                    New Messages
                  </Button>
                )}
                
                {/* Mention suggestions */}
                {showMentions && (
                  <div className="absolute bottom-14 left-2 right-2 bg-white border border-zinc-200 rounded-lg shadow-lg z-10">
                    {mentionSuggestions.map(member => (
                      <button
                        key={member.id}
                        onClick={() => insertMention(member)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-100 text-left text-xs"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="text-[8px] bg-gold/20 text-gold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-zinc-800">{member.name}</span>
                        <span className="text-zinc-500 ml-auto">{member.role}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Message Input */}
                <div className="p-2 border-t border-zinc-200">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          toast.success(`File "${file.name}" selected (${(file.size / 1024).toFixed(1)} KB)`);
                        }
                        e.target.value = "";
                      }}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-800" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message... Use @ to mention"
                      className="h-8 text-xs bg-white border-zinc-200 text-zinc-800"
                    />
                    <Button 
                      size="icon" 
                      className="h-8 w-8 bg-gold text-black hover:bg-gold/90"
                      onClick={sendMessage}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Team Tab - All members (grouped by department) */}
          <TabsContent value="team" className="m-0 p-3">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-zinc-500">All team members ({ALL_TEAM_MEMBERS.length})</p>
              <Button size="sm" variant="secondary" className="h-7 text-xs">
                <UserPlus className="h-3 w-3 mr-1" />
                Add Member
              </Button>
            </div>

            <ScrollArea className="h-[220px]">
              <div className="space-y-4">
                {Object.entries(teamByDepartment).map(([department, members]) => {
                  const deptMembers = (members as ConfigTeamMember[]).map(convertTeamMember);
                  if (deptMembers.length === 0) return null;

                  return (
                    <div key={department} className="space-y-2">
                      <div className="sticky top-0 z-10 bg-white">
                        <div className="px-2 py-1">
                          <Badge variant="secondary" className="text-[10px] bg-gold/10 text-gold border-gold/30">
                            {department} • {deptMembers.length}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {deptMembers.map((member) => (
                          <HoverCard key={member.id} openDelay={200}>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                              <HoverCardTrigger asChild>
                                <div className="flex items-center gap-3 cursor-default">
                                  <div className="relative">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={member.avatar} alt={member.name} />
                                      <AvatarFallback className="bg-gold/20 text-gold text-xs">
                                        {member.name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-zinc-800">{member.name}</p>
                                    <p className="text-[10px] text-zinc-500">{member.role}</p>
                                  </div>
                                </div>
                              </HoverCardTrigger>

                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="secondary" className="h-8 px-3" onClick={() => startCall(member, 'voice')}>
                                  <Phone className="h-3.5 w-3.5 mr-1" />
                                  Call
                                </Button>
                                <Button size="sm" variant="secondary" className="h-8 px-3" onClick={() => startCall(member, 'video')}>
                                  <Video className="h-3.5 w-3.5 mr-1" />
                                  Video
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 px-3"
                                  onClick={() => {
                                    setSelectedChannel('general');
                                    setActiveTab('chat');
                                    toast.info(`Opening chat with ${member.name}`);
                                  }}
                                >
                                  <AtSign className="h-3.5 w-3.5 mr-1" />
                                  Message
                                </Button>
                              </div>
                            </div>

                            <HoverCardContent side="right" className="w-80">
                              <div className="space-y-2">
                                <p className="text-sm font-semibold text-zinc-900">{member.name}</p>
                                <p className="text-xs text-zinc-600">{member.role}</p>

                                <div className="pt-2 border-t border-zinc-200 space-y-1 text-xs text-zinc-700">
                                  <div className="flex justify-between gap-3">
                                    <span className="text-zinc-500">Reports to</span>
                                    <span className="text-right">{member.reportsTo || '—'}</span>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <span className="text-zinc-500">Nationality</span>
                                    <span className="text-right">{member.nationality || '—'}</span>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <span className="text-zinc-500">Languages</span>
                                    <span className="text-right">{member.languages?.join(', ') || '—'}</span>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <span className="text-zinc-500">Join date</span>
                                    <span className="text-right">{member.joinDate || '—'}</span>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <span className="text-zinc-500">Email</span>
                                    <span className="text-right">{member.email || '—'}</span>
                                  </div>
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings" className="m-0 p-3">
            <div className="space-y-3">
              <Button 
                className="w-full bg-gold text-black hover:bg-gold/90 font-semibold"
                onClick={() => window.open('/video-meeting', '_blank')}
              >
                <Video className="h-4 w-4 mr-2" />
                Start Instant Meeting
              </Button>
              
              <div className="text-center py-6 text-zinc-400">
                <Video className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium text-zinc-600">No scheduled meetings</p>
                <p className="text-xs text-zinc-500">Start a meeting or schedule one for later</p>
              </div>
              
              <div className="border-t border-zinc-200 pt-3">
                <p className="text-xs text-zinc-500 mb-2">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/video-meeting">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8 border-zinc-200 text-zinc-700">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open Meeting Room
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs h-8 border-zinc-200 text-zinc-700"
                    onClick={() => toast.info("Schedule meeting feature coming soon")}
                  >
                    Schedule for Later
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="m-0 p-3">
            <ScrollArea className="h-[240px]">
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-2">Recent Files</p>
                {RECENT_FILES.map(file => (
                  <div 
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer"
                    onClick={() => toast.info(`Opening ${file.name}...`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white border border-zinc-200">
                        <FileText className="h-4 w-4 text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-800">{file.name}</p>
                        <p className="text-[10px] text-zinc-500">{file.size} • {file.date}</p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-zinc-400" />
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-3 border-dashed border-zinc-300 text-zinc-600">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Upload New File
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Member Management Modal */}
      <Dialog open={showMemberModal} onOpenChange={setShowMemberModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              #{currentChannel?.name} Members
            </DialogTitle>
            <DialogDescription>
              Manage channel members. Add or remove team members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current members */}
            <div>
              <p className="text-xs text-zinc-500 mb-2">Current Members ({channelMembers.length})</p>
              <ScrollArea className="h-40">
                <div className="space-y-2">
                  {channelMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-50">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-gold/20 text-gold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-zinc-800">{member.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:bg-red-500/10"
                        onClick={() => removeMemberFromChannel(member.id)}
                      >
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            {/* Add members */}
            <div>
              <p className="text-xs text-zinc-500 mb-2">Add Members</p>
              <div className="space-y-2">
                {ALL_TEAM_MEMBERS.filter(m => !currentChannel?.members.includes(m.id)).map(member => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-zinc-200 text-zinc-600">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-zinc-800">{member.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-green-500 hover:bg-green-500/10"
                      onClick={() => addMemberToChannel(member.id)}
                    >
                      <UserPlus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Call Modal */}
      <Dialog open={showCallModal} onOpenChange={setShowCallModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {callType === 'video' ? <Video className="h-5 w-5 text-blue-500" /> : <Phone className="h-5 w-5 text-green-500" />}
              {callType === 'video' ? 'Video Call' : 'Voice Call'}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <Avatar className="h-16 w-16 mx-auto mb-4">
              <AvatarFallback className="text-xl bg-gold/20 text-gold">
                {callTarget?.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <p className="text-lg font-semibold text-zinc-800">{callTarget?.name}</p>
            <p className="text-sm text-zinc-500">{callTarget?.role}</p>
            <p className="text-xs text-zinc-400 mt-4 animate-pulse">
              {callType === 'video' ? 'Starting video call...' : 'Calling...'}
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full"
              onClick={() => {
                setShowCallModal(false);
                toast.info("Call ended");
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CRMCommunicationPanel;
