import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  CheckCircle2, 
  Search, 
  Eye, 
  FileText, 
  Home, 
  MapPin,
  Users,
  Building2,
  Globe,
  ArrowRight,
  Shield
} from "lucide-react";

const BuyerGuide = () => {
  const steps = [
    {
      number: 1,
      title: "Define Your Requirements",
      icon: Search,
      items: [
        "Establish your budget range and financing options",
        "Identify preferred areas and communities",
        "Determine property type (apartment, villa, townhouse, penthouse)",
        "Clarify purpose — primary residence or long-term holding"
      ]
    },
    {
      number: 2,
      title: "Explore Available Properties",
      icon: Building2,
      items: [
        "Browse current listings and off-plan developments",
        "Research communities and neighborhoods",
        "Review developer track records and project timelines",
        "Create a shortlist of properties that match your criteria"
      ]
    },
    {
      number: 3,
      title: "Property Viewings",
      icon: Eye,
      items: [
        "Schedule physical or virtual property tours",
        "Assess build quality, layout, and natural lighting",
        "Evaluate amenities and surrounding infrastructure",
        "Ask questions about service charges and handover timelines"
      ]
    },
    {
      number: 4,
      title: "Making an Offer",
      icon: FileText,
      items: [
        "Submit a formal offer through your broker",
        "Engage in negotiation with the seller or developer",
        "Receive confirmation of seller acceptance",
        "Proceed to the documentation stage"
      ]
    },
    {
      number: 5,
      title: "Documentation & Contracts",
      icon: Shield,
      items: [
        "Sign a Memorandum of Understanding (MOU)",
        "Provide valid identification documents (passport, Emirates ID)",
        "Pay reservation deposits as agreed",
        "Review all terms with independent legal counsel if needed"
      ]
    },
    {
      number: 6,
      title: "Transfer & Completion",
      icon: Home,
      items: [
        "Obtain No Objection Certificate (NOC) from the developer",
        "Complete transfer at the Dubai Land Department trustee office",
        "Pay final transfer fees and receive title deed",
        "Collect keys and complete property handover"
      ]
    }
  ];

  const costs = [
    "Dubai Land Department registration fees",
    "Trustee office fees",
    "Agency brokerage fees",
    "Developer fees (for off-plan properties, if applicable)"
  ];

  const whyJBJ = [
    "Licensed Dubai mainland real estate brokerage",
    "Deep local market knowledge and area expertise",
    "Structured, transparent buying process",
    "Partner introductions for legal and mortgage services through independent licensed providers"
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead {...pagesSEO.buyerGuide} />

      {/* Hero Section */}
      <section className="relative py-24 md:py-32 bg-gradient-to-b from-zinc-900 to-black overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 mb-6">
              <FileText className="w-4 h-4 text-gold" />
              <span className="text-gold text-sm font-medium tracking-wide">BUYER'S GUIDE</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight">
              Buyer's Guide to Purchasing <br className="hidden md:block" />
              <span className="text-gold">Property in Dubai</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-zinc-300 font-light leading-relaxed max-w-3xl mx-auto">
              A clear, step-by-step overview to help you navigate the property buying process with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Who This Guide Is For */}
      <section className="py-16 md:py-24 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-light text-zinc-900 mb-6">
              Who This Guide Is For
            </h2>
            <p className="text-lg text-zinc-600 leading-relaxed mb-10">
              Whether you're a first-time buyer exploring Dubai's property market, an end user seeking a new home, 
              an international buyer looking to own property in the UAE, or someone relocating for work or lifestyle — 
              this guide provides the essential information you need to make informed decisions with clarity and confidence.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Users, label: "First-Time Buyers" },
                { icon: Home, label: "End Users" },
                { icon: Globe, label: "International Buyers" },
                { icon: MapPin, label: "Relocators" }
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100">
                  <item.icon className="w-8 h-8 text-gold mx-auto mb-3" />
                  <p className="text-sm font-medium text-zinc-800">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-Step Buying Process */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-light text-zinc-900 mb-4">
                Step-by-Step Buying Process
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                Understanding each phase of the property purchase journey in Dubai.
              </p>
            </div>

            <div className="space-y-8">
              {steps.map((step, index) => (
                <div 
                  key={step.number}
                  className="bg-zinc-50 rounded-2xl p-8 md:p-10 border border-zinc-100 hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center">
                        <span className="text-gold text-xl font-semibold">{step.number}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <step.icon className="w-5 h-5 text-gold" />
                        <h3 className="text-xl md:text-2xl font-medium text-zinc-900">
                          {step.title}
                        </h3>
                      </div>
                      <ul className="space-y-3">
                        {step.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                            <span className="text-zinc-600">{item}</span>
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

      {/* Costs to Be Aware Of */}
      <section className="py-16 md:py-24 bg-zinc-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                Costs to Be Aware Of
              </h2>
              <p className="text-lg text-zinc-400">
                Key fees associated with property transactions in Dubai.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {costs.map((cost, index) => (
                <div 
                  key={index}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-white">{cost}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-zinc-500 text-sm mt-8">
              Exact amounts vary by transaction type and property value. Consult with your broker for detailed estimates.
            </p>
          </div>
        </div>
      </section>

      {/* Buying as a Non-Resident */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-gold/5 to-transparent border border-gold/20 rounded-2xl p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-8 h-8 text-gold" />
                <h2 className="text-3xl md:text-4xl font-light text-zinc-900">
                  Buying as a Non-Resident
                </h2>
              </div>
              
              <p className="text-lg text-zinc-600 leading-relaxed mb-6">
                Non-residents are permitted to purchase property in designated freehold areas across Dubai. 
                UAE residency is not required to own property. Many international buyers successfully 
                purchase homes in popular areas such as Downtown Dubai, Dubai Marina, Palm Jumeirah, 
                Business Bay, and many other freehold communities.
              </p>
              
              <p className="text-zinc-600 leading-relaxed">
                The process for non-residents follows the same steps outlined in this guide. 
                Your broker can provide guidance specific to your situation and connect you 
                with appropriate legal support if needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With JBJ */}
      <section className="py-16 md:py-24 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-zinc-900 mb-4">
                Why Work With JBJ Global Real Estate
              </h2>
              <p className="text-lg text-zinc-600">
                Your trusted partner for property purchases in Dubai.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {whyJBJ.map((item, index) => (
                <div 
                  key={index}
                  className="bg-white border border-zinc-200 rounded-xl p-6 flex items-start gap-4"
                >
                  <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-zinc-800">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-zinc-900 to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              Ready to Begin Your Property Journey?
            </h2>
            <p className="text-lg text-zinc-400 mb-10">
              Explore available properties or speak with our team to get started.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                size="lg"
                className="bg-gold hover:bg-gold/90 text-black font-medium px-8"
              >
                <Link to="/properties">
                  Explore Available Properties
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              
              <Button 
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-8"
              >
                <Link to="/contact">
                  Speak With Our Team
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="py-8 bg-black border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <p className="text-center text-zinc-500 text-sm max-w-3xl mx-auto">
            This guide is for general informational purposes only and does not constitute legal, 
            financial, or professional advice. Buyers should conduct independent due diligence 
            and consult with qualified professionals before making any property purchase decisions.
          </p>
        </div>
      </section>
    </div>
  );
};

export default BuyerGuide;