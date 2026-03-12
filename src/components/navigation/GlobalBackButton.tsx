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
          className={`h-8 flex items-center gap-1.5 rounded-lg border border-gold/30 hover:border-gold/50 bg-gold/5 hover:bg-gold/15 transition-all px-2.5 group ${className}`}
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-semibold text-black/55 uppercase tracking-wide hidden xl:inline">
            Back
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">
        Go back
      </TooltipContent>
    </Tooltip>
  );
}
