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
          {/* Badge - Glass style with gold border, engraved look (matching Services page) */}
          <button 
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 cursor-default"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(200,167,102,0.6)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <span className="text-[#B89555] font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">JBJ Broker Circle • Free Membership</span>
          </button>

          {/* Main headline - Clear value prop */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Your Complete{" "}
            <span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.4)) drop-shadow(0 0 40px rgba(212,175,55,0.3))',
                textShadow: '0 0 30px rgba(255,255,255,0.3)',
              }}
            >
              Success System
            </span>
          </h1>
          
          {/* Sub-headline - What they get */}
          <p className="text-xl md:text-2xl text-[#1A1A1A]/70 mb-10 max-w-2xl mx-auto">
            AI Tools, Training, CRM, Leads & Rewards — All Free
          </p>

          {/* Hero CTA Buttons - Transparent bg, white 3D border, white title, gold icon on normal; filled on hover */}
          <div className="flex flex-wrap justify-center gap-4">
            {!user ? (
              <button 
                onClick={() => navigate("/auth?redirect=/my-account")}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold rounded-xl transition-all duration-300 bg-transparent"
                style={{
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                <Star className="w-5 h-5 text-[#1A1A1A] transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                <span className="text-white group-hover:text-[#1A1A1A] transition-colors">Join Free Now</span>
                <ArrowUpRight className="w-5 h-5 text-[#1A1A1A] transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                {/* Hover fill overlay */}
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
              </button>
            ) : (
              <button 
                onClick={() => navigate('/my-account')}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold rounded-xl transition-all duration-300 bg-transparent"
                style={{
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                <Sparkles className="w-5 h-5 text-[#1A1A1A] transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                <span className="text-white group-hover:text-[#1A1A1A] transition-colors">Open My Dashboard</span>
                <ArrowUpRight className="w-5 h-5 text-[#1A1A1A] transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                {/* Hover fill overlay */}
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
              </button>
            )}
            <button 
              onClick={() => document.getElementById('what-you-get')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold rounded-xl transition-all duration-300 bg-transparent"
              style={{
                border: '2px solid rgba(255,255,255,0.8)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
              }}
            >
              <span className="text-white group-hover:text-[#1A1A1A] transition-colors">See What's Included</span>
              <ChevronDown className="w-5 h-5 text-[#1A1A1A] transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
              {/* Hover fill overlay */}
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
