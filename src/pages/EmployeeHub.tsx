import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Users, Trophy, Medal, Star, Award, Search, Filter, 
  Building2, Crown, TrendingUp, Target, Heart, Briefcase,
  ChevronRight, Globe, Phone, Mail, UserCheck, BarChart3,
  MessageSquare, Calendar, Sparkles
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Footer from "@/components/Footer";
import EmployeeChatPanel from "@/components/employee-hub/EmployeeChatPanel";
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
    memberId: 'roy-davi', 
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
  onOpenChat 
}: { 
  member: TeamMember; 
  onOpenChat: (member: TeamMember) => void;
}) => {
  const isTopPerformer = Object.values(topPerformers).some(p => p.memberId === member.id);
  const performerData = Object.entries(topPerformers).find(([_, p]) => p.memberId === member.id);
  const newJoinerLabel = getNewJoinerLabel(member);
  const joinDateFormatted = formatJoinDate(member);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group"
    >
      <Card className={`bg-zinc-900/60 border-zinc-800 hover:border-gold/40 transition-all duration-300 h-full relative overflow-hidden ${isTopPerformer ? 'ring-2 ring-gold/50' : ''}`}>
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
            <Avatar className="w-16 h-16 border-2 border-gold/30">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback className="bg-gold/20 text-gold">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold truncate">{member.name}</h3>
              <p className="text-gold text-sm font-medium">{member.role}</p>
              <p className="text-zinc-500 text-xs">{member.department}</p>
            </div>
          </div>
          
          {performerData && (
            <div className="mt-3 p-2 bg-gold/10 rounded-lg border border-gold/20">
              <p className="text-gold text-xs font-semibold flex items-center gap-1">
                <Medal className="h-3 w-3" />
                {performerData[0]}: {performerData[1].metric}
              </p>
            </div>
          )}
          
          <p className="text-zinc-400 text-xs line-clamp-2 mt-3">{member.bio}</p>
          
          {/* Join Date */}
          {member.joinDate && (
            <div className="flex items-center gap-1 mt-2 text-xs text-zinc-500">
              <Calendar className="h-3 w-3" />
              <span>Joined: {joinDateFormatted}</span>
            </div>
          )}
          
          <div className="flex flex-wrap gap-1 mt-3">
            {member.languages?.slice(0, 3).map((lang) => (
              <Badge key={lang} variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                {lang}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${member.status === 'online' ? 'border-green-500/30 text-green-400' : 'border-zinc-700 text-zinc-500'}`}>
                {member.status === 'online' ? '● Online' : '○ Away'}
              </Badge>
              {member.nationality && (
                <span className="text-zinc-500 text-xs">{member.nationality}</span>
              )}
            </div>
            
            {/* Chat Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChat(member)}
              className="text-gold hover:text-gold/80 hover:bg-gold/10 h-7 px-2"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Chat
            </Button>
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
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
            <Icon className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{name}</h3>
            <p className="text-zinc-500 text-sm">{members.length} team members</p>
          </div>
        </div>
        {performer && (
          <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-gold/20">
            <Trophy className="h-4 w-4 text-gold" />
            <span className="text-gold text-sm font-medium">{performer.name}</span>
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
      
      <div className="min-h-screen bg-[#0D0D0D]">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <Badge className="bg-gold/15 text-gold border-gold/30 px-4 py-1.5 mb-6">
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Employee Directory
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                Our <span className="text-gold">Team</span> Hub
              </h1>
              
              <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
                Connect with colleagues, discover top performers, and explore the talented professionals driving JBJ Global Real Estate forward.
              </p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center gap-6 mb-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold">{totalEmployees}</p>
                  <p className="text-zinc-500 text-sm">Team Members</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{onlineCount}</p>
                  <p className="text-zinc-500 text-sm">Online Now</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold">{departmentCount}</p>
                  <p className="text-zinc-500 text-sm">Departments</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-400">{Object.keys(topPerformers).length}</p>
                  <p className="text-zinc-500 text-sm">Top Performers</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Top Performers Section */}
        <section className="py-8 border-y border-zinc-800 bg-zinc-900/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="h-6 w-6 text-gold" />
              <h2 className="text-xl font-bold text-white">Top Performers of the Month</h2>
              <Badge className="bg-white text-black border-gold/30 shadow-sm">
                <span className="text-gold">January</span>
                <span className="text-black ml-1">2026</span>
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {Object.entries(topPerformers).map(([dept, data]) => {
                const member = allTeamMembers.find(m => m.id === data.memberId);
                if (!member) return null;
                
                return (
                  <Card key={dept} className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-gold/30 hover:border-gold/50 transition-all">
                    <CardContent className="p-4 text-center">
                      <div className="relative inline-block mb-3">
                        <Avatar className="w-16 h-16 border-2 border-gold">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="bg-gold/20 text-gold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${data.badge === 'gold' ? 'bg-gold' : 'bg-zinc-400'}`}>
                          <Medal className="h-3 w-3 text-black" />
                        </div>
                      </div>
                      <h4 className="text-white font-semibold text-sm truncate">{member.name}</h4>
                      <p className="text-gold text-xs mb-1">{dept}</p>
                      <p className="text-zinc-400 text-xs">{data.metric}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
        
        {/* Search & Filters */}
        <section className="py-6 border-b border-zinc-800">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Search by name, role, or language..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-zinc-900 border-zinc-700"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedDepartment === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDepartment("all")}
                  className={selectedDepartment === "all" ? "bg-gold text-black" : "border-zinc-700 text-zinc-400"}
                >
                  All Departments
                </Button>
                {departments.slice(0, 6).map(dept => (
                  <Button
                    key={dept}
                    variant={selectedDepartment === dept ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDepartment(dept)}
                    className={selectedDepartment === dept ? "bg-gold text-black" : "border-zinc-700 text-zinc-400"}
                  >
                    {dept}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Employees Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <p className="text-zinc-500 mb-6">{filteredMembers.length} employees found</p>
            
            <div className="space-y-12">
              {Object.entries(groupedMembers).map(([dept, members]) => (
                <DepartmentSection key={dept} name={dept} members={members} onOpenChat={handleOpenChat} />
              ))}
            </div>
            
            {filteredMembers.length === 0 && (
              <div className="text-center py-16">
                <Users className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">No employees found matching your search.</p>
              </div>
            )}
          </div>
        </section>
        
        {/* Prize Draw Banner */}
        <section className="py-12 bg-gradient-to-r from-gold/10 via-amber-500/10 to-gold/10 border-y border-gold/20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <Trophy className="h-12 w-12 text-gold mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Monthly Top Performer Rewards</h2>
              <p className="text-zinc-400 mb-6">
                Top performers in each department receive exclusive rewards including gift vouchers, 
                electronics (iPad, iPhone), and special recognition at company events.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge className="bg-white text-black border-gold/30 px-4 py-2 text-sm shadow-sm">
                  <Award className="w-4 h-4 mr-2 text-gold" />
                  <span className="text-gold">Monthly</span>
                  <span className="text-black ml-1">Prize Draw</span>
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 px-4 py-2 text-sm">
                  <Star className="w-4 h-4 mr-2" />
                  Best Idea Award
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-4 py-2 text-sm">
                  <Trophy className="w-4 h-4 mr-2" />
                  Performance Bonus
                </Badge>
              </div>
            </div>
          </div>
        </section>
        
        <Footer />
        
        {/* Chat Panel */}
        <AnimatePresence>
          {chatEmployee && (
            <EmployeeChatPanel 
              employee={chatEmployee} 
              onClose={handleCloseChat}
              currentUserName="Jane"
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default EmployeeHub;
