import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  HelpCircle,
  Phone,
  Shield,
  Target,
  FileText,
  Clock,
  Star,
} from "lucide-react";
import Footer from "@/components/Footer";
import DirectContactCTA from "@/components/DirectContactCTA";
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

const whoCanEnroll = [
  { icon: Users, title: "JBJ Internal Brokers", description: "Employees of JBJ Global Real Estate" },
  { icon: Shield, title: "Approved Broker Partners", description: "Invite-only partner network members" },
];

const modules = [
  {
    number: 1,
    title: "JBJ Standards & Client Experience",
    goal: "Establish foundational service standards",
    topics: [
      "JBJ brand values and positioning",
      "Client communication protocols",
      "Response time standards",
      "Professional conduct guidelines",
      "Client onboarding process",
    ],
  },
  {
    number: 2,
    title: "UAE Brokerage Compliance Basics",
    goal: "Understand regulatory requirements",
    topics: [
      "RERA registration and licensing",
      "DLD transaction procedures",
      "Escrow account requirements",
      "Anti-money laundering basics",
      "Documentation standards",
    ],
  },
  {
    number: 3,
    title: "Lead Handling & CRM Discipline",
    goal: "Master lead management processes",
    topics: [
      "Lead qualification criteria",
      "CRM data entry standards",
      "Follow-up cadence requirements",
      "Lead assignment protocols",
      "Conversion tracking",
    ],
  },
  {
    number: 4,
    title: "Listing Quality & Media Standards",
    goal: "Ensure consistent listing presentation",
    topics: [
      "Property photography standards",
      "Listing description guidelines",
      "Pricing accuracy requirements",
      "Floor plan presentation",
      "Virtual tour standards",
    ],
  },
  {
    number: 5,
    title: "Negotiation & Transaction Coordination",
    goal: "Handle negotiations professionally",
    topics: [
      "Offer presentation protocols",
      "Negotiation techniques",
      "Counter-offer management",
      "Transaction timeline coordination",
      "Stakeholder communication",
    ],
  },
  {
    number: 6,
    title: "Handover, Snagging, Leasing Readiness",
    goal: "Master post-sale and rental processes",
    topics: [
      "Handover checklist procedures",
      "Snagging inspection basics",
      "Move-in coordination",
      "Tenant onboarding",
      "Property readiness standards",
    ],
  },
  {
    number: 7,
    title: "Investor Communication & Report Interpretation",
    goal: "Support investor clients effectively",
    topics: [
      "Investment report reading",
      "ROI communication",
      "Market update delivery",
      "Portfolio review meetings",
      "Performance benchmarking",
    ],
  },
  {
    number: 8,
    title: "Ethics, Confidentiality, Data Handling",
    goal: "Maintain professional integrity",
    topics: [
      "Conflict of interest policies",
      "Client confidentiality",
      "Data protection requirements",
      "Ethical decision-making",
      "Reporting obligations",
    ],
  },
];

const faqData = [
  {
    question: "Is this an official government certification?",
    answer: "No. This is an internal professional standards program created by JBJ Global Real Estate. It does not replace government licensing, regulatory registration, or external certifications.",
  },
  {
    question: "Who is eligible to enroll?",
    answer: "The program is available to JBJ internal brokers (employees) and approved broker partners (invite-only).",
  },
  {
    question: "How long does the program take?",
    answer: "The program consists of 8 modules. Completion time varies based on individual pace, typically 4-8 weeks.",
  },
  {
    question: "Is there an exam?",
    answer: "Each module has a completion check. Final certification requires satisfactory completion of all modules.",
  },
  {
    question: "What do I receive upon completion?",
    answer: "Successful graduates receive a JBJ Certificate of Completion, signed by the Founder & CEO.",
  },
  {
    question: "Is the certificate valid externally?",
    answer: "The certificate recognizes internal professional standards achievement. It is not a substitute for government or regulatory certifications.",
  },
  {
    question: "Can I download the course materials?",
    answer: "Course materials are accessed through the online platform. Downloads are not available to maintain content integrity.",
  },
  {
    question: "What if I fail a module?",
    answer: "Modules can be retaken. Your enrollment coordinator will provide guidance on the retake process.",
  },
  {
    question: "Is there ongoing education required?",
    answer: "JBJ may offer continuing education modules. Initial certification is the foundation.",
  },
  {
    question: "How do I request enrollment?",
    answer: "Use the enrollment request form. JBJ internal brokers and approved partners will receive enrollment instructions.",
  },
];

const BrokerCertification = () => {
  return (
    <>
      <SEOHead
        title="Broker Certification Program | JBJ Global Real Estate"
        description="Internal professional standards program for JBJ brokers and partners. Comprehensive training covering compliance, client service, and transaction excellence."
        canonicalPath="/services/broker-certification"
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
              <GraduationCap className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Services
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Broker Certification (Internal Program)
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              An internal training and standards program created by JBJ Global Real Estate for our respected broker partner network. This is not a public accreditation and does not grant external licensing status.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?service=broker-certification">
                Request Enrollment
              </PremiumHeroButton>
              <PremiumHeroButton href="#curriculum">
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
          <span className="text-gold/60 text-xs tracking-widest uppercase">Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
        </motion.div>
      </section>

      {/* LEGAL POSITIONING */}
      <section className="bg-black py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 text-center">
              <Shield className="w-8 h-8 text-amber-500 mx-auto mb-4" />
              <p className="text-amber-600 font-medium">
                This is an internal professional standards program for JBJ broker partners. It does not replace government licensing, regulatory registration, or external certifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAM OVERVIEW */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Program Overview
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <p className="text-lg text-zinc-700 leading-relaxed">
                The JBJ Broker Certification Program is a comprehensive internal training curriculum designed to establish 
                consistent professional standards across our broker network. Covering compliance, client experience, 
                transaction management, and ethical conduct, this program ensures all JBJ representatives deliver 
                service excellence aligned with our brand values.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* WHO CAN ENROLL */}
      <section className="bg-black py-20">
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
              Who Can Enroll
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {whoCanEnroll.map((item, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <div className="h-full jj-card-inner text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-black flex items-center justify-center">
                      <item.icon className="w-7 h-7 text-gold" />
                    </div>
                    <h3 className="font-semibold text-black mb-2">{item.title}</h3>
                    <p className="text-sm text-zinc-600">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CURRICULUM MODULES */}
      <section id="curriculum" className="bg-black py-20">
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
              Curriculum Modules
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {modules.map((module, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="jj-card-inner h-full border-none">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center border-2 border-gold">
                          <span className="text-gold font-bold">{module.number}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-black">{module.title}</h3>
                          <p className="text-sm text-gold">{module.goal}</p>
                        </div>
                      </div>
                      <div className="bg-black/5 rounded-lg p-4">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-medium">What You Learn</p>
                        <ul className="space-y-2">
                          {module.topics.map((topic, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-zinc-700">
                              <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
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
      <section className="bg-black py-20">
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
              className="text-3xl md:text-4xl font-bold text-black text-center mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Certificate Preview
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Card className="jj-card-inner border-2 border-gold/30">
                <CardContent className="p-8 text-center">
                  <Award className="w-16 h-16 text-gold mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-black mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
                    Certificate of Completion
                  </h3>
                  <p className="text-zinc-500 mb-8">JBJ Broker Certification Program</p>
                  
                  <div className="border-t border-b border-gold/20 py-6 mb-6">
                    <p className="text-lg text-zinc-400 italic">[Broker Name]</p>
                    <p className="text-sm text-zinc-500 mt-2">has successfully completed all requirements</p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-left">
                      <p className="text-sm text-zinc-500">Issue Date</p>
                      <p className="text-black font-medium">[Auto-generated]</p>
                    </div>
                    <div className="text-right">
                      <div className="h-16 flex items-center justify-center">
                        <p className="text-gold italic text-sm">[Signature]</p>
                      </div>
                      <p className="text-black font-semibold">Jane Bou Jaoude (جاين بو جودة)</p>
                      <p className="text-sm text-zinc-500">Founder & CEO</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
              Ready to Get Certified?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 mb-8">
              Join the JBJ Broker Certification Program and elevate your professional standards.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <Link to="/contact?service=broker-certification">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Request Enrollment
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

      {/* COMPLIANCE DISCLAIMER */}
      <section className="bg-black py-8 border-t border-zinc-800">
        <div className="container mx-auto px-4 text-center">
          <p className="text-zinc-500 text-sm max-w-3xl mx-auto">
            The JBJ Broker Certification Program is an internal professional development initiative. 
            Completion does not constitute government licensing or regulatory certification. 
            Participants must maintain valid RERA registration and comply with all applicable regulations.
          </p>
        </div>
      </section>

      <DirectContactCTA />
      <Footer />
    </>
  );
};

export default BrokerCertification;
