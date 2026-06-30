import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Users,
  FileText,
  Shield,
  Bell,
  Loader2,
  UserPlus,
  ClipboardCheck,
  Calendar,
  BarChart3,
  Settings,
  Briefcase,
  GraduationCap,
  Phone,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Sarah Thompson portrait (Broker Administrator)
import sarahThompsonPortrait from "@/assets/team/sarah-thompson-broker-admin.png";

interface BrokerStats {
  totalBrokers: number;
  activeBrokers: number;
  pendingOnboarding: number;
  reraExpiringThisMonth: number;
}

interface BrokerForOnboarding {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'in_progress' | 'completed';
  startDate: string;
  reraStatus: 'valid' | 'expiring' | 'expired';
}

export default function BrokerAdminAssistant() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<BrokerStats>({
    totalBrokers: 42,
    activeBrokers: 38,
    pendingOnboarding: 4,
    reraExpiringThisMonth: 3,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingBrokers] = useState<BrokerForOnboarding[]>([
    { id: '1', name: 'Ahmed Al-Rashid', email: 'ahmed@example.com', status: 'pending', startDate: '2026-01-20', reraStatus: 'valid' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah.j@example.com', status: 'in_progress', startDate: '2026-01-15', reraStatus: 'valid' },
    { id: '3', name: 'Mohammed Hassan', email: 'm.hassan@example.com', status: 'pending', startDate: '2026-01-22', reraStatus: 'expiring' },
    { id: '4', name: 'Emily Chen', email: 'emily.c@example.com', status: 'in_progress', startDate: '2026-01-18', reraStatus: 'valid' },
  ]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSendMessage = (broker: BrokerForOnboarding) => {
    toast.success(`Opening chat with ${broker.name}...`);
  };

  const handleViewProfile = (broker: BrokerForOnboarding) => {
    toast.info(`Opening profile for ${broker.name}`);
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A]">
          <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1A]" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0A0A0A]">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#B89555]/20 blur-md animate-pulse" />
                  <div className="relative w-16 h-16 rounded-full border-2 border-[#B89555]/50 overflow-hidden bg-[#EFE6D6]">
                    <img 
                      src={sarahThompsonPortrait} 
                      alt="Sarah Thompson" 
                      className="w-full h-full object-cover"
                     loading="lazy" decoding="async" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-4 h-4 jj-surface-emerald border-2 border-[#0A0A0A] rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    Sarah Thompson
                    <Badge className="jj-surface-emerald-soft text-emerald-400 border-[color:var(--emerald-1)]/30/30 text-xs">
                      Broker's Admin
                    </Badge>
                  </h1>
                  <p className="text-[#1A1A1A]/70 text-sm">Your dedicated broker network administrator • Available 24/7</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  className="border-[color:var(--emerald-1)]/30/30 text-emerald-400 hover:jj-surface-emerald-soft"
                  onClick={() => navigate("/jbj-broker-admin")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Broker Owner Panel
                </Button>
                <button className="relative p-3 rounded-full bg-[#1A1A1A] border border-[color:var(--emerald-1)]/30/20 hover:border-[color:var(--emerald-1)]/30/40 transition-all">
                  <Bell className="h-5 w-5 text-emerald-400" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                    4
                  </span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-[#0E0E0E] border-[color:var(--emerald-1)]/30/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#1A1A1A]/70">👥 Total Brokers</p>
                  <p className="text-2xl font-bold text-emerald-400">{stats.totalBrokers}</p>
                </div>
                <Users className="h-8 w-8 text-emerald-500/60" />
              </CardContent>
            </Card>
            <Card className="bg-[#0E0E0E] border-[color:var(--emerald-1)]/30/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#1A1A1A]/70">✅ Active</p>
                  <p className="text-2xl font-bold text-green-400">{stats.activeBrokers}</p>
                </div>
                <Shield className="h-8 w-8 text-green-500/60" />
              </CardContent>
            </Card>
            <Card className="bg-[#0E0E0E] border-yellow-500/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#1A1A1A]/70">⏳ Pending Onboarding</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pendingOnboarding}</p>
                </div>
                <UserPlus className="h-8 w-8 text-yellow-500/60" />
              </CardContent>
            </Card>
            <Card className="bg-[#0E0E0E] border-orange-500/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#1A1A1A]/70">⚠️ RERA Expiring</p>
                  <p className="text-2xl font-bold text-orange-400">{stats.reraExpiringThisMonth}</p>
                </div>
                <ClipboardCheck className="h-8 w-8 text-orange-500/60" />
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-[#0E0E0E] border border-[color:var(--emerald-1)]/30/20 p-1 rounded-lg mb-6 flex flex-wrap gap-1">
              <TabsTrigger 
                value="dashboard" 
                className="flex-1 min-w-[100px] data-[state=active]:jj-surface-emerald"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="onboarding"
                className="flex-1 min-w-[100px] data-[state=active]:jj-surface-emerald"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Onboarding
              </TabsTrigger>
              <TabsTrigger 
                value="compliance"
                className="flex-1 min-w-[100px] data-[state=active]:jj-surface-emerald"
              >
                <Shield className="h-4 w-4 mr-2" />
                Compliance
              </TabsTrigger>
              <TabsTrigger 
                value="directory"
                className="flex-1 min-w-[100px] data-[state=active]:jj-surface-emerald"
              >
                <Users className="h-4 w-4 mr-2" />
                Broker Directory
              </TabsTrigger>
              <TabsTrigger 
                value="training"
                className="flex-1 min-w-[100px] data-[state=active]:jj-surface-emerald"
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Training
              </TabsTrigger>
              <TabsTrigger 
                value="communications"
                className="flex-1 min-w-[100px] data-[state=active]:jj-surface-emerald"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Communications
              </TabsTrigger>
              <TabsTrigger 
                value="documents"
                className="flex-1 min-w-[100px] data-[state=active]:jj-surface-emerald"
              >
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger 
                value="schedule"
                className="flex-1 min-w-[100px] data-[state=active]:jj-surface-emerald"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Quick Actions */}
                    <Card className="bg-[#0E0E0E] border-[color:var(--emerald-1)]/30/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-emerald-400" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start border-[#1A1A1A] text-white hover:bg-[#1A1A1A]">
                          <UserPlus className="h-4 w-4 mr-3 text-emerald-400" />
                          Start New Broker Onboarding
                        </Button>
                        <Button variant="outline" className="w-full justify-start border-[#1A1A1A] text-white hover:bg-[#1A1A1A]">
                          <ClipboardCheck className="h-4 w-4 mr-3 text-yellow-400" />
                          Review RERA Renewals
                        </Button>
                        <Button variant="outline" className="w-full justify-start border-[#1A1A1A] text-white hover:bg-[#1A1A1A]">
                          <FileText className="h-4 w-4 mr-3 text-blue-400" />
                          Generate Compliance Report
                        </Button>
                        <Button variant="outline" className="w-full justify-start border-[#1A1A1A] text-white hover:bg-[#1A1A1A]">
                          <MessageSquare className="h-4 w-4 mr-3 text-purple-400" />
                          Send Bulk Notification
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Pending Onboarding */}
                    <Card className="bg-[#0E0E0E] border-[color:var(--emerald-1)]/30/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <UserPlus className="h-5 w-5 text-yellow-400" />
                          Pending Onboarding ({pendingBrokers.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-3">
                            {pendingBrokers.map((broker) => (
                              <div key={broker.id} className="p-3 bg-[#FDFBF7] rounded-lg border border-[#1A1A1A]">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-white font-medium">{broker.name}</p>
                                    <p className="text-xs text-[#1A1A1A]/70">{broker.email}</p>
                                  </div>
                                  <Badge 
                                    variant={broker.status === 'completed' ? 'default' : broker.status === 'in_progress' ? 'secondary' : 'outline'}
                                    className={broker.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                                  >
                                    {broker.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button size="sm" variant="ghost" className="text-emerald-400 hover:jj-surface-emerald-soft" onClick={() => handleSendMessage(broker)}>
                                    <Phone className="h-3 w-3 mr-1" />
                                    Contact
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/10" onClick={() => handleViewProfile(broker)}>
                                    View Profile
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="bg-[#0E0E0E] border-[color:var(--emerald-1)]/30/20 lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-emerald-400" />
                          Sarah's Activity Today
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-[#FDFBF7] rounded-lg">
                            <div className="w-10 h-10 rounded-full jj-surface-emerald-soft flex items-center justify-center">
                              <UserPlus className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white text-sm">Completed onboarding for <strong>Sarah Johnson</strong></p>
                              <p className="text-xs text-[#1A1A1A]/70">2 hours ago</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-[#FDFBF7] rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                              <ClipboardCheck className="h-5 w-5 text-yellow-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white text-sm">Sent RERA renewal reminder to <strong>3 brokers</strong></p>
                              <p className="text-xs text-[#1A1A1A]/70">4 hours ago</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-[#FDFBF7] rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white text-sm">Updated broker handbook with Q1 2026 compliance updates</p>
                              <p className="text-xs text-[#1A1A1A]/70">5 hours ago</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Other tabs with placeholder content */}
              <TabsContent value="onboarding" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-[#0E0E0E] border-[color:var(--emerald-1)]/30/20">
                    <CardHeader>
                      <CardTitle className="text-white">Broker Onboarding Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#1A1A1A]/70">Manage broker onboarding from application to activation. Track progress, documentation, and training completion.</p>
                      <div className="mt-4 space-y-4">
                        {pendingBrokers.map((broker) => (
                          <div key={broker.id} className="p-4 bg-[#FDFBF7] rounded-lg border border-[#1A1A1A]">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-white font-medium">{broker.name}</h3>
                              <Badge variant={broker.status === 'in_progress' ? 'secondary' : 'outline'}>
                                {broker.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#1A1A1A]/70">Start Date: {broker.startDate}</p>
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" className="jj-surface-emerald hover:jj-surface-emerald">
                                Continue Onboarding
                              </Button>
                              <Button size="sm" variant="outline" className="border-[#1A1A1A]">
                                View Documents
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="compliance" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-[#0E0E0E] border-[color:var(--emerald-1)]/30/20">
                    <CardHeader>
                      <CardTitle className="text-white">RERA & Compliance Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#1A1A1A]/70">Track RERA licenses, compliance documents, and renewal deadlines for all brokers.</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="directory" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-[#0E0E0E] border-[color:var(--emerald-1)]/30/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        <span>Broker Directory</span>
                        <Input 
                          placeholder="Search brokers..." 
                          className="w-64 bg-[#FDFBF7] border-[#1A1A1A]"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#1A1A1A]/70">Complete directory of all active and inactive brokers with contact information and performance metrics.</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="training" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-[#0E0E0E] border-[color:var(--emerald-1)]/30/20">
                    <CardHeader>
                      <CardTitle className="text-white">Training & Certification</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#1A1A1A]/70">Manage broker training modules, track completion, and issue certifications.</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="communications" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-[#0E0E0E] border-[color:var(--emerald-1)]/30/20">
                    <CardHeader>
                      <CardTitle className="text-white">Broker Communications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#1A1A1A]/70">Send announcements, reminders, and individual messages to brokers.</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-[#0E0E0E] border-[color:var(--emerald-1)]/30/20">
                    <CardHeader>
                      <CardTitle className="text-white">Document Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#1A1A1A]/70">Manage broker contracts, licenses, and compliance documentation.</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="schedule" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-[#0E0E0E] border-[color:var(--emerald-1)]/30/20">
                    <CardHeader>
                      <CardTitle className="text-white">Scheduling & Appointments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#1A1A1A]/70">Schedule onboarding sessions, training, and broker meetings.</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
