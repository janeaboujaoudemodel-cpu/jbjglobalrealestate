import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  Calculator,
  BarChart3,
  Home,
  ClipboardList,
  HelpCircle,
  Phone,
  Shield,
  ArrowRight,
  Layers,
  Save,
  Share2,
  FileText,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { Card, CardContent } from "@/components/ui/card";
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
    title: "ROI Snapshot Calculator",
    description: "Estimate cashflow structure and scenario outcomes based on your inputs.",
    link: "/roi-calculator",
    cta: "Open Calculator",
  },
  {
    icon: BarChart3,
    title: "Cost Breakdown Estimator",
    description: "Understand typical transaction cost categories and planning checkpoints.",
    link: "/cost-estimator",
    cta: "Estimate Costs",
  },
  {
    icon: Layers,
    title: "Area Comparison",
    description: "Compare areas using consistent categories: accessibility, lifestyle fit, and market context modules.",
    link: "/area-comparison",
    cta: "Compare Areas",
  },
  {
    icon: Home,
    title: "Project Comparison",
    description: "Compare multiple projects side-by-side with structured pros/cons and unit positioning.",
    link: "/project-comparison",
    cta: "Compare Projects",
  },
  {
    icon: ClipboardList,
    title: "Rental Readiness Checklist",
    description: "Prepare your unit for leasing with a step-by-step readiness checklist.",
    link: "/rental-readiness",
    cta: "Start Checklist",
  },
];

const howItWorks = [
  { step: 1, title: "Input your scenario", icon: FileText },
  { step: 2, title: "Review structured outputs (tables + summaries)", icon: BarChart3 },
  { step: 3, title: "Save results into your dashboard (where available)", icon: Save },
  { step: 4, title: "Share a formatted snapshot with your broker/team (where available)", icon: Share2 },
];

const faqData = [
  {
    question: "Do these tools guarantee returns?",
    answer: "No. They are decision-support tools that structure scenarios.",
  },
  {
    question: "Can I use tool outputs as official valuation?",
    answer: "No. Valuation and regulated outcomes require official processes.",
  },
  {
    question: "Why do inputs matter so much?",
    answer: "Because scenario accuracy depends on the assumptions you provide.",
  },
  {
    question: "Can I save my results?",
    answer: "If you're logged in, results can be saved where the dashboard supports it.",
  },
  {
    question: "Can I compare multiple projects?",
    answer: "Yes—use the comparison tools and select multiple entries.",
  },
  {
    question: "Do the tools work for all Emirates?",
    answer: "Tools are structured to be location-agnostic. Available data modules may vary by dataset coverage.",
  },
  {
    question: "Can a broker generate a client PDF?",
    answer: "Where the feature exists, the platform can structure a client snapshot report.",
  },
  {
    question: "Can I request a custom tool?",
    answer: "Yes—submit a request under Concierge or Support.",
  },
];

const AITools = () => {
  return (
    <div data-marketing-page>
      <SEOHead
        title="AI Tools & Calculators | JBJ Global Real Estate"
        description="Clarity-first tools that support decision-making through structured inputs, transparent outputs, and consistent formatting."
        canonicalPath="/services/ai-tools"
      />

      {/* HERO SECTION */}
      <section className="jj-hero-fullscreen jj-hero-compact relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#1A1A1A]">
          {/* Video placeholder - Tools Built for Clarity */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
        </div>
        
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-[#EFE6D6]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#EFE6D6]/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 border border-[#B89555]/40 bg-[#1A1A1A]/30 backdrop-blur-md">
              <Brain className="w-4 h-4 text-[#1A1A1A]" />
              <span className="text-[#1A1A1A] font-semibold text-xs uppercase tracking-[0.2em]">
                Services
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              AI Tools & Calculators
            </h1>
            
            <p className="text-white/85 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Clarity-first tools that support decision-making through structured inputs, transparent outputs, and consistent formatting.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="#tools-library">
                Open Tools
              </PremiumHeroButton>
              <PremiumHeroButton href="#how-it-works">
                How It Works
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
          <span className="text-[#1A1A1A]/70 text-xs tracking-widest uppercase">Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
        </motion.div>
      </section>

      {/* TOOLS LIBRARY */}
      <section id="tools-library" className="bg-[#1A1A1A] py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Tools Library
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-[#1A1A1A]/70 text-center max-w-3xl mx-auto mb-12">
              Select a tool below. Each tool is designed to help you structure decisions, compare options, and understand trade-offs—without relying on vague assumptions.
            </motion.p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {tools.map((tool, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Link to={tool.link}>
                    <Card className="jj-card-inner hover:border-[#B89555] transition-all group h-full">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <tool.icon className="w-6 h-6 text-[#1A1A1A]" />
                        </div>
                        <h3 className="font-semibold text-[#1A1A1A] text-lg mb-2 group-hover:text-[#1A1A1A] transition-colors">
                          {tool.title}
                        </h3>
                        <p className="text-sm text-[#1A1A1A]/70 mb-4">
                          {tool.description}
                        </p>
                        <div className="flex items-center gap-1 text-[#1A1A1A] text-sm font-medium">
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

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-[#1A1A1A] py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              How It Works
            </motion.h2>
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-[#EFE6D6]/30 hidden md:block" />
                <div className="space-y-6">
                  {howItWorks.map((step, index) => (
                    <motion.div
                      key={index}
                      variants={fadeInUp}
                      className="flex items-center gap-6"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center shrink-0 z-10 border-2 border-[#B89555]">
                        <span className="text-[#1A1A1A] font-bold">{step.step}</span>
                      </div>
                      <div className="flex-1 jj-card-inner !p-4">
                        <div className="flex items-center gap-4">
                          <step.icon className="w-6 h-6 text-[#1A1A1A] shrink-0" />
                          <span className="font-semibold text-[#1A1A1A]">{step.title}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRANSPARENCY & RESPONSIBLE USE */}
      <section className="bg-[#1A1A1A] py-20">
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
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Transparency & Responsible Use
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-[#1A1A1A] shrink-0" />
                <p className="text-[#1A1A1A]/70 text-lg leading-relaxed">
                  Outputs are generated from available inputs and structured logic. Where official datasets are referenced in the platform, sources are shown inside the relevant report modules.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#1A1A1A] py-20">
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
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12"
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
                    <AccordionTrigger className="text-left text-[#1A1A1A] hover:text-[#1A1A1A]">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-[#1A1A1A] shrink-0" />
                        {faq.question}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-[#1A1A1A]/70 pl-8">
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
      <section className="bg-[#1A1A1A] py-20">
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
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Use tools built for clarity
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-[#1A1A1A]/70 mb-8">
              Open the library, select a tool, and structure your decision in minutes.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <a href="#tools-library">
                  <Brain className="w-4 h-4 mr-2" />
                  Open Tools
                </a>
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
    </div>
  );
};

export default AITools;
