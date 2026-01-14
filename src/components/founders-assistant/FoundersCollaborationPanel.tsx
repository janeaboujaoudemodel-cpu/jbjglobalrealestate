/**
 * Founders Collaboration Panel
 * Department Coordination Dashboard with visual overview
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
  Bot,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  BarChart3,
  MessageSquare,
  Calendar,
  RefreshCw,
  Activity,
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
  hr: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
  sales: 'bg-green-500/20 border-green-500/30 text-green-400',
  marketing: 'bg-pink-500/20 border-pink-500/30 text-pink-400',
  finance: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
  admin: 'bg-gray-500/20 border-gray-500/30 text-gray-400',
  it: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
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
  
  // Task routing dialog
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as 'low' | 'medium' | 'high' | 'critical' });
  
  // Message dialog
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  
  // Meeting dialog
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
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    
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
    
    await scheduleMeeting(
      meetingDetails.departments,
      meetingDetails.topic,
      new Date(meetingDetails.date)
    );
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
      activeTasks: 0,
      completedToday: 0,
      pendingTasks: 0,
      delayedTasks: 0,
      escalations: 0,
    };
  };
  
  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Department Coordination</h2>
          <p className="text-sm text-gray-400">AI-powered cross-department collaboration</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gold/20 text-gold border-gold/30 hover:bg-gold/30">
                <Zap className="h-4 w-4 mr-2" />
                Route Task
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0E0E0E] border-gold/20">
              <DialogHeader>
                <DialogTitle className="text-white">Route Task to Department</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Task Title</Label>
                  <Input
                    placeholder="e.g., Hire new brokers, Design campaign, Fix bug..."
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="bg-[#1A1A1A] border-gold/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Description</Label>
                  <Textarea
                    placeholder="Task details..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="bg-[#1A1A1A] border-gold/20 text-white min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Priority</Label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                      <Button
                        key={p}
                        size="sm"
                        variant={newTask.priority === p ? 'default' : 'outline'}
                        onClick={() => setNewTask({ ...newTask, priority: p })}
                        className={newTask.priority === p ? 'bg-gold text-black' : 'border-gold/30'}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleRouteTask} disabled={isProcessing} className="bg-gold text-black">
                  {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  Route Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isMeetingDialogOpen} onOpenChange={setIsMeetingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0E0E0E] border-gold/20">
              <DialogHeader>
                <DialogTitle className="text-white">Schedule Cross-Department Meeting</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Topic</Label>
                  <Input
                    placeholder="Meeting topic..."
                    value={meetingDetails.topic}
                    onChange={(e) => setMeetingDetails({ ...meetingDetails, topic: e.target.value })}
                    className="bg-[#1A1A1A] border-gold/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Departments</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(DEPARTMENTS).map((dept) => (
                      <Button
                        key={dept.id}
                        size="sm"
                        variant={meetingDetails.departments.includes(dept.id) ? 'default' : 'outline'}
                        onClick={() => {
                          const deps = meetingDetails.departments.includes(dept.id)
                            ? meetingDetails.departments.filter(d => d !== dept.id)
                            : [...meetingDetails.departments, dept.id];
                          setMeetingDetails({ ...meetingDetails, departments: deps });
                        }}
                        className={meetingDetails.departments.includes(dept.id) ? 'bg-gold text-black' : 'border-gold/30'}
                      >
                        {dept.icon} {dept.shortName}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={meetingDetails.date}
                    onChange={(e) => setMeetingDetails({ ...meetingDetails, date: e.target.value })}
                    className="bg-[#1A1A1A] border-gold/20 text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleScheduleMeeting} disabled={isProcessing} className="bg-gold text-black">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10" onClick={handleGenerateSummary}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Daily Summary
          </Button>
        </div>
      </div>
      
      {/* Daily Summary Modal */}
      {dailySummary && (
        <Card className="bg-[#0E0E0E] border-gold/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-gold text-lg">📅 Daily Company Summary</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setDailySummary(null)} className="text-gray-400">
              ✕
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="text-gray-300 whitespace-pre-wrap text-sm font-mono">{dailySummary}</pre>
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#0E0E0E] border border-gold/20">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="departments" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            <Users className="h-4 w-4 mr-2" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="ai-team" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            <Bot className="h-4 w-4 mr-2" />
            AI Team
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            <MessageSquare className="h-4 w-4 mr-2" />
            Activity Log
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          {/* Department Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(DEPARTMENTS).map((dept) => {
              const deptStats = getDeptStats(dept.id);
              const subAI = subAIs.find(ai => ai.department === dept.id);
              
              return (
                <motion.div
                  key={dept.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className={`bg-[#0E0E0E] border ${departmentColors[dept.id]} transition-all`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${departmentColors[dept.id]}`}>
                            {departmentIcons[dept.id]}
                          </div>
                          <div>
                            <CardTitle className="text-white text-lg">{dept.name}</CardTitle>
                            <p className="text-xs text-gray-400">{dept.headName}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-gold/30 text-gold">
                          {subAI?.name}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 bg-[#1A1A1A] rounded-lg">
                          <p className="text-lg font-bold text-gold">{deptStats.activeTasks}</p>
                          <p className="text-xs text-gray-400">Active</p>
                        </div>
                        <div className="text-center p-2 bg-[#1A1A1A] rounded-lg">
                          <p className="text-lg font-bold text-green-400">{deptStats.completedToday}</p>
                          <p className="text-xs text-gray-400">Completed</p>
                        </div>
                        <div className="text-center p-2 bg-[#1A1A1A] rounded-lg">
                          <p className="text-lg font-bold text-yellow-400">{deptStats.pendingTasks}</p>
                          <p className="text-xs text-gray-400">Pending</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {deptStats.escalations > 0 && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            ⚠️ {deptStats.escalations} escalation{deptStats.escalations > 1 ? 's' : ''}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto text-gold hover:bg-gold/10"
                          onClick={() => {
                            setSelectedDepartment(dept.id);
                            setIsMessageDialogOpen(true);
                          }}
                        >
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
              <Card key={dept.id} className="bg-[#0E0E0E] border-gold/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{dept.icon}</span>
                    <div>
                      <CardTitle className="text-white">{dept.name}</CardTitle>
                      <p className="text-sm text-gray-400">{dept.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Department Head</p>
                      <p className="text-white font-medium">{dept.headName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-2">AI Assistant</p>
                      <p className="text-gold font-medium">{DEPARTMENTS[dept.id]?.subAIName || 'AI Assistant'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Channels</p>
                      <div className="flex flex-wrap gap-1">
                        {dept.channels.map((ch) => (
                          <Badge key={ch} variant="outline" className="text-xs border-gold/30 text-gray-300">
                            #{ch}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-xs text-gray-400 mb-2">KPIs</p>
                    <div className="flex flex-wrap gap-2">
                      {dept.kpis.map((kpi) => (
                        <Badge key={kpi.id} className="bg-[#1A1A1A] text-gray-300 border-gold/20">
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
                <Card key={ai.id} className="bg-[#0E0E0E] border-gold/20">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base">{ai.name}</CardTitle>
                        <p className="text-xs text-gray-400">{ai.role}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Department</p>
                      <Badge className={departmentColors[ai.department]}>
                        {dept?.icon} {dept?.name}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Daily Report</p>
                      <p className="text-white text-sm flex items-center gap-2">
                        <Clock className="h-3 w-3" /> {ai.dailyReportTime}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Capabilities</p>
                      <div className="flex flex-wrap gap-1">
                        {ai.capabilities.slice(0, 3).map((cap, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-gold/30 text-gray-300">
                            {cap}
                          </Badge>
                        ))}
                        {ai.capabilities.length > 3 && (
                          <Badge variant="outline" className="text-xs border-gold/30 text-gray-400">
                            +{ai.capabilities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-gray-400">Reports to: <span className="text-gold">Olivia AI</span></p>
                      <div className="flex items-center gap-1 text-green-400 text-xs">
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
          <Card className="bg-[#0E0E0E] border-gold/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-gold" />
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
                        className="flex items-start gap-3 p-3 bg-[#1A1A1A] rounded-lg border border-gold/10"
                      >
                        <div className={`p-2 rounded-full ${
                          log.type === 'task_routed' ? 'bg-green-500/20' :
                          log.type === 'escalation' ? 'bg-red-500/20' :
                          log.type === 'ai_communication' ? 'bg-blue-500/20' :
                          log.type === 'report_generated' ? 'bg-purple-500/20' :
                          'bg-gold/20'
                        }`}>
                          {log.type === 'task_routed' ? <ArrowRight className="h-4 w-4 text-green-400" /> :
                           log.type === 'escalation' ? <AlertCircle className="h-4 w-4 text-red-400" /> :
                           log.type === 'ai_communication' ? <Bot className="h-4 w-4 text-blue-400" /> :
                           log.type === 'report_generated' ? <BarChart3 className="h-4 w-4 text-purple-400" /> :
                           <Activity className="h-4 w-4 text-gold" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-white font-medium text-sm">{log.action}</p>
                            <span className="text-xs text-gray-500">
                              {format(new Date(log.timestamp), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs mt-1">{log.details}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs border-gold/30 text-gray-400">
                              {log.actorName}
                            </Badge>
                            {log.targetName && (
                              <>
                                <ArrowRight className="h-3 w-3 text-gray-500" />
                                <Badge variant="outline" className="text-xs border-gold/30 text-gray-400">
                                  {log.targetName}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {logs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
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
        <DialogContent className="bg-[#0E0E0E] border-gold/20">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedDepartment 
                ? `Send Message to ${DEPARTMENTS[selectedDepartment]?.name}` 
                : 'Broadcast to All Heads'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Type your message..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="bg-[#1A1A1A] border-gold/20 text-white min-h-[120px]"
            />
          </div>
          <DialogFooter className="flex gap-2">
            {selectedDepartment ? (
              <Button onClick={handleSendMessage} className="bg-gold text-black">
                <Send className="h-4 w-4 mr-2" />
                Send to {DEPARTMENTS[selectedDepartment]?.shortName}
              </Button>
            ) : (
              <Button onClick={handleBroadcast} className="bg-gold text-black">
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
