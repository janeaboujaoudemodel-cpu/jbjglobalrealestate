import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpRight, 
  Sparkles, 
  Calculator, 
  FileText, 
  Layers, 
  BarChart3, 
  Calendar,
  Wallet,
  ShoppingBag,
  Ruler,
  Palette,
  Brain,
  Zap,
  Shield,
  Clock
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const aiTools = [
  {
    id: "ai-home-finder",
    title: "AI Home Finder",
    description: "Answer a few questions about your preferences and let our AI match you with the perfect properties based on budget, location, lifestyle, and property goals.",
    icon: Sparkles,
    gradient: "from-purple-500 to-fuchsia-500",
    borderColor: "border-purple-500/30",
    textColor: "text-purple-400",
    bgColor: "bg-purple-500/10",
    link: "/quiz",
    features: ["Personalized Matching", "Budget Analysis", "Lifestyle Fit", "Property Scoring"],
    featured: true
  },
  {
    id: "ai-interior-design",
    title: "AI Interior Design Studio",
    description: "Visualize your dream space with AI-generated interior designs. Upload a room photo and see it transformed in different luxury styles.",
    icon: Palette,
    gradient: "from-fuchsia-500 to-pink-500",
    borderColor: "border-fuchsia-500/30",
    textColor: "text-fuchsia-400",
    bgColor: "bg-fuchsia-500/10",
    link: "/interior-design-ai",
    features: ["Style Visualization", "AI Rendering", "Before/After", "Multiple Styles"]
  },
  {
    id: "ai-budget-planner",
    title: "AI Budget Planner",
    description: "Budget analysis and property affordability insights (property-only). Informational only—not financial, mortgage, or investment advice.",
    icon: Wallet,
    gradient: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
    bgColor: "bg-amber-500/10",
    link: "/ai-financial-advisor",
    features: ["Budget Analysis", "Affordability Insights", "Property Matching", "Payment Plans"]
  },
  {
    id: "ai-personal-shopper",
    title: "AI Personal Shopper",
    description: "Tell us your lifestyle, preferences and property goals. Our AI personal shopper curates perfect property selections tailored just for you.",
    icon: ShoppingBag,
    gradient: "from-rose-500 to-red-500",
    borderColor: "border-rose-500/30",
    textColor: "text-rose-400",
    bgColor: "bg-rose-500/10",
    link: "/ai-personal-shopper",
    features: ["Lifestyle Matching", "Curated Selections", "AI Recommendations", "Project Saving"]
  },
  {
    id: "ai-calendar",
    title: "AI Calendar & Notes",
    description: "Manage your meetings, events and notes with AI-powered scheduling. Get email and phone reminders for important consultation meetings.",
    icon: Calendar,
    gradient: "from-indigo-500 to-blue-500",
    borderColor: "border-indigo-500/30",
    textColor: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    link: "/ai-calendar",
    features: ["Event Scheduling", "Meeting Reminders", "AI Notes", "Project Saving"]
  },
  {
    id: "property-comparison",
    title: "AI Property Comparison",
    description: "Compare 2-5 properties side by side with AI-powered analysis. Get detailed insights on value, location, developer reputation, and potential.",
    icon: BarChart3,
    gradient: "from-violet-500 to-purple-500",
    borderColor: "border-violet-500/30",
    textColor: "text-violet-400",
    bgColor: "bg-violet-500/10",
    link: "/compare",
    features: ["Side-by-Side View", "AI Scoring", "Potential Analysis", "Recommendations"]
  },
  {
    id: "rental-index",
    title: "Rental Index Evaluator",
    description: "Get AI-powered rental estimates for any Dubai property. Understand market rates, trends, demand levels, and ROI potential.",
    icon: Layers,
    gradient: "from-emerald-500 to-green-500",
    borderColor: "border-emerald-500/30",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    link: "/rental-index",
    features: ["Rent Estimates", "Market Trends", "ROI Analysis", "Area Comparison"]
  },
  {
    id: "property-evaluator",
    title: "Property Evaluator",
    description: "Get an AI-powered valuation for any property based on market data and comparable sales. Understand fair market value and appreciation.",
    icon: Calculator,
    gradient: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    link: "/property-evaluator",
    features: ["Instant Valuation", "Market Comparables", "Price Trends", "Investment Score"]
  },
  {
    id: "property-measurement",
    title: "Property Measurement",
    description: "Calculate property dimensions, areas and layouts with precision. Get accurate measurements for floor plans and space planning.",
    icon: Ruler,
    gradient: "from-teal-500 to-cyan-500",
    borderColor: "border-teal-500/30",
    textColor: "text-teal-400",
    bgColor: "bg-teal-500/10",
    link: "/property-measurement",
    features: ["Area Calculator", "Room Dimensions", "Floor Plans", "Export Options"]
  },
  {
    id: "document-scanner",
    title: "Smart Document Scanner",
    description: "Scan, crop, and digitally sign real estate contracts. Add auto-fill fields, export as PDF, and streamline your paperwork with AI.",
    icon: FileText,
    gradient: "from-green-500 to-emerald-500",
    borderColor: "border-green-500/30",
    textColor: "text-green-400",
    bgColor: "bg-green-500/10",
    link: "/document-scanner",
    features: ["Smart Scanning", "e-Signature", "PDF Export", "Auto-Fill Fields"]
  },
];

const benefits = [
  {
    icon: Brain,
    title: "Intelligent Analysis",
    description: "Our AI processes thousands of data points to provide accurate, personalized recommendations."
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get real-time insights and analysis without waiting. Make faster, smarter real estate decisions."
  },
  {
    icon: Shield,
    title: "Data Security",
    description: "Your information is encrypted and protected with industry-standard security measures."
  },
  {
    icon: Clock,
    title: "Save Time",
    description: "Automate tedious research tasks and focus on what matters—finding your perfect property."
  }
];

const AIHub = () => {
  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative py-24 md:py-32 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950/50 via-zinc-950 to-black" />
          <div 
            className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: '4s' }}
          />
          <div 
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: '6s', animationDelay: '2s' }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 rounded-full text-purple-300 text-xs md:text-sm uppercase tracking-[0.4em] mb-8">
                <Sparkles className="w-4 h-4" />
                AI-Powered Platform
              </span>
            </motion.div>

            <motion.h1 
              className="text-white text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8"
              variants={fadeInUp}
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              The Future of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400">
                Real Estate Intelligence
              </span>
            </motion.h1>

            <motion.p 
              className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto mb-6 leading-relaxed"
              variants={fadeInUp}
            >
              A suite of AI-enabled tools designed to support your real estate decisions in Dubai and beyond.
            </motion.p>

            {/* AI Disclaimer */}
            <motion.div
              variants={fadeInUp}
              className="max-w-2xl mx-auto mb-10 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
            >
              <p className="text-amber-200 text-sm text-center">
                <strong>Disclaimer:</strong> AI outputs are informational estimates only and not legal, mortgage, financial, or investment advice.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <Link to="/quiz">
                <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold px-8 py-6 text-base shadow-xl shadow-purple-500/30">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start AI Home Finder
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/properties">
                <Button 
                  variant="outline"
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400 px-8 py-6 text-base"
                >
                  Browse Properties
                </Button>
              </Link>
            </motion.div>

            <motion.p 
              className="text-zinc-500 text-sm mt-8"
              variants={fadeInUp}
            >
              Developed by Founder Jane Abou Jaoude • Powered by JJ Global Capital
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Benefits Section */}
      <section className="py-16 bg-zinc-950/50">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                className="text-center p-6"
                variants={fadeInUp}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{benefit.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Tool - AI Home Finder */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Link to="/quiz" className="block group">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/50 via-fuchsia-900/50 to-purple-900/50 border border-purple-500/30 p-8 md:p-12 hover:border-purple-400/50 transition-all duration-500">
                {/* Animated glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-purple-500/30">
                    <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-white" />
                  </div>
                  
                  <div className="text-center md:text-left flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-xs uppercase tracking-wider mb-4">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </div>
                    <h2 className="text-white text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      AI Home Finder
                    </h2>
                    <p className="text-zinc-300 text-lg mb-6 max-w-2xl">
                      Answer a few simple questions about your preferences, budget, and lifestyle. Our AI analyzes thousands of properties to find your perfect match in seconds.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      {["Personalized Matching", "Investment Scoring", "Lifestyle Analysis", "Instant Results"].map((feature, idx) => (
                        <span key={idx} className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <ArrowUpRight className="w-8 h-8 text-purple-400 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform flex-shrink-0" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* All AI Tools Grid */}
      <section className="py-20 bg-gradient-to-b from-black to-zinc-950">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Complete Suite</span>
            <h2 
              className="text-white text-3xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              All AI Tools
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Explore our full range of AI-powered tools designed to assist every aspect of your property search.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {aiTools.filter(t => !t.featured).map((tool) => (
              <motion.div key={tool.id} variants={fadeInUp}>
                <Link to={tool.link} className="block group h-full">
                  <div className={`relative p-6 rounded-2xl bg-zinc-900/50 border ${tool.borderColor} hover:border-opacity-70 transition-all duration-500 h-full overflow-hidden group-hover:-translate-y-1`}>
                    {/* Glow effect */}
                    <div className={`absolute inset-0 ${tool.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
                    
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-xl ${tool.bgColor} border ${tool.borderColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                          <tool.icon className={`w-7 h-7 ${tool.textColor}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white text-lg font-bold mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                            {tool.title}
                          </h3>
                          <div className={`inline-flex items-center gap-1 ${tool.textColor} text-xs font-medium uppercase tracking-wider`}>
                            <Sparkles className="w-3 h-3" />
                            AI Powered
                          </div>
                        </div>
                        <ArrowUpRight className={`w-5 h-5 ${tool.textColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all`} />
                      </div>

                      {/* Description */}
                      <p className="text-zinc-400 text-sm mb-4 leading-relaxed line-clamp-2">
                        {tool.description}
                      </p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2">
                        {tool.features.slice(0, 3).map((feature, idx) => (
                          <span key={idx} className={`px-2 py-1 ${tool.bgColor} border ${tool.borderColor} rounded-full ${tool.textColor} text-xs`}>
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/30 via-transparent to-fuchsia-950/30" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-gold/30">
              <Sparkles className="w-10 h-10 text-black" />
            </div>
            <h2 
              className="text-white text-3xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Ready to Transform Your Investment Journey?
            </h2>
            <p className="text-zinc-400 text-lg mb-10">
              Start using our AI-powered tools today and make smarter, data-driven real estate decisions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/quiz">
                <Button className="bg-gold hover:bg-gold-light text-black font-semibold px-10 py-6 text-base shadow-xl shadow-gold/30">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Started Free
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  variant="outline"
                  className="border-gold/50 text-gold hover:bg-gold/10 hover:border-gold px-10 py-6 text-base"
                >
                  Contact Our Team
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </section>
  );
};

export default AIHub;