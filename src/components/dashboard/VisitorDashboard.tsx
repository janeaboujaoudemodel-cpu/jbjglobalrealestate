import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Building2, 
  TrendingUp, 
  Home, 
  Briefcase,
  BarChart3,
  MapPin,
  Newspaper,
  ArrowRight,
  UserPlus,
  LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const PRIMARY_ACTIONS = [
  {
    title: "Explore Properties",
    description: "Browse our collection of premium properties for sale and rent",
    icon: Building2,
    href: "/properties",
    color: "text-gold",
    bgGradient: "from-gold/20 to-amber-500/10"
  },
  {
    title: "Invest in Real Estate",
    description: "Access investor guides, market insights, and ROI tools",
    icon: TrendingUp,
    href: "/investor-education",
    color: "text-emerald-500",
    bgGradient: "from-emerald-500/20 to-emerald-600/10"
  },
  {
    title: "List Your Property",
    description: "Submit your property for sale or rent with JBJ",
    icon: Home,
    href: "/listing-portal",
    color: "text-blue-500",
    bgGradient: "from-blue-500/20 to-blue-600/10"
  },
  {
    title: "Work With Us",
    description: "Join the JBJ Broker Circle and access exclusive tools",
    icon: Briefcase,
    href: "/broker-toolkit",
    color: "text-purple-500",
    bgGradient: "from-purple-500/20 to-purple-600/10"
  }
];

const QUICK_ACCESS = [
  {
    title: "Market Intelligence",
    description: "Real-time market data and trends",
    icon: BarChart3,
    href: "/market-intelligence"
  },
  {
    title: "Area Guides",
    description: "Explore Dubai's neighborhoods",
    icon: MapPin,
    href: "/areas"
  },
  {
    title: "News & Insights",
    description: "Latest real estate news",
    icon: Newspaper,
    href: "/news"
  }
];

const VisitorDashboard = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="max-w-6xl mx-auto"
        >
          {/* Welcome Header */}
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome to <span className="text-gold">JBJ Global Real Estate</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Explore. Compare. Invest. List.
            </p>
          </motion.div>

          {/* Primary Action Cards */}
          <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {PRIMARY_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} to={action.href}>
                  <Card className="bg-zinc-900/50 border-zinc-800 hover:border-gold/50 transition-all duration-300 h-full group cursor-pointer">
                    <CardHeader>
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.bgGradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-7 h-7 ${action.color}`} />
                      </div>
                      <CardTitle className="text-white group-hover:text-gold transition-colors">
                        {action.title}
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        {action.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-gold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                        Learn more <ArrowRight className="w-4 h-4" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </motion.div>

          {/* Quick Access Section */}
          <motion.div variants={fadeInUp} className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {QUICK_ACCESS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.title} to={item.href}>
                    <Card className="bg-zinc-900/30 border-zinc-800 hover:border-zinc-700 transition-all group cursor-pointer">
                      <CardContent className="flex items-center gap-4 p-5">
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                          <Icon className="w-6 h-6 text-zinc-400 group-hover:text-gold transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white group-hover:text-gold transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-sm text-zinc-500">{item.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-r from-gold/10 to-amber-500/5 border-gold/30">
              <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 p-8">
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    Ready to get started?
                  </h3>
                  <p className="text-zinc-400">
                    Create an account to unlock personalized features and save your preferences.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Link to="/auth?mode=signup">
                    <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-6">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Account
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
                      <LogIn className="w-4 h-4 mr-2" />
                      Log In
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default VisitorDashboard;
