import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { logImageFailure } from "@/utils/imageLoadLogger";

interface ImageWithSkeletonProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Optional className applied to the wrapping container. */
  wrapperClassName?: string;
  /** Rounded preset for both skeleton + image. */
  rounded?: "none" | "md" | "lg" | "xl" | "full";
  /** Name of the rendering component, used for failure logs. */
  loggerComponent?: string;
  /** Free-form context attached to failure logs. */
  loggerContext?: Record<string, unknown>;
}

const roundedMap = {
  none: "",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
} as const;

/**
 * Drop-in <img> replacement that renders a champagne skeleton until the
 * underlying image has finished loading. Falls back to the skeleton on error
 * so cards/logos never appear empty.
 */
export function ImageWithSkeleton({
  wrapperClassName,
  rounded = "none",
  className,
  onLoad,
  onError,
  loggerComponent,
  loggerContext,
  ...imgProps
}: ImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const radius = roundedMap[rounded];

  return (
    <div className={cn("relative w-full h-full overflow-hidden", radius, wrapperClassName)}>
      {!loaded && !errored && (
        <Skeleton className={cn("absolute inset-0 w-full h-full", radius)} />
      )}
      <img
        {...imgProps}
        className={cn(
          "w-full h-full transition-opacity duration-300",
          radius,
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setErrored(true);
          logImageFailure({
            src: e.currentTarget.src || (imgProps.src as string),
            component: loggerComponent || "ImageWithSkeleton",
            reason: "onerror",
            context: { ...loggerContext, alt: imgProps.alt },
          });
          onError?.(e);
        }}
      />
    </div>
  );
}

export default ImageWithSkeleton;
