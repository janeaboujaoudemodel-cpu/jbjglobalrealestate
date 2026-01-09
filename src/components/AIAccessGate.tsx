import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import FreeAccessBadge from "@/components/FreeAccessBadge";
import { 
  Sparkles, 
  Star, 
  GraduationCap, 
  UserCheck, 
  Building2, 
  Headphones,
  ArrowRight,
  LogIn,
  Clock,
  Gift
} from "lucide-react";
import { JJLogoImage } from "./JJLogoImage";

interface AIAccessGateProps {
  children: React.ReactNode;
  toolName?: string;
}

const BROKER_CIRCLE_BENEFITS = [
  {
    icon: Sparkles,
    title: "Free AI Tools",
    description: "Unlimited access to all AI-powered property tools",
  },
  {
    icon: GraduationCap,
    title: "Free Courses & Videos",
    description: "Complete training library with tutorials",
  },
  {
    icon: UserCheck,
    title: "Dedicated HR Admin",
    description: "One dedicated assistant for all your inquiries",
  },
  {
    icon: Building2,
    title: "Property Coach",
    description: "Direct access to a property coach",
  },
];

export default function AIAccessGate({ children, toolName }: AIAccessGateProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse">
          <JJLogoImage variant="light" size="lg" />
        </div>
      </div>
    );
  }

  // If user is logged in, show the content
  if (user) {
    return <>{children}</>;
  }

  // Show access gate for guests
  return (
    <section className="relative w-full min-h-screen bg-black flex items-center justify-center py-20">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <JJLogoImage variant="light" size="md" />
          </div>

          {/* Free Access Badge */}
          <div className="flex justify-center mb-6">
            <FreeAccessBadge />
          </div>

          {/* Title */}
          <h1 className="text-white text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            {toolName ? `Access ${toolName}` : "Access AI Tools"}
          </h1>

          <p className="text-zinc-400 text-lg mb-8">
            Sign in to unlock <span className="text-emerald-400 font-semibold">free access</span> to all JBJ AI tools and resources.
          </p>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            {BROKER_CIRCLE_BENEFITS.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mb-3">
                  <benefit.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="text-white font-medium text-sm mb-1">{benefit.title}</h3>
                <p className="text-zinc-500 text-xs">{benefit.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Broker Circle CTA */}
          <div className="bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Gift className="w-6 h-6 text-gold" />
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                <Clock className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-semibold">LIMITED TIME</span>
              </div>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">
              Join JBJ Global Real Estate Circle
            </h2>
            <p className="text-zinc-400 text-sm mb-4">
              Get free courses, free AI tools, dedicated HR support, and a personal property coach — <span className="text-emerald-400">all completely free</span>.
            </p>
            <p className="text-gold text-sm font-medium">
              100% Free • No Credit Card Required
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-gold to-gold-dark text-black hover:brightness-110"
              onClick={() => navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname))}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In / Create Account
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-zinc-700 text-white hover:bg-zinc-800"
              onClick={() => navigate("/properties")}
            >
              Browse Properties Instead
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Footer note */}
          <p className="text-zinc-600 text-xs mt-8">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
