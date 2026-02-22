import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SectionDivider } from '@/components/ui/section-divider';
import {
  BrokerToolkitSupport,
  BrokerToolkitEducation,
  BrokerToolkitAcademy,
  BrokerToolkitOperations,
  BrokerToolkitCRM,
  BrokerToolkitGrowth,
  BrokerToolkitReferral,
  BrokerToolkitTools,
} from '@/components/broker-toolkit';
import {
  BarChart3, Users, User, Mail, UserCheck, Heart, Star,
  BookOpen, Award, ArrowRight, Briefcase, Phone,
  GraduationCap, Target, MessageSquare, Video, Upload,
  Sparkles, Shield, ArrowUpRight, FolderOpen, FileText,
  CheckCircle2, Clock, TrendingUp, MessageCircle, Ticket,
  FileUp, Palette, Wrench
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const quickAccessCards = [
  { title: 'Broker Dashboard', desc: 'Performance & analytics', icon: BarChart3, href: '/broker-dashboard', color: 'from-fuchsia-500 to-purple-600' },
  { title: 'CRM', desc: 'Manage leads & clients', icon: Users, href: '/crm', color: 'from-violet-500 to-purple-600' },
  { title: 'Listing Portal', desc: 'Upload & manage listings', icon: Upload, href: '/listing-portal', color: 'from-emerald-500 to-teal-600' },
  { title: 'My Profile', desc: 'Account & settings', icon: User, href: '/my-account', color: 'from-blue-500 to-indigo-600' },
  { title: 'Broker Education', desc: 'Courses & books', icon: GraduationCap, href: '/broker-education', color: 'from-amber-500 to-orange-600' },
  { title: 'Certification', desc: 'Get certified', icon: Award, href: '/services/broker-certification', color: 'from-rose-500 to-pink-600' },
];

const brokerAITools = [
  { title: 'Lead Qualification', desc: 'AI-powered lead scoring', icon: Target, href: '/ai-lead-qualification' },
  { title: 'Objection Handler', desc: 'AI responses to objections', icon: MessageSquare, href: '/ai-objection-handler' },
  { title: 'AI Email Generator', desc: 'Professional property emails', icon: Mail, href: '/ai-email-generator' },
  { title: 'Client Matcher', desc: 'AI-powered lead matching', icon: UserCheck, href: '/ai-client-matcher' },
  { title: 'Meeting Summarizer', desc: 'Summarize meetings', icon: Video, href: '/ai-meeting-summarizer' },
  { title: 'Call Summarizer', desc: 'Summarize client calls', icon: Phone, href: '/ai-call-summarizer' },
];

const BrokerHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [trainingProgress, setTrainingProgress] = useState<any[]>([]);
  const [activityStats, setActivityStats] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchData = async () => {
      try {
        const [callsRes, chatsRes, modulesRes, progressRes, statsRes, ticketsRes] = await Promise.all([
          supabase.from('broker_call_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
          supabase.from('broker_chat_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
          supabase.from('hr_training_modules').select('id, title, category, duration_minutes').order('display_order'),
          supabase.from('broker_training_progress').select('module_id, is_completed, completed_at').eq('user_id', user.id),
          supabase.from('broker_activity_stats').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
          supabase.from('support_tickets').select('id, ticket_number, subject, status, priority, created_at').eq('email', user.email || '').order('created_at', { ascending: false }).limit(10),
        ]);
        if (callsRes.data) setCallLogs(callsRes.data);
        if (chatsRes.data) setChatLogs(chatsRes.data);
        if (modulesRes.data) setModules(modulesRes.data);
        if (progressRes.data) setTrainingProgress(progressRes.data);
        if (statsRes.data) setActivityStats(statsRes.data);
        if (ticketsRes.data) setSupportTickets(ticketsRes.data);
      } catch (err) {
        console.error('Error fetching broker hub data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const completedModules = trainingProgress.filter(p => p.is_completed).length;
  const totalModules = modules.length;
  const progressPercent = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  const today = new Date();
  const thisWeekStats = activityStats.filter(s => {
    const d = new Date(s.date);
    return d >= startOfWeek(today) && d <= endOfWeek(today);
  });
  const thisMonthStats = activityStats.filter(s => {
    const d = new Date(s.date);
    return d >= startOfMonth(today) && d <= endOfMonth(today);
  });
  const weekCalls = thisWeekStats.reduce((sum: number, s: any) => sum + (s.calls_made || 0), 0);
  const weekChats = thisWeekStats.reduce((sum: number, s: any) => sum + (s.chats_sent || 0), 0);
  const monthCalls = thisMonthStats.reduce((sum: number, s: any) => sum + (s.calls_made || 0), 0);
  const monthChats = thisMonthStats.reduce((sum: number, s: any) => sum + (s.chats_sent || 0), 0);

  const openTickets = supportTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero */}
      <div className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-950/30 via-black to-purple-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,100,255,0.08),transparent_60%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="mb-4 bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              JBJ Broker Hub
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
              Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''}
            </h1>
            <p className="text-zinc-400 text-lg">
              Your command center for training, education, listings, CRM, and broker operations.
            </p>
            {/* Favorites & Shortlist */}
            <div className="flex items-center justify-center gap-3 mt-5">
              <Link
                to="/favorites"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500/15 to-pink-500/15 border border-rose-500/30 text-rose-400 hover:border-rose-400 hover:bg-rose-500/20 transition-all text-sm font-medium"
              >
                <Heart className="w-4 h-4" />
                My Favorites
              </Link>
              <Link
                to="/compare"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-400 hover:border-amber-400 hover:bg-amber-500/20 transition-all text-sm font-medium"
              >
                <Star className="w-4 h-4" />
                My Shortlist
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-10 space-y-10">
        {/* Quick Access - Premium */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickAccessCards.map(card => {
              const Icon = card.icon;
              return (
                <motion.button
                  key={card.title}
                  onClick={() => navigate(card.href)}
                  className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 border border-fuchsia-500/25 rounded-2xl p-5 text-left hover:border-fuchsia-400/60 transition-all group overflow-hidden"
                  whileHover={{ y: -4, scale: 1.02 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1 relative z-10">{card.title}</h3>
                  <p className="text-zinc-500 text-xs relative z-10">{card.desc}</p>
                  <ArrowRight className="w-4 h-4 text-fuchsia-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity relative z-10" />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Activity, Training, Support Tabs */}
        {user && (
          <div>
            <Tabs defaultValue="activity" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5 bg-zinc-900/60 border border-zinc-800">
                <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
                <TabsTrigger value="training" className="text-xs sm:text-sm">Training</TabsTrigger>
                <TabsTrigger value="calls" className="text-xs sm:text-sm">Calls</TabsTrigger>
                <TabsTrigger value="chats" className="text-xs sm:text-sm">Chats</TabsTrigger>
                <TabsTrigger value="support" className="text-xs sm:text-sm">Support</TabsTrigger>
              </TabsList>

              <TabsContent value="activity">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-zinc-900/60 border-zinc-800">
                    <CardContent className="p-4 text-center">
                      <Phone className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{callLogs.length}</p>
                      <p className="text-xs text-zinc-500">Total Calls</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-900/60 border-zinc-800">
                    <CardContent className="p-4 text-center">
                      <MessageCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{chatLogs.length}</p>
                      <p className="text-xs text-zinc-500">Total Chats</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-900/60 border-zinc-800">
                    <CardContent className="p-4 text-center">
                      <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{weekCalls + weekChats}</p>
                      <p className="text-xs text-zinc-500">This Week</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-900/60 border-zinc-800">
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{monthCalls + monthChats}</p>
                      <p className="text-xs text-zinc-500">This Month</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="training">
                <Card className="bg-zinc-900/60 border-zinc-800">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-400">Completed Courses</span>
                      <span className="text-white font-medium">{completedModules}/{totalModules}</span>
                    </div>
                    <Progress value={progressPercent} className="h-3" />
                    <div className="space-y-2 mt-4">
                      {modules.slice(0, 6).map((mod: any) => {
                        const done = trainingProgress.find((p: any) => p.module_id === mod.id)?.is_completed;
                        return (
                          <div key={mod.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50">
                            <div className="flex items-center gap-2">
                              {done ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-zinc-500" />}
                              <span className="text-sm text-zinc-300">{mod.title}</span>
                            </div>
                            <Badge className={done ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-zinc-700/50 text-zinc-400 border-zinc-600'}>
                              {done ? 'Done' : `${mod.duration_minutes}m`}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                    <Button variant="outline" className="w-full border-zinc-700 text-zinc-300" onClick={() => navigate('/onboarding')}>
                      View All Courses <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calls">
                <Card className="bg-zinc-900/60 border-zinc-800">
                  <CardContent className="p-6">
                    {callLogs.length === 0 ? (
                      <p className="text-center text-zinc-500 py-8">No call logs yet</p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {callLogs.slice(0, 10).map((call: any) => (
                          <div key={call.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-blue-400" />
                              <div>
                                <p className="text-sm text-white">{call.phone_number}</p>
                                <p className="text-xs text-zinc-500">{format(new Date(call.created_at), 'MMM d, HH:mm')}</p>
                              </div>
                            </div>
                            <Badge className="bg-zinc-700/50 text-zinc-300 border-zinc-600 text-xs">{call.call_status || 'completed'}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chats">
                <Card className="bg-zinc-900/60 border-zinc-800">
                  <CardContent className="p-6">
                    {chatLogs.length === 0 ? (
                      <p className="text-center text-zinc-500 py-8">No chat logs yet</p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {chatLogs.slice(0, 10).map((chat: any) => (
                          <div key={chat.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <MessageCircle className="w-4 h-4 text-emerald-400" />
                              <div>
                                <p className="text-sm text-white">{chat.platform || 'WhatsApp'} - {chat.contact_number}</p>
                                <p className="text-xs text-zinc-500">{chat.message_count} messages</p>
                              </div>
                            </div>
                            <span className="text-xs text-zinc-500">{format(new Date(chat.created_at), 'MMM d')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="support">
                <Card className="bg-zinc-900/60 border-zinc-800">
                  <CardContent className="p-6">
                    {supportTickets.length === 0 ? (
                      <div className="text-center py-8">
                        <Ticket className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-500">No support tickets</p>
                        <Button variant="outline" className="mt-4 border-zinc-700 text-zinc-300" onClick={() => navigate('/support')}>
                          Create a Ticket
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-4">
                          <p className="text-sm text-zinc-400">{openTickets} open ticket{openTickets !== 1 ? 's' : ''}</p>
                          <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300" onClick={() => navigate('/support')}>
                            New Ticket
                          </Button>
                        </div>
                        {supportTickets.map((ticket: any) => (
                          <div key={ticket.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                            <div>
                              <p className="text-sm text-white">{ticket.subject}</p>
                              <p className="text-xs text-zinc-500">#{ticket.ticket_number} · {format(new Date(ticket.created_at), 'MMM d')}</p>
                            </div>
                            <Badge className={
                              ticket.status === 'open' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                              ticket.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                              'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            }>
                              {ticket.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* My Documents */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-fuchsia-400" />
            My Documents
          </h2>
          <Card className="bg-zinc-900/60 border border-fuchsia-500/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                  { label: 'RERA Card', icon: FileText },
                  { label: 'Emirates ID', icon: FileText },
                  { label: 'Contracts', icon: FileText },
                  { label: 'Certificates', icon: Award },
                ].map(doc => (
                  <div key={doc.label} className="p-4 bg-zinc-800/50 rounded-xl text-center border border-zinc-700/50 hover:border-fuchsia-500/30 transition-colors cursor-pointer">
                    <doc.icon className="w-8 h-8 mx-auto text-fuchsia-400 mb-2" />
                    <p className="text-xs text-zinc-400">{doc.label}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/10" onClick={() => navigate('/broker-documents')}>
                <FileUp className="w-4 h-4 mr-2" />
                Upload & Manage Documents
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Broker AI Tools */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">AI Sales & Communication Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {brokerAITools.map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.title}
                  onClick={() => navigate(tool.href)}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-left hover:border-fuchsia-500/40 transition-all group"
                >
                  <Icon className="w-5 h-5 text-fuchsia-400 mb-2" />
                  <h3 className="text-white font-medium text-sm">{tool.title}</h3>
                  <p className="text-zinc-500 text-xs mt-1">{tool.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Explore All Tools CTA */}
        <div className="bg-gradient-to-r from-indigo-900/30 to-fuchsia-900/30 border border-fuchsia-500/20 rounded-2xl p-8 text-center">
          <Sparkles className="w-8 h-8 text-fuchsia-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">Explore All AI Tools</h3>
          <p className="text-zinc-400 text-sm mb-4">Access 30+ free AI tools including creative suites, corporate tools, and productivity apps.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/ai-hub')} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white">
              Go to JBJ Tools Hub
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
            <Button onClick={() => navigate('/ai-hub?suite=creative')} variant="outline" className="border-pink-500/30 text-pink-300 hover:bg-pink-500/10">
              <Palette className="w-4 h-4 mr-2" />
              Creative Suite
            </Button>
            <Button onClick={() => navigate('/ai-hub?suite=productivity')} variant="outline" className="border-teal-500/30 text-teal-300 hover:bg-teal-500/10">
              <Wrench className="w-4 h-4 mr-2" />
              Productivity Suite
            </Button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <SectionDivider />

      {/* Broker Toolkit Sections - Education, Training, Operations, etc. */}
      <BrokerToolkitTools />
      <SectionDivider />
      <BrokerToolkitSupport />
      <SectionDivider />
      <BrokerToolkitEducation />
      <SectionDivider />
      <BrokerToolkitAcademy />
      <SectionDivider />
      <BrokerToolkitOperations />
      <SectionDivider />
      <BrokerToolkitCRM />
      <SectionDivider />
      <BrokerToolkitGrowth />
      <SectionDivider />
      <BrokerToolkitReferral />

      {/* Bottom CTA */}
      <section className="py-10 bg-black">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-fuchsia-950/40 to-purple-950/40 border border-fuchsia-500/20 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-2">Access All AI Tools</h3>
            <p className="text-zinc-400 text-sm mb-4">Browse the complete collection of 30+ AI-powered tools.</p>
            <Button onClick={() => navigate('/ai-hub')} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white border-0">
              Go to JBJ Tools Hub
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </section>
  );
};

export default BrokerHub;
