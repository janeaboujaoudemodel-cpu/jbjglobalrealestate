import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Search, Download, MessageCircle, FileText, X, Eye, 
  User, Bot, Clock, Star, Phone, Mail, Globe, Filter, 
  ChevronDown, Sparkles, TrendingUp, AlertCircle, CheckCircle2,
  Building2, Home, Scale, Paintbrush, MessageSquare, Calendar,
  Loader2, Award, Briefcase, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ChatConversation {
  id: string;
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  service_type: string | null;
  status: string | null;
  rating: number | null;
  feedback_type: string | null;
  rating_feedback: string | null;
  shortcut_selected: string | null;
  page_source: string | null;
  created_at: string;
  updated_at: string;
  messages: Array<{ role: string; content: string; timestamp: string }> | null;
  was_helpful: boolean | null;
  agent_behavior_rating: number | null;
  response_speed_rating: number | null;
}

interface CVSubmission {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  cv_url: string | null;
  status: string | null;
  created_at: string;
  chat_session_id: string | null;
  ai_summary: string | null;
  ai_ranking: number | null;
}

interface ChatHistoryMessage {
  id: string;
  role: string;
  message: string;
  created_at: string;
  session_id: string | null;
  user_name: string | null;
  user_email: string | null;
}

const ALL_SERVICES = [
  { id: 'real_estate', label: 'Property Sales & Rentals', icon: Building2 },
  { id: 'holiday_homes', label: 'Holiday Homes', icon: Home },
  { id: 'partner_intro', label: 'Partner Introductions', icon: Scale },
  { id: 'design_build', label: 'Design & Build', icon: Paintbrush },
  { id: 'general', label: 'General Inquiry', icon: MessageSquare },
];

const getServiceLabel = (id: string | null) => {
  if (!id) return 'Unknown';
  return ALL_SERVICES.find(s => s.id === id)?.label || id.replace(/_/g, ' ');
};

const getServiceIcon = (id: string | null) => {
  if (!id) return MessageSquare;
  return ALL_SERVICES.find(s => s.id === id)?.icon || MessageSquare;
};

const getStatusConfig = (status: string | null) => {
  switch (status) {
    case 'completed': return { label: 'Completed', bg: 'bg-emerald-900/40', text: 'text-emerald-300', border: 'border-emerald-700/50' };
    case 'submitted_to_team': return { label: 'Submitted', bg: 'bg-sky-900/40', text: 'text-sky-300', border: 'border-sky-700/50' };
    case 'closed': return { label: 'Closed', bg: 'bg-zinc-800/60', text: 'text-zinc-400', border: 'border-zinc-700/50' };
    default: return { label: 'Active', bg: 'bg-gold/10', text: 'text-gold', border: 'border-gold/30' };
  }
};

const AdminChatDashboard = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [cvSubmissions, setCvSubmissions] = useState<CVSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [tab, setTab] = useState<'chats' | 'cvs'>('chats');
  const [selectedCV, setSelectedCV] = useState<CVSubmission | null>(null);
  const [cvAiLoading, setCvAiLoading] = useState(false);
  const [fallbackMessages, setFallbackMessages] = useState<ChatHistoryMessage[]>([]);
  const [loadingFallback, setLoadingFallback] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [chatsRes, cvsRes] = await Promise.all([
      supabase.from('chat_conversations').select('*').order('updated_at', { ascending: false }).limit(500),
      supabase.from('hr_cv_submissions').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    if (chatsRes.data) {
      setConversations(chatsRes.data.map(c => ({ ...c, messages: c.messages as ChatConversation['messages'] })));
    }
    if (cvsRes.data) setCvSubmissions(cvsRes.data as CVSubmission[]);
    setLoading(false);
  };

  // Fallback: load from chat_history when messages are empty
  const loadFallbackMessages = useCallback(async (conv: ChatConversation) => {
    if ((conv.messages?.length || 0) > 0) {
      setFallbackMessages([]);
      return;
    }
    setLoadingFallback(true);
    try {
      // Try matching by email and time range
      let query = supabase.from('chat_history').select('*').order('created_at', { ascending: true });
      if (conv.user_email) {
        query = query.eq('user_email', conv.user_email);
      }
      // Get messages within a reasonable window around the conversation
      query = query.gte('created_at', conv.created_at);
      if (conv.updated_at) {
        // Add 1 hour buffer
        const endTime = new Date(new Date(conv.updated_at).getTime() + 3600000).toISOString();
        query = query.lte('created_at', endTime);
      }
      const { data } = await query.limit(200);
      setFallbackMessages((data || []) as ChatHistoryMessage[]);
    } catch (err) {
      console.error('Failed to load fallback messages:', err);
    } finally {
      setLoadingFallback(false);
    }
  }, []);

  // When selecting a conversation, also load fallback
  const handleSelectConversation = useCallback((conv: ChatConversation) => {
    setSelectedConversation(conv);
    loadFallbackMessages(conv);
  }, [loadFallbackMessages]);

  // Generate AI summary for a CV
  const generateCVSummary = useCallback(async (cv: CVSubmission) => {
    setCvAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cv-ai-analyzer', {
        body: { cv_id: cv.id, full_name: cv.full_name, email: cv.email, phone: cv.phone, cv_url: cv.cv_url },
      });
      if (error) throw error;
      if (data?.summary) {
        setCvSubmissions(prev => prev.map(c => c.id === cv.id ? { ...c, ai_summary: data.summary, ai_ranking: data.ranking || 0 } : c));
        setSelectedCV(prev => prev?.id === cv.id ? { ...prev, ai_summary: data.summary, ai_ranking: data.ranking || 0 } : prev);
        toast.success('AI analysis complete');
      }
    } catch (err) {
      console.error('AI analysis failed:', err);
      toast.error('AI analysis unavailable');
    } finally {
      setCvAiLoading(false);
    }
  }, []);

  const filteredConversations = useMemo(() => conversations.filter(c => {
    const matchSearch = !searchTerm || 
      c.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user_phone?.includes(searchTerm);
    const matchService = filterService === 'all' || c.service_type === filterService;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchService && matchStatus;
  }), [conversations, searchTerm, filterService, filterStatus]);

  const stats = useMemo(() => {
    const total = conversations.length;
    const active = conversations.filter(c => c.status === 'active').length;
    const submitted = conversations.filter(c => c.status === 'submitted_to_team').length;
    const rated = conversations.filter(c => c.rating).length;
    const avgRating = rated > 0 ? (conversations.reduce((sum, c) => sum + (c.rating || 0), 0) / rated).toFixed(1) : '--';
    return { total, active, submitted, rated, avgRating, cvCount: cvSubmissions.length };
  }, [conversations, cvSubmissions]);

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Service', 'Status', 'Rating', 'Created', 'Messages'];
    const rows = filteredConversations.map(c => [
      c.user_name || '', c.user_email || '', c.user_phone || '',
      getServiceLabel(c.service_type), c.status || '', c.rating?.toString() || '',
      c.created_at, (c.messages?.length || 0).toString(),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `chat-conversations-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Get messages to display (original or fallback)
  const displayMessages = useMemo(() => {
    if (!selectedConversation) return [];
    if ((selectedConversation.messages?.length || 0) > 0) return selectedConversation.messages!;
    return fallbackMessages.map(m => ({ role: m.role, content: m.message, timestamp: m.created_at }));
  }, [selectedConversation, fallbackMessages]);

  // Render score bar
  const renderScoreBar = (score: number) => {
    const color = score >= 8 ? 'bg-emerald-500' : score >= 5 ? 'bg-gold' : 'bg-red-400';
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score * 10}%` }} />
        </div>
        <span className="text-sm font-bold text-white">{score}/10</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header - Champagne Gold */}
      <div className="border-b border-gold/20 bg-gradient-to-r from-[#1a1710] via-[#151210] to-[#0f0f0f] sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-zinc-400 hover:text-gold hover:bg-gold/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gold" />
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gold to-[#E8D5A3] bg-clip-text text-transparent">AI Chat Intelligence</h1>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Conversations, transcripts, and CV submissions</p>
              </div>
            </div>
            <Button onClick={exportToCSV} size="sm" className="bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 gap-2">
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Chats', value: stats.total, icon: MessageCircle },
            { label: 'Active', value: stats.active, icon: TrendingUp },
            { label: 'Submitted', value: stats.submitted, icon: CheckCircle2 },
            { label: 'Rated', value: stats.rated, icon: Star },
            { label: 'Avg Rating', value: stats.avgRating, icon: Award },
            { label: 'CVs Received', value: stats.cvCount, icon: FileText },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#1a1710]/80 border border-gold/15 rounded-xl p-4 hover:border-gold/30 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <stat.icon className="w-4 h-4 text-gold/70" />
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tab Buttons - Gold active state */}
        <div className="flex gap-1 bg-[#1a1710] rounded-xl p-1.5 w-fit border border-gold/15">
          <button
            onClick={() => setTab('chats')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === 'chats'
                ? 'bg-gold text-black shadow-lg shadow-gold/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageCircle className="w-4 h-4" /> Chat Transcripts
          </button>
          <button
            onClick={() => setTab('cvs')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === 'cvs'
                ? 'bg-gold text-black shadow-lg shadow-gold/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" /> CV Submissions ({stats.cvCount})
          </button>
        </div>

        {/* ============ CHATS TAB ============ */}
        {tab === 'chats' && (
          <>
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#1a1710] border-gold/20 text-white placeholder:text-zinc-600 focus:border-gold/50 focus:ring-gold/20"
                />
              </div>
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="h-10 rounded-lg border border-gold/20 bg-[#1a1710] text-zinc-300 pl-3 pr-8 text-sm appearance-none cursor-pointer hover:border-gold/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                style={{ colorScheme: 'dark' }}
              >
                <option value="all">All Services</option>
                {ALL_SERVICES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 rounded-lg border border-gold/20 bg-[#1a1710] text-zinc-300 pl-3 pr-8 text-sm appearance-none cursor-pointer hover:border-gold/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                style={{ colorScheme: 'dark' }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="submitted_to_team">Submitted</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" /></div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-16">
                <MessageCircle className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No conversations found</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredConversations.map(c => {
                  const sc = getStatusConfig(c.status);
                  const SI = getServiceIcon(c.service_type);
                  const msgCount = c.messages?.length || 0;
                  const lastMsg = c.messages?.[c.messages.length - 1];
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectConversation(c)}
                      className="bg-[#1a1710]/60 hover:bg-[#1a1710] border border-gold/10 hover:border-gold/30 rounded-xl p-4 cursor-pointer transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-gold/70 group-hover:text-gold transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">{c.user_name || 'Anonymous'}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${sc.bg} ${sc.text} ${sc.border}`}>
                              {sc.label}
                            </span>
                            {c.rating && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-gold">
                                <Star className="w-3 h-3 fill-gold" /> {c.rating}/5
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                            {c.user_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.user_email}</span>}
                            {c.user_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.user_phone}</span>}
                          </div>
                          {lastMsg && (
                            <p className="text-xs text-zinc-500 mt-2 line-clamp-1">
                              <span className="text-zinc-600 font-medium">{lastMsg.role === 'user' ? 'User' : 'AI'}:</span>{' '}
                              {lastMsg.content.slice(0, 120)}
                            </p>
                          )}
                          {msgCount === 0 && (
                            <p className="text-xs text-gold/50 mt-2 italic">Transcript available via history log</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <SI className="w-3.5 h-3.5 text-gold/50" />
                            <span className="text-[10px] text-zinc-500">{getServiceLabel(c.service_type)}</span>
                          </div>
                          <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {format(new Date(c.created_at), 'dd MMM yyyy')}
                          </span>
                          <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> {msgCount > 0 ? `${msgCount} msgs` : 'history'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ============ CVS TAB ============ */}
        {tab === 'cvs' && (
          <div className="space-y-3">
            {cvSubmissions.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No CV submissions yet</p>
              </div>
            ) : (
              cvSubmissions.map(cv => (
                <div
                  key={cv.id}
                  onClick={() => setSelectedCV(cv)}
                  className="bg-[#1a1710]/60 border border-gold/10 hover:border-gold/30 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-gold/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{cv.full_name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {cv.email}</span>
                      {cv.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {cv.phone}</span>}
                    </div>
                    {cv.ai_summary && (
                      <p className="text-xs text-zinc-400 mt-1.5 line-clamp-1 italic">{cv.ai_summary}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {cv.ai_ranking ? (
                      <Badge className="bg-gold/15 text-gold border-gold/30">
                        <Star className="w-3 h-3 mr-1 fill-gold" /> {cv.ai_ranking}/10
                      </Badge>
                    ) : null}
                    <Badge className={`${cv.status === 'approved' ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40' : cv.status === 'rejected' ? 'bg-red-900/40 text-red-300 border-red-700/40' : 'bg-gold/10 text-gold border-gold/30'}`}>
                      {cv.status || 'pending'}
                    </Badge>
                    <span className="text-[10px] text-zinc-600">{format(new Date(cv.created_at), 'dd MMM yyyy')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ============ TRANSCRIPT MODAL ============ */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setSelectedConversation(null); setFallbackMessages([]); }}>
          <div className="bg-[#141210] border border-gold/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b border-gold/15 bg-gradient-to-r from-[#1a1710] to-[#141210] rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center">
                    <User className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{selectedConversation.user_name || 'Anonymous'}</h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {selectedConversation.user_email && <span className="text-xs text-zinc-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedConversation.user_email}</span>}
                      {selectedConversation.user_phone && <span className="text-xs text-zinc-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedConversation.user_phone}</span>}
                    </div>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => { setSelectedConversation(null); setFallbackMessages([]); }} className="text-zinc-400 hover:text-white hover:bg-white/10">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {(() => { const sc = getStatusConfig(selectedConversation.status); return (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${sc.bg} ${sc.text} ${sc.border}`}>{sc.label}</span>
                ); })()}
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  {(() => { const SI = getServiceIcon(selectedConversation.service_type); return <SI className="w-3 h-3 text-gold/60" />; })()}
                  {getServiceLabel(selectedConversation.service_type)}
                </span>
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {format(new Date(selectedConversation.created_at), 'dd MMM yyyy, h:mm a')}
                </span>
                {selectedConversation.rating && (
                  <span className="text-[10px] text-gold flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-gold" /> {selectedConversation.rating}/5
                  </span>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-5 space-y-3">
                {loadingFallback ? (
                  <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gold mx-auto" /></div>
                ) : displayMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">No messages recorded for this session</p>
                  </div>
                ) : (
                  displayMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role !== 'user' && (
                        <div className="w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5 text-gold" />
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        msg.role === 'user'
                          ? 'bg-gold/15 text-white rounded-br-md border border-gold/20'
                          : 'bg-zinc-800/80 text-zinc-200 rounded-bl-md border border-zinc-700/30'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed text-[13px]">{msg.content}</p>
                        {msg.timestamp && (
                          <p className="text-[9px] mt-1.5 opacity-40">{format(new Date(msg.timestamp), 'h:mm a')}</p>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                {(selectedConversation.rating || selectedConversation.rating_feedback) && (
                  <div className="border-t border-gold/10 pt-3 mt-4">
                    <div className="bg-[#1a1710] rounded-xl p-3 space-y-1 border border-gold/10">
                      {selectedConversation.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                          <span className="text-xs text-white font-medium">Rating: {selectedConversation.rating}/5</span>
                        </div>
                      )}
                      {selectedConversation.rating_feedback && <p className="text-xs text-zinc-400">"{selectedConversation.rating_feedback}"</p>}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-gold/10 flex items-center justify-between">
              <p className="text-[10px] text-zinc-600">
                {displayMessages.length} messages
                {(selectedConversation.messages?.length || 0) === 0 && displayMessages.length > 0 ? ' (from history log)' : ''}
              </p>
              <Button onClick={() => { setSelectedConversation(null); setFallbackMessages([]); }} size="sm" className="bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============ CV VIEWER MODAL ============ */}
      {selectedCV && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCV(null)}>
          <div className="bg-[#141210] border border-gold/20 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* CV Header */}
            <div className="p-5 border-b border-gold/15 bg-gradient-to-r from-[#1a1710] to-[#141210] rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center">
                    <User className="w-7 h-7 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedCV.full_name}</h3>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-zinc-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedCV.email}</span>
                      {selectedCV.phone && <span className="text-xs text-zinc-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedCV.phone}</span>}
                      <span className="text-xs text-zinc-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(selectedCV.created_at), 'dd MMM yyyy')}</span>
                      <Badge className="bg-gold/10 text-gold border-gold/30 text-[10px]">Source: Chat Widget</Badge>
                    </div>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setSelectedCV(null)} className="text-zinc-400 hover:text-white hover:bg-white/10">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-5 space-y-5">
                {/* AI Analysis Section */}
                <div className="bg-[#1a1710] border border-gold/15 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold" />
                      <h4 className="text-sm font-semibold text-white">AI Analysis</h4>
                    </div>
                    {!selectedCV.ai_summary && (
                      <Button
                        size="sm"
                        onClick={() => generateCVSummary(selectedCV)}
                        disabled={cvAiLoading}
                        className="bg-gold text-black hover:bg-gold/90 text-xs font-semibold gap-1"
                      >
                        {cvAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {cvAiLoading ? 'Analyzing...' : 'Generate AI Summary'}
                      </Button>
                    )}
                  </div>
                  {selectedCV.ai_summary ? (
                    <>
                      <p className="text-sm text-zinc-300 leading-relaxed">{selectedCV.ai_summary}</p>
                      {selectedCV.ai_ranking ? (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Relevance Score</p>
                          {renderScoreBar(selectedCV.ai_ranking)}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">Click "Generate AI Summary" to analyze this CV</p>
                  )}
                </div>

                {/* PDF Preview */}
                {selectedCV.cv_url ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-gold" /> CV Document</h4>
                      <a
                        href={selectedCV.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 hover:bg-gold/20 text-gold text-xs font-medium rounded-lg transition-colors border border-gold/20"
                      >
                        <Download className="w-3 h-3" /> Download
                      </a>
                    </div>
                    <div className="border border-gold/15 rounded-xl overflow-hidden bg-white">
                      <iframe
                        src={selectedCV.cv_url}
                        className="w-full h-[500px]"
                        title={`CV - ${selectedCV.full_name}`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-[#1a1710] rounded-xl border border-gold/10">
                    <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">No CV file uploaded</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold gap-2">
                    <X className="w-4 h-4" /> Reject
                  </Button>
                  <Button className="bg-gold text-black hover:bg-gold/90 font-semibold gap-2">
                    <Calendar className="w-4 h-4" /> Schedule Interview
                  </Button>
                  <a
                    href={`mailto:${selectedCV.email}?subject=Your Application at JBJ Global Real Estate`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 text-gold text-sm font-medium rounded-lg hover:bg-gold/20 transition-colors"
                  >
                    <Mail className="w-4 h-4" /> Contact
                  </a>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChatDashboard;
