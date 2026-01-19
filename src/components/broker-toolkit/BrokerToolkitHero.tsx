import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Star, 
  Sparkles, 
  ArrowRight,
  ArrowUpRight,
  ChevronDown
} from "lucide-react";
import brokerHubHero from "@/assets/broker-hub-hero.jpg";

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
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge - Mixed Color Label Style */}
          <button 
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 rounded-full px-5 py-2.5 mb-6 shadow-sm transition-all hover:shadow-md cursor-default"
          >
            <Star className="w-4 h-4 fill-gold text-gold group-hover:fill-black group-hover:text-black transition-colors" />
            <span className="text-gold group-hover:text-black transition-colors font-semibold">JBJ Broker Circle</span>
            <span className="text-black group-hover:text-gold transition-colors font-semibold">Free Membership</span>
          </button>

          {/* Main headline - Clear value prop */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Your Complete{" "}
            <span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6]"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.4)) drop-shadow(0 0 40px rgba(212,175,55,0.3))',
                textShadow: '0 0 30px rgba(255,255,255,0.3)',
              }}
            >
              Success System
            </span>
          </h1>
          
          {/* Sub-headline - What they get */}
          <p className="text-xl md:text-2xl text-zinc-300 mb-10 max-w-2xl mx-auto">
            AI Tools, Training, CRM, Leads & Rewards — All Free
          </p>

          {/* CTA buttons - Primary and Secondary matching sizes */}
          <div className="flex flex-wrap justify-center gap-4">
            {!user ? (
              <button 
                onClick={() => navigate("/auth?redirect=/my-account")}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold rounded-xl transition-all duration-300 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 50%, #F5F0E6 100%)',
                  border: '2px solid rgba(200,167,102,0.5)',
                  boxShadow: `
                    0 8px 24px rgba(200,167,102,0.35),
                    0 4px 12px rgba(0,0,0,0.15),
                    inset 0 2px 4px rgba(255,255,255,0.9),
                    inset 0 -2px 4px rgba(200,167,102,0.2)
                  `,
                }}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                <Star className="w-5 h-5 text-gold group-hover:text-black transition-colors relative z-10" />
                <span className="relative z-10 flex items-center gap-1">
                  <span className="text-gold group-hover:text-black transition-colors">Join</span>
                  <span className="text-black group-hover:text-gold transition-colors">Free Now</span>
                </span>
                <ArrowUpRight className="w-5 h-5 text-gold group-hover:text-black transition-colors relative z-10" />
              </button>
            ) : (
              <button 
                onClick={() => navigate('/my-account')}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold rounded-xl transition-all duration-300 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 50%, #F5F0E6 100%)',
                  border: '2px solid rgba(200,167,102,0.5)',
                  boxShadow: `
                    0 8px 24px rgba(200,167,102,0.35),
                    0 4px 12px rgba(0,0,0,0.15),
                    inset 0 2px 4px rgba(255,255,255,0.9),
                    inset 0 -2px 4px rgba(200,167,102,0.2)
                  `,
                }}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                <Sparkles className="w-5 h-5 text-gold group-hover:text-black transition-colors relative z-10" />
                <span className="relative z-10 flex items-center gap-1">
                  <span className="text-gold group-hover:text-black transition-colors">Open My</span>
                  <span className="text-black group-hover:text-gold transition-colors">Dashboard</span>
                </span>
                <ArrowUpRight className="w-5 h-5 text-gold group-hover:text-black transition-colors relative z-10" />
              </button>
            )}
            <button 
              onClick={() => document.getElementById('what-you-get')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black group"
            >
              See What's Included
              <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
