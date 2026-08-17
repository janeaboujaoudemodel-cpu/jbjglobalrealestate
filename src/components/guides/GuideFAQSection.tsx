import type { LucideIcon } from "lucide-react";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GuideSectionHeader } from "./GuideSectionHeader";

export interface GuideFAQCategory {
  id: string;
  title: string;
  questions: Array<{ question: string; answer: string }>;
}

interface GuideFAQSectionProps {
  id?: string;
  title: string;
  icon?: LucideIcon;
  categories: GuideFAQCategory[];
}

/**
 * Categorized FAQ accordion for the bottom of a guide page, above
 * GuideNavigation. Reuses the same Accordion primitives and jj-card-inner
 * styling already used by each guide's own inline FAQ section (e.g.
 * BuyerGuide's "faqs" block) rather than the darker FAQPageShell treatment,
 * so it matches the surrounding guide page instead of the standalone FAQ hub.
 */
export function GuideFAQSection({ id = "faq", title, icon: Icon = HelpCircle, categories }: GuideFAQSectionProps) {
  return (
    <section id={id} className="py-16 md:py-24 jj-section-champagne scroll-mt-20">
      <div className="jj-guide-content">
        <GuideSectionHeader icon={Icon} title={title} />
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id}>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">{category.title}</h3>
              <div className="jj-card-inner rounded-2xl p-6 md:p-8">
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`${category.id}-${index}`}
                      className="border-b border-[#B89555]/30 last:border-0"
                    >
                      <AccordionTrigger className="text-left text-[#1A1A1A] font-medium hover:text-[#1A1A1A] py-4">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-[#1A1A1A]/70 pb-4 whitespace-pre-line">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default GuideFAQSection;
