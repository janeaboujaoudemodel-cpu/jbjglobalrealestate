import * as React from "react";

import { cn } from "@/lib/utils";

/* ============================================================
 * GLOBAL CARD SYSTEM - JBJ GLOBAL REAL ESTATE (LOCKED)
 * Architectural · Calm · Premium · Trustworthy
 * No shadows, no gradients, no animated hover effects
 * ============================================================ */

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "rounded-lg border-2 border-gold bg-card text-card-foreground transition-all duration-300 hover:border-gold hover:shadow-[0_8px_30px_rgba(200,167,102,0.25),0_4px_15px_rgba(0,0,0,0.1)]", 
      className
    )} 
    {...props} 
  />
));
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
        className
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
      className={cn(
        "flex items-center p-6 pt-4 border-t border-border/20", 
        className
      )} 
      {...props} 
    />
  ),
);
CardFooter.displayName = "CardFooter";

/* --- Card Meta Component (for secondary info) --- */
const CardMeta = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardMeta.displayName = "CardMeta";

/* --- Card Detail Component (for key details like price/status) --- */
const CardDetail = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-base font-medium text-gold", className)} {...props} />
  ),
);
CardDetail.displayName = "CardDetail";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardMeta, CardDetail };
