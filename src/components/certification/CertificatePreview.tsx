import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Lock, Award, Medal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useOwnerSignatureAssets } from "@/hooks/useOwnerSignatureAssets";
import { StampOverlay } from "@/components/shared/StampOverlay";
import { cn } from "@/lib/utils";

interface CertificatePreviewProps {
  isLocked?: boolean;
}

/** Premium gold medallion — composed lucide icons + gradient ring + slow shimmer */
function CertificateMedallion({ size = 64 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      data-no-contrast-guard
    >
      {/* Outer gold ring */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 210deg, #B89555, #F1E2B8, #B89555, #8A6A35, #F1E2B8, #B89555)",
          padding: 2,
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      {/* Inner champagne disc */}
      <span
        className="absolute inset-[6px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, #FFF4D8 0%, #EFE6D6 45%, #C8A65A 100%)",
          boxShadow: "inset 0 0 12px rgba(184,149,85,0.45)",
        }}
      />
      {/* Slow rotating shimmer */}
      <span
        className="absolute inset-0 rounded-full motion-safe:animate-[pulseSlow_4s_ease-in-out_infinite] pointer-events-none"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, rgba(255,244,216,0.55) 40deg, transparent 90deg, transparent 360deg)",
          mixBlendMode: "screen",
          opacity: 0.55,
        }}
      />
      {/* Award icon */}
      <Award
        className="relative"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          color: "#5A3F12",
          filter: "drop-shadow(0 1px 0 rgba(255,244,216,0.6))",
        }}
        strokeWidth={2}
      />
      {/* Small medal accent */}
      <Medal
        className="absolute bottom-0 right-0"
        style={{ width: size * 0.28, height: size * 0.28, color: "#B89555" }}
        strokeWidth={2.2}
      />
    </span>
  );
}

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
            <p className="text-[#1A1A1A]/70 text-sm mt-1 max-w-md">
              {isLocked
                ? "Complete all certification phases to earn this certificate"
                : "You've completed the JBJ Broker Certification Program"}
            </p>
          </div>

          {/* Certificate plate — dark obsidian with metallic mirror sweep */}
          <div
            className={cn(
              "relative rounded-2xl overflow-hidden mb-6 border border-[#B89555]/60",
              "shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]",
            )}
            style={{
              background:
                "linear-gradient(135deg, #0E0B07 0%, #1A1410 50%, #0E0B07 100%)",
            }}
          >
            {/* Subtle gold fleck pattern */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B89555' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            {/* Metallic mirror sweep — slow continuous */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              <span
                className="absolute top-0 left-0 h-full w-1/3 motion-safe:animate-[metallicSweep_8s_ease-in-out_infinite]"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 0%, rgba(241,226,184,0.10) 45%, rgba(255,244,216,0.18) 50%, rgba(241,226,184,0.10) 55%, transparent 100%)",
                }}
              />
            </div>

            {/* Double-rule frame */}
            <div className="absolute inset-3 rounded-xl border border-[#B89555]/35 pointer-events-none" />
            <div className="absolute inset-5 rounded-lg border border-[#B89555]/15 pointer-events-none" />

            {/* Corner flourishes */}
            <div className="absolute top-5 left-5 w-10 h-10 border-t-[1.5px] border-l-[1.5px] border-[#B89555]/70 rounded-tl-md pointer-events-none" />
            <div className="absolute top-5 right-5 w-10 h-10 border-t-[1.5px] border-r-[1.5px] border-[#B89555]/70 rounded-tr-md pointer-events-none" />
            <div className="absolute bottom-5 left-5 w-10 h-10 border-b-[1.5px] border-l-[1.5px] border-[#B89555]/70 rounded-bl-md pointer-events-none" />
            <div className="absolute bottom-5 right-5 w-10 h-10 border-b-[1.5px] border-r-[1.5px] border-[#B89555]/70 rounded-br-md pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 px-8 sm:px-12 py-10 sm:py-12 text-center">
              {/* Brand wordmark — champagne, no gradient (legible) */}
              <div className="text-[15px] sm:text-base font-semibold tracking-[0.32em] text-[#EFE6D6]">
                JBJ GLOBAL REAL ESTATE
              </div>

              {/* Gold rule */}
              <div className="mx-auto mt-3 mb-5 h-px w-20 bg-gradient-to-r from-transparent via-[#B89555] to-transparent" />

              {/* Eyebrow */}
              <div className="text-[11px] sm:text-xs tracking-[0.34em] uppercase text-[#B89555] mb-5">
                Certificate of Achievement
              </div>

              <div className="text-[#EFE6D6]/85 text-sm mb-3">
                This is to certify that
              </div>

              {/* Recipient name — solid champagne + thin gold underline */}
              <div className="inline-block pb-2 mb-5 border-b border-[#B89555]/60">
                <div className="text-3xl sm:text-4xl font-serif text-[#FFF4D8] tracking-wide">
                  {userName}
                </div>
              </div>

              <div className="text-[#EFE6D6]/80 text-sm max-w-md mx-auto mb-5 leading-relaxed">
                has successfully completed all phases of the JBJ Global Real Estate
                Broker Certification Program and is hereby recognised as a
              </div>

              {/* Title */}
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="h-px w-10 bg-[#B89555]/70" />
                <div className="text-base sm:text-lg font-semibold tracking-[0.28em] text-[#FFF4D8] uppercase">
                  Certified JBJ Broker
                </div>
                <span className="h-px w-10 bg-[#B89555]/70" />
              </div>

              {/* Signature + stamp row */}
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 items-end gap-6 text-left">
                {/* Signature */}
                <div className="col-span-1">
                  <div className="h-12 flex items-end">
                    {signatureUrl && !isLocked ? (
                      <img
                        src={signatureUrl}
                        alt="Signature"
                        draggable={false}
                        className="max-h-12 max-w-[180px] object-contain"
                        style={{ filter: "brightness(1.6) contrast(1.1)" }}
                      />
                    ) : (
                      <span className="text-[#EFE6D6]/30 text-xs italic">
                        {isLocked ? "— signature on issue —" : ""}
                      </span>
                    )}
                  </div>
                  <div className="h-px w-full bg-[#B89555]/60 mt-1" />
                  <div className="text-[11px] text-[#EFE6D6] mt-1 font-medium">
                    Jeyhun Babayev
                  </div>
                  <div className="text-[10px] text-[#EFE6D6]/65 tracking-wide">
                    Founder &amp; CEO, JBJ Global Real Estate
                  </div>
                </div>

                {/* Stamp — center on sm+ */}
                <div className="hidden sm:flex justify-center col-span-1">
                  {stampUrl && !isLocked ? (
                    <div className="relative">
                      <StampOverlay
                        src={stampUrl}
                        size={104}
                        opacity={0.92}
                        style={{ filter: "brightness(1.15)" }}
                      />
                    </div>
                  ) : (
                    <div className="w-[104px] h-[104px] rounded-full border border-dashed border-[#B89555]/40 flex items-center justify-center text-[10px] text-[#EFE6D6]/40 tracking-widest uppercase text-center px-2">
                      Company Seal
                    </div>
                  )}
                </div>

                {/* Date + ID */}
                <div className="col-span-1 text-right">
                  <div className="h-px w-full bg-[#B89555]/60 mb-1" />
                  <div className="text-[11px] text-[#EFE6D6] font-medium">
                    {currentDate}
                  </div>
                  <div className="text-[10px] text-[#EFE6D6]/65 tracking-wide mt-2">
                    Certificate ID
                  </div>
                  <div className="text-[11px] text-[#B89555] font-mono tracking-tight">
                    {certId}
                  </div>
                </div>
              </div>

              {/* Mobile stamp row */}
              {stampUrl && !isLocked && (
                <div className="sm:hidden flex justify-center mt-6">
                  <StampOverlay src={stampUrl} size={88} opacity={0.92} />
                </div>
              )}

              {isLocked && (
                <div
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <span className="text-[80px] sm:text-[120px] font-bold tracking-[0.25em] text-[#B89555]/10 rotate-[-18deg] select-none">
                    PREVIEW
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isLocked ? (
              <Button disabled className="bg-[#EFE6D6]/60 text-[#1A1A1A]/60 cursor-not-allowed border border-[#B89555]/30">
                <Lock className="w-4 h-4 mr-2" />
                Complete Certification to Download
              </Button>
            ) : (
              <>
                <Button className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-[#EFE6D6] border border-[#B89555]/40">
                  <Download className="w-4 h-4 mr-2" />
                  Download Certificate
                </Button>
                <Button
                  variant="outline"
                  className="border-[#B89555]/50 text-[#1A1A1A] hover:bg-[#EFE6D6]"
                >
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
