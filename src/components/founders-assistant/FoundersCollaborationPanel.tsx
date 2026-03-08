/**
 * Founders Collaboration Panel
 * Department Coordination Dashboard - Champagne Gold Theme
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Briefcase, 
  Palette, 
  DollarSign, 
  FileText, 
  Code,
  ArrowRight,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  BarChart3,
  MessageSquare,
  Calendar,
  RefreshCw,
  Activity,
  UserCircle,
} from 'lucide-react';
import { useDepartmentCoordination } from '@/hooks/useDepartmentCoordination';
import { DEPARTMENTS } from '@/config/department-coordination-engine';
import { format } from 'date-fns';
import { toast } from 'sonner';

const departmentIcons: Record<string, React.ReactNode> = {
  hr: <Users className="h-5 w-5" />,
  sales: <Briefcase className="h-5 w-5" />,
  marketing: <Palette className="h-5 w-5" />,
  finance: <DollarSign className="h-5 w-5" />,
  admin: <FileText className="h-5 w-5" />,
  it: <Code className="h-5 w-5" />,
};

const departmentColors: Record<string, string> = {
  hr: 'bg-purple-50 border-purple-200 text-purple-700',
  sales: 'bg-green-50 border-green-200 text-green-700',
  marketing: 'bg-pink-50 border-pink-200 text-pink-700',
  finance: 'bg-amber-50 border-amber-200 text-amber-700',
  admin: 'bg-zinc-50 border-zinc-200 text-zinc-700',
  it: 'bg-blue-50 border-blue-200 text-blue-700',
};

export default function FoundersCollaborationPanel() {
  const {
    isProcessing,
    departments,
    subAIs,
    routeTask,
    sendDepartmentMessage,
    sendToAllHeads,
    triggerAIHandoff,
    getDepartmentStats,
    getCoordinationLogs,
    generateDailySummary,
    scheduleMeeting,
  } = useDepartmentCoordination();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(getDepartmentStats());
  const [logs, setLogs] = useState(getCoordinationLogs(undefined, 50));
  const [dailySummary, setDailySummary] = useState<string | null>(null);
  
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as 'low' | 'medium' | 'high' | 'critical' });
  
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState({
    topic: '',
    departments: [] as string[],
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getDepartmentStats());
      setLogs(getCoordinationLogs(undefined, 50));
    }, 10000);
    return () => clearInterval(interval);
  }, [getDepartmentStats, getCoordinationLogs]);
  
  const handleRouteTask = async () => {
    if (!newTask.title.trim()) { toast.error('Task title is required'); return; }
    await routeTask(newTask.title, newTask.description, newTask.priority);
    setNewTask({ title: '', description: '', priority: 'medium' });
    setIsTaskDialogOpen(false);
    setLogs(getCoordinationLogs(undefined, 50));
  };
  
  const handleSendMessage = async () => {
    if (!selectedDepartment || !messageContent.trim()) return;
    await sendDepartmentMessage(selectedDepartment, messageContent, 'update');
    setMessageContent('');
    setIsMessageDialogOpen(false);
    setSelectedDepartment(null);
    setLogs(getCoordinationLogs(undefined, 50));
  };
  
  const handleBroadcast = async () => {
    if (!messageContent.trim()) return;
    await sendToAllHeads(messageContent);
    setMessageContent('');
    setIsMessageDialogOpen(false);
    setLogs(getCoordinationLogs(undefined, 50));
  };
  
  const handleScheduleMeeting = async () => {
    if (!meetingDetails.topic || meetingDetails.departments.length === 0) {
      toast.error('Please fill in all meeting details');
      return;
    }
    await scheduleMeeting(meetingDetails.departments, meetingDetails.topic, new Date(meetingDetails.date));
    setMeetingDetails({ topic: '', departments: [], date: format(new Date(), "yyyy-MM-dd'T'HH:mm") });
    setIsMeetingDialogOpen(false);
  };
  
  const handleGenerateSummary = async () => {
    const summary = await generateDailySummary();
    setDailySummary(summary);
    toast.success('Daily Summary Generated');
  };
  
  const getDeptStats = (deptId: string) => {
    return stats.find(s => s.departmentId === deptId) || {
      activeTasks: 0, completedToday: 0, pendingTasks: 0, delayedTasks: 0, escalations: 0,
    };
  };
  
  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-black">Department Coordination</h2>
          <p className="text-sm text-zinc-500">Cross-department collaboration hub</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black border-2 border-[#C9A84C]/30 hover:bg-[#C9A84C]/10">
                <Zap className="h-4 w-4 mr-2 text-[#C9A84C]" />
                Route Task
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-2 border-[#C9A84C]/30">
              <DialogHeader>
                <DialogTitle className="text-black">Route Task to Department</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-zinc-600">Task Title</Label>
                  <Input placeholder="e.g., Hire new brokers, Design campaign..." value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="bg-zinc-50 border-[#C9A84C]/20 text-black" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-600">Description</Label>
                  <Textarea placeholder="Task details..." value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="bg-zinc-50 border-[#C9A84C]/20 text-black min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-600">Priority</Label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                      <Button key={p} size="sm" onClick={() => setNewTask({ ...newTask, priority: p })} className={newTask.priority === p ? 'bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white' : 'bg-white text-black border-2 border-[#C9A84C]/30'}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleRouteTask} disabled={isProcessing} className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white">
                  {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  Route Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isMeetingDialogOpen} onOpenChange={setIsMeetingDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black border-2 border-[#C9A84C]/30 hover:bg-[#C9A84C]/10">
                <Calendar className="h-4 w-4 mr-2 text-[#C9A84C]" />
                Schedule Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-2 border-[#C9A84C]/30">
              <DialogHeader>
                <DialogTitle className="text-black">Schedule Cross-Department Meeting</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-zinc-600">Topic</Label>
                  <Input placeholder="Meeting topic..." value={meetingDetails.topic} onChange={(e) => setMeetingDetails({ ...meetingDetails, topic: e.target.value })} className="bg-zinc-50 border-[#C9A84C]/20 text-black" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-600">Departments</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(DEPARTMENTS).map((dept) => (
                      <Button key={dept.id} size="sm" onClick={() => {
                        const deps = meetingDetails.departments.includes(dept.id) ? meetingDetails.departments.filter(d => d !== dept.id) : [...meetingDetails.departments, dept.id];
                        setMeetingDetails({ ...meetingDetails, departments: deps });
                      }} className={meetingDetails.departments.includes(dept.id) ? 'bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white' : 'bg-white text-black border-2 border-[#C9A84C]/30'}>
                        {dept.shortName}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-600">Date & Time</Label>
                  <Input type="datetime-local" value={meetingDetails.date} onChange={(e) => setMeetingDetails({ ...meetingDetails, date: e.target.value })} className="bg-zinc-50 border-[#C9A84C]/20 text-black" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleScheduleMeeting} disabled={isProcessing} className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button className="bg-white text-black border-2 border-[#C9A84C]/30 hover:bg-[#C9A84C]/10" onClick={handleGenerateSummary}>
            <BarChart3 className="h-4 w-4 mr-2 text-[#C9A84C]" />
            Daily Summary
          </Button>
        </div>
      </div>
      
      {dailySummary && (
        <Card className="bg-white border-2 border-[#C9A84C]/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[#C9A84C] text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daily Company Summary
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setDailySummary(null)} className="text-zinc-500 hover:text-black">
              <AlertCircle className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="text-black whitespace-pre-wrap text-sm font-mono bg-zinc-50 p-4 rounded-lg border border-zinc-200">{dailySummary}</pre>
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border-2 border-[#C9A84C]/20">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border data-[state=active]:border-[#C9A84C]/30">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="departments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border data-[state=active]:border-[#C9A84C]/30">
            <Users className="h-4 w-4 mr-2" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="ai-team" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border data-[state=active]:border-[#C9A84C]/30">
            <UserCircle className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border data-[state=active]:border-[#C9A84C]/30">
            <MessageSquare className="h-4 w-4 mr-2" />
            Activity Log
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(DEPARTMENTS).map((dept) => {
              const deptStats = getDeptStats(dept.id);
              const subAI = subAIs.find(ai => ai.department === dept.id);
              
              return (
                <motion.div key={dept.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }}>
                  <Card className={`bg-white border-2 ${departmentColors[dept.id]} transition-all`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg border ${departmentColors[dept.id]}`}>
                            {departmentIcons[dept.id]}
                          </div>
                          <div>
                            <CardTitle className="text-black text-lg">{dept.name}</CardTitle>
                            <p className="text-xs text-zinc-500">{dept.headName}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-[#C9A84C]/30 text-[#C9A84C]">{subAI?.name}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 bg-zinc-50 rounded-lg border border-zinc-200">
                          <p className="text-lg font-bold text-[#C9A84C]">{deptStats.activeTasks}</p>
                          <p className="text-xs text-zinc-500">Active</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-lg font-bold text-green-700">{deptStats.completedToday}</p>
                          <p className="text-xs text-zinc-500">Completed</p>
                        </div>
                        <div className="text-center p-2 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-lg font-bold text-amber-700">{deptStats.pendingTasks}</p>
                          <p className="text-xs text-zinc-500">Pending</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {deptStats.escalations > 0 && (
                          <Badge className="bg-red-50 text-red-700 border border-red-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {deptStats.escalations} escalation{deptStats.escalations > 1 ? 's' : ''}
                          </Badge>
                        )}
                        <Button size="sm" variant="ghost" className="ml-auto text-[#C9A84C] hover:bg-[#C9A84C]/10" onClick={() => { setSelectedDepartment(dept.id); setIsMessageDialogOpen(true); }}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="departments" className="mt-4">
          <div className="space-y-4">
            {Object.values(DEPARTMENTS).map((dept) => (
              <Card key={dept.id} className="bg-white border-2 border-[#C9A84C]/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${departmentColors[dept.id]}`}>
                      {departmentIcons[dept.id] || <Users className="h-5 w-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-black">{dept.name}</CardTitle>
                      <p className="text-sm text-zinc-500">{dept.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-2">Department Head</p>
                      <p className="text-black font-medium">{dept.headName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-2">Assistant</p>
                      <p className="text-[#C9A84C] font-medium">{DEPARTMENTS[dept.id]?.subAIName || 'Assistant'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-2">Channels</p>
                      <div className="flex flex-wrap gap-1">
                        {dept.channels.map((ch) => (
                          <Badge key={ch} variant="outline" className="text-xs border-[#C9A84C]/30 text-zinc-600">#{ch}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-xs text-zinc-500 mb-2">KPIs</p>
                    <div className="flex flex-wrap gap-2">
                      {dept.kpis.map((kpi) => (
                        <Badge key={kpi.id} className="bg-zinc-50 text-zinc-700 border border-zinc-200">
                          {kpi.name}: {kpi.target} {kpi.unit}/{kpi.frequency}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="ai-team" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subAIs.map((ai) => {
              const dept = DEPARTMENTS[ai.department];
              return (
                <Card key={ai.id} className="bg-white border-2 border-[#C9A84C]/20">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 flex items-center justify-center border border-[#C9A84C]/30">
                        <UserCircle className="h-5 w-5 text-[#C9A84C]" />
                      </div>
                      <div>
                        <CardTitle className="text-black text-base">{ai.name}</CardTitle>
                        <p className="text-xs text-zinc-500">{ai.role}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Department</p>
                      <Badge className={departmentColors[ai.department]}>
                        {departmentIcons[ai.department]} {dept?.name}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Daily Report</p>
                      <p className="text-black text-sm flex items-center gap-2">
                        <Clock className="h-3 w-3" /> {ai.dailyReportTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Capabilities</p>
                      <div className="flex flex-wrap gap-1">
                        {ai.capabilities.slice(0, 3).map((cap, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-[#C9A84C]/30 text-zinc-600">{cap}</Badge>
                        ))}
                        {ai.capabilities.length > 3 && (
                          <Badge variant="outline" className="text-xs border-[#C9A84C]/30 text-zinc-400">+{ai.capabilities.length - 3} more</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-zinc-500">Reports to: <span className="text-[#C9A84C]">Amanda Clarke</span></p>
                      <div className="flex items-center gap-1 text-green-600 text-xs">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="mt-4">
          <Card className="bg-white border-2 border-[#C9A84C]/20">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#C9A84C]" />
                Coordination Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  <AnimatePresence>
                    {logs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200"
                      >
                        <div className={`p-2 rounded-full ${
                          log.type === 'task_routed' ? 'bg-green-50 border border-green-200' :
                          log.type === 'escalation' ? 'bg-red-50 border border-red-200' :
                          log.type === 'ai_communication' ? 'bg-blue-50 border border-blue-200' :
                          log.type === 'report_generated' ? 'bg-purple-50 border border-purple-200' :
                          'bg-[#C9A84C]/10 border border-[#C9A84C]/20'
                        }`}>
                          {log.type === 'task_routed' ? <ArrowRight className="h-4 w-4 text-green-600" /> :
                           log.type === 'escalation' ? <AlertCircle className="h-4 w-4 text-red-600" /> :
                           log.type === 'ai_communication' ? <MessageSquare className="h-4 w-4 text-blue-600" /> :
                           log.type === 'report_generated' ? <BarChart3 className="h-4 w-4 text-purple-600" /> :
                           <Activity className="h-4 w-4 text-[#C9A84C]" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-black font-medium text-sm">{log.action}</p>
                            <span className="text-xs text-zinc-400">{format(new Date(log.timestamp), 'HH:mm')}</span>
                          </div>
                          <p className="text-zinc-500 text-xs mt-1">{log.details}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs border-[#C9A84C]/30 text-zinc-500">{log.actorName}</Badge>
                            {log.targetName && (
                              <>
                                <ArrowRight className="h-3 w-3 text-zinc-400" />
                                <Badge variant="outline" className="text-xs border-[#C9A84C]/30 text-zinc-500">{log.targetName}</Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {logs.length === 0 && (
                    <div className="text-center py-8 text-zinc-400">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No coordination activity yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="bg-white border-2 border-[#C9A84C]/30">
          <DialogHeader>
            <DialogTitle className="text-black">
              {selectedDepartment ? `Send Message to ${DEPARTMENTS[selectedDepartment]?.name}` : 'Broadcast to All Heads'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea placeholder="Type your message..." value={messageContent} onChange={(e) => setMessageContent(e.target.value)} className="bg-zinc-50 border-[#C9A84C]/20 text-black min-h-[120px]" />
          </div>
          <DialogFooter className="flex gap-2">
            {selectedDepartment ? (
              <Button onClick={handleSendMessage} className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white">
                <Send className="h-4 w-4 mr-2" />
                Send to {DEPARTMENTS[selectedDepartment]?.shortName}
              </Button>
            ) : (
              <Button onClick={handleBroadcast} className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white">
                <Send className="h-4 w-4 mr-2" />
                Broadcast to All
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
