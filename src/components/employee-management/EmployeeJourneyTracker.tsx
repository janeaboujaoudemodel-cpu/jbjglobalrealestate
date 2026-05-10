import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, Calendar, TrendingUp, Award, AlertTriangle, 
  UserCheck, Briefcase, ArrowRight, Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface JourneyEvent {
  id: string;
  event_type: string;
  event_category: string;
  previous_value: any;
  new_value: any;
  notes: string | null;
  created_at: string;
  user_name?: string;
}

interface EmployeeJourneyTrackerProps {
  searchQuery: string;
}

const EmployeeJourneyTracker: React.FC<EmployeeJourneyTrackerProps> = ({ searchQuery }) => {
  const [events, setEvents] = useState<JourneyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchJourneyEvents(selectedEmployee);
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const { data } = await supabase
        .from('crm_users_profile')
        .select('id, user_id, display_name, job_title, department')
        .eq('is_active', true)
        .order('full_name');

      setEmployees(data || []);
      if (data && data.length > 0) {
        setSelectedEmployee(data[0].user_id);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJourneyEvents = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('employee_journey_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching journey events:', error);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'hired': return <UserCheck className="w-4 h-4" />;
      case 'promoted': return <TrendingUp className="w-4 h-4" />;
      case 'department_change': return <Briefcase className="w-4 h-4" />;
      case 'probation_passed': return <Award className="w-4 h-4" />;
      case 'warning_issued': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'hired': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'promoted': return 'bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30';
      case 'department_change': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'probation_passed': return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
      case 'warning_issued': return 'bg-red-500/20 text-red-700 border-red-500/30';
      default: return 'bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30/30';
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedEmp = employees.find(e => e.user_id === selectedEmployee);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Employee List */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
        <CardHeader>
          <CardTitle className="text-[#1A1A1A] text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1A1A1A]" />
            Select Employee
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp.user_id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedEmployee === emp.user_id 
                      ? 'bg-[#EFE6D6]/20 border-[#B89555]' 
                      : 'bg-[#FDFBF7]/50 border-[#B89555]/20 hover:border-[#B89555]/40'
                  }`}
                >
                  <p className="font-medium text-[#1A1A1A] text-sm">{emp.display_name}</p>
                  <p className="text-xs text-[#1A1A1A]/70">{emp.job_title} • {emp.department}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Journey Timeline */}
      <Card className="lg:col-span-2 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
        <CardHeader>
          <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#1A1A1A]" />
            {selectedEmp ? `${selectedEmp.display_name}'s Journey` : 'Employee Journey'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-[#1A1A1A]/70 mx-auto mb-4" />
              <p className="text-[#1A1A1A]/70">No journey events recorded yet</p>
              <p className="text-xs text-[#1A1A1A]/70 mt-1">Events will appear as the employee progresses</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="relative pl-8">
                {/* Timeline line */}
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[#EFE6D6]/30" />
                
                <div className="space-y-6">
                  {events.map((event, idx) => (
                    <div key={event.id} className="relative">
                      {/* Timeline dot */}
                      <div className={`absolute -left-5 w-4 h-4 rounded-full border-2 ${getEventColor(event.event_type)} bg-[#FDFBF7]`} />
                      
                      <div className="bg-[#FDFBF7]/50 border border-[#B89555]/20 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.event_type)}
                            <Badge className={`${getEventColor(event.event_type)} border`}>
                              {event.event_type.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-[#1A1A1A]/70">
                            <Clock className="w-3 h-3" />
                            {format(new Date(event.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                        
                        {event.previous_value && event.new_value && (
                          <div className="flex items-center gap-2 text-sm mt-2">
                            <span className="text-[#1A1A1A]/70">{JSON.stringify(event.previous_value)}</span>
                            <ArrowRight className="w-4 h-4 text-[#1A1A1A]" />
                            <span className="text-[#1A1A1A] font-medium">{JSON.stringify(event.new_value)}</span>
                          </div>
                        )}
                        
                        {event.notes && (
                          <p className="text-sm text-[#1A1A1A]/70 mt-2">{event.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeJourneyTracker;
