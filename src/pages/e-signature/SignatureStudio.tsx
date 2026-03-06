import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PenTool } from "lucide-react";
import AISignatureDesigner from "@/components/e-signature/AISignatureDesigner";

export default function SignatureStudio() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black pt-20 lg:pt-24">
      <div className="mx-3 md:mx-4 lg:mx-6 my-6 rounded-2xl border border-border bg-[linear-gradient(135deg,hsl(var(--champagne-1)),hsl(var(--champagne-2)),hsl(var(--champagne-3)))]">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/e-signature")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-900">
                  <PenTool className="w-5 h-5 text-white" />
                </div>
                AI Signature Designer
              </h1>
              <p className="text-muted-foreground mt-1">
                Create, save, and reuse your professional signatures
              </p>
            </div>
          </div>

          {/* Designer Component */}
          <AISignatureDesigner />
        </div>
      </div>
    </div>
  );
}
