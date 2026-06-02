import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import VerificationModal from "./VerificationModal";

const VerificationBanner = () => {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: verificationStatus } = useQuery({
    queryKey: ["verification-status", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_verifications")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.status ?? "none";
    },
    enabled: !!user,
  });

  if (verificationStatus === "approved" || verificationStatus === "pending") {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.0, ease: "easeInOut" }}
        data-surface="navy"
        className="surface-navy relative overflow-hidden bg-[#102540]"
      >
        <div className="max-w-[1600px] mx-auto px-4 py-4 sm:py-5 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
            {/* Shield icon */}
            <div data-surface="navy" className="surface-navy flex-shrink-0 w-10 h-10 rounded-lg bg-[#1a3d63] border border-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            </div>

            {/* Text */}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm sm:text-base text-white/85 font-medium leading-snug">
                Join us in building a safer community.{" "}
                <span className="text-white font-semibold">Get verified</span> to boost your credibility and assist us in creating trust amongst our users!
              </p>
            </div>

            {/* CTA Button — champagne pill, BLACK title + BLACK arrow at all states */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="jj-cta-champagne group relative flex-shrink-0 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md h-11 min-w-[220px] px-6 text-sm font-semibold tracking-wide border border-[#B89555]/70 shadow-[0_2px_10px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,255,255,0.25)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.99] transition-transform duration-300 ease-out overflow-hidden"
              data-surface="champagne"
              data-cta="champagne"
              aria-label="Open identity verification"
              style={{ color: "#1A1A1A" }}
            >
              <span data-surface="champagne" className="relative z-10 whitespace-nowrap font-semibold" style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}>Get Verified</span>
              <ArrowRight
                data-surface="champagne"
                className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                strokeWidth={2.5}
                style={{ color: "#1A1A1A", stroke: "#1A1A1A" }}
              />
            </button>


          </div>
        </div>
      </motion.div>

      <VerificationModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};

export default VerificationBanner;
