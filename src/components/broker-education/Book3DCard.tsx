import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle, Clock, ArrowRight, Sparkles, BookOpen } from "lucide-react";
import type { EducationBook, BookProgress } from "@/hooks/useBrokerEducation";

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
      className="group"
    >
      <div
        className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/40 overflow-hidden flex flex-col h-full shadow-[0_2px_8px_rgba(184,149,85,0.08)] hover:shadow-[0_14px_30px_rgba(184,149,85,0.22)] transition-shadow cursor-pointer"
        onClick={() => !book.is_restricted && onOpen(book)}
      >
        {/* ── Book cover — flush, straight, full-bleed ────────────── */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#1c1812]">
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={`${book.title} cover`}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-center px-4 bg-gradient-to-br from-[#1c1812] via-[#2a2118] to-[#15110b]">
              <div>
                <BookOpen className="w-8 h-8 text-[#B89555] mx-auto mb-2" />
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#EFE6D6]/80">
                  JBJ Library
                </div>
                <div className="text-[#EFE6D6] text-sm font-semibold mt-1 line-clamp-3">
                  {book.title}
                </div>
                <div className="mt-2 text-[10px] text-[#B89555]">
                  Book {book.book_number}
                </div>
              </div>
            </div>
          )}

          {/* Gold spine — left edge */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[10px] pointer-events-none"
            style={{
              background:
                "linear-gradient(to right,#7a5e2c 0%,#B89555 40%,#8c6a30 80%,rgba(0,0,0,0.25) 100%)",
              boxShadow: "inset 1px 0 0 rgba(0,0,0,0.4)",
            }}
          />

          {/* Hairline page edge — right */}
          <div
            className="absolute right-0 top-[2%] bottom-[2%] w-[3px] pointer-events-none"
            style={{
              background:
                "linear-gradient(to right,rgba(0,0,0,0.25) 0%,#f3ead8 50%,#d9c9a3 100%)",
            }}
          />

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

        {/* ── Content panel ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-3 p-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A] text-[10px] uppercase tracking-[0.15em] self-start">
            <Sparkles className="w-3 h-3" />
            {book.learning_path}
          </div>

          <h3 className="text-[#1A1A1A] text-base font-bold leading-tight line-clamp-2">
            {book.title}
          </h3>

          {book.description && (
            <p className="text-[#1A1A1A]/70 text-xs leading-relaxed line-clamp-3 flex-1">
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
