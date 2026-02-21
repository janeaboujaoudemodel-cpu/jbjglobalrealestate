import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Globe, Languages,
  MessageSquare, Monitor, Shield
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TeamMember } from '@/config/team-members';

interface ITTeamDirectoryProps {
  searchQuery: string;
  teamMembers: TeamMember[];
}

const ITTeamDirectory: React.FC<ITTeamDirectoryProps> = ({ searchQuery, teamMembers }) => {
  const filteredMembers = teamMembers.filter(member => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(search) ||
      member.role.toLowerCase().includes(search)
    );
  });

  const sortedMembers = [...filteredMembers].sort((a, b) => 
    (a.hierarchyLevel || 5) - (b.hierarchyLevel || 5)
  );

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">IT Department Team</h2>
          <p className="text-black/60">Managing technology infrastructure and security</p>
        </div>
        <Badge className="bg-gold/20 text-gold border border-gold/30 px-4 py-2">
          <Monitor className="w-4 h-4 mr-2" />
          {sortedMembers.length} Team Members
        </Badge>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedMembers.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-white border-2 border-gold/30 hover:border-gold/50 transition-all group overflow-hidden">
              <div className="relative">
                {/* Status Indicator */}
                <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${
                  member.status === 'online' ? 'bg-green-500' :
                  member.status === 'away' ? 'bg-yellow-500' : 'bg-zinc-400'
                } ring-2 ring-white z-10`} />
                
                {/* Photo */}
                <div className="aspect-square overflow-hidden bg-gold/10">
                  <img 
                    src={member.avatar} 
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">
                  <Button size="sm" className="bg-gold/90 text-black hover:bg-gold">
                    <MessageSquare className="w-4 h-4 mr-1" /> Chat
                  </Button>
                </div>
              </div>

              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold text-black group-hover:text-gold transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-sm text-gold">{member.role}</p>
                  </div>

                  {member.nationality && (
                    <div className="flex items-center gap-2 text-sm text-black/60">
                      <Globe className="w-4 h-4" />
                      <span>{member.nationality}</span>
                    </div>
                  )}

                  {member.languages && member.languages.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-black/60">
                      <Languages className="w-4 h-4" />
                      <span className="truncate">{member.languages.slice(0, 3).join(', ')}</span>
                    </div>
                  )}

                  {member.specializations && member.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.specializations.slice(0, 2).map(spec => (
                        <Badge 
                          key={spec} 
                          variant="outline" 
                          className="text-xs border-gold/30 text-black/70"
                        >
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card className="bg-white border-2 border-gold/30">
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 text-gold mx-auto mb-4" />
            <p className="text-black/60">No team members found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ITTeamDirectory;