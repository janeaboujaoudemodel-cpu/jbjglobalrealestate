import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Star,
  ArrowRight,
  Phone,
  Mail,
  Shield,
  Sparkles
} from "lucide-react";

export function BrokerToolkitCTA() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="py-20 bg-gradient-to-b from-zinc-900/50 to-transparent">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30 rounded-2xl p-8 md:p-12"
        >
          <Shield className="w-12 h-12 text-gold mx-auto mb-4" />
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
              className="bg-gradient-to-r from-gold to-gold-dark text-black hover:brightness-110 mb-6 px-8"
              onClick={() => navigate("/auth?redirect=/account")}
            >
              <Star className="w-5 h-5 mr-2 fill-current" />
              Join Now — Completely Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button 
              size="lg"
              className="bg-gradient-to-r from-gold to-gold-dark text-black hover:brightness-110 mb-6 px-8"
              onClick={() => navigate("/account")}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Access Your Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/971565911000?text=Hi%2C%20I%27m%20interested%20in%20joining%20the%20Broker%20Circle"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
            >
              <Phone className="w-5 h-5" />
              +971 56 591 1000
            </a>
            <span className="text-zinc-600 hidden sm:block">|</span>
            <a
              href="mailto:contact@jbj.ae"
              className="flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
            >
              <Mail className="w-5 h-5" />
              contact@jbj.ae
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
