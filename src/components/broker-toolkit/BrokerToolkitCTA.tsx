import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center bg-white border border-zinc-200 rounded-2xl p-8 md:p-12 shadow-sm"
        >
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-gold" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
            Ready to Join the JBJ Broker Circle?
          </h2>
          <p className="text-zinc-600 mb-6">
            Get free access to all AI tools, 24 training modules, dedicated HR support, 
            a personal property coach, and start earning rewards today.
          </p>

          {!user ? (
            <Button 
              size="lg"
              variant="dark"
              className="mb-6 px-8"
              onClick={() => navigate("/auth?redirect=/my-account")}
            >
              <Star className="w-5 h-5 mr-2 fill-current" />
              Join Now — Completely Free
              <ArrowUpRight className="w-5 h-5 ml-2 text-gold" />
            </Button>
          ) : (
            <Button 
              size="lg"
              variant="dark"
              className="mb-6 px-8"
              onClick={() => navigate("/my-account")}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Access Your Dashboard
              <ArrowUpRight className="w-5 h-5 ml-2 text-gold" />
            </Button>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:+971565911000"
              className="flex items-center gap-2 text-black hover:text-blue-600 transition-colors"
            >
              <Phone className="w-5 h-5 text-blue-500" />
              +971 56 591 1000
            </a>
            <span className="text-zinc-400 hidden sm:block">|</span>
            <a
              href="https://wa.me/971565911000?text=Hi%2C%20I%27m%20interested%20in%20joining%20the%20Broker%20Circle"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-black hover:text-green-600 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-green-500" />
              WhatsApp
            </a>
            <span className="text-zinc-400 hidden sm:block">|</span>
            <a
              href="mailto:Contact@JBJ.ae"
              className="flex items-center gap-2 text-black hover:text-gold transition-colors"
            >
              <Mail className="w-5 h-5 text-gold" />
              Contact@JBJ.ae
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
