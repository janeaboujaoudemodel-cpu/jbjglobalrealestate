import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  CheckCircle2, 
  Home,
  FileText,
  Users,
  Building2,
  ArrowRight,
  Shield,
  Banknote,
  Key,
  Clock,
  Landmark,
  Calculator,
  Phone,
  Camera,
  BarChart3,
  Handshake,
  ClipboardCheck
} from "lucide-react";

const SellerGuide = () => {
  const steps = [
    {
      number: 1,
      title: "Prepare Your Property",
      icon: Home,
      description: "First impressions matter. Proper preparation helps you achieve the best possible price.",
      items: [
        "Declutter and depersonalize to help buyers envision themselves in the space",
        "Complete minor repairs, touch up paint, and ensure everything is in working order",
        "Professional deep cleaning, including windows, carpets, and outdoor areas",
        "Consider staging for vacant properties to showcase the space effectively"
      ]
    },
    {
      number: 2,
      title: "Professional Valuation",
      icon: BarChart3,
      description: "Pricing your property correctly is crucial for a successful sale.",
      items: [
        "Request a Comparative Market Analysis (CMA) from your broker",
        "Review recent sales of similar properties in your area",
        "Consider current market conditions and buyer demand",
        "Set a realistic price that attracts serious buyers"
      ]
    },
    {
      number: 3,
      title: "Documentation & Listing",
      icon: FileText,
      description: "Ensure all paperwork is in order and create an attractive listing.",
      items: [
        "Gather your title deed, passport copies, and Emirates ID",
        "Obtain No Objection Certificate (NOC) requirements from your developer",
        "Professional photography and videography of your property",
        "Create compelling listing descriptions highlighting key features"
      ]
    },
    {
      number: 4,
      title: "Marketing & Viewings",
      icon: Camera,
      description: "Maximum exposure brings qualified buyers to your door.",
      items: [
        "List on major property portals: Property Finder, Bayut, Dubizzle",
        "Social media marketing and targeted advertising campaigns",
        "Flexible viewing schedules to accommodate potential buyers",
        "Virtual tours for overseas or remote buyers"
      ]
    },
    {
      number: 5,
      title: "Offer Negotiation",
      icon: Handshake,
      description: "Your broker will help you evaluate and negotiate offers effectively.",
      items: [
        "Review all offers with your broker, considering price and terms",
        "Negotiate payment timeline, deposit amount, and conditions",
        "Consider buyer's financial readiness and timeline",
        "Accept the offer that best meets your needs"
      ]
    },
    {
      number: 6,
      title: "Transfer & Completion",
      icon: Key,
      description: "The final steps to complete the sale and transfer ownership.",
      items: [
        "Sign the Memorandum of Understanding (MOU) with the buyer",
        "Apply for NOC from your developer (typically takes 2-5 working days)",
        "Attend transfer at Dubai Land Department or trustee office",
        "Receive payment and hand over keys to the new owner"
      ]
    }
  ];

  const costs = [
    { label: "Agency Commission", value: "2% of sale price", note: "Standard market rate" },
    { label: "NOC Fee", value: "AED 500-5,000", note: "Varies by developer" },
    { label: "Transfer Fee", value: "4% of sale price", note: "Typically paid by buyer" },
    { label: "Mortgage Settlement", value: "Varies", note: "If applicable" }
  ];

  const tips = [
    {
      icon: Clock,
      title: "Timing Matters",
      description: "Spring and autumn typically see higher buyer activity. Avoid listing during major holidays or Ramadan if possible."
    },
    {
      icon: Calculator,
      title: "Be Realistic",
      description: "Overpricing leads to longer time on market and eventual price reductions. Trust the market data."
    },
    {
      icon: Shield,
      title: "Choose the Right Broker",
      description: "Work with a RERA-registered broker with experience in your area and property type."
    },
    {
      icon: Banknote,
      title: "Understand Your Costs",
      description: "Factor in all selling costs when setting your expectations for net proceeds."
    }
  ];

  const faqs = [
    {
      question: "How long does it take to sell a property in Dubai?",
      answer: "On average, a well-priced property in a desirable location can sell within 1-3 months. However, this varies based on market conditions, property type, location, and pricing strategy."
    },
    {
      question: "Can I sell if I still have a mortgage?",
      answer: "Yes, you can sell with an existing mortgage. The mortgage will be settled from the sale proceeds, or the buyer can take over the mortgage with bank approval (liability transfer)."
    },
    {
      question: "Do I need to be in Dubai for the sale?",
      answer: "Not necessarily. You can grant Power of Attorney (POA) to a trusted representative to handle the sale on your behalf. Ensure the POA is properly attested and notarized."
    },
    {
      question: "What is a No Objection Certificate (NOC)?",
      answer: "An NOC is a document from the developer confirming no outstanding service charges or fees on the property. It's required for transfer and typically costs AED 500-5,000."
    },
    {
      question: "How is the commission calculated?",
      answer: "Standard commission is 2% of the sale price plus 5% VAT on the commission. This is typically paid by the seller upon successful completion."
    }
  ];

  return (
    <>
      <SEOHead 
        title="Seller Guide | How to Sell Property in Dubai | JBJ Global Real Estate"
        description="Complete guide to selling property in Dubai. Learn about pricing, documentation, marketing, and the transfer process with JBJ Global Real Estate."
      />
      
      <main className="min-h-screen bg-black">
        {/* Hero Section */}
        <section className="relative pt-24 pb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-6">
                Complete Seller's Guide
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Sell Your Property in <span className="text-gold">Dubai</span>
              </h1>
              <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
                A step-by-step guide to selling your property successfully, from preparation to handover
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/property-evaluator">
                  <Button className="bg-gradient-to-r from-gold to-gold-dark text-black hover:brightness-110 px-6 py-3">
                    <Calculator className="w-5 h-5 mr-2" />
                    Get Free Valuation
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800 px-6 py-3">
                    <Phone className="w-5 h-5 mr-2" />
                    Speak to an Agent
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-white text-center mb-12">
                The Selling Process
              </h2>
              
              <div className="space-y-8">
                {steps.map((step, index) => (
                  <div 
                    key={step.number}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 md:p-8"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                        <step.icon className="w-6 h-6 text-gold" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-gold font-bold text-sm">Step {step.number}</span>
                          <h3 className="text-xl font-bold text-white">{step.title}</h3>
                        </div>
                        <p className="text-zinc-400 mb-4">{step.description}</p>
                        <ul className="space-y-2">
                          {step.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-zinc-300">
                              <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Selling Costs */}
        <section className="py-16 bg-zinc-900/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-white text-center mb-4">
                <Banknote className="w-8 h-8 text-gold inline-block mr-2 align-middle" />
                Selling Costs
              </h2>
              <p className="text-zinc-400 text-center mb-8">
                Understand the costs involved in selling your property
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {costs.map((cost, index) => (
                  <div key={index} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-white font-medium">{cost.label}</span>
                      <span className="text-gold font-bold">{cost.value}</span>
                    </div>
                    <p className="text-zinc-500 text-sm">{cost.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-white text-center mb-12">
                Tips for a Successful Sale
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {tips.map((tip, index) => (
                  <div key={index} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mb-4">
                      <tip.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{tip.title}</h3>
                    <p className="text-zinc-400">{tip.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-zinc-900/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-white text-center mb-12">
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-2">{faq.question}</h3>
                    <p className="text-zinc-400">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30 rounded-2xl p-8 md:p-12">
              <ClipboardCheck className="w-12 h-12 text-gold mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to Sell?
              </h2>
              <p className="text-zinc-400 mb-6">
                Get a free property valuation and expert advice from our experienced team
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/property-evaluator">
                  <Button className="bg-gradient-to-r from-gold to-gold-dark text-black hover:brightness-110 px-6">
                    <Calculator className="w-5 h-5 mr-2" />
                    Free Valuation
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" className="border-gold/50 text-gold hover:bg-gold/10">
                    <Phone className="w-5 h-5 mr-2" />
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default SellerGuide;
