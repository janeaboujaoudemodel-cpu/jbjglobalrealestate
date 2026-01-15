import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  MessageSquare,
  Flag,
  Search,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Filter,
  RefreshCw,
  Eye,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useChatHistoryLogger } from '@/hooks/useChatHistoryLogger';

interface ChatEntry {
  id: string;
  session_id: string;
  role: string;
  message: string;
  source: string;
  source_page: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  is_flagged: boolean;
  flag_reason: string | null;
  flagged_at: string | null;
  flagged_by: string | null;
  created_at: string;
}

const SOURCE_COLORS: Record<string, string> = {
  'ai_designer': 'bg-purple-500/20 text-purple-400',
  'mortgage_calculator': 'bg-green-500/20 text-green-400',
  'property_comparison': 'bg-blue-500/20 text-blue-400',
  'live_chat': 'bg-amber-500/20 text-amber-400',
  'executive_assistant': 'bg-gold/20 text-gold',
  'video_meeting': 'bg-red-500/20 text-red-400',
  'ai_broker': 'bg-cyan-500/20 text-cyan-400',
  'default': 'bg-gray-500/20 text-gray-400'
};

export function ChatHistoryAdmin() {
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedChat, setSelectedChat] = useState<ChatEntry | null>(null);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [sessions, setSessions] = useState<Map<string, ChatEntry[]>>(new Map());
  
  const { flagChat } = useChatHistoryLogger();

  useEffect(() => {
    fetchChats();
  }, [sourceFilter, flaggedOnly, selectedDate]);

  const fetchChats = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('chat_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (sourceFilter !== 'all') {
        query = query.eq('source', sourceFilter);
      }
      if (flaggedOnly) {
        query = query.eq('is_flagged', true);
      }
      if (selectedDate) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setChats(data || []);
      
      // Group by session
      const grouped = new Map<string, ChatEntry[]>();
      (data || []).forEach(chat => {
        const existing = grouped.get(chat.session_id) || [];
        grouped.set(chat.session_id, [...existing, chat]);
      });
      setSessions(grouped);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to fetch chat history');
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async () => {
    if (!selectedChat || !flagReason.trim()) return;

    await flagChat(selectedChat.id, flagReason, 'admin');
    toast.success('Chat flagged for review');
    setShowFlagDialog(false);
    setFlagReason('');
    setSelectedChat(null);
    fetchChats();
  };

  const filteredSessions = Array.from(sessions.entries()).filter(([sessionId, chats]) => {
    if (!searchQuery) return true;
    return chats.some(chat => 
      chat.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const uniqueSources = [...new Set(chats.map(c => c.source))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-gold" />
            Chat History Monitor
          </h2>
          <p className="text-gray-400 text-sm">Review all user and broker conversations</p>
        </div>
        <Button 
          onClick={fetchChats} 
          variant="outline" 
          className="border-gold/30 text-gold"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-[#0E0E0E] border-gold/20">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Total Messages</p>
            <p className="text-2xl font-bold text-white">{chats.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0E0E0E] border-red-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Flagged</p>
            <p className="text-2xl font-bold text-red-400">{chats.filter(c => c.is_flagged).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0E0E0E] border-blue-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Sessions</p>
            <p className="text-2xl font-bold text-blue-400">{sessions.size}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0E0E0E] border-green-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Sources</p>
            <p className="text-2xl font-bold text-green-400">{uniqueSources.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1A1A1A] border-gold/20 text-white"
          />
        </div>
        
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px] bg-[#1A1A1A] border-gold/20 text-white">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-gold/20">
            <SelectItem value="all" className="text-white">All Sources</SelectItem>
            {uniqueSources.map(source => (
              <SelectItem key={source} value={source} className="text-white">
                {source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-[180px] bg-[#1A1A1A] border-gold/20 text-white"
        />

        <Button
          variant={flaggedOnly ? "default" : "outline"}
          onClick={() => setFlaggedOnly(!flaggedOnly)}
          className={flaggedOnly ? "bg-red-500" : "border-gold/30 text-gray-400"}
        >
          <Flag className="w-4 h-4 mr-2" />
          {flaggedOnly ? 'Flagged Only' : 'Show Flagged'}
        </Button>
      </div>

      {/* Chat Sessions */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {filteredSessions.map(([sessionId, sessionChats]) => {
              const firstChat = sessionChats[sessionChats.length - 1]; // Oldest
              const lastChat = sessionChats[0]; // Newest
              const hasFlagged = sessionChats.some(c => c.is_flagged);
              
              return (
                <Card 
                  key={sessionId} 
                  className={`bg-[#0E0E0E] hover:border-gold/40 transition-all cursor-pointer ${
                    hasFlagged ? 'border-red-500/40' : 'border-gold/20'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {firstChat.user_name || firstChat.user_email || 'Anonymous'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(firstChat.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={SOURCE_COLORS[firstChat.source] || SOURCE_COLORS.default}>
                          {firstChat.source.replace(/_/g, ' ')}
                        </Badge>
                        {hasFlagged && (
                          <Badge className="bg-red-500/20 text-red-400">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-gray-400">
                          {sessionChats.length} msgs
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {sessionChats.slice(0, 4).map((chat, idx) => (
                        <div 
                          key={chat.id}
                          className={`p-2 rounded-lg ${
                            chat.role === 'user' 
                              ? 'bg-blue-500/10 border-l-2 border-blue-500' 
                              : 'bg-green-500/10 border-l-2 border-green-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400">{chat.role}</span>
                            <div className="flex items-center gap-2">
                              {chat.is_flagged && (
                                <span className="text-xs text-red-400 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  {chat.flag_reason}
                                </span>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedChat(chat);
                                  setShowFlagDialog(true);
                                }}
                              >
                                <Flag className="w-3 h-3 text-gray-400" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-2">{chat.message}</p>
                        </div>
                      ))}
                      {sessionChats.length > 4 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{sessionChats.length - 4} more messages
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredSessions.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gold/30 mx-auto mb-4" />
                <p className="text-gray-400">No chat history found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Flag Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent className="bg-[#0E0E0E] border-gold/20">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-400" />
              Flag Chat for Review
            </DialogTitle>
          </DialogHeader>
          
          {selectedChat && (
            <div className="space-y-4">
              <div className="p-3 bg-zinc-800 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Message:</p>
                <p className="text-white text-sm">{selectedChat.message}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Reason for flagging:</label>
                <Textarea
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="e.g., Wrong information provided, inappropriate response, misleading content..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleFlag}
              disabled={!flagReason.trim()}
              className="bg-red-500 hover:bg-red-600"
            >
              <Flag className="w-4 h-4 mr-2" />
              Flag Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
