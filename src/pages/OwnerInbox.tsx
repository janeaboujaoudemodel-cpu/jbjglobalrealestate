/**
 * Owner Unified Inbox - JBJ Global Real Estate
 * Single inbox merging all communication channels
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Mail,
  Instagram,
  Facebook,
  Globe,
  Mic,
  Search,
  Filter,
  Bell,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  LinkIcon,
  Plus,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Volume2,
} from "lucide-react";
import useOwnerInbox, { 
  CommThread, 
  ThreadStatus, 
  ChannelType,
  InboxFilters 
} from "@/hooks/useOwnerInbox";
import { formatDistanceToNow } from "date-fns";
import OwnerInboxThread from "@/components/owner-inbox/OwnerInboxThread";

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageSquare className="h-4 w-4 text-green-500" />,
  email_gmail: <Mail className="h-4 w-4 text-red-500" />,
  email_hostinger: <Mail className="h-4 w-4 text-blue-500" />,
  instagram: <Instagram className="h-4 w-4 text-pink-500" />,
  facebook: <Facebook className="h-4 w-4 text-blue-600" />,
  website_chat: <Globe className="h-4 w-4 text-gold" />,
  voice: <Mic className="h-4 w-4 text-purple-500" />,
};

const statusConfig: Record<ThreadStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: "New", color: "bg-blue-500/10 text-blue-500 border-blue-500/30", icon: <Bell className="h-3 w-3" /> },
  needs_reply: { label: "Needs Reply", color: "bg-red-500/10 text-red-500 border-red-500/30", icon: <AlertTriangle className="h-3 w-3" /> },
  waiting: { label: "Waiting", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", icon: <Clock className="h-3 w-3" /> },
  follow_up_due: { label: "Follow-up Due", color: "bg-orange-500/10 text-orange-500 border-orange-500/30", icon: <Bell className="h-3 w-3" /> },
  closed: { label: "Closed", color: "bg-green-500/10 text-green-500 border-green-500/30", icon: <CheckCircle className="h-3 w-3" /> },
};

export default function OwnerInbox() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<InboxFilters>({
    status: 'all',
    channel: 'all',
    assistant: 'all',
    search: '',
    unreadOnly: false,
  });
  const [selectedThread, setSelectedThread] = useState<CommThread | null>(null);
  
  const {
    threads,
    channels,
    threadsLoading,
    stats,
    refetchThreads,
    updateThreadStatus,
    markAsRead,
    isUpdating,
  } = useOwnerInbox(filters);

  // Select first unread thread on load
  useEffect(() => {
    if (threads.length > 0 && !selectedThread) {
      const firstUnread = threads.find(t => t.unread_count > 0);
      if (firstUnread) {
        setSelectedThread(firstUnread);
      }
    }
  }, [threads, selectedThread]);

  const handleThreadSelect = (thread: CommThread) => {
    setSelectedThread(thread);
    if (thread.unread_count > 0) {
      markAsRead(thread.id);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4 bg-white/80 backdrop-blur-sm border-2 border-gold/30 rounded-2xl p-4 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/30">
                  <MessageSquare className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black">Unified Inbox</h1>
                  <p className="text-zinc-500 text-sm">Jane Bou Jaoude — All communications in one place</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchThreads()}
                  disabled={threadsLoading}
                  className="border-gold/30"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${threadsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/owner/settings/communication')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Channel
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <StatsCard label="Total" value={stats.total} icon={<MessageSquare className="h-4 w-4" />} />
            <StatsCard label="Unread" value={stats.unread} icon={<Bell className="h-4 w-4" />} variant="warning" />
            <StatsCard label="Needs Reply" value={stats.needsReply} icon={<AlertTriangle className="h-4 w-4" />} variant="danger" />
            <StatsCard label="New" value={stats.new} icon={<Sparkles className="h-4 w-4" />} variant="info" />
            <StatsCard label="Follow-up Due" value={stats.followUpDue} icon={<Clock className="h-4 w-4" />} variant="orange" />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search contacts..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 border-gold/30"
              />
            </div>
            
            <Select 
              value={filters.status || 'all'} 
              onValueChange={(v) => setFilters(prev => ({ ...prev, status: v as ThreadStatus | 'all' }))}
            >
              <SelectTrigger className="w-[140px] border-gold/30">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="needs_reply">Needs Reply</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="follow_up_due">Follow-up Due</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.channel || 'all'} 
              onValueChange={(v) => setFilters(prev => ({ ...prev, channel: v as ChannelType | 'all' }))}
            >
              <SelectTrigger className="w-[160px] border-gold/30">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email_gmail">Gmail</SelectItem>
                <SelectItem value="email_hostinger">Hostinger</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="website_chat">Website</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={filters.unreadOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, unreadOnly: !prev.unreadOnly }))}
              className={filters.unreadOnly ? "bg-gold text-black" : "border-gold/30"}
            >
              <Bell className="h-4 w-4 mr-1" />
              Unread
            </Button>
          </div>

          {/* Main Content - Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 320px)' }}>
            {/* Thread List */}
            <div className="lg:col-span-1 min-h-0">
              <Card className="border-2 border-gold/20 bg-white/90 backdrop-blur-sm h-full overflow-hidden">
                <ScrollArea className="h-full">
                  {threadsLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-start gap-3 p-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : threads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <MessageSquare className="h-12 w-12 text-gold/40 mb-4" />
                      <p className="text-zinc-500 font-medium">No conversations yet</p>
                      <p className="text-zinc-400 text-sm mt-1">Connect channels to start receiving messages</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gold/10">
                      {threads.map((thread) => (
                        <ThreadListItem
                          key={thread.id}
                          thread={thread}
                          isSelected={selectedThread?.id === thread.id}
                          onClick={() => handleThreadSelect(thread)}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>

            {/* Thread Detail */}
            <div className="lg:col-span-2 min-h-0">
              {selectedThread ? (
                <OwnerInboxThread
                  thread={selectedThread}
                  onStatusChange={(status) => updateThreadStatus({ threadId: selectedThread.id, status })}
                  onClose={() => setSelectedThread(null)}
                />
              ) : (
                <Card className="border-2 border-gold/20 bg-white/90 backdrop-blur-sm h-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <MessageSquare className="h-16 w-16 text-gold/30 mx-auto mb-4" />
                    <p className="text-zinc-500 font-medium">Select a conversation</p>
                    <p className="text-zinc-400 text-sm mt-1">Choose a thread from the list to view messages</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Stats Card Component
function StatsCard({ 
  label, 
  value, 
  icon, 
  variant = 'default' 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger' | 'info' | 'orange';
}) {
  const variants = {
    default: "border-gold/30 bg-white",
    warning: "border-yellow-500/30 bg-yellow-50",
    danger: "border-red-500/30 bg-red-50",
    info: "border-blue-500/30 bg-blue-50",
    orange: "border-orange-500/30 bg-orange-50",
  };

  const iconColors = {
    default: "text-gold",
    warning: "text-yellow-600",
    danger: "text-red-600",
    info: "text-blue-600",
    orange: "text-orange-600",
  };

  return (
    <Card className={`${variants[variant]} border-2`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-xl font-bold text-black">{value}</p>
          </div>
          <div className={`p-2 rounded-lg bg-white/50 ${iconColors[variant]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Thread List Item Component
function ThreadListItem({ 
  thread, 
  isSelected, 
  onClick 
}: { 
  thread: CommThread; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const status = statusConfig[thread.status];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`p-3 cursor-pointer transition-all hover:bg-gold/5 ${
        isSelected ? 'bg-gold/10 border-l-4 border-l-gold' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border border-gold/20">
            {thread.contact_avatar_url ? (
              <img src={thread.contact_avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-gold" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full">
            {channelIcons[thread.channel_type] || <Globe className="h-3 w-3" />}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-black truncate">
              {thread.contact_name || thread.contact_identifier}
            </span>
            {thread.unread_count > 0 && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold text-black text-xs font-bold flex items-center justify-center">
                {thread.unread_count}
              </span>
            )}
          </div>
          
          <p className="text-sm text-zinc-500 truncate mt-0.5">
            {thread.last_message_preview || 'No messages yet'}
          </p>

          <div className="flex items-center justify-between mt-2">
            <Badge className={`text-[10px] px-1.5 py-0.5 border ${status.color}`}>
              {status.icon}
              <span className="ml-1">{status.label}</span>
            </Badge>
            
            {thread.last_message_at && (
              <span className="text-[10px] text-zinc-400">
                {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}
              </span>
            )}
          </div>

          {thread.lead && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-green-600">
              <LinkIcon className="h-3 w-3" />
              <span className="truncate">{thread.lead.full_name}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
