/**
 * FAQPageShell — LOCKED wrapper for FAQ pages.
 * Wraps ContentPageShell + renders category cards + a "Still Have Questions?" CTA.
 * See .lovable/memory/ui-ux/visual-standards/content-page-layout-standard.md
 */
import { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Phone, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ContentPageShell } from "./ContentPageShell";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";

export interface FAQCategoryDef {
  id: string;
  title: string;
  icon: LucideIcon;
  questions: Array<{ question: string; answer: string }>;
}

interface FAQPageShellProps {
  hero: {
    eyebrow: string;
    eyebrowIcon?: LucideIcon;
    title: ReactNode;
    subtitle?: string;
  };
  categories: FAQCategoryDef[];
  tocTitle?: string;
  children?: ReactNode;
  cta?: {
    heading?: string;
    body?: string;
    guideHref?: string;
    guideLabel?: string;
  };
  currentPath?: string;
  disclaimer?: string;
}

const HEADING_FONT = {
  fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif',
};

export function FAQPageShell({
  hero,
  categories,
  tocTitle = "In This FAQ",
  cta,
  currentPath,
  disclaimer = "All content is educational and informational in nature. Decisions should reflect individual objectives and risk tolerance.",
  children,
}: FAQPageShellProps) {
  const tocSections = categories.map((c) => ({ id: c.id, title: c.title, icon: c.icon }));

  return (
    <ContentPageShell hero={hero} sections={tocSections} tocTitle={tocTitle}>
      {children}
      {categories.map((category, categoryIndex) => (
        <section key={category.id} id={category.id} className="scroll-mt-28 mb-10 md:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-[#B89555]/35 bg-white/85 backdrop-blur-sm shadow-[0_10px_40px_-24px_rgba(6,78,59,0.25)] p-6 md:p-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <span
                data-surface="emerald"
                className="w-11 h-11 rounded-xl inline-flex items-center justify-center border border-white/15 flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#064E3B,#042c1c 55%,#010806)" }}
              >
                <category.icon className="w-5 h-5 text-white" />
              </span>
              <h2
                className="text-2xl md:text-3xl font-semibold tracking-tight text-[#0d3a2b]"
                style={HEADING_FONT}
              >
                {category.title}
              </h2>
            </div>

            <div className="space-y-3">
              {category.questions.map((faq, faqIndex) => (
                <Accordion key={faqIndex} type="single" collapsible className="w-full">
                  <AccordionItem
                    value={`${categoryIndex}-${faqIndex}`}
                    data-no-contrast-guard
                    data-ink-emerald
                    className="jj-faq-item rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] px-5 data-[state=open]:bg-[image:var(--jj-emerald-ombre)] data-[state=open]:border-[#0d3a2b]/40 data-[state=open]:shadow-[0_10px_30px_-16px_rgba(6,78,59,0.55)] transition-colors"
                  >
                    <AccordionTrigger className="jj-faq-trigger text-left py-4 text-base font-medium text-[#1A1A1A] hover:no-underline data-[state=open]:text-white">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="jj-faq-content pb-5 leading-relaxed whitespace-pre-line text-[#1A1A1A]/80 data-[state=open]:text-white/90">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          </motion.div>
        </section>
      ))}

      <section id="still-have-questions" className="scroll-mt-28 mb-10 md:mb-14">
        <div
          data-surface="emerald"
          className="rounded-2xl border border-white/15 p-8 md:p-12 text-center shadow-[0_18px_46px_-20px_rgba(6,78,59,0.65)]"
          style={{ background: "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)" }}
        >
          <span className="w-14 h-14 rounded-2xl inline-flex items-center justify-center border border-white/20 mx-auto mb-5 bg-white/[0.08]">
            <Shield className="w-7 h-7 text-white" />
          </span>
          <h2
            className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-3"
            style={HEADING_FONT}
          >
            {cta?.heading ?? "Still Have Questions?"}
          </h2>
          <p className="text-white/85 max-w-xl mx-auto mb-7 leading-relaxed">
            {cta?.body ??
              "Our team is here to provide guidance tailored to your situation."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="primary" className="px-6">
              <Link to="/contact">
                <Phone className="w-4 h-4 mr-2" />
                Contact Our Team
              </Link>
            </Button>
            {cta?.guideHref && (
              <Button
                asChild
                variant="outline"
                className="px-6 border-white/40 bg-white/[0.08] text-white hover:bg-white/15"
              >
                <Link to={cta.guideHref}>
                  {cta.guideLabel ?? "Read Guide"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {currentPath && (
        <div className="mb-8">
          <GuideNavigation current={currentPath} guides={GUIDE_LINKS} />
        </div>
      )}

      <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-5 text-center">
        <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
          <span className="text-[#1A1A1A] font-semibold">Disclaimer:</span> {disclaimer}
        </p>
      </div>
    </ContentPageShell>
  );
}

export default FAQPageShell;
