import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Lock, Award, Medal, BadgeCheck, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useOwnerSignatureAssets } from "@/hooks/useOwnerSignatureAssets";
import { StampOverlay } from "@/components/shared/StampOverlay";
import { cn } from "@/lib/utils";

interface CertificatePreviewProps {
  isLocked?: boolean;
}

/** Premium gold-rimmed certificate medallion — pure white ShieldCheck on emerald */
function CertificateMedallion({ size = 64 }: { size?: number }) {
  const ringW = Math.max(3, Math.round(size * 0.06));
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      data-no-contrast-guard
      aria-hidden
    >
      {/* Outer gold conic ring (foil) */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 210deg, #B89555 0%, #F1E2B8 18%, #B89555 36%, #8A6A35 54%, #F1E2B8 72%, #B89555 100%)",
          padding: ringW,
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          boxShadow:
            "0 8px 20px -8px rgba(184,149,85,0.55), 0 1px 0 rgba(255,246,224,0.6) inset",
        }}
      />
      {/* Inner emerald disc */}
      <span
        className="absolute rounded-full"
        style={{
          inset: ringW + 1,
          background:
            "radial-gradient(circle at 32% 26%, #0E8A66 0%, #064E3B 55%, #032A1F 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -6px 14px rgba(0,0,0,0.35), 0 6px 18px rgba(6,78,59,0.35)",
        }}
      />
      {/* Specular highlight */}
      <span
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: ringW + 2,
          background:
            "radial-gradient(ellipse 70% 35% at 50% 18%, rgba(255,255,255,0.35), rgba(255,255,255,0) 60%)",
        }}
      />
      {/* White ShieldCheck glyph */}
      <ShieldCheck
        className="relative !text-white !stroke-white"
        style={{
          width: size * 0.52,
          height: size * 0.52,
          color: "#FFFFFF",
          stroke: "#FFFFFF",
          fill: "none",
          filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.45))",
        }}
        strokeWidth={2.2}
      />
    </span>
  );
}



/** Gold-foil fallback seal when no owner stamp uploaded */
function FoilSeal({ size = 130 }: { size?: number }) {
  return (
    <div
      className="relative grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 30% 25%, #FFF6E0 0%, #F1E2B8 50%, #B89555 100%)",
        boxShadow:
          "inset 0 0 14px rgba(138,106,53,0.45), 0 4px 14px rgba(184,149,85,0.25)",
      }}
      data-no-contrast-guard
    >
      <div
        className="absolute inset-[6px] rounded-full border border-[#8A6A35]/60"
        style={{ boxShadow: "inset 0 0 8px rgba(255,246,224,0.4)" }}
      />
      <BadgeCheck className="relative" style={{ width: size * 0.5, height: size * 0.5, color: "#1A1A1A" }} strokeWidth={2} />
    </div>
  );
}

/** Diagonal shimmer sweep across the certificate plate */
const CERT_SHIMMER_CSS = `
@keyframes jj-cert-shimmer {
  0%   { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
  20%  { opacity: .55; }
  60%  { opacity: .55; }
  100% { transform: translateX(160%)  skewX(-18deg); opacity: 0; }
}
.jj-cert-shimmer {
  position: absolute; inset: 0; pointer-events: none; overflow: hidden;
  border-radius: inherit;
}
.jj-cert-shimmer::after {
  content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 45%;
  background: linear-gradient(90deg, transparent 0%, rgba(255,246,224,.45) 50%, transparent 100%);
  animation: jj-cert-shimmer 6s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .jj-cert-shimmer::after { animation: none; opacity: 0; }
}
`;

export function CertificatePreview({ isLocked = false }: CertificatePreviewProps) {
  const { user } = useAuth();
  const { data: signatureAssets } = useOwnerSignatureAssets("signature");
  const { data: stampAssets } = useOwnerSignatureAssets("stamp");

  const signatureUrl =
    signatureAssets?.find((a) => a.is_default)?.image_url ||
    signatureAssets?.[0]?.image_url ||
    null;
  const stampUrl =
    stampAssets?.find((a) => a.is_default)?.image_url ||
    stampAssets?.[0]?.image_url ||
    null;

  const userName = isLocked
    ? "Your Name Here"
    : user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Broker";
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const certId = `JBJ-${(user?.id || "preview").slice(0, 8).toUpperCase()}-${new Date().getFullYear()}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <Card className="bg-[#F7F2EA] border-[#B89555]/35 overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6 flex flex-col items-center">
            <CertificateMedallion size={64} />
            <h3 className="text-2xl font-semibold text-[#1A1A1A] mt-4">
              {isLocked ? "Certificate Preview" : "Congratulations!"}
            </h3>
            <p className="text-[#1A1A1A]/75 text-sm mt-1 max-w-md leading-relaxed">
              {isLocked
                ? "Complete every training module to unlock and download your certificate."
                : "You've completed the JBJ Broker Certification Program."}
            </p>
          </div>

            {/* Certificate plate — institutional champagne certificate */}
          <div
            className={cn(
                "relative rounded-2xl overflow-hidden mb-6 border border-[#B89555]/65",
                "shadow-[0_30px_75px_-34px_rgba(26,26,26,0.55)]",
            )}
            style={{
                background:
                  "linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 42%, #EFE6D6 100%)",
            }}
          >
            {/* Subtle champagne fleck texture */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B89555' fill-opacity='0.07'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            {/* Single inner gold rule — middle frame removed for cleaner read */}
            <div className="absolute inset-5 rounded-lg border border-[#B89555]/30 pointer-events-none" />

            {/* Corner angle flourishes (kept — they frame the certificate) */}
            <div className="absolute top-5 left-5 w-12 h-12 border-t-[1.5px] border-l-[1.5px] border-[#B89555]/85 rounded-tl-md pointer-events-none" />
            <div className="absolute top-5 right-5 w-12 h-12 border-t-[1.5px] border-r-[1.5px] border-[#B89555]/85 rounded-tr-md pointer-events-none" />
            <div className="absolute bottom-5 left-5 w-12 h-12 border-b-[1.5px] border-l-[1.5px] border-[#B89555]/85 rounded-bl-md pointer-events-none" />
            <div className="absolute bottom-5 right-5 w-12 h-12 border-b-[1.5px] border-r-[1.5px] border-[#B89555]/85 rounded-br-md pointer-events-none" />

            {/* Animated shimmer sweep (respects reduced-motion) */}
            <style dangerouslySetInnerHTML={{ __html: CERT_SHIMMER_CSS }} />
            <div className="jj-cert-shimmer" aria-hidden />


            {/* Content */}
            <div className="relative z-10 px-8 sm:px-14 py-10 sm:py-14 text-center">
              {/* Clean academy crest — no wordmark underline on the plate */}
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#B89555]/55 bg-[#FDFBF7]/80 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#1A1A1A] shadow-[0_10px_28px_-24px_rgba(26,26,26,.55)]">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[image:var(--jj-emerald-ombre)]" data-surface="emerald">
                  <GraduationCap className="h-3.5 w-3.5 text-white" strokeWidth={2.6} />
                </span>
                Broker Academy
              </div>

              {/* Eyebrow */}
              <div className="text-[11px] sm:text-xs tracking-[0.34em] uppercase text-[#B89555] mb-6">
                Certificate of Achievement
              </div>

              <div className="text-[#1A1A1A] text-sm mb-3">
                This is to certify that
              </div>

              {/* Recipient name */}
              <div className="inline-block pb-2 mb-6 border-b border-[#B89555]/70">
                <div className="text-3xl sm:text-4xl font-semibold text-[#1A1A1A] tracking-wide">
                  {userName}
                </div>
              </div>

              <div className="text-[#1A1A1A]/85 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                has successfully completed all phases of the broker academy
                certification program and is hereby recognised as a
              </div>

              {/* Title */}
              <div className="flex items-center justify-center gap-3 mb-10">
                <span className="h-px w-12 bg-[#B89555]/70" />
                <div className="text-base sm:text-lg font-semibold tracking-[0.28em] text-[#1A1A1A] uppercase">
                  Certified JBJ Broker
                </div>
                <span className="h-px w-12 bg-[#B89555]/70" />
              </div>

              {/* Seal — centered, behind signature row vibe */}
              <div className="flex justify-center mb-8">
                {stampUrl && !isLocked ? (
                  <div className="relative" style={{ filter: "drop-shadow(0 2px 6px rgba(184,149,85,0.25))" }}>
                    <StampOverlay
                      src={stampUrl}
                      size={130}
                      opacity={0.92}
                      style={{ mixBlendMode: "multiply" as const }}
                    />
                  </div>
                ) : (
                  <FoilSeal size={130} />
                )}
              </div>

              {/* Signature block — right-aligned, locked layout */}
              <div className="flex justify-end mb-6">
                <div className="w-[300px] text-right">
                  <div className="h-12 flex items-end justify-end">
                    {signatureUrl && !isLocked ? (
                      <img
                        src={signatureUrl}
                        alt="Signature"
                        draggable={false}
                        className="max-h-12 max-w-[220px] object-contain"
                      />
                    ) : (
                      <span className="text-[#1A1A1A]/40 text-xs italic">
                        {isLocked ? "— signature on issue —" : ""}
                      </span>
                    )}
                  </div>
                  <div className="h-px w-full bg-[#B89555]/70 mt-1" />
                  <div className="text-[13px] text-[#1A1A1A] mt-2 font-semibold">
                    Jeyhun Babayev
                  </div>
                  <div className="text-[10px] text-[#1A1A1A]/70 uppercase tracking-[0.18em] mt-0.5">
                    Founder &amp; CEO
                  </div>
                  <div className="text-[10px] text-[#B89555] tracking-wide mt-0.5">
                    Broker Academy
                  </div>
                </div>
              </div>

              {/* Bottom strip — date + certificate ID */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-[#B89555]/35">
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/65">
                    Issued
                  </div>
                  <div className="text-[12px] text-[#1A1A1A] font-medium mt-0.5">
                    {currentDate}
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#EFE6D6] border border-[#B89555]/50 px-3 py-1">
                  <span className="text-[9px] uppercase tracking-[0.22em] text-[#1A1A1A]/65">
                    Certificate ID
                  </span>
                  <span className="text-[11px] text-[#1A1A1A] font-mono">
                    {certId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isLocked ? (
              <Button
                disabled
                data-cta="cert-locked"
                data-surface="emerald"
                className="jj-pill-emerald-metallic opacity-100 cursor-not-allowed disabled:opacity-100 [&_svg]:!text-white [&_svg]:!stroke-white [&_*]:!text-white"
                style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
              >
                <Lock className="w-4 h-4 mr-2 text-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                <span className="text-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                  Complete Certification to Download
                </span>
              </Button>
            ) : (
              <>
                <Button data-cta="cert-download" data-surface="emerald" className="jj-pill-emerald-metallic [&_svg]:!text-white [&_svg]:!stroke-white [&_*]:!text-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                  <Download className="w-4 h-4 mr-2 text-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                  <span className="text-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Download Certificate</span>
                </Button>
                <Button data-cta="cert-share" className="jj-cta-outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Achievement
                </Button>
              </>
            )}
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}
