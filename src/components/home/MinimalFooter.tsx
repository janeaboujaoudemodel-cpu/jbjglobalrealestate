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
        "w-full bg-gradient-to-b from-[#F7F2EA] via-[#EFE6D6] to-[#F7F2EA]",
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
                className="text-[12px] md:text-[13px] font-semibold transition-opacity hover:opacity-70"
                style={{ color: "#1A1A1A" }}
              >
                {l.label}
              </Link>
              {i < links.length - 1 && (
                <span
                  aria-hidden
                  data-decorative="true"
                  style={{ color: "#1A1A1A" }}
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

        <p
          className="mt-3 text-center text-[11px] md:text-[12px] font-semibold tracking-[0.02em]"
          style={{ color: "#1A1A1A" }}
          data-no-contrast-guard
        >
          © 2026 JBJ GLOBAL REAL ESTATE. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default MinimalFooter;
