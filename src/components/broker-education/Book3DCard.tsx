import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle, Clock, ArrowRight, Sparkles } from "lucide-react";
import type { EducationBook, BookProgress } from "@/hooks/useBrokerEducation";
import { PremiumBook3D } from "@/components/broker-education/PremiumBook3D";

interface Book3DCardProps {
  book: EducationBook;
  progress?: BookProgress;
  onOpen: (book: EducationBook) => void;
  index: number;
  isLocked?: boolean;
}

/**
 * Premium book card — full 3D book with spine, front cover, back cover and
 * page edges. Hover rotates the book toward the reader and lifts it.
 */
export function Book3DCard({ book, progress, onOpen, index, isLocked = false }: Book3DCardProps) {
  const effectivelyLocked = isLocked || book.is_restricted;

  const statusBadge = (() => {
    if (!progress) return null;
    if (progress.status === "completed") {
      return (
        <Badge className="bg-emerald-600 text-white border-0 shadow-sm">
          <CheckCircle className="w-3 h-3 mr-1" /> Completed
        </Badge>
      );
    }
    if (progress.status === "in_progress") {
      return (
        <Badge className="bg-amber-500 text-white border-0 shadow-sm">
          <Clock className="w-3 h-3 mr-1" /> {progress.completedModules}/{progress.totalModules}
        </Badge>
      );
    }
    return null;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.35 }}
      className="group h-full"
    >
      <div
        className="flex h-full cursor-pointer flex-col bg-transparent"
        onClick={() => !book.is_restricted && onOpen(book)}
      >
        {/* 3D book */}
        <div className="relative px-1 pb-4">
          <PremiumBook3D
            title={book.title}
            subtitle={book.learning_path}
            bookNumber={book.book_number}
            paletteIndex={book.book_number}
          />
          {statusBadge && (
            <div className="absolute top-2 right-2 z-20">{statusBadge}</div>
          )}
          {effectivelyLocked && (
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <PremiumLockBadge size="md" title="Restricted" />
            </div>
          )}
        </div>

        {/* Title + CTA below the book */}
        <div className="flex min-h-[110px] flex-1 flex-col gap-2 px-1">
          <h3 className="text-[#1A1A1A] font-semibold text-sm leading-snug line-clamp-2">
            {book.title}
          </h3>
          <div className="inline-flex max-w-full items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 text-[#1A1A1A] text-[10px] uppercase tracking-[0.14em] self-start">
            <Sparkles className="w-2.5 h-2.5" />
            <span className="truncate">{book.learning_path}</span>
          </div>

          <div className="pt-2 mt-auto">
            <Button
              size="sm"
              data-cta="book-open"
              className="jj-cta-outline w-full"
              onClick={(e) => {
                e.stopPropagation();
                if (!book.is_restricted) onOpen(book);
              }}
            >
              {effectivelyLocked ? (
                <>
                  <Lock className="w-3 h-3 mr-2" />
                  {book.is_restricted ? "Restricted" : "Preview Book"}
                </>
              ) : (
                <>
                  {progress?.status === "completed"
                    ? "Review Book"
                    : progress?.status === "in_progress"
                    ? "Continue Reading"
                    : "Open Book"}
                  <ArrowRight className="w-3 h-3 ml-2 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
