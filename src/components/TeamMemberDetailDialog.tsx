import { TeamMember } from "@/config/team-members";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, MessageSquare } from "lucide-react";

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
  onContact,
}: TeamMemberDetailDialogProps) => {
  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{member.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Photo */}
          <div className="flex-shrink-0">
            <img
              src={member.avatar}
              alt={member.name}
              className="w-40 h-40 md:w-48 md:h-48 rounded-xl object-cover object-top mx-auto md:mx-0"
              loading="lazy"
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
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <p className="text-zinc-500 text-sm">{member.department}</p>
                {typeof member.yearsExperience === "number" && (
                  <p className="text-zinc-500 text-sm">
                    {member.yearsExperience} years experience
                  </p>
                )}
              </div>
            </div>

            {member.bio && (
              <p className="text-zinc-300 leading-relaxed">{member.bio}</p>
            )}

            {member.specializations && member.specializations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">
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

            {member.nationality && (
              <p className="text-sm text-zinc-400">
                Nationality: <span className="text-zinc-300">{member.nationality}</span>
              </p>
            )}

            {/* Action */}
            <div className="pt-4 border-t border-zinc-800">
              <Button
                onClick={() => {
                  onClose();
                  onContact(member);
                }}
                className="w-full bg-gold hover:bg-gold-dark text-black font-semibold"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamMemberDetailDialog;
