import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCertification } from "@/hooks/useCertification";
import { Loader2, Award, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhaseCard } from "./PhaseCard";
import { CertificatePreview } from "./CertificatePreview";

interface CertificationSectionProps {
  className?: string;
}

export function CertificationSection({ className }: CertificationSectionProps) {
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
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
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
          <Badge className="mb-4 bg-gold/20 text-gold border-gold/30">
            <Award className="w-3 h-3 mr-1" />
            Professional Certification
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold !text-black mb-4">
            Broker Certification Program
          </h2>
          <p className="!text-black/70 max-w-2xl mx-auto">
            Complete all phases to earn your official JBJ Broker Certification. 
            Each phase must be completed in order.
          </p>
        </div>

        {/* Overall Progress */}
        <Card className="jj-card-inner mb-8">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  certified ? "bg-emerald-500/20 border border-emerald-500/30" : "jj-icon-box-active"
                )}>
                  {certified ? (
                    <CheckCircle className="w-7 h-7 text-emerald-600" />
                  ) : (
                    <Award className="w-7 h-7 text-gold" />
                  )}
                </div>
                <div>
                  <h3 className="text-black font-semibold text-lg">
                    {certified ? "Certification Complete!" : "Your Progress"}
                  </h3>
                  <p className="text-black/60">
                    {overallProgress.completed} of {overallProgress.total} phases completed
                  </p>
                </div>
              </div>
              
              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-sm text-black/60 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(overallProgress.percent)}%</span>
                </div>
                <Progress 
                  value={overallProgress.percent} 
                  className="h-3 bg-gold/10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phases Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
          {phases.map((phase, index) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              status={getPhaseStatus(phase.id)}
              index={index}
              onStart={() => startPhase(phase.id)}
              isFirst={index === 0}
              previousCompleted={index === 0 || getPhaseStatus(phases[index - 1].id) === 'completed'}
            />
          ))}
        </div>

        {/* Certificate Preview */}
        {certified && <CertificatePreview />}
      </div>
    </section>
  );
}
