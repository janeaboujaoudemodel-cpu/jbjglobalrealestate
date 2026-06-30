import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { motion } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  Shield,
  Target,
  FileText,
  ListChecks,
  BarChart3,
  Camera,
  Handshake,
  Home,
  LineChart,
  Lock,
  UserCheck,
  Clipboard,
  Calendar,
  Signature,
  Download,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FounderContent } from "@/components/FounderContent";

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

const whoIsFor = [
  { icon: Users, title: "JBJ Internal Brokers", description: "Employees of JBJ Global Real Estate" },
  { icon: Shield, title: "Approved Broker Partners", description: "Invite-only partner network members" },
  { icon: UserCheck, title: "Team Leaders", description: "Who need standardized execution across agents" },
];

const programDelivers = [
  { icon: Target, text: "A unified service standard and client handling system" },
  { icon: ListChecks, text: "Consistent listing quality requirements" },
  { icon: Handshake, text: "Structured transaction coordination practices" },
  { icon: Shield, text: "Internal compliance discipline and data handling standards" },
  { icon: BarChart3, text: "A measurable training pathway with completion tracking" },
];

const modules = [
  {
    number: 1,
    icon: Target,
    title: "JBJ Client Experience Standard",
    goal: "Deliver a consistent premium experience from inquiry to close.",
    topics: [
      "Response discipline and service tone",
      "Intake forms that reduce friction",
      "Client expectations framework",
    ],
    completionCheck: "Role-play client intake + scenario handling",
  },
  {
    number: 2,
    icon: Shield,
    title: "Brokerage Compliance Basics (UAE Context)",
    goal: "Operational compliance discipline in listings and communications.",
    topics: [
      "Advertising discipline and accuracy rules",
      "Documentation readiness habits",
      "Escalation when information is uncertain",
    ],
    completionCheck: "Listing compliance checklist pass",
  },
  {
    number: 3,
    icon: BarChart3,
    title: "Lead Handling & CRM Discipline",
    goal: "Make pipeline visible and measurable.",
    topics: [
      "Pipeline stages and conversion hygiene",
      "Follow-up timing rules",
      "Activity logging quality",
    ],
    completionCheck: "CRM activity standard validation",
  },
  {
    number: 4,
    icon: Camera,
    title: "Listing Quality & Media Standards",
    goal: "Eliminate weak listings and raise credibility.",
    topics: [
      "Minimum listing data requirements",
      "Photo/video standards",
      "Brochure formatting discipline",
    ],
    completionCheck: "Listing publish-ready scoring",
  },
  {
    number: 5,
    icon: Handshake,
    title: "Negotiation & Transaction Coordination",
    goal: "Reduce deal fallout through structured control.",
    topics: [
      "Offer clarity frameworks",
      "Negotiation messaging discipline",
      "Transaction timeline checkpoints",
    ],
    completionCheck: "Negotiation scenario assessment",
  },
  {
    number: 6,
    icon: Home,
    title: "Handover, Snagging & Leasing Readiness",
    goal: "Protect the investor asset and reduce tenant friction.",
    topics: [
      "Snagging workflow basics",
      "Readiness checklist for leasing",
      "Maintenance coordination discipline",
    ],
    completionCheck: "Readiness plan submission",
  },
  {
    number: 7,
    icon: LineChart,
    title: "Investor Communication & Report Interpretation",
    goal: "Explain data without overpromising.",
    topics: [
      "How to present structured comparisons",
      "How to explain risks professionally",
      "How to use reports as clarity tools",
    ],
    completionCheck: "Investor presentation simulation",
  },
  {
    number: 8,
    icon: Lock,
    title: "Ethics, Confidentiality & Data Handling",
    goal: "Protect clients and the business.",
    topics: [
      "Confidentiality rules",
      "Sensitive data workflows",
      "Escalation standards",
    ],
    completionCheck: "Confidentiality commitment + quiz",
  },
];

const adminWorkflow = [
  { icon: UserCheck, text: "Select broker user" },
  { icon: CheckCircle2, text: "Mark completed modules" },
  { icon: FileText, text: "Generate certificate PDF (high-resolution print ready)" },
  { icon: Clipboard, text: "Auto insert broker name + date" },
  { icon: Signature, text: "Apply stored signature image (admin uploaded)" },
  { icon: Download, text: "Save certificate record to broker profile" },
];

const faqData = [
  {
    question: "Is this recognized by government authorities?",
    answer: "No. It is an internal standards program.",
  },
  {
    question: "Can I enroll if I'm not in JBJ network?",
    answer: "Enrollment is invite-only.",
  },
  {
    question: "Do I receive a certificate?",
    answer: "Yes, for internal recognition once requirements are met.",
  },
  {
    question: "Is the certificate public proof of licensing?",
    answer: "No. Licensing is separate and regulated independently.",
  },
  {
    question: "How long does the program take?",
    answer: "Depends on module completion pace and assessments.",
  },
  {
    question: "Do I need to complete all modules?",
    answer: "Yes, to receive completion status.",
  },
  {
    question: "Can I retake modules?",
    answer: "Yes, internal re-assessment can be allowed.",
  },
  {
    question: "Is there an exam?",
    answer: "Assessments exist per module.",
  },
  {
    question: "Do you provide external job placement?",
    answer: "No. This is a standards and training pathway.",
  },
  {
    question: "Can JBJ revoke certification?",
    answer: "Internal status can be updated based on internal program rules and conduct.",
  },
];

const BrokerCertification = () => {
  return (
    <div data-marketing-page>
      <SEOHead
        title="Broker Certification — Internal Program | JBJ Global Real Estate"
        description="A structured internal standards program created by JBJ Global Real Estate for our broker partner network. Built for consistency, quality, and client experience alignment."
        canonicalPath="/services/broker-certification"
      />

      {/* HERO SECTION */}
      <section className="jj-hero-fullscreen jj-hero-compact relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#1A1A1A]">
          {/* Video placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#EFE6D6]/20 border border-[#B89555]/40 flex items-center justify-center">
                <GraduationCap className="w-12 h-12 text-[#1A1A1A]/70" />
              </div>
              <p className="text-[#1A1A1A]/70 text-sm tracking-widest uppercase">JBJ Standards Program Overview</p>
              <p className="text-white/90 text-xs mt-2">Video placeholder only</p>
            </div>
          </div>
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
                        <SectionEyebrow icon={GraduationCap} className="mb-6">Services</SectionEyebrow>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Broker Certification — Internal Program
            </h1>
            
            <p className="text-white/85 text-base md:text-lg max-w-3xl mx-auto leading-relaxed mb-10">
              A structured internal standards program created by JBJ Global Real Estate for our broker partner network. Built for consistency, quality, and client experience alignment.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?service=broker-certification">
                Request Enrollment
              </PremiumHeroButton>
              <PremiumHeroButton href="#modules">
                View Program Outline
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

      {/* IMPORTANT PROGRAM POSITIONING */}
      <section className="bg-[#1A1A1A] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 text-center">
              <Shield className="w-8 h-8 text-amber-500 mx-auto mb-4" />
              <p className="text-amber-600 font-medium leading-relaxed">
                This is an internal professional standards program for JBJ broker partners and internal brokers. It is not a public accreditation and does not replace any government licensing, regulatory registration, or external certification requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHO THIS PROGRAM IS FOR */}
      <section className="bg-[#1A1A1A] py-20">
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
              Who This Program Is For
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {whoIsFor.map((item, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <div className="h-full jj-card-inner text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
                      <item.icon className="w-7 h-7 text-[#1A1A1A]" />
                    </div>
                    <h3 className="font-semibold text-[#1A1A1A] mb-2">{item.title}</h3>
                    <p className="text-sm text-[#1A1A1A]/70">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* WHAT THIS PROGRAM DELIVERS */}
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
              What This Program Delivers
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="space-y-4">
                {programDelivers.map((item, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-[#1A1A1A]" />
                    </div>
                    <span className="text-[#1A1A1A]/70 pt-2">{item.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PROGRAM MODULES */}
      <section id="modules" className="bg-[#1A1A1A] py-20">
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
              Program Modules
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-[#1A1A1A]/70 text-center mb-12 max-w-2xl mx-auto">
              Use "Book/Module" style cards — content is not downloadable
            </motion.p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {modules.map((module, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="h-full border-2 border-[#B89555]/30 bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] overflow-hidden">
                    <CardContent className="p-0">
                      {/* Book-style header */}
                      <div className="bg-[#1A1A1A] p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#EFE6D6]/20 border-2 border-[#B89555] flex items-center justify-center">
                          <span className="text-[#1A1A1A] font-bold">M{module.number}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{module.title}</h3>
                        </div>
                      </div>
                      
                      {/* Module content */}
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Target className="w-4 h-4 text-[#1A1A1A]" />
                          <p className="text-sm text-[#1A1A1A] font-medium">Goal: {module.goal}</p>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-xs text-white/90 uppercase tracking-wider mb-2 font-medium">You Learn:</p>
                          <ul className="space-y-2">
                            {module.topics.map((topic, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-[#1A1A1A]/70">
                                <CheckCircle2 className="w-4 h-4 text-[#1A1A1A] shrink-0 mt-0.5" />
                                <span>{topic}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="bg-[#1A1A1A]/10 rounded-lg p-3 border border-[#B89555]/20">
                          <p className="text-xs text-white/90 uppercase tracking-wider mb-1 font-medium">Completion Check:</p>
                          <p className="text-sm text-[#1A1A1A]/70">{module.completionCheck}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CERTIFICATE PREVIEW */}
      <section className="bg-[#1A1A1A] py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Certificate Preview
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-[#1A1A1A]/70 text-center mb-8">
              On-screen preview only — certificate is not downloadable publicly
            </motion.p>
            <motion.div variants={fadeInUp}>
              {/* Premium Certificate Design */}
              <div className="relative">
                {/* Premium Badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-gold via-amber-400 to-gold px-6 py-2 rounded-full shadow-lg border border-[#B89555]/50">
                    <span className="text-[#1A1A1A] font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Certified Professional
                      <Award className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                <Card 
                  className="jj-card-inner border-4 border-[#B89555]/60 pt-8"
                  style={{
                    background: 'linear-gradient(135deg, #F7F1E6 0%, #ECE2D2 25%, #D8C7A6 50%, #ECE2D2 75%, #F7F1E6 100%)',
                    boxShadow: `
                      0 25px 50px rgba(200,167,102,0.4),
                      0 15px 30px rgba(0,0,0,0.2),
                      inset 0 2px 10px rgba(255,255,255,0.9),
                      inset 0 -3px 10px rgba(200,167,102,0.25),
                      0 0 40px rgba(200,167,102,0.2)
                    `,
                  }}
                >
                  <CardContent className="p-10 text-center relative overflow-hidden">
                    {/* Decorative corner elements */}
                    <div className="absolute top-4 left-4 w-16 h-16 border-l-4 border-t-4 border-[#B89555]/40" />
                    <div className="absolute top-4 right-4 w-16 h-16 border-r-4 border-t-4 border-[#B89555]/40" />
                    <div className="absolute bottom-4 left-4 w-16 h-16 border-l-4 border-b-4 border-[#B89555]/40" />
                    <div className="absolute bottom-4 right-4 w-16 h-16 border-r-4 border-b-4 border-[#B89555]/40" />

                    {/* Logo area */}
                    <div className="mb-6">
                      <div className="w-20 h-20 mx-auto rounded-full bg-[#1A1A1A] flex items-center justify-center border-4 border-[#B89555] shadow-xl">
                        <Award className="w-10 h-10 text-[#1A1A1A]" />
                      </div>
                    </div>

                    <h3 className="text-3xl font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                      Certificate of Completion
                    </h3>
                    <p className="text-[#1A1A1A] font-semibold tracking-widest uppercase text-sm mb-8">JBJ Broker Standards Program</p>
                    
                    <p className="text-muted-foreground text-sm mb-2">This certifies that</p>
                    
                    <div className="border-b-2 border-[#B89555]/40 py-4 mb-6 mx-auto max-w-md">
                      <p className="text-2xl font-bold text-[#1A1A1A]" style={{ fontFamily: "Playfair Display, serif" }}>[Broker Full Name]</p>
                    </div>
                    
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      has successfully completed all program requirements and demonstrated proficiency in the JBJ Global Real Estate professional standards curriculum.
                    </p>
                    
                    <div className="flex items-center justify-between max-w-lg mx-auto pt-6 border-t border-[#B89555]/20">
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Issue Date</p>
                        <p className="text-[#1A1A1A] font-semibold">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-[#1A1A1A]/5 border-2 border-[#B89555]/30 flex items-center justify-center">
                          <Shield className="w-8 h-8 text-[#1A1A1A]" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Verified</p>
                      </div>
                      <div className="text-right">
                        <FounderContent
                          fallback={
                            <>
                              <p className="text-[#1A1A1A] font-semibold">JBJ Global Real Estate</p>
                              <p className="text-xs text-muted-foreground">Executive Leadership</p>
                            </>
                          }
                        >
                          <p className="text-[#1A1A1A] font-semibold">Jane Bou Jaoude</p>
                          <p className="text-xs text-muted-foreground">Founder & CEO</p>
                          <p className="text-[#1A1A1A] italic text-xs mt-1">جاين بو جودة</p>
                        </FounderContent>
                      </div>
                    </div>

                    {/* Certificate Number */}
                    <div className="mt-8 pt-4 border-t border-dashed border-[#B89555]/30">
                      <p className="text-xs text-muted-foreground">
                        Certificate No: <span className="font-mono text-[#1A1A1A]">JBJ-CERT-2024-001</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ADMIN ISSUANCE WORKFLOW */}
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
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Admin Issuance Workflow
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-[#1A1A1A]/70 text-center mb-8">
              Back-office administration capabilities
            </motion.p>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <p className="text-[#1A1A1A]/70 mb-6 font-medium">Admin can:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminWorkflow.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 bg-[#1A1A1A]/5 rounded-lg p-4">
                    <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-[#1A1A1A]" />
                    </div>
                    <span className="text-[#1A1A1A]/70 text-sm">{item.text}</span>
                  </div>
                ))}
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
                    value={`faq-${index}`}
                    className="border-2 border-[#B89555]/30 rounded-lg bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] overflow-hidden"
                  >
                    <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-[#EFE6D6]/10">
                      <span className="text-[#1A1A1A] font-medium">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 text-[#1A1A1A]/70">
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
            variants={fadeInUp}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="jj-card-inner border-2 border-[#B89555]/30">
              <Award className="w-12 h-12 text-[#1A1A1A] mx-auto mb-6" />
              <h2
                className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Join the Standards Program
              </h2>
              <p className="text-[#1A1A1A]/70 mb-8 max-w-xl mx-auto">
                Request enrollment and receive the program pathway and requirements.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <PremiumHeroButton href="/contact?service=broker-certification">
                  Request Enrollment
                </PremiumHeroButton>
                <PremiumHeroButton href="/contact">
                  Contact Support
                </PremiumHeroButton>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default BrokerCertification;
