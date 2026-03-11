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
  Search, Eye, Camera, Navigation, Star, MessageCircle, Loader2, Plus, Pencil
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

      // Create calendar task
      await supabase.from('admin_tasks').insert({
        user_id: user?.id,
        title: `📅 Briefing: ${briefing.project_name} — ${briefing.developer_name}`,
        description: `Approved briefing on ${briefing.briefing_date} at ${briefing.briefing_time} (${briefing.duration_minutes} min). Location: ${briefing.location_type === 'developer_office' ? briefing.location_address || 'Developer Office' : 'Our Office'}.`,
        category: 'briefing_approved',
        priority: 'high',
        status: 'pending',
        due_date: briefing.briefing_date,
      } as any);

      // Notify brokers on assigned list
      if (briefing.broker_list_id) {
        const list = brokerLists.find(l => l.id === briefing.broker_list_id);
        if (list) {
          for (const brokerId of list.broker_ids) {
            await supabase.from('user_notifications' as any).insert({
              user_id: brokerId,
              type: 'briefing_approved',
              title: `Briefing: ${briefing.project_name}`,
              message: `A briefing for ${briefing.project_name} by ${briefing.developer_name} has been scheduled for ${briefing.briefing_date} at ${briefing.briefing_time}.`,
              is_read: false,
            }).catch(() => {});
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
      const { error } = await supabase.from('briefing_requests').update({
        status: 'rejected',
      } as any).eq('id', briefing.id);
      if (error) throw error;
      toast.success('Briefing rejected');
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    }
  };

  const handleAssignList = async (briefingId: string, listId: string) => {
    try {
      const { error } = await supabase.from('briefing_requests').update({
        broker_list_id: listId,
      } as any).eq('id', briefingId);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  const getBriefingAttendance = (briefingId: string) =>
    attendance.filter(a => a.briefing_request_id === briefingId);

  const responsiveRating = (hours: number | null) => {
    if (hours === null) return { label: 'No Data', color: 'text-zinc-500' };
    if (hours <= 1) return { label: 'Excellent', color: 'text-emerald-400' };
    if (hours <= 4) return { label: 'Good', color: 'text-blue-400' };
    return { label: 'Slow', color: 'text-red-400' };
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
          { label: 'Pending', value: briefings.filter(b => b.status === 'pending').length, color: 'text-amber-400' },
          { label: 'Approved', value: briefings.filter(b => b.status === 'approved').length, color: 'text-emerald-400' },
          { label: 'Broker Lists', value: brokerLists.length, color: 'text-blue-400' },
          { label: 'Active Reps', value: reps.length, color: 'text-purple-400' },
        ].map((s, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sub-tabs */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-zinc-900 border border-zinc-700">
          <TabsTrigger value="calendar" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            <Calendar className="w-4 h-4 mr-1" /> Briefings
          </TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            <Eye className="w-4 h-4 mr-1" /> Attendance
          </TabsTrigger>
          <TabsTrigger value="broker-lists" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            <Users className="w-4 h-4 mr-1" /> Broker Lists
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            <Trophy className="w-4 h-4 mr-1" /> Rep Leaderboard
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp Log
          </TabsTrigger>
        </TabsList>

        {/* BRIEFINGS CALENDAR */}
        <TabsContent value="calendar" className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search briefings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-900 border-zinc-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Badge className="bg-amber-500/20 text-amber-400">● Pending</Badge>
              <Badge className="bg-emerald-500/20 text-emerald-400">● Approved</Badge>
              <Badge className="bg-red-500/20 text-red-400">● Rejected</Badge>
            </div>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredBriefings.map(b => (
                <Card key={b.id} className="bg-zinc-900 border-zinc-800 hover:border-gold/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-white font-semibold">{b.project_name}</h4>
                          <Badge className={getStatusColor(b.status)}>{b.status}</Badge>
                          {b.calendar_locked && <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">🔒 Locked</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
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
                        {b.location_address && <p className="text-xs text-zinc-600 mt-1">{b.location_address}</p>}
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
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedBriefing(b); setDetailOpen(true); }} className="text-zinc-400">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Attendance summary */}
                    {getBriefingAttendance(b.id).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-3 text-xs">
                        <span className="text-zinc-500">Attendance:</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400">{getBriefingAttendance(b.id).filter(a => a.rsvp_status === 'attending').length} Attending</Badge>
                        <Badge className="bg-amber-500/20 text-amber-400">{getBriefingAttendance(b.id).filter(a => a.rsvp_status === 'late').length} Late</Badge>
                        <Badge className="bg-blue-500/20 text-blue-400">{getBriefingAttendance(b.id).filter(a => a.confirmed_attended).length} Confirmed</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {filteredBriefings.length === 0 && (
                <div className="text-center py-12 text-zinc-500">No briefings found</div>
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
                  <Card key={a.id} className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{briefing?.project_name || 'Unknown'}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                            <Badge className={a.rsvp_status === 'attending' ? 'bg-emerald-500/20 text-emerald-400' : a.rsvp_status === 'late' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}>
                              {a.rsvp_status}
                            </Badge>
                            {a.confirmed_attended && <Badge className="bg-blue-500/20 text-blue-400">✓ Confirmed</Badge>}
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
                            <a href={`https://maps.google.com/?q=${a.gps_latitude},${a.gps_longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 text-xs hover:underline">
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
              {attendance.length === 0 && <div className="text-center py-12 text-zinc-500">No attendance records yet</div>}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* BROKER LISTS */}
        <TabsContent value="broker-lists" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-semibold">Broker Notification Lists</h3>
            <Button onClick={() => setListDialogOpen(true)} className="bg-gold hover:bg-gold/90 text-black">
              <Plus className="w-4 h-4 mr-1" /> New List
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brokerLists.map(list => (
              <Card key={list.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold">{list.name}</h4>
                    <Badge className="bg-blue-500/20 text-blue-400">{list.broker_ids?.length || 0} brokers</Badge>
                  </div>
                  {list.description && <p className="text-xs text-zinc-500">{list.description}</p>}
                  <p className="text-xs text-zinc-600 mt-2">Created {format(new Date(list.created_at), 'MMM d, yyyy')}</p>
                </CardContent>
              </Card>
            ))}
            {brokerLists.length === 0 && (
              <div className="col-span-2 text-center py-8 text-zinc-500">
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
                  <Card key={rep.id} className={`bg-zinc-900 border-zinc-800 ${idx === 0 ? 'border-gold/50 ring-1 ring-gold/30' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-gold/20 text-gold' : 'bg-zinc-800 text-zinc-400'}`}>
                            {idx === 0 ? <Trophy className="w-5 h-5" /> : <span className="font-bold">{idx + 1}</span>}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-semibold">{rep.full_name}</h4>
                              {idx === 0 && <Star className="w-4 h-4 text-gold fill-gold" />}
                            </div>
                            <p className="text-xs text-zinc-500">{rep.developer_name}</p>
                            {rep.languages?.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {rep.languages.slice(0, 3).map(l => (
                                  <Badge key={l} className="bg-zinc-800 text-zinc-400 text-[9px]">{l}</Badge>
                                ))}
                                {rep.languages.length > 3 && <Badge className="bg-zinc-800 text-zinc-400 text-[9px]">+{rep.languages.length - 3}</Badge>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <div className="text-gold font-bold text-lg">{rep.activity_score}</div>
                            <p className="text-[10px] text-zinc-500">Score</p>
                          </div>
                          <div>
                            <div className="text-white font-medium">{rep.total_briefings_hosted}</div>
                            <p className="text-[10px] text-zinc-500">Briefings</p>
                          </div>
                          <div>
                            <div className="text-white font-medium">{rep.total_updates_submitted}</div>
                            <p className="text-[10px] text-zinc-500">Updates</p>
                          </div>
                          <div>
                            <div className={`font-medium ${rating.color}`}>{rating.label}</div>
                            <p className="text-[10px] text-zinc-500">Response</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {reps.length === 0 && <div className="text-center py-12 text-zinc-500">No representatives found</div>}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* WHATSAPP LOG */}
        <TabsContent value="whatsapp" className="mt-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
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
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Briefing Details</DialogTitle>
          </DialogHeader>
          {selectedBriefing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-zinc-500">Project</Label><p className="text-white">{selectedBriefing.project_name}</p></div>
                <div><Label className="text-zinc-500">Developer</Label><p className="text-white">{selectedBriefing.developer_name}</p></div>
                <div><Label className="text-zinc-500">Date</Label><p className="text-white">{selectedBriefing.briefing_date}</p></div>
                <div><Label className="text-zinc-500">Time</Label><p className="text-white">{selectedBriefing.briefing_time} ({selectedBriefing.duration_minutes}m)</p></div>
                <div><Label className="text-zinc-500">Location</Label><p className="text-white">{selectedBriefing.location_type === 'developer_office' ? `Developer Office — ${selectedBriefing.location_address || 'N/A'}` : 'Our Office'}</p></div>
                <div><Label className="text-zinc-500">Status</Label><Badge className={getStatusColor(selectedBriefing.status)}>{selectedBriefing.status}</Badge></div>
              </div>
              {selectedBriefing.notes && (
                <div><Label className="text-zinc-500">Notes</Label><p className="text-zinc-300 text-sm">{selectedBriefing.notes}</p></div>
              )}

              {/* Assign Broker List */}
              <div className="pt-4 border-t border-zinc-800">
                <Label className="text-zinc-500">Assign Broker List</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {brokerLists.map(list => (
                    <Button
                      key={list.id}
                      size="sm"
                      variant={selectedBriefing.broker_list_id === list.id ? 'default' : 'outline'}
                      onClick={() => handleAssignList(selectedBriefing.id, list.id)}
                      className={selectedBriefing.broker_list_id === list.id ? 'bg-gold text-black' : 'border-zinc-600 text-zinc-300'}
                    >
                      {list.name} ({list.broker_ids?.length || 0})
                    </Button>
                  ))}
                </div>
              </div>

              {/* Attendance for this briefing */}
              {getBriefingAttendance(selectedBriefing.id).length > 0 && (
                <div className="pt-4 border-t border-zinc-800">
                  <Label className="text-zinc-500 mb-2 block">Attendance ({getBriefingAttendance(selectedBriefing.id).length})</Label>
                  <div className="space-y-2">
                    {getBriefingAttendance(selectedBriefing.id).map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge className={a.confirmed_attended ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}>
                            {a.confirmed_attended ? '✓' : '○'}
                          </Badge>
                          <span className="text-sm">{a.rsvp_status}</span>
                          {a.late_reason && <span className="text-xs text-zinc-500">({a.late_reason})</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {a.selfie_url && <Camera className="w-4 h-4 text-gold" />}
                          {a.gps_latitude && <Navigation className="w-4 h-4 text-blue-400" />}
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
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle>Create Broker List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>List Name *</Label>
              <Input value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="e.g. Core Briefing Team" className="bg-zinc-800 border-zinc-700" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={newListDesc} onChange={(e) => setNewListDesc(e.target.value)} placeholder="Optional description" className="bg-zinc-800 border-zinc-700" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListDialogOpen(false)} className="border-zinc-600">Cancel</Button>
            <Button onClick={handleCreateList} className="bg-gold text-black hover:bg-gold/90">Create List</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// WhatsApp Logger sub-component
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

      // Update rep score
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
          <select value={selectedRep} onChange={(e) => setSelectedRep(e.target.value)} className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white">
            <option value="">Select rep...</option>
            {reps.map(r => <option key={r.id} value={r.id}>{r.full_name} — {r.developer_name}</option>)}
          </select>
        </div>
        <div>
          <Label>Activity Type</Label>
          <select value={activityType} onChange={(e) => setActivityType(e.target.value)} className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white">
            <option value="whatsapp_message">Message Sent</option>
            <option value="whatsapp_response">Response Received</option>
          </select>
        </div>
      </div>
      {activityType === 'whatsapp_response' && (
        <div>
          <Label>Response Time (minutes)</Label>
          <Input type="number" value={responseMinutes} onChange={(e) => setResponseMinutes(e.target.value)} placeholder="e.g. 15" className="bg-zinc-800 border-zinc-700 text-white" />
        </div>
      )}
      <div>
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief note about the activity" className="bg-zinc-800 border-zinc-700 text-white" />
      </div>
      <Button onClick={handleLog} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageCircle className="w-4 h-4 mr-2" />}
        Log Activity
      </Button>
    </div>
  );
};

export default BriefingManagement;
