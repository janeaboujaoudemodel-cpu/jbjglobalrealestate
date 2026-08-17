import { SEOHead } from "@/components/SEOHead";
import {
  HelpCircle, Home, Building2, Banknote, Globe, Shield, Phone, LucideIcon,
} from "lucide-react";
import { FAQPageShell } from "@/components/content-page/FAQPageShell";

interface FAQCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  questions: Array<{ question: string; answer: string }>;
}

const FAQ = () => {
  const categories: FAQCategory[] = [
    {
      id: "about-jbj",
      title: "About JBJ Global Real Estate",
      icon: Building2,
      questions: [
        { question: "Who is JBJ Global Real Estate?", answer: "JBJ Global Real Estate is a licensed real estate brokerage operating in the UAE, specializing in buying, selling, and renting residential and investment properties. We work with local and international clients and operate within UAE real estate regulations." },
        { question: "Is JBJ Global Real Estate a developer?", answer: "No. JBJ Global Real Estate is an independent brokerage. We do not develop properties. Our role is to analyze the market, compare opportunities, and guide clients objectively across multiple developers, locations, and property types." },
        { question: "Are you licensed in the UAE?", answer: "Yes. JBJ Global Real Estate is fully licensed to operate in the UAE for real estate brokerage activities, including buying, selling, and renting properties. All transactions are conducted in compliance with local laws and regulations." },
      ],
    },
    {
      id: "fees-services",
      title: "Fees & Services",
      icon: Banknote,
      questions: [
        { question: "Do you charge clients for your services?", answer: "This depends on the type of transaction:\n\n• Off-plan purchases: Buyers do not pay agency fees. Brokerages are compensated directly by developers.\n• Ready property purchases or sales: Agency fees apply as per UAE regulations and are disclosed clearly before proceeding.\n• Leasing services: Fees follow Dubai's regulated brokerage commission structure." },
        { question: "Do you guarantee returns on investment?", answer: "No. There are no guaranteed returns in real estate. Any company claiming guaranteed ROI is misrepresenting market reality. We provide data-driven analysis and guidance, but all investment outcomes depend on market conditions and individual decisions." },
      ],
    },
    {
      id: "property-selection",
      title: "Property Selection",
      icon: Home,
      questions: [
        { question: "How do you select properties to recommend?", answer: "Recommendations are based on:\n\n• Official government and regulatory data\n• Market supply and demand trends\n• Location fundamentals\n• Developer track records\n• Alignment with the client's stated objectives\n\nWe do not promote properties based on commissions or personal interests." },
      ],
    },
    {
      id: "international-clients",
      title: "International Clients",
      icon: Globe,
      questions: [
        { question: "Can international clients buy property through JBJ Global Real Estate?", answer: "Yes. International buyers can purchase property in designated freehold areas across the UAE. We regularly assist overseas clients with remote viewings, documentation coordination, and transaction support." },
        { question: "Do I need to be physically present in the UAE to buy property?", answer: "Not necessarily. Many transactions are completed remotely using secure documentation processes. Power of Attorney arrangements can be used when physical presence is not possible." },
      ],
    },
    {
      id: "additional-services",
      title: "Additional Services & Coverage",
      icon: Shield,
      questions: [
        { question: "Do you provide legal or financial services?", answer: "JBJ Global Real Estate does not provide legal or financial services. When required, we may introduce clients to licensed third-party professionals. Any engagement with third parties is contracted directly between the client and the service provider." },
        { question: "What areas do you cover?", answer: "We operate across the UAE, with a primary focus on Dubai's established and emerging residential and investment communities. Assistance in other emirates is available upon request." },
      ],
    },
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Phone,
      questions: [
        { question: "How do I start working with JBJ Global Real Estate?", answer: "You can contact us through the website to discuss your objectives. From there, we provide structured guidance, market insights, and next steps based on your goals." },
      ],
    },
  ];

  const allFaqItems = categories.flatMap((cat) => cat.questions);

  return (
    <>
      <SEOHead
        title="FAQ | Frequently Asked Questions | JBJ Global Real Estate"
        description="Find answers to common questions about buying, selling, and renting property in the UAE. Expert guidance on mortgages, legal requirements, costs, and the property transaction process."
        keywords="UAE property FAQ, Dubai real estate questions, buying property UAE, selling property Dubai, mortgage UAE, property costs Dubai"
        canonicalPath="/faq"
        faqItems={allFaqItems}
      />
      <FAQPageShell
        hero={{
          eyebrow: "Frequently Asked Questions",
          eyebrowIcon: HelpCircle,
          title: "Your Questions Answered",
          subtitle: "Find clear answers to the most common questions about buying, selling, and owning property in the UAE.",
        }}
        categories={categories}
        currentPath="/faq"
        cta={{
          body: "Whether you're exploring options or ready to proceed, we're happy to provide guidance tailored to your situation.",
          guideHref: "/buyer-guide",
          guideLabel: "Read Buyer Guide",
        }}
      />
    </>
  );
};

export default FAQ;
