/**
 * MinimalFooter — single-line public footer per founder directive.
 * Links: Privacy · Cookies · Sitemap · Contact. Copyright underneath.
 *
 * Responsive theme:
 *  - Phone + iPad portrait (< lg / 1024px): dark espresso (kept as-is).
 *  - Desktop + iPad landscape (>= lg): champagne to match the fixed header,
 *    and offset by the 200px sidebar so it aligns with the sidebar footer row
 *    (Contact / Support / Sign Out / Collapse).
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
        // Mobile / iPad-portrait — dark espresso (unchanged)
        "bg-[hsl(32,28%,13%)] border-t border-white/10",
        // Desktop / iPad-landscape — champagne band matching the vertical sidebar
        // header gradient (left → right) exactly so they read as one continuous frame.
        "lg:bg-gradient-to-r lg:from-[#FDFBF7] lg:via-[#F7F1E6] lg:to-[#EFE6D6]",
        "lg:border-t lg:border-[#B89555]/40",
        "lg:ml-[200px]",
      ].join(" ")}
      data-surface="champagne"
    >
      <div className="max-w-[1600px] mx-auto px-5 md:px-10 py-5 md:py-6">
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-5 md:gap-x-7 gap-y-2"
        >
          {links.map((l, i) => (
            <span key={l.href} className="inline-flex items-center gap-x-5 md:gap-x-7">
              <Link
                to={l.href}
                className="text-[12px] md:text-[13px] font-medium text-white/85 hover:text-white lg:text-[#1A1A1A] lg:hover:text-[#1A1A1A] transition-colors"
              >
                {l.label}
              </Link>
              {i < links.length - 1 && (
                <span
                  aria-hidden
                  data-decorative="true"
                  className="text-white/30 lg:text-[#1A1A1A]/40" // contrast-ok — decorative dot separator (aria-hidden)
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

        <p className="mt-3 text-center text-[11px] md:text-[12px] text-white/65 lg:text-[#1A1A1A]/70 tracking-[0.02em]">
          © 2026 JBJ GLOBAL REAL ESTATE. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default MinimalFooter;
