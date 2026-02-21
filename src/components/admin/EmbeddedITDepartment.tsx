import { useState, useEffect } from 'react';
import { 
  Monitor, UserPlus, CheckCircle, Clock, AlertCircle,
  Users, FileText, Search, Plus, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { itTeam } from '@/config/team-members';
import NewJoinerApplicationForm from '@/components/it-department/NewJoinerApplicationForm';
import NewJoinerApplicationsList from '@/components/it-department/NewJoinerApplicationsList';
import ITTasksList from '@/components/it-department/ITTasksList';
import ITTeamDirectory from '@/components/it-department/ITTeamDirectory';

export function EmbeddedITDepartment() {
  const [showNewJoinerForm, setShowNewJoinerForm] = useState(false);
  const [stats, setStats] = useState({
    pendingApplications: 0,
    openTasks: 0,
    completedToday: 0,
    activeEmployees: 0
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-2 border-orange-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Pending Applications</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingApplications}</p>
              </div>
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-blue-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Open IT Tasks</p>
                <p className="text-2xl font-bold text-blue-600">{stats.openTasks}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-green-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
              </div>
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-gold/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Active Employees</p>
                <p className="text-2xl font-bold text-gold">{stats.activeEmployees}</p>
              </div>
              <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="applications" className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <TabsList className="bg-white/80 border-2 border-gold/30 p-1">
            <TabsTrigger value="applications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black text-black text-xs">
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              New Joiner Apps
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black text-black text-xs">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              IT Tasks
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black text-black text-xs">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              IT Team
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-white border-2 border-gold/30 text-black w-48 h-9 text-sm placeholder:text-zinc-400"
              />
            </div>
            <Button
              size="sm"
              className="bg-gold text-black hover:bg-gold/90"
              onClick={() => setShowNewJoinerForm(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Joiner
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fetchStats()}
            >
              <RefreshCw className="w-3.5 h-3.5" />
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
}
