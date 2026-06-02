import { Lock, Users } from "lucide-react";
import CompareAIShell from "@/components/compare/CompareAIShell";
import { useUserMode } from "@/hooks/useUserMode";
import { toast } from "sonner";

/** Shown when an investor or developer hits /compare directly. */
export default function CompareAccessGate() {
  const { setMode } = useUserMode();
  return (
    <CompareAIShell>
      <div className="container mx-auto px-4 py-24 flex flex-col items-center text-center max-w-xl">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.18))",
            border: "1px solid rgba(192,132,252,0.5)",
          }}
        >
          <Lock className="w-7 h-7" style={{ color: "#FFFFFF" }} />
        </div>
        <h1 className="text-white text-3xl font-bold mb-3">Broker-only tool</h1>
        <p className="text-white/70 mb-8">
          The Property &amp; Unit Comparison engine is part of the JBJ Broker Toolkit.
          Switch to <strong className="text-white">Broker mode</strong> to access it.
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
          data-no-contrast-guard
          data-allow-dark-cta
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
          style={{
            background: "linear-gradient(135deg, #3B82F6, #7C3AED, #EC4899)",
            boxShadow: "0 10px 30px rgba(124,58,237,0.4)",
          }}
        >
          <Users className="w-4 h-4" /> Switch to Broker mode
        </button>
      </div>
    </CompareAIShell>
  );
}
