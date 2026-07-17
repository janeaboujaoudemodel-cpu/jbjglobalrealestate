import { SEOHead } from "@/components/SEOHead";
import {
  HelpCircle, Scale, Shield, MessageSquare, Building, Home, Database, Users, LucideIcon,
} from "lucide-react";
import { FAQPageShell } from "@/components/content-page/FAQPageShell";

interface FAQCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  questions: Array<{ question: string; answer: string }>;
}

const BrokerFAQ = () => {
  const categories: FAQCategory[] = [
    {
      id: "joining-jbj",
      title: "Joining JBJ",
      icon: Users,
      questions: [
        { question: "Who can join as a broker with JBJ Global Real Estate?", answer: "Brokers must be legally eligible to operate in Dubai and meet JBJ's internal standards. JBJ works only with professionals who respect compliance, documentation, transparency, and client-first conduct." },
        { question: "Is this Broker FAQ public or internal?", answer: "This is professional guidance aligned with JBJ standards. Broker tools and internal training are accessed through the Broker Hub by registered brokers." },
      ],
    },
    {
      id: "philosophy-ethics",
      title: "Philosophy & Ethics",
      icon: Shield,
      questions: [
        { question: "What is JBJ's brokerage philosophy?", answer: "JBJ operates on a client-first, data-driven advisory model. Brokers are expected to guide clients based on suitability and market reality, not pressure selling or commission motivation." },
        { question: "Are brokers allowed to promise ROI or guaranteed returns?", answer: "No. Guaranteed ROI does not exist in real estate. Brokers must never promise outcomes, returns, rental guarantees, or market certainty. Communication must remain factual and compliant." },
      ],
    },
    {
      id: "client-advising",
      title: "Client Advising",
      icon: MessageSquare,
      questions: [
        { question: "What is required from brokers when advising clients?", answer: "Brokers must:\n\n• Document communication properly\n• Provide accurate information\n• Present realistic timelines\n• Explain risks clearly\n• Avoid exaggeration or marketing manipulation\n• Respect legal boundaries at all times" },
        { question: "What are JBJ's expectations for client handling?", answer: "Brokers must:\n\n• Respect client capital and trust\n• Maintain transparency about costs and process\n• Avoid emotional pressure tactics\n• Focus on long-term relationship building\n\nRepeat clients and referrals are the priority, not volume transactions." },
      ],
    },
    {
      id: "partner-services",
      title: "Partner Services",
      icon: Building,
      questions: [
        { question: "How does JBJ handle partner services (mortgage, legal, visa)?", answer: "JBJ may introduce clients to licensed third-party partners when needed. Brokers must never imply these services are provided directly by JBJ. The client contracts directly with the licensed provider." },
      ],
    },
    {
      id: "documentation",
      title: "Documentation",
      icon: Database,
      questions: [
        { question: "What documentation is essential in brokerage workflow?", answer: "Brokers must keep a clear record of:\n\n• Client objectives\n• Property options presented\n• Risks explained\n• Negotiation notes\n• Transaction steps\n• Final decision confirmation\n\nProper documentation protects both the client and the brokerage." },
      ],
    },
    {
      id: "market-communication",
      title: "Market Communication",
      icon: Scale,
      questions: [
        { question: "How should brokers speak about market outlook?", answer: "Market discussions must be descriptive and data-based. Brokers may reference historical patterns and published information, but must never present forecasts as certainty." },
      ],
    },
    {
      id: "tools-systems",
      title: "Tools & Systems",
      icon: Home,
      questions: [
        { question: "How do brokers access tools and internal systems?", answer: "Registered brokers access:\n\n• CRM and lead management\n• Broker tools and templates\n• Internal training modules\n• Performance tracking\n\nthrough the Broker Hub." },
      ],
    },
    {
      id: "compliance-growth",
      title: "Compliance & Growth",
      icon: Shield,
      questions: [
        { question: "What happens if a broker violates JBJ standards?", answer: "Violations of compliance, transparency, or ethical conduct are taken seriously. JBJ may suspend access, terminate collaboration, or escalate issues depending on severity." },
        { question: "How can a broker grow within JBJ?", answer: "Growth is based on:\n\n• Consistency and professionalism\n• Compliance discipline\n• Client satisfaction\n• Documentation quality\n• Long-term results\n\nnot aggressive selling." },
      ],
    },
  ];

  const allFaqItems = categories.flatMap((cat) => cat.questions);

  return (
    <>
      <SEOHead
        title="Broker FAQ | Professional Questions Answered | JBJ Global Real Estate"
        description="Find clear answers to common broker questions about licensing, ethics, client communication, off-plan representation, and professional conduct in UAE real estate."
        keywords="broker FAQ, UAE real estate broker, Dubai broker licensing, RERA broker, professional brokerage, broker ethics, real estate compliance"
        canonicalPath="/broker-faq"
        faqItems={allFaqItems}
      />
      <FAQPageShell
        hero={{
          eyebrow: "Broker FAQ",
          eyebrowIcon: HelpCircle,
          title: "Broker Questions, Clearly Answered",
          subtitle: "Clear, factual answers for real estate professionals operating in the UAE — professional conduct, licensing scope, and operational clarity.",
        }}
        categories={categories}
        currentPath="/broker-faq"
        cta={{
          body: "Whether you're seeking clarity on professional standards or ready to elevate your practice, we're here to provide guidance.",
          guideHref: "/broker-education",
          guideLabel: "Read Broker Education Guide",
        }}
        disclaimer="This FAQ is educational in nature and does not replace regulatory obligations. Brokers remain responsible for ensuring full compliance with UAE laws and licensing requirements at all times."
      />
    </>
  );
};

export default BrokerFAQ;
