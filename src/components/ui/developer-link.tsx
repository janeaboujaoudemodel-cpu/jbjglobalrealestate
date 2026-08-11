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
  const goldRef = React.useRef<HTMLSpanElement | null>(null);

  /**
   * LOCKED (PASS 269): the animated champagne→gold fill is applied at runtime
   * with `!important` priority. Some legacy global ink locks in index.css win
   * the cascade against stylesheet rules, which used to leave developer names
   * black. Setting the properties imperatively is the only way to guarantee the
   * gold gradient text on every surface.
   */
  React.useEffect(() => {
    const el = goldRef.current;
    if (!el) return;
    const apply = () => {
      el.style.setProperty('background-image', 'linear-gradient(90deg, #7A5A1E 0%, #A98338 22%, #C9A66B 34%, #A98338 48%, #7A5A1E 70%, #A98338 88%, #7A5A1E 100%)', 'important');
      el.style.setProperty('background-size', '220% 100%', 'important');
      el.style.setProperty('-webkit-background-clip', 'text', 'important');
      el.style.setProperty('background-clip', 'text', 'important');
      el.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
      el.style.setProperty('color', 'transparent', 'important');
      el.style.setProperty('animation', 'jj-gold-link-sheen 6.5s ease-in-out infinite', 'important');
    };
    apply();
    const t = window.setTimeout(apply, 400);
    return () => window.clearTimeout(t);
  }, [name]);
  const href = slug ? `/developer/${slug}` : `/developers?search=${encodeURIComponent(name)}`;

  const go = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick?.(e as React.MouseEvent);
    navigate(href);
  };

  return (
    <span ref={ref} className={cn("inline-flex items-baseline gap-1 leading-none", className)} style={{ color: '#1A1A1A' }}>
      {showPrefix && <span data-no-contrast-guard className="leading-none align-baseline" style={{ color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A' }}>by </span>}
      <span
        ref={goldRef}
        role="link"
        tabIndex={0}
        data-href={href}
        onClick={go}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') go(e); }}
        data-no-contrast-guard
        data-developer-gold
        data-developer-name-shine
        style={{ color: '#B89555', WebkitTextFillColor: '#B89555' }}
        className="developer-name-gold developer-name-shine font-bold !text-[#B89555] cursor-pointer leading-none align-baseline transition-colors duration-150 hover:!text-[#C9A66B] focus-visible:!text-[#C9A66B] focus-visible:outline-none"
      >
        {name}
      </span>
    </span>
  );
});

DeveloperLink.displayName = 'DeveloperLink';

export default DeveloperLink;
