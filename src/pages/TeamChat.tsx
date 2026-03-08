import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Send, Plus, Hash, Smile, Paperclip, Settings,
  Users, Search, Bell, Phone, Video, MoreVertical, MessageSquare,
  ArrowLeft, Menu, Building2, Lock, BellOff, Archive, Copy,
  X, Check, Eye
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  id: string;
  userId: string;
  userName: string;
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
}

interface User {
  id: string;
  name: string;
  role: string;
  department: string;
  status: "online" | "away" | "offline";
}

interface ChatSettings {
  ownerCopyEnabled: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  autoArchiveDays: number;
}

const TeamChat = () => {
  const isMobile = useIsMobile();
  const [channels, setChannels] = useState<Channel[]>([
    { id: "general", name: "general", type: "channel", unread: 0, description: "Company-wide announcements and updates" },
    { id: "announcements", name: "announcements", type: "channel", unread: 2, description: "Official announcements from leadership", isPrivate: false },
    { id: "sales", name: "sales", type: "channel", unread: 5, description: "Sales team discussions and deal updates" },
    { id: "marketing", name: "marketing", type: "channel", unread: 1, description: "Marketing campaigns and strategies" },
    { id: "operations", name: "operations", type: "channel", unread: 0, description: "Day-to-day operations coordination" },
    { id: "random", name: "random", type: "channel", unread: 0, description: "Off-topic and fun conversations" },
  ]);
  const [activeChannel, setActiveChannel] = useState("general");
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", userId: "system", userName: "System", content: "Welcome to the JBJ Team Chat! This is the #general channel for company-wide updates.", timestamp: new Date().toISOString(), channelId: "general" },
    { id: "2", userId: "1", userName: "Ahmed Hassan", content: "Good morning everyone! The Q2 targets have been shared in the sales channel.", timestamp: new Date(Date.now() - 3600000).toISOString(), channelId: "general" },
    { id: "3", userId: "3", userName: "Mohammed Khan", content: "The new property listings for Dubai Marina are now live on the website.", timestamp: new Date(Date.now() - 1800000).toISOString(), channelId: "general" },
    // DM messages
    { id: "dm-1", userId: "1", userName: "Ahmed Hassan", content: "Hi Jane, I wanted to discuss the new commission structure.", timestamp: new Date(Date.now() - 900000).toISOString(), channelId: "dm-1", isDM: true },
    { id: "dm-2", userId: "me", userName: "Jane Bou Jaoude", content: "Sure Ahmed, let's review it together.", timestamp: new Date(Date.now() - 600000).toISOString(), channelId: "dm-1", isDM: true },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showMembers, setShowMembers] = useState(!isMobile);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [currentUser] = useState<User>({ id: "me", name: "Jane Bou Jaoude", role: "Founder & CEO", department: "Leadership", status: "online" });
  const [settings, setSettings] = useState<ChatSettings>({
    ownerCopyEnabled: true,
    notificationsEnabled: true,
    soundEnabled: true,
    autoArchiveDays: 30,
  });
  const [isInCall, setIsInCall] = useState(false);
  const [isInVideo, setIsInVideo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const users: User[] = [
    { id: "1", name: "Ahmed Hassan", role: "Senior Sales Agent", department: "Sales", status: "online" },
    { id: "2", name: "Sara Ali", role: "Marketing Manager", department: "Marketing", status: "away" },
    { id: "3", name: "Mohammed Khan", role: "Operations Lead", department: "Operations", status: "online" },
    { id: "4", name: "Fatima Omar", role: "Property Consultant", department: "Sales", status: "offline" },
    { id: "5", name: "Khalid Ibrahim", role: "Finance Director", department: "Finance", status: "online" },
    { id: "6", name: "Layla Mustafa", role: "HR Manager", department: "HR", status: "away" },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
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
    setMessages(prev => [...prev, message]);

    // Owner copy — if enabled and this is a broker DM, mirror to owner
    if (settings.ownerCopyEnabled && activeChannelData?.type === "dm") {
      const ownerCopy: Message = {
        ...message,
        id: `owner-${message.id}`,
        ownerCopy: true,
      };
      // In a real app this would go to a separate owner inbox channel
      console.log("[Owner Copy]", ownerCopy);
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

  const startDM = (user: User) => {
    const dmId = `dm-${user.id}`;
    const existing = channels.find(c => c.id === dmId);
    if (!existing) {
      setChannels(prev => [...prev, {
        id: dmId,
        name: user.name,
        type: "dm",
        unread: 0,
        dmUserId: user.id,
      }]);
    }
    setActiveChannel(dmId);
    setShowNewDM(false);
    if (isMobile) setShowSidebar(false);
    toast.success(`DM with ${user.name} opened`);
  };

  const handleCall = () => {
    setIsInCall(true);
    toast.success("Voice call started...");
    setTimeout(() => {
      setIsInCall(false);
      toast.info("Call ended");
    }, 3000);
  };

  const handleVideo = () => {
    setIsInVideo(true);
    toast.success("Video call started...");
    setTimeout(() => {
      setIsInVideo(false);
      toast.info("Video call ended");
    }, 3000);
  };

  const channelMessages = messages.filter(m => m.channelId === activeChannel);
  const activeChannelData = channels.find(c => c.id === activeChannel);
  const dmChannels = channels.filter(c => c.type === "dm");

  const statusColors: Record<string, string> = {
    online: "bg-green-500",
    away: "bg-amber-500",
    offline: "bg-zinc-300",
  };

  const handleSelectChannel = (id: string) => {
    setActiveChannel(id);
    setChannels(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
    if (isMobile) setShowSidebar(false);
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("");

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[600px] bg-white rounded-xl border-2 border-[#C9A84C]/20 overflow-hidden shadow-sm">

      {/* ─── Channel Sidebar ─── */}
      <div className={cn(
        "w-full md:w-72 flex flex-col bg-gradient-to-b from-[#FDFBF7] to-[#F5F0E6] border-r border-[#C9A84C]/15",
        showSidebar ? "flex" : "hidden md:flex"
      )}>
        {/* Workspace Header */}
        <div className="p-4 border-b border-[#C9A84C]/15">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#C9A84C] to-[#B8973F] flex items-center justify-center shadow-sm">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-black">JBJ Workspace</h1>
                <p className="text-[10px] text-black/50">Team Communication</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#C9A84C]/10" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 text-black/50" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-[#C9A84C]/20 text-black placeholder:text-black/40 h-9 text-sm focus-visible:ring-[#C9A84C]/30"
            />
          </div>
        </div>

        {/* Channels List */}
        <ScrollArea className="flex-1">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-black/40 uppercase tracking-wider">Channels</span>
              <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-[#C9A84C]/10" onClick={addChannel}>
                <Plus className="w-3.5 h-3.5 text-black/40" />
              </Button>
            </div>
            {channels.filter(c => c.type === "channel").map((channel) => (
              <button
                key={channel.id}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 mb-0.5",
                  activeChannel === channel.id
                    ? "bg-gradient-to-r from-[#C9A84C]/15 to-[#C9A84C]/5 text-black font-medium border border-[#C9A84C]/25"
                    : "text-black/60 hover:bg-[#C9A84C]/5 hover:text-black border border-transparent"
                )}
                onClick={() => handleSelectChannel(channel.id)}
              >
                <span className="flex items-center gap-2">
                  {channel.isPrivate ? (
                    <Lock className={cn("w-4 h-4", activeChannel === channel.id ? "text-[#C9A84C]" : "text-black/30")} />
                  ) : (
                    <Hash className={cn("w-4 h-4", activeChannel === channel.id ? "text-[#C9A84C]" : "text-black/30")} />
                  )}
                  {channel.name}
                </span>
                {channel.unread > 0 && (
                  <Badge className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white text-[10px] px-1.5 py-0 h-5 border-0 shadow-sm">
                    {channel.unread}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Direct Messages */}
          <div className="px-3 py-2 border-t border-[#C9A84C]/10 mt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-black/40 uppercase tracking-wider">Direct Messages</span>
              <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-[#C9A84C]/10" onClick={() => setShowNewDM(true)}>
                <Plus className="w-3.5 h-3.5 text-black/40" />
              </Button>
            </div>
            {/* Existing DM channels */}
            {dmChannels.map((dm) => (
              <button
                key={dm.id}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 mb-0.5",
                  activeChannel === dm.id
                    ? "bg-gradient-to-r from-[#C9A84C]/15 to-[#C9A84C]/5 text-black font-medium border border-[#C9A84C]/25"
                    : "text-black/60 hover:bg-[#C9A84C]/5 hover:text-black border border-transparent"
                )}
                onClick={() => handleSelectChannel(dm.id)}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-6 w-6 border border-[#C9A84C]/15">
                    <AvatarFallback className="text-[9px] bg-[#C9A84C]/10 text-[#C9A84C] font-semibold">
                      {getInitials(dm.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="truncate">{dm.name}</span>
                {dm.unread > 0 && (
                  <Badge className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white text-[10px] px-1.5 py-0 h-5 border-0 ml-auto">
                    {dm.unread}
                  </Badge>
                )}
              </button>
            ))}
            {/* Quick DM links to users */}
            {users.filter(u => !dmChannels.some(d => d.dmUserId === u.id)).map((user) => (
              <button
                key={user.id}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-black/60 hover:bg-[#C9A84C]/5 hover:text-black transition-all duration-200 mb-0.5"
                onClick={() => startDM(user)}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-7 w-7 border border-[#C9A84C]/15">
                    <AvatarFallback className="text-[10px] bg-[#C9A84C]/10 text-[#C9A84C] font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#FDFBF7]", statusColors[user.status])} />
                </div>
                <span className="truncate">{user.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* User Footer */}
        <div className="p-3 border-t border-[#C9A84C]/15 bg-white/50">
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <Avatar className="h-8 w-8 border border-[#C9A84C]/20">
                <AvatarFallback className="bg-gradient-to-br from-[#C9A84C] to-[#B8973F] text-white text-xs font-semibold">JB</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-black truncate">{currentUser.name}</p>
              <p className="text-[10px] text-black/40">{currentUser.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Chat Area ─── */}
      <div className={cn(
        "flex-1 flex flex-col bg-gradient-to-br from-[#FDFBF7] via-white to-[#F5F0E6]/30",
        !showSidebar ? "flex" : "hidden md:flex"
      )}>
        {/* Channel Header */}
        <div className="h-14 border-b border-[#C9A84C]/15 px-3 sm:px-5 flex items-center justify-between bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setShowSidebar(true)} className="h-8 w-8 shrink-0 hover:bg-[#C9A84C]/10">
                <ArrowLeft className="h-4 w-4 text-black" />
              </Button>
            )}
            {activeChannelData?.type === "dm" ? (
              <MessageSquare className="w-5 h-5 text-[#C9A84C] shrink-0" />
            ) : (
              <Hash className="w-5 h-5 text-[#C9A84C] shrink-0" />
            )}
            <div className="min-w-0">
              <h2 className="font-semibold text-black text-sm">{activeChannelData?.name}</h2>
              {activeChannelData?.description && (
                <p className="text-[11px] text-black/40 truncate hidden sm:block">{activeChannelData.description}</p>
              )}
              {activeChannelData?.type === "dm" && settings.ownerCopyEnabled && (
                <p className="text-[10px] text-[#C9A84C] flex items-center gap-1 hidden sm:flex">
                  <Eye className="w-3 h-3" /> Owner copy enabled
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 hidden sm:flex", isInCall ? "bg-green-500/20 text-green-600" : "hover:bg-[#C9A84C]/10")}
              onClick={handleCall}
            >
              <Phone className={cn("w-4 h-4", isInCall ? "text-green-600 animate-pulse" : "text-black/50")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 hidden sm:flex", isInVideo ? "bg-blue-500/20 text-blue-600" : "hover:bg-[#C9A84C]/10")}
              onClick={handleVideo}
            >
              <Video className={cn("w-4 h-4", isInVideo ? "text-blue-600 animate-pulse" : "text-black/50")} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#C9A84C]/10" onClick={() => setShowMembers(!showMembers)}>
              <Users className="w-4 h-4 text-black/50" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#C9A84C]/10 hidden sm:flex" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 text-black/50" />
            </Button>
          </div>
        </div>

        {/* Call / Video banner */}
        {(isInCall || isInVideo) && (
          <div className={cn(
            "px-4 py-2 flex items-center justify-between text-sm font-medium",
            isInCall ? "bg-green-500/10 text-green-700 border-b border-green-500/20" : "bg-blue-500/10 text-blue-700 border-b border-blue-500/20"
          )}>
            <span className="flex items-center gap-2">
              {isInCall ? <Phone className="w-4 h-4 animate-pulse" /> : <Video className="w-4 h-4 animate-pulse" />}
              {isInCall ? "Voice call in progress..." : "Video call in progress..."}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 h-7"
              onClick={() => { setIsInCall(false); setIsInVideo(false); toast.info("Call ended"); }}
            >
              End Call
            </Button>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-3 sm:px-5 py-4">
          <div className="space-y-1">
            {channelMessages.map((message) => {
              const isOwn = message.userId === currentUser.id;
              return (
                <div key={message.id} className="group flex gap-3 hover:bg-[#C9A84C]/[0.03] rounded-lg p-2.5 -mx-2 transition-colors">
                  <Avatar className="h-9 w-9 mt-0.5 shrink-0 border border-[#C9A84C]/15">
                    <AvatarFallback className={cn(
                      "text-xs font-semibold",
                      isOwn
                        ? "bg-gradient-to-br from-[#C9A84C] to-[#B8973F] text-white"
                        : message.userId === "system"
                          ? "bg-[#C9A84C]/10 text-[#C9A84C]"
                          : "bg-[#C9A84C]/10 text-[#C9A84C]"
                    )}>
                      {getInitials(message.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm text-black">{message.userName}</span>
                      <span className="text-[11px] text-black/35">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.ownerCopy && (
                        <Badge className="bg-[#C9A84C]/10 text-[#C9A84C] text-[9px] border-[#C9A84C]/20 h-4">
                          <Copy className="w-2.5 h-2.5 mr-0.5" /> Owner Copy
                        </Badge>
                      )}
                    </div>
                    <p className="text-black/70 text-sm leading-relaxed mt-0.5">{message.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-3 sm:p-4 border-t border-[#C9A84C]/15 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 bg-[#FDFBF7] border border-[#C9A84C]/20 rounded-xl px-3 py-1.5 focus-within:border-[#C9A84C]/40 focus-within:ring-2 focus-within:ring-[#C9A84C]/10 transition-all">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-[#C9A84C]/10">
              <Plus className="w-4 h-4 text-black/40" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={activeChannelData?.type === "dm" ? `Message ${activeChannelData.name}...` : `Message #${activeChannelData?.name}...`}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-black placeholder:text-black/35 text-sm h-9"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-[#C9A84C]/10 hidden sm:flex">
              <Smile className="w-4 h-4 text-black/40" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-[#C9A84C]/10 hidden sm:flex">
              <Paperclip className="w-4 h-4 text-black/40" />
            </Button>
            <Button
              size="icon"
              className="h-8 w-8 shrink-0 bg-gradient-to-r from-[#C9A84C] to-[#B8973F] hover:from-[#B8973F] hover:to-[#A78636] text-white shadow-sm"
              onClick={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-black/25 mt-1.5 px-1">Press Enter to send · Secured by JBJ Global</p>
        </div>
      </div>

      {/* ─── Members Sidebar ─── */}
      {showMembers && !isMobile && (
        <div className="w-60 bg-gradient-to-b from-[#FDFBF7] to-[#F5F0E6] border-l border-[#C9A84C]/15 flex flex-col">
          <div className="p-4 border-b border-[#C9A84C]/15">
            <h3 className="text-xs font-semibold text-black/40 uppercase tracking-wider">Members — {users.length + 1}</h3>
          </div>
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-0.5">
              <p className="text-[10px] text-black/35 uppercase tracking-wider font-semibold mb-2 mt-1">
                Online — {users.filter(u => u.status === 'online').length + 1}
              </p>
              {/* Current user */}
              <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#C9A84C]/5 transition-colors">
                <div className="relative shrink-0">
                  <Avatar className="h-8 w-8 border border-[#C9A84C]/20">
                    <AvatarFallback className="bg-gradient-to-br from-[#C9A84C] to-[#B8973F] text-white text-xs font-semibold">JB</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#FDFBF7] bg-green-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-black font-medium truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-black/40 truncate">{currentUser.role}</p>
                </div>
              </div>
              {/* Online users */}
              {users.filter(u => u.status === 'online').map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#C9A84C]/5 transition-colors cursor-pointer"
                  onClick={() => startDM(user)}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-8 w-8 border border-[#C9A84C]/15">
                      <AvatarFallback className="bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-semibold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#FDFBF7] bg-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-black truncate">{user.name}</p>
                    <p className="text-[10px] text-black/40 truncate">{user.role}</p>
                  </div>
                </div>
              ))}

              {/* Away / Offline */}
              {users.filter(u => u.status !== 'online').length > 0 && (
                <>
                  <p className="text-[10px] text-black/35 uppercase tracking-wider font-semibold mb-2 mt-4">
                    Away / Offline — {users.filter(u => u.status !== 'online').length}
                  </p>
                  {users.filter(u => u.status !== 'online').map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#C9A84C]/5 transition-colors opacity-60 cursor-pointer"
                      onClick={() => startDM(user)}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-8 w-8 border border-[#C9A84C]/15">
                          <AvatarFallback className="bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-semibold">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#FDFBF7]", statusColors[user.status])} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-black truncate">{user.name}</p>
                        <p className="text-[10px] text-black/40 truncate">{user.role}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* ─── Settings Dialog ─── */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-white border-2 border-[#C9A84C]/30">
          <DialogHeader>
            <DialogTitle className="text-black flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#C9A84C]" />
              Chat Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-black font-medium">Owner Copy</Label>
                <p className="text-xs text-zinc-500">Receive copies of all broker DMs</p>
              </div>
              <Switch
                checked={settings.ownerCopyEnabled}
                onCheckedChange={(v) => setSettings(s => ({ ...s, ownerCopyEnabled: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-black font-medium">Notifications</Label>
                <p className="text-xs text-zinc-500">Push notifications for new messages</p>
              </div>
              <Switch
                checked={settings.notificationsEnabled}
                onCheckedChange={(v) => setSettings(s => ({ ...s, notificationsEnabled: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-black font-medium">Sound Alerts</Label>
                <p className="text-xs text-zinc-500">Play sound for new messages</p>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(v) => setSettings(s => ({ ...s, soundEnabled: v }))}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── New DM Dialog ─── */}
      <Dialog open={showNewDM} onOpenChange={setShowNewDM}>
        <DialogContent className="bg-white border-2 border-[#C9A84C]/30">
          <DialogHeader>
            <DialogTitle className="text-black flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#C9A84C]" />
              New Direct Message
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => startDM(user)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#C9A84C]/5 border border-transparent hover:border-[#C9A84C]/20 transition-all"
              >
                <Avatar className="h-10 w-10 border border-[#C9A84C]/20">
                  <AvatarFallback className="bg-[#C9A84C]/10 text-[#C9A84C] font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium text-black">{user.name}</p>
                  <p className="text-xs text-zinc-500">{user.role} · {user.department}</p>
                </div>
                <div className={cn("ml-auto w-2.5 h-2.5 rounded-full", statusColors[user.status])} />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamChat;
