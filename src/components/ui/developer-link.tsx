/**
 * DeveloperLink Component - Clickable Developer Name
 * 🔒 LOCKED: Developer names must ALWAYS be clickable and link to /developer/:slug
 * 
 * This is a global rule - use this component everywhere developer names appear.
 */

import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DeveloperLinkProps {
  name: string;
  slug?: string | null;
  className?: string;
  showPrefix?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function DeveloperLink({ 
  name, 
  slug, 
  className = "", 
  showPrefix = true,
  onClick 
}: DeveloperLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent card clicks
    e.stopPropagation();
    onClick?.(e);
  };

  // If no slug, render as styled text (but still gold)
  if (!slug) {
    return (
      <span className={cn("text-muted-foreground", className)}>
        {showPrefix && <span className="text-black">by </span>}
        <span className="font-semibold text-gold">
          {name}
        </span>
      </span>
    );
  }

  return (
    <span className={cn("text-muted-foreground", className)}>
      {showPrefix && <span className="text-black">by </span>}
      <Link 
        to={`/developer/${slug}`}
        onClick={handleClick}
        className="font-semibold transition-all hover:underline text-gold"
      >
        {name}
      </Link>
    </span>
  );
}

export default DeveloperLink;
