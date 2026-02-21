import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, Search, Download, MessageCircle, FileText, X, Eye, 
  User, Bot, Clock, Star, Phone, Mail, Globe, Filter, 
  ChevronDown, Sparkles, TrendingUp, AlertCircle, CheckCircle2,
  Building2, Home, Scale, Paintbrush, MessageSquare, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDisplayDate } from '@/utils/formatDate';
import { maybeProxyStorageUrl } from '@/utils/downloadProxy';
import { format } from 'date-fns';

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
}

// All service types matching the chat widget
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
    case 'completed': return { label: 'Completed', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' };
    case 'submitted_to_team': return { label: 'Submitted', bg: 'bg-sky-500/15', text: 'text-sky-400', dot: 'bg-sky-400' };
    case 'closed': return { label: 'Closed', bg: 'bg-zinc-500/15', text: 'text-zinc-400', dot: 'bg-zinc-400' };
    default: return { label: 'Active', bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' };
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [chatsRes, cvsRes] = await Promise.all([
      supabase
        .from('chat_conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(500),
      supabase
        .from('hr_cv_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    if (chatsRes.data) {
      setConversations(chatsRes.data.map(c => ({
        ...c,
        messages: c.messages as ChatConversation['messages'],
      })));
    }
    if (cvsRes.data) setCvSubmissions(cvsRes.data as CVSubmission[]);
    setLoading(false);
  };

  const filteredConversations = useMemo(() => conversations.filter(c => {
    const matchSearch = !searchTerm || 
      c.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user_phone?.includes(searchTerm);
    const matchService = filterService === 'all' || c.service_type === filterService;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchService && matchStatus;
  }), [conversations, searchTerm, filterService, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const total = conversations.length;
    const active = conversations.filter(c => c.status === 'active').length;
    const submitted = conversations.filter(c => c.status === 'submitted_to_team').length;
    const rated = conversations.filter(c => c.rating).length;
    const avgRating = rated > 0 
      ? (conversations.reduce((sum, c) => sum + (c.rating || 0), 0) / rated).toFixed(1)
      : '—';
    const withMessages = conversations.filter(c => (c.messages?.length || 0) > 0).length;
    return { total, active, submitted, rated, avgRating, withMessages, cvCount: cvSubmissions.length };
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
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-conversations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gold" />
                  <h1 className="text-xl font-bold text-white">AI Chat Intelligence</h1>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Conversations, transcripts, and CV submissions
                </p>
              </div>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 gap-2">
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Total Chats', value: stats.total, icon: MessageCircle, color: 'text-gold' },
            { label: 'Active', value: stats.active, icon: TrendingUp, color: 'text-amber-400' },
            { label: 'Submitted', value: stats.submitted, icon: CheckCircle2, color: 'text-sky-400' },
            { label: 'With Messages', value: stats.withMessages, icon: MessageSquare, color: 'text-emerald-400' },
            { label: 'Rated', value: stats.rated, icon: Star, color: 'text-yellow-400' },
            { label: 'Avg Rating', value: stats.avgRating, icon: Star, color: 'text-gold' },
            { label: 'CVs Received', value: stats.cvCount, icon: FileText, color: 'text-violet-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900/60 rounded-xl p-1 w-fit border border-zinc-800/60">
          <button
            onClick={() => setTab('chats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'chats'
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Chat Transcripts
          </button>
          <button
            onClick={() => setTab('cvs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'cvs'
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            CV Submissions ({stats.cvCount})
          </button>
        </div>

        {tab === 'chats' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-gold/50 focus:ring-gold/20"
                />
              </div>
              <div className="relative">
                <select
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                  className="h-10 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 pl-3 pr-8 text-sm appearance-none cursor-pointer hover:border-zinc-700 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                >
                  <option value="all">All Services</option>
                  {ALL_SERVICES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-10 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 pl-3 pr-8 text-sm appearance-none cursor-pointer hover:border-zinc-700 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="submitted_to_team">Submitted</option>
                  <option value="completed">Completed</option>
                  <option value="closed">Closed</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* Conversation Cards */}
            {loading ? (
              <div className="text-center py-16 text-zinc-500">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-16">
                <MessageCircle className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No conversations found</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredConversations.map(c => {
                  const statusConf = getStatusConfig(c.status);
                  const ServiceIcon = getServiceIcon(c.service_type);
                  const msgCount = c.messages?.length || 0;
                  const lastMsg = c.messages?.[c.messages.length - 1];
                  
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedConversation(c)}
                      className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700 rounded-xl p-4 cursor-pointer transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-gold/10 transition-colors">
                          <User className="w-5 h-5 text-zinc-400 group-hover:text-gold transition-colors" />
                        </div>
                        
                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">{c.user_name || 'Anonymous'}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConf.bg} ${statusConf.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                              {statusConf.label}
                            </span>
                            {c.rating && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-yellow-400">
                                <Star className="w-3 h-3 fill-yellow-400" /> {c.rating}/5
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                            {c.user_email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {c.user_email}
                              </span>
                            )}
                            {c.user_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {c.user_phone}
                              </span>
                            )}
                          </div>
                          
                          {/* Last message preview */}
                          {lastMsg && (
                            <p className="text-xs text-zinc-500 mt-2 line-clamp-1">
                              <span className="text-zinc-600 font-medium">{lastMsg.role === 'user' ? 'User' : 'AI'}:</span>{' '}
                              {lastMsg.content.slice(0, 120)}{lastMsg.content.length > 120 ? '...' : ''}
                            </p>
                          )}
                        </div>
                        
                        {/* Right side meta */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <ServiceIcon className="w-3.5 h-3.5 text-gold/60" />
                            <span className="text-[10px] text-zinc-500 font-medium">{getServiceLabel(c.service_type)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                            <Clock className="w-3 h-3" />
                            {format(new Date(c.created_at), 'dd MMM yyyy')}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                            <MessageCircle className="w-3 h-3" />
                            {msgCount} msg{msgCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* CV Submissions Tab */}
        {tab === 'cvs' && (
          <div className="space-y-3">
            {cvSubmissions.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No CV submissions yet</p>
              </div>
            ) : (
              cvSubmissions.map(cv => (
                <div key={cv.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{cv.full_name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {cv.email}</span>
                      {cv.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {cv.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 text-[10px] font-medium rounded-full">
                      {cv.status || 'pending'}
                    </span>
                    <span className="text-[10px] text-zinc-600">{format(new Date(cv.created_at), 'dd MMM yyyy')}</span>
                    {cv.cv_url ? (
                      <a
                        href={maybeProxyStorageUrl(cv.cv_url, `${cv.full_name}_CV.pdf`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 hover:bg-gold/20 text-gold text-xs font-medium rounded-lg transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <Download className="w-3 h-3" /> Download CV
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-600">No file</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Transcript Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedConversation(null)}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800/80">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{selectedConversation.user_name || 'Anonymous'}</h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {selectedConversation.user_email && (
                        <span className="text-xs text-zinc-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedConversation.user_email}</span>
                      )}
                      {selectedConversation.user_phone && (
                        <span className="text-xs text-zinc-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedConversation.user_phone}</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setSelectedConversation(null)} className="text-zinc-400 hover:text-white hover:bg-zinc-800 -mt-1 -mr-1">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Meta row */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {(() => { const sc = getStatusConfig(selectedConversation.status); return (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.bg} ${sc.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} /> {sc.label}
                  </span>
                ); })()}
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  {(() => { const SI = getServiceIcon(selectedConversation.service_type); return <SI className="w-3 h-3 text-gold/60" />; })()}
                  {getServiceLabel(selectedConversation.service_type)}
                </span>
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {format(new Date(selectedConversation.created_at), 'dd MMM yyyy, h:mm a')}
                </span>
                {selectedConversation.rating && (
                  <span className="text-[10px] text-yellow-400 flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-yellow-400" /> {selectedConversation.rating}/5
                  </span>
                )}
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-5 space-y-3">
                {(selectedConversation.messages || []).length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">No messages recorded in this session</p>
                    <p className="text-[10px] text-zinc-600 mt-1">Messages will appear here for new conversations</p>
                  </div>
                ) : (
                  (selectedConversation.messages || []).map((msg, i) => (
                    <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role !== 'user' && (
                        <div className="w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5 text-gold" />
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        msg.role === 'user'
                          ? 'bg-gold/15 text-white rounded-br-md'
                          : 'bg-zinc-800/80 text-zinc-200 rounded-bl-md'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed text-[13px]">{msg.content}</p>
                        {msg.timestamp && (
                          <p className="text-[9px] mt-1.5 opacity-40">
                            {format(new Date(msg.timestamp), 'h:mm a')}
                          </p>
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
                
                {/* Feedback section */}
                {(selectedConversation.rating || selectedConversation.rating_feedback) && (
                  <div className="border-t border-zinc-800/60 pt-3 mt-4">
                    <div className="bg-zinc-900/80 rounded-xl p-3 space-y-1">
                      {selectedConversation.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-white font-medium">Rating: {selectedConversation.rating}/5</span>
                        </div>
                      )}
                      {selectedConversation.rating_feedback && (
                        <p className="text-xs text-zinc-400">"{selectedConversation.rating_feedback}"</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800/60 flex items-center justify-between">
              <p className="text-[10px] text-zinc-600">
                {(selectedConversation.messages || []).length} messages · Updated {format(new Date(selectedConversation.updated_at), 'dd MMM, h:mm a')}
              </p>
              <Button onClick={() => setSelectedConversation(null)} size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChatDashboard;
