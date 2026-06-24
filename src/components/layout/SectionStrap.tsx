import { forwardRef, type HTMLAttributes } from "react";
import ContentTrack from "@/components/layout/ContentTrack";

type StrapTone = "page" | "surface" | "raised" | "emerald" | "ink" | "transparent";
type TrackWidth = "default" | "wide" | "narrow" | "full";

interface SectionStrapProps extends HTMLAttributes<HTMLElement> {
  tone?: StrapTone;
  trackWidth?: TrackWidth;
  flush?: boolean;
  noTrack?: boolean;
  innerClassName?: string;
}

const TONE_CLASS: Record<StrapTone, string> = {
  page: "jj-section-strap--page",
  surface: "jj-section-strap--surface",
  raised: "jj-section-strap--raised",
  emerald: "jj-section-strap--emerald",
  ink: "jj-section-strap--ink",
  transparent: "jj-section-strap--transparent",
};

export const SectionStrap = forwardRef<HTMLElement, SectionStrapProps>(
  ({ tone = "page", trackWidth = "default", flush = false, noTrack = false, innerClassName = "", className = "", children, ...rest }, ref) => (
    <section
      ref={ref}
      data-layout-strap
      className={`jj-section-strap ${TONE_CLASS[tone]} ${flush ? "jj-section-strap--flush" : ""} ${className}`}
      {...rest}
    >
      {noTrack ? children : <ContentTrack width={trackWidth} className={innerClassName}>{children}</ContentTrack>}
    </section>
  ),
);

SectionStrap.displayName = "SectionStrap";

export default SectionStrap;