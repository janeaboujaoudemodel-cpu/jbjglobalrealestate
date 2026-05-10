import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Monitor, UserPlus, Shield, Key, Server, 
  Settings, CheckCircle, Clock, AlertCircle,
  Users, FileText, Search, Plus, RefreshCw, Bell, Brain, Home
} from 'lucide-react';
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
import { CommandPalette } from '@/components/ui/command-palette';
import { FloatingActionBar } from '@/components/ui/floating-action-bar';

const ITDepartment: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showNewJoinerForm, setShowNewJoinerForm] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
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

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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
        const hasOwnerRole = ['owner_admin', 'founder'].includes(profile.crm_role);
        const isIT = profile.department === 'IT';
        setIsAuthorized(hasOwnerRole || isIT);
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
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B89555]" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#EFE6D6]/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-[#1A1A1A]" />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">Access Restricted</h1>
          <p className="text-[#1A1A1A]/70 mb-8">
            This area is restricted to IT Department personnel and administrators.
          </p>
          <Button 
            variant="primary"
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4 mr-2" />
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
      {/* Command Palette */}
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
      
      {/* Hero Section - Premium Champagne */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#EFE6D6]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 bg-[#FDFBF7] border-2 border-[#B89555]/30 rounded-full px-6 py-2 mb-6 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <Monitor className="w-5 h-5 text-[#1A1A1A]" />
              <span className="text-[#1A1A1A] font-medium">IT Department Portal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
              Information Technology <span className="text-[#1A1A1A]">Hub</span>
            </h1>
            <p className="text-xl text-[#1A1A1A]/70 max-w-2xl mx-auto">
              Manage new joiner onboarding, CRM credentials, and IT operations
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Cards - Premium White/Gold */}
      <section className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#FDFBF7] border-2 border-orange-500/30 shadow-[0_4px_20px_rgba(249,115,22,0.1)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#1A1A1A]/70 text-sm">Pending Applications</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendingApplications}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#FDFBF7] border-2 border-blue-500/30 shadow-[0_4px_20px_rgba(59,130,246,0.1)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#1A1A1A]/70 text-sm">Open IT Tasks</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.openTasks}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#FDFBF7] border-2 border-green-500/30 shadow-[0_4px_20px_rgba(34,197,94,0.1)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#1A1A1A]/70 text-sm">Completed Today</p>
                  <p className="text-3xl font-bold text-green-600">{stats.completedToday}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#1A1A1A]/70 text-sm">Active Employees</p>
                  <p className="text-3xl font-bold text-[#1A1A1A]">{stats.activeEmployees}</p>
                </div>
                <div className="w-12 h-12 bg-[#EFE6D6]/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#1A1A1A]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12 pb-24">
        <Tabs defaultValue="applications" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <TabsList className="bg-[#FDFBF7]/80 border-2 border-[#B89555]/30 p-1">
              <TabsTrigger value="applications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40 text-[#1A1A1A]">
                <UserPlus className="w-4 h-4 mr-2" />
                New Joiner Applications
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40 text-[#1A1A1A]">
                <FileText className="w-4 h-4 mr-2" />
                IT Tasks
              </TabsTrigger>
              <TabsTrigger value="team" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40 text-[#1A1A1A]">
                <Users className="w-4 h-4 mr-2" />
                IT Team
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A] w-64 placeholder:text-[#1A1A1A]/70"
                />
              </div>
              <Button
                variant="primary"
                onClick={() => setShowNewJoinerForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Joiner Application
              </Button>
              <Button
                variant="secondary"
                onClick={() => fetchStats()}
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

      {/* Floating Action Bar */}
      <FloatingActionBar />

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
