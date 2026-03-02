/**
 * VideoBackground - Premium video background with instant poster fallback
 * 
 * Shows a poster image immediately while the video loads in the background.
 * Crossfades to video once it's ready to play. Uses IntersectionObserver
 * to only load video when visible (saves bandwidth on mobile).
 */

import { useState, useRef, useEffect, useCallback } from "react";

interface VideoBackgroundProps {
  /** Video source URL or imported asset */
  src: string;
  /** Poster image shown instantly while video loads */
  poster: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Opacity of the video (e.g. 0.3 for subtle background) */
  opacity?: number;
}

const VideoBackground = ({ src, poster, className = "", opacity = 1 }: VideoBackgroundProps) => {
  const [videoReady, setVideoReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Only start loading video when container is in viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // Start loading slightly before visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Play video when visible
  useEffect(() => {
    if (isVisible && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked — poster stays visible
      });
    }
  }, [isVisible]);

  const handleCanPlay = useCallback(() => {
    setVideoReady(true);
  }, []);

  return (
    <div ref={containerRef} className={`absolute inset-0 ${className}`}>
      {/* Poster image — shown immediately */}
      <img
        src={poster}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity }}
        loading="eager"
        fetchPriority="high"
      />

      {/* Video — fades in over poster when ready */}
      {isVisible && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={handleCanPlay}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: videoReady ? opacity : 0,
            transition: "opacity 0.8s ease-in-out",
          }}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </div>
  );
};

export default VideoBackground;
