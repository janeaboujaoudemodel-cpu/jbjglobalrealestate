import { BarChart3, BookOpen, Building2, FileText, Flag, GraduationCap, HelpCircle, Home, KeyRound, ShieldCheck, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookData, BookIconKey } from "@/types/books";

const BRAND_NAME = "JBJ Global Real Estate";

function getIcon(icon?: BookIconKey) {
  switch (icon) {
    case "key":
      return KeyRound;
    case "flag":
      return Flag;
    case "chart":
      return BarChart3;
    case "graduation":
      return GraduationCap;
    case "tag":
      return Tag;
    case "building":
      return Building2;
    case "home":
      return Home;
    case "help":
      return HelpCircle;
    case "shield":
      return ShieldCheck;
    case "file":
      return FileText;
    case "book":
    default:
      return BookOpen;
  }
}

type BookCoverFaceSize = "thumb" | "modal" | "hero";

interface BookCoverFaceProps {
  book: BookData;
  size?: BookCoverFaceSize;
  className?: string;
  /** When true, no frame/rounding assumptions; parent controls border/overflow. */
  bare?: boolean;
}

export function BookCoverFace({ book, size = "thumb", className, bare = false }: BookCoverFaceProps) {
  const locked = !!book.coverLocked;
  const Icon = getIcon(book.icon);

  const pad = size === "hero" ? "p-5" : size === "modal" ? "p-3" : "p-3";
  const iconBox = size === "hero" ? "w-12 h-12" : "w-9 h-9";
  const iconSize = size === "hero" ? "w-6 h-6" : "w-4 h-4";
  const titleSize = size === "hero" ? "text-sm" : "text-[11px]";
  const brandSize = size === "hero" ? "text-[10px]" : "text-[9px]";

  return (
    <div className={cn("relative w-full h-full", className)}>
      <img
        src={book.cover}
        alt={book.title}
        className={cn(
          "w-full h-full object-cover",
          bare ? "" : "block",
          // keep textless textures crisp
          "[image-rendering:auto]"
        )}
        loading="lazy"
        decoding="async"
      />

      {/* Keep locked covers exactly as-is */}
      {!locked && (
        <>
          {/* Contrast veil */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/55" />

          {/* Print-like overlay */}
          <div className={cn("absolute inset-0 flex flex-col items-center justify-between text-center", pad)}>
            <div
              className={cn(
                "rounded-xl border border-gold/35 bg-black/35 backdrop-blur-[1px] flex items-center justify-center",
                iconBox,
                size === "hero" ? "mt-1" : "mt-0.5"
              )}
              style={{
                boxShadow:
                  "0 10px 24px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.12)",
              }}
            >
              <Icon className={cn(iconSize, "text-gold")} />
            </div>

            <div className="w-full">
              <p
                className={cn(
                  titleSize,
                  "text-white font-semibold leading-[1.1] tracking-[0.02em]",
                  size === "hero" ? "max-w-[20rem] mx-auto" : ""
                )}
                style={{ textShadow: "0 2px 10px rgba(0,0,0,0.55)" }}
              >
                {book.title}
              </p>
              <div className="mt-2 h-px w-12 mx-auto bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
              <p
                className={cn(
                  brandSize,
                  "mt-2 text-gold uppercase tracking-[0.22em] font-semibold"
                )}
                style={{ textShadow: "0 2px 10px rgba(0,0,0,0.55)" }}
              >
                {BRAND_NAME}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
