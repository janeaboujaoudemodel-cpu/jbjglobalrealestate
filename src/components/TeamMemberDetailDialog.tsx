import { TeamMember, getTeamMemberById } from "@/config/team-members";
import { PortraitImage } from "@/components/ui/portrait-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Clock, MapPin, Briefcase, ArrowUpRight, Users, MessageSquare, Mail } from "lucide-react";

interface TeamMemberDetailDialogProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onContact: (member: TeamMember) => void;
  isInternalUser?: boolean;
}

const TeamMemberDetailDialog = ({
  member,
  isOpen,
  onClose,
  onContact,
  isInternalUser = false,
}: TeamMemberDetailDialogProps) => {
  if (!member) return null;

  // Get the reporting manager details
  const reportsToMember = member.reportsTo ? getTeamMemberById(member.reportsTo) : null;

  // Get direct reports details
  const directReportsMembers = member.directReports
    ? member.directReports.map(id => getTeamMemberById(id)).filter(Boolean) as TeamMember[]
    : [];

  const handleContactClick = () => {
    onContact(member);
  };

  const handleEmailClick = () => {
    if (member.email) {
      window.location.href = `mailto:${member.email}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(200,167,102,0.3)]">
        <DialogHeader>
          <DialogTitle className="sr-only">{member.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Photo (GLOBAL RULE: no crop, no empty edges) */}
          <div className="flex-shrink-0">
            <PortraitImage
              src={member.avatar}
              alt={member.name}
              shape="rounded"
              size="full"
              bordered={false}
              focus="top"
              className="w-40 h-40 md:w-48 md:h-48 mx-auto md:mx-0 border-2 border-gold/40 shadow-lg"
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-black">{member.name}</h2>
              <p
                className="text-lg font-semibold mt-1"
                style={{
                  background:
                    "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 40%, #F5ECD7 50%, #E8D5A3 60%, #CBA64B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {member.role}
              </p>
              <p className="text-zinc-600 text-sm mt-1">{member.department}</p>
            </div>

            {/* Experience and Nationality */}
            <div className="flex flex-wrap items-center gap-4">
              {typeof member.yearsExperience === "number" && (
                <div className="flex items-center gap-1.5 text-zinc-600 text-sm">
                  <Clock className="w-4 h-4 text-gold" />
                  <span>{member.yearsExperience} years experience</span>
                </div>
              )}
              {member.nationality && (
                <div className="flex items-center gap-1.5 text-zinc-600 text-sm">
                  <MapPin className="w-4 h-4 text-gold" />
                  <span>{member.nationality}</span>
                </div>
              )}
            </div>

            {/* Contact Actions - For Everyone (changed from Chat to Contact Us) */}
            <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] rounded-lg p-4 border border-gold/30 shadow-md">
              <h4 className="text-sm font-medium text-black mb-3">Contact Options</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleContactClick}
                  className="relative inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 group overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                    boxShadow: `
                      0 6px 15px rgba(200,167,102,0.3),
                      0 3px 8px rgba(0,0,0,0.1),
                      inset 0 2px 4px rgba(255,255,255,0.9),
                      inset 0 -2px 4px rgba(200,167,102,0.2)
                    `,
                  }}
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                  <span className="relative flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
                    <span className="text-black group-hover:text-gold transition-colors">Contact</span>
                    <span className="text-gold group-hover:text-black transition-colors">Us</span>
                  </span>
                </button>
                {member.email && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEmailClick}
                    className="border-2 border-black text-black hover:bg-black hover:text-white transition-all duration-300"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                )}
              </div>
              {member.email && (
                <p className="text-zinc-600 text-xs mt-2">{member.email}</p>
              )}
            </div>

            {/* Reporting Structure */}
            {reportsToMember && (
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-lg p-3 border border-gold/30">
                <h4 className="text-sm font-medium text-zinc-600 mb-2 flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-gold" />
                  Reports To
                </h4>
                <div className="flex items-center gap-3">
                  {/* GLOBAL IMAGE RULE - LOCKED (FINAL):
                      object-fit: cover + center 15% = max zoom, crop from bottom */}
                  <img
                    src={reportsToMember.avatar}
                    alt={reportsToMember.name}
                    className="w-10 h-10 rounded-full border border-gold/30"
                    style={{ objectFit: "cover", objectPosition: "center 15%" }}
                  />
                  <div>
                    <p className="text-black font-medium text-sm">{reportsToMember.name}</p>
                    <p className="text-gold text-xs">{reportsToMember.role}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Direct Reports */}
            {directReportsMembers.length > 0 && (
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-lg p-3 border border-gold/30">
                <h4 className="text-sm font-medium text-zinc-600 mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gold" />
                  Direct Reports ({directReportsMembers.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {directReportsMembers.slice(0, 6).map((report) => (
                    <div key={report.id} className="flex items-center gap-2 bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] rounded-lg px-2 py-1.5 border border-gold/20">
                      {/* GLOBAL IMAGE RULE - LOCKED (FINAL):
                          object-fit: cover + center 15% = max zoom, crop from bottom */}
                      <img
                        src={report.avatar}
                        alt={report.name}
                        className="w-6 h-6 rounded-full border border-gold/30"
                        style={{ objectFit: "cover", objectPosition: "center 15%" }}
                      />
                      <span className="text-black text-xs">{report.name.split(' ')[0]}</span>
                    </div>
                  ))}
                  {directReportsMembers.length > 6 && (
                    <div className="flex items-center gap-2 bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] rounded-lg px-2 py-1.5 border border-gold/20">
                      <span className="text-zinc-600 text-xs">+{directReportsMembers.length - 6} more</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {member.bio && (
              <p className="text-zinc-700 leading-relaxed">{member.bio}</p>
            )}

            {member.specializations && member.specializations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-600 mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-gold" />
                  Specializations
                </h4>
                <div className="flex flex-wrap gap-2">
                  {member.specializations.map((spec) => (
                    <Badge
                      key={spec}
                      className="bg-gold/15 text-gold border-gold/30"
                    >
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {member.languages && member.languages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-600 mb-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-gold" />
                  Languages
                </h4>
                <div className="flex flex-wrap gap-2">
                  {member.languages.map((lang) => (
                    <Badge
                      key={lang}
                      variant="outline"
                      className="border-gold/30 text-black bg-gold/10"
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Hierarchy Level Badge */}
            {member.hierarchyLevel && (
              <div className="pt-2 border-t border-gold/30">
                <Badge className="bg-purple-500/20 text-purple-700 border-purple-500/30">
                  Level {member.hierarchyLevel} • Joined September 2025
                </Badge>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamMemberDetailDialog;