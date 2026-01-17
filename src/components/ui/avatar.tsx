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
 * - Never crop head/shoulders (foreground uses object-fit: contain)
 * - Never show empty borders (background uses blurred cover-fill)
 */
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, style, src, srcSet, sizes, alt = "", ...props }, ref) => (
  <>
    {src ? (
      <img
        aria-hidden="true"
        alt=""
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        className="absolute inset-0 h-full w-full"
        style={{
          objectFit: "cover",
          objectPosition: "center 12%",
          filter: "blur(14px)",
          transform: "scale(1.15)",
          opacity: 0.32,
        }}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    ) : null}

    <AvatarPrimitive.Image
      ref={ref}
      alt={alt}
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      className={cn("absolute inset-0 h-full w-full", className)}
      style={{
        objectFit: "contain",
        objectPosition: "center 12%",
        ...style,
      }}
      {...props}
    />
  </>
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
