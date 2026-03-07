import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  Mail,
  Phone,
  MessageSquare,
  Video,
  Sparkles,
  Building2,
  Users,
  ChevronDown,
  ChevronRight,
  Crown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { allTeamMembers, TeamMember } from '@/config/team-members';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Department hierarchy configuration
const departmentHierarchy = {
  'Executive': { order: 1, color: 'border-gold/40', bgColor: 'bg-gold/5' },
  'Sales': { order: 2, color: 'border-green-500/30', bgColor: 'bg-green-500/5' },
  'Marketing': { order: 3, color: 'border-pink-500/30', bgColor: 'bg-pink-500/5' },
  'Human Resources': { order: 4, color: 'border-purple-500/30', bgColor: 'bg-purple-500/5' },
  'Finance': { order: 5, color: 'border-amber-500/30', bgColor: 'bg-amber-500/5' },
  'Technology': { order: 6, color: 'border-blue-500/30', bgColor: 'bg-blue-500/5' },
  'Design': { order: 7, color: 'border-cyan-500/30', bgColor: 'bg-cyan-500/5' },
  'Media': { order: 8, color: 'border-red-500/30', bgColor: 'bg-red-500/5' },
  'Operations': { order: 9, color: 'border-gray-500/30', bgColor: 'bg-gray-500/5' },
  'Customer Happiness': { order: 10, color: 'border-emerald-500/30', bgColor: 'bg-emerald-500/5' },
  'Client Relations': { order: 11, color: 'border-indigo-500/30', bgColor: 'bg-indigo-500/5' },
  'Legal': { order: 12, color: 'border-slate-500/30', bgColor: 'bg-slate-500/5' },
};

const departments = ['All', ...Object.keys(departmentHierarchy)];

const FoundersTeamDirectory: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [expandedDepts, setExpandedDepts] = useState<string[]>(Object.keys(departmentHierarchy));

  // Check if current user is founder/admin (for star visibility)
  const isFounderOrAdmin = user?.email?.includes('jane') || user?.email?.includes('admin');

  const filteredMembers = useMemo(() => {
    return allTeamMembers.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.role.toLowerCase().includes(search.toLowerCase());
      const matchesDepartment = selectedDepartment === 'All' || member.department === selectedDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [search, selectedDepartment]);

  // Group members by department
  const membersByDepartment = useMemo(() => {
    const grouped: Record<string, TeamMember[]> = {};
    filteredMembers.forEach(member => {
      const dept = member.department || 'Other';
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push(member);
    });
    
    // Sort departments by hierarchy order
    const sortedDepts = Object.keys(grouped).sort((a, b) => {
      const orderA = departmentHierarchy[a as keyof typeof departmentHierarchy]?.order || 99;
      const orderB = departmentHierarchy[b as keyof typeof departmentHierarchy]?.order || 99;
      return orderA - orderB;
    });
    
    return { grouped, sortedDepts };
  }, [filteredMembers]);

  const totalTeamCount = allTeamMembers.length;

  const toggleDepartment = (dept: string) => {
    setExpandedDepts(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const handleContact = (member: TeamMember, type: 'email' | 'phone' | 'whatsapp' | 'video') => {
    toast.info(`Starting ${type} with ${member.name}...`);
  };

  const getReportsTo = (member: TeamMember): string => {
    // Determine reporting structure based on role
    if (member.role.includes('CEO') || member.role.includes('Founder')) return 'Board';
    if (member.role.includes('Director') || member.role.includes('COO') || member.role.includes('MD')) return 'Founder & CEO';
    if (member.role.includes('Manager') || member.role.includes('Head')) return 'Director';
    if (member.role.includes('Lead')) return 'Manager';
    return 'Team Lead';
  };

  return (
    <div className="space-y-6">
      {/* Header with Team Count */}
      <Card className="bg-white border-2 border-gold/30 shadow-[0_0_20px_rgba(200,167,102,0.15)]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30">
                <Users className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">Team Directory</h2>
                <p className="text-sm text-zinc-600">JBJ Global Real Estate Team</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gold">{totalTeamCount}</p>
              <p className="text-xs text-zinc-500">Total Members</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search team members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border-2 border-gold/30 text-black placeholder:text-zinc-400 shadow-[0_0_10px_rgba(200,167,102,0.1)]"
          />
        </div>
        <div className="w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-2 pb-2 md:pb-0 min-w-0">
            {departments.map((dept) => (
              <Button
                key={dept}
                size="sm"
                onClick={() => setSelectedDepartment(dept)}
                className={selectedDepartment === dept 
                  ? 'bg-black text-white border-2 border-gold/50 shadow-[0_0_15px_rgba(200,167,102,0.3)] whitespace-nowrap hover:bg-zinc-900' 
                  : 'bg-white text-gold border-2 border-gold/30 hover:bg-transparent hover:border-gold/50 whitespace-nowrap'
                }
              >
                {dept === 'All' ? `All (${totalTeamCount})` : dept}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Department Groups */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {membersByDepartment.sortedDepts.map((dept) => {
            const members = membersByDepartment.grouped[dept];
            const deptConfig = departmentHierarchy[dept as keyof typeof departmentHierarchy];
            const isExpanded = expandedDepts.includes(dept);

            return (
              <Collapsible key={dept} open={isExpanded} onOpenChange={() => toggleDepartment(dept)}>
                <Card className={`bg-white border-2 ${deptConfig?.color || 'border-gold/20'} shadow-[0_0_15px_rgba(200,167,102,0.1)]`}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-zinc-50 transition-colors py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gold" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gold" />
                          )}
                          <CardTitle className="text-black text-lg">{dept}</CardTitle>
                          <Badge className="bg-gold/10 text-gold border border-gold/30">
                            {members.length} members
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {members.map((member, index) => (
                          <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                          >
                            <Card className="bg-white border-2 border-gold/20 hover:border-gold/40 hover:shadow-[0_0_20px_rgba(200,167,102,0.2)] transition-all group">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  {/* Avatar */}
                                  <div className="relative">
                                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold/30 group-hover:border-gold/60 transition-colors">
                                      <img 
                                        src={member.avatar} 
                                        alt={member.name} 
                                        className="w-full h-full"
                                        style={{ objectFit: "cover", objectPosition: "center 15%" }}
                                      />
                                    </div>
                                    {/* Star indicator - visible only to founder/admin for AI personas */}
                                    {isFounderOrAdmin && member.isAI && (
                                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                                        <Sparkles className="w-3 h-3 text-black" />
                                      </span>
                                    )}
                                  </div>

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-black font-semibold truncate">{member.name}</h4>
                                      {member.role.includes('CEO') || member.role.includes('Founder') ? (
                                        <Crown className="w-4 h-4 text-gold" />
                                      ) : null}
                                    </div>
                                    <p className="text-sm text-gold truncate">{member.role}</p>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                                      <Building2 className="w-3 h-3" />
                                      Reports to: {getReportsTo(member)}
                                    </div>
                                  </div>
                                </div>

                                {/* Languages */}
                                {member.languages && member.languages.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-3">
                                    {member.languages.slice(0, 3).map((lang) => (
                                      <Badge key={lang} variant="outline" className="text-xs border-gold/20 text-zinc-600 bg-zinc-50">
                                        {lang}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {/* Quick Actions */}
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gold/10">
                                  <Button
                                    size="sm"
                                    className="flex-1 bg-white text-gold border-2 border-gold/30 hover:bg-transparent hover:border-gold shadow-[0_0_10px_rgba(200,167,102,0.15)]"
                                    onClick={() => handleContact(member, 'whatsapp')}
                                  >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Chat
                                  </Button>
                                  <button
                                    onClick={() => handleContact(member, 'email')}
                                    className="w-8 h-8 rounded-full bg-white text-gold border-2 border-gold/30 hover:border-gold hover:shadow-[0_0_10px_rgba(200,167,102,0.3)] flex items-center justify-center transition-all"
                                  >
                                    <Mail className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleContact(member, 'phone')}
                                    className="w-8 h-8 rounded-full bg-white text-gold border-2 border-gold/30 hover:border-gold hover:shadow-[0_0_10px_rgba(200,167,102,0.3)] flex items-center justify-center transition-all"
                                  >
                                    <Phone className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleContact(member, 'video')}
                                    className="w-8 h-8 rounded-full bg-white text-gold border-2 border-gold/30 hover:border-gold hover:shadow-[0_0_10px_rgba(200,167,102,0.3)] flex items-center justify-center transition-all"
                                  >
                                    <Video className="w-4 h-4" />
                                  </button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <Card className="bg-white border-2 border-gold/20">
          <CardContent className="p-8 text-center">
            <Search className="w-12 h-12 text-gold/30 mx-auto mb-4" />
            <p className="text-zinc-600">No team members found</p>
            <p className="text-sm text-zinc-400 mt-1">Try adjusting your search or filter</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FoundersTeamDirectory;
