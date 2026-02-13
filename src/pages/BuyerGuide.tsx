import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FounderPhilosophySection } from "@/components/FounderPhilosophySection";
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
  ArrowDown,
  Sparkles,
  Target,
  Wallet,
  HandshakeIcon,
  Scale,
  CreditCard,
  Briefcase
} from "lucide-react";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import DLDMarketWidget from "@/components/shared/DLDMarketWidget";
import { GuideHero } from "@/components/guides/GuideHero";
import { GuideTableOfContents } from "@/components/guides/GuideTableOfContents";
import { GuideSectionHeader } from "@/components/guides/GuideSectionHeader";
import { SectionDivider } from "@/components/ui/section-divider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const BuyerGuide = () => {
  const audienceTypes = [
    { icon: Users, label: "First-time buyers in Dubai", desc: "New to UAE Real Estate" },
    { icon: Globe, label: "International investors", desc: "Purchasing from abroad" },
    { icon: Home, label: "End-users purchasing a primary residence", desc: "Buying for personal use" },
    { icon: Building2, label: "Buyers considering off-plan or ready properties", desc: "Exploring all options" }
  ];

  const buyingSteps = [
    {
      number: 1,
      title: "Define Your Objective",
      icon: Target,
      description: "Before viewing properties, determine:",
      items: [
        "Purpose: end-use or investment",
        "Budget range (including fees)",
        "Preferred locations",
        "Property type (apartment, villa, townhouse)",
        "Timeline (immediate move-in vs future delivery)"
      ]
    },
    {
      number: 2,
      title: "Choose Between Off-Plan & Ready Properties",
      icon: Building2,
      description: "Understanding your options:",
      isComparison: true,
      offPlan: {
        title: "Off-Plan Properties",
        points: [
          "Purchased directly from developers",
          "Flexible payment plans",
          "Lower entry price compared to ready units",
          "Completion depends on construction timeline"
        ]
      },
      ready: {
        title: "Ready Properties",
        points: [
          "Immediate handover",
          "Existing rental income (if tenanted)",
          "Clear market valuation",
          "Higher upfront capital required"
        ]
      }
    },
    {
      number: 3,
      title: "Viewing & Property Selection",
      icon: Eye,
      description: "Property selection process:",
      items: [
        "Shortlisted properties based on your criteria",
        "Physical or virtual viewings",
        "Comparative market analysis provided",
        "Clear explanation of pros, risks, and exit scenarios"
      ]
    },
    {
      number: 4,
      title: "Making an Offer",
      icon: FileText,
      description: "Formalizing your interest:",
      isOfferComparison: true,
      readyOffer: {
        title: "Ready Property",
        points: [
          "Offer submitted in writing",
          "Negotiation handled on your behalf",
          "Memorandum of Understanding (Form F) issued",
          "Deposit typically 10%"
        ]
      },
      offPlanOffer: {
        title: "Off-Plan",
        points: [
          "Unit reservation with booking form",
          "Initial payment as per developer plan",
          "Sales Purchase Agreement (SPA) issued"
        ]
      }
    },
    {
      number: 5,
      title: "Legal & Regulatory Protection",
      icon: Shield,
      description: "Your transaction is protected:",
      items: [
        "All transactions registered with Dubai Land Department",
        "Escrow accounts mandatory for off-plan projects",
        "Developers regulated by RERA",
        "Ownership protected under UAE property law"
      ]
    },
    {
      number: 6,
      title: "Transfer & Completion",
      icon: Key,
      description: "Final steps to ownership:",
      isTransferComparison: true,
      readyTransfer: {
        title: "Ready Property",
        points: [
          "NOC obtained from developer",
          "Transfer completed at trustee office",
          "Title deed issued same day"
        ]
      },
      offPlanTransfer: {
        title: "Off-Plan Property",
        points: [
          "Payments follow construction milestones",
          "Handover upon project completion",
          "Title deed issued after final payment"
        ]
      }
    }
  ];

  const offPlanCosts = [
    "No agency fees are paid by the buyer",
    "Developers pay the brokerage commission",
    "Buyer pays only: Unit price as per payment plan",
    "Dubai Land Department (DLD) registration fees",
    "Oqood registration (for off-plan)"
  ];

  const readyCosts = [
    "Buyer pays agency commission",
    "Standard market rate: 2% + VAT",
    "This fee covers: Property sourcing & shortlisting",
    "Negotiation support",
    "Transaction coordination",
    "Legal & transfer guidance"
  ];

  const governmentFees = [
    {
      title: "Dubai Land Department fee",
      description: "4% of purchase price",
      icon: Landmark
    },
    {
      title: "Trustee office fee",
      description: "Required for transfer process",
      icon: FileText
    },
    {
      title: "Title deed issuance",
      description: "Official ownership document",
      icon: Shield
    },
    {
      title: "Oqood registration",
      description: "For off-plan purchases",
      icon: FileText
    }
  ];

  const additionalCosts = [
    {
      title: "Mortgage registration",
      description: "If financing",
      icon: Calculator
    },
    {
      title: "Bank valuation fees",
      description: "Required by lenders",
      icon: Banknote
    },
    {
      title: "Conveyancing or legal support",
      description: "Optional",
      icon: Scale
    },
    {
      title: "Service charges",
      description: "Annual, building-dependent",
      icon: Wallet
    }
  ];

  const mortgagePoints = [
    "Available for residents & non-residents",
    "Loan-to-value varies by residency status",
    "Pre-approval recommended before committing",
    "Bank coordination supported through licensed partners"
  ];

  const jbjSupport = [
    {
      title: "Market-driven property selection",
      description: "Properties matched to your objectives and market conditions"
    },
    {
      title: "Transparent pricing guidance",
      description: "Clear breakdown of all costs with no hidden fees"
    },
    {
      title: "No pressure selling",
      description: "Objective advice focused on your best interests"
    },
    {
      title: "Risk explanation before commitment",
      description: "Full disclosure of potential risks and considerations"
    },
    {
      title: "Coordination with developers, trustees, and partners",
      description: "End-to-end transaction management"
    },
    {
      title: "Post-purchase support where applicable",
      description: "Ongoing assistance after completion"
    }
  ];

  const faqs = [
    {
      question: "Do I pay agency fees when buying off-plan?",
      answer: "No. Off-plan buyers do not pay agency fees. The developer pays the brokerage commission."
    },
    {
      question: "Do I pay agency fees when buying a ready property?",
      answer: "Yes. Buyers typically pay 2% + VAT as agency commission for ready properties."
    },
    {
      question: "Can foreigners buy property in Dubai?",
      answer: "Yes. Foreign buyers can own freehold property in designated areas."
    },
    {
      question: "Is buying off-plan risky?",
      answer: "Dubai law regulates developers and escrow accounts. Risk depends on developer credibility, which is assessed before recommendation."
    },
    {
      question: "Do I need residency to buy property?",
      answer: "No residency is required to purchase property."
    },
    {
      question: "Can I buy remotely from abroad?",
      answer: "Yes. Purchases can be completed remotely via Power of Attorney."
    },
    {
      question: "Does buying property give me residency?",
      answer: "Certain property values may qualify for UAE residency visas under government programs."
    },
    {
      question: "How long does the buying process take?",
      answer: "Ready properties: approx. 4–6 weeks. Off-plan: depends on construction timeline."
    }
  ];

  const tocItems = [
    { id: 'who-this-guide-for', title: 'Who Is This For', icon: Users },
    { id: 'buying-process', title: 'Buying Process', icon: FileText },
    { id: 'agency-fees', title: 'Agency Fees & Costs', icon: Wallet },
    { id: 'buyer-costs', title: 'Buyer Costs Overview', icon: Calculator },
    { id: 'mortgages', title: 'Mortgages', icon: Landmark },
    { id: 'jbj-support', title: 'How JBJ Supports You', icon: HandshakeIcon },
    { id: 'faqs', title: 'FAQs', icon: HelpCircle },
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
            Buying Property in Dubai —{" "}
            <span className="text-gold">A Clear, Confident Guide for Buyers</span>
          </>
        }
        description="Buying property in Dubai is a structured, regulated process designed to protect buyers, investors, and end-users. This guide explains how to buy, what to expect, what you pay, and how JBJ Global Real Estate supports you at every step — with clarity, transparency, and compliance."
        backgroundImage="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=80"
        actions={
          <>
            <button 
              onClick={() => document.getElementById('buying-process')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold rounded-lg md:rounded-xl transition-all duration-300 bg-transparent"
              style={{
                border: '2px solid rgba(255,255,255,0.8)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
              }}
            >
              <ArrowDown className="w-4 h-4 text-gold group-hover:text-black transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
              <span className="text-white group-hover:text-black transition-colors">Read the Full Guide</span>
              <span className="absolute inset-0 rounded-lg md:rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
            </button>
            <Link to="/properties?transaction=buy">
              <button 
                className="group relative inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold rounded-lg md:rounded-xl transition-all duration-300 bg-transparent"
                style={{
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                <span className="text-white group-hover:text-black transition-colors">Browse Properties</span>
                <ArrowRight className="w-4 h-4 text-gold group-hover:text-black transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                <span className="absolute inset-0 rounded-lg md:rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
              </button>
            </Link>
          </>
        }
      />

      {/* Divider between Hero and Who This Guide Is For */}
      <SectionDivider />

      {/* Sticky Table of Contents - z-[60] to appear above JBJ support widget */}
      <div className="hidden lg:block fixed right-8 top-1/4 z-[60] max-w-xs">
        <GuideTableOfContents 
          items={tocItems}
          ctaAction={{
            label: "Find Your Property Now",
            href: "/properties?transaction=buy",
            icon: Sparkles
          }}
        />
      </div>

      {/* Introduction - Who This Guide Is For */}
      <section id="who-this-guide-for" className="py-16 md:py-24 jj-section-champagne scroll-mt-20">
        <div className="jj-guide-content">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-black mb-6">
              <span className="text-gold">Who</span> This Guide Is For
            </h2>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {audienceTypes.map((item, index) => (
              <div key={index} className="jj-box-active p-6 text-center hover:border-gold hover:shadow-lg transition-all">
                <div className="jj-icon-box-active w-12 h-12 rounded-xl mx-auto mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <p className="font-medium text-black mb-1">{item.label}</p>
                <p className="text-sm text-zinc-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Step-by-Step Buying Process */}
      <section id="buying-process" className="py-16 md:py-24 jj-section-champagne scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={FileText} title="Step by Step Buying Process" />

            <div className="space-y-6">
              {buyingSteps.map((step) => (
                <div 
                  key={step.number}
                  className="jj-box-active p-6 md:p-8 hover:border-gold hover:shadow-lg transition-all duration-300"
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
                      
                      {step.items && (
                        <ul className="grid md:grid-cols-2 gap-3">
                          {step.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start gap-3">
                              <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
                              <span className="text-zinc-600 text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {step.isComparison && (
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div className="bg-black/5 rounded-xl p-5 border border-black/10">
                            <h4 className="font-semibold text-black mb-3">{step.offPlan?.title}</h4>
                            <ul className="space-y-2">
                              {step.offPlan?.points.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                                  <span className="text-zinc-600 text-sm">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-black/5 rounded-xl p-5 border border-black/10">
                            <h4 className="font-semibold text-black mb-3">{step.ready?.title}</h4>
                            <ul className="space-y-2">
                              {step.ready?.points.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                                  <span className="text-zinc-600 text-sm">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {step.isOfferComparison && (
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div className="bg-black/5 rounded-xl p-5 border border-black/10">
                            <h4 className="font-semibold text-black mb-3">{step.readyOffer?.title}</h4>
                            <ul className="space-y-2">
                              {step.readyOffer?.points.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                                  <span className="text-zinc-600 text-sm">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-black/5 rounded-xl p-5 border border-black/10">
                            <h4 className="font-semibold text-black mb-3">{step.offPlanOffer?.title}</h4>
                            <ul className="space-y-2">
                              {step.offPlanOffer?.points.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                                  <span className="text-zinc-600 text-sm">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {step.isTransferComparison && (
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div className="bg-black/5 rounded-xl p-5 border border-black/10">
                            <h4 className="font-semibold text-black mb-3">{step.readyTransfer?.title}</h4>
                            <ul className="space-y-2">
                              {step.readyTransfer?.points.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                                  <span className="text-zinc-600 text-sm">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-black/5 rounded-xl p-5 border border-black/10">
                            <h4 className="font-semibold text-black mb-3">{step.offPlanTransfer?.title}</h4>
                            <ul className="space-y-2">
                              {step.offPlanTransfer?.points.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                                  <span className="text-zinc-600 text-sm">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      {/* Agency Fees & Buyer Costs */}
      <section id="agency-fees" className="py-16 md:py-24 jj-section-champagne scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={Wallet} title="Agency Fees & Buyer Costs" />

          <div className="grid md:grid-cols-2 gap-6">
            {/* Off-Plan Purchases */}
            <div className="jj-card-inner p-8 hover:border-gold transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="jj-icon-box-active w-12 h-12 rounded-xl">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-black">Off-Plan Purchases</h3>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700 text-sm">No agency fees are paid by the buyer</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700 text-sm">Developers pay the brokerage commission</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700 text-sm">Buyer pays only: Unit price as per payment plan</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700 text-sm">Dubai Land Department (DLD) registration fees</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700 text-sm">Oqood registration (for off-plan)</span>
                </li>
              </ul>
              <div className="jj-card-inner rounded-lg p-4 border-gold/50">
                <p className="text-black text-sm font-medium flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-gold" />
                  You do not pay JBJ Global Real Estate any commission when purchasing off-plan.
                </p>
              </div>
            </div>

            {/* Ready Property Purchases */}
            <div className="jj-card-inner p-8 hover:border-gold transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="jj-icon-box-active w-12 h-12 rounded-xl">
                  <Home className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-black">Ready Property Purchases</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700 text-sm">Buyer pays agency commission</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700 text-sm">Standard market rate: 2% + VAT</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700 text-sm">This fee covers: Property sourcing & shortlisting</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700 text-sm">Negotiation support</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700 text-sm">Transaction coordination</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700 text-sm">Legal & transfer guidance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Buyer Costs Overview */}
      <section id="buyer-costs" className="py-16 md:py-24 jj-section-champagne scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <GuideSectionHeader icon={Calculator} title="Buyer Costs Overview" centered />

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-black mb-6">Mandatory Government Fees</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {governmentFees.map((fee, index) => (
                <div 
                  key={index}
                  className="jj-card-inner p-6 hover:border-gold transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="jj-icon-box-active w-10 h-10 rounded-lg flex-shrink-0">
                      <fee.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-black font-semibold mb-1">{fee.title}</h4>
                      <p className="text-zinc-600 text-sm leading-relaxed">{fee.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-black mb-6">Additional Costs (If Applicable)</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {additionalCosts.map((cost, index) => (
                <div 
                  key={index}
                  className="jj-card-inner p-6 hover:border-gold transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="jj-icon-box-active w-10 h-10 rounded-lg flex-shrink-0">
                      <cost.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-black font-semibold mb-1">{cost.title}</h4>
                      <p className="text-zinc-600 text-sm leading-relaxed">{cost.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mortgages & Financing */}
      <section id="mortgages" className="py-16 md:py-24 jj-section-champagne scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="jj-card-inner p-8 md:p-12">
            <GuideSectionHeader icon={Landmark} title="Mortgages & Financing" />
            <div className="grid md:grid-cols-2 gap-4">
              {mortgagePoints.map((point, index) => (
                <div key={index} className="flex items-start gap-3 jj-card-inner rounded-lg p-4">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700 text-sm leading-relaxed">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How JBJ Global Real Estate Supports Buyers */}
      <section id="jbj-support" className="py-16 md:py-24 jj-section-champagne scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <GuideSectionHeader icon={HandshakeIcon} title="How JBJ Supports Buyers" centered />

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {jbjSupport.map((item, index) => (
              <div 
                key={index}
                className="jj-card-inner p-6 hover:border-gold transition-all"
              >
                <h4 className="text-black font-semibold mb-2">{item.title}</h4>
                <p className="text-zinc-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="jj-card-inner rounded-xl p-6">
            <p className="text-zinc-700 text-sm leading-relaxed">
              <span className="text-black font-semibold">JBJ Global Real Estate</span> is licensed for buying, selling, and renting property in Dubai. Mortgage, legal, and advisory services are introduced through licensed third-party partners.
            </p>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="py-16 md:py-24 jj-section-champagne scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <GuideSectionHeader icon={HelpCircle} title="Buyer Guide FAQs" centered />

          <div className="jj-card-inner rounded-2xl p-6 md:p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="border-b border-zinc-200 last:border-0">
                  <AccordionTrigger className="text-left text-black font-medium hover:text-gold py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-600 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Founder-Led Philosophy & Advisory Positioning */}
      <FounderPhilosophySection />

      {/* Final CTA - Next Step - 3-Layer System */}
      <section className="py-20 md:py-28 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-5" />
        
        <div className="jj-layer-2 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="jj-card-inner rounded-2xl p-8 md:p-12 text-center border-2 border-gold/50">
              <GuideSectionHeader icon={Sparkles} title="Next Step" centered />
              <p className="text-lg text-zinc-600 mb-10 max-w-2xl mx-auto">
                If you are considering purchasing property in Dubai, the next step is a structured consultation to align your objective, budget, and market opportunities.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  asChild
                  variant="primary"
                  size="lg"
                  className="px-8 h-14 text-base"
                >
                  <Link to="/contact">
                    <Phone className="w-4 h-4 mr-2" />
                    <span className="text-black">Book a</span>
                    <span className="text-gold ml-1">Consultation</span>
                  </Link>
                </Button>
                
                <Button 
                  asChild
                  size="lg"
                  variant="secondary"
                  className="px-8 h-14 text-base"
                >
                  <Link to="/properties">
                    Explore Properties
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DLD Market Intelligence */}
      <DLDMarketWidget />

      {/* Legal Disclaimer - 3-Layer System */}
      <section className="py-8 bg-black">
        <div className="jj-layer-2">
          <div className="max-w-5xl mx-auto">
            <div className="jj-card-inner rounded-lg p-6">
              <h4 className="text-black font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gold" />
                Important Disclaimer
              </h4>
              <p className="text-zinc-600 text-sm leading-relaxed">
                This guide is provided for general educational and informational purposes only. It does not constitute legal, 
                mortgage, or professional advice. JBJ Global Real Estate is a licensed 
                real estate brokerage providing buying, selling, and rental services. We do not provide legal or investment advisory services. 
                Buyers should conduct independent due diligence and consult with qualified 
                professionals before making any property purchase decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Navigation - Active Layer Background */}
      <section className="py-12 bg-black">
        <div className="jj-layer-2">
          <GuideNavigation current="/buyer-guide" guides={GUIDE_LINKS} showStartHere={false} />
        </div>
      </section>
    </div>
  );
};

export default BuyerGuide;
