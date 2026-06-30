/**
 * /broker/brand — Personal brokerage brand for co-branded PDFs (brochures, AI home-finder reports).
 * Champagne / ink / gold theme — never gray.
 * Uploads land in private storage bucket `broker-brand/{auth.uid}/...` and we store a signed URL
 * (1-year) on `crm_brokers.logo_url` / `headshot_url` so PDF generators can embed without auth.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, ImageIcon, Building2, User, Phone, Mail, MessageCircle, Save } from "lucide-react";

const BUCKET = "broker-brand";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year

type BrandRow = {
  id?: string;
  auth_user_id?: string;
  full_name?: string | null;
  agent_display_name?: string | null;
  position_title?: string | null;
  current_company?: string | null;
  tagline?: string | null;
  brand_primary_hex?: string | null;
  logo_url?: string | null;
  headshot_url?: string | null;
  company_phone?: string | null;
  company_email?: string | null;
  phone_e164?: string | null;
  whatsapp?: string | null;
};

export default function BrokerBrandProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<BrandRow>({});
  const [uploading, setUploading] = useState<"logo" | "headshot" | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const headshotInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user?.id) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("crm_brokers")
        .select("id, auth_user_id, full_name, agent_display_name, position_title, current_company, tagline, brand_primary_hex, logo_url, headshot_url, company_phone, company_email, phone_e164, whatsapp")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!alive) return;
      if (error) toast.error("Failed to load brand profile");
      setRow(data || { auth_user_id: user.id });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user?.id]);

  const update = (k: keyof BrandRow, v: string) => setRow((r) => ({ ...r, [k]: v }));

  const handleUpload = async (kind: "logo" | "headshot", file: File) => {
    if (!user?.id) return;
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

  const handleSave = async () => {
    if (!user?.id) { toast.error("Sign in required"); return; }
    setSaving(true);
    try {
      const payload: any = {
        auth_user_id: user.id,
        full_name: row.full_name || null,
        agent_display_name: row.agent_display_name || null,
        position_title: row.position_title || null,
        current_company: row.current_company || null,
        tagline: row.tagline || null,
        brand_primary_hex: row.brand_primary_hex || null,
        logo_url: row.logo_url || null,
        headshot_url: row.headshot_url || null,
        company_phone: row.company_phone || null,
        company_email: row.company_email || null,
        phone_e164: row.phone_e164 || null,
        whatsapp: row.whatsapp || null,
      };
      if (row.id) {
        const { error } = await supabase.from("crm_brokers").update(payload).eq("id", row.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("crm_brokers").insert(payload).select("id").single();
        if (error) throw error;
        if (data?.id) setRow((r) => ({ ...r, id: data.id }));
      }
      toast.success("Brand profile saved — your next brochure will be co-branded");
      // Return to the previous page after a successful save
      setTimeout(() => {
        if (window.history.length > 1) navigate(-1);
        else navigate("/broker-dashboard");
      }, 350);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ background: "#FDFBF7" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#1A1A1A" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10" style={{ background: "#FDFBF7" }}>
      <div className="container mx-auto px-4 max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "#1A1A1A" }}>Your Brand Profile</h1>
          <p className="text-sm mt-2" style={{ color: "rgba(26,26,26,0.7)" }}>
            Upload your company logo, headshot and contact details. Every brochure and AI Home Finder
            PDF you share will be co-branded with this info alongside JBJ Global Real Estate.
          </p>
        </header>

        {/* Brand assets */}
        <section className="rounded-2xl p-6 mb-6" style={{ background: "#F7F2EA", border: "1px solid rgba(184,149,85,0.35)" }}>
          <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "#1A1A1A" }}>
            <ImageIcon className="w-4 h-4" /> Brand assets
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <Label className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Company logo</Label>
              <div className="mt-2 rounded-xl p-3 flex flex-col items-center justify-center" style={{ background: "#FDFBF7", border: "1px solid rgba(184,149,85,0.4)" }}>
                <div className="w-full aspect-[4/3] flex items-center justify-center overflow-hidden rounded-lg" style={{ background: "#FFFFFF" }}>
                  {row.logo_url ? (
                    <img src={row.logo_url} alt="Logo preview" className="w-full h-full object-contain"  loading="lazy" decoding="async" />
                  ) : (
                    <div className="text-xs" style={{ color: "rgba(26,26,26,0.55)" }}>No logo yet</div>
                  )}
                </div>
                <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload("logo", f); }} />
                <Button type="button" size="sm" variant="outline" onClick={() => logoInput.current?.click()} disabled={uploading === "logo"} className="jj-cta-outline mt-3" data-cta="outline">
                  {uploading === "logo" ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-2" />}
                  {row.logo_url ? "Replace logo" : "Upload logo"}
                </Button>
              </div>
            </div>

            {/* Headshot — same box size as logo, full-fit */}
            <div>
              <Label className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Headshot</Label>
              <div className="mt-2 rounded-xl p-3 flex flex-col items-center justify-center" style={{ background: "#FDFBF7", border: "1px solid rgba(184,149,85,0.4)" }}>
                <div className="w-full aspect-[4/3] flex items-center justify-center overflow-hidden rounded-lg" style={{ background: "#FFFFFF" }}>
                  {row.headshot_url ? (
                    <img src={row.headshot_url} alt="Headshot preview" className="w-full h-full object-contain"  loading="lazy" decoding="async" />
                  ) : (
                    <div className="text-xs" style={{ color: "rgba(26,26,26,0.55)" }}>No headshot yet</div>
                  )}
                </div>
                <input ref={headshotInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload("headshot", f); }} />
                <Button type="button" size="sm" variant="outline" onClick={() => headshotInput.current?.click()} disabled={uploading === "headshot"} className="jj-cta-outline mt-3" data-cta="outline">
                  {uploading === "headshot" ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-2" />}
                  {row.headshot_url ? "Replace headshot" : "Upload headshot"}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Label className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Tagline</Label>
            <Input value={row.tagline || ""} onChange={(e) => update("tagline", e.target.value)} placeholder="e.g. Trusted partner for Dubai off-plan investments" className="mt-1" />
          </div>
        </section>

        {/* Agent & company */}
        <section className="rounded-2xl p-6 mb-6" style={{ background: "#F7F2EA", border: "1px solid rgba(184,149,85,0.35)" }}>
          <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "#1A1A1A" }}>
            <User className="w-4 h-4" /> Agent &amp; company
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">
                Full name <span className="text-[#1A1A1A]/55 font-normal">(optional)</span>
              </Label>
              <Input value={row.full_name || ""} onChange={(e) => update("full_name", e.target.value)} placeholder="Jane Doe" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">
                Display name <span className="text-[#1A1A1A]/55 font-normal">(optional — shown on PDFs)</span>
              </Label>
              <Input value={row.agent_display_name || ""} onChange={(e) => update("agent_display_name", e.target.value)} placeholder="Jane D." className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Position / title</Label>
              <Input value={row.position_title || ""} onChange={(e) => update("position_title", e.target.value)} placeholder="Senior Property Consultant" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Company name</Label>
              <Input value={row.current_company || ""} onChange={(e) => update("current_company", e.target.value)} placeholder="Acme Properties LLC" className="mt-1" />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl p-6 mb-6" style={{ background: "#F7F2EA", border: "1px solid rgba(184,149,85,0.35)" }}>
          <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "#1A1A1A" }}>
            <Phone className="w-4 h-4" /> Contact info
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Business phone</Label>
              <Input value={row.company_phone || ""} onChange={(e) => update("company_phone", e.target.value)} placeholder="+971 4 000 0000" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Mobile (E.164)</Label>
              <Input value={row.phone_e164 || ""} onChange={(e) => update("phone_e164", e.target.value)} placeholder="+971501234567" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Business email</Label>
              <Input type="email" value={row.company_email || ""} onChange={(e) => update("company_email", e.target.value)} placeholder="jane@acme.ae" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</Label>
              <Input value={row.whatsapp || ""} onChange={(e) => update("whatsapp", e.target.value)} placeholder="971501234567" className="mt-1" />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/broker-dashboard"))}
            className="jj-cta-outline"
            data-cta="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="jj-pill-emerald-metallic"
            data-cta="emerald-primary"
            data-surface="emerald"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            <span>Save brand profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
