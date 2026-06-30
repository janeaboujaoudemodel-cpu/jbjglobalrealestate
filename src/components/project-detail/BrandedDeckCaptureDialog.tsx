/**
 * In-page capture dialog for the broker/developer branded presentation.
 * Collects logo, headshot, name, email, phone, company, then saves to
 * `crm_brokers` and immediately triggers the branded deck generator.
 *
 * Replaces the previous "navigate to /broker/brand" link so the user never
 * leaves the project page.
 */
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, ImageIcon, User, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const BUCKET = "broker-brand";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365;

export interface BrandedDeckCaptureDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Called with the saved broker row once the user clicks Generate. */
  onSubmit: (broker: {
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    logoUrl?: string | null;
    headshotUrl?: string | null;
    agencyName?: string | null;
  }) => Promise<void> | void;
}

type FormState = {
  full_name: string;
  current_company: string;
  company_email: string;
  phone_e164: string;
  logo_url: string;
  headshot_url: string;
};

const EMPTY: FormState = {
  full_name: "",
  current_company: "",
  company_email: "",
  phone_e164: "",
  logo_url: "",
  headshot_url: "",
};

export default function BrandedDeckCaptureDialog({ open, onOpenChange, onSubmit }: BrandedDeckCaptureDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "headshot" | null>(null);
  const [row, setRow] = useState<FormState>(EMPTY);
  const [brokerRowId, setBrokerRowId] = useState<string | undefined>(undefined);
  const logoInput = useRef<HTMLInputElement>(null);
  const headshotInput = useRef<HTMLInputElement>(null);

  // Prefill from existing crm_brokers row whenever the dialog opens
  useEffect(() => {
    if (!open || !user?.id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("crm_brokers")
        .select("id, full_name, current_company, company_email, personal_email, phone_e164, personal_phone, logo_url, headshot_url")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!alive) return;
      if (data) {
        setBrokerRowId((data as any).id);
        setRow({
          full_name: (data as any).full_name || "",
          current_company: (data as any).current_company || "",
          company_email: (data as any).company_email || (data as any).personal_email || "",
          phone_e164: (data as any).phone_e164 || (data as any).personal_phone || "",
          logo_url: (data as any).logo_url || "",
          headshot_url: (data as any).headshot_url || "",
        });
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [open, user?.id]);

  const update = (k: keyof FormState, v: string) => setRow((r) => ({ ...r, [k]: v }));

  const handleUpload = async (kind: "logo" | "headshot", file: File) => {
    if (!user?.id) { toast.error("Please sign in first"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Image files only"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
    setUploading(kind);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
      if (sErr || !signed?.signedUrl) throw sErr || new Error("Signing failed");
      update(kind === "logo" ? "logo_url" : "headshot_url", signed.signedUrl);
      toast.success(`${kind === "logo" ? "Logo" : "Headshot"} uploaded`);
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleGenerate = async () => {
    if (!user?.id) { toast.error("Please sign in first"); return; }
    setSubmitting(true);
    try {
      const payload: any = {
        auth_user_id: user.id,
        full_name: row.full_name || null,
        current_company: row.current_company || null,
        company_email: row.company_email || null,
        phone_e164: row.phone_e164 || null,
        logo_url: row.logo_url || null,
        headshot_url: row.headshot_url || null,
      };
      if (brokerRowId) {
        const { error } = await supabase.from("crm_brokers").update(payload).eq("id", brokerRowId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("crm_brokers").insert(payload).select("id").single();
        if (error) throw error;
        if (data?.id) setBrokerRowId(data.id);
      }
      await onSubmit({
        fullName: row.full_name,
        email: row.company_email,
        phone: row.phone_e164,
        logoUrl: row.logo_url,
        headshotUrl: row.headshot_url,
        agencyName: row.current_company,
      });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Could not save brand details");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] bg-[#FDFBF7]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <Sparkles className="w-5 h-5 text-[#064E3B]" />
            Generate branded presentation
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Add your logo, photo and contact details. We'll co-brand a polished
            project presentation you can share with your client.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-[#064E3B]" />
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Brand assets */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-[#1A1A1A] flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" /> Company logo
                </Label>
                <div className="mt-2 rounded-xl p-3 flex flex-col items-center" style={{ background: "#F7F2EA", border: "1px solid rgba(184,149,85,0.4)" }}>
                  <div className="w-full aspect-[4/3] flex items-center justify-center overflow-hidden rounded-lg bg-white">
                    {row.logo_url ? (
                      <img src={row.logo_url} alt="Logo preview" className="w-full h-full object-contain"  loading="lazy" decoding="async" />
                    ) : (
                      <span className="text-xs text-[#1A1A1A]/55">No logo yet</span>
                    )}
                  </div>
                  <input ref={logoInput} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload("logo", f); }} />
                  <Button type="button" size="sm" variant="outline" onClick={() => logoInput.current?.click()}
                    disabled={uploading === "logo"} className="jj-cta-outline mt-3" data-cta="outline">
                    {uploading === "logo" ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-2" />}
                    {row.logo_url ? "Replace logo" : "Upload logo"}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-[#1A1A1A] flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Your photo
                </Label>
                <div className="mt-2 rounded-xl p-3 flex flex-col items-center" style={{ background: "#F7F2EA", border: "1px solid rgba(184,149,85,0.4)" }}>
                  <div className="w-full aspect-[4/3] flex items-center justify-center overflow-hidden rounded-lg bg-white">
                    {row.headshot_url ? (
                      <img src={row.headshot_url} alt="Headshot preview" className="w-full h-full object-contain"  loading="lazy" decoding="async" />
                    ) : (
                      <span className="text-xs text-[#1A1A1A]/55">No photo yet</span>
                    )}
                  </div>
                  <input ref={headshotInput} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload("headshot", f); }} />
                  <Button type="button" size="sm" variant="outline" onClick={() => headshotInput.current?.click()}
                    disabled={uploading === "headshot"} className="jj-cta-outline mt-3" data-cta="outline">
                    {uploading === "headshot" ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-2" />}
                    {row.headshot_url ? "Replace photo" : "Upload photo"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Contact info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-[#1A1A1A]">Full name</Label>
                <Input value={row.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Jane Doe" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm text-[#1A1A1A]">Company / agency</Label>
                <Input value={row.current_company} onChange={(e) => update("current_company", e.target.value)} placeholder="Acme Properties" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm text-[#1A1A1A]">Business email</Label>
                <Input type="email" value={row.company_email} onChange={(e) => update("company_email", e.target.value)} placeholder="jane@acme.ae" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm text-[#1A1A1A]">Mobile number</Label>
                <Input value={row.phone_e164} onChange={(e) => update("phone_e164", e.target.value)} placeholder="+971 50 123 4567" className="mt-1" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="jj-cta-outline" data-cta="outline">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={submitting}
                className="jj-cta-emerald"
                data-cta="emerald"
              >
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                <span>{submitting ? "Generating…" : "Generate presentation"}</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
