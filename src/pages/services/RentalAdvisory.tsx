import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Building2, 
  TrendingUp, 
  UserCheck, 
  FileCheck, 
  ClipboardCheck,
  Users,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Shield,
  Home,
  Briefcase,
  Globe,
  Layers,
  HelpCircle
} from "lucide-react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GuideSectionHeader } from "@/components/guides/GuideSectionHeader";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const RentalAdvisory = () => {
  const advisoryServices = [
    {
      icon: BarChart3,
      title: "Rental Market Positioning",
      description: "We analyze current rental demand, comparable properties, and seasonal trends to position your property accurately in the market — avoiding overpricing that leads to vacancy or underpricing that erodes yield.",
      items: [
        "Area-specific rental benchmarking",
        "Unit-type demand analysis",
        "Furnished vs. unfurnished strategy",
        "Cheque structure optimization (1–12 cheques)"
      ]
    },
    {
      icon: TrendingUp,
      title: "Rental Yield & Income Strategy",
      description: "Rental decisions should support both income stability and long-term capital value. We advise on rental structures that align with your broader investment objectives.",
      items: [
        "Expected gross & net rental yield analysis",
        "Long-term vs. short-term leasing strategy (where applicable)",
        "Vacancy risk assessment",
        "Rent escalation planning within RERA limits"
      ]
    },
    {
      icon: UserCheck,
      title: "Tenant Qualification & Risk Control",
      description: "Selecting the right tenant is critical. We apply structured screening to protect your property and income stream.",
      items: [
        "Employment & income verification",
        "Visa & Emirates ID validation",
        "Previous landlord reference checks",
        "Lease suitability assessment"
      ]
    },
    {
      icon: FileCheck,
      title: "Lease Structuring & Compliance",
      description: "We ensure all leasing documentation complies fully with Dubai rental regulations and protects landlord interests.",
      items: [
        "Lease agreement review & structuring",
        "Ejari registration coordination",
        "RERA-compliant rent increase guidance",
        "Notice period & renewal advisory"
      ]
    },
    {
      icon: ClipboardCheck,
      title: "Handover & Move-In Advisory",
      description: "A clear handover reduces disputes and future maintenance issues.",
      items: [
        "Move-in condition checklist",
        "Inventory & meter documentation",
        "Key, access card & parking allocation",
        "Tenant onboarding coordination"
      ]
    }
  ];

  const targetAudience = [
    { icon: Home, label: "Individual landlords" },
    { icon: Globe, label: "Overseas property owners" },
    { icon: Layers, label: "Portfolio investors" },
    { icon: Users, label: "First-time rental property owners" },
    { icon: Briefcase, label: "Developers leasing ready inventory" }
  ];

  const whyJBJ = [
    "Licensed UAE brokerage",
    "Market-driven pricing methodology",
    "Strong tenant screening standards",
    "Transparent advisory process",
    "Aligned with long-term investor outcomes"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold/3 rounded-full blur-3xl" />
        
        <motion.div 
          className="container mx-auto px-4 relative z-10"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(200,167,102,0.6)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3)',
              }}
              variants={fadeInUp}
            >
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              <span className="text-gold font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">Rental Advisory</span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight"
              variants={fadeInUp}
            >
              Rental Advisory <span className="text-gold">Services</span>
            </motion.h1>
            
            <motion.p 
              className="text-2xl md:text-3xl font-light text-zinc-300 mb-4"
              variants={fadeInUp}
            >
              Maximize Rental Performance. Minimize Risk.
            </motion.p>
            
            <motion.p 
              className="text-lg md:text-xl text-zinc-400 font-light leading-relaxed max-w-3xl mx-auto mb-10"
              variants={fadeInUp}
            >
              Our Rental Advisory service supports property owners and investors through every stage of the leasing process — from pricing strategy to tenant placement — ensuring stable income, regulatory compliance, and long-term asset protection.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <Link to="/list-property">
                <Button 
                  size="lg"
                  className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-base"
                >
                  List Your Property for Rent
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-gold/50 text-gold hover:bg-gold/10 px-8 py-6 text-base"
                >
                  Speak to a Rental Advisor
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* What Rental Advisory Covers */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto"
          >
            <GuideSectionHeader icon={Building2} title="What Rental Advisory Covers" centered />
            
            <div className="space-y-8 mt-12">
              {advisoryServices.map((service, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 rounded-2xl p-6 md:p-8 hover:border-gold transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-black border border-gold rounded-xl flex items-center justify-center">
                      <service.icon className="w-6 h-6 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-medium text-black mb-3">{service.title}</h3>
                      <p className="text-zinc-600 mb-4">{service.description}</p>
                      <div className="bg-black/5 rounded-xl p-4">
                        <p className="text-sm font-semibold text-zinc-700 mb-3">Includes:</p>
                        <ul className="space-y-2">
                          {service.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                              <span className="text-zinc-700 text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Who This Service Is For */}
      <section className="py-16 md:py-24 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-5xl mx-auto"
          >
            <GuideSectionHeader icon={Users} title="Who This Service Is For" centered />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
              {targetAudience.map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-gold/30 transition-all"
                >
                  <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-zinc-200 font-medium">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Rental Advisory vs. Rental Management */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <GuideSectionHeader icon={HelpCircle} title="Rental Advisory vs. Rental Management" centered />
            
            <motion.div
              variants={fadeInUp}
              className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 rounded-2xl p-6 md:p-8 mt-12"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                  <p className="text-zinc-700">
                    <span className="font-semibold text-black">Rental Advisory</span> focuses on strategic guidance and transaction execution.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                  <p className="text-zinc-700">
                    If you require ongoing property management, we introduce licensed third-party partners where appropriate.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Why JBJ Global Real Estate */}
      <section className="py-16 md:py-24 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <GuideSectionHeader icon={Shield} title="Why JBJ Global Real Estate" centered />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
              {whyJBJ.map((reason, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl"
                >
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                  <span className="text-zinc-200">{reason}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-light text-foreground mb-6"
            >
              Start Your <span className="text-gold">Rental Advisory</span>
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-muted-foreground mb-10"
            >
              Whether you're leasing a single unit or managing a portfolio, our advisory ensures your rental performs efficiently and compliantly.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <Link to="/list-property">
                <Button 
                  size="lg"
                  className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-base"
                >
                  List Your Property for Rent
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-gold/50 text-foreground hover:bg-gold/10 px-8 py-6 text-base"
                >
                  Request Rental Advisory Consultation
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RentalAdvisory;
