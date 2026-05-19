/**
 * CRMToolbar — responsive action-row primitive for CRM pages.
 *
 * Behavior:
 *  - Wraps freely (flex-wrap) so buttons never overflow horizontally.
 *  - Each child gets min-w-0 so long labels truncate instead of pushing.
 *  - At <1024px width, opt-in `compact` mode renders icon-only buttons via the
 *    `data-toolbar-compact` attribute (consumers can target this with CSS or
 *    by hiding label spans with `.hidden lg:inline`).
 *  - Includes a container-query-friendly wrapper so the toolbar adapts even
 *    when the AI side rail is open and the available width is smaller than
 *    the viewport.
 */
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
  /** Force a breakpoint at which to switch to icon-only labels (px). Default 1024. */
  compactAt?: number;
}

export function CRMToolbar({ children, className, compactAt = 1024 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setCompact(w > 0 && w < compactAt);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [compactAt]);

  return (
    <div
      ref={ref}
      data-toolbar-compact={compact ? "true" : "false"}
      className={cn(
        "w-full min-w-0 flex flex-wrap items-center gap-2",
        "[&_button]:min-w-0 [&_button]:max-w-full",
        // Hide .toolbar-label spans when compact
        compact && "[&_.toolbar-label]:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default CRMToolbar;
