import { forwardRef, type HTMLAttributes } from "react";

export const PageShell = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...rest }, ref) => (
    <div ref={ref} className={`jj-page-shell ${className}`} {...rest}>
      {children}
    </div>
  ),
);

PageShell.displayName = "PageShell";

export default PageShell;