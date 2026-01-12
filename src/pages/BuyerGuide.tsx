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
  Shield,
  AlertTriangle,
  Banknote,
  Key,
  Clock,
  XCircle,
  Landmark,
  Calculator,
  HelpCircle,
  Phone,
  ArrowDown
} from "lucide-react";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { GuideHero } from "@/components/guides/GuideHero";
import { GuideTableOfContents } from "@/components/guides/GuideTableOfContents";
import Footer from "@/components/Footer";

const BuyerGuide = () => {
  const steps = [
    {
      number: 1,
      title: "Define Your Requirements",
      icon: Search,
      description: "Start by clarifying what you're looking for. This saves time and helps your broker find the right match.",
      items: [
        "Establish your budget range and explore financing options if needed",
        "Identify preferred areas, communities, and proximity to key locations",
        "Determine property type: apartment, villa, townhouse, or penthouse",
        "Clarify your purpose — primary residence, family home, or future planning"
      ]
    },
    {
      number: 2,
      title: "Explore Available Properties",
      icon: Building2,
      description: "With clear requirements, you can now explore options that truly match your needs.",
      items: [
        "Browse ready properties and off-plan developments across Dubai",
        "Research communities, amenities, and neighborhood lifestyle",
        "Review developer track records, handover timelines, and build quality",
        "Create a shortlist of 3–5 properties that fit your criteria"
      ]
    },
    {
      number: 3,
      title: "Property Viewings",
      icon: Eye,
      description: "Nothing replaces seeing a property in person. This is where you make confident decisions.",
      items: [
        "Schedule physical viewings or virtual tours for overseas buyers",
        "Assess layout, natural lighting, ventilation, and finishing quality",
        "Evaluate building amenities: gym, pool, parking, security",
        "Ask about service charges, maintenance fees, and handover conditions"
      ]
    },
    {
      number: 4,
      title: "Making an Offer",
      icon: FileText,
      description: "Once you've found the right property, your broker will help you submit a formal offer.",
      items: [
        "Submit a written offer through your broker to the seller or developer",
        "Negotiate price, payment terms, and any included furnishings",
        "Receive formal acceptance confirmation from the seller",
        "Agree on timeline for next steps and documentation"
      ]
    },
    {
      number: 5,
      title: "Documentation & Contracts",
      icon: Shield,
      description: "This stage formalizes the agreement. Ensure all documents are reviewed carefully.",
      items: [
        "Sign a Memorandum of Understanding (MOU) outlining agreed terms",
        "Provide valid identification: passport and Emirates ID (if applicable)",
        "Pay the agreed deposit (typically 10% for resale properties)",
        "Consider engaging independent legal counsel for contract review"
      ]
    },
    {
      number: 6,
      title: "Transfer & Completion",
      icon: Home,
      description: "The final step where ownership is officially transferred to you.",
      items: [
        "Obtain a No Objection Certificate (NOC) from the developer",
        "Attend the transfer at a Dubai Land Department trustee office",
        "Pay remaining balance and all applicable transfer fees",
        "Receive your title deed and collect your keys"
      ]
    }
  ];

  const ownershipTypes = [
    {
      title: "Freehold Ownership",
      icon: Key,
      description: "Full ownership of property and land with no time restrictions.",
      points: [
        "Available to all nationalities in designated freehold areas",
        "Popular areas: Dubai Marina, Downtown, Palm Jumeirah, JBR, Business Bay",
        "You own the property outright — can sell, lease, or pass to heirs",
        "Most common choice for international and local buyers"
      ]
    },
    {
      title: "Leasehold Ownership",
      icon: Clock,
      description: "Long-term lease rights, typically 10 to 99 years depending on the area.",
      points: [
        "Property rights for a fixed period, then reverts to landowner",
        "Common in certain older or non-freehold areas",
        "Often more affordable than freehold options",
        "Terms and renewal conditions vary by development"
      ]
    }
  ];

  const costs = [
    {
      title: "Dubai Land Department Fee",
      description: "4% of the property purchase price, paid at transfer",
      icon: Landmark
    },
    {
      title: "Trustee Office Fee",
      description: "Approximately AED 4,000 – 5,000 for the transfer process",
      icon: FileText
    },
    {
      title: "Agency Commission",
      description: "Typically 2% of the purchase price, paid to the brokerage",
      icon: Users
    },
    {
      title: "NOC Fee",
      description: "Varies by developer, usually AED 500 – 5,000",
      icon: Shield
    },
    {
      title: "Mortgage Registration (if applicable)",
      description: "0.25% of the loan amount plus admin fees",
      icon: Calculator
    },
    {
      title: "Conveyancing / Legal Fees",
      description: "If you engage a lawyer, fees vary based on complexity",
      icon: FileText
    }
  ];

  const mortgagePoints = [
    "UAE residents and non-residents can both apply for mortgages in Dubai",
    "Banks typically finance 50–80% of the property value depending on buyer profile",
    "Non-residents usually qualify for lower loan-to-value ratios",
    "Pre-approval is recommended before starting your property search",
    "Interest rates and terms vary between banks — compare multiple offers",
    "JBJ can introduce you to independent licensed mortgage advisors"
  ];

  const commonMistakes = [
    {
      title: "Not Defining a Clear Budget",
      description: "Failing to account for all costs (fees, furnishing, service charges) can lead to unexpected financial pressure.",
      icon: Banknote
    },
    {
      title: "Skipping Due Diligence",
      description: "Not verifying developer track records, handover history, or property condition before committing.",
      icon: Search
    },
    {
      title: "Rushing the Decision",
      description: "Feeling pressured to buy quickly without viewing enough options or understanding the area.",
      icon: Clock
    },
    {
      title: "Ignoring Service Charges",
      description: "Annual service charges vary significantly between buildings and can impact long-term costs.",
      icon: Calculator
    },
    {
      title: "Not Using a Licensed Broker",
      description: "Working with unlicensed agents puts you at risk of fraud and poor service with no recourse.",
      icon: Shield
    },
    {
      title: "Overlooking Legal Review",
      description: "Signing contracts without professional legal review can lead to unfavorable terms.",
      icon: FileText
    }
  ];

  const whyJBJ = [
    {
      title: "Licensed Dubai Brokerage",
      description: "Fully licensed under Dubai's DED mainland regulations with RERA-registered agents."
    },
    {
      title: "Market Expertise",
      description: "Deep knowledge of Dubai's communities, developers, and market dynamics."
    },
    {
      title: "Transparent Process",
      description: "Clear communication at every step with no hidden agendas or pressure tactics."
    },
    {
      title: "Partner Network",
      description: "Introductions to independent licensed professionals for legal and mortgage services."
    }
  ];

  const tocItems = [
    { id: 'who-this-guide-for', title: 'Who Is This For', icon: Users },
    { id: 'ownership-types', title: 'Ownership Types', icon: Key },
    { id: 'buying-process', title: 'Buying Process', icon: FileText },
    { id: 'costs-fees', title: 'Costs & Fees', icon: Calculator },
    { id: 'mortgages', title: 'Mortgages', icon: Landmark },
    { id: 'common-mistakes', title: 'Common Mistakes', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead {...pagesSEO.buyerGuide} />

      {/* Premium Hero */}
      <GuideHero
        badge="Complete Buyer's Guide"
        badgeIcon={FileText}
        title={
          <>
            Your Complete Guide to{" "}
            <span className="text-gold">Buying Property in Dubai</span>
          </>
        }
        description="A clear, educational resource to help you understand the property buying process in Dubai. Whether you're a first-time buyer or an experienced purchaser, this guide covers everything you need to make informed decisions."
        backgroundImage="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=80"
        actions={
          <>
            <Button 
              variant="outline"
              className="border-gold/50 text-gold hover:bg-gold/10 px-6"
              onClick={() => document.getElementById('buying-process')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <ArrowDown className="w-4 h-4 mr-2" />
              Read the Full Guide
            </Button>
            <Button asChild className="bg-gold hover:bg-gold/90 text-black font-medium px-6">
              <Link to="/properties">
                Browse Properties
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </>
        }
      />

      {/* Sticky Table of Contents */}
      <div className="hidden lg:block fixed right-8 top-1/3 z-30">
        <GuideTableOfContents items={tocItems} />
      </div>

      {/* Introduction - Who This Guide Is For */}
      <section id="who-this-guide-for" className="py-16 md:py-24 bg-zinc-900/30 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
                Who This Guide Is For
              </h2>
              <p className="text-lg text-zinc-400 leading-relaxed max-w-3xl mx-auto">
                Dubai's property market welcomes buyers from all over the world. Whether you're planning 
                to make Dubai your home, securing a property for your family, or exploring options for 
                the future — this guide provides the foundational knowledge you need.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { icon: Users, label: "First-Time Buyers", desc: "New to UAE real estate" },
                { icon: Home, label: "Homeowners", desc: "Buying for personal use" },
                { icon: Globe, label: "International Buyers", desc: "Purchasing from abroad" },
                { icon: MapPin, label: "Relocators", desc: "Moving to Dubai" }
              ].map((item, index) => (
                <div key={index} className="bg-zinc-900/60 rounded-xl p-6 border border-zinc-800 text-center hover:border-gold/30 transition-colors">
                  <div className="w-12 h-12 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-gold" />
                  </div>
                  <p className="font-medium text-white mb-1">{item.label}</p>
                  <p className="text-sm text-zinc-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ownership Types */}
      <section id="ownership-types" className="py-16 md:py-24 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-zinc-900 mb-4">
                Understanding Ownership Types
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                Dubai offers two main ownership structures. Understanding the difference helps you 
                choose what's right for your situation.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {ownershipTypes.map((type, index) => (
                <div 
                  key={index}
                  className="bg-zinc-50 rounded-2xl p-8 border border-zinc-100 hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center">
                      <type.icon className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-zinc-900">{type.title}</h3>
                      <p className="text-sm text-zinc-500">{type.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {type.points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                        <span className="text-zinc-600 text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-Step Buying Process */}
      <section id="buying-process" className="py-16 md:py-24 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-light text-zinc-900 mb-4">
                The 6-Step Buying Process
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                A clear roadmap from defining your requirements to receiving your keys. 
                Each step is designed to keep you informed and confident.
              </p>
            </div>

            <div className="space-y-6">
              {steps.map((step) => (
                <div 
                  key={step.number}
                  className="bg-white rounded-2xl p-6 md:p-8 border border-zinc-200 hover:border-gold/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 rounded-2xl flex items-center justify-center">
                        <span className="text-gold text-2xl font-semibold">{step.number}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <step.icon className="w-5 h-5 text-gold" />
                        <h3 className="text-xl md:text-2xl font-medium text-zinc-900">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-zinc-500 mb-4">{step.description}</p>
                      <ul className="grid md:grid-cols-2 gap-3">
                        {step.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
                            <span className="text-zinc-600 text-sm">{item}</span>
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

      {/* Costs & Fees */}
      <section id="costs-fees" className="py-16 md:py-24 bg-zinc-900/50 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                Costs & Fees Overview
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Transparency is essential. Here are the key costs you should budget for 
                when purchasing property in Dubai.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {costs.map((cost, index) => (
                <div 
                  key={index}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <cost.icon className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">{cost.title}</h4>
                      <p className="text-zinc-400 text-sm">{cost.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-zinc-800/30 border border-zinc-700 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <p className="text-zinc-400 text-sm">
                  <span className="text-white font-medium">Note:</span> Exact amounts vary based on property value, 
                  transaction type, and specific circumstances. Your broker will provide detailed cost estimates 
                  based on your specific purchase.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mortgages Explained */}
      <section id="mortgages" className="py-16 md:py-24 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-gold/5 to-transparent border border-gold/20 rounded-2xl p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <Landmark className="w-8 h-8 text-gold" />
                <h2 className="text-3xl md:text-4xl font-light text-zinc-900">
                  Mortgages in Dubai
                </h2>
              </div>
              
              <p className="text-lg text-zinc-600 leading-relaxed mb-8">
                If you're considering financing your purchase, here's what you need to know about 
                mortgages in Dubai. Many banks offer competitive mortgage products for both 
                residents and non-residents.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {mortgagePoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-600 text-sm">{point}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white/50 border border-gold/10 rounded-xl p-4">
                <p className="text-zinc-500 text-sm">
                  <span className="text-zinc-700 font-medium">Important:</span> JBJ Global Real Estate 
                  does not provide mortgage or financial advice. We can introduce you to independent 
                  licensed mortgage advisors who can assess your situation and provide tailored guidance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Common Buyer Mistakes */}
      <section id="common-mistakes" className="py-16 md:py-24 bg-zinc-900/30 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-red-600 text-sm font-medium">Avoid These Pitfalls</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-light text-zinc-900 mb-4">
                Common Buyer Mistakes
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                Learning from others' mistakes can save you time, money, and stress. 
                Here are the most common pitfalls to avoid.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {commonMistakes.map((mistake, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-xl p-6 border border-zinc-200 hover:border-red-200 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-zinc-900 font-medium mb-2">{mistake.title}</h4>
                      <p className="text-zinc-500 text-sm">{mistake.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Buying as a Non-Resident */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-zinc-900 rounded-2xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-light text-white">
                    Buying as a Non-Resident
                  </h2>
                </div>
                
                <p className="text-lg text-zinc-300 leading-relaxed mb-6">
                  Dubai welcomes international buyers. Non-residents can purchase property in 
                  designated freehold areas without needing UAE residency. This has made Dubai 
                  one of the most accessible property markets in the world.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {[
                    "No residency requirement for freehold purchases",
                    "Popular with buyers from Europe, Asia, and the Americas",
                    "Same buying process as resident purchasers",
                    "Remote viewing and purchase options available"
                  ].map((point, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-300 text-sm">{point}</span>
                    </div>
                  ))}
                </div>
                
                <p className="text-zinc-400">
                  Your broker can guide you through the specific requirements and connect you 
                  with appropriate legal support if needed for your situation.
                </p>
              </div>
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
                How JBJ Supports Your Purchase
              </h2>
              <p className="text-lg text-zinc-600">
                As a licensed Dubai brokerage, we guide you through every step of the buying process.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {whyJBJ.map((item, index) => (
                <div 
                  key={index}
                  className="bg-white border border-zinc-200 rounded-xl p-6 hover:border-gold/30 transition-colors"
                >
                  <h4 className="text-zinc-900 font-medium mb-2">{item.title}</h4>
                  <p className="text-zinc-500 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Book Consultation */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-zinc-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-6">
              Ready to Start Your Property Journey?
            </h2>
            <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto">
              Speak with our team to discuss your requirements, explore available properties, 
              or get answers to your questions. No pressure — just expert guidance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                size="lg"
                className="bg-gold hover:bg-gold/90 text-black font-medium px-8 h-14 text-base"
              >
                <Link to="/contact">
                  <Phone className="w-4 h-4 mr-2" />
                  Book a Consultation
                </Link>
              </Button>
              
              <Button 
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-8 h-14 text-base"
              >
                <Link to="/properties">
                  Explore Properties
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="py-8 bg-black border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-zinc-500 text-sm leading-relaxed">
              <span className="text-zinc-400 font-medium">Disclaimer:</span> This guide is provided 
              for general educational and informational purposes only. It does not constitute legal, 
              financial, mortgage, or professional advice. JBJ Global Real Estate is a licensed 
              real estate brokerage and does not provide legal or financial advisory services. 
              Buyers should conduct independent due diligence and consult with qualified 
              professionals before making any property purchase decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Guide Navigation */}
      <section className="py-8 bg-black border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/buyer-guide" guides={GUIDE_LINKS} showStartHere={false} />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BuyerGuide;
