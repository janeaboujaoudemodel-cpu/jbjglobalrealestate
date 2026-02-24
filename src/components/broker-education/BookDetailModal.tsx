import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Target, Play, CheckCircle, Circle, Sparkles, Lock, ArrowRight } from "lucide-react";
import type { EducationBook, EducationModule } from "@/hooks/useBrokerEducation";
import { useBookModules } from "@/hooks/useBrokerEducation";

interface BookDetailModalProps {
  book: EducationBook | null;
  isOpen: boolean;
  onClose: () => void;
  isLocked?: boolean;
}

const LEARNING_PATH_COLORS: Record<string, { badge: string; accent: string }> = {
  'Foundations': { badge: 'bg-blue-500/20 text-blue-700 border-blue-500/30', accent: 'text-blue-600' },
  'Buyer & Investor Advisory': { badge: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30', accent: 'text-emerald-600' },
  'Seller & Landlord Advisory': { badge: 'bg-amber-500/20 text-amber-700 border-amber-500/30', accent: 'text-amber-600' },
  'Market Intelligence': { badge: 'bg-purple-500/20 text-purple-700 border-purple-500/30', accent: 'text-purple-600' },
  'Advanced (Restricted)': { badge: 'bg-red-500/20 text-red-700 border-red-500/30', accent: 'text-red-600' },
};

const DEFAULT_PATH_COLORS = { badge: 'bg-zinc-500/20 text-zinc-700 border-zinc-500/30', accent: 'text-zinc-600' };

export function BookDetailModal({ book, isOpen, onClose, isLocked = false }: BookDetailModalProps) {
  const { modules, loading } = useBookModules(book?.id || null);
  
  if (!book) return null;

  const pathColors = LEARNING_PATH_COLORS[book.learning_path] || DEFAULT_PATH_COLORS;
  const totalMinutes = modules.reduce((sum, m) => sum + m.estimated_minutes, 0);
  
  // Mock progress for now (would come from user progress tracking)
  const completedModules = 0;
  const progressPercent = modules.length > 0 ? (completedModules / modules.length) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
        <DialogHeader>
          <div className="flex items-start gap-5">
            {/* 3D Mini Book Cover */}
            <div 
              className="relative flex-shrink-0"
              style={{ perspective: '500px' }}
            >
              <div 
                className="w-28 h-36 rounded-lg bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-gold/40 flex items-center justify-center relative overflow-hidden"
                style={{
                  transform: 'rotateY(-8deg) rotateX(3deg)',
                  boxShadow: '8px 8px 25px rgba(0,0,0,0.4), -2px -2px 10px rgba(200,167,102,0.15)',
                }}
              >
                {/* Spine effect */}
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-gold/30 via-gold/15 to-transparent" />
                
                {/* Book number */}
                <div className="w-12 h-12 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                  <span className="text-gold text-xl font-bold">{book.book_number}</span>
                </div>
                
                {/* Page edges */}
                <div className="absolute right-0 top-0 bottom-0 w-2">
                  <div className="h-full bg-gradient-to-l from-zinc-200/15 to-transparent" />
                </div>
              </div>
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
          <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-gold" />
              <span className="text-gold font-medium text-sm">Learning Objective</span>
            </div>
            <p className="text-foreground/70 text-sm">{book.learning_objective}</p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-4 p-4 bg-white/50 rounded-lg border border-gold/20">
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
            <BookOpen className="w-4 h-4 text-gold" />
            Training Modules
          </h4>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full" />
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {modules.map((module, index) => {
                // Mock: none completed yet
                const isCompleted = false;
                const isCurrentModule = index === 0;
                
                return (
                  <AccordionItem 
                    key={module.id} 
                    value={module.id}
                    className="border-2 border-gold/30 rounded-lg bg-gradient-to-br from-white/80 via-[#F5EBD7]/50 to-[#E8DCC8]/30 overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gold/10">
                      <div className="flex items-center gap-3 text-left w-full">
                        {/* Status Icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isLocked
                            ? 'bg-gold/10 border border-gold/30 text-gold/50'
                            : isCompleted 
                              ? 'bg-emerald-500 text-white' 
                              : isCurrentModule 
                                ? 'bg-gold/20 border-2 border-gold text-gold' 
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
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-gold/30 text-gold/50">
                                Locked
                              </Badge>
                            )}
                            {!isLocked && isCurrentModule && !isCompleted && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-gold text-gold">
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
                          <div className="flex items-center gap-2 text-gold/70 text-sm">
                            <Lock className="w-4 h-4" />
                            <span>Join JBJ Broker Circle to access this module</span>
                          </div>
                        ) : (
                          <Button 
                            size="sm"
                            variant="secondary"
                            className="bg-gold hover:bg-gold-dark text-black"
                          >
                            <Play className="w-3 h-3 mr-2" />
                            {isCompleted ? 'Review Module' : 'Start Module'}
                          </Button>
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
          <div className="mt-6 bg-gold/10 border border-gold/30 rounded-lg p-5 text-center">
            <Lock className="w-6 h-6 text-gold mx-auto mb-2" />
            <p className="text-foreground font-medium mb-1">Content Locked</p>
            <p className="text-muted-foreground text-xs mb-3">Join the JBJ Broker Circle to access all training modules.</p>
            <Button size="sm" variant="secondary" className="bg-gold hover:bg-gold/90 text-black" asChild>
              <Link to="/join">
                <ArrowRight className="w-3 h-3 mr-2" />
                Apply to Join
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/30 rounded-lg p-4">
            <p className="text-muted-foreground text-xs text-center">
              This content is proprietary to JBJ Global Real Estate. Internal recognition only — not for external certification.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
