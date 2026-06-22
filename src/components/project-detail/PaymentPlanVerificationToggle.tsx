import { useState } from "react";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  projectId: string;
  verified: boolean;
}

export default function PaymentPlanVerificationToggle({ projectId, verified }: Props) {
  const [busy, setBusy] = useState(false);
  const [isVerified, setIsVerified] = useState(verified);
  const qc = useQueryClient();

  const toggle = async () => {
    const next = !isVerified;
    setBusy(true);
    const { error } = await supabase
      .from("projects")
      .update({ payment_plan_verified: next })
      .eq("id", projectId);
    setBusy(false);

    if (error) {
      toast.error("Could not update verification: " + error.message);
      return;
    }
    setIsVerified(next);
    toast.success(next ? "Payment plan marked as verified" : "Verification removed");
    qc.invalidateQueries({ queryKey: ["project"] });
    qc.invalidateQueries({ queryKey: ["project-detail"] });
  };

  return (
    <div className="mt-3 flex items-center justify-end">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        data-allow-dark-cta
        data-no-contrast-guard
        className={`allow-white inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
 isVerified
 ? "jj-emerald-solid text-white border-[color:var(--emerald-1)]/30 hover:jj-emerald-solid"
 : "bg-[#0A0A0A] text-white border-[#B89555]/60 hover:bg-[#1F1F1F]"
 } disabled:opacity-60`}
        title="Owner only — toggles the Verified by JBJ badge"
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isVerified ? (
          <ShieldCheck className="w-3.5 h-3.5" />
        ) : (
          <ShieldAlert className="w-3.5 h-3.5" />
        )}
        {isVerified ? "Verified — click to unverify" : "Mark payment plan as verified"}
      </button>
    </div>
  );
}
