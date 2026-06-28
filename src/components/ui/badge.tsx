import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-[26px] items-center gap-1.5 whitespace-nowrap [word-break:keep-all] rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "jj-badge-dark",
        secondary: "jj-badge-champagne",
        destructive: "jj-badge-dark",
        outline: "jj-badge-outline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    const surface = variant === "default" || variant === "destructive" ? "emerald" : "champagne";
    return (
      <div
        ref={ref}
        data-surface={surface}
        data-jj-badge={variant ?? "default"}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
