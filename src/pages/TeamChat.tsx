import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Send, Plus, Hash, Smile, Paperclip, Settings,
  Users, Search, Bell, Phone, Video, MoreVertical, MessageSquare,
  ArrowLeft, Menu, Building2, Lock, BellOff, Archive, Copy,
  X, Check, Eye, ChevronDown, ChevronRight, Sparkles, Star,
  Mail, FileText, Pin, Calendar, BookOpen
} from "lucide-react";
import { DocumentAttachmentPicker, AttachmentChip, ChatAttachmentRenderer, type DocumentAttachment } from "@/components/shared/DocumentAttachmentPicker";
import { CrossChannelToggle } from "@/components/shared/CrossChannelToggle";
import { useCrossChannelSend } from "@/hooks/useCrossChannelSend";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { allTeamMembers, TeamMember } from "@/config/team-members";
import QuickCalendarWidget from "@/components/shared/QuickCalendarWidget";
import QuickNoteWidget from "@/components/shared/QuickNoteWidget";

interface Message {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
  channelId: string;
  isDM?: boolean;
  ownerCopy?: boolean;
}

interface Channel {
  id: string;
  name: string;
  type: "channel" | "dm";
  unread: number;
  description?: string;
  isPrivate?: boolean;
  dmUserId?: string;
  muted?: boolean;
  avatar?: string;
  role?: string;
}

interface ChatSettings {
  ownerCopyEnabled: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  autoArchiveDays: number;
}

// Filter: only real employees + Amanda Clarke (executive assistant)
const getTeamChatMembers = (): TeamMember[] => {
  return allTeamMembers.filter(m => 
    m.isAI === false || m.id === 'amanda-clarke'
  );
};

// Group members by department
const groupByDepartment = (members: TeamMember[]): Record<string, TeamMember[]> => {
  const groups: Record<string, TeamMember[]> = {};
  members.forEach(m => {
    const dept = m.department || 'Other';
    if (!groups[dept]) groups[dept] = [];
    groups[dept].push(m);
  });
  // Sort departments alphabetically, but put Executive first
  const sorted: Record<string, TeamMember[]> = {};
  const keys = Object.keys(groups).sort((a, b) => {
    if (a === 'Executive') return -1;
    if (b === 'Executive') return 1;
    return a.localeCompare(b);
  });
  keys.forEach(k => { sorted[k] = groups[k]; });
  return sorted;
};

// Simulate random statuses for members
const generateStatuses = (members: TeamMember[]): Record<string, 'online' | 'away' | 'offline'> => {
  const statuses: Record<string, 'online' | 'away' | 'offline'> = {};
  members.forEach(m => {
    // Amanda is always online
    if (m.id === 'amanda-clarke') {
      statuses[m.id] = 'online';
      return;
    }
    const rand = Math.random();
    statuses[m.id] = rand < 0.5 ? 'online' : rand < 0.75 ? 'away' : 'offline';
  });
  return statuses;
};

const TeamChat = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { sendSecondaryEmail } = useCrossChannelSend();
  const chatMembers = useMemo(() => getTeamChatMembers(), []);
  const departmentGroups = useMemo(() => groupByDepartment(chatMembers), [chatMembers]);
  const [memberStatuses] = useState(() => generateStatuses(chatMembers));
  const [openDepts, setOpenDepts] = useState<Set<string>>(() => new Set(Object.keys(departmentGroups)));

  const [channels, setChannels] = useState<Channel[]>([
    { id: "general", name: "general", type: "channel", unread: 0, description: "Company-wide announcements and updates" },
    { id: "announcements", name: "announcements", type: "channel", unread: 2, description: "Official announcements from leadership", isPrivate: false },
    { id: "sales", name: "sales", type: "channel", unread: 5, description: "Sales team discussions and deal updates" },
    { id: "marketing", name: "marketing", type: "channel", unread: 1, description: "Marketing campaigns and strategies" },
    { id: "operations", name: "operations", type: "channel", unread: 0, description: "Day-to-day operations coordination" },
    { id: "legal", name: "legal", type: "channel", unread: 0, description: "Legal team discussions" },
    { id: "hr", name: "hr", type: "channel", unread: 0, description: "HR announcements and policies" },
  ]);
  const [activeChannel, setActiveChannel] = useState("general");
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", userId: "system", userName: "System", content: "Welcome to the JBJ Workspace! This is the #general channel.", timestamp: new Date().toISOString(), channelId: "general" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showMembers, setShowMembers] = useState(!isMobile);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [currentUser] = useState({ id: "me", name: "Jane Bou Jaoude", role: "Founder & CEO", department: "Leadership", status: "online" as const });
  const [settings, setSettings] = useState<ChatSettings>({
    ownerCopyEnabled: true,
    notificationsEnabled: true,
    soundEnabled: true,
    autoArchiveDays: 30,
  });
  const [isInCall, setIsInCall] = useState(false);
  const [isInVideo, setIsInVideo] = useState(false);
  const [alsoSendByEmail, setAlsoSendByEmail] = useState(false);
  const [showAttachPicker, setShowAttachPicker] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<DocumentAttachment[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());
  const [showProductivityPanel, setShowProductivityPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const togglePin = (msgId: string) => {
    setPinnedMessages(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) { next.delete(msgId); toast.success("Message unpinned"); }
      else { next.add(msgId); toast.success("Message pinned"); }
      return next;
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Prefill from navigation state (ExclusiveDocuments, DocumentStudio) ──
  useEffect(() => {
    const state = location.state as any;
    if (state?.prefillMessage || state?.prefillAttachment) {
      if (state.prefillMessage) setNewMessage(state.prefillMessage);
      if (state.prefillAttachment) setPendingAttachments([state.prefillAttachment]);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const activeChannelData = channels.find(c => c.id === activeChannel);
    const message: Message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      content: newMessage,
      timestamp: new Date().toISOString(),
      channelId: activeChannel,
      isDM: activeChannelData?.type === "dm",
    };
    // Include attachments in the message if any
    if (pendingAttachments.length > 0) {
      (message as any).attachments = pendingAttachments;
    }
    setMessages(prev => [...prev, message]);
    setPendingAttachments([]);
    if (settings.ownerCopyEnabled && activeChannelData?.type === "dm") {
      console.log("[Owner Copy]", { ...message, ownerCopy: true });
    }

    // Cross-channel: also send by email if toggle is ON and this is a DM
    if (alsoSendByEmail && activeChannelData?.type === "dm" && activeChannelData.dmUserId) {
      const recipientMember = chatMembers.find(m => m.id === activeChannelData.dmUserId);
      if (recipientMember) {
        const recipientEmail = `${recipientMember.id}@jbj.ae`;
        sendSecondaryEmail({
          primaryChannel: "chat",
          recipientEmail,
          subject: `Chat message from ${currentUser.name}`,
          body: newMessage,
          alsoSendSecondary: true,
          senderName: currentUser.name,
          senderTitle: currentUser.role,
          recipientName: recipientMember.name,
          attachments: pendingAttachments.length > 0
            ? pendingAttachments.map(a => ({ filename: a.name, content: a.content, type: a.mimeType }))
            : undefined,
        });
      }
    }

    setNewMessage("");
  };

  const addChannel = () => {
    const name = prompt("Enter channel name:");
    if (name) {
      const newChannel: Channel = {
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name: name.toLowerCase().replace(/\s+/g, "-"),
        type: "channel",
        unread: 0,
      };
      setChannels(prev => [...prev, newChannel]);
      toast.success(`#${newChannel.name} created!`);
    }
  };

  const startDM = (member: TeamMember | { id: string; name: string; role: string; avatar?: string }) => {
    const dmId = `dm-${member.id}`;
    const existing = channels.find(c => c.id === dmId);
    if (!existing) {
      setChannels(prev => [...prev, {
        id: dmId,
        name: member.name,
        type: "dm",
        unread: 0,
        dmUserId: member.id,
        avatar: 'avatar' in member ? member.avatar : undefined,
        role: member.role,
      }]);
    }
    setActiveChannel(dmId);
    setShowNewDM(false);
    if (isMobile) setShowSidebar(false);
    toast.success(`DM with ${member.name} opened`);
  };

  const handleCall = () => {
    setIsInCall(true);
    toast.success("Voice call started...");
    setTimeout(() => { setIsInCall(false); toast.info("Call ended"); }, 3000);
  };

  const handleVideo = () => {
    setIsInVideo(true);
    toast.success("Video call started...");
    setTimeout(() => { setIsInVideo(false); toast.info("Video call ended"); }, 3000);
  };

  const channelMessages = messages.filter(m => m.channelId === activeChannel);
  const activeChannelData = channels.find(c => c.id === activeChannel);
  const dmChannels = channels.filter(c => c.type === "dm");

  const statusColors: Record<string, string> = {
    online: "jj-surface-emerald",
    away: "bg-amber-500",
    offline: "bg-[#E5D9C4]",
  };

  const handleSelectChannel = (id: string) => {
    setActiveChannel(id);
    setChannels(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
    if (isMobile) setShowSidebar(false);
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2);

  const toggleDept = (dept: string) => {
    setOpenDepts(prev => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept); else next.add(dept);
      return next;
    });
  };

  // Filter members by search
  const filteredMembers = chatMembers.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineCount = Object.values(memberStatuses).filter(s => s === 'online').length;
  const totalCount = chatMembers.length;

  return (
    <div className="flex h-[calc(100vh-11rem)] min-h-[560px] bg-[#FDFBF7] rounded-xl border-2 border-[#B89555]/20 overflow-hidden shadow-sm min-w-0 max-w-full" data-owner-batch-fix="team-chat">

      {/* ─── Channel Sidebar ─── */}
      <div className={cn(
        "w-full md:w-[300px] xl:w-[320px] flex-shrink-0 flex flex-col bg-gradient-to-b from-[#FDFBF7] to-[#F7F2EA] border-r border-[#B89555]/15",
        showSidebar ? "flex" : "hidden md:flex"
      )}>
        {/* Workspace Header */}
        <div className="p-4 border-b border-[#B89555]/15">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#B89555] to-[#A68444] flex items-center justify-center shadow-sm">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-[#1A1A1A]">JBJ Workspace</h1>
                <p className="text-[10px] text-[#1A1A1A]/50">{onlineCount} online · {totalCount} members</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#B89555]/10" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 text-[#1A1A1A]/50" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/30" />
            <Input
              placeholder="Search members & channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#FDFBF7] border-[#B89555]/20 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 h-9 text-sm focus-visible:ring-[#B89555]/30"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {/* Channels */}
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">Channels</span>
              <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-[#B89555]/10" onClick={addChannel}>
                <Plus className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
              </Button>
            </div>
            {channels.filter(c => c.type === "channel").map((channel) => (
              <button
                key={channel.id}
                className={cn(
                      "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 mb-0.5 min-w-0",
                  activeChannel === channel.id
                    ? "bg-gradient-to-r from-[#B89555]/15 to-[#B89555]/5 text-[#1A1A1A] font-medium border border-[#B89555]/25"
                    : "text-[#1A1A1A]/60 hover:bg-[#B89555]/5 hover:text-[#1A1A1A] border border-transparent"
                )}
                onClick={() => handleSelectChannel(channel.id)}
              >
                <span className="flex min-w-0 items-center gap-2 truncate">
                  {channel.isPrivate ? (
                    <Lock className={cn("w-4 h-4", activeChannel === channel.id ? "text-[#B89555]" : "text-[#1A1A1A]/30")} />
                  ) : (
                    <Hash className={cn("w-4 h-4", activeChannel === channel.id ? "text-[#B89555]" : "text-[#1A1A1A]/30")} />
                  )}
                  <span className="truncate">{channel.name}</span>
                </span>
                {channel.unread > 0 && (
                  <Badge className="bg-gradient-to-r from-[#B89555] to-[#A68444] text-white text-[10px] px-1.5 py-0 h-5 border-0 shadow-sm">
                    {channel.unread}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Amanda Clarke — always pinned at top of DMs */}
          <div className="px-3 py-2 border-t border-[#B89555]/10 mt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">Direct Messages</span>
              <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-[#B89555]/10" onClick={() => setShowNewDM(true)}>
                <Plus className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
              </Button>
            </div>

            {/* Amanda pinned */}
            {(() => {
              const amanda = chatMembers.find(m => m.id === 'amanda-clarke');
              if (!amanda) return null;
              const dmId = `dm-${amanda.id}`;
              return (
                <button
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 mb-1",
                    activeChannel === dmId
                      ? "bg-gradient-to-r from-[#B89555]/15 to-[#B89555]/5 text-[#1A1A1A] font-medium border border-[#B89555]/25"
                      : "text-[#1A1A1A]/60 hover:bg-[#B89555]/5 hover:text-[#1A1A1A] border border-transparent"
                  )}
                  onClick={() => startDM(amanda)}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-7 w-7 border border-[#B89555]/20">
                      <AvatarImage src={amanda.avatar} alt={amanda.name} />
                      <AvatarFallback className="text-[9px] bg-[#B89555]/10 text-[#B89555] font-semibold">AC</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#FDFBF7] jj-surface-emerald" />
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="truncate flex items-center gap-1">
                      Amanda Clarke
                      <Sparkles className="w-3 h-3 text-[#B89555]" />
                    </span>
                    <p className="text-[10px] text-[#1A1A1A]/40 truncate">Executive Assistant · AI</p>
                  </div>
                  <Star className="w-3 h-3 text-[#B89555] ml-auto shrink-0" fill="currentColor" />
                </button>
              );
            })()}

            {/* Existing DM channels (excluding Amanda if already shown) */}
            {dmChannels.filter(d => d.dmUserId !== 'amanda-clarke').map((dm) => (
              <button
                key={dm.id}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 mb-0.5",
                  activeChannel === dm.id
                    ? "bg-gradient-to-r from-[#B89555]/15 to-[#B89555]/5 text-[#1A1A1A] font-medium border border-[#B89555]/25"
                    : "text-[#1A1A1A]/60 hover:bg-[#B89555]/5 hover:text-[#1A1A1A] border border-transparent"
                )}
                onClick={() => handleSelectChannel(dm.id)}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-6 w-6 border border-[#B89555]/15">
                    {dm.avatar && <AvatarImage src={dm.avatar} />}
                    <AvatarFallback className="text-[9px] bg-[#B89555]/10 text-[#B89555] font-semibold">
                      {getInitials(dm.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="truncate">{dm.name}</span>
                {dm.unread > 0 && (
                  <Badge className="bg-gradient-to-r from-[#B89555] to-[#A68444] text-white text-[10px] px-1.5 py-0 h-5 border-0 ml-auto">
                    {dm.unread}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* User Footer */}
        <div className="p-3 border-t border-[#B89555]/15 bg-[#FDFBF7]/50">
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <Avatar className="h-8 w-8 border border-[#B89555]/20">
                <AvatarFallback className="bg-gradient-to-br from-[#B89555] to-[#A68444] text-white text-xs font-semibold">JB</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white jj-surface-emerald" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1A1A1A] truncate">{currentUser.name}</p>
              <p className="text-[10px] text-[#1A1A1A]/40">{currentUser.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Chat Area ─── */}
      <div className={cn(
        "flex-1 min-w-0 flex flex-col bg-gradient-to-br from-[#FDFBF7] via-white to-[#F7F2EA]/30",
        !showSidebar ? "flex" : "hidden md:flex"
      )}>
        {/* Channel Header */}
        <div className="h-14 border-b border-[#B89555]/15 px-3 sm:px-5 flex items-center justify-between bg-[#FDFBF7]/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setShowSidebar(true)} className="h-8 w-8 shrink-0 hover:bg-[#B89555]/10">
                <ArrowLeft className="h-4 w-4 text-[#1A1A1A]" />
              </Button>
            )}
            {activeChannelData?.type === "dm" ? (
              <MessageSquare className="w-5 h-5 text-[#B89555] shrink-0" />
            ) : (
              <Hash className="w-5 h-5 text-[#B89555] shrink-0" />
            )}
            <div className="min-w-0">
              <h2 className="font-semibold text-[#1A1A1A] text-sm">{activeChannelData?.name}</h2>
              {activeChannelData?.description && (
                <p className="text-[11px] text-[#1A1A1A]/40 truncate hidden sm:block">{activeChannelData.description}</p>
              )}
              {activeChannelData?.type === "dm" && settings.ownerCopyEnabled && (
                <p className="text-[10px] text-[#B89555] flex items-center gap-1 hidden sm:flex">
                  <Eye className="w-3 h-3" /> Owner copy enabled
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className={cn("h-8 w-8 hidden sm:flex", isInCall ? "jj-surface-emerald-soft" : "hover:bg-[#B89555]/10")} onClick={handleCall}>
              <Phone className={cn("w-4 h-4", isInCall ? "text-[color:var(--emerald-1)] animate-pulse" : "text-[#1A1A1A]/50")} />
            </Button>
            <Button variant="ghost" size="icon" className={cn("h-8 w-8 hidden sm:flex", isInVideo ? "bg-blue-500/20" : "hover:bg-[#B89555]/10")} onClick={handleVideo}>
              <Video className={cn("w-4 h-4", isInVideo ? "text-blue-600 animate-pulse" : "text-[#1A1A1A]/50")} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#B89555]/10" onClick={() => setShowMembers(!showMembers)}>
              <Users className="w-4 h-4 text-[#1A1A1A]/50" />
            </Button>
            <Button variant="ghost" size="icon" className={cn("h-8 w-8 hidden sm:flex", showProductivityPanel ? "bg-[#B89555]/15" : "hover:bg-[#B89555]/10")} onClick={() => setShowProductivityPanel(!showProductivityPanel)}>
              <BookOpen className="w-4 h-4 text-[#1A1A1A]/50" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#B89555]/10 hidden sm:flex" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 text-[#1A1A1A]/50" />
            </Button>
          </div>
        </div>

        {/* Call banner */}
        {(isInCall || isInVideo) && (
          <div className={cn(
            "px-4 py-2 flex items-center justify-between text-sm font-medium",
            isInCall ? "jj-surface-emerald-soft text-[color:var(--emerald-1)] border-b border-[color:var(--emerald-1)]/30/20" : "bg-blue-500/10 text-blue-700 border-b border-blue-500/20"
          )}>
            <span className="flex items-center gap-2">
              {isInCall ? <Phone className="w-4 h-4 animate-pulse" /> : <Video className="w-4 h-4 animate-pulse" />}
              {isInCall ? "Voice call in progress..." : "Video call in progress..."}
            </span>
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 h-7"
              onClick={() => { setIsInCall(false); setIsInVideo(false); toast.info("Call ended"); }}>
              End Call
            </Button>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-3 sm:px-5 py-4">
          <div className="space-y-1">
            {/* Pinned Messages Banner */}
            {pinnedMessages.size > 0 && (
              <div className="bg-[#B89555]/5 border border-[#B89555]/15 rounded-lg px-3 py-2 mb-3">
                <p className="text-[10px] font-semibold text-[#B89555] uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Pin className="w-3 h-3" /> Pinned ({pinnedMessages.size})
                </p>
                {channelMessages.filter(m => pinnedMessages.has(m.id)).map(m => (
                  <p key={m.id} className="text-xs text-[#1A1A1A]/60 truncate">
                    <span className="font-medium text-[#1A1A1A]/80">{m.userName}:</span> {m.content}
                  </p>
                ))}
              </div>
            )}

            {channelMessages.map((message) => {
              const isOwn = message.userId === currentUser.id;
              const memberData = chatMembers.find(m => m.id === message.userId);
              const isPinned = pinnedMessages.has(message.id);
              return (
                <div key={message.id} className={cn(
                  "group flex gap-3 hover:bg-[#B89555]/[0.03] rounded-lg p-2.5 -mx-2 transition-colors",
                  isPinned && "border-l-2 border-l-[#B89555]/40"
                )}>
                  <Avatar className="h-9 w-9 mt-0.5 shrink-0 border border-[#B89555]/15">
                    {memberData?.avatar && <AvatarImage src={memberData.avatar} />}
                    <AvatarFallback className={cn(
                      "text-xs font-semibold",
                      isOwn
                        ? "bg-gradient-to-br from-[#B89555] to-[#A68444] text-white"
                        : "jj-emerald-metallic allow-white text-white"
                    )}>
                      {getInitials(message.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
                      <span className="font-semibold text-sm text-[#1A1A1A]">{message.userName}</span>
                      <span className="text-[11px] text-[#1A1A1A]/35">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isPinned && <Pin className="w-2.5 h-2.5 text-[#B89555]" />}
                      {message.ownerCopy && (
                        <Badge className="bg-[#B89555]/10 text-[#B89555] text-[9px] border-[#B89555]/20 h-4">
                          <Copy className="w-2.5 h-2.5 mr-0.5" /> Owner Copy
                        </Badge>
                      )}
                    </div>
                    <p className="text-[#1A1A1A]/70 text-sm leading-relaxed mt-0.5">{message.content}</p>
                    {/* Render attachments */}
                    {(message as any).attachments?.map((att: DocumentAttachment) => (
                      <ChatAttachmentRenderer key={att.id} attachment={att} />
                    ))}
                    {/* Hover action bar */}
                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap max-w-full">
                      <button
                        onClick={() => togglePin(message.id)}
                        aria-label={isPinned ? "Unpin message" : "Pin message"}
                        title={isPinned ? "Unpin message" : "Pin message"}
                        className="inline-flex h-8 w-8 min-w-8 items-center justify-center rounded-lg border border-[#B89555]/25 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6]/40"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => { await navigator.clipboard.writeText(message.content); toast.success("Copied"); }}
                        aria-label="Copy message"
                        title="Copy message"
                        className="inline-flex h-8 w-8 min-w-8 items-center justify-center rounded-lg border border-[#B89555]/25 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6]/40"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <QuickCalendarWidget compact source="chat" prefillTitle={message.content.substring(0, 60)} />
                      <QuickNoteWidget compact source="chat" prefillTitle={`Chat note`} prefillContent={`${message.userName}: ${message.content}`} />
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-3 sm:p-4 border-t border-[#B89555]/15 bg-[#FDFBF7]/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 bg-[#FDFBF7] border border-[#B89555]/20 rounded-xl px-3 py-1.5 focus-within:border-[#B89555]/40 focus-within:ring-2 focus-within:ring-[#B89555]/10 transition-all">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-[#B89555]/10" onClick={() => setShowAttachPicker(true)}>
              <Plus className="w-4 h-4 text-[#1A1A1A]/40" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={activeChannelData?.type === "dm" ? `Message ${activeChannelData.name}...` : `Message #${activeChannelData?.name}...`}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-[#1A1A1A] placeholder:text-[#1A1A1A]/35 text-sm h-9"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-[#B89555]/10 hidden sm:flex">
              <Smile className="w-4 h-4 text-[#1A1A1A]/40" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-[#B89555]/10 hidden sm:flex" onClick={() => setShowAttachPicker(true)}>
              <Paperclip className="w-4 h-4 text-[#1A1A1A]/40" />
            </Button>
            <Button
              size="icon"
              className="h-8 w-8 shrink-0 bg-gradient-to-r from-[#B89555] to-[#A68444] hover:from-[#A68444] hover:to-[#957539] text-white shadow-sm"
              onClick={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {/* Pending attachment chips */}
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5 px-1">
              {pendingAttachments.map(att => (
                <AttachmentChip key={att.id} attachment={att} onRemove={() => setPendingAttachments(prev => prev.filter(a => a.id !== att.id))} />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-1.5 px-1">
            <p className="text-[10px] text-[#1A1A1A]/25">Press Enter to send · Secured by JBJ GLOBAL REAL ESTATE</p>
            {/* Cross-channel toggle — shared component */}
            <CrossChannelToggle
              recipientEmail=""
              channel="chat-first"
              checked={alsoSendByEmail}
              onToggle={setAlsoSendByEmail}
              compact
            />
          </div>
        </div>

        {/* Attachment Picker Modal */}
        {showAttachPicker && (
          <DocumentAttachmentPicker
            context="chat"
            onAttach={(att) => setPendingAttachments(prev => [...prev, att])}
            onClose={() => setShowAttachPicker(false)}
          />
        )}
      </div>

      {/* ─── Members Sidebar (real employees by department) ─── */}
      {showMembers && !isMobile && (
        <div className="hidden 2xl:flex w-72 flex-shrink-0 bg-gradient-to-b from-[#FDFBF7] to-[#F7F2EA] border-l border-[#B89555]/15 flex-col">
          <div className="p-4 border-b border-[#B89555]/15">
            <h3 className="text-xs font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">
              Team — {totalCount} members
            </h3>
            <p className="text-[10px] text-[color:var(--emerald-1)] mt-0.5">{onlineCount} online</p>
          </div>
          <ScrollArea className="flex-1 p-2">
            {Object.entries(departmentGroups).map(([dept, members]) => {
              const filteredDeptMembers = members.filter(m =>
                filteredMembers.some(fm => fm.id === m.id)
              );
              if (filteredDeptMembers.length === 0) return null;
              const isOpen = openDepts.has(dept);
              return (
                <div key={dept} className="mb-1">
                  <button
                    onClick={() => toggleDept(dept)}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold text-[#1A1A1A]/40 uppercase tracking-wider hover:text-[#1A1A1A]/60 transition-colors"
                  >
                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    {dept} ({filteredDeptMembers.length})
                  </button>
                  {isOpen && (
                    <div className="space-y-0.5 ml-1">
                      {filteredDeptMembers.map(member => {
                        const status = memberStatuses[member.id] || 'offline';
                        return (
                          <div
                            key={member.id}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#B89555]/5 transition-colors cursor-pointer",
                              status === 'offline' && "opacity-50"
                            )}
                            onClick={() => startDM(member)}
                          >
                            <div className="relative shrink-0">
                              <Avatar className="h-7 w-7 border border-[#B89555]/15">
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback className="bg-[#B89555]/10 text-[#B89555] text-[9px] font-semibold">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#FDFBF7]", statusColors[status])} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-[#1A1A1A] truncate flex items-center gap-1">
                                {member.name}
                                {member.id === 'amanda-clarke' && <Sparkles className="w-2.5 h-2.5 text-[#B89555]" />}
                              </p>
                              <p className="text-[9px] text-[#1A1A1A]/40 truncate">{member.role}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </ScrollArea>
        </div>
      )}

      {/* Productivity Panel */}
      {showProductivityPanel && !isMobile && (
        <div className="hidden 2xl:flex w-64 bg-gradient-to-b from-[#FDFBF7] to-[#F7F2EA] border-l border-[#B89555]/15 flex-col overflow-y-auto">
          <div className="p-4 border-b border-[#B89555]/15">
            <h3 className="text-xs font-semibold text-[#1A1A1A]/40 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#B89555]" /> Chat Productivity
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <QuickCalendarWidget source="chat" />
            <div className="h-px bg-[#B89555]/10" />
            <QuickNoteWidget source="chat" />
            <div className="h-px bg-[#B89555]/10" />
            <div>
              <p className="text-[10px] font-semibold text-[#1A1A1A]/40 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Pin className="w-3 h-3" /> Pinned Messages
              </p>
              {pinnedMessages.size > 0 ? (
                <div className="space-y-1">
                  {channelMessages.filter(m => pinnedMessages.has(m.id)).map(m => (
                    <div key={m.id} className="text-xs text-[#1A1A1A]/60 bg-[#FDFBF7]/70 rounded-lg border border-[#B89555]/15 px-2.5 py-2">
                      <span className="font-medium text-[#1A1A1A]/80">{m.userName}</span>
                      <p className="truncate mt-0.5">{m.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-[#1A1A1A]/30 text-center py-2">No pinned messages</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-[#FDFBF7] border-2 border-[#B89555]/30">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#B89555]" />
              Chat Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#1A1A1A] font-medium">Owner Copy</Label>
                <p className="text-xs text-[#1A1A1A]/70">Receive copies of all broker DMs</p>
              </div>
              <Switch checked={settings.ownerCopyEnabled} onCheckedChange={(v) => setSettings(s => ({ ...s, ownerCopyEnabled: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#1A1A1A] font-medium">Notifications</Label>
                <p className="text-xs text-[#1A1A1A]/70">Push notifications for new messages</p>
              </div>
              <Switch checked={settings.notificationsEnabled} onCheckedChange={(v) => setSettings(s => ({ ...s, notificationsEnabled: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#1A1A1A] font-medium">Sound Alerts</Label>
                <p className="text-xs text-[#1A1A1A]/70">Play sound for new messages</p>
              </div>
              <Switch checked={settings.soundEnabled} onCheckedChange={(v) => setSettings(s => ({ ...s, soundEnabled: v }))} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New DM Dialog — shows real employees by department */}
      <Dialog open={showNewDM} onOpenChange={setShowNewDM}>
        <DialogContent className="bg-[#FDFBF7] border-2 border-[#B89555]/30 max-h-[70vh]">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#B89555]" />
              New Direct Message
            </DialogTitle>
          </DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/30" />
            <Input
              placeholder="Search team members..."
              className="pl-9 bg-[#FDFBF7] border-[#B89555]/20 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40"
            />
          </div>
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-1 py-2">
              {chatMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => startDM(member)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#B89555]/5 border border-transparent hover:border-[#B89555]/20 transition-all"
                >
                  <Avatar className="h-9 w-9 border border-[#B89555]/20">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="bg-[#B89555]/10 text-[#B89555] font-semibold text-xs">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] truncate flex items-center gap-1">
                      {member.name}
                      {member.id === 'amanda-clarke' && <Sparkles className="w-3 h-3 text-[#B89555]" />}
                    </p>
                    <p className="text-xs text-[#1A1A1A]/70 truncate">{member.role} · {member.department}</p>
                  </div>
                  <div className={cn("ml-auto w-2.5 h-2.5 rounded-full shrink-0", statusColors[memberStatuses[member.id] || 'offline'])} />
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamChat;
