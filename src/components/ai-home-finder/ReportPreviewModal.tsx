import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, MessageCircle, Mail, Link as LinkIcon, Send, Upload, User as UserIcon, X } from "lucide-react";
import { toast } from "sonner";
import { useUserMode, type UserMode } from "@/hooks/useUserMode";
// Official letterhead monogram (black JBJ on champagne with gold rules above/below the B)
import jbjMonogram from "@/assets/jbj-monogram-letterhead.png";

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
  license?: string;
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

const STORAGE_KEY = "jbj.reportBranding.v2";

const ROLE_LABELS: Record<ReportRole, string> = {
  broker: "Broker",
  developer: "Developer",
  owner: "Owner",
  consultant: "JBJ Consultant",
};

/** Map active app mode → report role. Default unknown to JBJ Consultant. */
const roleFromMode = (mode: UserMode | undefined): ReportRole => {
  if (mode === "broker") return "broker";
  if (mode === "developer") return "developer";
  if (mode === "owner") return "owner";
  return "consultant";
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

// Design tokens — kept inline so the modal renders correctly even if global
// theme CSS is scoped/blocked. Mirrors mem://style brand palette.
const C = {
  page: "#FDFBF7",
  surface: "#F7F2EA",
  raised: "#EFE6D6",
  ink: "#1A1A1A",
  muted: "#5a5246",
  gold: "#B89555",
  goldSoft: "rgba(184,149,85,0.45)",
  goldHair: "rgba(184,149,85,0.35)",
  emeraldGradient: "linear-gradient(135deg,#064E3B 0%,#042c1c 58%,#000000 100%)",
  emeraldGradientHover: "linear-gradient(135deg,#0a6b53 0%,#064E3B 58%,#042c1c 100%)",
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
  const { mode } = useUserMode();
  const activeRole = roleFromMode(mode);

  const [branding, setBranding] = useState<ReportBranding>(() => {
    const stored = loadStored() || {};
    const base: ReportBranding = {
      role: activeRole,
      mode: "both",
      name: "",
      companyName: "JBJ Global Real Estate",
      phone: "",
      whatsapp: "",
      email: "",
      address: "Dubai, UAE",
      website: "www.jbj.ae",
      license: "",
      socials: "",
      ...stored,
      ...defaults,
    };
    // Role ALWAYS wins from active app mode — never persisted/overridden.
    base.role = activeRole;
    return base;
  });
  const [busy, setBusy] = useState<string | null>(null);

  // Keep role mirrored to active mode whenever the modal opens or mode changes.
  useEffect(() => {
    if (!open) return;
    const stored = loadStored() || {};
    setBranding((prev) => ({ ...prev, ...stored, ...defaults, role: activeRole }));
  }, [open, defaults, activeRole]);

  const update = (patch: Partial<ReportBranding>) => {
    setBranding((prev) => {
      const next = { ...prev, ...patch, role: activeRole };
      try {
        // Don't persist role — it's always derived from active mode.
        const { role: _r, ...persistable } = next;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
      } catch {}
      return next;
    });
  };

  const photoInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const handlePhoto = async (f: File | null) => {
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) {
      toast.error("Please upload a PNG, JPG, or WebP image");
      return;
    }
    if (f.size > 6 * 1024 * 1024) { toast.error("Photo must be under 6MB"); return; }
    update({ photoDataUrl: await fileToDataUrl(f) });
  };
  const handleLogo = async (f: File | null) => {
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(f.type)) {
      toast.error("Please upload a PNG, JPG, WebP, or SVG image");
      return;
    }
    if (f.size > 6 * 1024 * 1024) { toast.error("Logo must be under 6MB"); return; }
    update({ logoDataUrl: await fileToDataUrl(f) });
  };

  const showPhoto = (branding.mode === "both" || branding.mode === "photo") && branding.photoDataUrl;
  const showLogo = (branding.mode === "both" || branding.mode === "logo") && branding.logoDataUrl;

  const run = async (key: string, fn: () => Promise<void> | void) => {
    setBusy(key);
    try { await fn(); } finally { setBusy(null); }
  };

  const previewProjects = useMemo(() => (projects || []).slice(0, 6), [projects]);

  // Reusable button styles
  const primaryBtn: React.CSSProperties = {
    backgroundImage: C.emeraldGradient,
    backgroundColor: "#064E3B",
    color: "#FFFFFF",
    border: 0,
    boxShadow: "0 10px 24px -12px rgba(6,78,59,0.82), inset 0 1px 0 rgba(255,255,255,0.16)",
  };
  const secondaryBtn: React.CSSProperties = {
    background: "#FFFFFF",
    color: C.ink,
    border: `1px solid ${C.goldSoft}`,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-no-contrast-guard
        data-aihf-preview
        className="sm:max-w-[1120px] max-h-[92vh] overflow-hidden p-0 border-0"
        style={{ background: C.page, color: C.ink }}
      >
        {/* Scoped override — beats the global contrast guard inside the preview card only.
            Selectors prefixed with html body + multiple attributes to win specificity over
            the global champagne/gold text-color rules. */}
        <style>{`
          html body [data-aihf-preview] [data-aihf-darkband],
          html body [data-aihf-preview] [data-aihf-darkband] *,
          html body [data-aihf-preview] [data-aihf-darkband] :is(p,span,h1,h2,h3,h4,a,div) {
            color: #FFFFFF !important;
            -webkit-text-fill-color: #FFFFFF !important;
          }
          html body [data-aihf-preview] [data-aihf-darkband] [data-tagline] {
            color: #A7F3D0 !important;
            -webkit-text-fill-color: #A7F3D0 !important;
          }
          html body [data-aihf-preview] [data-aihf-prepared-by] {
            color: #064E3B !important;
            -webkit-text-fill-color: #064E3B !important;
          }
          html body [data-aihf-preview] [data-aihf-website] {
            color: #064E3B !important;
            -webkit-text-fill-color: #064E3B !important;
          }
          html body [data-aihf-preview] [data-aihf-price] {
            color: #B45309 !important;
            -webkit-text-fill-color: #B45309 !important;
          }
          html body [data-aihf-preview] [data-aihf-rank] {
            color: #B89555 !important;
            -webkit-text-fill-color: #B89555 !important;
          }
          html body [data-aihf-preview] [data-aihf-role-chip],
          html body [data-aihf-preview] [data-aihf-role-chip] * {
            color: #FFFFFF !important;
            -webkit-text-fill-color: #FFFFFF !important;
          }
          html body [data-aihf-preview] [data-aihf-primary-btn],
          html body [data-aihf-preview] [data-aihf-primary-btn] * {
            color: #FFFFFF !important;
            -webkit-text-fill-color: #FFFFFF !important;
            stroke: #FFFFFF !important;
          }
        `}</style>
        <DialogHeader className="px-6 pt-5 pb-3 border-b" style={{ borderColor: C.goldHair }}>
          <DialogTitle className="text-xl font-bold" style={{ color: C.ink }}>
            Report Preview & Branding
          </DialogTitle>
          <DialogDescription style={{ color: C.muted }}>
            Customize how your report looks, then choose how to send it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-[380px_1fr] gap-0 overflow-hidden" style={{ maxHeight: "calc(92vh - 180px)" }}>
          {/* LEFT — branding form */}
          <div className="overflow-y-auto px-5 py-4 border-r space-y-4" style={{ borderColor: C.goldHair, background: C.surface }}>
            {/* Auto-detected role chip (read-only, synced to active mode) */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.ink }}>Profile / Role</Label>
              <div
                data-aihf-role-chip
                className="mt-2 flex items-center justify-between rounded-md px-3 py-2.5 allow-white"
                style={{ ...primaryBtn, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)" }}
                aria-label={`Active role: ${ROLE_LABELS[activeRole]}`}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#6EE7B7" }} />
                  <span className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>
                    {ROLE_LABELS[activeRole]}
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.75)" }}>
                  Active mode
                </span>
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: C.muted }}>
                Role is set from your current account mode — change it in the mode switcher to update the report.
              </p>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.ink }}>Include in report</Label>
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
                      style={active ? primaryBtn : secondaryBtn}
                    >
                      {opt.l}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold" style={{ color: C.ink }}>Your photo</Label>
                <div
                  onClick={() => photoInput.current?.click()}
                  className="mt-1 h-20 rounded-md flex items-center justify-center cursor-pointer overflow-hidden"
                  style={{ background: "#FFFFFF", border: `1px dashed ${C.goldSoft}` }}
                >
                  {branding.photoDataUrl ? (
                    <img src={branding.photoDataUrl} alt="photo" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-[10px]" style={{ color: "#7a7060" }}>
                      <UserIcon className="w-5 h-5 mb-1" />Upload
                    </div>
                  )}
                </div>
                <input ref={photoInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0] || null)} />
                {branding.photoDataUrl && (
                  <div className="flex items-center gap-3 mt-1">
                    <button onClick={() => photoInput.current?.click()} className="text-[10px]" style={{ color: "#064E3B", fontWeight: 600 }}>Replace</button>
                    <button onClick={() => update({ photoDataUrl: undefined })} className="text-[10px] flex items-center gap-1" style={{ color: "#8a6a3a" }}>
                      <X className="w-3 h-3" /> Remove
                    </button>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs font-semibold" style={{ color: C.ink }}>Company logo</Label>
                <div
                  onClick={() => logoInput.current?.click()}
                  className="mt-1 h-20 rounded-md flex items-center justify-center cursor-pointer overflow-hidden"
                  style={{ background: "#FFFFFF", border: `1px dashed ${C.goldSoft}` }}
                >
                  {branding.logoDataUrl ? (
                    <img src={branding.logoDataUrl} alt="logo" className="h-full w-full object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center text-[10px]" style={{ color: "#7a7060" }}>
                      <Upload className="w-5 h-5 mb-1" />Upload
                    </div>
                  )}
                </div>
                <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0] || null)} />
                {branding.logoDataUrl && (
                  <div className="flex items-center gap-3 mt-1">
                    <button onClick={() => logoInput.current?.click()} className="text-[10px]" style={{ color: "#064E3B", fontWeight: 600 }}>Replace</button>
                    <button onClick={() => update({ logoDataUrl: undefined })} className="text-[10px] flex items-center gap-1" style={{ color: "#8a6a3a" }}>
                      <X className="w-3 h-3" /> Remove
                    </button>
                  </div>
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
              { k: "license", l: "License / RERA # (optional)", ph: "BRN 12345" },
              { k: "socials", l: "Social links (optional)", ph: "instagram.com/..., linkedin.com/in/..." },
            ].map((f) => (
              <div key={f.k}>
                <Label className="text-xs font-semibold" style={{ color: C.ink }}>{f.l}</Label>
                <Input
                  value={(branding as any)[f.k] || ""}
                  onChange={(e) => update({ [f.k]: e.target.value } as any)}
                  placeholder={f.ph}
                  className="mt-1 h-9 text-sm"
                  style={{ background: "#FFFFFF", color: C.ink, border: `1px solid ${C.goldSoft}` }}
                  maxLength={f.k === "socials" || f.k === "address" ? 200 : 100}
                />
              </div>
            ))}
          </div>

          {/* RIGHT — preview (mirrors PDF header/footer 1:1) */}
          <div className="overflow-y-auto p-5" style={{ background: C.raised }}>
            <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: C.muted }}>Live Preview</p>
            <div className="mx-auto shadow-xl rounded overflow-hidden" style={{ background: C.page, color: C.ink, maxWidth: 580 }}>
              {/* Header — ink-emerald gradient, white text (matches PDF cover) */}
              <div
                data-aihf-darkband
                data-surface="dark"
                data-no-contrast-guard
                className="px-5 py-4 flex items-center justify-between allow-white"
                style={{
                  backgroundImage: C.emeraldGradient,
                  backgroundColor: "#042c1c",
                  borderBottom: `1px solid ${C.gold}`,
                  color: "#FFFFFF",
                }}
              >
                <div className="flex items-center gap-3">
                  {showLogo ? (
                    <img src={branding.logoDataUrl} alt="" className="h-11 w-11 rounded bg-white object-contain p-1" />
                  ) : (
                    <div
                      className="h-11 w-11 rounded flex items-center justify-center overflow-hidden"
                      style={{ background: "#FFFFFF", border: `1px solid ${C.gold}` }}
                    >
                      <img src={jbjMonogram} alt="JBJ" className="h-9 w-9 object-contain" />
                    </div>
                  )}
                  <div>
                    <p className="text-[13px] font-bold tracking-wider">JBJ GLOBAL REAL ESTATE</p>
                    <p data-tagline className="text-[10px]">AI Home Finder — Personalized Report</p>
                  </div>
                </div>
                <div className="text-right text-[10px]" style={{ opacity: 0.92 }}>
                  {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
              </div>

              {/* Prepared-by strip */}
              {branding.mode !== "none" && (
                <div className="px-5 py-3 flex items-start gap-3" style={{ background: C.surface, borderBottom: `1px solid ${C.goldHair}` }}>
                  {showPhoto && (
                    <img src={branding.photoDataUrl} alt="" className="h-14 w-14 rounded-full object-cover flex-shrink-0" style={{ border: `2px solid ${C.gold}` }} />
                  )}
                  <div className="text-[11px] leading-tight">
                    <p data-aihf-prepared-by className="text-[10px] uppercase tracking-wider font-semibold">
                      Prepared by — {ROLE_LABELS[branding.role]}
                    </p>
                    {branding.name && <p className="font-bold text-[13px]" style={{ color: C.ink }}>{branding.name}</p>}
                    {branding.companyName && <p style={{ color: C.ink }}>{branding.companyName}</p>}
                    {(branding.phone || branding.email) && (
                      <p style={{ color: C.muted }}>{[branding.phone, branding.email].filter(Boolean).join("  •  ")}</p>
                    )}
                    {(branding.whatsapp || branding.website) && (
                      <p style={{ color: C.muted }}>
                        {[branding.whatsapp && `WhatsApp: ${branding.whatsapp}`, branding.website].filter(Boolean).join("  •  ")}
                      </p>
                    )}
                    {branding.address && <p style={{ color: C.muted }}>{branding.address}</p>}
                    {branding.license && <p style={{ color: C.muted }}>{branding.license}</p>}
                    {branding.socials && <p className="truncate" style={{ color: C.muted, maxWidth: 380 }}>{branding.socials}</p>}
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="px-5 py-4">
                <h3 className="text-lg font-bold mb-3" style={{ color: C.ink }}>Your AI-Selected Properties</h3>
                <div className="space-y-3">
                  {previewProjects.map((p, i) => (
                    <div key={p.id} className="flex gap-3 p-2 rounded" style={{ background: C.surface, border: `1px solid ${C.goldHair}` }}>
                      <div className="h-16 w-20 rounded overflow-hidden flex-shrink-0" style={{ background: C.raised }}>
                        {(p.cover_image_url || p.images?.[0]?.image_url) ? (
                          <img src={p.cover_image_url || p.images?.[0]?.image_url} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p data-aihf-rank className="text-[10px] font-bold">RANK #{i + 1}</p>
                        <p className="text-sm font-bold truncate" style={{ color: C.ink }}>{p.name}</p>
                        <p className="text-[11px] truncate" style={{ color: C.muted }}>
                          {[p.developer?.name, p.area].filter(Boolean).join(" • ")}
                        </p>
                        <p data-aihf-price className="text-[11px] font-semibold">{fmtPrice(p)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] mt-4" style={{ color: C.muted, fontStyle: "italic" }}>
                  The exported PDF includes the cover, AI summary, comparison table, full property pages with amenities & analysis, and a closing page.
                </p>
              </div>

              {/* Footer — champagne band, ink text, gold hairline */}
              <div
                className="px-5 py-3 text-[10px] flex items-center justify-between"
                style={{
                  background: C.surface,
                  color: C.ink,
                  borderTop: `1px solid ${C.gold}`,
                }}
              >
                <span style={{ color: C.ink }}>Powered by JBJ Global Real Estate — Dubai, UAE</span>
                <span data-aihf-website style={{ fontWeight: 600 }}>{branding.website || "www.jbj.ae"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t flex flex-wrap items-center justify-end gap-2" style={{ borderColor: C.goldHair, background: C.page }}>
          <Button onClick={() => run("copy", () => onCopy())} disabled={!!busy} className="font-semibold" style={secondaryBtn}>
            <LinkIcon className="w-4 h-4 mr-2" /> Copy text
          </Button>
          <Button onClick={() => run("wa", () => onShareWhatsApp(branding))} disabled={!!busy} className="font-semibold" style={secondaryBtn}>
            <MessageCircle className="w-4 h-4 mr-2" /> Share WhatsApp
          </Button>
          <Button onClick={() => run("em", () => onShareEmail(branding))} disabled={!!busy} className="font-semibold" style={secondaryBtn}>
            <Mail className="w-4 h-4 mr-2" /> Share Email
          </Button>
          <Button data-aihf-primary-btn onClick={() => run("jbj", () => onSendToConsultant(branding))} disabled={!!busy} className="font-semibold allow-white" style={primaryBtn}>
            <Send className="w-4 h-4 mr-2" /> Send to JBJ Consultant
          </Button>
          <Button data-aihf-primary-btn onClick={() => run("dl", () => onDownload(branding))} disabled={!!busy} className="font-semibold allow-white" style={primaryBtn}>
            <Download className="w-4 h-4 mr-2" /> {busy === "dl" ? "Generating…" : "Download PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
