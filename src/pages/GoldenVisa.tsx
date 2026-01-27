import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Footer from "@/components/Footer";
import GlobalHeader from "@/components/GlobalHeader";
import {
  Shield,
  Home,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowRight,
  Globe,
  Briefcase,
  Clock,
  MapPin,
  Scale,
  MessageCircle,
} from "lucide-react";

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

export default function GoldenVisa() {
  const keyFeatures = [
    { icon: Clock, text: "Long-term residency (renewable)" },
    { icon: Users, text: "No local sponsor required" },
    { icon: Home, text: "Family sponsorship eligibility" },
    { icon: Globe, text: "Freedom to enter and exit the UAE" },
  ];

  const qualificationPrinciples = [
    "Property must meet the minimum valuation threshold set by authorities",
    "Property must be legally registered with the Dubai Land Department or relevant authority",
    "Investment may include one or multiple properties (subject to regulation)",
    "Mortgage conditions must comply with government rules",
  ];

  const eligibleFor = [
    "International investors",
    "UAE residents seeking long-term stability",
    "Property owners holding qualifying assets",
    "Investors purchasing directly from developers or in the secondary market (subject to eligibility)",
  ];

  const jbjSupport = [
    "Identifying properties aligned with Golden Visa thresholds",
    "Explaining ownership and valuation requirements",
    "Coordinating with licensed immigration and legal partners",
    "Assisting with documentation preparation",
    "Supporting you through property registration stages",
  ];

  const considerations = [
    "Golden Visa approval is not automatic upon purchase",
    "Government regulations may change",
    "Property valuation must be officially recognized",
    "Processing timelines vary",
    "Residency approval remains at the discretion of UAE authorities",
  ];

  const faqs = [
    {
      question: "Does buying property automatically grant a Golden Visa?",
      answer: "No. Property ownership is one eligibility pathway, but approval is issued only by UAE authorities after review."
    },
    {
      question: "Can I apply with multiple properties?",
      answer: "In some cases, yes — subject to official regulations."
    },
    {
      question: "Can my family be included?",
      answer: "Golden Visa holders may sponsor eligible family members according to visa rules."
    },
    {
      question: "Is the visa permanent?",
      answer: "The Golden Visa is long-term and renewable, not permanent citizenship."
    },
    {
      question: "Can I sell the property later?",
      answer: "Selling may affect residency eligibility. Always review implications before proceeding."
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(200,167,102,0.6)',
              }}
              variants={fadeInUp}
            >
              <Shield className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-widest">Long-Term Residency</span>
            </motion.div>

            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight"
              variants={fadeInUp}
            >
              UAE Golden Visa via <span className="text-gold">Property Investment</span>
            </motion.h1>

            <motion.p 
              className="text-lg md:text-xl text-zinc-300 mb-4 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Secure long-term residency in the UAE through qualifying real estate investments — guided by licensed professionals.
            </motion.p>

            <motion.p 
              className="text-base text-zinc-400 mb-8 max-w-3xl mx-auto"
              variants={fadeInUp}
            >
              The UAE Golden Visa offers eligible property investors long-term residency with enhanced stability and flexibility. At JBJ Global Real Estate, we guide you through qualifying investment options, documentation, and the application process in coordination with approved government channels and licensed partners.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={fadeInUp}
            >
              <Link to="/properties?golden_visa=true">
                <Button variant="primary" size="lg">
                  <Building2 className="w-5 h-5 mr-2" />
                  Explore Eligible Properties
                </Button>
              </Link>
              <Link to="/contact?type=golden-visa">
                <Button variant="secondary" size="lg">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Request Golden Visa Consultation
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="space-y-20"
        >
          {/* Section 1: What is the UAE Golden Visa */}
          <motion.section variants={fadeInUp}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                  Understanding the Golden Visa
                </h2>
              </div>
              
              <p className="text-muted-foreground mb-8 leading-relaxed">
                The UAE Golden Visa is a long-term residency program that allows eligible individuals to live, work, and invest in the UAE without the need for a local sponsor. It is designed to attract investors, entrepreneurs, and professionals who contribute to the country's economic growth.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {keyFeatures.map((feature, index) => (
                  <Card key={index} className="border-2 border-gold/30">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-5 h-5 text-gold" />
                      </div>
                      <p className="text-foreground font-medium">{feature.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Section 2: How Property Investment Qualifies */}
          <motion.section variants={fadeInUp}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                  <Home className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                  How Property Investment Qualifies
                </h2>
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                Investors may qualify for the UAE Golden Visa by purchasing residential property that meets government-defined criteria.
              </p>

              <Card className="border-2 border-gold/30 mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">General qualification principles include:</h3>
                  <ul className="space-y-3">
                    {qualificationPrinciples.map((principle, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{principle}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <p className="text-sm text-muted-foreground italic">
                Final eligibility is always determined by the issuing authority.
              </p>
            </div>
          </motion.section>

          {/* Section 3: Eligibility Overview */}
          <motion.section variants={fadeInUp}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                  Who Can Apply?
                </h2>
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                This pathway is suitable for:
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {eligibleFor.map((item, index) => (
                  <Card key={index} className="border-2 border-gold/30">
                    <CardContent className="p-4 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-sm">{item}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-muted/30 border border-border/50">
                <CardContent className="p-5">
                  <h4 className="font-medium text-foreground mb-3">Residency duration and conditions depend on:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                      Property value
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                      Ownership structure
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                      Compliance with visa regulations at the time of application
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* Section 4: The JBJ Approach */}
          <motion.section variants={fadeInUp}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                  How JBJ Global Real Estate Supports You
                </h2>
              </div>

              <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-black border border-gold/20 mb-8">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium mb-1">We do not issue visas.</p>
                      <p className="text-zinc-400">We do ensure your property decision aligns with Golden Visa eligibility requirements.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <h3 className="font-semibold text-foreground mb-4">Our role includes:</h3>
              <div className="space-y-3 mb-6">
                {jbjSupport.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground italic">
                All visa processing is handled by authorized government entities and licensed partners.
              </p>
            </div>
          </motion.section>

          {/* Section 5: Important Considerations */}
          <motion.section variants={fadeInUp}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                  <Scale className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                  What Investors Should Know
                </h2>
              </div>

              <Card className="border-2 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {considerations.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <p className="text-center text-muted-foreground mt-6 font-medium">
                We ensure transparency at every step — no guarantees, no misrepresentation.
              </p>
            </div>
          </motion.section>

          {/* Section 6: FAQ */}
          <motion.section variants={fadeInUp}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                  Frequent Questions
                </h2>
              </div>

              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`faq-${index}`}
                    className="border-2 border-gold/30 rounded-lg px-4 data-[state=open]:bg-muted/30"
                  >
                    <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </motion.section>

          {/* Section 7: Next Steps */}
          <motion.section variants={fadeInUp}>
            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-black border border-gold/20 overflow-hidden">
                <CardContent className="p-8 md:p-12 text-center">
                  <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-8 h-8 text-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                    Explore with Clarity
                  </h2>
                  <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
                    If you are considering real estate as a pathway toward UAE long-term residency, the first step is understanding which properties qualify and how ownership is structured.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/properties?golden_visa=true">
                      <Button variant="primary" size="lg">
                        <Building2 className="w-5 h-5 mr-2" />
                        View Golden Visa Eligible Properties
                      </Button>
                    </Link>
                    <Link to="/contact?type=golden-visa">
                      <Button variant="secondary" size="lg">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Speak with a JBJ Advisor
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.section>
        </motion.div>
      </div>

      {/* Footer Note */}
      <div className="container mx-auto px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-muted/30 border border-border/50">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground space-y-1">
                <span className="block">JBJ Global Real Estate is a licensed UAE brokerage.</span>
                <span className="block">We provide real estate advisory and coordination support only.</span>
                <span className="block font-medium">Residency visas are issued solely by UAE government authorities.</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
