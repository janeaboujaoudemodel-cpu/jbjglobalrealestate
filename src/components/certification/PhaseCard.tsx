import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CertificationPhase, UserCertificationProgress } from "@/hooks/useCertification";
import { Lock, CheckCircle, BookOpen, ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
          <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
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
          <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">
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
          ? "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-emerald-500/40" 
          : status === 'in_progress' || status === 'test_pending'
            ? "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/40"
            : "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/20",
        canStart && "hover:border-[#B89555]/50 hover:shadow-md"
      )}>
        <CardContent className="p-6 flex flex-col h-full">
          {/* Phase Number */}
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg",
              status === 'completed' 
                ? "bg-emerald-500/20 text-emerald-600"
                : status === 'in_progress' || status === 'test_pending'
                  ? "bg-[#EFE6D6]/20 text-[#1A1A1A]"
                  : "bg-[#EFE6D6]/10 text-[#1A1A1A]/40"
            )}>
              {phase.phase_number}
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
              <div className="flex items-center gap-2 text-emerald-600 text-sm">
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
                className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
              >
                Take Test
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : canStart ? (
              <Button 
                onClick={onStart}
                size="sm" 
                className="w-full bg-[#EFE6D6]/20 hover:bg-[#EFE6D6]/30 text-[#1A1A1A] border border-[#B89555]/30"
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
