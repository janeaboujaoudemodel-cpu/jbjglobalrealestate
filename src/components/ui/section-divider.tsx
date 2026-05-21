import { cn } from "@/lib/utils";

type SectionDividerProps = {
  className?: string;
  fullWidth?: boolean;
  bg?: string;
  variant?: "default" | "champagne";
};

/**
 * Premium section divider — tight editorial spacing (24-32px),
 * 1px center-faded champagne hairline with a tiny gold dot ornament.
 * One token, used site-wide.
 */
export function SectionDivider({ className, fullWidth = false }: SectionDividerProps) {
  return (
    <div className={cn("py-4 md:py-6", className)} aria-hidden="true">
      <div className={cn(
        "mx-auto",
        fullWidth ? "max-w-[1600px] px-6 md:px-12 lg:px-16" : "max-w-5xl px-8"
      )}>
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(184,149,85,0.35) 50%, transparent 100%)"
          }}
        />
      </div>
    </div>
  );
}

