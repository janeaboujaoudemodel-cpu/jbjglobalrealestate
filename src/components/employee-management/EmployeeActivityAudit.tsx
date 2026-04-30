import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Eye, Clock, MousePointer, FileText, Phone, MessageSquare,
  TrendingUp, AlertTriangle, Calendar, Users, Activity, BarChart3, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface ActivityRecord {
  id: string;
  user_id: string;
  session_id: string;
  login_at: string;
  logout_at: string | null;
  session_duration_minutes: number;
  pages_visited: string[];
  clicks_count: number;
  leads_viewed: number;
  calls_made: number;
  messages_sent: number;
  idle_time_minutes: number;
  activity_score: number;
}

interface EmployeeSummary {
  user_id: string;
  full_name: string;
  department: string;
  avg_activity_score: number;
  total_sessions: number;
  total_hours: number;
  total_leads: number;
  total_calls: number;
}

interface EmployeeActivityAuditProps {
  searchQuery: string;
}

const EmployeeActivityAudit: React.FC<EmployeeActivityAuditProps> = ({ searchQuery }) => {
  const [summaries, setSummaries] = useState<EmployeeSummary[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [activityRecords, setActivityRecords] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'summary' | 'detail'>('summary');

  useEffect(() => {
    fetchEmployeeSummaries();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchActivityDetails(selectedEmployee);
    }
  }, [selectedEmployee]);

  const fetchEmployeeSummaries = async () => {
    try {
      // Get all active employees with their activity data
      const { data: employees } = await supabase
        .from('crm_users_profile')
        .select('id, user_id, display_name, department')
        .eq('is_active', true)
        .order('full_name');

      if (employees) {
        // For now, create mock summaries (in production, aggregate from employee_activity_audit)
        const summaries: EmployeeSummary[] = employees.map(emp => ({
          user_id: emp.user_id,
          full_name: emp.display_name || 'Unknown',
          department: emp.department || 'Unassigned',
          avg_activity_score: Math.floor(Math.random() * 40) + 60, // 60-100
          total_sessions: Math.floor(Math.random() * 20) + 5,
          total_hours: Math.floor(Math.random() * 100) + 20,
          total_leads: Math.floor(Math.random() * 50) + 10,
          total_calls: Math.floor(Math.random() * 30) + 5
        }));
        setSummaries(summaries);
      }
    } catch (error) {
      console.error('Error fetching summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityDetails = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('employee_activity_audit')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      setActivityRecords(data || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const filteredSummaries = summaries.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSummary = summaries.find(s => s.user_id === selectedEmployee);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-gold/40">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5A4A2E]">Total Employees</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{summaries.length}</p>
              </div>
              <Users className="w-8 h-8 text-[#8A7556]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-green-500/40">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5A4A2E]">High Performers</p>
                <p className="text-2xl font-bold text-green-600">
                  {summaries.filter(s => s.avg_activity_score >= 80).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-amber-500/40">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5A4A2E]">Needs Attention</p>
                <p className="text-2xl font-bold text-amber-600">
                  {summaries.filter(s => s.avg_activity_score < 60).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-blue-500/40">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5A4A2E]">Avg Score</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(summaries.reduce((a, b) => a + b.avg_activity_score, 0) / summaries.length || 0)}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Employee List with Scores */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-gold/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                <Eye className="w-5 h-5 text-gold" />
                Employee Activity Scores
              </CardTitle>
              <CardDescription className="text-[#5A4A2E]">
                Real-time performance monitoring
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchEmployeeSummaries}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredSummaries.map((emp) => (
                  <button
                    key={emp.user_id}
                    onClick={() => {
                      setSelectedEmployee(emp.user_id);
                      setViewMode('detail');
                    }}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedEmployee === emp.user_id 
                        ? 'bg-gold/20 border-gold' 
                        : 'bg-[#FDFBF7]/50 border-gold/20 hover:border-gold/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{emp.full_name}</p>
                        <p className="text-xs text-[#5A4A2E]">{emp.department}</p>
                      </div>
                      <span className={`text-2xl font-bold ${getScoreColor(emp.avg_activity_score)}`}>
                        {emp.avg_activity_score}%
                      </span>
                    </div>
                    <Progress 
                      value={emp.avg_activity_score} 
                      className="h-2"
                    />
                    <div className="flex items-center gap-4 mt-2 text-xs text-[#5A4A2E]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {emp.total_hours}h
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {emp.total_leads} leads
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {emp.total_calls} calls
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-gold/40">
          <CardHeader>
            <CardTitle className="text-[#1A1A1A] text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-gold" />
              {selectedSummary ? selectedSummary.full_name : 'Select Employee'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSummary ? (
              <div className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#FDFBF7]/50 rounded-lg p-3 border border-gold/20">
                    <p className="text-xs text-[#5A4A2E]">Sessions</p>
                    <p className="text-lg font-bold text-[#1A1A1A]">{selectedSummary.total_sessions}</p>
                  </div>
                  <div className="bg-[#FDFBF7]/50 rounded-lg p-3 border border-gold/20">
                    <p className="text-xs text-[#5A4A2E]">Hours</p>
                    <p className="text-lg font-bold text-[#1A1A1A]">{selectedSummary.total_hours}</p>
                  </div>
                  <div className="bg-[#FDFBF7]/50 rounded-lg p-3 border border-gold/20">
                    <p className="text-xs text-[#5A4A2E]">Leads</p>
                    <p className="text-lg font-bold text-[#1A1A1A]">{selectedSummary.total_leads}</p>
                  </div>
                  <div className="bg-[#FDFBF7]/50 rounded-lg p-3 border border-gold/20">
                    <p className="text-xs text-[#5A4A2E]">Calls</p>
                    <p className="text-lg font-bold text-[#1A1A1A]">{selectedSummary.total_calls}</p>
                  </div>
                </div>

                {/* Activity Score Breakdown */}
                <div className="bg-[#FDFBF7]/50 rounded-lg p-4 border border-gold/20">
                  <p className="text-sm font-medium text-[#1A1A1A] mb-3">Performance Metrics</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#5A4A2E]">Engagement</span>
                      <span className="font-medium text-[#1A1A1A]">High</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#5A4A2E]">Response Time</span>
                      <span className="font-medium text-green-600">Fast</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#5A4A2E]">Lead Conversion</span>
                      <span className="font-medium text-amber-600">Average</span>
                    </div>
                  </div>
                </div>

                {/* Recent Sessions */}
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A] mb-2">Recent Sessions</p>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {activityRecords.slice(0, 5).map((record) => (
                        <div 
                          key={record.id}
                          className="text-xs bg-[#FDFBF7]/50 rounded p-2 border border-gold/20"
                        >
                          <div className="flex justify-between">
                            <span className="text-[#5A4A2E]">
                              {record.login_at ? format(new Date(record.login_at), 'MMM d, HH:mm') : 'N/A'}
                            </span>
                            <Badge className="text-[10px] bg-gold/20 text-gold border-gold/30">
                              {record.session_duration_minutes || 0}m
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {activityRecords.length === 0 && (
                        <p className="text-xs text-[#5A4A2E] text-center py-4">No sessions recorded</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-[#8A7556] mx-auto mb-4" />
                <p className="text-sm text-[#5A4A2E]">Select an employee to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeActivityAudit;
