/**
 * MinimalFooter — single-line public footer per founder directive.
 * Mother-of-pearl white band with emerald accent links and copyright.
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
        "w-full bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#F2EBDC]",
        "border-t border-[#B89555]/35",
      ].join(" ")}
      data-surface="champagne"
      data-jj-minimal-footer
    >
      <div className="max-w-[1600px] mx-auto px-5 md:px-10 py-5 md:py-6 transition-[padding-left] duration-100 ease-out [body.jj-vertical-nav-active_&]:sm:pl-[200px] [body.jj-vertical-nav-collapsed_&]:sm:pl-[48px]">
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-5 md:gap-x-7 gap-y-2"
        >
          {links.map((l, i) => (
            <span key={l.href} className="inline-flex items-center gap-x-5 md:gap-x-7">
              <Link
                to={l.href}
                data-no-contrast-guard
                className="jj-text-emerald text-[12px] md:text-[13px] font-semibold transition-opacity hover:opacity-80"
                style={{ color: "#047857" }}
              >
                {l.label}
              </Link>
              {i < links.length - 1 && (
                <span
                  aria-hidden
                  data-decorative="true"
                  className="jj-text-emerald"
                  style={{ color: "#047857" }}
                >
                  ·
                </span>
              )}
            </span>
          ))}
        </nav>

        <div
          className="jj-footer-rule mx-auto mt-4 h-px w-40 max-w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(184,149,85,0.75), transparent)",
          }}
          aria-hidden
        />

        <p
          className="mt-3 text-center text-[11px] md:text-[12px] font-semibold tracking-[0.02em]"
          style={{ color: "#047857" }}
          data-no-contrast-guard
        >
          © 2026 JBJ GLOBAL REAL ESTATE. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default MinimalFooter;
