import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Users, Trophy, Medal, Star, Award, Search, Filter, 
  Building2, Crown, TrendingUp, Target, Heart, Briefcase,
  ChevronRight, Globe, Phone, Mail, UserCheck, BarChart3,
  MessageSquare, Calendar, Sparkles, Monitor
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import EmployeeChatPanel from "@/components/employee-hub/EmployeeChatPanel";
import { CommandPalette } from "@/components/ui/command-palette";
import { FloatingActionBar } from "@/components/ui/floating-action-bar";
import { 
  allTeamMembers, 
  teamByDepartment, 
  executiveTeam,
  salesTeam,
  hrTeam,
  financeTeam,
  softwareEngineeringTeam,
  projectManagementTeam,
  contentTeam,
  customerHappinessTeam,
  marketingTeam,
  creativeTeam,
  operationsTeam,
  itTeam,
  adminTeam,
  TeamMember 
} from "@/config/team-members";
import { 
  isNewJoiner, 
  getNewJoinerLabel, 
  formatJoinDate,
  getTenureLabel,
  getInitials 
} from "@/utils/employeeUtils";

// Mock top performers data - in production this would come from database
const topPerformers = {
  'Sales': { 
    memberId: 'alexander-nasser', 
    metric: '47 Deals Closed',
    badge: 'gold' as const
  },
  'Human Resources': { 
    memberId: 'jessica-whitmore', 
    metric: '23 Hires',
    badge: 'gold' as const
  },
  'Marketing & Content': { 
    memberId: 'victoria-sterling', 
    metric: '156% Campaign ROI',
    badge: 'gold' as const
  },
  'Customer Happiness': { 
    memberId: 'lisa-henderson', 
    metric: '98% Satisfaction',
    badge: 'gold' as const
  },
  'Software Engineering': { 
    memberId: 'james-woodward', 
    metric: '12 Projects Delivered',
    badge: 'silver' as const
  },
  'Project Management': { 
    memberId: 'rachel-campbell', 
    metric: 'On-Time Delivery 100%',
    badge: 'silver' as const
  },
};

const departmentIcons: Record<string, typeof Building2> = {
  'Leadership': Crown,
  'Sales': Target,
  'Marketing & Content': TrendingUp,
  'Human Resources': UserCheck,
  'Finance': BarChart3,
  'Software Engineering': Globe,
  'Project Management': Briefcase,
  'Customer Happiness': Heart,
  'Creative & Media': Star,
  'Operations': Building2,
  'IT': Globe,
  'Administration': Building2,
  'Technology': Globe,
};

const EmployeeCard = ({ 
  member, 
  onOpenChat,
  isPublicView = false,
}: { 
  member: TeamMember; 
  onOpenChat: (member: TeamMember) => void;
  isPublicView?: boolean;
}) => {
  const isTopPerformer = Object.values(topPerformers).some(p => p.memberId === member.id);
  const performerData = Object.entries(topPerformers).find(([_, p]) => p.memberId === member.id);
  const newJoinerLabel = getNewJoinerLabel(member);
  const joinDateFormatted = formatJoinDate(member);
  
  // Check if contact details are available (email only - phone not in TeamMember interface)
  const hasContactDetails = !!member.email;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group"
    >
      <Card className={`bg-white border-2 border-gold/30 hover:border-gold/60 hover:shadow-[0_8px_30px_rgba(200,167,102,0.2)] transition-all duration-300 h-full relative overflow-hidden ${isTopPerformer ? 'ring-2 ring-gold shadow-[0_4px_20px_rgba(200,167,102,0.3)]' : ''}`}>
        {/* New Joiner Badge */}
        {newJoinerLabel && (
          <div className="absolute top-0 left-0 bg-gradient-to-br from-emerald-500 to-green-600 text-white px-3 py-1 text-xs font-bold flex items-center gap-1 rounded-br-xl z-10">
            <Sparkles className="h-3 w-3" />
            {newJoinerLabel}
          </div>
        )}
        
        {/* Top Performer Badge */}
        {isTopPerformer && (
          <div className="absolute top-0 right-0 bg-gradient-to-bl from-gold to-amber-600 text-black px-3 py-1 text-xs font-bold flex items-center gap-1 rounded-bl-xl">
            <Trophy className="h-3 w-3" />
            Top Performer
          </div>
        )}
        
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 border-2 border-gold/50 shadow-md">
              <AvatarImage src={member.avatar} alt={member.name} className="object-cover" />
              <AvatarFallback className="bg-gold/20 text-gold font-bold">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-black font-bold truncate">{member.name}</h3>
              <p className="text-gold text-sm font-semibold">{member.role}</p>
              <p className="text-zinc-500 text-xs">{member.department}</p>
            </div>
          </div>
          
          {performerData && (
            <div className="mt-3 p-2 bg-gradient-to-r from-gold/10 to-amber-500/5 rounded-lg border border-gold/30">
              <p className="text-black text-xs font-semibold flex items-center gap-1">
                <Medal className="h-3 w-3 text-gold" />
                <span className="text-gold">{performerData[0]}:</span> {performerData[1].metric}
              </p>
            </div>
          )}
          
          <p className="text-zinc-600 text-xs line-clamp-2 mt-3">{member.bio}</p>
          
          {/* Join Date */}
          {member.joinDate && (
            <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
              <Calendar className="h-3 w-3" />
              <span>Joined: {joinDateFormatted}</span>
            </div>
          )}
          
          <div className="flex flex-wrap gap-1 mt-3">
            {member.languages?.slice(0, 3).map((lang) => (
              <Badge key={lang} variant="outline" className="text-xs border-gold/30 text-zinc-600 bg-gold/5">
                {lang}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gold/20">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${member.status === 'online' ? 'border-green-500/50 text-green-600 bg-green-50' : 'border-zinc-300 text-zinc-500 bg-white'}`}>
                {member.status === 'online' ? '● Online' : '○ Away'}
              </Badge>
              {member.nationality && (
                <span className="text-zinc-400 text-xs">{member.nationality}</span>
              )}
            </div>
            
            {/* Contact Actions - Only for internal users */}
            {!isPublicView && (
              <div className="flex items-center gap-1">
                {hasContactDetails ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gold hover:text-black hover:bg-gold/20 h-7 px-1.5"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gold hover:text-black hover:bg-gold/20 h-7 px-1.5"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenChat(member)}
                  className="text-gold hover:text-black hover:bg-gold/20 h-7 px-2"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const DepartmentSection = ({ 
  name, 
  members,
  onOpenChat,
}: { 
  name: string; 
  members: TeamMember[];
  onOpenChat: (member: TeamMember) => void;
}) => {
  const Icon = departmentIcons[name] || Building2;
  const topPerformer = topPerformers[name as keyof typeof topPerformers];
  const performer = topPerformer ? allTeamMembers.find(m => m.id === topPerformer.memberId) : null;
  
  // Special label for Leadership/Executive
  const displayName = name === 'Leadership' ? 'Leadership & Executive' : name;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-gradient-to-r from-[#FDFBF7] to-white p-4 rounded-xl border-2 border-gold/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-lg shadow-gold/20">
            <Icon className="h-6 w-6 text-black" />
          </div>
          <div>
            <h3 className="text-black font-bold text-lg">{displayName}</h3>
            <p className="text-zinc-500 text-sm">{members.length} team members</p>
          </div>
        </div>
        {performer && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-gold/20 to-amber-500/10 px-4 py-2 rounded-full border border-gold/40">
            <Trophy className="h-4 w-4 text-gold" />
            <span className="text-gold text-sm font-semibold">{performer.name}</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {members.map((member) => (
          <EmployeeCard key={member.id} member={member} onOpenChat={onOpenChat} />
        ))}
      </div>
    </div>
  );
};

const EmployeeHub = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [chatEmployee, setChatEmployee] = useState<TeamMember | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  const handleOpenChat = (member: TeamMember) => {
    setChatEmployee(member);
  };
  
  const handleCloseChat = () => {
    setChatEmployee(null);
  };
  
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
  
  // Group by department for display
  const groupedMembers = useMemo(() => {
    const groups: Record<string, TeamMember[]> = {};
    
    filteredMembers.forEach(member => {
      const dept = member.department;
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(member);
    });
    
    return groups;
  }, [filteredMembers]);
  
  // Stats
  const totalEmployees = allTeamMembers.length;
  const onlineCount = allTeamMembers.filter(m => m.status === 'online').length;
  const departmentCount = departments.length;

  return (
    <>
      <SEOHead
        title="Employee Hub | JBJ Global Real Estate"
        description="Meet the talented team behind JBJ Global Real Estate. View top performers, departments, and connect with colleagues."
        keywords="JBJ team, employees, staff directory, real estate professionals"
        canonicalPath="/employee-hub"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        {/* Command Palette */}
        <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
        
        {/* Hero Section - Premium Champagne */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <Badge className="bg-gold/10 text-gold border-gold/30 px-4 py-1.5 mb-6">
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Employee Directory
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
                Our <span className="text-gold">Team</span> Hub
              </h1>
              
              <p className="text-zinc-500 text-lg mb-8 max-w-2xl mx-auto">
                Connect with colleagues, discover top performers, and explore the talented professionals driving JBJ Global Real Estate forward.
              </p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center gap-6 mb-8">
                <div className="text-center bg-white/80 border-2 border-gold/30 rounded-xl px-6 py-3 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
                  <p className="text-3xl font-bold text-gold">{totalEmployees}</p>
                  <p className="text-zinc-500 text-sm">Team Members</p>
                </div>
                <div className="text-center bg-white/80 border-2 border-green-500/30 rounded-xl px-6 py-3 shadow-[0_4px_20px_rgba(34,197,94,0.1)]">
                  <p className="text-3xl font-bold text-green-600">{onlineCount}</p>
                  <p className="text-zinc-500 text-sm">Online Now</p>
                </div>
                <div className="text-center bg-white/80 border-2 border-gold/30 rounded-xl px-6 py-3 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
                  <p className="text-3xl font-bold text-gold">{departmentCount}</p>
                  <p className="text-zinc-500 text-sm">Departments</p>
                </div>
                <div className="text-center bg-white/80 border-2 border-amber-500/30 rounded-xl px-6 py-3 shadow-[0_4px_20px_rgba(245,158,11,0.1)]">
                  <p className="text-3xl font-bold text-amber-600">{Object.keys(topPerformers).length}</p>
                  <p className="text-zinc-500 text-sm">Top Performers</p>
                </div>
              </div>
              
              {/* Department Quick Access */}
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  onClick={() => navigate('/it-department')}
                  variant="primary"
                  className="gap-2"
                >
                  <Monitor className="w-5 h-5" />
                  IT Department
                </Button>
                
                <Button
                  onClick={() => navigate('/hr-agent')}
                  variant="primary"
                  className="gap-2"
                >
                  <UserCheck className="w-5 h-5" />
                  HR Department
                </Button>
                
                <Button
                  onClick={() => navigate('/employee-chat')}
                  variant="secondary"
                  className="gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Team Chat
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Search & Filter Section */}
        <section className="container mx-auto px-4 -mt-8 relative z-20 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
                  <Input
                    placeholder="Search by name, role, department, or language..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-white border-2 border-gold/30 text-black placeholder:text-zinc-400 h-12"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedDepartment === 'all' ? 'primary' : 'secondary'}
                    onClick={() => setSelectedDepartment('all')}
                  >
                    All Departments
                  </Button>
                  {departments.slice(0, 4).map((dept) => (
                    <Button
                      key={dept}
                      variant={selectedDepartment === dept ? 'primary' : 'secondary'}
                      onClick={() => setSelectedDepartment(dept)}
                    >
                      {dept}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Team Members Grid */}
        <section className="container mx-auto px-4 pb-24">
          <div className="space-y-12">
            {Object.entries(groupedMembers).map(([dept, members]) => (
              <DepartmentSection
                key={dept}
                name={dept}
                members={members}
                onOpenChat={handleOpenChat}
              />
            ))}
          </div>
        </section>

        {/* Floating Action Bar */}
        <FloatingActionBar />

        {/* Chat Panel */}
        {chatEmployee && (
          <EmployeeChatPanel
            employee={chatEmployee}
            onClose={handleCloseChat}
          />
        )}
      </div>
    </>
  );
};

export default EmployeeHub;
