/**
 * DeveloperLink Component - Clickable Developer Name
 * LOCKED: Developer names must ALWAYS be clickable and link to /developer/:slug
 *
 * LOCKED RULE: Never render an inline mini-logo next to the name. The card
 * already displays the developer logo top-left — a second tiny logo between
 * "by" and the name is a visual violation. `logoUrl` is accepted for API
 * compatibility but intentionally ignored.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DeveloperLinkProps {
  name: string;
  slug?: string | null;
  /** @deprecated Inline logo is banned. Kept only for backwards-compatible call sites. */
  logoUrl?: string | null;
  className?: string;
  showPrefix?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const DeveloperLink = React.forwardRef<HTMLSpanElement, DeveloperLinkProps>(({
  name,
  slug,
  className = "",
  showPrefix = true,
  onClick,
}, ref) => {
  const navigate = useNavigate();
  const href = slug ? `/developer/${slug}` : `/developers?search=${encodeURIComponent(name)}`;

  const go = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick?.(e as React.MouseEvent);
    navigate(href);
  };

  return (
    <span ref={ref} className={cn("inline-flex items-center gap-1 text-[#1A1A1A]", className)}>
      {showPrefix && <span className="text-[#1A1A1A]">by </span>}
      <span
        role="link"
        tabIndex={0}
        data-href={href}
        onClick={go}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') go(e); }}
        data-no-contrast-guard
        data-developer-gold
        style={{ color: '#B89555', WebkitTextFillColor: '#B89555' }}
        className="developer-name-gold font-bold !text-[#B89555] cursor-pointer transition-colors duration-150 hover:!text-[#C9A66B] focus-visible:!text-[#C9A66B] focus-visible:outline-none"
      >
        {name}
      </span>
    </span>
  );
});

DeveloperLink.displayName = 'DeveloperLink';

export default DeveloperLink;
