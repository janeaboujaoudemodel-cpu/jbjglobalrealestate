// Broker-facing page to review and sign a JBJ commission agreement.
// Routed at /broker/agreement/:id (BrokerGuard-protected).
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Agreement {
  id: string;
  title: string;
  status: string;
  splits: Array<{ party: string; role?: string; percent: number }>;
  agreement_html: string | null;
  signed_at: string | null;
  deal_ref: string | null;
}

export default function BrokerAgreementSign() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [accept, setAccept] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("crm_broker_commission_agreements")
        .select("id, title, status, splits, agreement_html, signed_at, deal_ref")
        .eq("id", id)
        .maybeSingle();
      if (!mounted) return;
      if (error || !data) {
        toast.error("Agreement not found or access denied");
        setLoading(false);
        return;
      }
      setAgreement(data as Agreement);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleSign() {
    if (!agreement || !signerName.trim() || !accept) return;
    setSigning(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-broker-commission-sign", {
        body: { agreement_id: agreement.id, signer_name: signerName.trim(), accept: true },
      });
      if (error || (data as { error?: string })?.error) {
        toast.error((data as { error?: string })?.error || error?.message || "Signing failed");
        return;
      }
      toast.success("Agreement signed");
      setAgreement({ ...agreement, status: "signed", signed_at: new Date().toISOString() });
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#B89555]/30 border-t-[#B89555] animate-spin" />
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#F7F2EA] border border-[#B89555]/30 p-8 text-center">
          <div className="text-[11px] tracking-[0.22em] uppercase text-[#1A1A1A]/60 mb-2">
            JBJ Global Real Estate
          </div>
          <div className="text-[15px] font-semibold text-[#1A1A1A]">Agreement not available</div>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/broker/crm")}>
            Return to CRM
          </Button>
        </div>
      </div>
    );
  }

  const signed = agreement.status === "signed";

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] tracking-[0.22em] uppercase text-[#1A1A1A]/60">
              JBJ Global Real Estate
            </div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] mt-1">{agreement.title}</h1>
          </div>
          <span
            className={`text-[10px] uppercase tracking-[0.18em] px-2 py-1 border ${
              signed
                ? "border-[#B89555]/40 bg-[#EFE6D6] text-[#1A1A1A]"
                : "border-[#B89555]/30 bg-[#F7F2EA] text-[#1A1A1A]/70"
            }`}
          >
            {agreement.status}
          </span>
        </div>

        <div
          className="bg-white border border-[#EFE6D6] shadow-sm overflow-hidden"
          dangerouslySetInnerHTML={{ __html: agreement.agreement_html ?? "" }}
        />

        {!signed && (
          <div className="mt-6 bg-[#F7F2EA] border border-[#B89555]/30 p-6">
            <div className="text-sm font-semibold text-[#1A1A1A] mb-3">
              Acknowledge &amp; sign
            </div>
            <label className="block text-xs uppercase tracking-[0.12em] text-[#1A1A1A]/70 mb-1">
              Full legal name
            </label>
            <Input
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Type your full name"
              className="bg-white border-[#B89555]/30"
            />
            <div className="flex items-start gap-2 mt-4">
              <Checkbox id="accept" checked={accept} onCheckedChange={(v) => setAccept(!!v)} />
              <label htmlFor="accept" className="text-xs text-[#1A1A1A]/80">
                I confirm I have read and agree to the commission split terms above, and that
                typing my name constitutes a binding electronic signature.
              </label>
            </div>
            <Button
              className="mt-4"
              disabled={!signerName.trim() || !accept || signing}
              onClick={handleSign}
            >
              {signing ? "Signing…" : "Sign agreement"}
            </Button>
          </div>
        )}

        {signed && agreement.signed_at && (
          <div className="mt-6 bg-[#F7F2EA] border border-[#B89555]/30 p-6 text-sm text-[#1A1A1A]">
            Signed on {new Date(agreement.signed_at).toLocaleString()}.
          </div>
        )}
      </div>
    </div>
  );
}
