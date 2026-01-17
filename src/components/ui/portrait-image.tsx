import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ============================================================
 * GLOBAL PORTRAIT IMAGE SYSTEM - JBJ GLOBAL REAL ESTATE (LOCKED)
 * ============================================================
 * 
 * USE FOR: Founder, Employees, Users, Team Members, Avatars
 * 
 * RULES (MANDATORY):
 * - Subject occupies 70-85% of container (visual presence)
 * - Subject is centered (face in middle)
 * - Head is NEVER cropped
 * - No "tiny subject inside large background"
 * - No distortions
 * - High-resolution only
 * 
 * HOW IT WORKS:
 * - Uses object-fit: cover for visual presence
 * - Uses object-position to focus on face/upper body
 * - Container controls the frame, image fills it properly
 * - The image FILLS the container visually
 * 
 * APPLIES TO:
 * - About page (Founder)
 * - Team page
 * - Employee Hub profiles
 * - CRM profiles
 * - User profiles
 * - Group avatars
 * ============================================================
 */

export interface PortraitImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Container shape: circle or square */
  shape?: "circle" | "square" | "rounded";
  /** Container size preset */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** Whether to show gold border */
  bordered?: boolean;
  /** Focus position - where the face is in the image */
  focus?: "top" | "center" | "upper";
}

const sizeClasses = {
  xs: "w-8 h-8",
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
  "2xl": "w-48 h-48",
  full: "w-full h-full",
};

const shapeClasses = {
  circle: "rounded-full",
  square: "rounded-none",
  rounded: "rounded-xl",
};

/**
 * Focus positions for portrait framing
 * - "top": Face is at the very top of the image (12% from top)
 * - "upper": Face is in upper portion (20% from top) - DEFAULT
 * - "center": Face is centered (50%)
 */
const focusPositions = {
  top: "center 12%",
  upper: "center 20%",
  center: "center 50%",
};

const PortraitImage = React.forwardRef<HTMLImageElement, PortraitImageProps>(
  ({ 
    className, 
    shape = "circle", 
    size = "lg", 
    bordered = true,
    focus = "upper",
    alt = "",
    style,
    ...props 
  }, ref) => {
    return (
      <div 
        className={cn(
          "overflow-hidden bg-zinc-900 flex-shrink-0 relative",
          sizeClasses[size],
          shapeClasses[shape],
          bordered && "border-2 border-gold/30",
          className
        )}
      >
        {/* No-empty-edges + no-crop portrait rendering:
            - Background layer fills frame (cover + blur)
            - Foreground layer shows full subject (contain)
        */}
        <img
          aria-hidden="true"
          alt=""
          className="w-full h-full absolute inset-0"
          style={{
            objectFit: "cover",
            objectPosition: focusPositions[focus],
            filter: "blur(18px)",
            transform: "scale(1.15)",
            opacity: 0.35,
          }}
          loading="lazy"
          decoding="async"
          src={props.src}
        />
        <img
          ref={ref}
          alt={alt}
          className="w-full h-full absolute inset-0"
          style={{
            objectFit: "contain",
            objectPosition: focusPositions[focus],
            ...style,
          }}
          loading="lazy"
          decoding="async"
          {...props}
        />
      </div>
    );
  }
);

PortraitImage.displayName = "PortraitImage";

export { PortraitImage };
