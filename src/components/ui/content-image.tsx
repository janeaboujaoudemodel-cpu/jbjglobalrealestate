import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ============================================================
 * GLOBAL CONTENT IMAGE SYSTEM - JBJ GLOBAL REAL ESTATE (LOCKED)
 * ============================================================
 * 
 * USE FOR: Properties, Lifestyle, Backgrounds, Hero images
 * 
 * RULES:
 * - object-fit: cover is acceptable (cropping OK for content)
 * - Full bleed allowed
 * - Can use gradients and overlays
 * 
 * DO NOT USE FOR:
 * - People/portraits (use PortraitImage instead)
 * ============================================================
 */

export interface ContentImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Aspect ratio preset */
  aspect?: "video" | "square" | "wide" | "portrait" | "auto";
  /** Whether to add rounded corners */
  rounded?: boolean | "sm" | "md" | "lg" | "xl" | "2xl";
  /** Object position */
  position?: "center" | "top" | "bottom";
  /** Priority loading for hero images */
  priority?: boolean;
}

const aspectClasses = {
  video: "aspect-video",
  square: "aspect-square",
  wide: "aspect-[21/9]",
  portrait: "aspect-[3/4]",
  auto: "",
};

const roundedClasses = {
  true: "rounded-lg",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  false: "",
};

const positionClasses = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
};

const ContentImage = React.forwardRef<HTMLImageElement, ContentImageProps>(
  ({ 
    className, 
    aspect = "auto", 
    rounded = false,
    position = "center",
    priority = false,
    alt = "",
    ...props 
  }, ref) => {
    return (
      <img
        ref={ref}
        alt={alt}
        className={cn(
          "w-full h-full object-cover",
          aspectClasses[aspect],
          typeof rounded === "boolean" 
            ? roundedClasses[rounded.toString() as "true" | "false"]
            : roundedClasses[rounded],
          positionClasses[position],
          className
        )}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchpriority={priority ? "high" : "low"}
        {...props}
      />
    );
  }
);

ContentImage.displayName = "ContentImage";

export { ContentImage };
