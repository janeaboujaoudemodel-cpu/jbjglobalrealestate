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
  Loader2, Award, Briefcase, ExternalLink, Copy, Send,
  AlertTriangle, Shield, ThumbsUp, ThumbsDown, Zap, Bell,
  ChevronRight, BarChart3, Target
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

interface AISummary {
  summary: string;
  resolution_status: string;
  resolution_explanation?: string;
  sentiment: string;
  sentiment_score: number;
  key_topics: string[];
  user_intent?: string;
  improvement_suggestions: string[];
  priority_level: string;
  priority_reason?: string;
  suggested_reply: string;
  action_items: string[];
  is_lead_opportunity: boolean;
  lead_opportunity_detail?: string;
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
    case 'completed': return { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' };
    case 'submitted_to_team': return { label: 'Submitted', bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-300' };
    case 'closed': return { label: 'Closed', bg: 'bg-stone-200', text: 'text-stone-700', border: 'border-stone-400' };
    default: return { label: 'Active', bg: 'bg-[#F5EBD7]', text: 'text-[#8B7355]', border: 'border-[#C9A84C]/40' };
  }
};

const getPriorityConfig = (level: string) => {
  switch (level) {
    case 'critical': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
    case 'high': return { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' };
    case 'medium': return { icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
    default: return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
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
  const [tab, setTab] = useState<'chats' | 'cvs' | 'alerts'>('chats');
  const [selectedCV, setSelectedCV] = useState<CVSubmission | null>(null);
  const [cvAiLoading, setCvAiLoading] = useState(false);
  const [fallbackMessages, setFallbackMessages] = useState<ChatHistoryMessage[]>([]);
  const [loadingFallback, setLoadingFallback] = useState(false);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

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

  const loadFallbackMessages = useCallback(async (conv: ChatConversation) => {
    if ((conv.messages?.length || 0) > 0) { setFallbackMessages([]); return; }
    setLoadingFallback(true);
    try {
      let query = supabase.from('chat_history').select('*').order('created_at', { ascending: true });
      if (conv.user_email) query = query.eq('user_email', conv.user_email);
      query = query.gte('created_at', conv.created_at);
      if (conv.updated_at) {
        const endTime = new Date(new Date(conv.updated_at).getTime() + 3600000).toISOString();
        query = query.lte('created_at', endTime);
      }
      const { data } = await query.limit(200);
      setFallbackMessages((data || []) as ChatHistoryMessage[]);
    } catch (err) { console.error('Failed to load fallback messages:', err); }
    finally { setLoadingFallback(false); }
  }, []);

  const handleSelectConversation = useCallback((conv: ChatConversation) => {
    setSelectedConversation(conv);
    setAiSummary(null);
    loadFallbackMessages(conv);
  }, [loadFallbackMessages]);

  // AI summarize chat
  const generateAISummary = useCallback(async (conv: ChatConversation, msgs: Array<{role: string; content: string; timestamp?: string}>) => {
    if (msgs.length === 0) { toast.error('No messages to analyze'); return; }
    setAiSummaryLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai-summarizer', {
        body: { messages: msgs, user_name: conv.user_name, service_type: conv.service_type, rating: conv.rating, rating_feedback: conv.rating_feedback },
      });
      if (error) throw error;
      setAiSummary(data as AISummary);
      toast.success('AI analysis complete');
    } catch (err) {
      console.error('AI summary failed:', err);
      toast.error('AI analysis unavailable');
    } finally { setAiSummaryLoading(false); }
  }, []);

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
    } catch (err) { toast.error('AI analysis unavailable'); }
    finally { setCvAiLoading(false); }
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

  // Alerts: conversations needing attention
  const alerts = useMemo(() => {
    return conversations.filter(c => {
      // Low rating
      if (c.rating && c.rating <= 2) return true;
      // Feedback negative
      if (c.feedback_type === 'negative' || c.was_helpful === false) return true;
      // Submitted to team (needs follow-up)
      if (c.status === 'submitted_to_team') return true;
      // Active for more than 24 hours (user may need help)
      const hoursSince = (Date.now() - new Date(c.updated_at).getTime()) / 3600000;
      if (c.status === 'active' && hoursSince > 24) return true;
      return false;
    }).map(c => ({
      ...c,
      alertReason: c.rating && c.rating <= 2 ? 'Low rating - user unsatisfied'
        : c.was_helpful === false ? 'User marked as not helpful'
        : c.status === 'submitted_to_team' ? 'Submitted to team - needs follow-up'
        : 'Active for 24h+ - potential lead at risk',
      alertLevel: (c.rating && c.rating <= 2) || c.was_helpful === false ? 'critical' as const
        : c.status === 'submitted_to_team' ? 'high' as const
        : 'medium' as const,
    }));
  }, [conversations]);

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

  const displayMessages = useMemo(() => {
    if (!selectedConversation) return [];
    if ((selectedConversation.messages?.length || 0) > 0) return selectedConversation.messages!;
    return fallbackMessages.map(m => ({ role: m.role, content: m.message, timestamp: m.created_at }));
  }, [selectedConversation, fallbackMessages]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const renderScoreBar = (score: number, max = 10) => {
    const pct = (score / max) * 100;
    const color = score >= 8 ? 'bg-emerald-500' : score >= 5 ? 'bg-[#C9A84C]' : 'bg-red-400';
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm font-bold text-stone-800">{score}/{max}</span>
      </div>
    );
  };

  // Champagne theme classes
  const cardBg = 'bg-gradient-to-br from-[#FDFBF7] via-[#F8F2E8] to-[#F0E8D8]';
  const containerBg = 'bg-gradient-to-b from-[#FDFBF7] via-[#F9F3E9] to-[#F5EBD7]';

  return (
    <div className={`min-h-screen ${containerBg} text-stone-900`}>
      {/* Header - Champagne */}
      <div className="border-b border-[#C9A84C]/25 bg-gradient-to-r from-[#F5EBD7] via-[#FDFBF7] to-[#F5EBD7] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-stone-500 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C9A84C]" />
                  <h1 className="text-xl font-bold text-stone-900">AI Chat Intelligence</h1>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">Conversations, transcripts, CV submissions & alerts</p>
              </div>
            </div>
            <Button onClick={exportToCSV} size="sm" className="bg-gradient-to-r from-[#FDFBF7] to-[#F5EBD7] border border-[#C9A84C]/30 text-stone-700 hover:border-[#C9A84C]/60 gap-2 shadow-sm">
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Stats Cards - clickable */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Chats', value: stats.total, icon: MessageCircle, onClick: () => { setTab('chats'); setFilterStatus('all'); } },
            { label: 'Active', value: stats.active, icon: TrendingUp, onClick: () => { setTab('chats'); setFilterStatus('active'); } },
            { label: 'Submitted', value: stats.submitted, icon: CheckCircle2, onClick: () => { setTab('chats'); setFilterStatus('submitted_to_team'); } },
            { label: 'Rated', value: stats.rated, icon: Star, onClick: () => { setTab('chats'); setFilterStatus('all'); } },
            { label: 'Avg Rating', value: stats.avgRating, icon: Award, onClick: () => { setTab('chats'); } },
            { label: 'CVs Received', value: stats.cvCount, icon: FileText, onClick: () => setTab('cvs') },
          ].map((stat) => (
            <div
              key={stat.label}
              onClick={stat.onClick}
              className={`${cardBg} border border-[#C9A84C]/20 rounded-xl p-4 hover:border-[#C9A84C]/50 hover:shadow-md transition-all cursor-pointer group`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <stat.icon className="w-4 h-4 text-[#C9A84C]/70 group-hover:text-[#C9A84C] transition-colors" />
                <span className="text-[10px] uppercase tracking-widest text-stone-500 font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Alerts Banner */}
        {alerts.length > 0 && (
          <div 
            onClick={() => setTab('alerts')}
            className="flex items-center gap-3 p-3 rounded-xl border border-red-200 bg-red-50/80 cursor-pointer hover:bg-red-50 transition-colors"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="text-sm font-semibold text-red-800">{alerts.length} conversation{alerts.length > 1 ? 's' : ''} need your attention</span>
            <ChevronRight className="w-4 h-4 text-red-400 ml-auto" />
          </div>
        )}

        {/* Tab Buttons - Champagne active */}
        <div className="flex gap-1 bg-[#F0E8D8] rounded-xl p-1.5 w-fit border border-[#C9A84C]/20">
          {([
            { id: 'chats' as const, label: 'Chat Transcripts', icon: MessageCircle },
            { id: 'cvs' as const, label: `CV Submissions (${stats.cvCount})`, icon: FileText },
            { id: 'alerts' as const, label: `Alerts (${alerts.length})`, icon: Bell },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-gradient-to-r from-[#FDFBF7] to-[#F5EBD7] text-stone-900 shadow-md border border-[#C9A84C]/30'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-[#FDFBF7]/50'
              }`}
            >
              <t.icon className={`w-4 h-4 ${tab === t.id ? 'text-[#C9A84C]' : ''}`} /> {t.label}
            </button>
          ))}
        </div>

        {/* ============ CHATS TAB ============ */}
        {tab === 'chats' && (
          <>
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-[#C9A84C]/20 text-stone-900 placeholder:text-stone-400 focus:border-[#C9A84C]/50 focus:ring-[#C9A84C]/20"
                />
              </div>
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="h-10 rounded-lg border border-[#C9A84C]/20 bg-white text-stone-700 pl-3 pr-8 text-sm cursor-pointer hover:border-[#C9A84C]/40 focus:border-[#C9A84C]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/20"
              >
                <option value="all">All Services</option>
                {ALL_SERVICES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 rounded-lg border border-[#C9A84C]/20 bg-white text-stone-700 pl-3 pr-8 text-sm cursor-pointer hover:border-[#C9A84C]/40 focus:border-[#C9A84C]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/20"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="submitted_to_team">Submitted</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#C9A84C] mx-auto" /></div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-16">
                <MessageCircle className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">No conversations found</p>
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
                      className={`${cardBg} hover:shadow-md border border-[#C9A84C]/15 hover:border-[#C9A84C]/40 rounded-xl p-4 cursor-pointer transition-all group`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-[#C9A84C]/70 group-hover:text-[#C9A84C] transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-stone-900 text-sm">{c.user_name || 'Anonymous'}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${sc.bg} ${sc.text} ${sc.border}`}>
                              {sc.label}
                            </span>
                            {c.rating && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-[#C9A84C]">
                                <Star className="w-3 h-3 fill-[#C9A84C]" /> {c.rating}/5
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                            {c.user_email && (
                              <a href={`mailto:${c.user_email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 hover:text-[#C9A84C] underline-offset-2 hover:underline">
                                <Mail className="w-3 h-3" /> {c.user_email}
                              </a>
                            )}
                            {c.user_phone && (
                              <a href={`tel:${c.user_phone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 hover:text-[#C9A84C] underline-offset-2 hover:underline">
                                <Phone className="w-3 h-3" /> {c.user_phone}
                              </a>
                            )}
                          </div>
                          {lastMsg && (
                            <p className="text-xs text-stone-500 mt-2 line-clamp-1">
                              <span className="text-stone-600 font-medium">{lastMsg.role === 'user' ? 'User' : 'AI'}:</span>{' '}
                              {lastMsg.content.slice(0, 120)}
                            </p>
                          )}
                          {msgCount === 0 && (
                            <p className="text-xs text-[#C9A84C]/60 mt-2 italic">Transcript available via history log</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <SI className="w-3.5 h-3.5 text-[#C9A84C]/50" />
                            <span className="text-[10px] text-stone-500">{getServiceLabel(c.service_type)}</span>
                          </div>
                          <span className="text-[10px] text-stone-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {format(new Date(c.created_at), 'dd MMM yyyy')}
                          </span>
                          <span className="text-[10px] text-stone-500 flex items-center gap-1">
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

        {/* ============ ALERTS TAB ============ */}
        {tab === 'alerts' && (
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-stone-500">No alerts - all conversations are healthy</p>
              </div>
            ) : alerts.map(a => {
              const pc = getPriorityConfig(a.alertLevel);
              const PIcon = pc.icon;
              return (
                <div
                  key={a.id}
                  onClick={() => handleSelectConversation(a)}
                  className={`${pc.bg} border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <PIcon className={`w-5 h-5 ${pc.color} shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-stone-900 text-sm">{a.user_name || 'Anonymous'}</span>
                        <Badge variant="outline" className={`text-[10px] ${pc.color} border-current`}>{a.alertLevel}</Badge>
                      </div>
                      <p className="text-xs text-stone-600 mt-1">{a.alertReason}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                        {a.user_email && (
                          <a href={`mailto:${a.user_email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 hover:text-[#C9A84C] hover:underline">
                            <Mail className="w-3 h-3" /> {a.user_email}
                          </a>
                        )}
                        {a.user_phone && (
                          <a href={`tel:${a.user_phone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 hover:text-[#C9A84C] hover:underline">
                            <Phone className="w-3 h-3" /> {a.user_phone}
                          </a>
                        )}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(a.updated_at), 'dd MMM, h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============ CVS TAB ============ */}
        {tab === 'cvs' && (
          <div className="space-y-3">
            {cvSubmissions.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">No CV submissions yet</p>
              </div>
            ) : (
              cvSubmissions.map(cv => (
                <div
                  key={cv.id}
                  onClick={() => setSelectedCV(cv)}
                  className={`${cardBg} border border-[#C9A84C]/15 hover:border-[#C9A84C]/40 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all group hover:shadow-md`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-[#C9A84C]/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900">{cv.full_name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-stone-500">
                      <a href={`mailto:${cv.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 hover:text-[#C9A84C] hover:underline"><Mail className="w-3 h-3" /> {cv.email}</a>
                      {cv.phone && <a href={`tel:${cv.phone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 hover:text-[#C9A84C] hover:underline"><Phone className="w-3 h-3" /> {cv.phone}</a>}
                    </div>
                    {cv.ai_summary && (
                      <p className="text-xs text-stone-500 mt-1.5 line-clamp-1 italic">{cv.ai_summary}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {cv.ai_ranking ? (
                      <Badge className="bg-[#C9A84C]/10 text-[#8B7355] border-[#C9A84C]/30">
                        <Star className="w-3 h-3 mr-1 fill-[#C9A84C] text-[#C9A84C]" /> {cv.ai_ranking}/10
                      </Badge>
                    ) : null}
                    <Badge className={`${cv.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : cv.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-[#F5EBD7] text-[#8B7355] border-[#C9A84C]/30'}`}>
                      {cv.status || 'pending'}
                    </Badge>
                    <span className="text-[10px] text-stone-500">{format(new Date(cv.created_at), 'dd MMM yyyy')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ============ TRANSCRIPT MODAL ============ */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setSelectedConversation(null); setFallbackMessages([]); setAiSummary(null); }}>
          <div className={`${cardBg} border border-[#C9A84C]/25 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b border-[#C9A84C]/15 bg-gradient-to-r from-[#F5EBD7] to-[#FDFBF7] rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#C9A84C]/15 flex items-center justify-center">
                    <User className="w-5 h-5 text-[#C9A84C]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900">{selectedConversation.user_name || 'Anonymous'}</h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {selectedConversation.user_email && (
                        <a href={`mailto:${selectedConversation.user_email}`} className="text-xs text-stone-500 flex items-center gap-1 hover:text-[#C9A84C] hover:underline"><Mail className="w-3 h-3" /> {selectedConversation.user_email}</a>
                      )}
                      {selectedConversation.user_phone && (
                        <a href={`tel:${selectedConversation.user_phone}`} className="text-xs text-stone-500 flex items-center gap-1 hover:text-[#C9A84C] hover:underline"><Phone className="w-3 h-3" /> {selectedConversation.user_phone}</a>
                      )}
                    </div>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => { setSelectedConversation(null); setFallbackMessages([]); setAiSummary(null); }} className="text-stone-400 hover:text-stone-700 hover:bg-stone-200/50">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {(() => { const sc = getStatusConfig(selectedConversation.status); return (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${sc.bg} ${sc.text} ${sc.border}`}>{sc.label}</span>
                ); })()}
                <span className="text-[10px] text-stone-500 flex items-center gap-1">
                  {(() => { const SI = getServiceIcon(selectedConversation.service_type); return <SI className="w-3 h-3 text-[#C9A84C]/60" />; })()}
                  {getServiceLabel(selectedConversation.service_type)}
                </span>
                <span className="text-[10px] text-stone-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {format(new Date(selectedConversation.created_at), 'dd MMM yyyy, h:mm a')}
                </span>
                {selectedConversation.rating && (
                  <span className="text-[10px] text-[#C9A84C] flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-[#C9A84C]" /> {selectedConversation.rating}/5
                  </span>
                )}
              </div>
              {/* AI Analyze button */}
              <div className="mt-3">
                <Button
                  size="sm"
                  onClick={() => generateAISummary(selectedConversation, displayMessages)}
                  disabled={aiSummaryLoading || displayMessages.length === 0}
                  className="bg-gradient-to-r from-[#FDFBF7] to-[#F5EBD7] border border-[#C9A84C]/30 text-stone-700 hover:border-[#C9A84C]/60 text-xs font-semibold gap-1.5 shadow-sm"
                >
                  {aiSummaryLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-[#C9A84C]" />}
                  {aiSummaryLoading ? 'Analyzing...' : 'AI Summarize & Analyze'}
                </Button>
              </div>
            </div>

            {/* AI Summary Panel */}
            {aiSummary && (
              <div className="mx-5 mt-4 p-4 rounded-xl border border-[#C9A84C]/20 bg-gradient-to-br from-[#FDFBF7] to-[#F5EBD7] space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                  <h4 className="text-sm font-bold text-stone-900">AI Intelligence Report</h4>
                </div>
                <p className="text-sm text-stone-700 leading-relaxed">{aiSummary.summary}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-2 rounded-lg bg-white/60 border border-stone-200 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-stone-500">Resolution</p>
                    <p className={`text-xs font-bold ${aiSummary.resolution_status === 'resolved' ? 'text-emerald-700' : aiSummary.resolution_status === 'unresolved' ? 'text-red-600' : 'text-amber-600'}`}>
                      {aiSummary.resolution_status?.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/60 border border-stone-200 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-stone-500">Sentiment</p>
                    <p className={`text-xs font-bold ${aiSummary.sentiment === 'positive' ? 'text-emerald-700' : aiSummary.sentiment === 'negative' ? 'text-red-600' : 'text-stone-600'}`}>
                      {aiSummary.sentiment} ({aiSummary.sentiment_score}%)
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/60 border border-stone-200 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-stone-500">Priority</p>
                    <p className={`text-xs font-bold ${aiSummary.priority_level === 'critical' ? 'text-red-600' : aiSummary.priority_level === 'high' ? 'text-orange-600' : 'text-stone-600'}`}>
                      {aiSummary.priority_level}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/60 border border-stone-200 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-stone-500">Lead</p>
                    <p className={`text-xs font-bold ${aiSummary.is_lead_opportunity ? 'text-emerald-700' : 'text-stone-500'}`}>
                      {aiSummary.is_lead_opportunity ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                {aiSummary.is_lead_opportunity && aiSummary.lead_opportunity_detail && (
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                    <Target className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-800"><strong>Lead Opportunity:</strong> {aiSummary.lead_opportunity_detail}</p>
                  </div>
                )}

                {aiSummary.improvement_suggestions?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-stone-500 mb-1">Improvement Suggestions</p>
                    <ul className="space-y-1">
                      {aiSummary.improvement_suggestions.map((s, i) => (
                        <li key={i} className="text-xs text-stone-600 flex items-start gap-1.5"><Zap className="w-3 h-3 text-[#C9A84C] shrink-0 mt-0.5" /> {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Reply */}
                {aiSummary.suggested_reply && (
                  <div className="p-3 rounded-lg bg-white border border-[#C9A84C]/20">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Suggested Auto-Reply</p>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(aiSummary.suggested_reply)} className="h-6 px-2 text-[10px] text-stone-500 hover:text-[#C9A84C]">
                          <Copy className="w-3 h-3 mr-1" /> Copy
                        </Button>
                        {selectedConversation.user_phone && (
                          <a
                            href={`https://wa.me/${selectedConversation.user_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(aiSummary.suggested_reply)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center h-6 px-2 text-[10px] rounded-md text-emerald-700 hover:bg-emerald-50"
                            onClick={e => e.stopPropagation()}
                          >
                            <Send className="w-3 h-3 mr-1" /> WhatsApp
                          </a>
                        )}
                        {selectedConversation.user_email && (
                          <a
                            href={`mailto:${selectedConversation.user_email}?subject=Re: Your inquiry at JBJ Global Real Estate&body=${encodeURIComponent(aiSummary.suggested_reply)}`}
                            className="inline-flex items-center h-6 px-2 text-[10px] rounded-md text-sky-700 hover:bg-sky-50"
                            onClick={e => e.stopPropagation()}
                          >
                            <Mail className="w-3 h-3 mr-1" /> Email
                          </a>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed italic">"{aiSummary.suggested_reply}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-5 space-y-3">
                {loadingFallback ? (
                  <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#C9A84C] mx-auto" /></div>
                ) : displayMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-sm text-stone-500">No messages recorded for this session</p>
                    <p className="text-xs text-stone-400 mt-1">Messages from future conversations will be saved automatically</p>
                  </div>
                ) : (
                  displayMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role !== 'user' && (
                        <div className="w-7 h-7 rounded-full bg-[#C9A84C]/15 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5 text-[#C9A84C]" />
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        msg.role === 'user'
                          ? 'bg-[#C9A84C]/10 text-stone-900 rounded-br-md border border-[#C9A84C]/20'
                          : 'bg-white text-stone-700 rounded-bl-md border border-stone-200 shadow-sm'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed text-[13px]">{msg.content}</p>
                        {msg.timestamp && (
                          <p className="text-[9px] mt-1.5 text-stone-400">{format(new Date(msg.timestamp), 'h:mm a')}</p>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5 text-stone-500" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                {(selectedConversation.rating || selectedConversation.rating_feedback) && (
                  <div className="border-t border-[#C9A84C]/10 pt-3 mt-4">
                    <div className="bg-[#FDFBF7] rounded-xl p-3 space-y-1 border border-[#C9A84C]/15">
                      {selectedConversation.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="w-3.5 h-3.5 text-[#C9A84C] fill-[#C9A84C]" />
                          <span className="text-xs text-stone-800 font-medium">Rating: {selectedConversation.rating}/5</span>
                        </div>
                      )}
                      {selectedConversation.rating_feedback && <p className="text-xs text-stone-500">"{selectedConversation.rating_feedback}"</p>}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-[#C9A84C]/10 flex items-center justify-between">
              <p className="text-[10px] text-stone-500">
                {displayMessages.length} messages
                {(selectedConversation.messages?.length || 0) === 0 && displayMessages.length > 0 ? ' (from history log)' : ''}
              </p>
              <Button onClick={() => { setSelectedConversation(null); setFallbackMessages([]); setAiSummary(null); }} size="sm" className="bg-gradient-to-r from-[#FDFBF7] to-[#F5EBD7] border border-[#C9A84C]/30 text-stone-700 hover:border-[#C9A84C]/60 text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============ CV VIEWER MODAL ============ */}
      {selectedCV && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto" onClick={() => setSelectedCV(null)}>
          <div className={`${cardBg} border border-[#C9A84C]/25 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col my-4`} onClick={e => e.stopPropagation()}>
            {/* CV Header */}
            <div className="p-5 border-b border-[#C9A84C]/15 bg-gradient-to-r from-[#F5EBD7] to-[#FDFBF7] rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#C9A84C]/15 flex items-center justify-center">
                    <User className="w-7 h-7 text-[#C9A84C]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">{selectedCV.full_name}</h3>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <a href={`mailto:${selectedCV.email}`} className="text-xs text-stone-500 flex items-center gap-1 hover:text-[#C9A84C] hover:underline"><Mail className="w-3 h-3" /> {selectedCV.email}</a>
                      {selectedCV.phone && <a href={`tel:${selectedCV.phone}`} className="text-xs text-stone-500 flex items-center gap-1 hover:text-[#C9A84C] hover:underline"><Phone className="w-3 h-3" /> {selectedCV.phone}</a>}
                      <span className="text-xs text-stone-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(selectedCV.created_at), 'dd MMM yyyy')}</span>
                      <Badge className="bg-[#F5EBD7] text-[#8B7355] border-[#C9A84C]/30 text-[10px]">Source: Chat Widget</Badge>
                    </div>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setSelectedCV(null)} className="text-stone-400 hover:text-stone-700 hover:bg-stone-200/50">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* AI Analysis Section */}
              <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5EBD7] border border-[#C9A84C]/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                    <h4 className="text-sm font-semibold text-stone-900">AI Analysis</h4>
                  </div>
                  {!selectedCV.ai_summary && (
                    <Button
                      size="sm"
                      onClick={() => generateCVSummary(selectedCV)}
                      disabled={cvAiLoading}
                      className="bg-gradient-to-r from-[#FDFBF7] to-[#F5EBD7] border border-[#C9A84C]/30 text-stone-700 hover:border-[#C9A84C]/60 text-xs font-semibold gap-1 shadow-sm"
                    >
                      {cvAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-[#C9A84C]" />}
                      {cvAiLoading ? 'Analyzing...' : 'Generate AI Summary'}
                    </Button>
                  )}
                </div>
                {selectedCV.ai_summary ? (
                  <>
                    <p className="text-sm text-stone-700 leading-relaxed">{selectedCV.ai_summary}</p>
                    {selectedCV.ai_ranking ? (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1.5">Relevance Score</p>
                        {renderScoreBar(selectedCV.ai_ranking)}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="text-xs text-stone-500 italic">Click "Generate AI Summary" to analyze this CV</p>
                )}
              </div>

              {/* PDF Preview - Using object tag and Google Docs viewer to avoid Chrome blocking */}
              {selectedCV.cv_url ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-2"><FileText className="w-4 h-4 text-[#C9A84C]" /> CV Document</h4>
                    <div className="flex gap-2">
                      <a
                        href={selectedCV.cv_url}
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-lg transition-colors border border-stone-200"
                      >
                        <Download className="w-3 h-3" /> Download
                      </a>
                      {selectedCV.phone && (
                        <a
                          href={`https://wa.me/${selectedCV.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${selectedCV.full_name}, regarding your CV submission to JBJ Global Real Estate...`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg transition-colors border border-emerald-200"
                        >
                          <Send className="w-3 h-3" /> WhatsApp
                        </a>
                      )}
                      <a
                        href={`mailto:${selectedCV.email}?subject=Your CV Submission - JBJ Global Real Estate`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-medium rounded-lg transition-colors border border-sky-200"
                      >
                        <Mail className="w-3 h-3" /> Email
                      </a>
                    </div>
                  </div>
                  <div className="border border-[#C9A84C]/15 rounded-xl overflow-hidden bg-white">
                    {/* Use Google Docs Viewer to avoid Chrome blocking */}
                    <iframe
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedCV.cv_url)}&embedded=true`}
                      className="w-full h-[600px]"
                      title={`CV - ${selectedCV.full_name}`}
                      sandbox="allow-scripts allow-same-origin allow-popups"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-[#FDFBF7] rounded-xl border border-stone-200">
                  <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm text-stone-500">No CV file uploaded</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </Button>
                <Button className="bg-red-500 hover:bg-red-600 text-white font-semibold gap-2">
                  <X className="w-4 h-4" /> Reject
                </Button>
                <Button className="bg-gradient-to-r from-[#FDFBF7] to-[#F5EBD7] border border-[#C9A84C]/30 text-stone-700 hover:border-[#C9A84C]/60 font-semibold gap-2 shadow-sm">
                  <Calendar className="w-4 h-4 text-[#C9A84C]" /> Schedule Interview
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChatDashboard;
