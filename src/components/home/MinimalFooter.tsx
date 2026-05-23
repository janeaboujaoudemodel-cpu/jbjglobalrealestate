/**
 * MinimalFooter — single-line public footer per founder directive.
 * Links: Privacy · Cookies · Sitemap · Contact. Copyright underneath.
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
    <footer className="bg-[hsl(32,28%,13%)] border-t border-white/10">
      <div className="max-w-[1600px] mx-auto px-5 md:px-10 py-5 md:py-6">
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-5 md:gap-x-7 gap-y-2"
        >
          {links.map((l, i) => (
            <span key={l.href} className="inline-flex items-center gap-x-5 md:gap-x-7">
              <Link
                to={l.href}
                className="text-[12px] md:text-[13px] font-medium text-white/85 hover:text-white transition-colors"
              >
                {l.label}
              </Link>
              {i < links.length - 1 && (
                // contrast-ok — decorative bullet separator
                <span aria-hidden data-decorative="true" className="text-white/30">·</span>
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

        <p className="mt-3 text-center text-[11px] md:text-[12px] text-white/65 tracking-[0.02em]">
          © 2026 JBJ GLOBAL REAL ESTATE. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default MinimalFooter;
