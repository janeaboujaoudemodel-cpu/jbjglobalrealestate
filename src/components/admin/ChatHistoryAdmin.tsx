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
  'ai_designer': 'bg-purple-100 text-purple-700',
  'mortgage_calculator': 'bg-green-100 text-green-700',
  'property_comparison': 'bg-blue-100 text-blue-700',
  'live_chat': 'bg-amber-100 text-amber-700',
  'executive_assistant': 'bg-[#EFE6D6]/20 text-[#1A1A1A]',
  'video_meeting': 'bg-red-100 text-red-700',
  'ai_broker': 'bg-cyan-100 text-cyan-700',
  'default': 'bg-[#F7F2EA] text-[#1A1A1A]/70'
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
          <h2 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#1A1A1A]" />
            Chat History Monitor
          </h2>
          <p className="text-[#1A1A1A]/60 text-sm">Review all user and broker conversations</p>
        </div>
        <Button 
          onClick={fetchChats} 
          variant="outline" 
          className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats - Champagne styling */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="jj-card-inner">
          <CardContent className="p-4">
            <p className="text-xs text-[#1A1A1A]/60">Total Messages</p>
            <p className="text-2xl font-bold text-[#1A1A1A]">{chats.length}</p>
          </CardContent>
        </Card>
        <Card className="jj-card-inner border-red-200">
          <CardContent className="p-4">
            <p className="text-xs text-[#1A1A1A]/60">Flagged</p>
            <p className="text-2xl font-bold text-red-600">{chats.filter(c => c.is_flagged).length}</p>
          </CardContent>
        </Card>
        <Card className="jj-card-inner border-blue-200">
          <CardContent className="p-4">
            <p className="text-xs text-[#1A1A1A]/60">Sessions</p>
            <p className="text-2xl font-bold text-blue-600">{sessions.size}</p>
          </CardContent>
        </Card>
        <Card className="jj-card-inner border-green-200">
          <CardContent className="p-4">
            <p className="text-xs text-[#1A1A1A]/60">Sources</p>
            <p className="text-2xl font-bold text-green-600">{uniqueSources.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/40" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#FDFBF7] border-[#B89555]/20 text-[#1A1A1A]"
          />
        </div>
        
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px] bg-[#FDFBF7] border-[#B89555]/20 text-[#1A1A1A]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent className="bg-[#FDFBF7] border-[#B89555]/20">
            <SelectItem value="all">All Sources</SelectItem>
            {uniqueSources.map(source => (
              <SelectItem key={source} value={source}>
                {source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-[180px] bg-[#FDFBF7] border-[#B89555]/20 text-[#1A1A1A]"
        />

        <Button
          variant={flaggedOnly ? "default" : "outline"}
          onClick={() => setFlaggedOnly(!flaggedOnly)}
          className={flaggedOnly ? "bg-red-500 hover:bg-red-600" : "border-[#B89555]/30 text-[#1A1A1A]/70"}
        >
          <Flag className="w-4 h-4 mr-2" />
          {flaggedOnly ? 'Flagged Only' : 'Show Flagged'}
        </Button>
      </div>

      {/* Chat Sessions */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#1A1A1A] animate-spin" />
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
                  className={`jj-card-inner hover:border-[#B89555] transition-all cursor-pointer ${
                    hasFlagged ? 'border-red-300' : ''
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-[#1A1A1A]" />
                        </div>
                        <div>
                          <p className="text-[#1A1A1A] font-medium">
                            {firstChat.user_name || firstChat.user_email || 'Anonymous'}
                          </p>
                          <p className="text-xs text-[#1A1A1A]/60">
                            {format(new Date(firstChat.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={SOURCE_COLORS[firstChat.source] || SOURCE_COLORS.default}>
                          {firstChat.source.replace(/_/g, ' ')}
                        </Badge>
                        {hasFlagged && (
                          <Badge className="bg-red-100 text-red-600">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[#1A1A1A]/60 border-[#B89555]/30">
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
                              ? 'bg-blue-50 border-l-2 border-blue-500' 
                              : 'bg-green-50 border-l-2 border-green-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[#1A1A1A]/50">{chat.role}</span>
                            <div className="flex items-center gap-2">
                              {chat.is_flagged && (
                                <span className="text-xs text-red-600 flex items-center gap-1">
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
                                <Flag className="w-3 h-3 text-[#1A1A1A]/40" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-[#1A1A1A]/80 line-clamp-2">{chat.message}</p>
                        </div>
                      ))}
                      {sessionChats.length > 4 && (
                        <p className="text-xs text-[#1A1A1A]/40 text-center">
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
                <MessageSquare className="w-12 h-12 text-[#1A1A1A]/70 mx-auto mb-4" />
                <p className="text-[#1A1A1A]/50">No chat history found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Flag Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent className="bg-gradient-to-br from-[#F7F1E6] to-[#ECE2D2] border-[#B89555]/30">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-500" />
              Flag Chat for Review
            </DialogTitle>
          </DialogHeader>
          
          {selectedChat && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FDFBF7]/50 rounded-lg border border-[#B89555]/20">
                <p className="text-xs text-[#1A1A1A]/50 mb-1">Message:</p>
                <p className="text-[#1A1A1A] text-sm">{selectedChat.message}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-[#1A1A1A]/60">Reason for flagging:</label>
                <Textarea
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="e.g., Wrong information provided, inappropriate response, misleading content..."
                  className="bg-[#FDFBF7] border-[#B89555]/20 text-[#1A1A1A]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagDialog(false)} className="border-[#B89555]/30">
              Cancel
            </Button>
            <Button 
              onClick={handleFlag}
              disabled={!flagReason.trim()}
              className="bg-red-500 hover:bg-red-600 text-white"
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