import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "What reports can I access here?",
    answer:
      "You can access market, area, asset-specific, and advisory reports made available to your account.",
  },
  {
    question: "Are these reports the same as Market Intelligence pages?",
    answer:
      "No. Market Intelligence pages are public-facing. Report Access is personalized and tied to your account.",
  },
  {
    question: "Are the reports official?",
    answer:
      "Reports are based on official government and regulator data, with sources referenced inside each report.",
  },
  {
    question: "Can I download reports?",
    answer: "Yes. All available reports can be downloaded as PDFs.",
  },
  {
    question: "Will I see reports related to my properties automatically?",
    answer:
      "Yes, once assets are linked to your portfolio, relevant reports will appear here.",
  },
  {
    question: "Can I request a custom report?",
    answer: "Yes. Custom reports are available through advisory requests.",
  },
  {
    question: "How often are reports updated?",
    answer:
      "Update frequency depends on the report type and data source. Dates are shown on each report.",
  },
  {
    question: "Who can see my reports?",
    answer: "Only you and authorized JBJ administrators.",
  },
];

export default function ReportAccessFAQ() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-[#1A1A1A]" />
        Report Access — FAQs
      </h2>

      <Card className="border-2 border-[#B89555]/30">
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-b border-[#B89555]/10 last:border-0"
              >
                <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-[#EFE6D6]/5">
                  <span className="font-medium text-foreground">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
}
