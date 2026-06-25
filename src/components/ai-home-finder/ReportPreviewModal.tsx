import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, MessageCircle, Mail, Link as LinkIcon, Building2, Send, Upload, User as UserIcon, X } from "lucide-react";
import { toast } from "sonner";

export type ReportRole = "broker" | "developer" | "owner" | "consultant";
export type BrandingMode = "both" | "photo" | "logo" | "none";

export interface ReportBranding {
  role: ReportRole;
  mode: BrandingMode;
  photoDataUrl?: string;
  logoDataUrl?: string;
  name?: string;
  companyName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  website?: string;
  socials?: string;
}

interface PreviewProject {
  id: string;
  name: string;
  cover_image_url?: string | null;
  images?: { image_url: string }[];
  developer?: { name?: string } | null;
  price_from?: number | null;
  price_to?: number | null;
  area?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: PreviewProject[];
  defaults?: Partial<ReportBranding>;
  onDownload: (b: ReportBranding) => Promise<void> | void;
  onShareWhatsApp: (b: ReportBranding) => Promise<void> | void;
  onShareEmail: (b: ReportBranding) => Promise<void> | void;
  onCopy: () => Promise<void> | void;
  onSendToConsultant: (b: ReportBranding) => Promise<void> | void;
}

const STORAGE_KEY = "jbj.reportBranding.v1";

const ROLE_LABELS: Record<ReportRole, string> = {
  broker: "Broker",
  developer: "Developer",
  owner: "Owner",
  consultant: "JBJ Consultant",
};

const loadStored = (): Partial<ReportBranding> | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const fileToDataUrl = (f: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result || ""));
    r.onerror = rej;
    r.readAsDataURL(f);
  });

const fmtPrice = (p: PreviewProject) => {
  if (!p.price_from) return "Price on Request";
  const lo = `AED ${(p.price_from / 1_000_000).toFixed(1)}M`;
  if (p.price_to && p.price_to > p.price_from) return `${lo} – AED ${(p.price_to / 1_000_000).toFixed(1)}M`;
  return `From ${lo}`;
};

export default function ReportPreviewModal({
  open,
  onOpenChange,
  projects,
  defaults,
  onDownload,
  onShareWhatsApp,
  onShareEmail,
  onCopy,
  onSendToConsultant,
}: Props) {
  const [branding, setBranding] = useState<ReportBranding>(() => {
    const stored = loadStored() || {};
    return {
      role: "broker",
      mode: "both",
      name: "",
      companyName: "JBJ Global Real Estate",
      phone: "",
      whatsapp: "",
      email: "",
      address: "Dubai, UAE",
      website: "www.jbj.ae",
      socials: "",
      ...stored,
      ...defaults,
    };
  });
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const stored = loadStored() || {};
    setBranding((prev) => ({ ...prev, ...stored, ...defaults }));
  }, [open, defaults]);

  const update = (patch: Partial<ReportBranding>) => {
    setBranding((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const photoInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const handlePhoto = async (f: File | null) => {
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { toast.error("Photo must be under 4MB"); return; }
    update({ photoDataUrl: await fileToDataUrl(f) });
  };
  const handleLogo = async (f: File | null) => {
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { toast.error("Logo must be under 4MB"); return; }
    update({ logoDataUrl: await fileToDataUrl(f) });
  };

  const showPhoto = (branding.mode === "both" || branding.mode === "photo") && branding.photoDataUrl;
  const showLogo = (branding.mode === "both" || branding.mode === "logo") && branding.logoDataUrl;

  const run = async (key: string, fn: () => Promise<void> | void) => {
    setBusy(key);
    try { await fn(); } finally { setBusy(null); }
  };

  const previewProjects = useMemo(() => (projects || []).slice(0, 6), [projects]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[1100px] max-h-[92vh] overflow-hidden p-0 border-0"
        style={{ background: "#FDFBF7", color: "#1A1A1A" }}
      >
        <DialogHeader className="px-6 pt-5 pb-3 border-b" style={{ borderColor: "rgba(184,149,85,0.35)" }}>
          <DialogTitle className="text-xl font-bold" style={{ color: "#1A1A1A" }}>
            Report Preview & Branding
          </DialogTitle>
          <DialogDescription style={{ color: "#5a5246" }}>
            Customize how your report looks, then choose how to send it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-[380px_1fr] gap-0 overflow-hidden" style={{ maxHeight: "calc(92vh - 180px)" }}>
          {/* LEFT — branding form */}
          <div className="overflow-y-auto px-5 py-4 border-r space-y-4" style={{ borderColor: "rgba(184,149,85,0.30)", background: "#F7F2EA" }}>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#1A1A1A" }}>Profile / Role</Label>
              <Tabs value={branding.role} onValueChange={(v) => update({ role: v as ReportRole })} className="mt-2">
                <TabsList className="grid grid-cols-4 w-full">
                  {(Object.keys(ROLE_LABELS) as ReportRole[]).map((r) => (
                    <TabsTrigger key={r} value={r} className="text-[11px] px-1">{ROLE_LABELS[r]}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#1A1A1A" }}>Include in report</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {([
                  { v: "both", l: "Photo + Logo" },
                  { v: "photo", l: "Photo only" },
                  { v: "logo", l: "Logo only" },
                  { v: "none", l: "No branding" },
                ] as { v: BrandingMode; l: string }[]).map((opt) => {
                  const active = branding.mode === opt.v;
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => update({ mode: opt.v })}
                      className="text-xs font-semibold rounded-md px-3 py-2 transition"
                      style={
                        active
                          ? { background: "#064E3B", color: "#FFFFFF", border: "1px solid #064E3B" }
                          : { background: "#FFFFFF", color: "#1A1A1A", border: "1px solid rgba(184,149,85,0.45)" }
                      }
                    >
                      {opt.l}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold" style={{ color: "#1A1A1A" }}>Your photo</Label>
                <div
                  onClick={() => photoInput.current?.click()}
                  className="mt-1 h-20 rounded-md flex items-center justify-center cursor-pointer overflow-hidden"
                  style={{ background: "#FFFFFF", border: "1px dashed rgba(184,149,85,0.6)" }}
                >
                  {branding.photoDataUrl ? (
                    <img src={branding.photoDataUrl} alt="photo" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-[10px]" style={{ color: "#7a7060" }}>
                      <UserIcon className="w-5 h-5 mb-1" />Upload
                    </div>
                  )}
                </div>
                <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0] || null)} />
                {branding.photoDataUrl && (
                  <button onClick={() => update({ photoDataUrl: undefined })} className="text-[10px] mt-1 flex items-center gap-1" style={{ color: "#8a6a3a" }}>
                    <X className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
              <div>
                <Label className="text-xs font-semibold" style={{ color: "#1A1A1A" }}>Company logo</Label>
                <div
                  onClick={() => logoInput.current?.click()}
                  className="mt-1 h-20 rounded-md flex items-center justify-center cursor-pointer overflow-hidden"
                  style={{ background: "#FFFFFF", border: "1px dashed rgba(184,149,85,0.6)" }}
                >
                  {branding.logoDataUrl ? (
                    <img src={branding.logoDataUrl} alt="logo" className="h-full w-full object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center text-[10px]" style={{ color: "#7a7060" }}>
                      <Upload className="w-5 h-5 mb-1" />Upload
                    </div>
                  )}
                </div>
                <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0] || null)} />
                {branding.logoDataUrl && (
                  <button onClick={() => update({ logoDataUrl: undefined })} className="text-[10px] mt-1 flex items-center gap-1" style={{ color: "#8a6a3a" }}>
                    <X className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
            </div>

            {[
              { k: "name", l: "Your name", ph: "Jane Doe" },
              { k: "companyName", l: "Company name", ph: "JBJ Global Real Estate" },
              { k: "phone", l: "Phone", ph: "+971 50 123 4567" },
              { k: "whatsapp", l: "WhatsApp", ph: "+971501234567" },
              { k: "email", l: "Email", ph: "you@company.com" },
              { k: "address", l: "Office / Address", ph: "Dubai, UAE" },
              { k: "website", l: "Website", ph: "www.example.com" },
              { k: "socials", l: "Social links (optional)", ph: "instagram.com/..., linkedin.com/in/..." },
            ].map((f) => (
              <div key={f.k}>
                <Label className="text-xs font-semibold" style={{ color: "#1A1A1A" }}>{f.l}</Label>
                <Input
                  value={(branding as any)[f.k] || ""}
                  onChange={(e) => update({ [f.k]: e.target.value } as any)}
                  placeholder={f.ph}
                  className="mt-1 h-9 text-sm"
                  style={{ background: "#FFFFFF", color: "#1A1A1A", border: "1px solid rgba(184,149,85,0.45)" }}
                  maxLength={f.k === "socials" || f.k === "address" ? 200 : 80}
                />
              </div>
            ))}
          </div>

          {/* RIGHT — preview */}
          <div className="overflow-y-auto p-5" style={{ background: "#EFE6D6" }}>
            <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: "#5a5246" }}>Live Preview</p>
            <div className="mx-auto shadow-xl rounded" style={{ background: "#FDFBF7", color: "#1A1A1A", maxWidth: 560 }}>
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between" style={{ background: "#0A0A0A", color: "#FFFFFF", borderBottom: "1px solid #B89555" }}>
                <div className="flex items-center gap-3">
                  {showLogo ? (
                    <img src={branding.logoDataUrl} alt="" className="h-10 w-10 rounded bg-white object-contain p-1" />
                  ) : (
                    <div className="h-10 w-10 rounded flex items-center justify-center font-bold" style={{ background: "#B89555", color: "#0A0A0A" }}>JBJ</div>
                  )}
                  <div>
                    <p className="text-[13px] font-bold tracking-wider" style={{ color: "#EFE6D6" }}>JBJ GLOBAL REAL ESTATE</p>
                    <p className="text-[10px]" style={{ color: "#B89555" }}>AI Home Finder — Personalized Report</p>
                  </div>
                </div>
                <div className="text-right text-[10px]" style={{ color: "#EFE6D6" }}>
                  {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
              </div>

              {/* Prepared-by strip */}
              {branding.mode !== "none" && (
                <div className="px-5 py-3 flex items-center gap-3" style={{ background: "#F7F2EA", borderBottom: "1px solid rgba(184,149,85,0.35)" }}>
                  {showPhoto && (
                    <img src={branding.photoDataUrl} alt="" className="h-14 w-14 rounded-full object-cover" style={{ border: "2px solid #B89555" }} />
                  )}
                  <div className="text-[11px] leading-tight">
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "#8a6a3a" }}>Prepared by — {ROLE_LABELS[branding.role]}</p>
                    {branding.name && <p className="font-bold text-[13px]">{branding.name}</p>}
                    {branding.companyName && <p style={{ color: "#5a5246" }}>{branding.companyName}</p>}
                    <p style={{ color: "#5a5246" }}>
                      {[branding.phone, branding.email].filter(Boolean).join("  •  ")}
                    </p>
                    {(branding.whatsapp || branding.website) && (
                      <p style={{ color: "#5a5246" }}>
                        {[branding.whatsapp && `WhatsApp: ${branding.whatsapp}`, branding.website].filter(Boolean).join("  •  ")}
                      </p>
                    )}
                    {branding.address && <p style={{ color: "#5a5246" }}>{branding.address}</p>}
                    {branding.socials && <p className="truncate" style={{ color: "#5a5246", maxWidth: 360 }}>{branding.socials}</p>}
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="px-5 py-4">
                <h3 className="text-lg font-bold mb-3">Your AI-Selected Properties</h3>
                <div className="space-y-3">
                  {previewProjects.map((p, i) => (
                    <div key={p.id} className="flex gap-3 p-2 rounded" style={{ background: "#F7F2EA", border: "1px solid rgba(184,149,85,0.3)" }}>
                      <div className="h-16 w-20 rounded overflow-hidden flex-shrink-0" style={{ background: "#EFE6D6" }}>
                        {(p.cover_image_url || p.images?.[0]?.image_url) ? (
                          <img src={p.cover_image_url || p.images?.[0]?.image_url} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold" style={{ color: "#B89555" }}>RANK #{i + 1}</p>
                        <p className="text-sm font-bold truncate">{p.name}</p>
                        <p className="text-[11px] truncate" style={{ color: "#5a5246" }}>
                          {[p.developer?.name, p.area].filter(Boolean).join(" • ")}
                        </p>
                        <p className="text-[11px] font-semibold" style={{ color: "#B45309" }}>{fmtPrice(p)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 text-[10px] flex items-center justify-between" style={{ background: "#0A0A0A", color: "#EFE6D6", borderTop: "1px solid #B89555" }}>
                <span>Powered by JBJ Global Real Estate — Dubai, UAE</span>
                <span>{branding.website || "www.jbj.ae"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t flex flex-wrap items-center justify-end gap-2" style={{ borderColor: "rgba(184,149,85,0.35)", background: "#FDFBF7" }}>
          <Button
            onClick={() => run("copy", () => onCopy())}
            disabled={!!busy}
            variant="outline"
            className="font-semibold"
            style={{ borderColor: "#B89555", color: "#1A1A1A", background: "#FFFFFF" }}
          >
            <LinkIcon className="w-4 h-4 mr-2" /> Copy text
          </Button>
          <Button
            onClick={() => run("wa", () => onShareWhatsApp(branding))}
            disabled={!!busy}
            variant="outline"
            className="font-semibold"
            style={{ borderColor: "#B89555", color: "#1A1A1A", background: "#FFFFFF" }}
          >
            <MessageCircle className="w-4 h-4 mr-2" /> Share WhatsApp
          </Button>
          <Button
            onClick={() => run("em", () => onShareEmail(branding))}
            disabled={!!busy}
            variant="outline"
            className="font-semibold"
            style={{ borderColor: "#B89555", color: "#1A1A1A", background: "#FFFFFF" }}
          >
            <Mail className="w-4 h-4 mr-2" /> Share Email
          </Button>
          <Button
            onClick={() => run("jbj", () => onSendToConsultant(branding))}
            disabled={!!busy}
            className="font-semibold"
            style={{ background: "linear-gradient(135deg,#064E3B,#0A0A0A)", color: "#FFFFFF" }}
          >
            <Send className="w-4 h-4 mr-2" /> Send to JBJ Consultant
          </Button>
          <Button
            onClick={() => run("dl", () => onDownload(branding))}
            disabled={!!busy}
            className="font-semibold"
            style={{ background: "linear-gradient(135deg,#064E3B,#0A0A0A)", color: "#FFFFFF" }}
          >
            <Download className="w-4 h-4 mr-2" /> {busy === "dl" ? "Generating…" : "Download PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
