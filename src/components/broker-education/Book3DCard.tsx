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
 * Premium book card — clean champagne frame holding a 3D book cover.
 *
 * Layout:
 *   [ champagne frame, gold hairline ]
 *     ├── 3D Book cover (perspective tilt, soft right-edge "pages",
 *     │   gold spine on the LEFT — visually contained, never pokes out)
 *     └── Content panel (badge, title, description, CTA) — edge-to-edge
 *
 * No protruding white strips. No rotateY tricks that escape the bounds.
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
        className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/40 overflow-hidden flex flex-col h-full shadow-[0_2px_8px_rgba(184,149,85,0.08)] hover:shadow-[0_12px_28px_rgba(184,149,85,0.18)] transition-shadow cursor-pointer"
       
        onClick={() => !book.is_restricted && onOpen(book)}
      >
        {/* ── 3D Book Cover Stage ──────────────────────────────────── */}
        <div
          className="relative px-6 pt-7 pb-5 grid place-items-center bg-[#EFE6D6]"
          style={{ perspective: "1200px" }}
        >
          {/* Status badge (sits in the stage, top-right) */}
          {statusBadge && <div className="absolute top-3 right-3 z-20">{statusBadge}</div>}

          <div
            className="relative transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            style={{
              transformStyle: "preserve-3d",
              transform: "rotateY(-14deg) rotateX(2deg)",
            }}
          >
            {/* Book body */}
            <div
              className="relative w-[150px] h-[210px] rounded-r-md rounded-l-sm overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg,#1c1812 0%,#2a2118 55%,#15110b 100%)",
                boxShadow:
                  "0 18px 36px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(184,149,85,0.35)",
              }}
            >
              {book.cover_image_url ? (
                <img
                  src={book.cover_image_url}
                  alt={`${book.title} cover`}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-center px-3">
                  <div>
                    <BookOpen className="w-7 h-7 text-[#B89555] mx-auto mb-2" />
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

            {/* Gold spine — sits flush to the LEFT edge of the book body */}
            <div
              className="absolute top-0 bottom-0 -left-[6px] w-[6px] rounded-l-sm"
              style={{
                background:
                  "linear-gradient(to right,#7a5e2c 0%,#B89555 45%,#8c6a30 100%)",
                boxShadow: "inset 1px 0 0 rgba(0,0,0,0.4)",
                transform: "translateZ(-2px)",
              }}
            />

            {/* Right-edge pages — thin, contained inside the book footprint */}
            <div
              className="absolute top-[3%] bottom-[3%] right-[-3px] w-[3px] rounded-r-sm"
              style={{
                background:
                  "linear-gradient(to right,rgba(255,255,255,0.0) 0%,#f3ead8 50%,#d9c9a3 100%)",
              }}
            />

            {/* Ground shadow */}
            <div className="absolute -bottom-3 left-2 right-2 h-3 bg-black/35 blur-md rounded-full" />
          </div>
        </div>

        {/* ── Content frame ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-3 p-5 border-t border-[#B89555]/25">
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
