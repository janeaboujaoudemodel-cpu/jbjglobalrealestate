import { cn } from "@/lib/utils";

type SectionDividerProps = {
  className?: string;
  fullWidth?: boolean;
  bg?: string;
  variant?: "default" | "champagne";
};

/**
 * Premium section divider — generous spacing with an ultra-fine
 * center-faded gradient line. Creates editorial breathing room
 * between content blocks.
 */
export function SectionDivider({ className, fullWidth = false }: SectionDividerProps) {
  return (
    <div className={cn("py-10 md:py-14", className)} aria-hidden="true">
      <div className={cn(
        "mx-auto",
        fullWidth ? "max-w-[1600px] px-6 md:px-12 lg:px-16" : "max-w-5xl px-8"
      )}>
        <div
          className="h-px w-full"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.08) 70%, transparent 100%)"
          }}
        />
      </div>
    </div>
  );
}
