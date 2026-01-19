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
    <section className="py-20 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Inner card in black */}
          <Card className="bg-black border border-gold/30 shadow-xl shadow-gold/10">
            <CardContent className="p-8 md:p-12">
              {/* Icon container with white/gold/champagne pearl fill */}
              <div className="w-16 h-16 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/30 shadow-md shadow-gold/20">
                <Shield className="w-8 h-8 text-gold" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to Join the JBJ Broker Circle?
              </h2>
              <p className="text-zinc-400 mb-6">
                Get free access to all AI tools, 24 training modules, dedicated HR support, 
                a personal property coach, and start earning rewards today.
              </p>

              {!user ? (
                <Button 
                  size="lg"
                  className="mb-6 px-8 relative bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300"
                  onClick={() => navigate("/auth?redirect=/my-account")}
                >
                  <Star className="w-5 h-5 mr-2 text-black fill-current" />
                  <span className="text-gold font-semibold">Join Now — Completely Free</span>
                  <ArrowUpRight className="w-5 h-5 ml-2 text-gold" />
                </Button>
              ) : (
                <Button 
                  size="lg"
                  className="mb-6 px-8 relative bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300"
                  onClick={() => navigate("/my-account")}
                >
                  <Sparkles className="w-5 h-5 mr-2 text-black" />
                  <span className="text-gold font-semibold">Access Your Dashboard</span>
                  <ArrowUpRight className="w-5 h-5 ml-2 text-gold" />
                </Button>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="tel:+971565911000"
                  className="flex items-center gap-2 text-zinc-300 hover:text-gold transition-colors"
                >
                  <Phone className="w-5 h-5 text-blue-400" />
                  +971 56 591 1000
                </a>
                <span className="text-zinc-600 hidden sm:block">|</span>
                <a
                  href="https://wa.me/971565911000?text=Hi%2C%20I%27m%20interested%20in%20joining%20the%20Broker%20Circle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-zinc-300 hover:text-gold transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  WhatsApp
                </a>
                <span className="text-zinc-600 hidden sm:block">|</span>
                <a
                  href="mailto:Contact@JBJ.ae"
                  className="flex items-center gap-2 text-zinc-300 hover:text-gold transition-colors"
                >
                  <Mail className="w-5 h-5 text-gold" />
                  Contact@JBJ.ae
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
