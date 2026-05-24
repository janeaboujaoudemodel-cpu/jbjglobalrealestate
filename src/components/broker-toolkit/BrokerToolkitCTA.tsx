import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Star,
  ArrowRight,
  ArrowUpRight,
  Phone,
  Mail,
  Shield,
  Sparkles,
  MessageCircle
} from "lucide-react";

export function BrokerToolkitCTA() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="py-16 md:py-20 bg-[#1A1A1A]">
      <div className="container mx-auto px-4">
        <div className="max-w-[1100px] mx-auto">
          {/* OUTER CARD (Active Champagne) - Larger padding for 3rd layer visibility */}
          <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
            {/* INNER CARD (Pearl) - Significantly smaller to show more champagne layer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 rounded-xl sm:rounded-2xl p-6 md:p-10 shadow-[0_0_30px_rgba(200,167,102,0.25)] text-center"
            >
              {/* Icon container */}
              <div className="w-16 h-16 bg-[#1A1A1A] border border-[#B89555]/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-[#1A1A1A]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-4">
                Ready to Join the <span className="text-[#1A1A1A]">JBJ Broker Circle?</span>
              </h2>
              <p className="text-[#1A1A1A]/70 mb-8 max-w-xl mx-auto">
                Get free access to all AI tools, 24 training modules, dedicated HR support, 
                a personal property coach, and start earning rewards today.
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {!user ? (
                  <button 
                    onClick={() => navigate("/auth?redirect=/my-account")}
                    className="relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] group"
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F7F2EA 50%, #E8DFD0 75%, #B89555 100%)',
                      boxShadow: `
                        0 10px 30px rgba(200,167,102,0.4),
                        0 6px 15px rgba(0,0,0,0.2),
                        inset 0 2px 4px rgba(255,255,255,0.9),
                        inset 0 -2px 4px rgba(200,167,102,0.2),
                        0 0 20px rgba(200,167,102,0.3)
                      `,
                    }}
                  >
                    <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                    <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
                    <span className="relative flex items-center gap-1">
                      <Star className="w-5 h-5 text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors" />
                      <span className="text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">Join Now</span>
                      <span className="text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">— Completely Free</span>
                      <ArrowUpRight className="w-5 h-5 text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors" />
                    </span>
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate("/my-account")}
                    className="relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] group"
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F7F2EA 50%, #E8DFD0 75%, #B89555 100%)',
                      boxShadow: `
                        0 10px 30px rgba(200,167,102,0.4),
                        0 6px 15px rgba(0,0,0,0.2),
                        inset 0 2px 4px rgba(255,255,255,0.9),
                        inset 0 -2px 4px rgba(200,167,102,0.2),
                        0 0 20px rgba(200,167,102,0.3)
                      `,
                    }}
                  >
                    <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                    <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
                    <span className="relative flex items-center gap-1">
                      <Sparkles className="w-5 h-5 text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors" />
                      <span className="text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">Access Your</span>
                      <span className="text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">Dashboard</span>
                      <ArrowUpRight className="w-5 h-5 text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors" />
                    </span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="tel:+971547167107"
                  className="flex items-center gap-2 text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors"
                >
                  <Phone className="w-5 h-5 text-blue-500" />
                  +971 54 716 7107
                </a>
                <span className="text-[#1A1A1A]/70 hidden sm:block">|</span>
                <a
                  href="https://wa.me/971547167107?text=Hi%2C%20I%27m%20interested%20in%20joining%20the%20Broker%20Circle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  WhatsApp
                </a>
                <span className="text-[#1A1A1A]/70 hidden sm:block">|</span>
                <a
                  href="mailto:CONTACT@JBJ.AE"
                  className="flex items-center gap-2 text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors"
                >
                  <Mail className="w-5 h-5 text-[#1A1A1A]" />
                  CONTACT@JBJ.AE
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
