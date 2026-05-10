import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import FreeAccessBadge from "@/components/FreeAccessBadge";
import { 
  Sparkles, 
  GraduationCap, 
  UserCheck, 
  Building2, 
  ArrowRight,
  LogIn,
  Gift,
  Headphones,
  Palette,
  Film,
  Camera,
  Megaphone,
  Users,
  CheckCircle2
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
    title: "Dedicated HR Manager",
    description: "Hiring, policies, and performance support",
  },
  {
    icon: Building2,
    title: "Property Coach",
    description: "Direct access to a property coach",
  },
  {
    icon: Headphones,
    title: "Admin Support",
    description: "Coordination, reminders, and operational support",
  },
  {
    icon: Palette,
    title: "JBJ Graphic Designer",
    description: "Create brochures, ads & marketing materials",
  },
  {
    icon: Film,
    title: "JBJ Video Producer",
    description: "Cinematic property tours & marketing videos",
  },
  {
    icon: Camera,
    title: "JBJ Photographer",
    description: "Auto-enhance listings with AI filters",
  },
  {
    icon: Megaphone,
    title: "Digital Marketing",
    description: "Automate ads & social campaigns",
  },
  {
    icon: Users,
    title: "JBJ HR Manager",
    description: "Manage team & track performance",
  },
];

const CIRCLE_FEATURES = [
  "20+ AI-powered property tools",
  "HR Manager & Admin Support",
  "Property coach, designer, photographer & marketing tools",
  "Free courses and certifications",
  "24/7 Admin support",
  "Full CRM access"
];

export default function AIAccessGate({ children, toolName }: AIAccessGateProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
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
    <section className="relative w-full min-h-screen bg-[#0D0D0D] flex items-center justify-center py-20 pb-32">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#EFE6D6]/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center"
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
          <h1 
            className="text-3xl md:text-5xl font-bold mb-4" 
            style={{ 
              background: "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 40px rgba(203, 166, 75, 0.3)"
            }}
          >
            {toolName ? `Access ${toolName}` : "Access JBJ Hub"}
          </h1>

          <p className="text-white text-lg mb-2">
            Get free access to all JBJ AI tools, assistants, HR Manager, property coach, and creative suite — all in one place.
          </p>
          <p className="text-white/70 text-base mb-8">
            Sign in to unlock <span className="text-emerald-400 font-semibold">free access</span> to all JBJ AI tools and resources.
          </p>

          {/* Gold Divider */}
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-8" />

          {/* Benefits Grid - 5x2 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            {BROKER_CIRCLE_BENEFITS.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#FDFBF7]/80 border border-[#B89555]/20 rounded-xl p-4 text-left hover:border-[#B89555]/40 transition-all"
                style={{ boxShadow: "0 0 15px rgba(203, 166, 75, 0.1)" }}
              >
                <div className="w-10 h-10 rounded-lg bg-[#EFE6D6]/10 border border-[#B89555]/30 flex items-center justify-center mb-3"
                  style={{ boxShadow: "0 0 10px rgba(203, 166, 75, 0.2)" }}
                >
                  <benefit.icon className="w-5 h-5 text-[#1A1A1A]" />
                </div>
                <h3 className="text-white font-medium text-sm mb-1">{benefit.title}</h3>
                <p className="text-white/90 text-xs">{benefit.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Gold Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mb-8" />

          {/* Broker Circle CTA */}
          <div 
            className="bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border-2 border-[#B89555]/40 rounded-2xl p-8 mb-8"
            style={{ boxShadow: "0 0 40px rgba(203, 166, 75, 0.2)" }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Gift className="w-8 h-8 text-[#1A1A1A]" />
            </div>
            <h2 
              className="text-2xl md:text-3xl font-bold mb-4"
              style={{ 
                background: "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 0 30px rgba(203, 166, 75, 0.3)"
              }}
            >
              Join JBJ Global Real Estate Circle
            </h2>
            
            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-3 max-w-3xl mx-auto mb-6">
              {CIRCLE_FEATURES.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 rounded-lg border border-[#B89555]/20 bg-[#EFE6D6]/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-white text-sm text-left">{feature}</span>
                </div>
              ))}
            </div>

            <p className="text-[#1A1A1A] text-sm font-medium">
              100% Free • No Credit Card Required
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-gold via-gold-dark to-gold text-[#1A1A1A] font-bold px-12 py-7 text-lg shadow-xl hover:brightness-110 transition-all animate-gold-glow"
                onClick={() => navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname))}
                style={{
                  boxShadow: "0 0 40px rgba(203, 166, 75, 0.5)",
                  border: "2px solid rgba(203, 166, 75, 0.6)"
                }}
              >
                <LogIn className="w-6 h-6 mr-2" />
                Sign In / Create Account
              </Button>
            </motion.div>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/properties")}
            >
              Browse Properties Instead
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Footer note */}
          <p className="text-[#1A1A1A]/70 text-xs mt-8">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
