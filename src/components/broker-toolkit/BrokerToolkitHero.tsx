import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Sparkles, 
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Users,
  BookOpen,
  Wrench,
  Trophy
} from "lucide-react";
import brokerHubHero from "@/assets/broker-hub-hero.jpg";

const QUICK_BENEFITS = [
  { icon: Wrench, text: "11+ AI Tools" },
  { icon: BookOpen, text: "24 Training Modules" },
  { icon: Users, text: "Dedicated Support Team" },
  { icon: Trophy, text: "Rewards & Recognition" },
];

export function BrokerToolkitHero() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background Hero Image */}
      <div className="absolute inset-0">
        <img 
          src={brokerHubHero} 
          alt="JBJ Broker Hub" 
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <Badge className="bg-white text-black border-gold/30 mb-6 px-4 py-1.5 shadow-sm">
            <Star className="w-3.5 h-3.5 mr-1.5 fill-gold text-gold" />
            <span className="text-gold">JBJ Broker Circle</span>
            <span className="text-black mx-1">—</span>
            <span className="text-black">Free Membership</span>
          </Badge>

          {/* Main headline - Clear value prop */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Your Complete <span className="text-gold">Success System</span>
          </h1>
          
          {/* Sub-headline - What they get */}
          <p className="text-xl md:text-2xl text-zinc-300 mb-4 max-w-2xl mx-auto">
            AI Tools, Training, CRM, Leads & Rewards — All Free
          </p>
          
          {/* Quick benefits strip */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {QUICK_BENEFITS.map((benefit, i) => (
              <div 
                key={i}
                className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-full px-4 py-2"
              >
                <benefit.icon className="w-4 h-4 text-gold" />
                <span className="text-sm text-zinc-300">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {!user ? (
              <Button 
                size="lg"
                className="bg-gradient-to-r from-gold to-gold-dark text-black hover:brightness-110 px-8 py-6 text-lg font-semibold shadow-lg shadow-gold/20"
                onClick={() => navigate("/auth?redirect=/my-account")}
              >
                <Star className="w-5 h-5 mr-2 fill-current" />
                Join Free Now
                <ArrowUpRight className="w-5 h-5 ml-2 text-gold" />
              </Button>
            ) : (
              <Button 
                size="lg"
                className="bg-gradient-to-r from-gold to-gold-dark text-black hover:brightness-110 px-8 py-6 text-lg font-semibold shadow-lg shadow-gold/20"
                onClick={() => navigate('/my-account')}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Open My Dashboard
                <ArrowUpRight className="w-5 h-5 ml-2 text-gold" />
              </Button>
            )}
            <Button 
              size="lg"
              variant="outline"
              className="border-zinc-700 text-white hover:bg-zinc-800 px-8 py-6 text-lg"
              onClick={() => document.getElementById('what-you-get')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See What's Included
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Instant Access
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Cancel Anytime
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
