import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "jj-pill-emerald-metallic allow-white inline-flex min-h-[28px] items-center justify-center gap-1.5 whitespace-nowrap [word-break:keep-all] rounded-full border-0 px-3 py-1 text-xs font-bold leading-none text-white transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0",
  {
    variants: {
      variant: {
        default: "",
        secondary: "",
        destructive: "",
        outline: "",
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
    const surface = "emerald";
    return (
      <div
        ref={ref}
        data-surface={surface}
        data-jj-badge={variant ?? "default"}
        data-label-emerald-only
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
