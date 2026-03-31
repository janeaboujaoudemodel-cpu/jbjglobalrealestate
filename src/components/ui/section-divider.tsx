import { cn } from "@/lib/utils";

type SectionDividerProps = {
  className?: string;
  fullWidth?: boolean;
  bg?: string;
  variant?: "default" | "champagne";
};

/**
 * Ultra-subtle section divider — single 1px line.
 */
export function SectionDivider({ className, fullWidth = false }: SectionDividerProps) {
  return (
    <div className={cn("py-1", className)}>
      <div className={cn(
        "h-px bg-gray-200/60 mx-auto",
        fullWidth ? "max-w-[1600px] px-6 md:px-12 lg:px-16" : "max-w-7xl px-4"
      )}>
        <div className="h-px bg-gray-200/60 w-full" />
      </div>
    </div>
  );
}
