import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * ============================================================
 * GLOBAL BUTTON SYSTEM - JBJ GLOBAL REAL ESTATE (LOCKED & FINAL)
 * ============================================================
 * 
 * MANDATORY: All buttons must use ONLY these variants.
 * NO custom classes (bg-gold, shadow, scale, glow) allowed.
 * 
 * INVERTED HOVER RULE (LOCKED):
 * - All buttons INVERT their colors on hover
 * 
 * VARIANT: primary (White Base)
 *   Default: White bg, Gold text, Gold border
 *   Hover (INVERTED): Transparent bg, Gold text, Gold border
 * 
 * VARIANT: secondary (Transparent Base)
 *   Default: Transparent bg, Gold text, Gold border
 *   Hover (INVERTED): White bg, Gold text, Gold border
 * 
 * VARIANT: media (For Images/Videos)
 *   Default: Transparent bg, White text, White border
 *   Hover (INVERTED): White bg, Gold text
 * 
 * FORBIDDEN:
 * - Filled gold backgrounds
 * - Dark gold hover states
 * - Shadows or glow effects
 * - Scaling or animation tricks
 * - bg-gold, hover:bg-gold, shadow-*, scale-*, glow-*
 * 
 * APPLIES TO:
 * - Front-end, Back-end, CRM, Employee Hub, Database UI
 * ============================================================
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer tracking-[0.02em]",
  {
    variants: {
      variant: {
        // ============================================================
        // GLOBAL BUTTON SYSTEM - INVERTED HOVER (LOCKED & FINAL)
        // ============================================================
        
        // PRIMARY: WHITE BASE (Main actions)
        // Default: White bg, Gold text, Gold border
        // Hover (INVERTED): Transparent bg, Gold text, Gold border
        primary: "bg-white text-gold border border-gold hover:bg-transparent hover:text-gold",
        
        // SECONDARY: TRANSPARENT BASE (Secondary actions)
        // Default: Transparent bg, Gold text, Gold border
        // Hover (INVERTED): White bg, Gold text, Gold border
        secondary: "bg-transparent text-gold border border-gold hover:bg-white hover:text-gold",
        
        // MEDIA: FOR IMAGES/VIDEOS (Hero overlays)
        // Default: Transparent bg, White text, White border
        // Hover (INVERTED): White bg, Gold text
        media: "bg-transparent text-white border border-white hover:bg-white hover:text-gold",
        
        // ============================================================
        // LEGACY VARIANTS (Map to new system for backwards compatibility)
        // These will be deprecated - migrate to primary/secondary/media
        // ============================================================
        gold: "bg-white text-gold border border-gold hover:bg-transparent hover:text-gold",
        goldOutline: "bg-transparent text-gold border border-gold hover:bg-white hover:text-gold",
        heroOutline: "bg-transparent text-white border border-white hover:bg-white hover:text-gold",
        
        // ============================================================
        // UTILITY VARIANTS (Internal/System use only)
        // ============================================================
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
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
