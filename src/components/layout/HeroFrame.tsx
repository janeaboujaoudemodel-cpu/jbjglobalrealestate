import { forwardRef, type HTMLAttributes } from "react";
import ContentTrack from "@/components/layout/ContentTrack";

interface HeroFrameProps extends HTMLAttributes<HTMLElement> {
  media?: React.ReactNode;
  overlay?: React.ReactNode;
  contentClassName?: string;
  trackWidth?: "default" | "wide" | "narrow" | "full";
}

export const HeroFrame = forwardRef<HTMLElement, HeroFrameProps>(
  ({ media, overlay, contentClassName = "", trackWidth = "default", className = "", children, ...rest }, ref) => (
    <section ref={ref} data-layout-hero className={`jj-hero-frame ${className}`} {...rest}>
      <div className="jj-hero-frame__media" aria-hidden={!media}>{media}</div>
      {overlay ?? <div className="jj-hero-frame__overlay" />}
      <ContentTrack width={trackWidth} className={`jj-hero-frame__content ${contentClassName}`}>
        {children}
      </ContentTrack>
    </section>
  ),
);

HeroFrame.displayName = "HeroFrame";

export default HeroFrame;