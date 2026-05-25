/**
 * MinimalFooter — single-line public footer per founder directive.
 * Links: Privacy · Cookies · Sitemap · Contact. Copyright underneath.
 *
 * Unified champagne theme across all devices, matching the vertical sidebar
 * header gradient (left → right) so they read as one continuous frame.
 * Offset by the 200px sidebar on desktop so it aligns with the sidebar footer row
 * (Contact / Support / Sign Out / Collapse).
 *
 * The full corporate footer (Footer.tsx) remains available for back-office /
 * marketing surfaces.
 */
import { Link } from "react-router-dom";

const links = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookies Policy" },
  { href: "/sitemap", label: "Sitemap" },
  { href: "/contact", label: "Contact Us" },
];

const MinimalFooter = () => {
  return (
    <footer
      className={[
        // Champagne band — full-bleed edge-to-edge UNDER the fixed vertical
        // sidebar so there is no gap between the sidebar's right border and
        // the footer (whether the sidebar is expanded 200px or collapsed 48px).
        "w-full bg-gradient-to-r from-[#FDFBF7] via-[#F7F1E6] to-[#EFE6D6]",
        "border-t border-[#B89555]/40",
      ].join(" ")}
      data-surface="champagne"
    >
      {/* Inner content offsets by the live sidebar width so links stay
          optically centered in the visible content area; the band itself
          extends behind the sidebar. */}
      <div className="max-w-[1600px] mx-auto px-5 md:px-10 py-5 md:py-6 transition-[padding-left] duration-100 ease-out [body.jj-vertical-nav-active_&]:sm:pl-[200px] [body.jj-vertical-nav-collapsed_&]:sm:pl-[48px]">
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-5 md:gap-x-7 gap-y-2"
        >
          {links.map((l, i) => (
            <span key={l.href} className="inline-flex items-center gap-x-5 md:gap-x-7">
              <Link
                to={l.href}
                className="text-[12px] md:text-[13px] font-medium text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
              >
                {l.label}
              </Link>
              {i < links.length - 1 && (
                <span
                  aria-hidden
                  data-decorative="true"
                  className="text-[#1A1A1A]/40" // contrast-ok — decorative dot separator (aria-hidden)
                >
                  ·
                </span>
              )}
            </span>
          ))}
        </nav>

        <div
          className="mx-auto mt-4 h-px w-40 max-w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(184,149,85,0.55), transparent)",
          }}
          aria-hidden
        />

        <p className="mt-3 text-center text-[11px] md:text-[12px] text-[#1A1A1A]/70 tracking-[0.02em]">
          © 2026 JBJ GLOBAL REAL ESTATE. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default MinimalFooter;
