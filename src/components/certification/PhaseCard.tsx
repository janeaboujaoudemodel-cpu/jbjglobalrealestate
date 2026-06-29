import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CertificationPhase, UserCertificationProgress } from "@/hooks/useCertification";
import { Lock, CheckCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { IconTile } from "@/components/ui/icon-tile";

interface PhaseCardProps {
  phase: CertificationPhase;
  status: UserCertificationProgress['status'];
  index: number;
  onStart: () => void;
  isFirst: boolean;
  previousCompleted: boolean;
  isLocked?: boolean;
}

export function PhaseCard({ 
  phase, 
  status, 
  index, 
  onStart, 
  isFirst, 
  previousCompleted,
  isLocked = false,
}: PhaseCardProps) {
  const canStart = (isFirst || previousCompleted) && status === 'locked';

  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="jj-surface-emerald text-white border-0">
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">
            In Progress
          </Badge>
        );
      case 'test_pending':
        return (
          <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40">
            Test Ready
          </Badge>
        );
      default:
        return (
          <Badge className="bg-[#EFE6D6]/10 text-[#1A1A1A]/50 border-[#B89555]/20">
            Locked
          </Badge>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={cn(
        "h-full border transition-all duration-300 overflow-hidden",
        status === 'completed' 
          ? "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[color:var(--emerald-1)]/30/40" 
          : status === 'in_progress' || status === 'test_pending'
            ? "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/40"
            : "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/20",
        canStart && "hover:border-[#B89555]/50 hover:shadow-md"
      )}>
        <CardContent className="p-6 flex flex-col h-full">
          {/* Phase Number */}
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              {status === 'completed' ? (
                <IconTile icon={CheckCircle} tone="emerald" size="md" className="!h-10 !w-10 !rounded-lg" iconClassName="!h-4 !w-4" />
              ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">
                  {phase.phase_number}
                </div>
              )}
            </div>
            {getStatusBadge()}
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className={cn(
              "text-lg font-semibold mb-2",
              status === 'locked' ? "text-[#1A1A1A]/50" : "text-[#1A1A1A]"
            )}>
              {phase.title}
            </h3>
            <p className={cn(
              "text-sm line-clamp-3",
              status === 'locked' ? "text-[#1A1A1A]/50" : "text-[#1A1A1A]/60"
            )}>
              {phase.description}
            </p>
          </div>

          {/* Action Button */}
          <div className="mt-4 pt-4 border-t border-[#B89555]/20">
            {status === 'completed' ? (
              <div className="flex items-center gap-2 text-[color:var(--emerald-1)] text-sm">
                <CheckCircle className="w-4 h-4" />
                Phase Completed
              </div>
            ) : status === 'in_progress' ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-[#B89555]/50 text-[#1A1A1A] hover:bg-[#EFE6D6]/10 whitespace-nowrap text-sm"
              >
                Continue Learning
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : status === 'test_pending' ? (
              <Button 
                size="sm" 
                className="w-full jj-pill-emerald-metallic"
                data-surface="emerald"
              >
                Take Test
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : canStart ? (
              <Button 
                onClick={onStart}
                size="sm" 
                className="w-full jj-pill-emerald-metallic"
                data-surface="emerald"
              >
                Start Phase
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-[#1A1A1A]/40 text-sm">
                <Lock className="w-4 h-4" />
                Complete previous phase first
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
