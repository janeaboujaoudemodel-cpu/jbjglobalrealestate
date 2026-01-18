import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Monitor, UserPlus, Shield, Key, Server, 
  Settings, CheckCircle, Clock, AlertCircle,
  Users, FileText, Search, Plus, RefreshCw
} from 'lucide-react';
import GlobalHeader from '@/components/GlobalHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { itTeam } from '@/config/team-members';
import NewJoinerApplicationForm from '@/components/it-department/NewJoinerApplicationForm';
import NewJoinerApplicationsList from '@/components/it-department/NewJoinerApplicationsList';
import ITTasksList from '@/components/it-department/ITTasksList';
import ITTeamDirectory from '@/components/it-department/ITTeamDirectory';

const ITDepartment: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showNewJoinerForm, setShowNewJoinerForm] = useState(false);
  const [stats, setStats] = useState({
    pendingApplications: 0,
    openTasks: 0,
    completedToday: 0,
    activeEmployees: 0
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAuthorization();
    fetchStats();
  }, []);

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user is admin, owner, founder, or IT department member
      const { data: profile } = await supabase
        .from('crm_users_profile')
        .select('crm_role, department, is_active')
        .eq('user_id', user.id)
        .single();

      if (profile && profile.is_active) {
        const isAdmin = ['admin', 'owner_admin', 'founder'].includes(profile.crm_role);
        const isIT = profile.department === 'IT';
        setIsAuthorized(isAdmin || isIT);
      }
    } catch (error) {
      console.error('Authorization check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch pending applications count
      const { count: pendingCount } = await supabase
        .from('new_joiner_applications')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending_review', 'it_processing']);

      // Fetch open IT tasks count
      const { count: tasksCount } = await supabase
        .from('it_department_tasks')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);

      // Fetch completed today count
      const today = new Date().toISOString().split('T')[0];
      const { count: completedCount } = await supabase
        .from('new_joiner_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', today);

      // Fetch active employees count
      const { count: employeesCount } = await supabase
        .from('crm_users_profile')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setStats({
        pendingApplications: pendingCount || 0,
        openTasks: tasksCount || 0,
        completedToday: completedCount || 0,
        activeEmployees: employeesCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <Shield className="w-16 h-16 text-gold mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Access Restricted</h1>
          <p className="text-zinc-400 mb-8">
            This area is restricted to IT Department personnel and administrators.
          </p>
          <Button 
            onClick={() => navigate('/')}
            className="bg-gold text-black hover:bg-gold/90"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <GlobalHeader />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 bg-gold/10 border border-gold/30 rounded-full px-6 py-2 mb-6">
              <Monitor className="w-5 h-5 text-gold" />
              <span className="text-gold font-medium">IT Department Portal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Information Technology Hub
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Manage new joiner onboarding, CRM credentials, and IT operations
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900/50 border-gold/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Pending Applications</p>
                  <p className="text-3xl font-bold text-gold">{stats.pendingApplications}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-gold/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Open IT Tasks</p>
                  <p className="text-3xl font-bold text-gold">{stats.openTasks}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-gold/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Completed Today</p>
                  <p className="text-3xl font-bold text-gold">{stats.completedToday}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-gold/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Active Employees</p>
                  <p className="text-3xl font-bold text-gold">{stats.activeEmployees}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <Tabs defaultValue="applications" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <TabsList className="bg-zinc-900/50 border border-gold/20">
              <TabsTrigger value="applications" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                <UserPlus className="w-4 h-4 mr-2" />
                New Joiner Applications
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                <FileText className="w-4 h-4 mr-2" />
                IT Tasks
              </TabsTrigger>
              <TabsTrigger value="team" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                <Users className="w-4 h-4 mr-2" />
                IT Team
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-zinc-900/50 border-gold/20 text-white w-64"
                />
              </div>
              <Button
                onClick={() => setShowNewJoinerForm(true)}
                className="bg-gold text-black hover:bg-gold/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Joiner Application
              </Button>
              <Button
                variant="outline"
                onClick={() => fetchStats()}
                className="border-gold/30 text-gold hover:bg-gold/10"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="applications">
            <NewJoinerApplicationsList 
              searchQuery={searchQuery}
              onRefresh={fetchStats}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <ITTasksList 
              searchQuery={searchQuery}
              onRefresh={fetchStats}
            />
          </TabsContent>

          <TabsContent value="team">
            <ITTeamDirectory 
              searchQuery={searchQuery}
              teamMembers={itTeam}
            />
          </TabsContent>
        </Tabs>
      </section>

      {/* New Joiner Application Form Modal */}
      <NewJoinerApplicationForm
        isOpen={showNewJoinerForm}
        onClose={() => setShowNewJoinerForm(false)}
        onSuccess={() => {
          setShowNewJoinerForm(false);
          fetchStats();
          toast.success('New joiner application submitted successfully!');
        }}
      />
    </div>
  );
};

export default ITDepartment;
