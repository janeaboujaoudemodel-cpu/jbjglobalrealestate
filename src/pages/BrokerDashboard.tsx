import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import GlobalHeader from "@/components/GlobalHeader";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  TrendingUp,
  CheckSquare,
  Wrench,
  Search,
  ArrowRight,
  Briefcase,
  FolderOpen,
  GraduationCap,
  HelpCircle,
} from "lucide-react";
import brokerDashboardHeroVideo from "@/assets/videos/broker-dashboard-hero.mp4";

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

export default function BrokerDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?redirect=/broker-dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const brokerHubLinks = [
    { 
      title: "Broker Tools", 
      description: "Access property analysis, comparison tools, and client presentation generators",
      icon: Wrench, 
      href: "/broker-toolkit#tools",
      color: "bg-blue-500"
    },
    { 
      title: "Broker Education", 
      description: "Training modules, market knowledge, and professional development resources",
      icon: GraduationCap, 
      href: "/broker-education",
      color: "bg-purple-500"
    },
    { 
      title: "Broker Resources", 
      description: "Regulatory references, transaction guides, templates, and market materials",
      icon: FolderOpen, 
      href: "/broker-resources",
      color: "bg-emerald-500"
    },
    { 
      title: "Broker FAQ", 
      description: "Common questions about brokerage operations, compliance, and best practices",
      icon: HelpCircle, 
      href: "/broker-faq",
      color: "bg-amber-500"
    },
  ];

  const dashboardSections = [
    {
      icon: Building2,
      title: "Listings Management",
      description: "View and manage your active property listings, track status, and monitor performance.",
      features: ["Track listing status (draft, under review, approved, live)", "Monitor views and inquiries", "Submit new listings for approval"]
    },
    {
      icon: Users,
      title: "Client & Lead Management",
      description: "Access your client database, track interactions, and manage lead pipelines.",
      features: ["Active buyers, sellers, landlords, and tenants", "Lead source tracking", "Interaction history and follow-ups"]
    },
    {
      icon: FileText,
      title: "Transaction Tracking",
      description: "Monitor ongoing transactions from initial contact through to completion.",
      features: ["Transaction stage tracking", "Pending approvals and documents", "Timeline milestones"]
    },
    {
      icon: TrendingUp,
      title: "Performance Insights",
      description: "Review your performance metrics and track progress against goals.",
      features: ["Active deals overview", "Closed transactions", "Monthly activity summaries"]
    },
    {
      icon: CheckSquare,
      title: "Tasks & Reminders",
      description: "Manage your daily tasks, set reminders, and stay on top of deadlines.",
      features: ["Create and manage tasks", "Set deadline reminders", "Receive notifications for updates"]
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      {/* Hero Section with Video */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={brokerDashboardHeroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        
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
              className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed max-w-3xl mx-auto mb-10"
              variants={fadeInUp}
            >
              The Broker Dashboard is the central workspace where brokers manage their activity, monitor performance, track clients, and access operational tools within the JBJ Global Real Estate platform.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <Link to="/broker-toolkit">
                <Button 
                  size="lg"
                  className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-base"
                >
                  Access Broker Tools
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-gold/50 text-gold hover:bg-gold/10 px-8 py-6 text-base"
                >
                  Contact Broker Support
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Main Dashboard Content */}
      <div className="container mx-auto px-4 py-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 p-1.5 shadow-sm flex-wrap h-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gold data-[state=active]:text-black font-medium">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="hub" className="data-[state=active]:bg-gold data-[state=active]:text-black font-medium">
              <Briefcase className="w-4 h-4 mr-2" />
              Broker Hub
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-8"
            >
              {/* Dashboard Sections Description */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardSections.map((section, index) => (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="h-full bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 hover:border-gold transition-all">
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-black border border-gold rounded-xl flex items-center justify-center">
                            <section.icon className="w-6 h-6 text-gold" />
                          </div>
                          <CardTitle className="text-lg text-foreground">{section.title}</CardTitle>
                        </div>
                        <p className="text-muted-foreground text-sm">{section.description}</p>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {section.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="w-1.5 h-1.5 bg-gold rounded-full mt-1.5 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Role-Based Access Info */}
              <Card className="bg-black border-2 border-gold/30">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Role-Based Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                      <h4 className="text-gold font-semibold mb-3">JBJ Internal Brokers</h4>
                      <ul className="space-y-2 text-zinc-300 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                          Full CRM access
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                          Internal reporting
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                          Team performance insights
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                          Management communication tools
                        </li>
                      </ul>
                    </div>
                    <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                      <h4 className="text-gold font-semibold mb-3">Independent Brokers</h4>
                      <ul className="space-y-2 text-zinc-300 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                          Their own listings
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                          Their own clients
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                          Transaction tracking
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                          Broker resources and tools
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Broker Hub Tab */}
          <TabsContent value="hub">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-8"
            >
              <div className="grid md:grid-cols-2 gap-6">
                {brokerHubLinks.map((link, index) => (
                  <motion.div key={index} variants={fadeInUp}>
                    <Link to={link.href}>
                      <Card className="h-full bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 hover:border-gold hover:shadow-lg transition-all cursor-pointer group">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className={`w-14 h-14 ${link.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                              <link.icon className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-gold transition-colors">
                                {link.title}
                              </h3>
                              <p className="text-muted-foreground text-sm">
                                {link.description}
                              </p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Final CTA Section */}
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
              Ready to <span className="text-gold">Get Started?</span>
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-zinc-400 mb-10"
            >
              Access your broker tools and resources to manage your brokerage activities efficiently and professionally.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <Link to="/broker-toolkit">
                <Button 
                  size="lg"
                  className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-base"
                >
                  Go to Broker Tools
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-gold/50 text-white hover:bg-gold/10 px-8 py-6 text-base"
                >
                  Request Broker Support
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
