import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Target, Play, CheckCircle, Circle, Sparkles, Lock, ArrowRight } from "lucide-react";
import type { EducationBook, EducationModule } from "@/hooks/useBrokerEducation";
import { useBookModules } from "@/hooks/useBrokerEducation";
import { useModuleCompletion } from "@/hooks/useModuleCompletion";
import { PremiumBookCover } from "@/components/books/PremiumBookCover";
import { useMemo } from "react";


interface BookDetailModalProps {
  book: EducationBook | null;
  isOpen: boolean;
  onClose: () => void;
  isLocked?: boolean;
}

const LEARNING_PATH_COLORS: Record<string, { badge: string; accent: string }> = {
  'Foundations': { badge: 'bg-blue-500/20 text-blue-700 border-blue-500/30', accent: 'text-blue-600' },
  'Buyer & Investor Advisory': { badge: 'jj-surface-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30/30', accent: 'text-[color:var(--emerald-1)]' },
  'Seller & Landlord Advisory': { badge: 'bg-amber-500/20 text-amber-700 border-amber-500/30', accent: 'text-amber-600' },
  'Market Intelligence': { badge: 'bg-purple-500/20 text-purple-700 border-purple-500/30', accent: 'text-purple-600' },
  'Advanced (Restricted)': { badge: 'bg-red-500/20 text-red-700 border-red-500/30', accent: 'text-red-600' },
};

const DEFAULT_PATH_COLORS = { badge: 'bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30', accent: 'text-[#1A1A1A]/70' };

export function BookDetailModal({ book, isOpen, onClose, isLocked = false }: BookDetailModalProps) {
  const { modules, loading } = useBookModules(book?.id || null);
  const moduleIds = useMemo(() => modules.map((m) => m.id), [modules]);
  const { completedMap, completedCount, toggle, pendingId } = useModuleCompletion(
    book?.id || null,
    moduleIds,
  );

  if (!book) return null;

  const pathColors = LEARNING_PATH_COLORS[book.learning_path] || DEFAULT_PATH_COLORS;
  const totalMinutes = modules.reduce((sum, m) => sum + m.estimated_minutes, 0);

  const completedModules = completedCount;
  const progressPercent = modules.length > 0 ? (completedModules / modules.length) * 100 : 0;


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
        <DialogHeader>
          <div className="flex items-start gap-5">
            {/* Mini book cover — same master style as the academy grid */}
            <div className="relative flex-shrink-0 w-28 aspect-[3/4] overflow-hidden rounded-r-[4px] rounded-l-[2px] shadow-[8px_10px_22px_rgba(0,0,0,0.32),inset_0_0_0_1px_rgba(184,149,85,0.4)]">
              <PremiumBookCover
                title={book.title}
                number={book.book_number}
                subtitle={book.learning_path}
                tone="black"
              />
              <div className="absolute inset-y-0 left-0 w-[6%] pointer-events-none bg-gradient-to-r from-[#030303]/90 via-[#1A1A1A]/60 to-transparent" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${pathColors.badge} text-xs`}>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Book {book.book_number} • {book.learning_path}
                </Badge>
              </div>
              <DialogTitle className="text-2xl text-foreground mb-2 leading-tight">
                {book.title}
              </DialogTitle>
              <p className="text-muted-foreground text-sm">
                {book.description}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Learning Objective */}
        {book.learning_objective && (
          <div className="bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#1A1A1A]" />
              <span className="text-[#1A1A1A] font-medium text-sm">Learning Objective</span>
            </div>
            <p className="text-foreground/70 text-sm">{book.learning_objective}</p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-4 p-4 bg-[#FDFBF7]/50 rounded-lg border border-[#B89555]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Your Progress</span>
            <span className="text-xs text-muted-foreground">{completedModules} of {modules.length} modules completed</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>{modules.length} Modules</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>~{totalMinutes} min total</span>
          </div>
        </div>

        {/* Modules List */}
        <div className="mt-6">
          <h4 className="text-foreground font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#1A1A1A]" />
            Training Modules
          </h4>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-[#B89555] border-t-transparent rounded-full" />
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {modules.map((module, index) => {
                const isCompleted = !!completedMap[module.id];
                const isPending = pendingId === module.id;
                const isCurrentModule = !isCompleted && index === modules.findIndex((m) => !completedMap[m.id]);

                return (
                  <AccordionItem
                    key={module.id}
                    value={module.id}
                    className="border-2 border-[#B89555]/30 rounded-lg bg-gradient-to-br from-white/80 via-[#F7F1E6]/50 to-[#ECE2D2]/30 overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-[#EFE6D6]/10">
                      <div className="flex items-center gap-3 text-left w-full">
                        {/* Status Icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
 isLocked
 ? 'bg-[#EFE6D6]/10 border border-[#B89555]/30 text-[#1A1A1A]/70'
 : isCompleted
 ? 'jj-surface-emerald'
 : isCurrentModule
 ? 'bg-[#EFE6D6]/20 border-2 border-[#B89555] text-[#1A1A1A]'
 : 'bg-muted border border-border text-muted-foreground'
 }`}>
                          {isLocked ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <span className="text-sm font-medium">{module.module_number}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate ${isLocked ? 'text-foreground/60' : 'text-foreground'}`}>{module.title}</div>
                          <div className="text-muted-foreground text-xs flex items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {module.estimated_minutes} min
                            {isLocked && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-[#B89555]/30 text-[#1A1A1A]/70">
                                Locked
                              </Badge>
                            )}
                            {!isLocked && isCompleted && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-[color:var(--emerald-1)]/30/40 text-[color:var(--emerald-1)] jj-surface-emerald-soft">
                                Completed
                              </Badge>
                            )}
                            {!isLocked && isCurrentModule && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-[#B89555] text-[#1A1A1A]">
                                Continue
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="pl-11 space-y-4">
                        <p className="text-muted-foreground text-sm">
                          {module.description || "Complete this module to learn key concepts and best practices."}
                        </p>
                        {isLocked ? (
                          <div className="flex items-center gap-2 text-[#1A1A1A]/70 text-sm">
                            <Lock className="w-4 h-4" />
                            <span>Join JBJ Broker Circle to access this module</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/80 text-[#1A1A1A]"
                              asChild
                            >
                              <Link to={`/broker/learning/book/${book.id}?module=${module.id}`} onClick={onClose}>
                                <Play className="w-3 h-3 mr-2" />
                                {isCompleted ? 'Review Module' : 'Start Module'}
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant={isCompleted ? "outline" : "default"}
                              disabled={isPending}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggle(module.id);
                              }}
                              className={
                                isCompleted
                                  ? "border-[color:var(--emerald-1)]/30/50 text-[color:var(--emerald-1)] hover:jj-surface-emerald-soft"
                                  : "jj-surface-emerald jj-surface-emerald text-white"
                              }
                            >
                              {isCompleted ? (
                                <>
                                  <Circle className="w-3 h-3 mr-2" />
                                  Mark Not Complete
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-2" />
                                  Mark Complete
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>


        {/* Locked CTA or Internal Notice */}
        {isLocked ? (
          <div className="mt-6 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-lg p-5 text-center">
            <Lock className="w-6 h-6 text-[#1A1A1A] mx-auto mb-2" />
            <p className="text-foreground font-medium mb-1">Content Locked</p>
            <p className="text-muted-foreground text-xs mb-3">Join the JBJ Broker Circle to access all training modules.</p>
            <Button size="sm" variant="secondary" className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]" asChild>
              <Link to="/careers">
                <ArrowRight className="w-3 h-3 mr-2" />
                Apply to Join
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <Button
              asChild
              size="lg"
              className="w-full jj-pill-emerald-metallic"
            >
              <Link to={`/broker/learning/book/${book.id}`} onClick={onClose}>
                <BookOpen className="w-4 h-4 mr-2" />
                Open Reader
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/30 rounded-lg p-4">
              <p className="text-muted-foreground text-xs text-center">
                This content is proprietary academy material. Internal recognition only — not for external certification.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
