import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  Mail,
  Phone,
  MessageSquare,
  Video,
  Sparkles,
  Building2,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { allTeamMembers, TeamMember } from '@/config/team-members';
import { toast } from 'sonner';

const departments = ['All', 'Executive', 'Sales', 'Marketing', 'Human Resources', 'Finance', 'Media', 'Design', 'Operations', 'Technology'];

const FoundersTeamDirectory: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  const filteredMembers = allTeamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.role.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All' || member.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleContact = (member: TeamMember, type: 'email' | 'phone' | 'whatsapp' | 'video') => {
    if (member.isAI) {
      toast.info(`Starting chat with ${member.name}...`);
    } else {
      toast.info(`Contacting ${member.name} via ${type}...`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search team members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#1A1A1A] border-gold/20 text-white placeholder:text-gray-500"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {departments.map((dept) => (
            <Button
              key={dept}
              size="sm"
              variant={selectedDepartment === dept ? 'default' : 'outline'}
              onClick={() => setSelectedDepartment(dept)}
              className={selectedDepartment === dept 
                ? 'bg-gold text-black hover:bg-gold/90 whitespace-nowrap' 
                : 'border-gold/20 text-gray-400 hover:text-white whitespace-nowrap'
              }
            >
              {dept}
            </Button>
          ))}
        </div>
      </div>

      {/* Team Grid */}
      <ScrollArea className="h-[500px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-[#0E0E0E] border-gold/20 hover:border-gold/40 transition-all group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold/30 group-hover:border-gold/60 transition-colors">
                        {/* GLOBAL IMAGE RULE - LOCKED (FINAL): max zoom, crop from bottom */}
                        <img 
                          src={member.avatar} 
                          alt={member.name} 
                          className="w-full h-full"
                          style={{ objectFit: "cover", objectPosition: "center 15%" }}
                        />
                      </div>
                      {member.isAI && (
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-black" />
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-semibold truncate">{member.name}</h4>
                        {member.isAI && (
                          <Badge className="bg-gold/10 text-gold border-gold/30 text-xs">AI</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gold truncate">{member.role}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Building2 className="w-3 h-3" />
                        {member.department}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {member.bio && (
                    <p className="text-xs text-gray-400 mt-3 line-clamp-2">{member.bio}</p>
                  )}

                  {/* Languages */}
                  {member.languages && member.languages.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {member.languages.map((lang) => (
                        <Badge key={lang} variant="outline" className="text-xs border-gold/20 text-gray-400">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gold/10">
                    {member.isAI ? (
                      <Button
                        size="sm"
                        className="flex-1 bg-gold hover:bg-gold/90 text-black"
                        onClick={() => handleContact(member, 'whatsapp')}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat with AI
                      </Button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleContact(member, 'email')}
                          className="w-8 h-8 rounded-full bg-gold/10 text-gold hover:bg-gold/20 flex items-center justify-center transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleContact(member, 'phone')}
                          className="w-8 h-8 rounded-full bg-gold/10 text-gold hover:bg-gold/20 flex items-center justify-center transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleContact(member, 'whatsapp')}
                          className="w-8 h-8 rounded-full bg-gold/10 text-gold hover:bg-gold/20 flex items-center justify-center transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleContact(member, 'video')}
                          className="w-8 h-8 rounded-full bg-gold/10 text-gold hover:bg-gold/20 flex items-center justify-center transition-colors"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <Card className="bg-[#0E0E0E] border-gold/20">
          <CardContent className="p-8 text-center">
            <Search className="w-12 h-12 text-gold/30 mx-auto mb-4" />
            <p className="text-gray-400">No team members found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FoundersTeamDirectory;
