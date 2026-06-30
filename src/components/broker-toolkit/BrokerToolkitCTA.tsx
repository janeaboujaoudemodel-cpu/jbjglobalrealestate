import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowUpRight, Phone, Mail, MessageCircle, Sparkles } from "lucide-react";

export function BrokerToolkitCTA() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section id="section-cta" className="jj-band jj-band--raised py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto bg-[#FDFBF7] border border-[#B89555]/40 rounded-2xl p-10 md:p-16 text-center shadow-[0_30px_60px_-30px_rgba(184,149,85,0.35)]"
        >

          <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-[#1A1A1A]/60 mb-4">
            <Sparkles className="w-3 h-3 text-[#B89555]" />
            Broker Circle
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#1A1A1A] mb-3">
            Ready to join the JBJ Broker Circle?
          </h2>
          <p className="text-[#1A1A1A]/70 text-base mb-7 max-w-xl mx-auto">
            Free access to all broker tools, certification courses, dedicated support and a built-in CRM.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-7">
            <button
              type="button"
              data-cta="cta-primary"
              data-surface="emerald"
              onClick={() =>
                user
                  ? navigate("/broker/portal")
                  : navigate("/auth?redirect=/broker/portal")
              }
              className="jj-pill-emerald-metallic inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-medium"
            >
              {user ? "Open Broker Portal" : "Join Free Now"}
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <a
              href="https://wa.me/971547167107?text=Hi%2C%20I%27m%20interested%20in%20joining%20the%20Broker%20Circle"
              target="_blank"
              rel="noopener noreferrer"
              data-cta="cta-secondary"
              className="jj-cta-outline inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Us
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2 text-sm text-[#1A1A1A]/70">
            <a href="tel:+971547167107" className="inline-flex items-center gap-2 hover:text-[#1A1A1A]">
              <Phone className="w-4 h-4 text-[#B89555]" /> +971 54 716 7107
            </a>
            <a href="mailto:CONTACT@JBJ.AE" className="inline-flex items-center gap-2 hover:text-[#1A1A1A]">
              <Mail className="w-4 h-4 text-[#B89555]" /> CONTACT@JBJ.AE
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
