import { ReactNode, useEffect } from "react";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { PreFooterSeparator } from "@/components/PreFooterSeparator";
import { MarketIntelligenceTableOfContents } from "@/components/market-intelligence/MarketIntelligenceTableOfContents";
import { PhoneCall } from "lucide-react";

export interface MIShellHeroCTA {
  label: string;
  href: string;
  external?: boolean;
}

export interface MIShellTocItem {
  id: string;
  title: string;
  icon: LucideIcon;
}

export interface MIPageShellProps {
  /** Hero */
  heroTitle: ReactNode;
  heroDescription?: ReactNode;
  heroCTAs?: MIShellHeroCTA[];
  /** Optional in-page navigator (shown after hero, hides while in hero) */
  tocItems?: MIShellTocItem[];
  tocTitle?: string;
  /** Pre-footer CTA card. Defaults ON. */
  showPreFooter?: boolean;
  preFooterTitle?: string;
  preFooterSubtitle?: string;
  /** Optional wrapper className for body area (children) */
  bodyClassName?: string;
  children?: ReactNode;
}

const heroCtaClass =
  "jj-mi-hero-cta jj-mi-hero-cta-emerald allow-white group inline-flex items-center justify-center gap-2 whitespace-nowrap px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 md:px-8 md:py-4 md:text-base";

/**
 * MIPageShell — canonical page shell matching the Market Intelligence design:
 *  - Deep emerald Prada full-screen hero (title + description + optional CTAs)
 *  - Optional MI-style table of contents navigator
 *  - Consistent max-width, spacing, and rounded card frame for body
 *  - Canonical Pre-Footer "Ready to Get Started" CTA
 *
 * All routes wrapped by this shell share the SAME visual system as
 * /market-intelligence — no exceptions.
 */
export default function MIPageShell({
  heroTitle,
  heroDescription,
  heroCTAs,
  tocItems,
  tocTitle = "In This Section",
  showPreFooter = true,
  preFooterTitle,
  preFooterSubtitle,
  bodyClassName,
  children,
}: MIPageShellProps) {
  useEffect(() => {
    // Reuse the MI scroll contract so navigator behavior, hero-detection
    // and glass CTA locks all resolve on these pages too.
    document.body.setAttribute("data-mi-page-active", "true");
    return () => {
      document.body.removeAttribute("data-mi-page-active");
    };
  }, []);

  return (
    <div
      data-mi-page
      className="min-h-screen bg-background [--mi-gold:40_35%_53%] [--mi-navy:0_0%_4%] [--mi-navy-soft:0_0%_12%]"
    >
      {/* Premium full-screen emerald hero — LOCKED to MI hero contract. */}
      <section
        data-mi-hero
        data-unified-hero
        data-hero-dark
        data-surface="emerald"
        data-no-contrast-guard
        data-premium-emerald-hero
        className="jj-hero-fullscreen jj-mi-prada-hero relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden"
      >
        <div aria-hidden className="jj-mi-marble-depth pointer-events-none absolute inset-0" />
        <div aria-hidden className="jj-mi-gold-hairline pointer-events-none absolute inset-x-0 bottom-0 h-px" />
        <div
          aria-hidden
          className="jj-mi-marble-grain pointer-events-none absolute inset-0 mix-blend-overlay"
        />

        <div className="relative z-10 mx-auto flex w-full max-w-[64rem] flex-col items-center justify-center px-6 text-center">
          <h1
            data-no-contrast-guard
            className="jj-mi-hero-title mx-auto max-w-[16ch] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-[1.02]"
          >
            {heroTitle}
          </h1>
          <div aria-hidden className="jj-mi-title-rule my-8 h-px w-24" />
          {heroDescription ? (
            <p
              data-no-contrast-guard
              className="jj-mi-hero-copy mx-auto max-w-[42rem] text-lg md:text-xl lg:text-2xl font-light leading-relaxed"
            >
              {heroDescription}
            </p>
          ) : null}

          {heroCTAs && heroCTAs.length > 0 ? (
            <div className="mt-12 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row sm:flex-nowrap">
              {heroCTAs.map((cta) =>
                cta.external ? (
                  <a
                    key={cta.href + cta.label}
                    href={cta.href}
                    data-no-contrast-guard
                    data-on-dark
                    className={heroCtaClass}
                  >
                    <span>{cta.label}</span>
                    <ArrowUpRight className="w-5 h-5" />
                  </a>
                ) : (
                  <Link
                    key={cta.href + cta.label}
                    to={cta.href}
                    data-no-contrast-guard
                    data-on-dark
                    className={heroCtaClass}
                  >
                    <span>{cta.label}</span>
                    <ArrowUpRight className="w-5 h-5" />
                  </Link>
                ),
              )}
            </div>
          ) : null}
        </div>
      </section>

      {tocItems && tocItems.length > 0 ? (
        <MarketIntelligenceTableOfContents
          items={tocItems}
          title={tocTitle}
          ctaAction={{ label: "Speak With Our Team", href: "/contact", icon: PhoneCall }}
        />
      ) : null}

      <div className={bodyClassName}>{children}</div>

      {showPreFooter ? (
        <div id="cta" className="scroll-mt-24">
          <PreFooterSeparator
            title={preFooterTitle ?? "Ready to Make Informed Decisions?"}
            subtitle={
              preFooterSubtitle ??
              "Speak with our team for personalized guidance based on your investment goals and market conditions."
            }
            primaryLink="/contact"
            primaryText="Speak With Our Team"
            secondaryLink="/ai-home-finder"
            secondaryText="AI Home Finder"
          />
        </div>
      ) : null}
    </div>
  );
}
