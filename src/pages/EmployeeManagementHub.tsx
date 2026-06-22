import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, UserPlus, Shield, Key, Settings, CheckCircle, Clock, AlertCircle,
  FileText, Search, Plus, RefreshCw, Monitor, Briefcase, Activity,
  BarChart3, Mail, Lock, Building2, Calendar, TrendingUp, Eye, 
  ArrowLeft, Brain, Zap, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import NewJoinerApplicationForm from '@/components/it-department/NewJoinerApplicationForm';
import NewJoinerApplicationsList from '@/components/it-department/NewJoinerApplicationsList';
import ITTasksList from '@/components/it-department/ITTasksList';
import EmployeeJourneyTracker from '@/components/employee-management/EmployeeJourneyTracker';
import EmployeeActivityAudit from '@/components/employee-management/EmployeeActivityAudit';
import ITProvisioningPanel from '@/components/employee-management/ITProvisioningPanel';
import EmployeeAssignmentsPanel from '@/components/employee-management/EmployeeAssignmentsPanel';
import { Link } from 'react-router-dom';

const EmployeeManagementHub: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showNewJoinerForm, setShowNewJoinerForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    pendingHR: 0,
    pendingIT: 0,
    inProgress: 0,
    completedThisMonth: 0,
    activeEmployees: 0,
    onProbation: 0,
    avgOnboardingDays: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    checkAuthorization();
    fetchStats();
    fetchRecentActivity();
  }, []);

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('crm_users_profile')
        .select('crm_role, department, is_active')
        .eq('user_id', user.id)
        .single();

      if (profile && profile.is_active) {
        const hasOwnerRole = ['owner_admin', 'founder'].includes(profile.crm_role);
        const isHR = profile.department === 'Human Resources';
        const isIT = profile.department === 'IT';
        setIsAuthorized(hasOwnerRole || isHR || isIT);
      }
    } catch (error) {
      console.error('Authorization check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: pendingHR } = await supabase
        .from('new_joiner_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review');

      const { count: pendingIT } = await supabase
        .from('new_joiner_applications')
        .select('*', { count: 'exact', head: true })
        .in('status', ['hr_approved', 'it_processing']);

      const { count: inProgress } = await supabase
        .from('new_joiner_applications')
        .select('*', { count: 'exact', head: true })
        .in('status', ['hr_approved', 'it_processing', 'webdev_processing']);

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { count: completedThisMonth } = await supabase
        .from('new_joiner_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', monthStart.toISOString());

      const { count: activeEmployees } = await supabase
        .from('crm_users_profile')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const { count: onProbation } = await supabase
        .from('new_joiner_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', ninetyDaysAgo.toISOString());

      setStats({
        pendingHR: pendingHR || 0,
        pendingIT: pendingIT || 0,
        inProgress: inProgress || 0,
        completedThisMonth: completedThisMonth || 0,
        activeEmployees: activeEmployees || 0,
        onProbation: onProbation || 0,
        avgOnboardingDays: 3
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from('new_joiner_applications')
        .select('id, full_name, status, department, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);
      setRecentActivity(data || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  /**
   * Seed a fully HR-approved test joiner so the IT Provisioning queue
   * has something to act on. Lets the owner exercise the end-to-end
   * provisioning + branded email flow without HR sign-off paperwork.
   */
  const handleSeedTestJoiner = async () => {
    setSeeding(true);
    try {
      const stamp = Date.now().toString().slice(-5);
      const { error } = await supabase.from('new_joiner_applications').insert({
        full_name: `Test Joiner ${stamp}`,
        email: `test.joiner.${stamp}@example.com`,
        phone: '+971500000000',
        nationality: 'United Arab Emirates',
        languages: ['English'],
        job_title: 'Sales Broker',
        department: 'Sales',
        crm_role: 'broker_member',
        contract_type: 'full_time',
        status: 'hr_approved',
        hr_approved_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        hr_notes: 'Seeded test joiner for IT provisioning QA.',
      });
      if (error) throw error;
      toast.success('Test joiner added to IT Provisioning queue');
      setActiveTab('provisioning');
      fetchStats();
      fetchRecentActivity();
    } catch (e: any) {
      console.error('Seed test joiner failed:', e);
      toast.error(e.message || 'Could not seed test joiner');
    } finally {
      setSeeding(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending_review: { color: 'bg-amber-500/20 text-amber-700 border-amber-500/30', label: 'HR Review' },
      hr_approved: { color: 'bg-blue-500/20 text-blue-700 border-blue-500/30', label: 'HR Approved' },
      it_processing: { color: 'bg-purple-500/20 text-purple-700 border-purple-500/30', label: 'IT Processing' },
      webdev_processing: { color: 'bg-cyan-500/20 text-cyan-700 border-cyan-500/30', label: 'Web Setup' },
      completed: { color: 'jj-emerald-solid/20 text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30/30', label: 'Completed' },
      rejected: { color: 'bg-red-500/20 text-red-700 border-red-500/30', label: 'Rejected' }
    };
    const config = statusConfig[status] || { color: 'bg-[#B89555]/20 text-[#1A1A1A]/70', label: status };
    return <Badge className={`${config.color} border`}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B89555]" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-[#1A1A1A]" />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">Access Restricted</h1>
          <p className="text-[#1A1A1A]/70 mb-8">
            This area is restricted to HR, IT Department personnel, and administrators.
          </p>
          <Button variant="primary" onClick={() => navigate('/crm')}>
            Return to CRM
          </Button>
        </div>
      </div>
    );
  }

  // KPI cards — all clickable, jump to relevant tab
  const kpiCards = [
    { key: 'pendingHR', label: 'Pending HR', value: stats.pendingHR, Icon: Clock, ring: 'border-amber-500/40', tint: 'text-amber-700', tab: 'applications' },
    { key: 'pendingIT', label: 'IT Queue', value: stats.pendingIT, Icon: Monitor, ring: 'border-purple-500/40', tint: 'text-purple-700', tab: 'provisioning' },
    { key: 'inProgress', label: 'In Progress', value: stats.inProgress, Icon: Zap, ring: 'border-blue-500/40', tint: 'text-blue-700', tab: 'journey' },
    { key: 'completedThisMonth', label: 'This Month', value: stats.completedThisMonth, Icon: CheckCircle, ring: 'border-[color:var(--emerald-1)]/30/40', tint: 'text-[color:var(--emerald-1)]', tab: 'audit' },
    { key: 'activeEmployees', label: 'Active Staff', value: stats.activeEmployees, Icon: Users, ring: 'border-[#B89555]/40', tint: 'text-[#1A1A1A]', tab: 'journey' },
    { key: 'onProbation', label: 'On Probation', value: stats.onProbation, Icon: AlertCircle, ring: 'border-orange-500/40', tint: 'text-orange-700', tab: 'journey' },
    { key: 'avgOnboardingDays', label: 'Avg Onboard', value: `${stats.avgOnboardingDays}d`, Icon: TrendingUp, ring: 'border-cyan-500/40', tint: 'text-cyan-700', tab: 'audit' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <section className="relative py-8 overflow-hidden border-b border-[#B89555]/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <Link to="/crm">
                <Button variant="ghost" size="sm" className="text-[#1A1A1A] hover:text-[#1A1A1A]">
                  <ArrowLeft className="h-4 w-4 mr-2" />Back to CRM
                </Button>
              </Link>
              <div className="h-6 w-px bg-[#EFE6D6]/30" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
                  <Users className="h-6 w-6 text-[#1A1A1A]" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-[#1A1A1A] truncate">Employee Management Hub</h1>
                  <p className="text-sm text-[#1A1A1A]/70 truncate">HR + IT Unified Onboarding & Audit System</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleSeedTestJoiner} disabled={seeding}>
                {seeding ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Seed Test Joiner
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { fetchStats(); fetchRecentActivity(); }}>
                <RefreshCw className="w-4 h-4 mr-2" />Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowNewJoinerForm(true)}>
                <UserPlus className="w-4 h-4 mr-2" />New Joiner
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards — clickable */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {kpiCards.map(({ key, label, value, Icon, ring, tint, tab }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`text-left rounded-xl border-2 ${ring} bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] px-4 pt-4 pb-3 transition-all hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#B89555]/60`}
              aria-label={`${label}: ${value}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${tint}`} />
                <span className={`text-2xl font-bold ${tint}`}>{value}</span>
              </div>
              <p className="text-xs text-[#1A1A1A]/70">{label}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
            {/* Horizontally scrollable tab strip — never overflows when chat panel narrows the viewport */}
            <div className="min-w-0 flex-1 -mx-1 px-1 overflow-x-auto">
              <TabsList className="inline-flex w-max bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 p-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] text-[#1A1A1A] whitespace-nowrap">
                  <BarChart3 className="w-4 h-4 mr-2" />Overview
                </TabsTrigger>
                <TabsTrigger value="applications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] text-[#1A1A1A] whitespace-nowrap">
                  <UserPlus className="w-4 h-4 mr-2" />Applications
                </TabsTrigger>
                <TabsTrigger value="provisioning" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] text-[#1A1A1A] whitespace-nowrap">
                  <Key className="w-4 h-4 mr-2" />IT Provisioning
                </TabsTrigger>
                <TabsTrigger value="assignments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] text-[#1A1A1A] whitespace-nowrap">
                  <UserPlus className="w-4 h-4 mr-2" />Lead Assignments
                </TabsTrigger>
                <TabsTrigger value="journey" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] text-[#1A1A1A] whitespace-nowrap">
                  <Activity className="w-4 h-4 mr-2" />Employee Journey
                </TabsTrigger>
                <TabsTrigger value="audit" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] text-[#1A1A1A] whitespace-nowrap">
                  <Eye className="w-4 h-4 mr-2" />Activity Audit
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex items-center gap-3 lg:flex-none">
              <div className="relative w-full lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 text-[#1A1A1A] w-full placeholder:text-[#1A1A1A]/70"
                />
              </div>
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <Card className="lg:col-span-2 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
                <CardHeader>
                  <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#1A1A1A]" />
                    Recent Onboarding Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {recentActivity.map((item) => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-[#FDFBF7]/50 border border-[#B89555]/20"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center">
                              <UserCheck className="w-5 h-5 text-[#1A1A1A]" />
                            </div>
                            <div>
                              <p className="font-medium text-[#1A1A1A]">{item.full_name}</p>
                              <p className="text-xs text-[#1A1A1A]/70">{item.department}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(item.status)}
                            <p className="text-xs text-[#1A1A1A]/70 mt-1">
                              {new Date(item.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {recentActivity.length === 0 && (
                        <p className="text-center text-[#1A1A1A]/70 py-8">No recent activity</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
                <CardHeader>
                  <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#1A1A1A]" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="secondary" className="w-full justify-start" onClick={() => setShowNewJoinerForm(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />Submit New Joiner
                  </Button>
                  <Button variant="secondary" className="w-full justify-start" onClick={handleSeedTestJoiner} disabled={seeding}>
                    {seeding ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Seed Test Joiner (HR-approved)
                  </Button>
                  <Button variant="secondary" className="w-full justify-start" onClick={() => setActiveTab('provisioning')}>
                    <Key className="w-4 h-4 mr-2" />IT Provisioning Queue
                  </Button>
                  <Button variant="secondary" className="w-full justify-start" onClick={() => setActiveTab('audit')}>
                    <Eye className="w-4 h-4 mr-2" />View Activity Audit
                  </Button>
                  <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/crm/employees')}>
                    <Users className="w-4 h-4 mr-2" />Employee Directory
                  </Button>
                </CardContent>
              </Card>

              {/* Onboarding Pipeline */}
              <Card className="lg:col-span-3 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
                <CardHeader>
                  <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#1A1A1A]" />
                    Onboarding Pipeline
                  </CardTitle>
                  <CardDescription className="text-[#1A1A1A]/70">
                    Visual workflow from application to fully onboarded employee
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-4">
                    {[
                      { label: 'HR Review', count: stats.pendingHR, color: 'bg-amber-500' },
                      { label: 'HR Approved', count: 0, color: 'bg-blue-500' },
                      { label: 'IT Setup', count: stats.pendingIT, color: 'bg-purple-500' },
                      { label: 'CRM Access', count: 0, color: 'bg-cyan-500' },
                      { label: 'Completed', count: stats.completedThisMonth, color: 'jj-emerald-solid' }
                    ].map((stage, idx) => (
                      <React.Fragment key={stage.label}>
                        <div className="flex-1 text-center">
                          <div className={`w-12 h-12 mx-auto rounded-full ${stage.color} text-white flex items-center justify-center text-lg font-bold`}>
                            {stage.count}
                          </div>
                          <p className="text-xs text-[#1A1A1A]/70 mt-2">{stage.label}</p>
                        </div>
                        {idx < 4 && (
                          <div className="w-8 h-0.5 bg-[#EFE6D6]/30" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="applications">
            <NewJoinerApplicationsList searchQuery={searchQuery} onRefresh={fetchStats} />
          </TabsContent>

          <TabsContent value="provisioning">
            <ITProvisioningPanel searchQuery={searchQuery} onRefresh={fetchStats} />
          </TabsContent>

          <TabsContent value="assignments">
            <EmployeeAssignmentsPanel searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="journey">
            <EmployeeJourneyTracker searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="audit">
            <EmployeeActivityAudit searchQuery={searchQuery} />
          </TabsContent>
        </Tabs>
      </section>

      <NewJoinerApplicationForm
        isOpen={showNewJoinerForm}
        onClose={() => setShowNewJoinerForm(false)}
        onSuccess={() => {
          setShowNewJoinerForm(false);
          fetchStats();
          fetchRecentActivity();
          toast.success('New joiner application submitted successfully!');
        }}
      />
    </div>
  );
};

export default EmployeeManagementHub;
