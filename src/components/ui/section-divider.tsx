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
    <div className={cn("py-5 md:py-7", className)} aria-hidden="true">
      <div className={cn(
        "mx-auto relative",
        fullWidth ? "max-w-[1600px] px-6 md:px-12 lg:px-16" : "max-w-5xl px-8"
      )}>
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(184,149,85,0) 8%, rgba(184,149,85,0.45) 50%, rgba(184,149,85,0) 92%, transparent 100%)"
          }}
        />
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block w-1 h-1 rounded-full"
          style={{ background: "#B89555", boxShadow: "0 0 0 3px rgba(184,149,85,0.08)" }}
        />
      </div>
    </div>
  );
}
