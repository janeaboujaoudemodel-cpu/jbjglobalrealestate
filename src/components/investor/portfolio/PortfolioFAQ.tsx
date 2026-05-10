import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "What is Portfolio Views used for?",
    answer:
      "Portfolio Views organizes your real estate assets into a clear structure so you can review status, documents, and reports without searching manually.",
  },
  {
    question: "Does Portfolio Views show guaranteed performance?",
    answer:
      "No. It provides descriptive context and official reporting links, not guarantees.",
  },
  {
    question: "Can I group my portfolio by area or objective?",
    answer:
      "Yes. Portfolio Views supports grouping by objective, asset type, location, and status.",
  },
  {
    question: "Are documents stored securely?",
    answer:
      "Yes. Documents are private to the account and authorized administrators only.",
  },
  {
    question: "Can I download a portfolio summary?",
    answer:
      "Yes. You can generate a PDF summary or shareable link with your portfolio overview.",
  },
  {
    question: "Will this replace Market Intelligence?",
    answer:
      "No. Market Intelligence is market-wide. Portfolio Views is specific to your linked assets.",
  },
  {
    question: "Can I add assets manually?",
    answer:
      "Assets can be linked through your account activity, submissions, or advisory coordination.",
  },
  {
    question: "Who can see my portfolio?",
    answer: "Only you and authorized JBJ administrators.",
  },
];

export default function PortfolioFAQ() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-[#1A1A1A]" />
        Portfolio Views — FAQs
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
