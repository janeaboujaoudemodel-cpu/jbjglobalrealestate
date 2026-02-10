import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Lock, CheckCircle, Clock, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { EducationBook, BookProgress } from "@/hooks/useBrokerEducation";

interface Book3DCardProps {
  book: EducationBook;
  progress?: BookProgress;
  onOpen: (book: EducationBook) => void;
  index: number;
}

const LEARNING_PATH_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  'Foundations': { 
    bg: 'from-blue-900 via-blue-800 to-blue-950', 
    text: 'text-blue-200', 
    border: 'border-blue-400/40',
    glow: 'rgba(59, 130, 246, 0.3)'
  },
  'Buyer & Investor Advisory': { 
    bg: 'from-emerald-900 via-emerald-800 to-emerald-950', 
    text: 'text-emerald-200', 
    border: 'border-emerald-400/40',
    glow: 'rgba(16, 185, 129, 0.3)'
  },
  'Seller & Landlord Advisory': { 
    bg: 'from-amber-900 via-amber-800 to-amber-950', 
    text: 'text-amber-200', 
    border: 'border-amber-400/40',
    glow: 'rgba(245, 158, 11, 0.3)'
  },
  'Market Intelligence': { 
    bg: 'from-purple-900 via-purple-800 to-purple-950', 
    text: 'text-purple-200', 
    border: 'border-purple-400/40',
    glow: 'rgba(168, 85, 247, 0.3)'
  },
  'Advanced (Restricted)': { 
    bg: 'from-red-900 via-red-800 to-red-950', 
    text: 'text-red-200', 
    border: 'border-red-400/40',
    glow: 'rgba(239, 68, 68, 0.3)'
  },
};

const DEFAULT_PATH_COLOR = { 
  bg: 'from-zinc-900 via-zinc-800 to-zinc-950', 
  text: 'text-zinc-200', 
  border: 'border-zinc-400/40',
  glow: 'rgba(161, 161, 170, 0.3)'
};

export function Book3DCard({ book, progress, onOpen, index }: Book3DCardProps) {
  const pathStyle = LEARNING_PATH_COLORS[book.learning_path] || DEFAULT_PATH_COLOR;
  
  const getStatusBadge = () => {
    if (!progress) return null;
    
    switch (progress.status) {
      case 'completed':
        return (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-emerald-500/90 text-white border-0 shadow-lg">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          </div>
        );
      case 'in_progress':
        return (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-amber-500/90 text-white border-0 shadow-lg">
              <Clock className="w-3 h-3 mr-1" />
              {progress.completedModules}/{progress.totalModules}
            </Badge>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <div
        className="relative cursor-pointer"
        onClick={() => !book.is_restricted && onOpen(book)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const rotateY = (x / rect.width - 0.5) * 20;
          const translateZ = 15;
          const scale = 1.03;

          e.currentTarget
            .querySelector<HTMLDivElement>(".book-inner")
            ?.style.setProperty(
              "transform",
              `rotateY(${rotateY}deg) rotateX(3deg) translateZ(${translateZ}px) scale(${scale})`
            );
        }}
        onMouseLeave={(e) => {
          e.currentTarget
            .querySelector<HTMLDivElement>(".book-inner")
            ?.style.setProperty("transform", "rotateY(-8deg) rotateX(4deg)");
        }}
      >
        <div
          className="book-inner relative transform-gpu transition-transform duration-500 ease-out"
          style={{ transformStyle: "preserve-3d", transform: "rotateY(-8deg) rotateX(4deg)" }}
        >
          {/* Book Cover */}
           <div
            className={`relative bg-gradient-to-br ${pathStyle.bg} rounded-lg overflow-hidden shadow-2xl ${pathStyle.border} border min-h-[400px] max-h-[400px] h-[400px] flex flex-col`}
            style={{
              boxShadow: `16px 16px 50px rgba(0,0,0,0.7), -4px -4px 15px ${pathStyle.glow}`,
            }}
          >
            {/* Status Badge */}
            {getStatusBadge()}

            {/* Book Spine Effect - 3D */}
            <div
              className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-800 border-r border-gold/30"
              style={{
                transformStyle: "preserve-3d",
                transform: "rotateY(-90deg) translateX(-12px)",
                transformOrigin: "left center",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-gold text-[8px] font-bold tracking-[0.12em] uppercase whitespace-nowrap"
                  style={{ transform: "rotate(-90deg)", textShadow: "0 0 8px rgba(200,167,102,0.5)" }}
                >
                  Book {book.book_number}
                </span>
              </div>
            </div>

            {/* Visible Spine on Cover */}
            <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-gold/30 via-gold/15 to-transparent" />

            {/* Top Section with Icon */}
            <div className="relative h-28 flex items-center justify-center bg-black/20 flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                <span className="text-gold text-xl font-bold">{book.book_number}</span>
              </div>
              
              {/* Restricted Overlay */}
              {book.is_restricted && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                  <Lock className="w-10 h-10 text-red-400" />
                </div>
              )}
            </div>

            {/* Cover Content */}
            <div className="p-5 relative flex-1 flex flex-col">
              {/* Learning Path Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10px] uppercase tracking-[0.15em] mb-3 self-start">
                <Sparkles className="w-3 h-3" />
                {book.learning_path}
              </div>

              {/* Title */}
              <h3
                className="text-white text-base font-bold leading-tight mb-2 line-clamp-2"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {book.title}
              </h3>

              {/* Description */}
              <p className="text-zinc-400 text-xs line-clamp-2 flex-1">
                {book.description}
              </p>

              {/* Footer */}
              <div className="pt-3 border-t border-zinc-700 mt-auto">
                {book.is_restricted ? (
                  <div className="space-y-2">
                    <p className="text-red-300/80 text-[10px] leading-tight">
                      Available after completing all foundational books and manager approval.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-200 border border-red-500/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success("Access request submitted. Your manager will review it.");
                      }}
                    >
                      <Lock className="w-3 h-3 mr-2" />
                      Request Access
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full bg-gold/20 hover:bg-gold hover:text-black text-gold border border-gold/40 font-semibold transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(book);
                    }}
                  >
                    {progress?.status === 'completed' ? 'Review Book' : progress?.status === 'in_progress' ? 'Continue Reading' : 'Open Book'}
                    <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </div>
            </div>

            {/* Book Pages Effect */}
            <div className="absolute right-0 top-0 bottom-0 w-2.5">
              <div
                className="h-full bg-gradient-to-l from-zinc-100/10 via-zinc-200/12 to-transparent"
                style={{ clipPath: "polygon(100% 0, 100% 100%, 0 96%, 0 4%)" }}
              />
              <div className="absolute right-0 top-[4%] bottom-[4%] w-[2px] bg-zinc-300/15" />
              <div className="absolute right-[2px] top-[5%] bottom-[5%] w-[1px] bg-zinc-300/10" />
            </div>
          </div>

          {/* Shadow */}
          <div className="absolute -bottom-3 left-3 right-3 h-6 bg-black/50 blur-xl rounded-full transition-all duration-500 group-hover:blur-2xl group-hover:h-8" />
        </div>
      </div>
    </motion.div>
  );
}
