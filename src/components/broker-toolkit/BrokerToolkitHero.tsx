import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import brokerHero from "@/assets/videos/broker-dashboard-hero.mp4";
import brokerHeroPoster from "@/assets/broker-hub-hero.jpg";

export function BrokerToolkitHero() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section
      data-hero-dark
      data-no-contrast-guard
      className="relative overflow-hidden min-h-[520px] md:min-h-[600px] flex items-center bg-[#1A1A1A]"
    >
      {/* Background video */}
      <div className="absolute inset-0 z-0">
        <video
          src={brokerHero}
          poster={brokerHeroPoster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />
        {/* Scrim for legibility */}
        <div className="absolute inset-0 bg-[#0A0A0A]/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      </div>

      <div className="container mx-auto px-4 relative z-10 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="inline-block text-[11px] tracking-[0.18em] uppercase text-white/70 mb-5 allow-white">
            Broker Toolkit
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.05] tracking-tight mb-5 allow-white">
            Your Complete Broker Success System
          </h1>
          <p className="text-base md:text-lg text-white/75 max-w-xl mx-auto mb-9 allow-white">
            AI tools, training, CRM, leads and rewards — all included, free for JBJ brokers.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              data-cta="hero-primary"
              onClick={() =>
                user
                  ? navigate("/broker/portal")
                  : navigate("/auth?redirect=/broker/portal")
              }
              className="jj-cta-dark inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-medium"
            >
              <span>{user ? "Open My Dashboard" : "Join Free Now"}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              data-cta="hero-secondary"
              onClick={() =>
                document
                  .getElementById("what-you-get")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="jj-cta-outline inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-medium"
            >
              <span>See What's Included</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
