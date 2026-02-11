import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

/**
 * ============================================================
 * GLOBAL AVATAR SYSTEM - JBJ GLOBAL REAL ESTATE (LOCKED - FINAL)
 * ============================================================
 * 
 * CORE RULES (ALIGNED WITH PORTRAIT IMAGE SYSTEM):
 * 1. MAXIMUM ZOOM: Fill the frame as much as possible
 * 2. NEVER crop the head
 * 3. NEVER crop shoulders or hands/sides
 * 4. CAN crop the suit/body from bottom if needed
 * 5. Face must be centered
 * 6. Minimize empty gaps in the frame
 * 
 * HOW IT WORKS:
 * - Uses object-fit: cover to fill frame completely (no gaps)
 * - Uses object-position: center 15% to focus on face/upper body
 * - Crops from bottom (suit area) while preserving head & shoulders
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
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>>(
  ({ className, ...props }, ref) =>
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex shrink-0 overflow-hidden rounded-full bg-primary",


    className
    )}
    {...props} />

);
Avatar.displayName = AvatarPrimitive.Root.displayName;

/**
 * AvatarImage - GLOBAL PORTRAIT RULE (LOCKED - FINAL)
 * - object-fit: cover = fills frame completely, no gaps
 * - object-position: center 15% = focus on face, crop from bottom
 * - Maximum zoom while preserving head & shoulders
 */
/**
 * AvatarImage - GLOBAL PORTRAIT RULE (LOCKED - FINAL)
 * - object-fit: cover = fills frame completely, no gaps
 * - object-position: center 40% = MAXIMUM ZOOM on face, crop from bottom
 * - Head and shoulders are NEVER cropped
 * - NO GAPS around head/shoulders allowed
 */
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>>(
  ({ className, style, src, srcSet, sizes, alt = "", ...props }, ref) =>
  <AvatarPrimitive.Image
    ref={ref}
    alt={alt}
    src={src}
    srcSet={srcSet}
    sizes={sizes}
    className={cn("h-full w-full", className)}
    style={{
      objectFit: "cover",
      objectPosition: "center 40%",
      ...style
    }}
    {...props} />

);
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>>(
  ({ className, ...props }, ref) =>
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground",
      className
    )}
    {...props} />

);
AvatarFallback.displayName = AvatarFallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };