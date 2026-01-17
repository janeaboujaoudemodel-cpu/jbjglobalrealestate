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
 * - Uses object-position: center 20% to focus on face/upper body
 * - Container controls the frame, image fills it properly
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

const focusPositions = {
  top: "center 15%",
  upper: "center 25%",
  center: "center center",
};

const PortraitImage = React.forwardRef<HTMLImageElement, PortraitImageProps>(
  ({ 
    className, 
    shape = "circle", 
    size = "lg", 
    bordered = true,
    focus = "upper",
    alt = "",
    ...props 
  }, ref) => {
    return (
      <div 
        className={cn(
          "overflow-hidden bg-zinc-900 flex-shrink-0",
          sizeClasses[size],
          shapeClasses[shape],
          bordered && "border-2 border-gold/30",
          className
        )}
      >
        <img
          ref={ref}
          alt={alt}
          className="w-full h-full"
          style={{
            objectFit: "cover",
            objectPosition: focusPositions[focus],
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
