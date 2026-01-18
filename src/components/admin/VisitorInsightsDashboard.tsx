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
      case 'page_view': return <Eye className="h-3 w-3 text-blue-500" />;
      case 'click': return <MousePointer className="h-3 w-3 text-green-500" />;
      case 'download': return <Download className="h-3 w-3 text-purple-500" />;
      case 'upload': return <Upload className="h-3 w-3 text-orange-500" />;
      case 'form_submit': return <FileText className="h-3 w-3 text-gold" />;
      default: return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Eye className="h-7 w-7 text-gold" />
            Visitor Insights
          </h2>
          <p className="text-gray-400 mt-1">Track every visitor action, download, and behavior</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="border-zinc-700">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-gold" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
                <p className="text-sm text-gray-400">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalContacts}</p>
                <p className="text-sm text-gray-400">Contact Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.mobileUsers}</p>
                <p className="text-sm text-gray-400">Mobile Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-white">{formatTimeSpent(stats.avgTimeSpent)}</p>
                <p className="text-sm text-gray-400">Avg. Time Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sessions' | 'contacts')}>
        <TabsList className="bg-zinc-800 border border-zinc-700">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={activeTab === 'sessions' ? "Search sessions..." : "Search by name, email, phone..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-700 text-white"
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
                  className={filterDevice === device ? 'bg-gold text-black' : 'border-zinc-700 text-gray-300'}
                >
                  {device === 'all' ? 'All' : device.charAt(0).toUpperCase() + device.slice(1)}
                </Button>
              ))}
            </div>
          )}
        </div>

        <TabsContent value="sessions">
          <Card className="bg-zinc-900 border-zinc-800 mt-4">
            <CardHeader className="border-b border-zinc-800">
              <CardTitle className="text-white">Recent Visitor Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-gold" />
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">No visitor sessions found</div>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-zinc-800">
                      <tr className="text-left text-gray-400 text-sm">
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
                          className="border-t border-zinc-800 hover:bg-zinc-800/50 cursor-pointer"
                          onClick={() => fetchSessionDetails(session)}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                                <Users className="h-4 w-4 text-gold" />
                              </div>
                              <div>
                                <p className="text-white font-mono text-sm">
                                  {session.session_id.slice(0, 16)}...
                                </p>
                                {session.is_converted && (
                                  <Badge variant="outline" className="text-xs border-green-500 text-green-500">
                                    Converted
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-gray-300">
                              {getDeviceIcon(session.device_type)}
                              <span className="capitalize">{session.device_type || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-gray-400 text-sm">
                              <MapPin className="h-3 w-3" />
                              {session.city || session.country || 'Unknown'}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-gray-300">{formatTimeSpent(session.total_time_spent)}</span>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary" className="bg-zinc-700">
                              {session.pages_visited || 0} pages
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-400">
                              {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                            </div>
                          </td>
                          <td className="p-4">
                            <Button size="sm" variant="ghost" className="text-gold hover:text-gold-dark">
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
          <Card className="bg-zinc-900 border-zinc-800 mt-4">
            <CardHeader className="border-b border-zinc-800">
              <CardTitle className="text-white">Contact Submissions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-gold" />
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">No contact submissions found</div>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-zinc-800">
                      <tr className="text-left text-gray-400 text-sm">
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
                        <tr key={contact.id} className="border-t border-zinc-800 hover:bg-zinc-800/50">
                          <td className="p-4">
                            <p className="text-white font-medium">{contact.full_name}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-gray-300">{contact.email}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-gray-300">{contact.phone}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-gray-400">{contact.nationality || '-'}</p>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary" className="bg-zinc-700">
                              {contact.service_interest || 'General'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-400">
                              {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true })}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-green-500"
                                onClick={() => window.open(`https://wa.me/${contact.phone.replace(/\D/g, '')}`, '_blank')}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-blue-500"
                                onClick={() => window.open(`mailto:${contact.email}`, '_blank')}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
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
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-gold" />
              Session Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-6">
              {/* Session Info */}
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Session Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Device</p>
                    <p className="text-white font-medium capitalize">{selectedSession.device_type || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Browser</p>
                    <p className="text-white">{selectedSession.browser || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">OS</p>
                    <p className="text-white">{selectedSession.os || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Location</p>
                    <p className="text-white">{selectedSession.city || selectedSession.country || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Landing Page</p>
                    <p className="text-white text-sm">{selectedSession.landing_page || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Referrer</p>
                    <p className="text-white text-sm truncate">{selectedSession.referrer || 'Direct'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Time Spent</p>
                    <p className="text-white">{formatTimeSpent(selectedSession.total_time_spent)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Pages Visited</p>
                    <p className="text-white">{selectedSession.pages_visited || 0}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for Events and Documents */}
              <Tabs defaultValue="events" className="w-full">
                <TabsList className="bg-zinc-800 border border-zinc-700">
                  <TabsTrigger value="events" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                    <Activity className="h-4 w-4 mr-2" />
                    Events ({sessionEvents.length})
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                    <FileText className="h-4 w-4 mr-2" />
                    Documents ({sessionDocuments.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="events" className="mt-4">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {sessionEvents.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">No events recorded</p>
                      ) : (
                        sessionEvents.map((event) => (
                          <div key={event.id} className="flex items-start gap-3 p-3 bg-zinc-800 rounded-lg">
                            <div className="mt-1">{getEventIcon(event.event_type)}</div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-white font-medium">
                                  {event.event_name || event.event_type.replace(/_/g, ' ')}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(event.created_at), 'HH:mm:ss')}
                                </span>
                              </div>
                              {event.page_path && (
                                <p className="text-gray-400 text-sm">{event.page_path}</p>
                              )}
                              {event.element_text && (
                                <p className="text-gray-500 text-xs">Element: {event.element_text}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="documents" className="mt-4">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {sessionDocuments.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">No documents recorded</p>
                      ) : (
                        sessionDocuments.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              {doc.action === 'upload' ? (
                                <Upload className="h-5 w-5 text-orange-500" />
                              ) : (
                                <Download className="h-5 w-5 text-purple-500" />
                              )}
                              <div>
                                <p className="text-white font-medium">{doc.document_name || 'Unknown'}</p>
                                <p className="text-gray-400 text-sm capitalize">{doc.document_type} • {doc.action}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {format(new Date(doc.created_at), 'MMM d, HH:mm')}
                              </span>
                              {doc.document_url && (
                                <Button size="sm" variant="ghost" onClick={() => window.open(doc.document_url!, '_blank')}>
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisitorInsightsDashboard;
