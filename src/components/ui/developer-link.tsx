/**
 * DeveloperLink Component - Clickable Developer Name
 * LOCKED: Developer names must ALWAYS be clickable and link to /developer/:slug
 *
 * This is a global rule - use this component everywhere developer names appear.
 * Optional `logoUrl` renders a tiny inline logo next to the name so the
 * developer is always identifiable wherever the name appears.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  // Fallback: even when slug is missing, name must remain GOLD + clickable
  const href = slug ? `/developer/${slug}` : `/developers?search=${encodeURIComponent(name)}`;
  const showLogo = isValidDeveloperLogoUrl(logoUrl);

  const go = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick?.(e as React.MouseEvent);
    navigate(href);
  };

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
      {/* Rendered as role="link" span (not <a>) so it stays valid HTML when nested inside another <a> card link. */}
      <span
        role="link"
        tabIndex={0}
        data-href={href}
        onClick={go}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') go(e); }}
        data-no-contrast-guard
        data-developer-gold
        style={{ color: '#B89555', WebkitTextFillColor: '#B89555' }}
        className="developer-name-gold font-bold !text-[#B89555] underline underline-offset-4 decoration-[#B89555]/60 cursor-pointer transition-colors duration-150 hover:!text-[#8E6E36] hover:decoration-[#B89555] focus-visible:!text-[#8E6E36] focus-visible:decoration-[#B89555] focus-visible:outline-none"
      >
        {name}
      </span>
    </span>
  );
});

DeveloperLink.displayName = 'DeveloperLink';

export default DeveloperLink;
