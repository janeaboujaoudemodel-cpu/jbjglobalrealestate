import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * GlobalBackButton — always-visible back button for header bars.
 * navigate(-1) if history exists, otherwise fallback to "/".
 */
export default function GlobalBackButton({ className = "" }: { className?: string }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleBack}
          className={`h-8 flex items-center gap-1.5 rounded-lg border border-[#B89555]/30 hover:border-[#B89555]/50 bg-[#EFE6D6]/5 hover:bg-[#EFE6D6]/15 transition-all px-2.5 group whitespace-nowrap shrink-0 ${className}`}
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4 text-[#1A1A1A] group-hover:scale-110 transition-transform shrink-0" />
          <span className="text-[11px] font-semibold text-[#1A1A1A]/55 uppercase tracking-wide hidden lg:inline whitespace-nowrap">
            Back
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8} className="text-[hsl(var(--gold))] text-xs z-[10100]">
        Go back
      </TooltipContent>
    </Tooltip>
  );
}
