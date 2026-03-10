import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PenTool } from "lucide-react";
import AISignatureDesigner from "@/components/e-signature/AISignatureDesigner";

export default function SignatureStudio() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black">
      {/* Premium Page Header — aligned with sidebar logo divider */}
      <div className="bg-black border-b border-gold/20">
        <div className="max-w-4xl mx-auto px-6 flex items-end h-[84px] pb-4 gap-4">
          <Button variant="ghost" onClick={() => navigate("/e-signature")} className="text-gold hover:text-gold/80 hover:bg-gold/10 mb-0.5">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <PenTool className="w-5 h-5 text-gold" />
            <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              AI Signature <span className="text-gold">Designer</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-3 md:mx-4 lg:mx-6 mb-6 mt-0 rounded-b-2xl rounded-t-none border border-t-0 border-border bg-[linear-gradient(135deg,hsl(var(--champagne-1)),hsl(var(--champagne-2)),hsl(var(--champagne-3)))]">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <p className="text-muted-foreground">Create, save, and reuse your professional signatures</p>

          {/* Designer Component */}
          <AISignatureDesigner />
        </div>
      </div>
    </div>
  );
}
