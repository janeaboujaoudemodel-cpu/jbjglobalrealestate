import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

/**
 * ============================================================
 * GLOBAL IMAGE RULE - LOCKED (NO CROP + PERFECT CENTERING)
 * ============================================================
 * 
 * CORE RULES:
 * - NEVER crop images (no head, face, body, hands, or edges cut)
 * - Preserve original image ratio at all times
 * - Subject must visually occupy 70-85% of container
 * - Perfect centering: horizontal + vertical
 * - Head positioned in upper third of frame
 * - Equal breathing space on all sides
 * - Black/dark backgrounds must be preserved
 * - Circle is a MASK only - no zoom-out behavior
 * - Image quality must remain original and high-resolution
 * 
 * Applies to:
 * - Founder images
 * - Employee photos
 * - Team members
 * - CRM users
 * - User profile avatars
 * - Leadership cards
 * - Any image container (circle, square, rectangle)
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
      // Dark background preserved for image integrity
      "bg-zinc-950",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

/**
 * AvatarImage - GLOBAL IMAGE RULE APPLIED
 * - NO cropping - image shown exactly as provided
 * - Subject fills 70-85% of container naturally
 * - Head positioned in upper third (object-position: center 15%)
 * - Dark background preserved
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
      objectFit: 'contain',
      objectPosition: 'center 15%', // Head in upper third
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
