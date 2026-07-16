import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import {
  HelpCircle,
  Globe,
  Shield,
  TrendingUp,
  Building,
  Banknote,
  Users,
  Phone,
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ContentPageShell } from "@/components/content-page/ContentPageShell";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";

interface FAQCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  questions: Array<{ question: string; answer: string }>;
}

const HEADING_FONT = {
  fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif',
};

const InvestorFAQ = () => {
  const categories: FAQCategory[] = [
    {
      id: "investor-basics",
      title: "Investor Basics",
      icon: Users,
      questions: [
        {
          question: "Who is considered an investor in real estate?",
          answer:
            "An investor is anyone purchasing property with the objective of capital preservation, rental income, long-term appreciation, or portfolio diversification. This includes first-time investors, experienced portfolio holders, and international buyers.",
        },
        {
          question: "Is real estate in the UAE suitable for investment?",
          answer:
            "The UAE real estate market is supported by strong regulation, transparent ownership laws, and ongoing government-led development initiatives. Investment suitability depends on objectives, timeframe, risk tolerance, and market conditions at the time of purchase.",
        },
      ],
    },
    {
      id: "returns-guarantees",
      title: "Returns & Guarantees",
      icon: TrendingUp,
      questions: [
        {
          question: "Do you guarantee returns or rental income?",
          answer:
            "No. There are no guaranteed returns in real estate. Any claim of guaranteed ROI is misleading. We provide analysis based on historical data, market indicators, and official government information, but outcomes are never guaranteed.",
        },
      ],
    },
    {
      id: "evaluation-process",
      title: "Evaluation Process",
      icon: Shield,
      questions: [
        {
          question: "How do you evaluate investment opportunities?",
          answer:
            "Investment analysis is based on:\n\n• Official government and regulatory data\n• Supply and demand dynamics\n• Location fundamentals\n• Developer credibility and delivery history\n• Entry price relative to comparable assets\n• Rental yield and exit liquidity indicators\n\nOur role is to help investors understand risk and opportunity clearly.",
        },
        {
          question: "Do you push projects that pay higher commissions?",
          answer:
            "No. Property recommendations are not driven by commissions or personal relationships. Our approach is to evaluate the full market and align options strictly with the investor's stated goals.",
        },
      ],
    },
    {
      id: "fees-costs",
      title: "Fees & Costs",
      icon: Banknote,
      questions: [
        {
          question: "Are there fees when buying off-plan as an investor?",
          answer:
            "For off-plan purchases, investors do not pay brokerage fees. Developers compensate licensed brokerages directly. All costs related to the property itself (purchase price, registration fees, etc.) are disclosed transparently.",
        },
        {
          question: "What fees apply when buying a ready property?",
          answer:
            "When purchasing a ready property, standard brokerage fees apply in accordance with UAE regulations. These are communicated clearly before proceeding with any transaction.",
        },
      ],
    },
    {
      id: "international-investors",
      title: "International Investors",
      icon: Globe,
      questions: [
        {
          question: "Can non-residents invest in UAE real estate?",
          answer:
            "Yes. Non-residents can invest in designated freehold areas across the UAE. Residency is not required to purchase property, though certain investments may qualify buyers for residency programs subject to government criteria.",
        },
      ],
    },
    {
      id: "investment-strategies",
      title: "Investment Strategies",
      icon: Building,
      questions: [
        {
          question: "What types of investment strategies do you support?",
          answer:
            "We support multiple strategies, including:\n\n• Long-term capital appreciation\n• Rental income generation\n• Off-plan-to-handover strategies\n• Portfolio diversification across locations and asset types\n\nStrategy selection depends on individual objectives and market conditions.",
        },
      ],
    },
    {
      id: "post-purchase",
      title: "Post-Purchase Support",
      icon: Users,
      questions: [
        {
          question: "Do you manage properties after purchase?",
          answer:
            "We assist investors by coordinating leasing, resale, or introductions to licensed property management providers when required. All services are clearly defined and optional.",
        },
        {
          question: "How involved are you after the purchase?",
          answer:
            "Our support does not end at the transaction. We remain available to assist with leasing, resale strategies, and market updates relevant to your asset, subject to agreed services.",
        },
      ],
    },
    {
      id: "decision-getting-started",
      title: "Decision & Getting Started",
      icon: Phone,
      questions: [
        {
          question: "Who makes the final investment decision?",
          answer:
            "The final decision always belongs to the investor. Our responsibility is to provide clarity, data, and guidance so decisions are made with full understanding of risks and opportunities.",
        },
        {
          question: "How do I start as an investor with JBJ Global Real Estate?",
          answer:
            "You can contact us through the website to outline your objectives. We then provide structured guidance and market insights aligned with your investment goals.",
        },
      ],
    },
  ];

  const allFaqItems = categories.flatMap((cat) => cat.questions);
  const tocSections = categories.map((c) => ({ id: c.id, title: c.title, icon: c.icon }));

  return (
    <>
      <SEOHead
        title="Investor FAQ | Investment Questions Answered | JBJ Global Real Estate"
        description="Find answers to common investor questions about UAE real estate investment, returns, off-plan properties, rental performance, and working with JBJ Global Real Estate."
        keywords="investor FAQ, UAE real estate investment, Dubai property investment, off-plan investment, rental yield Dubai, property investment questions"
        canonicalPath="/investor-faq"
        faqItems={allFaqItems}
      />

      <ContentPageShell
        hero={{
          eyebrow: "Investor FAQ",
          eyebrowIcon: HelpCircle,
          title: "Investor Questions Answered",
          subtitle:
            "Clear, factual answers to the questions serious investors ask before committing capital in the UAE.",
        }}
        sections={tocSections}
        tocTitle="In This FAQ"
      >
        {/* Category cards — locked ContentPageShell white-champagne pattern */}
        {categories.map((category, categoryIndex) => (
          <section
            key={category.id}
            id={category.id}
            className="scroll-mt-28 mb-10 md:mb-14"
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-[#B89555]/35 bg-white/85 backdrop-blur-sm shadow-[0_10px_40px_-24px_rgba(6,78,59,0.25)] p-6 md:p-10"
            >
              {/* Category header */}
              <div className="flex items-center gap-3 mb-6">
                <span
                  data-surface="emerald"
                  className="w-11 h-11 rounded-xl inline-flex items-center justify-center border border-white/15 flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg,#064E3B,#042c1c 55%,#010806)",
                  }}
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

              {/* Questions */}
              <div className="space-y-3">
                {category.questions.map((faq, faqIndex) => (
                  <Accordion
                    key={faqIndex}
                    type="single"
                    collapsible
                    className="w-full"
                  >
                    <AccordionItem
                      value={`${categoryIndex}-${faqIndex}`}
                      className="jj-faq-item rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] px-5 data-[state=open]:bg-[image:var(--jj-emerald-ombre)] data-[state=open]:border-[#0d3a2b]/40 data-[state=open]:shadow-[0_10px_30px_-16px_rgba(6,78,59,0.55)] transition-colors"
                    >
                      <AccordionTrigger
                        className="jj-faq-trigger text-left py-4 text-base font-medium text-[#1A1A1A] hover:no-underline data-[state=open]:text-white"
                      >
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent
                        className="jj-faq-content pb-5 leading-relaxed whitespace-pre-line text-[#1A1A1A]/80 data-[state=open]:text-white/90"
                      >
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))}
              </div>
            </motion.div>
          </section>
        ))}

        {/* Still-have-questions — solid emerald CTA card */}
        <section id="still-have-questions" className="scroll-mt-28 mb-10 md:mb-14">
          <div
            data-surface="emerald"
            className="rounded-2xl border border-white/15 p-8 md:p-12 text-center shadow-[0_18px_46px_-20px_rgba(6,78,59,0.65)]"
            style={{
              background:
                "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)",
            }}
          >
            <span
              className="w-14 h-14 rounded-2xl inline-flex items-center justify-center border border-white/20 mx-auto mb-5 bg-white/8"
            >
              <Shield className="w-7 h-7 text-white" />
            </span>
            <h2
              className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-3"
              style={HEADING_FONT}
            >
              Still Have Questions?
            </h2>
            <p className="text-white/85 max-w-xl mx-auto mb-7 leading-relaxed">
              Whether you're exploring investment options or ready to proceed,
              our team is here to provide guidance tailored to your situation.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="primary" className="px-6">
                <Link to="/contact">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Our Team
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="px-6 border-white/40 bg-white/8 text-white hover:bg-white/15"
              >
                <Link to="/investor-education">
                  Read Investor Guide
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Guide nav */}
        <div className="mb-8">
          <GuideNavigation current="/investor-faq" guides={GUIDE_LINKS} />
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-5 text-center">
          <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
            <span className="text-[#1A1A1A] font-semibold">Disclaimer:</span>{" "}
            All content is educational and informational in nature. It does not
            constitute financial guarantees or investment promises. Decisions
            should reflect individual objectives and risk tolerance.
          </p>
        </div>
      </ContentPageShell>
    </>
  );
};

export default InvestorFAQ;
