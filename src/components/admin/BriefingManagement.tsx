import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Calendar, CheckCircle, XCircle, Clock, MapPin, Users, Trophy,
  Search, Eye, Camera, Navigation, Star, MessageCircle, Loader2, Plus, Sparkles
} from 'lucide-react';

interface BriefingRequest {
  id: string;
  developer_name: string;
  project_name: string;
  briefing_date: string;
  briefing_time: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  location_type: string | null;
  location_address: string | null;
  approved_at: string | null;
  calendar_locked: boolean | null;
  broker_list_id: string | null;
  created_at: string;
  uploaded_files: any;
}

interface Attendance {
  id: string;
  briefing_request_id: string;
  broker_id: string;
  rsvp_status: string;
  late_reason: string | null;
  expected_arrival_time: string | null;
  confirmed_attended: boolean;
  selfie_url: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  gps_address: string | null;
  confirmed_at: string | null;
  points_earned: number;
}

interface BrokerList {
  id: string;
  name: string;
  description: string | null;
  broker_ids: string[];
  is_active: boolean;
  created_at: string;
}

interface RepActivity {
  id: string;
  full_name: string;
  developer_name: string;
  activity_score: number;
  total_briefings_hosted: number;
  total_updates_submitted: number;
  response_time_avg_hours: number | null;
  last_active_at: string | null;
  languages: string[];
}

const BriefingManagement = () => {
  const { user } = useAuth();
  const [briefings, setBriefings] = useState<BriefingRequest[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [brokerLists, setBrokerLists] = useState<BrokerList[]>([]);
  const [reps, setReps] = useState<RepActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBriefing, setSelectedBriefing] = useState<BriefingRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [subTab, setSubTab] = useState('calendar');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [bRes, aRes, lRes, rRes] = await Promise.all([
        supabase.from('briefing_requests').select('*').order('briefing_date', { ascending: false }),
        supabase.from('briefing_attendance').select('*'),
        supabase.from('briefing_broker_lists').select('*').order('created_at', { ascending: false }),
        supabase.from('developer_representatives').select('id, full_name, developer_name, activity_score, total_briefings_hosted, total_updates_submitted, response_time_avg_hours, last_active_at, languages').order('activity_score', { ascending: false }),
      ]);
      if (bRes.data) setBriefings(bRes.data as any);
      if (aRes.data) setAttendance(aRes.data as any);
      if (lRes.data) setBrokerLists(lRes.data as any);
      if (rRes.data) setReps(rRes.data as any);
    } catch (err) {
      console.error('Error loading briefing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (briefing: BriefingRequest) => {
    try {
      const { error } = await supabase.from('briefing_requests').update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
        calendar_locked: true,
      } as any).eq('id', briefing.id);
      if (error) throw error;

      await supabase.from('admin_tasks').insert({
        user_id: user?.id,
        title: `📅 Briefing: ${briefing.project_name} — ${briefing.developer_name}`,
        description: `Approved briefing on ${briefing.briefing_date} at ${briefing.briefing_time} (${briefing.duration_minutes} min). Location: ${briefing.location_type === 'developer_office' ? briefing.location_address || 'Developer Office' : 'Our Office'}.`,
        category: 'briefing_approved',
        priority: 'high',
        status: 'pending',
        due_date: briefing.briefing_date,
      } as any);

      if (briefing.broker_list_id) {
        const list = brokerLists.find(l => l.id === briefing.broker_list_id);
        if (list) {
          for (const brokerId of list.broker_ids) {
            try {
              await supabase.from('user_notifications' as any).insert({
                user_id: brokerId,
                type: 'briefing_approved',
                title: `Briefing: ${briefing.project_name}`,
                message: `A briefing for ${briefing.project_name} by ${briefing.developer_name} has been scheduled for ${briefing.briefing_date} at ${briefing.briefing_time}.`,
                is_read: false,
              });
            } catch {}
          }
        }
      }

      toast.success('Briefing approved and locked in calendar');
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (briefing: BriefingRequest) => {
    try {
      const { error } = await supabase.from('briefing_requests').update({ status: 'rejected' } as any).eq('id', briefing.id);
      if (error) throw error;
      toast.success('Briefing rejected');
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    }
  };

  const handleAssignList = async (briefingId: string, listId: string) => {
    try {
      const { error } = await supabase.from('briefing_requests').update({ broker_list_id: listId } as any).eq('id', briefingId);
      if (error) throw error;
      toast.success('Broker list assigned');
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign list');
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) { toast.error('List name required'); return; }
    try {
      const { error } = await supabase.from('briefing_broker_lists').insert({
        name: newListName,
        description: newListDesc || null,
        created_by: user?.id,
        broker_ids: [],
      } as any);
      if (error) throw error;
      toast.success('Broker list created');
      setNewListName('');
      setNewListDesc('');
      setListDialogOpen(false);
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create list');
    }
  };

  const handleAISummary = async (briefing: BriefingRequest) => {
    setAiSummaryLoading(true);
    setAiSummary('');
    try {
      const att = attendance.filter(a => a.briefing_request_id === briefing.id);
      const prompt = `Generate a concise executive briefing summary for the following real estate project briefing session:
Project: ${briefing.project_name}
Developer: ${briefing.developer_name}
Date: ${briefing.briefing_date} at ${briefing.briefing_time}
Duration: ${briefing.duration_minutes} minutes
Location: ${briefing.location_type === 'developer_office' ? `Developer Office — ${briefing.location_address || 'N/A'}` : 'Our Office'}
Notes: ${briefing.notes || 'None'}
Attendance: ${att.length} brokers (${att.filter(a => a.confirmed_attended).length} confirmed)
Status: ${briefing.status}

Provide: 1) Key takeaways 2) Action items 3) Follow-up recommendations. Keep it professional and concise.`;

      const { data, error } = await supabase.functions.invoke('lovable-ai', {
        body: {
          model: 'google/gemini-3-flash-preview',
          messages: [{ role: 'user', content: prompt }],
        },
      });

      if (error) throw error;
      const content = data?.choices?.[0]?.message?.content || 'No summary generated.';
      setAiSummary(content);

      // Save to briefing notes
      await supabase.from('briefing_requests').update({
        notes: `${briefing.notes || ''}\n\n--- AI Summary ---\n${content}`,
      } as any).eq('id', briefing.id);
      toast.success('AI summary generated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate AI summary');
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getBriefingAttendance = (briefingId: string) =>
    attendance.filter(a => a.briefing_request_id === briefingId);

  const responsiveRating = (hours: number | null) => {
    if (hours === null) return { label: 'No Data', color: 'text-muted-foreground' };
    if (hours <= 1) return { label: 'Excellent', color: 'text-emerald-600' };
    if (hours <= 4) return { label: 'Good', color: 'text-blue-600' };
    return { label: 'Slow', color: 'text-red-600' };
  };

  const filteredBriefings = briefings.filter(b =>
    b.developer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.project_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Briefings', value: briefings.length, color: 'text-gold' },
          { label: 'Pending', value: briefings.filter(b => b.status === 'pending').length, color: 'text-amber-600' },
          { label: 'Approved', value: briefings.filter(b => b.status === 'approved').length, color: 'text-emerald-600' },
          { label: 'Broker Lists', value: brokerLists.length, color: 'text-blue-600' },
          { label: 'Active Reps', value: reps.length, color: 'text-purple-600' },
        ].map((s, i) => (
          <Card key={i} className="bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30">
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sub-tabs */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border-2 border-gold/30">
          <TabsTrigger value="calendar" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
            <Calendar className="w-4 h-4 mr-1" /> Briefings
          </TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
            <Eye className="w-4 h-4 mr-1" /> Attendance
          </TabsTrigger>
          <TabsTrigger value="broker-lists" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
            <Users className="w-4 h-4 mr-1" /> Broker Lists
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
            <Trophy className="w-4 h-4 mr-1" /> Rep Leaderboard
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
            <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp Log
          </TabsTrigger>
        </TabsList>

        {/* BRIEFINGS CALENDAR */}
        <TabsContent value="calendar" className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search briefings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gold/20"
              />
            </div>
            <div className="flex gap-2">
              <Badge className="bg-amber-100 text-amber-700">● Pending</Badge>
              <Badge className="bg-emerald-100 text-emerald-700">● Approved</Badge>
              <Badge className="bg-red-100 text-red-700">● Rejected</Badge>
            </div>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredBriefings.map(b => (
                <Card key={b.id} className="bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/20 hover:border-gold/40 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-foreground font-semibold">{b.project_name}</h4>
                          <Badge className={getStatusColor(b.status)}>{b.status}</Badge>
                          {b.calendar_locked && <Badge className="bg-blue-100 text-blue-700 text-[10px]">🔒 Locked</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {b.briefing_date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.briefing_time} ({b.duration_minutes}m)</span>
                          <span>{b.developer_name}</span>
                          {b.location_type && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {b.location_type === 'developer_office' ? 'Dev Office' : 'Our Office'}
                            </span>
                          )}
                        </div>
                        {b.location_address && <p className="text-xs text-muted-foreground mt-1">{b.location_address}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {b.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => handleApprove(b)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                              <CheckCircle className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReject(b)}>
                              <XCircle className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedBriefing(b); setDetailOpen(true); setAiSummary(''); }} className="text-muted-foreground">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {getBriefingAttendance(b.id).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gold/20 flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">Attendance:</span>
                        <Badge className="bg-emerald-100 text-emerald-700">{getBriefingAttendance(b.id).filter(a => a.rsvp_status === 'attending').length} Attending</Badge>
                        <Badge className="bg-amber-100 text-amber-700">{getBriefingAttendance(b.id).filter(a => a.rsvp_status === 'late').length} Late</Badge>
                        <Badge className="bg-blue-100 text-blue-700">{getBriefingAttendance(b.id).filter(a => a.confirmed_attended).length} Confirmed</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {filteredBriefings.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">No briefings found</div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ATTENDANCE */}
        <TabsContent value="attendance" className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {attendance.map(a => {
                const briefing = briefings.find(b => b.id === a.briefing_request_id);
                return (
                  <Card key={a.id} className="bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-foreground font-medium">{briefing?.project_name || 'Unknown'}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <Badge className={a.rsvp_status === 'attending' ? 'bg-emerald-100 text-emerald-700' : a.rsvp_status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                              {a.rsvp_status}
                            </Badge>
                            {a.confirmed_attended && <Badge className="bg-blue-100 text-blue-700">✓ Confirmed</Badge>}
                            {a.late_reason && <span>Late: {a.late_reason}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {a.selfie_url && (
                            <a href={a.selfie_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gold text-xs hover:underline">
                              <Camera className="w-3 h-3" /> Selfie
                            </a>
                          )}
                          {a.gps_latitude && (
                            <a href={`https://maps.google.com/?q=${a.gps_latitude},${a.gps_longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 text-xs hover:underline">
                              <Navigation className="w-3 h-3" /> GPS
                            </a>
                          )}
                          <span className="text-gold font-bold text-sm">+{a.points_earned} pts</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {attendance.length === 0 && <div className="text-center py-12 text-muted-foreground">No attendance records yet</div>}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* BROKER LISTS */}
        <TabsContent value="broker-lists" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-foreground font-semibold">Broker Notification Lists</h3>
            <Button onClick={() => setListDialogOpen(true)} className="bg-gold hover:bg-gold/90 text-black">
              <Plus className="w-4 h-4 mr-1" /> New List
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brokerLists.map(list => (
              <Card key={list.id} className="bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-foreground font-semibold">{list.name}</h4>
                    <Badge className="bg-blue-100 text-blue-700">{list.broker_ids?.length || 0} brokers</Badge>
                  </div>
                  {list.description && <p className="text-xs text-muted-foreground">{list.description}</p>}
                  <p className="text-xs text-muted-foreground mt-2">Created {format(new Date(list.created_at), 'MMM d, yyyy')}</p>
                </CardContent>
              </Card>
            ))}
            {brokerLists.length === 0 && (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                No broker lists created yet. Create one to assign to briefings.
              </div>
            )}
          </div>
        </TabsContent>

        {/* REP LEADERBOARD */}
        <TabsContent value="leaderboard" className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {reps.map((rep, idx) => {
                const rating = responsiveRating(rep.response_time_avg_hours);
                return (
                  <Card key={rep.id} className={`bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 ${idx === 0 ? 'border-gold ring-1 ring-gold/30' : 'border-gold/20'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-gold/20 text-gold' : 'bg-muted text-muted-foreground'}`}>
                            {idx === 0 ? <Trophy className="w-5 h-5" /> : <span className="font-bold">{idx + 1}</span>}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-foreground font-semibold">{rep.full_name}</h4>
                              {idx === 0 && <Star className="w-4 h-4 text-gold fill-gold" />}
                            </div>
                            <p className="text-xs text-muted-foreground">{rep.developer_name}</p>
                            {rep.languages?.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {rep.languages.slice(0, 3).map(l => (
                                  <Badge key={l} className="bg-gold/10 text-gold border border-gold/20 text-[9px]">{l}</Badge>
                                ))}
                                {rep.languages.length > 3 && <Badge className="bg-gold/10 text-gold border border-gold/20 text-[9px]">+{rep.languages.length - 3}</Badge>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <div className="text-gold font-bold text-lg">{rep.activity_score}</div>
                            <p className="text-[10px] text-muted-foreground">Score</p>
                          </div>
                          <div>
                            <div className="text-foreground font-medium">{rep.total_briefings_hosted}</div>
                            <p className="text-[10px] text-muted-foreground">Briefings</p>
                          </div>
                          <div>
                            <div className="text-foreground font-medium">{rep.total_updates_submitted}</div>
                            <p className="text-[10px] text-muted-foreground">Updates</p>
                          </div>
                          <div>
                            <div className={`font-medium ${rating.color}`}>{rating.label}</div>
                            <p className="text-[10px] text-muted-foreground">Response</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {reps.length === 0 && <div className="text-center py-12 text-muted-foreground">No representatives found</div>}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* WHATSAPP LOG */}
        <TabsContent value="whatsapp" className="mt-4">
          <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/20">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                WhatsApp Activity Log (Manual Entry)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WhatsAppLogger reps={reps} onLog={loadAll} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Briefing Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30 text-foreground max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Briefing Details</DialogTitle>
          </DialogHeader>
          {selectedBriefing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">Project</Label><p className="text-foreground font-medium">{selectedBriefing.project_name}</p></div>
                <div><Label className="text-muted-foreground">Developer</Label><p className="text-foreground font-medium">{selectedBriefing.developer_name}</p></div>
                <div><Label className="text-muted-foreground">Date</Label><p className="text-foreground">{selectedBriefing.briefing_date}</p></div>
                <div><Label className="text-muted-foreground">Time</Label><p className="text-foreground">{selectedBriefing.briefing_time} ({selectedBriefing.duration_minutes}m)</p></div>
                <div><Label className="text-muted-foreground">Location</Label><p className="text-foreground">{selectedBriefing.location_type === 'developer_office' ? `Developer Office — ${selectedBriefing.location_address || 'N/A'}` : 'Our Office'}</p></div>
                <div><Label className="text-muted-foreground">Status</Label><Badge className={getStatusColor(selectedBriefing.status)}>{selectedBriefing.status}</Badge></div>
              </div>
              {selectedBriefing.notes && (
                <div><Label className="text-muted-foreground">Notes</Label><p className="text-foreground text-sm whitespace-pre-wrap">{selectedBriefing.notes}</p></div>
              )}

              {/* AI Summary Button */}
              {selectedBriefing.status === 'approved' && (
                <div className="pt-4 border-t border-gold/20">
                  <Button
                    onClick={() => handleAISummary(selectedBriefing)}
                    disabled={aiSummaryLoading}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                  >
                    {aiSummaryLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Generate AI Summary
                  </Button>
                  {aiSummary && (
                    <div className="mt-3 p-4 rounded-xl bg-white/80 border border-gold/20 text-sm whitespace-pre-wrap">
                      {aiSummary}
                    </div>
                  )}
                </div>
              )}

              {/* Assign Broker List */}
              <div className="pt-4 border-t border-gold/20">
                <Label className="text-muted-foreground">Assign Broker List</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {brokerLists.map(list => (
                    <Button
                      key={list.id}
                      size="sm"
                      variant={selectedBriefing.broker_list_id === list.id ? 'default' : 'outline'}
                      onClick={() => handleAssignList(selectedBriefing.id, list.id)}
                      className={selectedBriefing.broker_list_id === list.id ? 'bg-gold text-black' : 'border-gold/30 text-foreground'}
                    >
                      {list.name} ({list.broker_ids?.length || 0})
                    </Button>
                  ))}
                </div>
              </div>

              {/* Attendance */}
              {getBriefingAttendance(selectedBriefing.id).length > 0 && (
                <div className="pt-4 border-t border-gold/20">
                  <Label className="text-muted-foreground mb-2 block">Attendance ({getBriefingAttendance(selectedBriefing.id).length})</Label>
                  <div className="space-y-2">
                    {getBriefingAttendance(selectedBriefing.id).map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-gold/15">
                        <div className="flex items-center gap-3">
                          <Badge className={a.confirmed_attended ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}>
                            {a.confirmed_attended ? '✓' : '○'}
                          </Badge>
                          <span className="text-sm">{a.rsvp_status}</span>
                          {a.late_reason && <span className="text-xs text-muted-foreground">({a.late_reason})</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {a.selfie_url && <Camera className="w-4 h-4 text-gold" />}
                          {a.gps_latitude && <Navigation className="w-4 h-4 text-blue-600" />}
                          <span className="text-gold text-xs font-bold">+{a.points_earned}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Broker List Dialog */}
      <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30 text-foreground">
          <DialogHeader>
            <DialogTitle>Create Broker List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>List Name *</Label>
              <Input value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="e.g. Core Briefing Team" className="bg-white border-gold/20" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={newListDesc} onChange={(e) => setNewListDesc(e.target.value)} placeholder="Optional description" className="bg-white border-gold/20" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListDialogOpen(false)} className="border-gold/30">Cancel</Button>
            <Button onClick={handleCreateList} className="bg-gold text-black hover:bg-gold/90">Create List</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// WhatsApp Logger sub-component — Champagne theme
const WhatsAppLogger = ({ reps, onLog }: { reps: RepActivity[]; onLog: () => void }) => {
  const [selectedRep, setSelectedRep] = useState('');
  const [activityType, setActivityType] = useState('whatsapp_message');
  const [responseMinutes, setResponseMinutes] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLog = async () => {
    if (!selectedRep) { toast.error('Select a representative'); return; }
    setSubmitting(true);
    try {
      const points = activityType === 'whatsapp_response' ? 2 : 1;
      await supabase.from('rep_activity_log').insert({
        representative_id: selectedRep,
        activity_type: activityType,
        description: description || `${activityType.replace('_', ' ')} logged`,
        points_earned: points,
        response_time_minutes: responseMinutes ? parseInt(responseMinutes) : null,
      } as any);

      const rep = reps.find(r => r.id === selectedRep);
      if (rep) {
        const updates: any = { activity_score: (rep.activity_score || 0) + points, last_active_at: new Date().toISOString() };
        if (responseMinutes && activityType === 'whatsapp_response') {
          const avgHours = rep.response_time_avg_hours || 0;
          updates.response_time_avg_hours = avgHours === 0 ? parseInt(responseMinutes) / 60 : (avgHours + parseInt(responseMinutes) / 60) / 2;
        }
        await supabase.from('developer_representatives').update(updates).eq('id', selectedRep);
      }

      toast.success('Activity logged');
      setDescription('');
      setResponseMinutes('');
      onLog();
    } catch (err: any) {
      toast.error(err.message || 'Failed to log activity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Representative</Label>
          <select value={selectedRep} onChange={(e) => setSelectedRep(e.target.value)} className="flex h-10 w-full rounded-md border border-gold/20 bg-white px-3 py-2 text-sm text-foreground">
            <option value="">Select rep...</option>
            {reps.map(r => <option key={r.id} value={r.id}>{r.full_name} — {r.developer_name}</option>)}
          </select>
        </div>
        <div>
          <Label>Activity Type</Label>
          <select value={activityType} onChange={(e) => setActivityType(e.target.value)} className="flex h-10 w-full rounded-md border border-gold/20 bg-white px-3 py-2 text-sm text-foreground">
            <option value="whatsapp_message">Message Sent</option>
            <option value="whatsapp_response">Response Received</option>
          </select>
        </div>
      </div>
      {activityType === 'whatsapp_response' && (
        <div>
          <Label>Response Time (minutes)</Label>
          <Input type="number" value={responseMinutes} onChange={(e) => setResponseMinutes(e.target.value)} placeholder="e.g. 15" className="bg-white border-gold/20" />
        </div>
      )}
      <div>
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief note about the activity" className="bg-white border-gold/20" />
      </div>
      <Button onClick={handleLog} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageCircle className="w-4 h-4 mr-2" />}
        Log Activity
      </Button>
    </div>
  );
};

export default BriefingManagement;
