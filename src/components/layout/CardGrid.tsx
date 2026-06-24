import { forwardRef, type HTMLAttributes } from "react";

interface CardGridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4;
}

export const CardGrid = forwardRef<HTMLDivElement, CardGridProps>(
  ({ columns = 3, className = "", children, ...rest }, ref) => (
    <div ref={ref} className={`jj-card-grid jj-card-grid--${columns} ${className}`} {...rest}>
      {children}
    </div>
  ),
);

CardGrid.displayName = "CardGrid";

export default CardGrid;