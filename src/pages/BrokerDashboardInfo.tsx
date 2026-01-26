import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2,
  Users,
  FileText,
  TrendingUp,
  CheckSquare,
  Wrench,
  Shield,
  AlertTriangle,
  UserCog,
  CheckCircle2,
  ArrowRight,
  Home,
  Lock,
  Briefcase
} from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
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

const BrokerDashboardInfo = () => {
  const dashboardSections = [
    {
      icon: LayoutDashboard,
      title: "Dashboard Overview (At a Glance)",
      description: "Upon login, brokers see a high-level snapshot including:",
      items: [
        "Active listings",
        "Active clients",
        "Ongoing transactions",
        "Upcoming tasks and reminders",
        "Performance indicators"
      ],
      footer: "This overview helps brokers prioritize actions immediately."
    },
    {
      icon: Building2,
      title: "Listings Management Panel",
      description: "Brokers can:",
      items: [
        "View all active listings",
        "Track listing status (draft, under review, approved, live)",
        "Submit new listings for approval",
        "Monitor listing performance (views, inquiries, activity)"
      ],
      footer: "Listings are categorized by: Sale, Rent, Off-plan (developer-direct only)."
    },
    {
      icon: Users,
      title: "Client & Lead Management",
      description: "The dashboard provides structured access to:",
      items: [
        "Active buyers, sellers, landlords, and tenants",
        "Lead source tracking",
        "Client requirements and preferences",
        "Interaction history and follow-ups"
      ],
      footer: "This ensures continuity and professionalism across client relationships."
    },
    {
      icon: FileText,
      title: "Transaction Tracking",
      description: "Brokers can monitor:",
      items: [
        "Transaction stage (initial, negotiation, documentation, transfer)",
        "Pending approvals",
        "Required documents",
        "Timeline milestones"
      ],
      footer: "This reduces delays and improves transaction transparency."
    },
    {
      icon: TrendingUp,
      title: "Performance Insights",
      description: "Brokers can view:",
      items: [
        "Number of active deals",
        "Closed transactions",
        "Conversion ratios",
        "Monthly and quarterly activity summaries"
      ],
      footer: "For JBJ internal brokers, performance data aligns with internal KPIs."
    },
    {
      icon: CheckSquare,
      title: "Tasks, Notes & Reminders",
      description: "Integrated productivity tools allow brokers to:",
      items: [
        "Create tasks",
        "Set reminders",
        "Add notes linked to clients or listings",
        "Receive notifications for deadlines and updates"
      ],
      footer: "Notifications can be configured for: In-app alerts, Email, WhatsApp (if enabled)."
    },
    {
      icon: Wrench,
      title: "Access to Broker Tools",
      description: "From the dashboard, brokers can quickly access:",
      items: [
        "Property comparison tools",
        "Market insights",
        "Client presentation generators",
        "Document templates",
        "CRM features (for JBJ internal brokers)"
      ],
      footer: ""
    }
  ];

  const internalBrokerAccess = [
    "Full CRM",
    "Internal reporting",
    "Team performance insights",
    "Management communication tools"
  ];

  const independentBrokerAccess = [
    "Their own listings",
    "Their own clients",
    "Transaction tracking",
    "Broker resources and tools"
  ];

  const complianceAlerts = [
    "Missing documentation",
    "Pending approvals",
    "Expiring listings",
    "Compliance-related notices"
  ];

  const accountFeatures = [
    "Update profile information",
    "Manage contact details",
    "View certification or affiliation status",
    "Access support or submit requests"
  ];

  const whyMatters = [
    "Centralize broker operations",
    "Improve efficiency",
    "Reduce manual errors",
    "Enhance client experience",
    "Support professional growth"
  ];

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
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
              <span className="text-gold font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">Broker Dashboard</span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight"
              variants={fadeInUp}
            >
              Your Professional <span className="text-gold">Control Center</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed max-w-3xl mx-auto mb-6"
              variants={fadeInUp}
            >
              The Broker Dashboard is the central workspace where brokers manage their activity, monitor performance, track clients, and access operational tools within the JBJ Global Real Estate platform.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-wrap justify-center gap-4 mb-8"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <Briefcase className="w-4 h-4 text-gold" />
                <span className="text-zinc-300 text-sm">JBJ-affiliated broker (internal)</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <Users className="w-4 h-4 text-gold" />
                <span className="text-zinc-300 text-sm">Independent broker (external collaborator)</span>
              </div>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <Link to="/broker-dashboard">
                <Button 
                  size="lg"
                  className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-base"
                >
                  Open Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/broker-toolkit">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-gold/50 text-gold hover:bg-gold/10 px-8 py-6 text-base"
                >
                  View Broker Tools
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Dashboard Sections */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto"
          >
            <div className="space-y-8">
              {dashboardSections.map((section, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 rounded-2xl p-6 md:p-8 hover:border-gold transition-all duration-300"
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
                      {section.footer && (
                        <p className="text-sm text-zinc-600 italic">{section.footer}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Role-Based Access Control */}
      <section className="py-16 md:py-24 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-5xl mx-auto"
          >
            <GuideSectionHeader icon={Shield} title="Role-Based Access Control" centered />
            
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              {/* JBJ Internal Brokers */}
              <motion.div
                variants={fadeInUp}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center">
                    <Home className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="text-xl font-medium text-white">JBJ Internal Brokers</h3>
                </div>
                <p className="text-zinc-400 mb-4">Have access to:</p>
                <ul className="space-y-3">
                  {internalBrokerAccess.map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                      <span className="text-zinc-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Independent Brokers */}
              <motion.div
                variants={fadeInUp}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="text-xl font-medium text-white">Independent Brokers</h3>
                </div>
                <p className="text-zinc-400 mb-4">Have access to:</p>
                <ul className="space-y-3">
                  {independentBrokerAccess.map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                      <span className="text-zinc-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            <motion.p 
              variants={fadeInUp}
              className="text-center text-zinc-500 mt-8 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Access is restricted based on role to ensure data security.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Compliance & Account Management */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-5xl mx-auto"
          >
            <div className="grid md:grid-cols-2 gap-8">
              {/* Compliance & Status Alerts */}
              <motion.div
                variants={fadeInUp}
                className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-black border border-gold rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="text-xl font-medium text-black">Compliance & Status Alerts</h3>
                </div>
                <p className="text-zinc-600 mb-4">The dashboard displays alerts for:</p>
                <ul className="space-y-3">
                  {complianceAlerts.map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                      <span className="text-zinc-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-zinc-600 mt-4 italic">
                  This ensures brokers stay aligned with regulatory and internal standards.
                </p>
              </motion.div>

              {/* Account & Profile Management */}
              <motion.div
                variants={fadeInUp}
                className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-black border border-gold rounded-lg flex items-center justify-center">
                    <UserCog className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="text-xl font-medium text-black">Account & Profile Management</h3>
                </div>
                <p className="text-zinc-600 mb-4">Brokers can:</p>
                <ul className="space-y-3">
                  {accountFeatures.map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                      <span className="text-zinc-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why the Broker Dashboard Matters */}
      <section className="py-16 md:py-24 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <GuideSectionHeader icon={TrendingUp} title="Why the Broker Dashboard Matters" centered />
            
            <motion.p 
              variants={fadeInUp}
              className="text-center text-zinc-400 max-w-2xl mx-auto mb-8"
            >
              The dashboard is designed to:
            </motion.p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {whyMatters.map((reason, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex flex-col items-center justify-center p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-center"
                >
                  <CheckCircle2 className="w-6 h-6 text-gold mb-3" />
                  <span className="text-zinc-200 text-sm">{reason}</span>
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
              Get <span className="text-gold">Started</span>
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-muted-foreground mb-10"
            >
              Access your dashboard to manage your brokerage activities efficiently and professionally.
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
              <Link to="/contact">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-gold/50 text-foreground hover:bg-gold/10 px-8 py-6 text-base"
                >
                  Contact Broker Support
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

export default BrokerDashboardInfo;
