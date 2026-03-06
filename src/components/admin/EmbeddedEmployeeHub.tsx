import { useState, useMemo } from "react";
import { 
  Users, Search, Building2, Trophy, Medal, Star,
  MessageSquare, Calendar, Sparkles, Phone, Mail, AtSign
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailManagement from "@/components/crm/EmailManagement";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import EmployeeChatPanel from "@/components/employee-hub/EmployeeChatPanel";
import { 
  allTeamMembers, 
  teamByDepartment,
  TeamMember 
} from "@/config/team-members";
import { 
  getNewJoinerLabel, 
  formatJoinDate,
  getInitials 
} from "@/utils/employeeUtils";

// Mock top performers data
const topPerformers = {
  'Sales': { memberId: 'alexander-nasser', metric: '47 Deals Closed', badge: 'gold' as const },
  'Human Resources': { memberId: 'jessica-whitmore', metric: '23 Hires', badge: 'gold' as const },
  'Marketing & Content': { memberId: 'victoria-sterling', metric: '156% Campaign ROI', badge: 'gold' as const },
  'Customer Happiness': { memberId: 'lisa-henderson', metric: '98% Satisfaction', badge: 'gold' as const },
};

const departmentIcons: Record<string, typeof Building2> = {
  'Leadership': Star,
  'Sales': Trophy,
  'Marketing & Content': Star,
  'Human Resources': Users,
  'Finance': Building2,
  'Software Engineering': Building2,
  'Project Management': Building2,
  'Customer Happiness': Star,
  'Creative & Media': Star,
  'Operations': Building2,
  'IT': Building2,
  'Administration': Building2,
};

export function EmbeddedEmployeeHub() {
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [chatEmployee, setChatEmployee] = useState<TeamMember | null>(null);
  
  const departments = Object.keys(teamByDepartment);
  
  const filteredMembers = useMemo(() => {
    let members = allTeamMembers;
    
    if (search) {
      const searchLower = search.toLowerCase();
      members = members.filter(m => 
        m.name.toLowerCase().includes(searchLower) ||
        m.role.toLowerCase().includes(searchLower) ||
        m.department.toLowerCase().includes(searchLower) ||
        m.languages?.some(l => l.toLowerCase().includes(searchLower))
      );
    }
    
    if (selectedDepartment !== "all") {
      const deptMembers = teamByDepartment[selectedDepartment as keyof typeof teamByDepartment];
      if (deptMembers) {
        const deptIds = new Set(deptMembers.map(m => m.id));
        members = members.filter(m => deptIds.has(m.id));
      }
    }
    
    return members;
  }, [search, selectedDepartment]);
  
  // Stats
  const totalEmployees = allTeamMembers.length;
  const onlineCount = allTeamMembers.filter(m => m.status === 'online').length;
  const departmentCount = departments.length;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-2 border-gold/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Team Members</p>
                <p className="text-2xl font-bold text-gold">{totalEmployees}</p>
              </div>
              <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-green-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Online Now</p>
                <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
              </div>
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-blue-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Departments</p>
                <p className="text-2xl font-bold text-blue-600">{departmentCount}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-amber-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Top Performers</p>
                <p className="text-2xl font-bold text-amber-600">{Object.keys(topPerformers).length}</p>
              </div>
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="bg-white/90 border-2 border-gold/30">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
              <Input
                placeholder="Search by name, role, department, or language..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white border-2 border-gold/30 text-black placeholder:text-zinc-400 h-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={selectedDepartment === 'all' ? 'default' : 'secondary'}
                onClick={() => setSelectedDepartment('all')}
                className={selectedDepartment === 'all' ? 'bg-gold text-black' : ''}
              >
                All
              </Button>
              {departments.slice(0, 4).map((dept) => (
                <Button
                  key={dept}
                  size="sm"
                  variant={selectedDepartment === dept ? 'default' : 'secondary'}
                  onClick={() => setSelectedDepartment(dept)}
                  className={selectedDepartment === dept ? 'bg-gold text-black' : ''}
                >
                  {dept}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMembers.map((member) => {
          const isTopPerformer = Object.values(topPerformers).some(p => p.memberId === member.id);
          const performerData = Object.entries(topPerformers).find(([_, p]) => p.memberId === member.id);
          const newJoinerLabel = getNewJoinerLabel(member);
          const joinDateFormatted = formatJoinDate(member);
          
          return (
            <Card 
              key={member.id} 
              className={`bg-white border-2 border-gold/30 hover:border-gold/60 hover:shadow-lg transition-all duration-300 h-full relative overflow-hidden ${isTopPerformer ? 'ring-2 ring-gold' : ''}`}
            >
              {/* New Joiner Badge */}
              {newJoinerLabel && (
                <div className="absolute top-0 left-0 bg-gradient-to-br from-emerald-500 to-green-600 text-white px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 rounded-br-lg z-10">
                  <Sparkles className="h-2.5 w-2.5" />
                  {newJoinerLabel}
                </div>
              )}
              
              {/* Top Performer Badge */}
              {isTopPerformer && (
                <div className="absolute top-0 right-0 bg-gradient-to-bl from-gold to-amber-600 text-black px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 rounded-bl-lg">
                  <Trophy className="h-2.5 w-2.5" />
                  Top
                </div>
              )}
              
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12 border-2 border-gold/50">
                    <AvatarImage src={member.avatar} alt={member.name} className="object-cover" />
                    <AvatarFallback className="bg-gold/20 text-gold font-bold text-sm">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-black font-bold text-sm truncate">{member.name}</h3>
                    <p className="text-gold text-xs font-semibold truncate">{member.role}</p>
                    <p className="text-zinc-500 text-[10px] truncate">{member.department}</p>
                  </div>
                </div>
                
                {performerData && (
                  <div className="mt-2 p-1.5 bg-gradient-to-r from-gold/10 to-amber-500/5 rounded-md border border-gold/30">
                    <p className="text-black text-[10px] font-semibold flex items-center gap-1">
                      <Medal className="h-2.5 w-2.5 text-gold" />
                      <span className="text-gold">{performerData[0]}:</span> {performerData[1].metric}
                    </p>
                  </div>
                )}
                
                <p className="text-zinc-600 text-[10px] line-clamp-2 mt-2">{member.bio}</p>
                
                {/* Join Date */}
                {member.joinDate && (
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-zinc-400">
                    <Calendar className="h-2.5 w-2.5" />
                    <span>Joined: {joinDateFormatted}</span>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {member.languages?.slice(0, 2).map((lang) => (
                    <Badge key={lang} variant="outline" className="text-[10px] border-gold/30 text-zinc-600 bg-gold/5 px-1.5 py-0">
                      {lang}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gold/20">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${member.status === 'online' ? 'border-green-500/50 text-green-600 bg-green-50' : 'border-zinc-300 text-zinc-500 bg-white'}`}>
                    {member.status === 'online' ? '● Online' : '○ Away'}
                  </Badge>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gold hover:text-black hover:bg-gold/20 h-6 w-6 p-0"
                    >
                      <Mail className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setChatEmployee(member)}
                      className="text-gold hover:text-black hover:bg-gold/20 h-6 px-1.5"
                    >
                      <MessageSquare className="h-3 w-3 mr-0.5" />
                      <span className="text-[10px]">Chat</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500">No employees found matching your search.</p>
        </div>
      )}

      {/* Chat Panel */}
      {chatEmployee && (
        <EmployeeChatPanel 
          employee={chatEmployee} 
          onClose={() => setChatEmployee(null)} 
        />
      )}
    </div>
  );
}
