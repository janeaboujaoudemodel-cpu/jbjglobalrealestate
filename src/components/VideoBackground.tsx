/**
 * VideoBackground - Premium video background with instant poster fallback
 * 
 * Shows a poster image immediately while the video loads in the background.
 * Crossfades to video once it's ready to play. Uses IntersectionObserver
 * to only load video when visible (saves bandwidth on mobile).
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useDeferredMedia } from "@/hooks/useDeferredMedia";
import { buildResponsiveImage, HERO_IMAGE_SIZES, HERO_IMAGE_WIDTHS } from "@/lib/responsiveImage";


interface VideoBackgroundProps {
  /** Video source URL or imported asset */
  src: string;
  /** Poster image shown instantly while video loads */
  poster: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Opacity of the video (e.g. 0.3 for subtle background) */
  opacity?: number;
  /** When true, skip IntersectionObserver and start loading immediately (use for hero/above-the-fold) */
  eager?: boolean;
}

const VideoBackground = ({ src, poster, className = "", opacity = 1, eager = true }: VideoBackgroundProps) => {
  const [videoReady, setVideoReady] = useState(false);
  const [inView, setInView] = useState(eager);
  // Heavy background videos never compete with first paint (see useDeferredMedia).
  const mediaAllowed = useDeferredMedia(eager ? 350 : 800);
  const isVisible = inView && mediaAllowed;
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Only start loading video when container is in viewport (skipped if eager)
  useEffect(() => {
    if (eager) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // Start loading slightly before visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  // Play video when visible
  useEffect(() => {
    if (isVisible && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Autoplay blocked — poster stays visible
      });
    }
  }, [isVisible]);


  const handleCanPlay = useCallback(() => {
    setVideoReady(true);
  }, []);

  return (
    <div ref={containerRef} className={`absolute inset-0 bg-[#1A1A1A] ${className}`}>
      {/* Poster image — shown immediately. Responsive: mobile must not pull a
          1920px poster for a 390px viewport. Only the eager (LCP) instance is
          fetched at high priority. */}
      <img
        src={posterSources?.src ?? poster}
        srcSet={posterSources?.srcSet}
        sizes={posterSources?.srcSet ? HERO_IMAGE_SIZES : undefined}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity }}
        loading={eager ? "eager" : "lazy"}
        {...({ fetchpriority: eager ? "high" : "low" } as any)}
       decoding="async" />


      {/* Video — fades in over poster when ready */}
      {isVisible && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          autoPlay
          preload={eager ? "auto" : "metadata"}
          onLoadedData={handleCanPlay}
          onCanPlay={handleCanPlay}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: videoReady ? opacity : 0,
            transition: "opacity 0.5s ease-in-out",
          }}
        >
          <source src={src} type={src.toLowerCase().includes(".webm") ? "video/webm" : "video/mp4"} />
        </video>

      )}
    </div>
  );
};

export default VideoBackground;
