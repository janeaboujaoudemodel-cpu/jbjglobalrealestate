import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * ============================================================
 * GLOBAL BUTTON SYSTEM - JBJ GLOBAL REAL ESTATE (LOCKED)
 * ============================================================
 * 
 * CORE RULE: All buttons must INVERT on hover
 * 
 * Button Type A (gold) - White Base
 *   Default: White bg, Gold text, Gold border
 *   Hover: Transparent bg, Gold text, Gold border
 * 
 * Button Type B (goldOutline) - Transparent Base  
 *   Default: Transparent bg, Gold text, Gold border
 *   Hover: White bg, Gold text, Gold border
 * 
 * Button Hero (heroOutline) - For images/videos
 *   Default: Transparent bg, White text, White border
 *   Hover: White bg, Gold text, White border
 * 
 * FORBIDDEN:
 * - Filled gold backgrounds
 * - Dark gold hover states
 * - Shadows or glow effects
 * - Scaling or animation tricks
 * ============================================================
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        
        // ============================================================
        // GLOBAL BUTTON SYSTEM - INVERTED HOVER (LOCKED)
        // ============================================================
        
        // TYPE A: WHITE BASE (Primary actions)
        // Default: White bg, Gold text, Gold border
        // Hover (INVERTED): Transparent bg, Gold text, Gold border
        gold: "bg-white text-gold border border-gold font-semibold hover:bg-transparent hover:text-gold",
        
        // TYPE B: TRANSPARENT BASE (Secondary actions)
        // Default: Transparent bg, White/Gold text, Gold border
        // Hover (INVERTED): White bg, Gold text, Gold border
        goldOutline: "bg-transparent text-white border border-gold font-semibold hover:bg-white hover:text-gold",
        
        // HERO TYPE: FOR IMAGES/VIDEOS
        // Default: Transparent bg, White text, White border
        // Hover (INVERTED): White bg, Gold text
        heroOutline: "bg-transparent text-white border border-white font-semibold hover:bg-white hover:text-gold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
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
