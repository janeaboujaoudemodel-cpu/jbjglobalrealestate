import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ActionStrip — top-of-page action row primitive.
 * Children should be <Button variant="primary"> (emerald/white) or
 * <Button variant="secondary"> (champagne/charcoal). Equal heights,
 * consistent gap, wraps on small screens.
 */
export interface ActionStripProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end" | "between";
}

export const ActionStrip = React.forwardRef<HTMLDivElement, ActionStripProps>(
  ({ align = "end", className, children, ...rest }, ref) => {
    const justify =
      align === "start" ? "justify-start" : align === "between" ? "justify-between" : "justify-end";
    return (
      <div
        ref={ref}
        data-jj-action-strip=""
        className={cn(
          "flex flex-wrap items-center gap-2",
          justify,
          "[&_button]:h-10 [&_button]:rounded-xl [&_button]:px-4 [&_button]:text-sm [&_button]:font-semibold",
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
ActionStrip.displayName = "ActionStrip";

export default ActionStrip;
