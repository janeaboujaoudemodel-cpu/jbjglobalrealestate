import { forwardRef, type HTMLAttributes } from "react";

type ContentTrackWidth = "default" | "wide" | "narrow" | "full";

interface ContentTrackProps extends HTMLAttributes<HTMLDivElement> {
  width?: ContentTrackWidth;
}

const WIDTH_CLASS: Record<ContentTrackWidth, string> = {
  default: "jj-content-track",
  wide: "jj-content-track jj-content-track--wide",
  narrow: "jj-content-track jj-content-track--narrow",
  full: "jj-content-track jj-content-track--full",
};

export const ContentTrack = forwardRef<HTMLDivElement, ContentTrackProps>(
  ({ width = "default", className = "", children, ...rest }, ref) => (
    <div ref={ref} className={`${WIDTH_CLASS[width]} ${className}`} {...rest}>
      {children}
    </div>
  ),
);

ContentTrack.displayName = "ContentTrack";

export default ContentTrack;