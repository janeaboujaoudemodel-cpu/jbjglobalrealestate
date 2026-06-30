import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Lock, CheckCircle, Clock, ArrowRight } from "lucide-react";
import type { EducationBook, BookProgress } from "@/hooks/useBrokerEducation";

interface BookCardProps {
  book: EducationBook;
  progress?: BookProgress;
  onOpen: (book: EducationBook) => void;
  index: number;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const LEARNING_PATH_COLORS: Record<string, string> = {
  'Foundations': 'bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40',
  'Buyer & Investor Advisory': 'bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40',
  'Seller & Landlord Advisory': 'bg-amber-500/20 text-amber-700 border-amber-500/30',
  'Market Intelligence': 'bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40',
  'Advanced (Restricted)': 'bg-red-500/20 text-red-700 border-red-500/30',
};

export function BookCard({ book, progress, onOpen, index }: BookCardProps) {
  const pathColor = LEARNING_PATH_COLORS[book.learning_path] || 'bg-[#1A1A1A]/10 text-[#1A1A1A] border-[#1A1A1A]/20';
  
  const getStatusBadge = () => {
    if (!progress) return null;
    
    switch (progress.status) {
      case 'completed':
        return (
          <Badge className="jj-surface-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" />
            In Progress ({progress.completedModules}/{progress.totalModules})
          </Badge>
        );
      default:
        return (
          <Badge className="bg-[#1A1A1A]/10 text-[#1A1A1A]/60 border-[#1A1A1A]/20">
            Not Started
          </Badge>
        );
    }
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="h-full jj-card-inner group">
        <CardContent className="p-6">
          {/* Book Cover Mock */}
          <div className="relative mb-4">
            <div 
              className="w-full aspect-[3/4] rounded-lg bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border-2 border-[#B89555]/40 flex items-center justify-center relative overflow-hidden"
              style={{
                boxShadow: '8px 8px 20px rgba(0,0,0,0.15), -2px -2px 10px rgba(200,167,102,0.2)',
                transform: 'perspective(500px) rotateY(-5deg)',
              }}
            >
              {/* Book spine effect */}
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-gold/40 to-transparent" />
              
              {/* Gold lock replaces all book numbering */}
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gradient-to-br from-[#fff2c4] via-[#d8b86a] to-[#8a6a25] border border-[#B89555]/70 flex items-center justify-center shadow-[0_3px_12px_rgba(0,0,0,.35)]">
                <Lock className="w-3.5 h-3.5" strokeWidth={2.5} style={{ color: "#3a2a08" }} />
              </div>
              
              {/* Icon */}
              <BookOpen className="w-12 h-12 text-[#1A1A1A]/70" />
              
              {/* Restricted overlay */}
              {book.is_restricted && (
                <div className="absolute inset-0 bg-[#1A1A1A]/60 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-red-400" />
                </div>
              )}
            </div>
          </div>

          {/* Learning Path Badge */}
          <Badge className={`${pathColor} mb-2 text-xs`}>
            {book.learning_path}
          </Badge>

          {/* Title */}
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2 line-clamp-2 group-hover:text-[#1A1A1A] transition-colors">
            {book.title}
          </h3>

          {/* Description */}
          <p className="text-[#1A1A1A]/60 text-sm mb-4 line-clamp-2">
            {book.description}
          </p>

          {/* Progress Badge */}
          <div className="mb-4">
            {getStatusBadge()}
          </div>

          {/* Open Button - uses approved Button variant */}
          <Button
            onClick={() => onOpen(book)}
            disabled={book.is_restricted}
            className={book.is_restricted ? "w-full jj-pill-emerald-metallic disabled:opacity-100" : "w-full jj-cta-outline"}
            data-surface={book.is_restricted ? "emerald" : undefined}
          >
            {book.is_restricted ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Restricted Access
              </>
            ) : (
              <>
                Open Book
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
