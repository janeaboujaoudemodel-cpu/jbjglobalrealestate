import { useState, useEffect } from "react";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { AdminTasksPanel } from "@/components/crm/AdminTasksPanel";
import InvestorDashboard from "@/components/account/InvestorDashboard";
import {
  User,
  GraduationCap,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Trophy,
  Star,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  Award,
  Gift,
  Building2,
  FileSignature,
  ListTodo
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";

interface TrainingModule {
  id: string;
  title: string;
  category: string;
  duration_minutes: number;
}

interface TrainingProgress {
  module_id: string;
  is_completed: boolean;
  completed_at: string | null;
}

interface BrokerPoints {
  points: number;
  total_points_earned: number;
  level: number;
}

interface ActivityStats {
  date: string;
  calls_made: number;
  chats_sent: number;
  emails_sent: number;
  visits_completed: number;
  leads_contacted: number;
}

interface CallLog {
  id: string;
  phone_number: string;
  call_type: string;
  call_status: string;
  duration_seconds: number;
  notes: string | null;
  created_at: string;
}

interface ChatLog {
  id: string;
  platform: string;
  contact_number: string;
  message_count: number;
  last_message_at: string;
  created_at: string;
}

const BrokerAccount = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isBroker, isInvestor, isVisitor, role, isLoading: roleLoading } = useUserRole();
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [progress, setProgress] = useState<TrainingProgress[]>([]);
  const [points, setPoints] = useState<BrokerPoints | null>(null);
  const [activityStats, setActivityStats] = useState<ActivityStats[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmployee, setIsEmployee] = useState(false);
  const [employeeProfile, setEmployeeProfile] = useState<{ display_name?: string; crm_role?: string; job_title?: string; photo_url?: string } | null>(null);

  // Check if user is a CRM employee (not just external broker)
  useEffect(() => {
    const checkEmployeeStatus = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      const { data } = await supabase
        .from('crm_users_profile')
        .select('display_name, crm_role, job_title, is_active, photo_url')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data?.is_active && data?.crm_role) {
        setIsEmployee(true);
        setEmployeeProfile(data);
      }
      setLoading(false);
    };
    
    if (!authLoading && !roleLoading) {
      checkEmployeeStatus();
    }
  }, [user?.id, authLoading, roleLoading]);

  // Fetch employee/broker data only if they are an employee or broker
  useEffect(() => {
    if ((isBroker || isEmployee) && user && !loading) {
      fetchData();
    }
  }, [isBroker, isEmployee, user, loading]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [modulesRes, progressRes, pointsRes, statsRes, callsRes, chatsRes] = await Promise.all([
        supabase.from('hr_training_modules').select('id, title, category, duration_minutes').order('display_order'),
        supabase.from('broker_training_progress').select('module_id, is_completed, completed_at').eq('user_id', user.id),
        supabase.from('broker_points').select('*').eq('user_id', user.id).single(),
        supabase.from('broker_activity_stats').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
        supabase.from('broker_call_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('broker_chat_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
      ]);

      if (modulesRes.data) setModules(modulesRes.data);
      if (progressRes.data) setProgress(progressRes.data);
      if (pointsRes.data) setPoints(pointsRes.data);
      if (statsRes.data) setActivityStats(statsRes.data);
      if (callsRes.data) setCallLogs(callsRes.data);
      if (chatsRes.data) setChatLogs(chatsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedModules = progress.filter(p => p.is_completed).length;
  const totalModules = modules.length;
  const trainingProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  // Calculate stats
  const today = new Date();
  const todayStats = activityStats.find(s => s.date === format(today, 'yyyy-MM-dd'));
  const thisWeekStats = activityStats.filter(s => {
    const date = new Date(s.date);
    return date >= startOfWeek(today) && date <= endOfWeek(today);
  });
  const thisMonthStats = activityStats.filter(s => {
    const date = new Date(s.date);
    return date >= startOfMonth(today) && date <= endOfMonth(today);
  });

  const weekCalls = thisWeekStats.reduce((sum, s) => sum + s.calls_made, 0);
  const weekChats = thisWeekStats.reduce((sum, s) => sum + s.chats_sent, 0);
  const monthCalls = thisMonthStats.reduce((sum, s) => sum + s.calls_made, 0);
  const monthChats = thisMonthStats.reduce((sum, s) => sum + s.chats_sent, 0);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || authLoading || roleLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <BrandedLoader text="Loading..." className="min-h-screen" />
        </div>
      </MainLayout>
    );
  }

  // Show investor/visitor dashboard if not an employee or broker
  if (!isEmployee && !isBroker && user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
          <div className="container mx-auto px-4 py-8">
            <InvestorDashboard />
          </div>
        </div>
      </MainLayout>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    navigate('/auth?redirect=/my-account');
    return null;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Profile Header */}
          <Card className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage src={employeeProfile?.photo_url || ""} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {employeeProfile?.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    {employeeProfile?.display_name || 'My Account'}
                  </h1>
                  {employeeProfile?.job_title && (
                    <p className="text-primary font-medium">{employeeProfile.job_title}</p>
                  )}
                  <p className="text-muted-foreground text-sm">{user?.email}</p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                    <Badge variant="default" className="bg-primary">
                      <Star className="h-3 w-3 mr-1" />
                      Level {points?.level || 1}
                    </Badge>
                    <Badge variant="secondary">
                      <Trophy className="h-3 w-3 mr-1" />
                      {points?.total_points_earned || 0} Points Earned
                    </Badge>
                    <Badge variant="outline">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {completedModules}/{totalModules} Courses
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => navigate('/crm')} size="lg" className="min-w-[200px]">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Go to My CRM
                  </Button>
                  <Button onClick={() => navigate('/broker-dashboard')} variant="outline">
                    <Building2 className="h-4 w-4 mr-2" />
                    Developer Visits
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-500/20">
                    <Phone className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{callLogs.length}</p>
                    <p className="text-xs text-muted-foreground">Total Calls</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-500/20">
                    <MessageCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{chatLogs.length}</p>
                    <p className="text-xs text-muted-foreground">Total Chats</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-purple-500/20">
                    <Target className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{weekCalls + weekChats}</p>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-500/20">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{monthCalls + monthChats}</p>
                    <p className="text-xs text-muted-foreground">This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-1">
                <ListTodo className="h-3 w-3" />
                My Tasks
              </TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="calls">Calls</TabsTrigger>
              <TabsTrigger value="chats">Chats</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Training Progress Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Training Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Completed Courses</span>
                          <span className="font-medium">{completedModules}/{totalModules}</span>
                        </div>
                        <Progress value={trainingProgress} className="h-3" />
                      </div>
                      <div className="space-y-2">
                        {modules.slice(0, 4).map((module) => {
                          const isComplete = progress.find(p => p.module_id === module.id)?.is_completed;
                          return (
                            <div key={module.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2">
                                {isComplete ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="text-sm">{module.title}</span>
                              </div>
                              <Badge variant={isComplete ? "default" : "secondary"} className="text-xs">
                                {isComplete ? "Done" : `${module.duration_minutes}m`}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => navigate('/onboarding')}>
                        View All Courses
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Activity Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                          <Phone className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                          <p className="text-xl font-bold">{weekCalls}</p>
                          <p className="text-xs text-muted-foreground">Calls This Week</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/10 text-center">
                          <MessageCircle className="h-6 w-6 mx-auto text-green-500 mb-1" />
                          <p className="text-xl font-bold">{weekChats}</p>
                          <p className="text-xs text-muted-foreground">Chats This Week</p>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-3">Monthly Performance</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Calls</span>
                          <span className="font-medium">{monthCalls}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-muted-foreground">Total Chats</span>
                          <span className="font-medium">{monthChats}</span>
                        </div>
                      </div>
                      <Button className="w-full" onClick={() => navigate('/crm')}>
                        Open Full CRM
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-auto flex-col py-4" onClick={() => navigate('/onboarding')}>
                      <GraduationCap className="h-6 w-6 mb-2" />
                      <span>Training Portal</span>
                    </Button>
                    <Button variant="outline" className="h-auto flex-col py-4" onClick={() => navigate('/broker-dashboard')}>
                      <MapPin className="h-6 w-6 mb-2" />
                      <span>Developer Visits</span>
                    </Button>
                    <Button variant="outline" className="h-auto flex-col py-4" onClick={() => navigate('/crm')}>
                      <Target className="h-6 w-6 mb-2" />
                      <span>Lead Management</span>
                    </Button>
                    <Button variant="outline" className="h-auto flex-col py-4" onClick={() => navigate('/broker-toolkit')}>
                      <FileSignature className="h-6 w-6 mb-2" />
                      <span>Broker Toolkit</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks">
              <AdminTasksPanel />
            </TabsContent>

            <TabsContent value="courses">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>My Courses</CardTitle>
                      <CardDescription>Track your learning progress</CardDescription>
                    </div>
                    <Button onClick={() => navigate('/onboarding')}>
                      Go to Training Portal
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {modules.map((module) => {
                      const moduleProgress = progress.find(p => p.module_id === module.id);
                      const isComplete = moduleProgress?.is_completed;
                      return (
                        <div 
                          key={module.id} 
                          className={`flex items-center justify-between p-4 rounded-lg border ${isComplete ? 'bg-green-500/5 border-green-500/20' : 'bg-muted/30'}`}
                        >
                          <div className="flex items-center gap-3">
                            {isComplete ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium">{module.title}</p>
                              <p className="text-sm text-muted-foreground capitalize">{module.category} • {module.duration_minutes} min</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {isComplete && moduleProgress?.completed_at ? (
                              <p className="text-xs text-muted-foreground">
                                Completed {format(new Date(moduleProgress.completed_at), 'MMM d, yyyy')}
                              </p>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calls">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Call History
                  </CardTitle>
                  <CardDescription>Track all your outbound and inbound calls</CardDescription>
                </CardHeader>
                <CardContent>
                  {callLogs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No calls recorded yet.</p>
                      <p className="text-sm">Your call activity will appear here.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {callLogs.map((call) => (
                          <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${call.call_type === 'inbound' ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                                <Phone className={`h-4 w-4 ${call.call_type === 'inbound' ? 'text-green-500' : 'text-blue-500'}`} />
                              </div>
                              <div>
                                <p className="font-medium">{call.phone_number}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(call.created_at), 'MMM d, yyyy h:mm a')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={call.call_status === 'completed' ? 'default' : 'secondary'}>
                                {call.call_status}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDuration(call.duration_seconds)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chats">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Chat History
                  </CardTitle>
                  <CardDescription>Track all your WhatsApp and messaging activity</CardDescription>
                </CardHeader>
                <CardContent>
                  {chatLogs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No chats recorded yet.</p>
                      <p className="text-sm">Your chat activity will appear here.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {chatLogs.map((chat) => (
                          <div key={chat.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-green-500/20">
                                <MessageCircle className="h-4 w-4 text-green-500" />
                              </div>
                              <div>
                                <p className="font-medium">{chat.contact_number || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {chat.platform} • {format(new Date(chat.created_at), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">{chat.message_count} messages</Badge>
                              {chat.last_message_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Last: {format(new Date(chat.last_message_at), 'h:mm a')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rewards">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Points & Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white mb-4">
                        <span className="text-3xl font-bold">{points?.level || 1}</span>
                      </div>
                      <h3 className="text-xl font-bold">Level {points?.level || 1}</h3>
                      <p className="text-muted-foreground">
                        {points?.points || 0} points available
                      </p>
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Total Points Earned</span>
                          <span className="font-bold">{points?.total_points_earned || 0}</span>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full" onClick={() => navigate('/onboarding')}>
                      <Gift className="h-4 w-4 mr-2" />
                      View Rewards Catalog
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      How to Earn Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-primary" />
                          <span className="text-sm">Complete Training Module</span>
                        </div>
                        <Badge>+50 pts</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Developer Visit Check-in</span>
                        </div>
                        <Badge>+25 pts</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Developer Visit Check-out</span>
                        </div>
                        <Badge>+25 pts</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-purple-500" />
                          <span className="text-sm">Log Call Activity</span>
                        </div>
                        <Badge>+10 pts</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-amber-500" />
                          <span className="text-sm">Close a Deal</span>
                        </div>
                        <Badge>+500 pts</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default BrokerAccount;
