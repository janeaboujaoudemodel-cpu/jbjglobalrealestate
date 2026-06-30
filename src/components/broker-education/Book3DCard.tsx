import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle, Clock, ArrowRight, Sparkles } from "lucide-react";
import type { EducationBook, BookProgress } from "@/hooks/useBrokerEducation";
import { PremiumBook3D } from "@/components/broker-education/PremiumBook3D";
import { PremiumLockBadge } from "@/components/broker-education/PremiumLock";

interface Book3DCardProps {
  book: EducationBook;
  progress?: BookProgress;
  onOpen: (book: EducationBook) => void;
  onRequestAccess?: (book: EducationBook) => void;
  requestAccessDisabled?: boolean;
  index: number;
  isLocked?: boolean;
}

/**
 * Premium book card — full 3D book with spine, front cover, back cover and
 * page edges. Hover rotates the book toward the reader and lifts it.
 */
export function Book3DCard({
  book,
  progress,
  onOpen,
  onRequestAccess,
  requestAccessDisabled = false,
  index,
  isLocked = false,
}: Book3DCardProps) {
  const effectivelyLocked = isLocked || book.is_restricted;
  const canPreviewLocked = isLocked && !book.is_restricted && !onRequestAccess;

  const statusBadge = (() => {
    if (!progress || effectivelyLocked) return null;
    if (progress.status === "completed") {
      return (
        <Badge className="jj-surface-emerald text-white border-0 shadow-sm">
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
        className={`flex h-full flex-col bg-transparent ${effectivelyLocked && !canPreviewLocked ? "cursor-default" : "cursor-pointer"}`}
        onClick={() => {
          if (!effectivelyLocked || canPreviewLocked) onOpen(book);
        }}
      >
        {/* 3D book */}
        <div className="relative px-1 pb-4">
          <PremiumBook3D
            title={book.title}
            bookNumber={book.book_number}
            paletteIndex={book.book_number}
          />
          {statusBadge && (
            <div className="absolute top-2 right-2 z-20">{statusBadge}</div>
          )}
          {/* Center lock removed — corner foil lock badge lives on the cover (PremiumBook3D) */}

        </div>

        {/* CTA below the book (title/subtitle live on the cover itself) */}
        <div className="flex flex-1 flex-col gap-2 px-1">


          <div className="pt-2 mt-auto">
            <Button
              size="sm"
              data-cta="book-open"
              data-surface={effectivelyLocked ? "emerald" : undefined}
              style={effectivelyLocked ? { color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" } : undefined}
              disabled={effectivelyLocked && !!onRequestAccess && requestAccessDisabled}
              className={effectivelyLocked ? "jj-pill-emerald-metallic w-full disabled:opacity-100" : "jj-cta-outline w-full"}
              onClick={(e) => {
                e.stopPropagation();
                if (effectivelyLocked) {
                  if (onRequestAccess) onRequestAccess(book);
                  else if (canPreviewLocked) onOpen(book);
                  return;
                }
                onOpen(book);
              }}
            >
              {effectivelyLocked ? (
                <>
                  <Lock className="w-3 h-3 mr-2 text-white" strokeWidth={2.7} style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                  <span className="text-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                    {onRequestAccess ? "Request Access" : book.is_restricted ? "Restricted" : "Preview Book"}
                  </span>
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
