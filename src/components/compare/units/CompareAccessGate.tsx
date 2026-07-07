import { Lock, Users } from "lucide-react";
import CompareAIShell from "@/components/compare/CompareAIShell";
import { useUserMode } from "@/hooks/useUserMode";
import { toast } from "sonner";

/** Shown when a client/investor hits /compare directly. */
export default function CompareAccessGate() {
  const { setMode } = useUserMode();
  return (
    <CompareAIShell>
      <div className="container mx-auto px-4 py-24 flex flex-col items-center text-center max-w-xl">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: "#F7F2EA",
            border: "1px solid rgba(184,149,85,0.55)",
            boxShadow: "0 8px 24px -10px rgba(184,149,85,0.35)",
          }}
        >
          <Lock className="w-7 h-7" style={{ color: "#B89555" }} />
        </div>
        <h1 className="text-3xl font-bold mb-3" style={{ color: "#1A1A1A" }}>
          Professional comparison tool
        </h1>
        <p className="mb-8" style={{ color: "rgba(26,26,26,0.7)" }}>
          The Property &amp; Unit Comparison engine is available for brokers,
          developers, and the owner workspace only.
        </p>
        <button
          onClick={async () => {
            try {
              await setMode("broker");
              toast.success("Switched to Broker mode");
            } catch {
              toast.error("Could not switch mode. Please sign in.");
            }
          }}
          data-cta="dark"
          className="jj-cta-dark inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold"
        >
          <Users className="w-4 h-4" /> Switch to Broker mode
        </button>
      </div>
    </CompareAIShell>
  );
}
