/**
 * DeveloperLink Component - Clickable Developer Name
 * LOCKED: Developer names must ALWAYS be clickable and link to /developer/:slug
 * 
 * This is a global rule - use this component everywhere developer names appear.
 */

import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DeveloperLinkProps {
  name: string;
  slug?: string | null;
  className?: string;
  showPrefix?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const DeveloperLink = React.forwardRef<HTMLSpanElement, DeveloperLinkProps>(({ 
  name, 
  slug, 
  className = "", 
  showPrefix = true,
  onClick 
}, ref) => {
  const handleClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent card clicks
    e.stopPropagation();
    onClick?.(e);
  };

  // If no slug, render as styled text (still gold + underline so it reads as a brand mark)
  if (!slug) {
    return (
      <span ref={ref} className={cn("text-muted-foreground", className)}>
        {showPrefix && <span className="text-[#1A1A1A]">by </span>}
        <span className="font-semibold text-[#1A1A1A] underline underline-offset-4 decoration-gold/60">
          {name}
        </span>
      </span>
    );
  }

  return (
    <span ref={ref} className={cn("text-muted-foreground", className)}>
      {showPrefix && <span className="text-[#1A1A1A]">by </span>}
      <Link 
        to={`/developer/${slug}`}
        onClick={handleClick}
        className="font-semibold text-[#1A1A1A] underline underline-offset-4 decoration-gold/60 hover:decoration-gold hover:text-[#1A1A1A] transition-all"
      >
        {name}
      </Link>
    </span>
  );
});

DeveloperLink.displayName = 'DeveloperLink';

export default DeveloperLink;
