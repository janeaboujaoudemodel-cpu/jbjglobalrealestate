import { SEOHead } from "@/components/SEOHead";
import { HelpCircle, Shield, Banknote, Clock, LucideIcon, TrendingUp, Home } from "lucide-react";
import { FAQPageShell } from "@/components/content-page/FAQPageShell";

interface FAQCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  questions: Array<{ question: string; answer: string }>;
}

const SellerFAQ = () => {
  const categories: FAQCategory[] = [
    {
      id: "selling-basics",
      title: "Selling Basics",
      icon: Home,
      questions: [
        { question: "When is the best time to sell my property in Dubai?", answer: "The Dubai property market tends to be most active from September to April (the cooler months). However, timing depends on several factors:\n\n• Market cycle: Selling during an uptrend maximizes returns\n• Supply conditions: Low inventory in your area creates seller advantage\n• Personal circumstances: Cash flow needs, relocation timeline\n• Off-plan handover waves: Avoid selling when large projects hand over in your area, as new inventory depresses resale prices\n\nOur team provides current market analysis to help you time your sale optimally." },
        { question: "How do I determine the right selling price?", answer: "Accurate pricing is critical — overpricing leads to stale listings, underpricing leaves money on the table. We use:\n\n• Comparative Market Analysis (CMA): Recent sales of similar units in your building/community\n• Current listings: What competing properties are asking\n• DLD transaction data: Official recorded sale prices\n• Building-specific factors: Floor level, view, upgrades, parking\n• Market trend analysis: Direction and momentum of prices in your area\n\nWe recommend pricing within 3–5% of comparable recent transactions for optimal buyer interest." },
        { question: "Can I sell my off-plan property before handover?", answer: "Yes, this is called an 'assignment' or 'resale of off-plan contract.' Key points:\n\n• Developer consent is required — most charge an assignment fee (2–5% of purchase price)\n• You must have paid a minimum percentage (usually 30–40%) of the purchase price\n• RERA regulates off-plan resales to protect all parties\n• Capital gains on off-plan resales are common in appreciating markets\n• The new buyer takes over your remaining payment obligations\n\nSome developers restrict resales until a certain construction milestone is reached." },
      ],
    },
    {
      id: "costs-selling",
      title: "Costs When Selling",
      icon: Banknote,
      questions: [
        { question: "What fees do sellers pay when selling property in Dubai?", answer: "As a seller, budget for the following costs:\n\n• Agency Commission: 2% of the sale price + 5% VAT\n• NOC Fee: AED 500–5,000 (varies by developer; required for transfer)\n• Mortgage Discharge: AED 1,290 if you have an existing mortgage\n• Early Settlement Fee: 1% of outstanding mortgage balance (if paying off early)\n• Capital Gains Tax: None — the UAE does not tax capital gains\n\nTotal seller costs typically amount to 2.5–3.5% of the sale price." },
        { question: "What is a NOC and why do I need it?", answer: "A No Objection Certificate (NOC) is issued by the developer confirming:\n\n• All service charges are paid up to date\n• No outstanding fees or violations on the property\n• The developer has no objection to the ownership transfer\n\nWithout a valid NOC, the DLD will not process the title deed transfer. Processing time is typically 3–7 working days. Some developers now offer instant NOC services online." },
        { question: "Do I need to pay off my mortgage before selling?", answer: "Not necessarily. There are two common approaches:\n\n1. Buyer pays off your mortgage: The buyer's funds (or their bank) settles your outstanding loan at the time of transfer. This is the most common method.\n\n2. Seller settles independently: You arrange early settlement with your bank before the transfer date.\n\nIn both cases, you'll need a liability letter from your bank stating the outstanding balance, and you'll pay an early settlement fee of 1% of the remaining loan amount." },
      ],
    },
    {
      id: "process",
      title: "Selling Process",
      icon: Clock,
      questions: [
        { question: "What is the step-by-step selling process?", answer: "1. Property valuation and pricing strategy with your agent\n2. Professional photography, virtual tours, and listing preparation\n3. Marketing on Bayut, Property Finder, Dubizzle, social media, and agent networks\n4. Viewings and open houses\n5. Receiving and negotiating offers\n6. Signing the MOU (Form F) — buyer pays 10% deposit\n7. Applying for NOC from the developer\n8. Mortgage discharge (if applicable)\n9. Transfer at DLD Trustee Office — both parties present or represented by POA\n10. Receiving sale proceeds\n\nThe process typically takes 4–8 weeks from accepting an offer to completing the transfer." },
        { question: "How long does it take to sell a property in Dubai?", answer: "Average selling timelines vary by market conditions:\n\n• Well-priced properties in high-demand areas: 2–4 weeks\n• Average market conditions: 1–3 months\n• Slow market or overpriced properties: 3–6+ months\n\nFactors affecting speed:\n• Accurate pricing (most important)\n• Property condition and presentation\n• Quality of marketing materials\n• Location and community desirability\n• Market cycle timing" },
        { question: "What documents do I need to sell my property?", answer: "Prepare the following documents:\n\n• Original title deed\n• Valid passport (original)\n• Emirates ID (if UAE resident)\n• NOC from the developer\n• Service charge clearance letter\n• Mortgage liability letter (if mortgaged)\n• Power of Attorney (if not attending transfer personally)\n• DEWA final bill or clearance\n\nYour agent will guide you through the document preparation process." },
      ],
    },
    {
      id: "marketing",
      title: "Marketing Your Property",
      icon: TrendingUp,
      questions: [
        { question: "How will my property be marketed?", answer: "JBJ GLOBAL REAL ESTATE employs a comprehensive marketing strategy:\n\n• Professional photography and videography\n• 360° virtual tours for remote buyers\n• Premium listings on Bayut, Property Finder, and Dubizzle\n• Social media campaigns (Instagram, LinkedIn, YouTube)\n• Email marketing to our database of qualified buyers\n• Agent-to-agent networking within major brokerage firms\n• International exposure through overseas property portals\n• Featured listings and premium placement on key platforms\n\nAll marketing costs are included in the standard agency commission." },
        { question: "Should I stage or renovate before selling?", answer: "Minor improvements often yield significant returns:\n\nHigh ROI improvements:\n• Deep cleaning and decluttering\n• Fresh paint (neutral tones)\n• Professional staging (furniture and accessories)\n• Minor repairs (leaking taps, broken fixtures)\n• Landscaping/balcony presentation\n\nUsually not worth the cost:\n• Full kitchen renovation\n• Major bathroom remodel\n• Structural changes\n• High-end appliance upgrades\n\nStaged properties in Dubai typically sell 15–20% faster and often achieve 5–10% higher prices than unstaged equivalents." },
      ],
    },
    {
      id: "legal-tax",
      title: "Legal & Tax Considerations",
      icon: Shield,
      questions: [
        { question: "Are there any taxes on selling property in the UAE?", answer: "The UAE offers one of the most tax-friendly environments for property sellers:\n\n• Capital gains tax: None\n• Income tax: None\n• Inheritance tax: None\n• Property transfer tax: The 4% DLD fee is typically split equally or negotiated between buyer and seller\n\nHowever, if you are a tax resident of another country, you may have reporting or tax obligations in your home jurisdiction. Consult your tax advisor regarding international property disposal." },
        { question: "Can I sell my property if I'm outside the UAE?", answer: "Yes. You can sell remotely by:\n\n• Granting a Power of Attorney (POA) to a trusted representative\n• The POA must be attested by the UAE embassy in your country\n• Your representative can sign the MOU, collect NOC, and attend the transfer\n• Sale proceeds can be transferred to your international bank account\n\nMany of our sellers complete the entire process remotely. Your agent coordinates everything from marketing to closing." },
      ],
    },
  ];

  const allFaqItems = categories.flatMap((cat) => cat.questions);

  return (
    <>
      <SEOHead
        title="Seller FAQ | Property Selling Questions | JBJ Global Real Estate"
        description="Answers to common questions about selling property in the UAE — pricing, fees, process, and marketing."
        canonicalPath="/seller-faq"
        faqItems={allFaqItems}
      />
      <FAQPageShell
        hero={{
          eyebrow: "Seller FAQ",
          eyebrowIcon: HelpCircle,
          title: "Seller Questions Answered",
          subtitle: "Everything you need to know about selling property in the UAE.",
        }}
        categories={categories}
        currentPath="/seller-faq"
        cta={{
          body: "Our team is ready to help with your selling journey.",
          guideHref: "/seller-guide",
          guideLabel: "Read Seller Guide",
        }}
      />
    </>
  );
};

export default SellerFAQ;
