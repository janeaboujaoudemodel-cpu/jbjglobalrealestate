import * as React from "react";
import { Download, Lock, Loader2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import jbjFullLogoDarkBg from "@/assets/jbj-fulllogo-dark-bg.jpg";

const BROCHURE_BG_URL = "https://imgengine.khaleejtimes.com/khaleejtimes-english/2026-02-04/lvnx1x0g/Dubai.jpg?width=1200&height=800&format=auto";
import { maybeProxyStorageUrl, proxyAnyDownloadUrl } from "@/utils/downloadProxy";
interface PremiumBrochureCardProps {
  projectName: string;
  projectId?: string;
  projectSlug?: string;
  brochureUrl?: string;
  projectImageUrl?: string;
  onDownloadClick: () => void;
  isLocked?: boolean;
  location?: string;
}

/**
 * Premium Brochure Card - Styled like a real brochure/book resting on a table
 * with project photo as cover, 3D hover effect that lifts off the surface
 * Shows layered pages underneath for book effect
 */
const PremiumBrochureCard = ({
  projectName,
  projectId,
  projectSlug,
  brochureUrl: brochureUrlProp,
  projectImageUrl,
  onDownloadClick,
  isLocked = false,
  location,
}: PremiumBrochureCardProps) => {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(false);
  // Allow the auto-fetch result to override the prop without remounting.
  const [resolvedUrl, setResolvedUrl] = React.useState<string | undefined>(brochureUrlProp);
  React.useEffect(() => setResolvedUrl(brochureUrlProp), [brochureUrlProp]);
  const brochureUrl = resolvedUrl;

  const streamPdf = async (sourceUrl: string) => {
    const filename = `${projectName.replace(/\s+/g, "-")}-Brochure.pdf`;
    const safeUrl = proxyAnyDownloadUrl(sourceUrl, { filename, disposition: "attachment" });
    setIsDownloading(true);
    try {
      const response = await fetch(safeUrl);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.warn("Blob download failed, falling back to anchor click:", error);
      try {
        const link = document.createElement("a");
        link.href = safeUrl;
        link.download = filename;
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackErr) {
        console.error("Anchor-click download failed:", fallbackErr);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClick = async () => {
    if (isLocked) {
      onDownloadClick();
      return;
    }
    if (brochureUrl) {
      streamPdf(brochureUrl);
      return;
    }
    // No URL — try to auto-fetch from developer-direct or Provident (partner).
    // Forbidden secondary portals are rejected server-side.
    if (!projectId && !projectSlug) {
      onDownloadClick();
      return;
    }
    setIsFetching(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("brochure-auto-fetch", {
        body: { projectId, slug: projectSlug },
      });
      if (!error && data?.found && data.url) {
        setResolvedUrl(data.url);
        await streamPdf(data.url);
        return;
      }
    } catch (e) {
      console.warn("brochure-auto-fetch failed:", e);
    } finally {
      setIsFetching(false);
    }
    // Nothing found anywhere allowed → open lead modal as a real request.
    onDownloadClick();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Premium Brochure Card - Horizontal "sleeping" on table style */}
      <motion.div
        className="relative cursor-pointer group"
        onClick={handleClick}
        initial={{ rotateX: 8, rotateY: 0, y: 0 }}
        whileHover={{ 
          rotateX: 0, 
          rotateY: -5, 
          y: -20, 
          scale: 1.02,
          transition: { type: "spring", stiffness: 200, damping: 15 }
        }}
        whileTap={{ scale: 0.98, y: -10 }}
        style={{ 
          perspective: "1200px",
          transformStyle: "preserve-3d"
        }}
      >
        {/* Stacked Pages Effect - visible underneath the main cover */}
        <div 
          className="absolute w-[340px] h-[220px] rounded-lg"
          style={{
            transform: "translateZ(-8px) translateX(6px) translateY(6px)",
            background: "linear-gradient(135deg, #ECE2D2 0%, #D8C7A6 100%)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
          }}
        />
        <div 
          className="absolute w-[340px] h-[220px] rounded-lg"
          style={{
            transform: "translateZ(-4px) translateX(3px) translateY(3px)",
            background: "linear-gradient(135deg, #F7F1E6 0%, #ECE2D2 100%)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        />

        {/* Main Card Container - Larger brochure with project image */}
        <div 
          className="relative w-[340px] h-[220px] rounded-lg overflow-hidden"
          style={{
            transformStyle: "preserve-3d",
            boxShadow: `
              0 30px 60px -15px rgba(0,0,0,0.5),
              0 15px 35px -10px rgba(0,0,0,0.35),
              0 5px 15px -5px rgba(0,0,0,0.25),
              inset 0 1px 0 rgba(255,255,255,0.1)
            `,
          }}
        >
          {/* Dynamic project image background */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${projectImageUrl || BROCHURE_BG_URL})` }}
          />
          
          {/* Layered scrims — top + bottom — guarantee wordmark and title legibility on any photo */}
          <div className="absolute inset-x-0 top-0 h-[34%] bg-gradient-to-b from-black/50 via-black/18 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/46 via-black/8 to-transparent" />

          {/* Subtle emerald depth overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#064E3B]/6 via-transparent to-black/5" />

          {/* Spine effect on left - book binding */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
          <div className="absolute left-2 top-4 bottom-4 w-[2px] bg-[#EFE6D6]/40 rounded-full" />

          {/* Clean image frame — no gold border on brochure cover */}
          <div className="absolute inset-0 rounded-lg ring-1 ring-black/20 group-hover:ring-black/30 transition-colors" />

          {/* Content Layout */}
          <div className="relative z-10 h-full flex flex-col justify-end p-6">
            {/* Top: Brand mark — emerald label, pure white content */}
            <div
              data-no-contrast-guard
              data-on-dark
              className="absolute top-3 left-5 flex items-center gap-2 pr-3 py-1.5 rounded-md allow-white"
              style={{
                background: "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)",
                paddingLeft: 6,
                right: 64, // never overlap lock icon (top-4 right-4 + 44px)
                maxWidth: "calc(100% - 88px)",
                border: "1px solid rgba(0,0,0,0.30)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.12)",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                style={{
                  background: "radial-gradient(circle at 30% 30%, #FDFBF7 0%, #F7F2EA 55%, #EFE6D6 100%)",
                  border: "1px solid rgba(0,0,0,0.18)",
                  boxShadow:
                    "0 4px 10px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.18)",
                }}
              >
                <img
                  src={jbjFullLogoDarkBg}
                  alt="JBJ"
                  className="w-full h-full object-cover"
                  style={{ transform: "scale(1.18)" }}
                />
              </div>
              <p
                data-no-contrast-guard
                className="text-[12.5px] uppercase leading-none whitespace-nowrap allow-white truncate"
                style={{ color: "#FFFFFF", letterSpacing: "0.10em", textShadow: "0 1px 3px rgba(0,0,0,0.95)" }}
              >
                <span style={{ color: "#FFFFFF", fontWeight: 800 }}>JBJ</span>{" "}
                <span style={{ color: "#FFFFFF", fontWeight: 600, letterSpacing: "0.12em" }}>Global Real Estate</span>
              </p>
            </div>



            {/* Bottom: Brochure info — compact emerald panel for guaranteed contrast */}
            <div
              data-no-contrast-guard
              data-on-dark
              className="mt-auto -mx-1 px-4 py-3 rounded-lg allow-white"
              style={{
                background: "linear-gradient(135deg, rgba(6,78,59,0.86) 0%, rgba(4,44,28,0.88) 58%, rgba(0,0,0,0.92) 100%)",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(0,0,0,0.30)",
                boxShadow: "0 10px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
              }}
            >
              <h3
                data-no-contrast-guard
                className="text-xl font-bold mb-2 line-clamp-1 leading-tight allow-white"
                style={{ color: "#FFFFFF", textShadow: "0 2px 6px rgba(0,0,0,0.95), 0 0 14px rgba(0,0,0,0.6)" }}
              >
                {projectName}
              </h3>

              <p
                data-no-contrast-guard
                className="text-[11px] uppercase tracking-[0.2em] font-semibold allow-white"
                style={{ color: "#FFFFFF", textShadow: "0 1px 3px rgba(0,0,0,0.95)" }}
              >
                {location || 'Dubai • UAE'}
              </p>
            </div>



            {/* Premium 3D gold lock indicator */}
            {isLocked && (
              <div
                className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #F7ECD0 0%, #E8C77A 45%, #B89555 100%)",
                  boxShadow:
                    "0 10px 24px rgba(0,0,0,0.45), 0 4px 8px rgba(184,149,85,0.5), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -2px 4px rgba(120,90,30,0.4)",
                  border: "1px solid rgba(120,90,30,0.55)",
                }}
                aria-hidden="true"
              >
                <Lock
                  className="w-5 h-5"
                  strokeWidth={2.5}
                  style={{ color: "#3A2A0E", filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.55))" }}
                />
              </div>
            )}
          </div>

          {/* Glossy reflection on hover */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 40%, transparent 100%)",
            }}
          />
        </div>

        {/* 3D Shadow beneath card - simulates resting on surface */}
        <div 
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[85%] h-8 blur-2xl transition-all duration-300 group-hover:blur-3xl group-hover:h-12 group-hover:w-[75%] group-hover:-bottom-10"
          style={{
            background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.25) 50%, transparent 80%)",
          }}
        />
      </motion.div>

      {/* Download Button — locked emerald primitive */}
      <motion.button
        onClick={handleClick}
        data-emerald-action="true"
        data-action="download-brochure"
        data-emerald="true"
        className={cn(
          "flex items-center gap-3 px-10 py-4 rounded-xl font-semibold text-base transition-all duration-300",
          "jj-emerald-action jj-cta-emerald",
          "shadow-[0_10px_30px_rgba(4,44,28,0.35),0_6px_15px_rgba(0,0,0,0.18)]",
          "group"
        )}
        whileHover={{
          y: -3,
          scale: 1.02,
        }}
        whileTap={{ scale: 0.98, y: 0 }}
      >
        {isLocked ? (
          <>
            <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Unlock Brochure</span>
          </>
        ) : isFetching ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Fetching Brochure…</span>
          </>
        ) : isDownloading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Downloading...</span>
          </>
        ) : !brochureUrl ? (
          <>
            <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Request Brochure</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Download Brochure</span>
          </>
        )}
      </motion.button>

      {(isLocked || !brochureUrl) && (
        <p className="text-muted-foreground text-xs text-center max-w-[220px]">
          {brochureUrl ? "Request brochure access" : "Register your interest to receive the brochure"}
        </p>
      )}
    </div>
  );
};

export default PremiumBrochureCard;
