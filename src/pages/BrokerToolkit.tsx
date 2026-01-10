import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";
import { 
  GraduationCap, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Users,
  TrendingUp,
  Target,
  BookOpen,
  Video,
  Award,
  Zap,
  Shield,
  Phone,
  Mail,
  Bot,
  FileSpreadsheet,
  Palette,
  Download,
  FileText,
  Headphones,
  UserCheck,
  Building2,
  Star,
  Brain
} from "lucide-react";

// Educational Categories - Structured Learning Hub
const LEARNING_CATEGORIES = [
  {
    category: "Objection Handling",
    icon: Shield,
    color: "from-red-500 to-rose-500",
    description: "Turn client objections into closing opportunities",
    modules: [
      { title: "Price Objections Masterclass", duration: "45 min", type: "video" },
      { title: "Location Concerns Response", duration: "30 min", type: "guide" },
      { title: "Timing Objections Playbook", duration: "25 min", type: "pdf" },
      { title: "Competition Comparisons", duration: "35 min", type: "video" },
    ]
  },
  {
    category: "Cold Calling",
    icon: Phone,
    color: "from-blue-500 to-cyan-500",
    description: "Master phone-based prospecting and appointment setting",
    modules: [
      { title: "Opening Scripts That Work", duration: "30 min", type: "pdf" },
      { title: "Gatekeeper Navigation", duration: "25 min", type: "video" },
      { title: "Voicemail Strategies", duration: "20 min", type: "guide" },
      { title: "Follow-Up Call Sequences", duration: "40 min", type: "video" },
    ]
  },
  {
    category: "Lead Types & Qualification",
    icon: Target,
    color: "from-green-500 to-emerald-500",
    description: "Identify, qualify, and prioritize different lead sources",
    modules: [
      { title: "Hot vs Warm vs Cold Leads", duration: "35 min", type: "video" },
      { title: "Online Lead Qualification", duration: "25 min", type: "guide" },
      { title: "Referral Lead Handling", duration: "30 min", type: "pdf" },
      { title: "Developer Lead Processing", duration: "40 min", type: "video" },
    ]
  },
  {
    category: "Call Types & Scenarios",
    icon: Headphones,
    color: "from-purple-500 to-fuchsia-500",
    description: "Handle every type of client conversation professionally",
    modules: [
      { title: "Initial Inquiry Calls", duration: "30 min", type: "video" },
      { title: "Post-Viewing Follow-Up", duration: "25 min", type: "guide" },
      { title: "Price Negotiation Calls", duration: "40 min", type: "video" },
      { title: "Contract Discussion Calls", duration: "35 min", type: "pdf" },
    ]
  },
  {
    category: "Buyer Psychology",
    icon: Brain,
    color: "from-amber-500 to-orange-500",
    description: "Understand what drives buying decisions",
    modules: [
      { title: "First-Time Buyer Mindset", duration: "35 min", type: "video" },
      { title: "Buyer Decision Timeline", duration: "30 min", type: "guide" },
      { title: "Emotional vs Logical Buyers", duration: "40 min", type: "video" },
      { title: "Trust Building Techniques", duration: "25 min", type: "pdf" },
    ]
  },
  {
    category: "Closing Techniques",
    icon: Award,
    color: "from-gold to-gold-dark",
    description: "Master the art of closing deals confidently",
    modules: [
      { title: "Trial Close Methods", duration: "30 min", type: "video" },
      { title: "Assumptive Close Technique", duration: "25 min", type: "guide" },
      { title: "Urgency Creation", duration: "35 min", type: "video" },
      { title: "Final Walkthrough & Handover", duration: "40 min", type: "pdf" },
    ]
  },
];

// Free PDF Books for Registered Brokers
const FREE_BOOKS = [
  {
    title: "Objection Handling Bible",
    pages: 85,
    description: "Complete guide to handling every objection in Dubai real estate",
    color: "from-red-500/20 to-rose-500/20",
    borderColor: "border-red-500/30",
  },
  {
    title: "Cold Calling Scripts",
    pages: 45,
    description: "Word-for-word scripts for every cold calling scenario",
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
  },
  {
    title: "Buyer Psychology Playbook",
    pages: 62,
    description: "Understanding and influencing buyer decisions",
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
  },
  {
    title: "Lead Conversion Manual",
    pages: 78,
    description: "Turn every lead type into closed deals",
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30",
  },
];

const COURSE_MODULES = [
  {
    icon: Target,
    title: "Closing Techniques",
    lessons: 12,
    duration: "4 hours",
    description: "Master the art of closing deals with proven techniques",
  },
];

const TOOLS = [
  {
    icon: FileText,
    title: "PDF Property Report Generator",
    description: "Create stunning property presentations with your branding",
  },
  {
    icon: Bot,
    title: "JBJ AI Property Comparison",
    description: "Generate detailed comparison tables for multiple properties",
  },
  {
    icon: Sparkles,
    title: "JBJ AI Recommendation Engine",
    description: "Let AI recommend the best property for your client",
  },
  {
    icon: Palette,
    title: "Custom Branding Editor",
    description: "Add your logo, photo, and contact details to exports",
  },
  {
    icon: FileSpreadsheet,
    title: "Excel Data Export",
    description: "Export property data to Excel for detailed analysis",
  },
  {
    icon: Download,
    title: "Bulk Download Manager",
    description: "Download multiple property materials at once",
  },
];

const BROKER_CIRCLE_BENEFITS = [
  {
    icon: Sparkles,
    title: "Free AI Tools",
    description: "Unlimited access to all AI-powered property tools",
  },
  {
    icon: GraduationCap,
    title: "Free Courses & Videos",
    description: "Complete training library with tutorials and guides",
  },
  {
    icon: UserCheck,
    title: "Dedicated HR Admin",
    description: "One dedicated assistant to handle all your inquiries",
  },
  {
    icon: Building2,
    title: "Property Coach",
    description: "Direct access to a property coach for your listings",
  },
  {
    icon: Headphones,
    title: "Priority Support",
    description: "Get help whenever you need it from our team",
  },
  {
    icon: Award,
    title: "Developer Briefings",
    description: "Exclusive access to developer meetings and updates",
  },
];

export default function BrokerToolkit() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[hsl(var(--premium-bg))]">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="bg-gold/20 text-gold border-gold/30 mb-6">
              <GraduationCap className="w-3 h-3 mr-1" />
              For Real Estate Professionals
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Broker <span className="text-gold">Toolkit</span>
            </h1>
            <p className="text-xl text-zinc-400 mb-4 max-w-2xl mx-auto">
              Free resources and AI-powered tools for real estate professionals.
            </p>
            <p className="text-zinc-500 text-sm mb-8 max-w-xl mx-auto">
              Educational content only. Not an accredited training institute. No certificates issued.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {!user ? (
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-gold to-gold-dark text-black hover:brightness-110"
                  onClick={() => navigate("/auth?redirect=/broker-toolkit")}
                >
                  <Star className="w-5 h-5 mr-2" />
                  Join Broker Circle - Free
                </Button>
              ) : (
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-gold to-gold-dark text-black hover:brightness-110"
                  onClick={() => navigate('/ai-hub')}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Access AI Tools
                </Button>
              )}
              <Button 
                size="lg"
                variant="outline"
                className="border-zinc-700 text-white hover:bg-zinc-800"
                onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                See Benefits
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "Free", label: "AI Tools" },
              { value: "Free", label: "Courses" },
              { value: "Dedicated", label: "HR Support" },
              { value: "Direct", label: "Property Coach" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-2xl md:text-3xl font-bold text-gold mb-2">{stat.value}</div>
                <div className="text-zinc-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Broker Circle Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">
              <Star className="w-3 h-3 mr-1" />
              JBJ Global Real Estate Broker Circle
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need, <span className="text-gold">Completely Free</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Join the JBJ Global Real Estate Broker Circle to unlock free courses, 
              free AI tools, dedicated HR support, and a personal property coach.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BROKER_CIRCLE_BENEFITS.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-zinc-800 rounded-xl p-6 hover:border-gold/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-zinc-400 text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>

          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button 
                size="lg"
                className="bg-gradient-to-r from-gold to-gold-dark text-black hover:brightness-110"
                onClick={() => navigate("/auth?redirect=/broker-toolkit")}
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Join Broker Circle - It's Free
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="py-20 bg-zinc-900/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Tools
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Professional Tools for Modern Brokers
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Generate stunning property presentations, AI comparisons, and custom-branded 
              materials in seconds. <span className="text-gold font-medium">Free for Broker Circle members.</span>
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOOLS.map((tool, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-gold/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center mb-4">
                  <tool.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{tool.title}</h3>
                <p className="text-zinc-400 text-sm">{tool.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="resources" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-4">
              <BookOpen className="w-3 h-3 mr-1" />
              Free Training Resources
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Educational Resources
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Practical guides and resources to support your real estate career. 
              <span className="text-gold font-medium"> All free for Broker Circle members.</span>
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COURSE_MODULES.map((module, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center flex-shrink-0">
                    <module.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{module.title}</h3>
                    <p className="text-zinc-400 text-sm mb-3">{module.description}</p>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {module.lessons} Lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        {module.duration}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-zinc-900/50 to-transparent">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30 rounded-2xl p-8 md:p-12"
          >
            <Shield className="w-12 h-12 text-gold mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Join the Broker Circle?
            </h2>
            <p className="text-zinc-400 mb-6">
              Get free access to all AI tools, courses, dedicated HR support, and a personal property coach.
            </p>

            {!user ? (
              <Button 
                size="lg"
                className="bg-gradient-to-r from-gold to-gold-dark text-black hover:brightness-110 mb-6"
                onClick={() => navigate("/auth?redirect=/broker-toolkit")}
              >
                <Star className="w-5 h-5 mr-2" />
                Join Now - Completely Free
              </Button>
            ) : (
              <Button 
                size="lg"
                className="bg-gradient-to-r from-gold to-gold-dark text-black hover:brightness-110 mb-6"
                onClick={() => navigate("/ai-hub")}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Access Your Tools
              </Button>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/971565911000?text=Hi%2C%20I%27m%20interested%20in%20joining%20the%20Broker%20Circle"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
              >
                <Phone className="w-5 h-5" />
                +971 56 591 1000
              </a>
              <span className="text-zinc-600 hidden sm:block">|</span>
              <a
                href="mailto:contact@jbj.ae"
                className="flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
              >
                <Mail className="w-5 h-5" />
                contact@jbj.ae
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
