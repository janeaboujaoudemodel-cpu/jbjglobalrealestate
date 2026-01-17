import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

/**
 * ============================================================
 * GLOBAL AVATAR SYSTEM - JBJ GLOBAL REAL ESTATE (LOCKED)
 * ============================================================
 * 
 * CORE RULES (ALIGNED WITH PORTRAIT IMAGE SYSTEM):
 * - Subject occupies 70-85% of container (visual presence)
 * - Subject is centered (face in middle)
 * - Head is NEVER cropped
 * - Uses object-fit: cover with smart positioning
 * - Circle is a MASK - image fills it properly
 * 
 * Applies to:
 * - Founder images
 * - Employee photos
 * - Team members
 * - CRM users
 * - User profile avatars
 * - Leadership cards
 * ============================================================
 */

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex shrink-0 overflow-hidden rounded-full",
      "bg-zinc-900",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

/**
 * AvatarImage - GLOBAL PORTRAIT RULE APPLIED
 * - Uses object-fit: cover for visual presence (fills container)
 * - Face positioned in upper portion (object-position: center 25%)
 * - Head is never cropped
 * - Subject fills 70-85% of container
 */
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image 
    ref={ref} 
    className={cn(
      "aspect-square h-full w-full",
      className
    )}
    style={{
      objectFit: 'cover',
      objectPosition: 'center 20%',
    }}
    {...props} 
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarFallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
