import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle, Clock, ArrowRight, Sparkles, BookOpen } from "lucide-react";
import type { EducationBook, BookProgress } from "@/hooks/useBrokerEducation";
import { PremiumBookCover } from "@/components/books/PremiumBookCover";

interface Book3DCardProps {
  book: EducationBook;
  progress?: BookProgress;
  onOpen: (book: EducationBook) => void;
  index: number;
  isLocked?: boolean;
}

/**
 * Premium book card — the cover IS the top of the card.
 * Straight (no rotateY tilt), full-bleed cover, subtle gold spine on the left
 * and a hairline page edge on the right to keep the 3D feel.
 */
export function Book3DCard({ book, progress, onOpen, index, isLocked = false }: Book3DCardProps) {
  const effectivelyLocked = isLocked || book.is_restricted;
  const coverTone = book.learning_path?.includes("Buyer") ? "emerald"
    : book.learning_path?.includes("Seller") ? "espresso"
    : book.learning_path?.includes("Market") ? "black"
    : book.learning_path?.includes("Advanced") ? "burgundy"
    : "navy";

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
      whileHover={{ y: -4 }}
      className="group h-full"
    >
      <div
        className="flex h-full cursor-pointer flex-col overflow-visible rounded-2xl bg-transparent"
        onClick={() => !book.is_restricted && onOpen(book)}
      >
        <div className="relative aspect-[4/5] w-full overflow-visible px-2 pt-1">
          <div className="absolute -bottom-3 left-[10%] right-[6%] h-8 rounded-full bg-[#1A1A1A]/25 blur-xl" />
          <div className="relative h-full overflow-hidden rounded-r-xl rounded-l-[4px] shadow-[18px_22px_45px_rgba(26,26,26,.28),inset_0_0_0_1px_rgba(184,149,85,.35)] transition-transform duration-500 group-hover:-translate-y-1">
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={`${book.title} cover`}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.015]"
            />
          ) : (
            <PremiumBookCover title={book.title} number={book.book_number} subtitle={book.learning_path} tone={coverTone} />
          )}
          <div className="absolute inset-y-0 left-0 w-[8%] pointer-events-none bg-gradient-to-r from-[#050505]/90 via-[#1A1A1A]/70 to-transparent" />
          <div className="absolute inset-y-[3%] right-0 w-[4px] pointer-events-none bg-gradient-to-r from-transparent via-[#EFE6D6]/50 to-[#B89555]/70" />
          <div className="absolute inset-x-0 bottom-0 h-14 pointer-events-none bg-gradient-to-t from-[#050505]/30 to-transparent" />

          {/* Status badge */}
          {statusBadge && <div className="absolute top-3 right-3 z-20">{statusBadge}</div>}

          {/* Locked overlay */}
          {effectivelyLocked && (
            <div className="absolute inset-0 bg-[#1A1A1A]/70 grid place-items-center backdrop-blur-[1px]">
              <div className="text-center">
                <Lock className="w-7 h-7 text-white mx-auto" />
                {isLocked && !book.is_restricted && (
                  <div className="mt-1.5 text-white/85 text-[9px] uppercase tracking-widest">
                    Join to Unlock
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* ── Content panel ───────────────────────────────────────── */}
        <div className="flex min-h-[218px] flex-1 flex-col gap-3 px-2 pt-5">
          <div className="inline-flex max-w-full items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A] text-[10px] uppercase tracking-[0.15em] self-start">
            <Sparkles className="w-3 h-3" />
            <span className="truncate">{book.learning_path}</span>
          </div>

          <h3 className="text-[#1A1A1A] text-base font-bold leading-tight line-clamp-2 min-h-[40px]">
            {book.title}
          </h3>

          {book.description && (
            <p className="text-[#1A1A1A]/70 text-xs leading-relaxed line-clamp-3 min-h-[54px]">
              {book.description}
            </p>
          )}

          <div className="pt-3 mt-auto border-t border-[#B89555]/20">
            {effectivelyLocked ? (
              <div className="space-y-2">
                <p className="text-[#1A1A1A]/65 text-[11px] leading-snug">
                  {book.is_restricted
                    ? "Available after completing all foundational books and manager approval."
                    : "Join the JBJ Broker Circle to unlock this book."}
                </p>
                <Button
                  size="sm"
                  className="w-full bg-[#EFE6D6] hover:bg-[#E5D8BD] text-[#1A1A1A] border border-[#B89555]/50 font-semibold"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!book.is_restricted) onOpen(book);
                  }}
                >
                  <Lock className="w-3 h-3 mr-2" />
                  {book.is_restricted ? "Restricted" : "Preview Book"}
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="w-full bg-[#EFE6D6] hover:bg-[#E5D8BD] text-[#1A1A1A] border border-[#B89555]/50 font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(book);
                }}
              >
                {progress?.status === "completed"
                  ? "Review Book"
                  : progress?.status === "in_progress"
                  ? "Continue Reading"
                  : "Open Book"}
                <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
