import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ============================================================
 * GLOBAL PORTRAIT IMAGE SYSTEM - JBJ GLOBAL REAL ESTATE (LOCKED)
 * ============================================================
 * 
 * USE FOR: Founder, Employees, Users, Team Members, Avatars
 * 
 * RULES (MANDATORY - FINAL):
 * 1. MAXIMUM ZOOM: Fill the frame as much as possible
 * 2. NEVER crop the head
 * 3. NEVER crop shoulders or hands/sides
 * 4. CAN crop the suit/body from bottom if needed
 * 5. Face must be centered
 * 6. Minimize empty gaps in the frame
 * 
 * HOW IT WORKS:
 * - Uses object-fit: cover to fill frame completely (no gaps)
 * - Uses object-position: center top to focus on face/upper body
 * - Crops from bottom (suit area) while preserving head & shoulders
 * - The image FILLS the container with maximum visual presence
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
 * Focus positions for portrait framing (object-position values)
 * - "top": Face at very top - crops more from bottom (center 5%)
 * - "upper": Face in upper third - balanced crop (center 15%) - DEFAULT
 * - "center": Face centered - equal crop top/bottom (center 35%)
 * 
 * These values work with object-fit: cover to maximize zoom
 * while keeping head/shoulders visible and cropping from bottom
 */
/**
 * CRITICAL PORTRAIT ZOOM RULE (LOCKED - FINAL):
 * Images must FILL the frame with MAXIMUM ZOOM.
 * - No gaps around head/shoulders
 * - Head must NEVER be cropped
 * - Shoulders must NEVER be cropped
 * - Zoom in as much as possible while preserving head/shoulders
 */
const focusPositions = {
  top: "center 15%",
  upper: "center 40%",
  center: "center 50%",
};

const PortraitImage = React.forwardRef<HTMLImageElement, PortraitImageProps>(
  ({ 
    className, 
    shape = "circle", 
    size = "lg", 
    bordered = false,
    focus = "upper",
    alt = "",
    style,
    ...props 
  }, ref) => {
    return (
      <div 
        className={cn(
          "overflow-hidden bg-[#1A1A1A] flex-shrink-0 relative",
          sizeClasses[size],
          shapeClasses[shape],
          bordered && "border-2 border-[#B89555]/30",
          className
        )}
      >
        {/* GLOBAL PORTRAIT RULE (LOCKED):
            - object-fit: cover = fills frame completely, no gaps
            - object-position: center top% = focus on face, crop from bottom
            - Maximum zoom while preserving head & shoulders
        */}
        <img
          ref={ref}
          alt={alt}
          className="w-full h-full"
          style={{
            objectFit: "cover",
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
