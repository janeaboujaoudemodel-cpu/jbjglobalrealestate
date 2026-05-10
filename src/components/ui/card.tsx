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
  "rounded-lg border border-border bg-card text-card-foreground transition-all duration-300",
  {
    variants: {
      surface: {
        default: "",
        light: "surface-light bg-card text-card-foreground",
        dark: "surface-dark bg-card text-card-foreground",
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
