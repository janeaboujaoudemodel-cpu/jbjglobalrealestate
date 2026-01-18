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
      <Card className={`bg-gradient-to-br from-[#F5F0E6] via-[#FDFBF7] to-white border-2 border-gold/30 hover:border-gold/60 hover:shadow-[0_0_25px_rgba(200,167,102,0.2)] transition-all duration-300 h-full relative overflow-hidden ${isTopPerformer ? 'ring-2 ring-gold shadow-[0_0_20px_rgba(200,167,102,0.3)]' : ''}`}>
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
              <p className="text-zinc-600 text-xs">{member.department}</p>
            </div>
          </div>
          
          {performerData && (
            <div className="mt-3 p-2 bg-gradient-to-r from-gold/20 to-amber-500/10 rounded-lg border border-gold/40">
              <p className="text-black text-xs font-semibold flex items-center gap-1">
                <Medal className="h-3 w-3 text-gold" />
                <span className="text-gold">{performerData[0]}:</span> {performerData[1].metric}
              </p>
            </div>
          )}
          
          <p className="text-zinc-700 text-xs line-clamp-2 mt-3">{member.bio}</p>
          
          {/* Join Date */}
          {member.joinDate && (
            <div className="flex items-center gap-1 mt-2 text-xs text-zinc-500">
              <Calendar className="h-3 w-3" />
              <span>Joined: {joinDateFormatted}</span>
            </div>
          )}
          
          <div className="flex flex-wrap gap-1 mt-3">
            {member.languages?.slice(0, 3).map((lang) => (
              <Badge key={lang} variant="outline" className="text-xs border-gold/30 text-zinc-700 bg-white/50">
                {lang}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gold/20">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${member.status === 'online' ? 'border-green-500/50 text-green-700 bg-green-50' : 'border-zinc-300 text-zinc-500 bg-white/50'}`}>
                {member.status === 'online' ? '● Online' : '○ Away'}
              </Badge>
              {member.nationality && (
                <span className="text-zinc-500 text-xs">{member.nationality}</span>
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
      <div className="flex items-center justify-between bg-gradient-to-r from-[#F5F0E6]/10 to-transparent p-4 rounded-xl border border-gold/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-lg shadow-gold/20">
            <Icon className="h-6 w-6 text-black" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{displayName}</h3>
            <p className="text-zinc-400 text-sm">{members.length} team members</p>
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
        
        {/* Top Performers Wall of Fame Section */}
        <section className="py-12 bg-gradient-to-b from-zinc-950 to-black">
          <div className="container mx-auto px-4">
            {/* Wall of Fame Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-gold/20 via-amber-500/20 to-gold/20 px-6 py-3 rounded-full border border-gold/40 mb-4">
                <Trophy className="h-6 w-6 text-gold" />
                <h2 className="text-2xl font-bold text-white">Wall of Fame</h2>
                <Badge className="bg-white text-black border-gold/30 shadow-sm">
                  <span className="text-gold">January</span>
                  <span className="text-black ml-1">2026</span>
                </Badge>
              </div>
              <p className="text-zinc-400">Top Performers of the Month - Recognition & Excellence</p>
            </div>
            
            {/* 3D Frame Wall Effect */}
            <div className="relative bg-gradient-to-b from-amber-900/20 via-amber-800/10 to-zinc-900/30 rounded-3xl p-8 border-4 border-gold/30 shadow-[inset_0_0_60px_rgba(200,167,102,0.1),_0_20px_60px_rgba(0,0,0,0.5)]">
              {/* Decorative frame corners */}
              <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-gold/60 rounded-tl-lg" />
              <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-gold/60 rounded-tr-lg" />
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-gold/60 rounded-bl-lg" />
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-gold/60 rounded-br-lg" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {Object.entries(topPerformers).map(([dept, data]) => {
                  const member = allTeamMembers.find(m => m.id === data.memberId);
                  if (!member) return null;
                  
                  return (
                    <div key={dept} className="relative group">
                      {/* Picture Frame Effect */}
                      <div className="bg-gradient-to-br from-[#F5F0E6] via-white to-[#F5F0E6] rounded-xl p-1 shadow-[0_10px_40px_rgba(0,0,0,0.4),_inset_0_1px_0_rgba(255,255,255,0.8)] border-4 border-gold/50 transform hover:scale-105 transition-all duration-300">
                        <Card className="bg-gradient-to-br from-white to-[#FDFBF7] border-0 overflow-hidden">
                          <CardContent className="p-4 text-center">
                            <div className="relative inline-block mb-3">
                              <Avatar className="w-20 h-20 border-3 border-gold shadow-lg">
                                <AvatarImage src={member.avatar} alt={member.name} className="object-cover" />
                                <AvatarFallback className="bg-gold/20 text-gold font-bold text-lg">
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg ${data.badge === 'gold' ? 'bg-gradient-to-br from-gold to-amber-600' : 'bg-gradient-to-br from-zinc-300 to-zinc-400'}`}>
                                <Medal className="h-4 w-4 text-black" />
                              </div>
                            </div>
                            <h4 className="text-black font-bold text-sm truncate">{member.name}</h4>
                            <Badge className="bg-gold/20 text-gold border-gold/40 text-xs mt-1 mb-2">
                              {dept}
                            </Badge>
                            <p className="text-zinc-600 text-xs font-medium">{data.metric}</p>
                          </CardContent>
                        </Card>
                      </div>
                      {/* Hanging wire effect */}
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-gradient-to-b from-gold/80 to-gold/40" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
        
        {/* Search & Filters - Premium styling */}
        <section className="py-8 border-b border-gold/20 bg-black">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
                <Input
                  placeholder="Search by name, role, or language..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 bg-gradient-to-r from-white to-[#FDFBF7] border-2 border-gold/40 text-black placeholder:text-zinc-500 rounded-xl shadow-[0_0_20px_rgba(200,167,102,0.15)] focus:border-gold focus:shadow-[0_0_30px_rgba(200,167,102,0.25)]"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedDepartment === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDepartment("all")}
                  className={selectedDepartment === "all" 
                    ? "bg-gradient-to-r from-gold to-amber-600 text-black font-bold border-0 shadow-lg shadow-gold/30 hover:shadow-gold/50" 
                    : "bg-gradient-to-r from-white to-[#FDFBF7] border-2 border-gold/40 text-black hover:border-gold hover:shadow-[0_0_15px_rgba(200,167,102,0.2)]"
                  }
                >
                  All Departments
                </Button>
                {departments.slice(0, 6).map(dept => (
                  <Button
                    key={dept}
                    variant={selectedDepartment === dept ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDepartment(dept)}
                    className={selectedDepartment === dept 
                      ? "bg-gradient-to-r from-gold to-amber-600 text-black font-bold border-0 shadow-lg shadow-gold/30" 
                      : "bg-gradient-to-r from-white to-[#FDFBF7] border-2 border-gold/40 text-black hover:border-gold hover:shadow-[0_0_15px_rgba(200,167,102,0.2)]"
                    }
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
