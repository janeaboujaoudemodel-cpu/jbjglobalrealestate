import { TeamMember, getTeamMemberById } from "@/config/team-members";
import { PortraitImage } from "@/components/ui/portrait-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Globe, Clock, MapPin, Briefcase, ArrowUpRight, Users } from "lucide-react";

interface TeamMemberDetailDialogProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onContact: (member: TeamMember) => void;
}

const TeamMemberDetailDialog = ({
  member,
  isOpen,
  onClose,
}: TeamMemberDetailDialogProps) => {
  if (!member) return null;

  // Get the reporting manager details
  const reportsToMember = member.reportsTo ? getTeamMemberById(member.reportsTo) : null;

  // Get direct reports details
  const directReportsMembers = member.directReports
    ? member.directReports.map(id => getTeamMemberById(id)).filter(Boolean) as TeamMember[]
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
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
              className="w-40 h-40 md:w-48 md:h-48 mx-auto md:mx-0"
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{member.name}</h2>
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
              <p className="text-zinc-500 text-sm mt-1">{member.department}</p>
            </div>

            {/* Experience and Nationality */}
            <div className="flex flex-wrap items-center gap-4">
              {typeof member.yearsExperience === "number" && (
                <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{member.yearsExperience} years experience</span>
                </div>
              )}
              {member.nationality && (
                <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{member.nationality}</span>
                </div>
              )}
            </div>

            {/* Reporting Structure */}
            {reportsToMember && (
              <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                <h4 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Reports To
                </h4>
                <div className="flex items-center gap-3">
                  {/* GLOBAL IMAGE RULE - LOCKED: No cropping, perfect centering */}
                  <img
                    src={reportsToMember.avatar}
                    alt={reportsToMember.name}
                    className="w-10 h-10 rounded-full object-contain object-center bg-zinc-900"
                  />
                  <div>
                    <p className="text-white font-medium text-sm">{reportsToMember.name}</p>
                    <p className="text-gold text-xs">{reportsToMember.role}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Direct Reports */}
            {directReportsMembers.length > 0 && (
              <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                <h4 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Direct Reports ({directReportsMembers.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {directReportsMembers.slice(0, 6).map((report) => (
                    <div key={report.id} className="flex items-center gap-2 bg-zinc-900 rounded-lg px-2 py-1.5">
                      {/* GLOBAL IMAGE RULE - LOCKED: No cropping, perfect centering */}
                      <img
                        src={report.avatar}
                        alt={report.name}
                        className="w-6 h-6 rounded-full object-contain object-center bg-zinc-950"
                      />
                      <span className="text-zinc-300 text-xs">{report.name.split(' ')[0]}</span>
                    </div>
                  ))}
                  {directReportsMembers.length > 6 && (
                    <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-2 py-1.5">
                      <span className="text-zinc-400 text-xs">+{directReportsMembers.length - 6} more</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {member.bio && (
              <p className="text-zinc-300 leading-relaxed">{member.bio}</p>
            )}

            {member.specializations && member.specializations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  Specializations
                </h4>
                <div className="flex flex-wrap gap-2">
                  {member.specializations.map((spec) => (
                    <Badge
                      key={spec}
                      className="bg-gold/10 text-gold border-gold/30"
                    >
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {member.languages && member.languages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Languages
                </h4>
                <div className="flex flex-wrap gap-2">
                  {member.languages.map((lang) => (
                    <Badge
                      key={lang}
                      variant="outline"
                      className="border-zinc-700 text-zinc-300"
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Hierarchy Level Badge */}
            {member.hierarchyLevel && (
              <div className="pt-2 border-t border-zinc-800">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
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
