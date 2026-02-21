import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Search, Download, MessageCircle, FileText, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDisplayDate } from '@/utils/formatDate';
import { maybeProxyStorageUrl } from '@/utils/downloadProxy';

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

const AdminChatDashboard = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [cvSubmissions, setCvSubmissions] = useState<CVSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
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
        .limit(200),
      supabase
        .from('hr_cv_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
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

  const filteredConversations = conversations.filter(c => {
    const matchSearch = !searchTerm || 
      c.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user_phone?.includes(searchTerm);
    const matchService = filterService === 'all' || c.service_type === filterService;
    return matchSearch && matchService;
  });

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Service', 'Status', 'Rating', 'Created', 'Messages'];
    const rows = filteredConversations.map(c => [
      c.user_name || '',
      c.user_email || '',
      c.user_phone || '',
      c.service_type || '',
      c.status || '',
      c.rating?.toString() || '',
      c.created_at,
      (c.messages?.length || 0).toString(),
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

  const services = [...new Set(conversations.map(c => c.service_type).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chat Conversations</h1>
          <p className="text-sm text-muted-foreground">
            {conversations.length} conversations · {cvSubmissions.length} CV submissions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={tab === 'chats' ? 'default' : 'outline'}
          onClick={() => setTab('chats')}
          className="gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Chat Transcripts
        </Button>
        <Button
          variant={tab === 'cvs' ? 'default' : 'outline'}
          onClick={() => setTab('cvs')}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          CV Submissions ({cvSubmissions.length})
        </Button>
      </div>

      {tab === 'chats' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="h-10 rounded-xl border-2 border-gold/30 bg-background text-foreground px-3 text-sm"
            >
              <option value="all">All Services</option>
              {services.map(s => (
                <option key={s} value={s!}>{s!.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <Button variant="outline" onClick={exportToCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-xl overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                  </TableRow>
                ) : filteredConversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No conversations found</TableCell>
                  </TableRow>
                ) : (
                  filteredConversations.map(c => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedConversation(c)}>
                      <TableCell className="font-medium">{c.user_name || '—'}</TableCell>
                      <TableCell className="text-sm">{c.user_email || '—'}</TableCell>
                      <TableCell className="text-sm">{c.user_phone || '—'}</TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                          {c.service_type?.replace(/_/g, ' ') || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          c.status === 'completed' ? 'bg-green-100 text-green-700' :
                          c.status === 'submitted_to_team' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {c.status || 'active'}
                        </span>
                      </TableCell>
                      <TableCell>{c.rating ? `⭐ ${c.rating}` : '—'}</TableCell>
                      <TableCell>{c.messages?.length || 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDisplayDate(c.created_at)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedConversation(c); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {tab === 'cvs' && (
        <div className="border rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>CV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cvSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No CV submissions yet</TableCell>
                </TableRow>
              ) : (
                cvSubmissions.map(cv => (
                  <TableRow key={cv.id}>
                    <TableCell className="font-medium">{cv.full_name}</TableCell>
                    <TableCell className="text-sm">{cv.email}</TableCell>
                    <TableCell className="text-sm">{cv.phone || '—'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">{cv.status || 'pending'}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDisplayDate(cv.created_at)}</TableCell>
                    <TableCell>
                      {cv.cv_url ? (
                        <a
                          href={maybeProxyStorageUrl(cv.cv_url, `${cv.full_name}_CV.pdf`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Download
                        </a>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Transcript Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedConversation(null)}>
          <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{selectedConversation.user_name || 'Unknown User'}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.user_email} · {selectedConversation.user_phone} · {selectedConversation.service_type?.replace(/_/g, ' ')}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setSelectedConversation(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {(selectedConversation.messages || []).map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary/10 text-foreground rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-[10px] mt-1 opacity-50">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                    </div>
                  </div>
                ))}
                {selectedConversation.rating_feedback && (
                  <div className="text-center text-xs text-muted-foreground border-t pt-3 mt-3">
                    <p>Rating: ⭐ {selectedConversation.rating} · Feedback: {selectedConversation.rating_feedback}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChatDashboard;
