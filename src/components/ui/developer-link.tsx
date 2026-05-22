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
        <span className="font-semibold text-[#B89555] underline underline-offset-4 decoration-[#B89555]/50">
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
        className="font-semibold text-[#B89555] underline underline-offset-4 decoration-[#B89555]/50 cursor-pointer transition-colors duration-150 hover:text-[#8E6E36] hover:decoration-[#B89555] focus-visible:text-[#8E6E36] focus-visible:decoration-[#B89555] focus-visible:outline-none"
      >
        {name}
      </Link>
    </span>
  );
});

DeveloperLink.displayName = 'DeveloperLink';

export default DeveloperLink;
