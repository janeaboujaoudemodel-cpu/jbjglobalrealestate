import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * ============================================================
 * GLOBAL BUTTON SYSTEM - JBJ GLOBAL REAL ESTATE (LOCKED & FINAL)
 * ============================================================
 * 
 * BRANDED BUTTONS (USE FOR MAIN CTAs):
 * - primary: White bg → transparent on hover (main actions)
 * - secondary: Transparent bg → white on hover (secondary actions)  
 * - media: For image/video backgrounds (white text → gold on hover)
 * 
 * UTILITY VARIANTS (CRM/Internal use with className overrides):
 * - ghost: Transparent, subtle hover
 * - outline: Bordered, subtle
 * - destructive: Red for dangerous actions
 * - default: Standard primary button
 * - link: Text-only link style
 * 
 * FORBIDDEN:
 * - gold, goldOutline, heroOutline (DELETED - use primary/secondary/media)
 * - Custom className styling (bg-gold, shadow-*, scale-*, etc.)
 * - Shadows or glow effects on branded buttons
 * ============================================================
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer tracking-[0.02em]",
  {
    variants: {
      variant: {
        // ============================================================
        // BRANDED BUTTONS - JBJ GOLD SYSTEM (PRIMARY USE)
        // ============================================================
        
        // PRIMARY: WHITE BASE (Main CTAs)
        primary: "bg-white text-gold border-2 border-gold hover:bg-transparent hover:text-gold",
        
        // SECONDARY: TRANSPARENT BASE (Secondary CTAs)  
        secondary: "bg-transparent text-gold border-2 border-gold hover:bg-white hover:text-gold",
        
        // MEDIA: FOR IMAGES/VIDEOS (Hero overlays with white text)
        media: "bg-transparent text-white border-2 border-white hover:bg-white hover:text-gold hover:border-gold",

        // ============================================================
        // UTILITY VARIANTS - Minimal styling for internal/CRM use
        // These allow className overrides for specific UI contexts
        // ============================================================
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-md px-4",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
