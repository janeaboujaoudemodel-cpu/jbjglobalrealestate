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
        data-ink-emerald
        data-on-dark
        data-no-contrast-guard
        className="allow-white relative overflow-hidden"
        style={{
          /* Mirror of ModePortalBanner — REVERSED direction so the
             two stacked emerald straps don't visually merge. */
          backgroundImage:
            "linear-gradient(135deg, #042c1c 0%, #064E3B 55%, #0A6B53 100%)",
        }}
      >
        <div className="max-w-[1600px] mx-auto px-4 py-4 sm:py-5 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
            {/* Shield icon — translucent white tile, white icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/15 border border-white/40 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.2} />
            </div>

            {/* Text */}
            <div className="flex-1 text-center sm:text-left">
              <p className="allow-white text-sm sm:text-base font-medium leading-snug" style={{ color: "#FFFFFF" }}>
                <span className="allow-white font-semibold" style={{ color: "#FFFFFF" }}>Get Verified.</span>{" "}
                <span className="allow-white" style={{ color: "rgba(255,255,255,0.88)" }}>
                  Join us in building a safer community. Boost your credibility and help us create trust amongst our users.
                </span>
              </p>
            </div>

            {/* CTA — IDENTICAL shape to <ModePortalBanner /> "Open … Portal" pill. */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              data-cta="dark"
              data-allow-dark-cta
              data-no-contrast-guard
              aria-label="Open identity verification"
              className="group relative flex-shrink-0 h-11 min-w-[220px] px-6 text-sm font-semibold tracking-wide rounded-md hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.99] transition-transform duration-300 ease-out overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap border border-[#34D399]/55"
              style={{
                backgroundImage: "linear-gradient(135deg, #064E3B 0%, #042c1c 60%, #0A0A0A 100%)",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                boxShadow: "0 8px 22px -8px rgba(6,78,59,0.55), 0 0 0 1px rgba(52,211,153,0.18), 0 0 16px rgba(52,211,153,0.18), inset 0 1px 0 rgba(255,255,255,0.20)",
              }}
            >
              <span className="allow-white relative z-10 font-semibold" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                Get Verified
              </span>
              <ArrowRight
                className="allow-white relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                strokeWidth={2.5}
                style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
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
