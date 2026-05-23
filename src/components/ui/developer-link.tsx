/**
 * DeveloperLink Component - Clickable Developer Name
 * LOCKED: Developer names must ALWAYS be clickable and link to /developer/:slug
 *
 * This is a global rule - use this component everywhere developer names appear.
 * Optional `logoUrl` renders a tiny inline logo next to the name so the
 * developer is always identifiable wherever the name appears.
 */

import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { isValidDeveloperLogoUrl } from "@/utils/developerLogo";

interface DeveloperLinkProps {
  name: string;
  slug?: string | null;
  logoUrl?: string | null;
  className?: string;
  showPrefix?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const DeveloperLink = React.forwardRef<HTMLSpanElement, DeveloperLinkProps>(({
  name,
  slug,
  logoUrl,
  className = "",
  showPrefix = true,
  onClick
}, ref) => {
  const handleClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent card clicks
    e.stopPropagation();
    onClick?.(e);
  };

  // Fallback: even when slug is missing, name must remain GOLD + clickable
  // (links to /developers search). Hover behaviour is identical to slug branch.
  const href = slug ? `/developer/${slug}` : `/developers?search=${encodeURIComponent(name)}`;
  const showLogo = isValidDeveloperLogoUrl(logoUrl);

  return (
    <span ref={ref} className={cn("inline-flex items-center gap-1.5 text-[#1A1A1A]", className)}>
      {showPrefix && <span className="text-[#1A1A1A]">by </span>}
      {showLogo && (
        <span
          aria-hidden
          className="inline-flex items-center justify-center h-5 w-5 rounded-sm bg-[#FDFBF7] border border-[#B89555]/40 overflow-hidden shrink-0"
        >
          <img
            src={logoUrl as string}
            alt=""
            loading="lazy"
            className="block max-h-full max-w-full object-contain"
          />
        </span>
      )}
      <Link
        to={href}
        onClick={handleClick}
        data-no-contrast-guard
        style={{ color: '#B89555' }}
        className="font-bold !text-[#B89555] underline underline-offset-4 decoration-[#B89555]/60 cursor-pointer transition-colors duration-150 hover:!text-[#8E6E36] hover:decoration-[#B89555] focus-visible:!text-[#8E6E36] focus-visible:decoration-[#B89555] focus-visible:outline-none"
      >
        {name}
      </Link>
    </span>
  );
});

DeveloperLink.displayName = 'DeveloperLink';

export default DeveloperLink;
