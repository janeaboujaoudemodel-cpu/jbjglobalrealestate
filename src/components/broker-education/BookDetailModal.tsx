import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Clock, Target, Play, CheckCircle } from "lucide-react";
import type { EducationBook, EducationModule } from "@/hooks/useBrokerEducation";
import { useBookModules } from "@/hooks/useBrokerEducation";

interface BookDetailModalProps {
  book: EducationBook | null;
  isOpen: boolean;
  onClose: () => void;
}

const LEARNING_PATH_COLORS: Record<string, string> = {
  'Foundations': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  'Buyer & Investor Advisory': 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
  'Seller & Landlord Advisory': 'bg-amber-500/20 text-amber-700 border-amber-500/30',
  'Market Intelligence': 'bg-purple-500/20 text-purple-700 border-purple-500/30',
  'Advanced (Restricted)': 'bg-red-500/20 text-red-700 border-red-500/30',
};

export function BookDetailModal({ book, isOpen, onClose }: BookDetailModalProps) {
  const { modules, loading } = useBookModules(book?.id || null);
  
  if (!book) return null;

  const pathColor = LEARNING_PATH_COLORS[book.learning_path] || 'bg-black/10 text-black border-black/20';
  const totalMinutes = modules.reduce((sum, m) => sum + m.estimated_minutes, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {/* Book Cover */}
            <div 
              className="w-24 h-32 rounded-lg bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 flex items-center justify-center flex-shrink-0"
              style={{
                boxShadow: '4px 4px 10px rgba(0,0,0,0.15)',
              }}
            >
              <BookOpen className="w-8 h-8 text-gold/60" />
            </div>
            
            <div className="flex-1">
              <Badge className={`${pathColor} mb-2 text-xs`}>
                Book {book.book_number} • {book.learning_path}
              </Badge>
              <DialogTitle className="text-2xl text-black mb-2">
                {book.title}
              </DialogTitle>
              <p className="text-black/60 text-sm">
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
            <p className="text-black/70 text-sm">{book.learning_objective}</p>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4 text-sm text-black/60">
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
          <h4 className="text-black font-semibold mb-4">Modules</h4>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full" />
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {modules.map((module, index) => (
                <AccordionItem 
                  key={module.id} 
                  value={module.id}
                  className="border-2 border-gold/30 rounded-lg bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gold/10">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-gold text-sm font-medium">{module.module_number}</span>
                      </div>
                      <div>
                        <div className="text-black font-medium">{module.title}</div>
                        <div className="text-black/50 text-xs flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {module.estimated_minutes} min
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <p className="text-black/60 text-sm mb-4 pl-11">
                      {module.description}
                    </p>
                    <div className="pl-11">
                      <Button 
                        size="sm"
                        variant="secondary"
                      >
                        <Play className="w-3 h-3 mr-2" />
                        Start Module
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Internal Notice */}
        <div className="mt-6 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/30 rounded-lg p-4">
          <p className="text-black/50 text-xs text-center">
            This content is proprietary to JBJ Global Real Estate. Internal recognition only — not for external certification.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
