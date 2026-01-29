import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";
import {
  Map,
  Home,
  Building2,
  Users,
  Briefcase,
  Settings,
  FileText,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  Search,
  Heart,
  Calculator,
  Newspaper,
  Award,
  Shield,
  Phone,
  Info,
  GraduationCap,
  Wrench,
  UserCircle,
  MapPin,
  LayoutGrid,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

interface SitemapSection {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  links: { href: string; label: string; description?: string }[];
}

const sitemapSections: SitemapSection[] = [
  {
    title: "Main Navigation",
    description: "Primary pages for exploring our platform",
    icon: Home,
    color: "text-blue-400",
    links: [
      { href: "/", label: "Home", description: "Landing page with featured properties and services" },
      { href: "/properties", label: "Properties", description: "Browse all available properties" },
      { href: "/communities", label: "Communities", description: "Explore Dubai communities" },
      { href: "/areas", label: "Area Guides", description: "Detailed guides for Dubai areas" },
      { href: "/map", label: "Property Map", description: "Interactive map of all properties" },
      { href: "/quiz", label: "Property Quiz", description: "Find your perfect property match" },
    ],
  },
  {
    title: "Buyer & Seller Resources",
    description: "Guides and tools for property transactions",
    icon: FileText,
    color: "text-green-400",
    links: [
      { href: "/buyer-guide", label: "Buyer Guide", description: "Complete guide for property buyers" },
      { href: "/seller-guide", label: "Seller Guide", description: "Tips and guides for sellers" },
      { href: "/seller-listing", label: "List Your Property", description: "Submit your property for listing" },
      { href: "/mortgage-calculator", label: "Mortgage Calculator", description: "Calculate your mortgage payments" },
      { href: "/market-report", label: "Market Report", description: "Dubai real estate market insights" },
    ],
  },
  {
    title: "About JBJ Global",
    description: "Learn about our company and team",
    icon: Info,
    color: "text-gold",
    links: [
      { href: "/about", label: "About Us", description: "Our story and mission" },
      { href: "/founder", label: "Founder & Leadership", description: "Meet Jane Bou Jaoude" },
      { href: "/team", label: "Meet The Team", description: "Our professional team members" },
      { href: "/brokers", label: "Our Brokers", description: "Browse our broker directory" },
      { href: "/company-profile", label: "Company Profile", description: "Corporate information" },
      { href: "/awards", label: "Awards", description: "Our achievements and recognitions" },
      { href: "/press-kit", label: "Press Kit", description: "Media resources and press materials" },
      { href: "/news", label: "News & Insights", description: "Latest updates and articles" },
    ],
  },
  {
    title: "Our Services",
    description: "Professional services we offer",
    icon: Briefcase,
    color: "text-purple-400",
    links: [
      { href: "/services", label: "All Services", description: "Overview of all services" },
      { href: "/services/architecture", label: "Architecture", description: "Architectural design partners" },
      { href: "/services/interior-design", label: "Interior Design", description: "Interior design services" },
      { href: "/services/fit-out", label: "Fit-Out", description: "Fit-out and renovation services" },
      { href: "/services/design-build", label: "Design & Build", description: "Complete design-build solutions" },
      { href: "/services/law-firm", label: "Legal Partners", description: "Legal consultation services" },
    ],
  },
  {
    title: "AI Tools & Hub",
    description: "AI-powered tools for professionals",
    icon: Settings,
    color: "text-cyan-400",
    links: [
      { href: "/ai-hub", label: "AI Hub", description: "Central hub for all AI tools" },
      { href: "/interior-design-ai", label: "AI Interior Design", description: "AI-powered interior visualization" },
      { href: "/property-evaluator", label: "Property Evaluator", description: "AI property valuation tool" },
      { href: "/ai-budget-planner", label: "Budget Planner", description: "Financial planning assistance" },
      { href: "/ai-personal-shopper", label: "Personal Shopper", description: "AI property recommendations" },
      { href: "/ai-calendar", label: "AI Calendar", description: "Smart scheduling assistant" },
      { href: "/rental-index", label: "Rental Index", description: "Dubai rental market data" },
      { href: "/document-scanner", label: "Document Scanner", description: "Scan & sign documents" },
      { href: "/property-measurement", label: "Property Measurement", description: "Calculate property dimensions" },
    ],
  },
  {
    title: "Broker Toolkit",
    description: "Resources for real estate professionals",
    icon: Wrench,
    color: "text-orange-400",
    links: [
      { href: "/broker-toolkit", label: "Broker Toolkit", description: "Tools and resources for brokers" },
      { href: "/broker-dashboard", label: "Broker Dashboard", description: "Personal broker dashboard" },
      { href: "/compare", label: "Property Comparison", description: "Compare multiple properties" },
      { href: "/business-card-scanner", label: "Business Card Scanner", description: "Scan and save contacts" },
      { href: "/video-builder", label: "Video Builder", description: "Create property videos" },
      { href: "/spreadsheet", label: "Spreadsheet", description: "Data management tool" },
      { href: "/documents", label: "Documents", description: "Document management" },
    ],
  },
  {
    title: "Careers",
    description: "Join our team",
    icon: GraduationCap,
    color: "text-pink-400",
    links: [
      { href: "/join", label: "Apply to Join Our Team", description: "Submit your application" },
      { href: "/hr-agent", label: "Contact Our HR · Jessica", description: "HR virtual assistant" },
      { href: "/onboarding", label: "Training Portal", description: "Onboarding and training" },
      { href: "/referral-partner", label: "Referral Partner", description: "Become a referral partner" },
    ],
  },
  {
    title: "Customer Support",
    description: "Get help and provide feedback",
    icon: HelpCircle,
    color: "text-red-400",
    links: [
      { href: "/customer-happiness", label: "Customer Happiness", description: "Support, feedback & ideas" },
      { href: "/contact", label: "Contact Us", description: "Get in touch with our team" },
      { href: "/faq", label: "FAQ", description: "Frequently asked questions" },
      { href: "/install", label: "Install App", description: "Install our mobile app" },
    ],
  },
  {
    title: "Account & CRM",
    description: "Manage your account and leads",
    icon: UserCircle,
    color: "text-indigo-400",
    links: [
      { href: "/my-account", label: "My Account", description: "Your personal account" },
      { href: "/favorites", label: "Favorites", description: "Your saved properties" },
      { href: "/crm", label: "CRM", description: "Customer relationship management" },
      { href: "/crm/tasks", label: "CRM Tasks", description: "Task management" },
      { href: "/crm/calendar", label: "CRM Calendar", description: "Schedule and appointments" },
    ],
  },
  {
    title: "Legal",
    description: "Legal information and policies",
    icon: Shield,
    color: "text-zinc-400",
    links: [
      { href: "/terms", label: "Terms of Service", description: "Terms and conditions" },
      { href: "/privacy", label: "Privacy Policy", description: "How we handle your data" },
      { href: "/cookies", label: "Cookie Policy", description: "Cookie usage information" },
      { href: "/intellectual-property", label: "Intellectual Property", description: "IP rights and usage" },
    ],
  },
];

const SitemapCard = ({ section, hideFounderLinks }: { section: SitemapSection; hideFounderLinks?: boolean }) => {
  const Icon = section.icon;
  
  // Filter out founder-related links if visibility is disabled
  const filteredLinks = hideFounderLinks 
    ? section.links.filter(link => 
        !link.href.includes('/founder') && 
        !link.label.toLowerCase().includes('founder') &&
        !link.description.toLowerCase().includes('jane bou jaoude')
      )
    : section.links;
  
  return (
    <motion.div variants={fadeInUp}>
      <Card className="bg-zinc-900/60 border-zinc-800 hover:border-gold/30 transition-all h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center ${section.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">{section.title}</CardTitle>
              <p className="text-zinc-500 text-sm">{section.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {filteredLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="group flex items-start gap-2 py-2 px-3 rounded-lg hover:bg-zinc-800/50 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 text-gold mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="-ml-6 group-hover:ml-0 transition-all">
                    <span className="text-white group-hover:text-gold transition-colors block">
                      {link.label}
                    </span>
                    {link.description && (
                      <span className="text-zinc-500 text-xs">{link.description}</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Sitemap = () => {
  const { isFounderVisible } = useFounderVisibility();
  
  return (
    <>
      <SEOHead
        title="Sitemap | JBJ Global Real Estate"
        description="Navigate the complete JBJ Global Real Estate website. Find all pages, tools, services, and resources in one convenient location."
        keywords="sitemap, navigation, JBJ pages, website map"
        canonicalPath="/sitemap"
      />

      <div className="min-h-screen bg-[#0D0D0D]">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div variants={fadeInUp} className="mb-6">
                <Badge className="bg-gold/15 text-gold border-gold/30 px-4 py-1.5">
                  <Map className="w-3.5 h-3.5 mr-1.5" />
                  Site Navigation
                </Badge>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
                variants={fadeInUp}
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <span className="text-white">Complete </span>
                <span
                  style={{
                    background: "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Sitemap
                </span>
              </motion.h1>

              <motion.p
                className="text-zinc-400 text-lg max-w-2xl mx-auto mb-8"
                variants={fadeInUp}
              >
                Your complete guide to navigating JBJ Global Real Estate. 
                Find every page, tool, and resource at a glance.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-8"
              />

              {/* Quick Stats */}
              <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold">{sitemapSections.length}</p>
                  <p className="text-zinc-500 text-sm">Categories</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold">
                    {sitemapSections.reduce((acc, s) => acc + s.links.length, 0)}+
                  </p>
                  <p className="text-zinc-500 text-sm">Pages</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* User Guide */}
        <section className="py-12 border-b border-zinc-800">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                    <LayoutGrid className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h2 className="text-white text-xl font-semibold">How to Navigate</h2>
                    <p className="text-zinc-500 text-sm">Quick guide to using our platform</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Search className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">Find Properties</p>
                      <p className="text-zinc-400">Use the Properties page or take our Quiz for personalized recommendations.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">Explore Areas</p>
                      <p className="text-zinc-400">Visit Area Guides for detailed neighborhood information and insights.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Settings className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">Use AI Tools</p>
                      <p className="text-zinc-400">Access AI Hub for interior design, valuations, and smart recommendations.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">Get Support</p>
                      <p className="text-zinc-400">Visit Customer Happiness for tickets, feedback, and creative ideas.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sitemap Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {sitemapSections.map((section) => (
                <SitemapCard key={section.title} section={section} hideFounderLinks={!isFounderVisible} />
              ))}
            </motion.div>
          </div>
        </section>

        {/* Back to Top */}
        <section className="py-12 border-t border-zinc-800">
          <div className="container mx-auto px-4 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-dark transition-colors"
            >
              <Home className="w-5 h-5" />
              Back to Home
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Sitemap;
