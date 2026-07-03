import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* ============================================================
 * GLOBAL CARD SYSTEM - JBJ GLOBAL REAL ESTATE
 * Monochrome Design System
 *
 * The `surface` variant scopes theme tokens locally so descendants
 * using semantic classes (text-foreground, text-muted-foreground,
 * bg-card, border-border, etc.) automatically resolve to legible
 * colors. Never hardcode `text-[#1A1A1A]`/`text-[#1A1A1A]` on `bg-[#1A1A1A]` —
 * use <Card surface="dark"> or <Card surface="light"> instead.
 * ============================================================ */

const cardVariants = cva(
  "min-w-0 max-w-full overflow-hidden rounded-2xl border border-[#B89555]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A] shadow-sm transition-all duration-300",
  {
    variants: {
      surface: {
        default: "jj-card hover:border-[#B89555]/60 hover:shadow-[0_12px_34px_-22px_rgba(26,26,26,0.28)]",
        light: "jj-card surface-light hover:border-[#B89555]/60 hover:shadow-[0_12px_34px_-22px_rgba(26,26,26,0.28)]",
        dark: "surface-dark bg-card text-card-foreground",
        emerald: "jj-card-emerald text-white border-transparent",
      },
    },
    defaultVariants: {
      surface: "default",
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, surface, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ surface }), className)}
      data-jbj-card=""
      data-surface={surface === "dark" || surface === "emerald" ? surface : "champagne"}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-lg md:text-xl font-medium leading-tight tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground leading-relaxed", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-4 border-t border-border/20", className)}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

const CardMeta = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardMeta.displayName = "CardMeta";

const CardDetail = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-base font-medium text-foreground", className)} {...props} />
  ),
);
CardDetail.displayName = "CardDetail";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardMeta,
  CardDetail,
  cardVariants,
};
