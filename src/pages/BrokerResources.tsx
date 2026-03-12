import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  FolderOpen, 
  Scale,
  FileText,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  HeadphonesIcon,
  Users,
  CheckCircle2,
  ArrowRight,
  User,
  Briefcase,
  Globe
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GuideSectionHeader } from "@/components/guides/GuideSectionHeader";
import brokerResourcesHeroVideo from "@/assets/videos/broker-resources-hero.mp4";
import VideoBackground from "@/components/VideoBackground";

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

const BrokerResources = () => {
  const resourceSections = [
    {
      icon: Scale,
      title: "Regulatory & Compliance References",
      description: "Brokers have access to structured references covering:",
      items: [
        "UAE real estate regulatory frameworks",
        "Dubai Land Department (DLD) transaction processes",
        "RERA compliance requirements",
        "Ownership structures and transfer protocols",
        "Off-plan vs secondary market regulations"
      ],
      footer: "These references are updated to reflect current regulatory practices and procedures."
    },
    {
      icon: FileText,
      title: "Transaction Process Guides",
      description: "Step-by-step reference materials for:",
      items: [
        "Buyer-side transaction workflows",
        "Seller-side transaction workflows",
        "Rental transaction workflows",
        "Off-plan booking and registration stages",
        "Title deed transfer and documentation checkpoints"
      ],
      footer: "These guides help brokers navigate transactions accurately and consistently."
    },
    {
      icon: FolderOpen,
      title: "Documentation & Templates",
      description: "Access standardized brokerage materials, including:",
      items: [
        "Client onboarding checklists",
        "Property listing intake forms",
        "Buyer and seller requirement forms",
        "Viewing coordination templates",
        "Internal transaction tracking formats"
      ],
      footer: "All templates follow JBJ Global Real Estate operational standards."
    },
    {
      icon: BarChart3,
      title: "Market Reference Materials",
      description: "Brokers can reference:",
      items: [
        "Area-level market summaries",
        "Pricing benchmarks by location",
        "Rental yield reference ranges",
        "Supply and demand snapshots",
        "Transaction activity indicators"
      ],
      footer: "These materials support informed client discussions without relying on speculation."
    },
    {
      icon: MessageSquare,
      title: "Client Communication Resources",
      description: "Professional communication tools for brokers, including:",
      items: [
        "Client presentation structures",
        "Property comparison formats",
        "Advisory conversation frameworks",
        "Follow-up and update templates",
        "Professional disclosure wording"
      ],
      footer: "These resources help brokers maintain clarity, consistency, and professionalism in client interactions."
    },
    {
      icon: ShieldCheck,
      title: "Internal Policies & Operating Standards",
      description: "For brokers operating within JBJ Global Real Estate:",
      items: [
        "Internal operational guidelines",
        "Professional conduct standards",
        "Client data handling protocols",
        "Branding and representation rules",
        "Escalation and approval workflows"
      ],
      footer: "These standards ensure alignment across the brokerage."
    },
    {
      icon: HeadphonesIcon,
      title: "Support & Assistance",
      description: "If a broker requires clarification or operational support:",
      items: [
        "Access internal support channels",
        "Submit resource-related requests",
        "Request clarification on procedures",
        "Escalate transaction or documentation issues"
      ],
      footer: "Support is structured to ensure efficiency and accountability."
    }
  ];

  const targetAudience = [
    { icon: Briefcase, label: "Brokers affiliated with JBJ Global Real Estate" },
    { icon: Users, label: "Independent brokers collaborating on transactions" },
    { icon: User, label: "Brokers seeking procedural clarity and reference support" }
  ];

  const whyMatters = [
    "Accuracy",
    "Compliance",
    "Structured processes",
    "Clear client communication"
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Video */}
      <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <VideoBackground src={brokerResourcesHeroVideo} poster="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80" />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        
        {/* Ambient glow effects */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
        
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
              <span className="text-gold font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">Broker Resources</span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight"
              variants={fadeInUp}
            >
              Professional Resources for <span className="text-gold">Real Estate Brokers</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed max-w-3xl mx-auto mb-6"
              variants={fadeInUp}
            >
              The Broker Resources section is designed to support brokers with practical tools, reference materials, and operational guidance required to operate efficiently within the JBJ Global Real Estate ecosystem and the wider UAE real estate market.
            </motion.p>
            
            <motion.p 
              className="text-base md:text-lg text-zinc-400 font-light leading-relaxed max-w-3xl mx-auto mb-10"
              variants={fadeInUp}
            >
              These resources are intended to enhance day-to-day brokerage performance, ensure regulatory alignment, and streamline client-facing operations.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" variant="primary">
                <Link to="/broker-dashboard">
                  Access Broker Resources
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/contact">Contact Broker Support</Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Resource Sections */}
      <section className="py-16 md:py-24 bg-black">
        <div className="jj-layer-2">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-6xl mx-auto"
            >
              <div className="space-y-8">
                {resourceSections.map((section, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="jj-card-inner rounded-2xl p-6 md:p-8"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-black border border-gold rounded-xl flex items-center justify-center">
                        <section.icon className="w-6 h-6 text-gold" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl md:text-2xl font-medium text-black mb-3">{section.title}</h3>
                        <p className="text-zinc-600 mb-4">{section.description}</p>
                        <div className="bg-black/5 rounded-xl p-4 mb-4">
                          <ul className="space-y-2">
                            {section.items.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-3">
                                <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                                <span className="text-zinc-700 text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-sm text-zinc-600 italic">{section.footer}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Who This Page Is For */}
      <section className="py-16 md:py-24 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-5xl mx-auto"
          >
            <GuideSectionHeader icon={Users} title="Who This Page Is For" centered />
            
            <motion.p 
              variants={fadeInUp}
              className="text-center text-zinc-400 max-w-2xl mx-auto mb-12"
            >
              This resource hub is designed for:
            </motion.p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {targetAudience.map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex items-center gap-4 p-5 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-gold/50 transition-all"
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

      {/* Why These Resources Matter */}
      <section className="py-16 md:py-24 bg-black">
        <div className="jj-layer-2">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-4xl mx-auto"
            >
              <GuideSectionHeader icon={ShieldCheck} title="Why These Resources Matter" centered />
              
              <motion.p 
                variants={fadeInUp}
                className="text-center text-zinc-700 max-w-2xl mx-auto mb-8"
              >
                Professional brokerage performance depends on:
              </motion.p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {whyMatters.map((reason, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="jj-card-inner rounded-xl p-6 text-center flex flex-col items-center justify-center"
                  >
                    <CheckCircle2 className="w-6 h-6 text-gold mb-3" />
                    <span className="text-zinc-800 font-medium">{reason}</span>
                  </motion.div>
                ))}
              </div>
              
              <motion.p 
                variants={fadeInUp}
                className="text-center text-zinc-700 mt-8"
              >
                These resources are built to support those standards consistently.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-black">
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
              className="text-3xl md:text-4xl font-light text-white mb-6"
            >
              Access <span className="text-gold">Broker Resources</span>
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-zinc-400 mb-10"
            >
              Brokers can access relevant materials directly through their account dashboard or by contacting the JBJ Global Real Estate support team.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <Link to="/broker-dashboard">
                <Button 
                  size="lg"
                  className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-base"
                >
                  Go to Broker Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button 
                size="lg"
                variant="outline"
                className="border-gold/50 text-white hover:bg-gold/10 px-8 py-6 text-base"
                asChild
              >
                <Link to="/contact">Request Broker Support</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default BrokerResources;
