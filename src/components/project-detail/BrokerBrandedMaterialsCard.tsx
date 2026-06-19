import { Link } from "react-router-dom";
import { Download, Presentation, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BrokerBrandedMaterialsCardProps {
  projectId: string;
  projectName: string;
  hasBrochure: boolean;
  hasBrand: boolean;
  onDownloadBrochure: () => void;
  onGeneratePresentation: () => void;
}

/**
 * Broker-only card surfaced under the hero CTAs on /project/:slug.
 * Gives brokers a one-click path to:
 *  - Download a co-branded brochure (uses their logo + agent block in the PDF footer)
 *  - Generate a co-branded presentation/deck for this exact project
 *  - Upload / edit their brand assets (logo, headshot, contact info)
 *
 * Visible only when useUserMode().isBrokerMode === true.
 */
export default function BrokerBrandedMaterialsCard({
  projectName,
  hasBrochure,
  hasBrand,
  onDownloadBrochure,
  onGeneratePresentation,
}: BrokerBrandedMaterialsCardProps) {
  return (
    <div
      className="mt-6 rounded-2xl border border-[#B89555]/40 bg-[#F7F2EA] p-5 md:p-6 shadow-[0_8px_24px_rgba(26,26,26,0.06)]"
      data-cta-surface="champagne"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-[#B89555]">
            Broker tools
          </p>
          <h3 className="text-lg md:text-xl font-semibold text-[#1A1A1A] mt-1">
            Your branded materials for {projectName}
          </h3>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            Generate a co-branded presentation or download a brochure with your logo, photo and contact details.
          </p>
        </div>
        <Sparkles className="w-5 h-5 text-[#B89555] shrink-0" aria-hidden />
      </div>

      {!hasBrand && (
        <div className="mb-4 rounded-lg border border-[#B89555]/40 bg-[#FDFBF7] px-3 py-2 text-sm text-[#1A1A1A]">
          Upload your logo and photo to enable co-branded exports.{" "}
          <Link to="/broker/brand" className="font-semibold underline decoration-[#B89555] underline-offset-2">
            Set up my brand →
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={onGeneratePresentation}
          className="jj-cta-dark gap-2"
          data-cta="dark"
        >
          <Presentation className="w-4 h-4" />
          Generate co-branded presentation
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onDownloadBrochure}
          disabled={!hasBrochure}
          className="jj-cta-champagne gap-2"
          data-cta="champagne"
          title={hasBrochure ? "Download co-branded brochure" : "No brochure available yet"}
        >
          <Download className="w-4 h-4" />
          {hasBrochure ? "Download co-branded brochure" : "Brochure coming soon"}
        </Button>

        <Button
          asChild
          variant="outline"
          className="jj-cta-outline gap-2"
          data-cta="outline"
        >
          <Link to="/broker/brand">
            <Upload className="w-4 h-4" />
            Edit my brand
          </Link>
        </Button>
      </div>
    </div>
  );
}
