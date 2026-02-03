import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Eye,
  MousePointer,
  Download,
  Upload,
  FileText,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Search,
  RefreshCw,
  ChevronRight,
  Activity,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Filter,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface VisitorSession {
  id: string;
  session_id: string;
  browser: string | null;
  device_type: string | null;
  os: string | null;
  referrer: string | null;
  landing_page: string | null;
  pages_visited: number | null;
  total_time_spent: number | null;
  user_id: string | null;
  city: string | null;
  country: string | null;
  contact_details: any;
  is_bounced: boolean | null;
  is_converted: boolean | null;
  created_at: string;
  last_activity_at: string;
}

interface VisitorEvent {
  id: string;
  session_id: string;
  event_type: string;
  event_name: string;
  event_data: any;
  page_path: string | null;
  element_id: string | null;
  element_class: string | null;
  element_text: string | null;
  created_at: string;
}

interface VisitorDocument {
  id: string;
  session_id: string;
  document_type: string;
  document_name: string | null;
  document_url: string | null;
  action: string;
  file_size: number | null;
  created_at: string;
}

interface ContactSubmission {
  id: string;
  session_id: string;
  full_name: string;
  email: string;
  phone: string;
  nationality: string | null;
  location: string | null;
  preferred_language: string | null;
  service_interest: string | null;
  created_at: string;
}

const VisitorInsightsDashboard = () => {
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [selectedSession, setSelectedSession] = useState<VisitorSession | null>(null);
  const [sessionEvents, setSessionEvents] = useState<VisitorEvent[]>([]);
  const [sessionDocuments, setSessionDocuments] = useState<VisitorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDevice, setFilterDevice] = useState<string>('all');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'contacts'>('sessions');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('visitor_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      // Fetch contact submissions
      const { data: contactsData, error: contactsError } = await supabase
        .from('contact_gating_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch visitor data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetails = async (session: VisitorSession) => {
    setSelectedSession(session);
    setShowDetailDialog(true);

    try {
      // Fetch events
      const { data: events } = await supabase
        .from('visitor_events')
        .select('*')
        .eq('session_id', session.session_id)
        .order('created_at', { ascending: true });

      setSessionEvents(events || []);

      // Fetch documents
      const { data: docs } = await supabase
        .from('visitor_documents')
        .select('*')
        .eq('session_id', session.session_id)
        .order('created_at', { ascending: false });

      setSessionDocuments(docs || []);
    } catch (error) {
      console.error('Error fetching session details:', error);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const contactInfo = session.contact_details as any;
    const matchesSearch = 
      session.session_id.includes(searchQuery) ||
      (contactInfo?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contactInfo?.email?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDevice = filterDevice === 'all' || session.device_type === filterDevice;
    
    return matchesSearch && matchesDevice;
  });

  const filteredContacts = contacts.filter(contact => {
    return contact.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           contact.phone.includes(searchQuery);
  });

  const stats = {
    totalSessions: sessions.length,
    totalContacts: contacts.length,
    mobileUsers: sessions.filter(s => s.device_type === 'mobile').length,
    avgTimeSpent: sessions.reduce((acc, s) => acc + (s.total_time_spent || 0), 0) / sessions.length || 0,
  };

  const getDeviceIcon = (device: string | null) => {
    switch (device) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Smartphone className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const formatTimeSpent = (seconds: number | null) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'page_view': return <Eye className="h-3 w-3 text-blue-600" />;
      case 'click': return <MousePointer className="h-3 w-3 text-green-600" />;
      case 'download': return <Download className="h-3 w-3 text-purple-600" />;
      case 'upload': return <Upload className="h-3 w-3 text-orange-600" />;
      case 'form_submit': return <FileText className="h-3 w-3 text-gold" />;
      default: return <Activity className="h-3 w-3 text-black/50" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black flex items-center gap-3">
            <Eye className="h-7 w-7 text-gold" />
            Visitor Insights
          </h2>
          <p className="text-black/60 mt-1">Track every visitor action, download, and behavior</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="border-gold/30 text-black hover:bg-gold/10">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats - Champagne styling */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="jj-card-inner">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="jj-icon-box-active w-12 h-12">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{stats.totalSessions}</p>
                <p className="text-sm text-black/60">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="jj-card-inner">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{stats.totalContacts}</p>
                <p className="text-sm text-black/60">Contact Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="jj-card-inner">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{stats.mobileUsers}</p>
                <p className="text-sm text-black/60">Mobile Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="jj-card-inner">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{formatTimeSpent(stats.avgTimeSpent)}</p>
                <p className="text-sm text-black/60">Avg. Time Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sessions' | 'contacts')}>
        <TabsList className="bg-white/50 border border-gold/20">
          <TabsTrigger value="sessions" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            <Activity className="h-4 w-4 mr-2" />
            Sessions ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            <Users className="h-4 w-4 mr-2" />
            Contacts ({contacts.length})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
            <Input
              placeholder={activeTab === 'sessions' ? "Search sessions..." : "Search by name, email, phone..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gold/20 text-black"
            />
          </div>
          {activeTab === 'sessions' && (
            <div className="flex gap-2">
              {['all', 'desktop', 'mobile', 'tablet'].map((device) => (
                <Button
                  key={device}
                  variant={filterDevice === device ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterDevice(device)}
                  className={filterDevice === device ? 'bg-gold text-black' : 'border-gold/30 text-black/70'}
                >
                  {device === 'all' ? 'All' : device.charAt(0).toUpperCase() + device.slice(1)}
                </Button>
              ))}
            </div>
          )}
        </div>

        <TabsContent value="sessions">
          <Card className="jj-card-inner mt-4">
            <CardHeader className="border-b border-gold/20">
              <CardTitle className="text-black">Recent Visitor Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-gold" />
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="text-center text-black/50 py-8">No visitor sessions found</div>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gradient-to-r from-[#F5EBD7] to-[#E8DCC8]">
                      <tr className="text-left text-black/60 text-sm">
                        <th className="p-4">Session ID</th>
                        <th className="p-4">Device</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">Time Spent</th>
                        <th className="p-4">Pages</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((session) => (
                        <tr 
                          key={session.id} 
                          className="border-t border-gold/10 hover:bg-gold/5 cursor-pointer"
                          onClick={() => fetchSessionDetails(session)}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                                <Users className="h-4 w-4 text-gold" />
                              </div>
                              <div>
                                <p className="text-black font-mono text-sm">
                                  {session.session_id.slice(0, 16)}...
                                </p>
                                {session.is_converted && (
                                  <Badge variant="outline" className="text-xs border-green-500 text-green-600 bg-green-50">
                                    Converted
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-black/70">
                              {getDeviceIcon(session.device_type)}
                              <span className="capitalize">{session.device_type || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-black/60 text-sm">
                              <MapPin className="h-3 w-3" />
                              {session.city || session.country || 'Unknown'}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-black/70">{formatTimeSpent(session.total_time_spent)}</span>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary" className="bg-gold/10 text-black/70">
                              {session.pages_visited || 0} pages
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-black/60">
                              {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                            </div>
                          </td>
                          <td className="p-4">
                            <Button size="sm" variant="ghost" className="text-gold hover:text-gold/80">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card className="jj-card-inner mt-4">
            <CardHeader className="border-b border-gold/20">
              <CardTitle className="text-black">Contact Submissions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-gold" />
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center text-black/50 py-8">No contact submissions found</div>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gradient-to-r from-[#F5EBD7] to-[#E8DCC8]">
                      <tr className="text-left text-black/60 text-sm">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4">Nationality</th>
                        <th className="p-4">Interest</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.map((contact) => (
                        <tr key={contact.id} className="border-t border-gold/10 hover:bg-gold/5">
                          <td className="p-4">
                            <p className="text-black font-medium">{contact.full_name}</p>
                          </td>
                          <td className="p-4">
                            <a href={`mailto:${contact.email}`} className="text-gold hover:underline text-sm">
                              {contact.email}
                            </a>
                          </td>
                          <td className="p-4">
                            <a href={`tel:${contact.phone}`} className="text-black/70 hover:text-gold text-sm">
                              {contact.phone}
                            </a>
                          </td>
                          <td className="p-4">
                            <span className="text-black/60 text-sm">{contact.nationality || 'N/A'}</span>
                          </td>
                          <td className="p-4">
                            <Badge className="bg-gold/20 text-black/80 border-gold/30">
                              {contact.service_interest || 'General'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-black/60">
                              {format(new Date(contact.created_at), 'MMM d, yyyy')}
                            </div>
                          </td>
                          <td className="p-4">
                            <Button size="sm" variant="ghost" className="text-gold">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Session Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-gold/30">
          <DialogHeader>
            <DialogTitle className="text-black flex items-center gap-2">
              <Eye className="h-5 w-5 text-gold" />
              Session Details
            </DialogTitle>
          </DialogHeader>

          {selectedSession && (
            <div className="grid grid-cols-2 gap-6">
              {/* Session Info */}
              <div className="space-y-4">
                <Card className="bg-white/50 border-gold/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-black/60">Session Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-black/60">Session ID:</span>
                      <span className="text-black font-mono">{selectedSession.session_id.slice(0, 20)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">Device:</span>
                      <span className="text-black capitalize">{selectedSession.device_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">Browser:</span>
                      <span className="text-black">{selectedSession.browser || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">OS:</span>
                      <span className="text-black">{selectedSession.os || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">Location:</span>
                      <span className="text-black">{selectedSession.city}, {selectedSession.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">Time Spent:</span>
                      <span className="text-black">{formatTimeSpent(selectedSession.total_time_spent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">Pages Visited:</span>
                      <span className="text-black">{selectedSession.pages_visited}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Documents */}
                <Card className="bg-white/50 border-gold/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-black/60">Documents Accessed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sessionDocuments.length === 0 ? (
                      <p className="text-black/50 text-sm">No documents accessed</p>
                    ) : (
                      <div className="space-y-2">
                        {sessionDocuments.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-gold" />
                            <span className="text-black">{doc.document_name}</span>
                            <Badge variant="outline" className="text-xs">{doc.action}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Event Timeline */}
              <div>
                <Card className="bg-white/50 border-gold/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-black/60">Event Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {sessionEvents.length === 0 ? (
                        <p className="text-black/50 text-sm">No events recorded</p>
                      ) : (
                        <div className="space-y-3">
                          {sessionEvents.map((event) => (
                            <div key={event.id} className="flex items-start gap-3 text-sm">
                              <div className="mt-1">{getEventIcon(event.event_type)}</div>
                              <div className="flex-1">
                                <p className="text-black font-medium">{event.event_name}</p>
                                {event.page_path && (
                                  <p className="text-black/50 text-xs">{event.page_path}</p>
                                )}
                                <p className="text-black/40 text-xs">
                                  {format(new Date(event.created_at), 'HH:mm:ss')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisitorInsightsDashboard;