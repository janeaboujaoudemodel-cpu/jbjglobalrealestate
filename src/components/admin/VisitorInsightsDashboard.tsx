import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Eye, MousePointer, Download, Upload, FileText, Clock, Globe,
  Smartphone, Monitor, Search, RefreshCw, ChevronRight, Activity,
  MapPin, Mail, Phone, Calendar, Filter, ArrowUpDown, ExternalLink,
  ArrowLeft, Star,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
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

// Plaintext PII columns (full_name, email, phone) have been removed from
// contact_gating_submissions — access encrypted values via decrypt RPC only.
interface ContactSubmission {
  id: string;
  session_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  location: string | null;
  preferred_language: string | null;
  service_interest: string | null;
  created_at: string;
}

// Grouped visitor: multiple sessions per user
interface GroupedVisitor {
  key: string; // user_id or contact email or first session_id
  displayName: string;
  email: string | null;
  phone: string | null;
  userId: string | null;
  sessions: VisitorSession[];
  totalTimeSpent: number;
  totalPages: number;
  lastActivity: string;
  firstVisit: string;
  isConverted: boolean;
  city: string | null;
  country: string | null;
  deviceTypes: string[];
}

const VisitorInsightsDashboard = () => {
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<GroupedVisitor | null>(null);
  const [selectedSessionEvents, setSelectedSessionEvents] = useState<VisitorEvent[]>([]);
  const [selectedSessionDocs, setSelectedSessionDocs] = useState<VisitorDocument[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDevice, setFilterDevice] = useState<string>('all');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'visitors' | 'contacts'>('visitors');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, contactsRes] = await Promise.all([
        supabase.from('visitor_sessions').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('contact_gating_submissions').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      if (sessionsRes.error) throw sessionsRes.error;
      if (contactsRes.error) throw contactsRes.error;
      setSessions(sessionsRes.data || []);
      setContacts(contactsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch visitor data');
    } finally {
      setLoading(false);
    }
  };

  // Group sessions by user
  const groupedVisitors = useMemo<GroupedVisitor[]>(() => {
    const map = new Map<string, VisitorSession[]>();
    const contactMap = new Map<string, ContactSubmission>();
    
    // Build contact lookup by session_id
    contacts.forEach(c => contactMap.set(c.session_id, c));

    sessions.forEach(session => {
      // Group key: prefer user_id, then contact email, then session contact email
      const contactInfo = session.contact_details as any;
      const contact = contactMap.get(session.session_id);
      const key = session.user_id || contact?.email || contactInfo?.email || session.session_id;
      
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(session);
    });

    return Array.from(map.entries()).map(([key, userSessions]) => {
      const sortedSessions = userSessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latestSession = sortedSessions[0];
      const contactInfo = latestSession.contact_details as any;
      const contact = contacts.find(c => userSessions.some(s => s.session_id === c.session_id));

      return {
        key,
        displayName: contact?.full_name || contactInfo?.name || (latestSession.user_id ? `User ${latestSession.user_id.slice(0, 8)}` : 'Anonymous Visitor'),
        email: contact?.email || contactInfo?.email || null,
        phone: contact?.phone || contactInfo?.phone || null,
        userId: latestSession.user_id,
        sessions: sortedSessions,
        totalTimeSpent: userSessions.reduce((sum, s) => sum + (s.total_time_spent || 0), 0),
        totalPages: userSessions.reduce((sum, s) => sum + (s.pages_visited || 0), 0),
        lastActivity: sortedSessions[0].last_activity_at || sortedSessions[0].created_at,
        firstVisit: sortedSessions[sortedSessions.length - 1].created_at,
        isConverted: userSessions.some(s => s.is_converted),
        city: latestSession.city,
        country: latestSession.country,
        deviceTypes: [...new Set(userSessions.map(s => s.device_type || 'unknown'))],
      };
    }).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }, [sessions, contacts]);

  const filteredVisitors = useMemo(() => {
    return groupedVisitors.filter(v => {
      const matchesSearch = searchQuery === '' ||
        v.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.phone?.includes(searchQuery));
      const matchesDevice = filterDevice === 'all' || v.deviceTypes.includes(filterDevice);
      return matchesSearch && matchesDevice;
    });
  }, [groupedVisitors, searchQuery, filterDevice]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact =>
      (contact.full_name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.phone ?? '').includes(searchQuery)
    );
  }, [contacts, searchQuery]);

  const openVisitorDetail = (visitor: GroupedVisitor) => {
    setSelectedVisitor(visitor);
    setSelectedSessionId(null);
    setSelectedSessionEvents([]);
    setSelectedSessionDocs([]);
    setShowDetailDialog(true);
  };

  const loadSessionDetails = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    try {
      const [eventsRes, docsRes] = await Promise.all([
        supabase.from('visitor_events').select('*').eq('session_id', sessionId).order('created_at', { ascending: true }),
        supabase.from('visitor_documents').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }),
      ]);
      setSelectedSessionEvents(eventsRes.data || []);
      setSelectedSessionDocs(docsRes.data || []);
    } catch (error) {
      console.error('Error fetching session details:', error);
    }
  };

  const stats = useMemo(() => ({
    totalVisitors: groupedVisitors.length,
    totalSessions: sessions.length,
    totalContacts: contacts.length,
    mobileUsers: groupedVisitors.filter(v => v.deviceTypes.includes('mobile')).length,
    avgTimeSpent: groupedVisitors.length > 0 ? groupedVisitors.reduce((a, v) => a + v.totalTimeSpent, 0) / groupedVisitors.length : 0,
    convertedVisitors: groupedVisitors.filter(v => v.isConverted).length,
  }), [groupedVisitors, sessions, contacts]);

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': case 'tablet': return <Smartphone className="h-4 w-4" />;
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
      case 'click': return <MousePointer className="h-3 w-3 text-[color:var(--emerald-1)]" />;
      case 'download': return <Download className="h-3 w-3 text-purple-600" />;
      case 'upload': return <Upload className="h-3 w-3 text-orange-600" />;
      case 'form_submit': return <FileText className="h-3 w-3 text-[#1A1A1A]" />;
      default: return <Activity className="h-3 w-3 text-[#1A1A1A]/50" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-3">
            <Eye className="h-7 w-7 text-[#1A1A1A]" />
            Visitor Insights
          </h2>
          <p className="text-[#1A1A1A]/60 mt-1">
            {stats.totalVisitors} unique visitors across {stats.totalSessions} sessions
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Unique Visitors', value: stats.totalVisitors, icon: Users, color: 'gold' },
          { label: 'Total Sessions', value: stats.totalSessions, icon: Activity, color: 'blue' },
          { label: 'Contacts', value: stats.totalContacts, icon: Mail, color: 'green' },
          { label: 'Mobile', value: stats.mobileUsers, icon: Smartphone, color: 'purple' },
          { label: 'Avg. Time', value: formatTimeSpent(stats.avgTimeSpent), icon: Clock, color: 'amber' },
          { label: 'Converted', value: stats.convertedVisitors, icon: Star, color: 'emerald' },
        ].map((stat) => (
          <Card key={stat.label} className="jj-card-inner">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 text-${stat.color}-600`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#1A1A1A]">{stat.value}</p>
                  <p className="text-xs text-[#1A1A1A]/60">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="bg-[#FDFBF7]/50 border border-[#B89555]/20">
          <TabsTrigger value="visitors" className="data-[state=active]:bg-[#EFE6D6]">
            <Users className="h-4 w-4 mr-2" />
            Visitors ({groupedVisitors.length})
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-[#EFE6D6]">
            <Mail className="h-4 w-4 mr-2" />
            Contacts ({contacts.length})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/40" />
            <Input
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#FDFBF7] border-[#B89555]/20 text-[#1A1A1A]"
            />
          </div>
          {activeTab === 'visitors' && (
            <div className="flex gap-2">
              {['all', 'desktop', 'mobile', 'tablet'].map((device) => (
                <Button key={device} variant={filterDevice === device ? 'default' : 'outline'} size="sm"
                  onClick={() => setFilterDevice(device)}
                  className={filterDevice === device ? 'bg-[#EFE6D6] text-[#1A1A1A]' : 'border-[#B89555]/30 text-[#1A1A1A]/70'}>
                  {device === 'all' ? 'All' : device.charAt(0).toUpperCase() + device.slice(1)}
                </Button>
              ))}
            </div>
          )}
        </div>

        <TabsContent value="visitors">
          <Card className="jj-card-inner mt-4">
            <CardHeader className="border-b border-[#B89555]/20">
              <CardTitle className="text-[#1A1A1A]">Visitors ({filteredVisitors.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-[#1A1A1A]" />
                  </div>
                ) : filteredVisitors.length === 0 ? (
                  <div className="text-center text-[#1A1A1A]/50 py-8">No visitors found</div>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gradient-to-r from-[#F7F1E6] to-[#ECE2D2]">
                      <tr className="text-left text-[#1A1A1A]/60 text-sm">
                        <th className="p-4">Visitor</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Sessions</th>
                        <th className="p-4">Time Spent</th>
                        <th className="p-4">Pages</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">Last Active</th>
                        <th className="p-4">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVisitors.map((visitor) => (
                        <tr key={visitor.key}
                          className="border-t border-[#B89555]/10 hover:bg-[#EFE6D6]/5 cursor-pointer transition-colors"
                          onClick={() => openVisitorDetail(visitor)}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${visitor.isConverted ? 'jj-emerald-soft' : 'bg-[#EFE6D6]/20'}`}>
                                <Users className={`h-4 w-4 ${visitor.isConverted ? 'text-[color:var(--emerald-1)]' : 'text-[#1A1A1A]'}`} />
                              </div>
                              <div>
                                <p className="text-[#1A1A1A] font-medium text-sm">{visitor.displayName}</p>
                                <div className="flex gap-1">
                                  {visitor.deviceTypes.map(d => (
                                    <span key={d} className="text-[#1A1A1A]/40">{getDeviceIcon(d)}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-0.5 text-sm">
                              {visitor.email && <p className="text-[#1A1A1A]/70 truncate max-w-[180px]">{visitor.email}</p>}
                              {visitor.phone && <p className="text-[#1A1A1A]/50">{visitor.phone}</p>}
                              {!visitor.email && !visitor.phone && <p className="text-[#1A1A1A]/30 italic">No contact</p>}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              {visitor.sessions.length} session{visitor.sessions.length > 1 ? 's' : ''}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className="text-[#1A1A1A] font-medium">{formatTimeSpent(visitor.totalTimeSpent)}</span>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary" className="bg-[#EFE6D6]/10 text-[#1A1A1A]/70">
                              {visitor.totalPages} pages
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-[#1A1A1A]/60 text-sm">
                              <MapPin className="h-3 w-3" />
                              {visitor.city || visitor.country || 'Unknown'}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-[#1A1A1A]/60">
                              {formatDistanceToNow(new Date(visitor.lastActivity), { addSuffix: true })}
                            </div>
                          </td>
                          <td className="p-4">
                            <Button size="sm" variant="ghost" className="text-[#1A1A1A] hover:text-[#1A1A1A]">
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
            <CardHeader className="border-b border-[#B89555]/20">
              <CardTitle className="text-[#1A1A1A]">Contact Submissions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-[#1A1A1A]" />
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center text-[#1A1A1A]/50 py-8">No contact submissions found</div>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gradient-to-r from-[#F7F1E6] to-[#ECE2D2]">
                      <tr className="text-left text-[#1A1A1A]/60 text-sm">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4">Nationality</th>
                        <th className="p-4">Interest</th>
                        <th className="p-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.map((contact) => (
                        <tr key={contact.id} className="border-t border-[#B89555]/10 hover:bg-[#EFE6D6]/5">
                          <td className="p-4"><p className="text-[#1A1A1A] font-medium">{contact.full_name}</p></td>
                          <td className="p-4"><a href={`mailto:${contact.email}`} className="text-[#1A1A1A] hover:underline text-sm">{contact.email}</a></td>
                          <td className="p-4"><a href={`tel:${contact.phone}`} className="text-[#1A1A1A]/70 hover:text-[#1A1A1A] text-sm">{contact.phone}</a></td>
                          <td className="p-4"><span className="text-[#1A1A1A]/60 text-sm">{contact.nationality || 'N/A'}</span></td>
                          <td className="p-4"><Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A]/80 border-[#B89555]/30">{contact.service_interest || 'General'}</Badge></td>
                          <td className="p-4"><div className="text-sm text-[#1A1A1A]/60">{format(new Date(contact.created_at), 'MMM d, yyyy')}</div></td>
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

      {/* Visitor Detail Dialog - Drill-down */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl bg-gradient-to-br from-[#F7F1E6] to-[#ECE2D2] border-[#B89555]/30 max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#1A1A1A]" />
              {selectedVisitor?.displayName}
              {selectedVisitor?.isConverted && (
                <Badge className="jj-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30 ml-2">Converted</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedVisitor && (
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
              {/* Visitor summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-[#FDFBF7]/60 rounded-lg">
                  <p className="text-[#1A1A1A]/50 text-xs">Email</p>
                  <p className="text-[#1A1A1A] font-medium text-sm truncate">{selectedVisitor.email || 'Unknown'}</p>
                </div>
                <div className="p-3 bg-[#FDFBF7]/60 rounded-lg">
                  <p className="text-[#1A1A1A]/50 text-xs">Phone</p>
                  <p className="text-[#1A1A1A] font-medium text-sm">{selectedVisitor.phone || 'Unknown'}</p>
                </div>
                <div className="p-3 bg-[#FDFBF7]/60 rounded-lg">
                  <p className="text-[#1A1A1A]/50 text-xs">Total Time</p>
                  <p className="text-[#1A1A1A] font-medium text-sm">{formatTimeSpent(selectedVisitor.totalTimeSpent)}</p>
                </div>
                <div className="p-3 bg-[#FDFBF7]/60 rounded-lg">
                  <p className="text-[#1A1A1A]/50 text-xs">Location</p>
                  <p className="text-[#1A1A1A] font-medium text-sm">{selectedVisitor.city || selectedVisitor.country || 'Unknown'}</p>
                </div>
              </div>

              {/* Sessions list */}
              <Card className="bg-[#FDFBF7]/50 border-[#B89555]/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#1A1A1A]/60">
                    Sessions ({selectedVisitor.sessions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedVisitor.sessions.map((session) => (
                    <div key={session.id}
                      onClick={() => loadSessionDetails(session.session_id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
 selectedSessionId === session.session_id
 ? 'bg-[#EFE6D6]/10 border-[#B89555]/40'
 : 'bg-[#FDFBF7]/30 border-[#B89555]/10 hover:border-[#B89555]/30'
 }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getDeviceIcon(session.device_type || 'desktop')}
                          <div>
                            <p className="text-[#1A1A1A] font-medium text-sm">
                              {format(new Date(session.created_at), 'MMM d, yyyy HH:mm')}
                            </p>
                            <p className="text-[#1A1A1A]/50 text-xs">
                              {session.pages_visited || 0} pages · {formatTimeSpent(session.total_time_spent)} · {session.browser || 'Unknown browser'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.is_converted && (
                            <Badge variant="outline" className="text-xs border-[color:var(--emerald-1)]/30 text-[color:var(--emerald-1)] jj-emerald-soft">Converted</Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-[#1A1A1A]/30" />
                        </div>
                      </div>
                      {session.landing_page && (
                        <p className="text-[#1A1A1A]/40 text-xs mt-1 truncate">Landing: {session.landing_page}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Session detail: events + documents */}
              {selectedSessionId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-[#FDFBF7]/50 border-[#B89555]/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-[#1A1A1A]/60">Event Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        {selectedSessionEvents.length === 0 ? (
                          <p className="text-[#1A1A1A]/50 text-sm">No events recorded</p>
                        ) : (
                          <div className="space-y-3">
                            {selectedSessionEvents.map((event) => (
                              <div key={event.id} className="flex items-start gap-3 text-sm">
                                <div className="mt-1">{getEventIcon(event.event_type)}</div>
                                <div className="flex-1">
                                  <p className="text-[#1A1A1A] font-medium">{event.event_name}</p>
                                  {event.page_path && <p className="text-[#1A1A1A]/50 text-xs">{event.page_path}</p>}
                                  <p className="text-[#1A1A1A]/40 text-xs">{format(new Date(event.created_at), 'HH:mm:ss')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#FDFBF7]/50 border-[#B89555]/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-[#1A1A1A]/60">Documents Accessed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedSessionDocs.length === 0 ? (
                        <p className="text-[#1A1A1A]/50 text-sm">No documents accessed</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedSessionDocs.map((doc) => (
                            <div key={doc.id} className="flex items-center gap-2 text-sm">
                              <FileText className="h-4 w-4 text-[#1A1A1A]" />
                              <span className="text-[#1A1A1A]">{doc.document_name}</span>
                              <Badge variant="outline" className="text-xs">{doc.action}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisitorInsightsDashboard;