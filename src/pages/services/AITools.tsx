import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  Calculator,
  BarChart3,
  Home,
  TrendingUp,
  HelpCircle,
  Phone,
  Shield,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Footer from "@/components/Footer";
import DirectContactCTA from "@/components/DirectContactCTA";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { Card, CardContent } from "@/components/ui/card";
import AIDisclosure from "@/components/ai-governance/AIDisclosure";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const tools = [
  {
    icon: Calculator,
    title: "Mortgage Calculator",
    description: "Estimate monthly payments based on property price, down payment, and interest rates.",
    link: "/mortgage-calculator",
    cta: "Calculate Now",
  },
  {
    icon: BarChart3,
    title: "Property Evaluator",
    description: "AI-powered property valuation using market data and comparable sales.",
    link: "/property-evaluator",
    cta: "Evaluate Property",
  },
  {
    icon: TrendingUp,
    title: "Rental Index",
    description: "Compare rental rates across Dubai areas with official RERA index data.",
    link: "/rental-index",
    cta: "Check Rental Rates",
  },
  {
    icon: Home,
    title: "AI Home Finder",
    description: "Answer questions to get personalized property recommendations.",
    link: "/quiz",
    cta: "Find Your Home",
  },
  {
    icon: Sparkles,
    title: "Interior Design AI",
    description: "Visualize property interiors with AI-generated design concepts.",
    link: "/interior-design-ai",
    cta: "Design Now",
  },
  {
    icon: Brain,
    title: "AI Hub",
    description: "Explore all AI-powered tools and assistants in one place.",
    link: "/ai-hub",
    cta: "Explore AI Hub",
  },
];

const dataTransparency = [
  "Property valuations use official DLD transaction data",
  "Rental rates reference RERA rental index",
  "Market trends based on verified transaction records",
  "All AI outputs include source references where applicable",
];

const faqData = [
  {
    question: "Are these AI tools free to use?",
    answer: "Most tools are available free for registered users. Some advanced features may require a premium account.",
  },
  {
    question: "How accurate are the AI valuations?",
    answer: "AI valuations are estimates based on available market data and should not be considered as official appraisals. They serve as guidance for decision-making.",
  },
  {
    question: "Where does the data come from?",
    answer: "Our tools use official sources including Dubai Land Department (DLD) transaction data and RERA rental index information.",
  },
  {
    question: "Can I rely on these tools for investment decisions?",
    answer: "These tools provide decision support but should not replace professional advice. We recommend consulting with our advisory team for significant investment decisions.",
  },
  {
    question: "Do you store my search data?",
    answer: "We store session data to improve your experience. Personal data handling is covered in our privacy policy.",
  },
  {
    question: "Are the AI recommendations biased towards certain properties?",
    answer: "Our AI tools are designed to be objective and use standardized criteria. Recommendations are based on your inputs and market data, not sponsored listings.",
  },
  {
    question: "Can I export reports from these tools?",
    answer: "Some tools offer export functionality for registered users. PDF reports are available for property evaluations and mortgage calculations.",
  },
  {
    question: "How often is the data updated?",
    answer: "Market data is updated regularly from official sources. Frequency varies by data type — transaction data is typically updated monthly.",
  },
];

const AITools = () => {
  return (
    <>
      <SEOHead
        title="AI Calculators & Tools | JBJ Global Real Estate"
        description="Decision support tools powered by AI. Property valuation, mortgage calculations, rental analysis, and personalized recommendations."
        canonicalPath="/services/ai-tools"
      />

      {/* HERO SECTION */}
      <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
        </div>
        
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gold/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 border border-gold/40 bg-black/30 backdrop-blur-md">
              <Brain className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Services
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              AI Calculators & Tools
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Decision support tools designed for clarity — using structured inputs and transparent outputs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="#tools-library">
                Open Tools
              </PremiumHeroButton>
              <PremiumHeroButton href="#how-it-works">
                How it Works
              </PremiumHeroButton>
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <span className="text-gold/60 text-xs tracking-widest uppercase">Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
        </motion.div>
      </section>

      {/* TOOLS LIBRARY */}
      <section id="tools-library" className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Tools Library
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {tools.map((tool, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Link to={tool.link}>
                    <Card className="jj-card-inner hover:border-gold transition-all group h-full">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <tool.icon className="w-6 h-6 text-gold" />
                        </div>
                        <h3 className="font-semibold text-black text-lg mb-2 group-hover:text-gold transition-colors">
                          {tool.title}
                        </h3>
                        <p className="text-sm text-zinc-600 mb-4">
                          {tool.description}
                        </p>
                        <div className="flex items-center gap-1 text-gold text-sm font-medium">
                          {tool.cta}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* DATA TRANSPARENCY */}
      <section id="how-it-works" className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Data Transparency
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <div className="flex items-center gap-4 mb-6">
                <Shield className="w-8 h-8 text-gold" />
                <h3 className="text-xl font-semibold text-black">Our Data Sources</h3>
              </div>
              <ul className="space-y-4 mb-6">
                {dataTransparency.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-700">
                    <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-gold text-xs">✓</span>
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* AI DISCLOSURE */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              AI Disclosure
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <AIDisclosure variant="inline" mode="public" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Frequently Asked Questions
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Accordion type="single" collapsible className="space-y-4">
                {faqData.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="jj-card-inner border-none"
                  >
                    <AccordionTrigger className="text-left text-black hover:text-gold">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-gold shrink-0" />
                        {faq.question}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-zinc-600 pl-8">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA BLOCK */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Start Using Our Tools
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 mb-8">
              Make informed decisions with AI-powered insights.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <Link to="/ai-hub">
                  <Brain className="w-4 h-4 mr-2" />
                  Explore AI Hub
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Support
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <DirectContactCTA />
      <Footer />
    </>
  );
};

export default AITools;
