import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCertification } from "@/hooks/useCertification";
import { Loader2, Award, CheckCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhaseCard } from "./PhaseCard";
import { CertificatePreview } from "./CertificatePreview";
import { IconTile } from "@/components/ui/icon-tile";

interface CertificationSectionProps {
  className?: string;
  isLocked?: boolean;
}

export function CertificationSection({ className, isLocked = false }: CertificationSectionProps) {
  const { 
    phases, 
    isLoading, 
    getPhaseStatus, 
    getOverallProgress,
    isFullyCertified,
    startPhase 
  } = useCertification();

  if (isLoading) {
    return (
      <div className={cn("py-12", className)}>
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#1A1A1A] animate-spin" />
        </div>
      </div>
    );
  }

  const overallProgress = getOverallProgress();
  const certified = isFullyCertified();

  return (
    <section className={cn("py-12 md:py-16", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30">
            <Award className="w-3 h-3 mr-1" />
            Professional Certification
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold !text-[#1A1A1A] mb-4">
            Broker Certification Program
          </h2>
          <p className="!text-[#1A1A1A]/70 max-w-2xl mx-auto">
            Complete all phases to earn your official JBJ Broker Certification. 
            Each phase must be completed in order.
          </p>
        </div>

        {/* Overall Progress */}
        <Card className="jj-card-inner mb-8">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <IconTile icon={certified ? CheckCircle : Award} tone="emerald" size="xl" className="!h-14 !w-14 !rounded-xl" iconClassName="!h-7 !w-7" />
                <div>
                  <h3 className="text-[#1A1A1A] font-semibold text-lg">
                    {certified ? "Certification Complete!" : "Your Progress"}
                  </h3>
                  <p className="text-[#1A1A1A]/60">
                    {overallProgress.completed} of {overallProgress.total} phases completed
                  </p>
                </div>
              </div>
              
              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-sm text-[#1A1A1A]/60 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(overallProgress.percent)}%</span>
                </div>
                <Progress 
                  value={overallProgress.percent} 
                  className="h-3 bg-[#EFE6D6]/10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Locked Banner */}
        {isLocked && (
          <div className="mb-8 p-4 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-xl flex items-center gap-4">
            <Lock className="w-6 h-6 text-[#1A1A1A] flex-shrink-0" />
            <p className="text-[#1A1A1A]/70 text-sm">
              Certification phases are visible for preview. Join the JBJ Broker Circle to start your certification journey.
            </p>
          </div>
        )}

        {/* Phases Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
          {phases.map((phase, index) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              status={isLocked ? 'locked' : getPhaseStatus(phase.id)}
              index={index}
              onStart={() => !isLocked && startPhase(phase.id)}
              isFirst={index === 0}
              previousCompleted={index === 0 || getPhaseStatus(phases[index - 1].id) === 'completed'}
              isLocked={isLocked}
            />
          ))}
        </div>

        {/* Certificate Preview - Always show so users can see what they'll earn */}
        <CertificatePreview isLocked={isLocked} />
      </div>
    </section>
  );
}
