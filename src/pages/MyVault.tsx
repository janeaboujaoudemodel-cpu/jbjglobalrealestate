import { useEffect, useMemo, useState } from "react";
import {
  Shield, Upload, FileText, Image as ImageIcon, Eye, Trash2, Lock,
  Crown, TrendingUp, Building2, Plus, X, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  uploadVaultFile, listMyVaultDocuments, getVaultSignedUrl, deleteVaultDocument,
  listMyVaultProperties, createVaultProperty, deleteVaultProperty,
  getMyVaultRanking, formatAed, VIP_LABEL,
  type VaultCategory, type VaultDocument, type VaultProperty, type VaultRanking,
} from "@/lib/vault";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES: { v: VaultCategory; label: string; help: string }[] = [
  { v: "identity",  label: "Identity",   help: "Passport, Emirates ID, visa, national ID, driving licence" },
  { v: "property",  label: "Properties", help: "Title deed, Oqood, MOU, SPA, handover certificate" },
  { v: "contract",  label: "Contracts",  help: "Agreements, NDAs, offer letters" },
  { v: "financial", label: "Financial",  help: "Bank statement, mortgage letter, proof of funds" },
  { v: "other",     label: "Other",      help: "Anything else you want stored privately" },
];

const VIP_STYLE: Record<VaultRanking["vip_tier"], string> = {
  diamond:  "bg-gradient-to-r from-[#1A1A1A] to-[#3a3a3a] text-white",
  platinum: "bg-gradient-to-r from-[#064E3B] to-[#0a3d2e] text-white",
  gold:     "bg-gradient-to-r from-[#B89555] to-[#8a6f3f] text-white",
  silver:   "bg-gradient-to-r from-[#94a3b8] to-[#64748b] text-white",
  bronze:   "bg-gradient-to-r from-[#a16207] to-[#713f12] text-white",
};

export default function MyVault() {
  const { user } = useAuth();
  const [docs, setDocs]               = useState<VaultDocument[]>([]);
  const [props, setProps]             = useState<VaultProperty[]>([]);
  const [rank, setRank]               = useState<VaultRanking | null>(null);
  const [activeCat, setActiveCat]     = useState<VaultCategory>("identity");
  const [uploading, setUploading]     = useState(false);
  const [propOpen, setPropOpen]       = useState(false);

  useEffect(() => {
    if (!user) return;
    refresh();
  }, [user]);

  async function refresh() {
    try {
      const [d, p, r] = await Promise.all([
        listMyVaultDocuments(),
        listMyVaultProperties(),
        getMyVaultRanking(),
      ]);
      setDocs(d); setProps(p); setRank(r);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onFileChosen(file: File) {
    setUploading(true);
    try {
      await uploadVaultFile({ file, category: activeCat });
      toast.success("Encrypted & stored privately");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function openDoc(doc: VaultDocument) {
    try {
      const { url } = await getVaultSignedUrl(doc.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function removeDoc(doc: VaultDocument) {
    if (!confirm(`Permanently delete "${doc.display_name}"?`)) return;
    try { await deleteVaultDocument(doc.id); toast.success("Deleted"); refresh(); }
    catch (e) { toast.error((e as Error).message); }
  }

  const filtered = useMemo(
    () => docs.filter((d) => d.category === activeCat),
    [docs, activeCat],
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFBF7]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-3">
            <Lock className="w-10 h-10 mx-auto text-[#064E3B]" />
            <h2 className="text-xl font-semibold">Sign in required</h2>
            <p className="text-sm text-[#1A1A1A]/70">
              Your secure document vault is only available when you are signed in.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero */}
        <div
          className="rounded-2xl p-6 text-white relative overflow-hidden"
          style={{ backgroundImage: "var(--jj-emerald-ombre, linear-gradient(135deg,#064E3B,#042c1c))" }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] opacity-90">
                <Shield className="w-3.5 h-3.5" /> Encrypted Vault · AES-256 at rest
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold">My Secure Documents</h1>
              <p className="text-sm opacity-90 max-w-2xl">
                Passport, Emirates ID, visa, title deeds — uploaded into a private bucket no one
                can scrape. Files are only readable through 60-second signed links and every access
                is logged.
              </p>
            </div>
            {rank && (
              <div className="flex items-center gap-3">
                <Badge className={`${VIP_STYLE[rank.vip_tier]} px-3 py-1 text-xs`}>
                  <Crown className="w-3.5 h-3.5 mr-1" /> {VIP_LABEL[rank.vip_tier]}
                </Badge>
                {rank.rank_position && (
                  <div className="text-right">
                    <div className="text-[10px] uppercase opacity-80 tracking-wide">Investor rank</div>
                    <div className="text-2xl font-semibold leading-none">#{rank.rank_position}</div>
                  </div>
                )}
              </div>
            )}
          </div>
          {rank && (
            <div className="mt-5 grid grid-cols-3 gap-3 max-w-lg">
              <Stat label="Invested" value={formatAed(rank.total_invested_aed)} />
              <Stat label="Properties" value={String(rank.property_count)} />
              <Stat label="Verified" value={String(rank.verified_count)} />
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.v}
              onClick={() => setActiveCat(c.v)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                activeCat === c.v
                  ? "bg-[#064E3B] text-white border-transparent shadow"
                  : "bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/30 hover:bg-[#EFE6D6]"
              }`}
              data-no-contrast-guard
              style={activeCat === c.v ? { color: "#FFFFFF" } : undefined}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Upload + docs grid */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">
                {CATEGORIES.find((c) => c.v === activeCat)?.label} documents
              </CardTitle>
              <p className="text-xs text-[#1A1A1A]/65 mt-1">
                {CATEGORIES.find((c) => c.v === activeCat)?.help}
              </p>
            </div>
            <label
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer shadow"
              style={{ backgroundImage: "var(--jj-emerald-ombre, linear-gradient(135deg,#064E3B,#042c1c))" }}
              data-no-contrast-guard
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading…" : "Upload file"}
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp,image/heic"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.currentTarget.value = "";
                  if (f) onFileChosen(f);
                }}
              />
            </label>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-[#1A1A1A]/55 text-sm">
                Nothing here yet. Upload a {CATEGORIES.find((c) => c.v === activeCat)?.label.toLowerCase()} file
                to get started — it will be encrypted before it leaves your device's network.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((d) => <DocCard key={d.id} d={d} onOpen={() => openDoc(d)} onDelete={() => removeDoc(d)} />)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Properties */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#064E3B]" /> My Properties
              </CardTitle>
              <p className="text-xs text-[#1A1A1A]/65 mt-1">
                Add what you own — your VIP rank is computed from total verified investment value (AED).
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setPropOpen(true)}
              className="text-white"
              style={{ backgroundImage: "var(--jj-emerald-ombre, linear-gradient(135deg,#064E3B,#042c1c))" }}
              data-no-contrast-guard
            >
              <Plus className="w-4 h-4 mr-1" /> Add property
            </Button>
          </CardHeader>
          <CardContent>
            {props.length === 0 ? (
              <div className="text-center py-10 text-[#1A1A1A]/55 text-sm">
                No properties yet. Add the units you own in Dubai (or anywhere) with their purchase price.
              </div>
            ) : (
              <div className="space-y-2">
                {props.map((p) => <PropRow key={p.id} p={p} onDelete={() => deleteVaultProperty(p.id).then(refresh)} />)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {propOpen && <AddPropertyDialog onClose={() => setPropOpen(false)} onSaved={() => { setPropOpen(false); refresh(); }} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
      <div className="text-[10px] uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function DocCard({ d, onOpen, onDelete }: { d: VaultDocument; onOpen: () => void; onDelete: () => void }) {
  const isImg = (d.mime_type ?? "").startsWith("image/");
  const Icon = isImg ? ImageIcon : FileText;
  return (
    <div className="border border-[#B89555]/25 rounded-xl p-3 bg-[#F7F2EA]/40 hover:bg-[#EFE6D6]/50 transition group">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundImage: "var(--jj-emerald-ombre, linear-gradient(135deg,#064E3B,#042c1c))" }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[#1A1A1A] truncate" title={d.display_name}>{d.display_name}</div>
          <div className="text-[11px] text-[#1A1A1A]/55 flex items-center gap-2 mt-0.5">
            {d.size_bytes ? `${(d.size_bytes / 1024).toFixed(0)} KB` : null}
            {d.verified && <span className="inline-flex items-center gap-0.5 text-[#064E3B]"><CheckCircle2 className="w-3 h-3" />Verified</span>}
          </div>
          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition">
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onOpen}>
              <Eye className="w-3 h-3 mr-1" /> View
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-[#b91c1c]" onClick={onDelete}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PropRow({ p, onDelete }: { p: VaultProperty; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border border-[#B89555]/20 rounded-lg px-3 py-2.5 bg-white">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[#1A1A1A] truncate">
          {p.project_name}
          {p.unit_number ? <span className="text-[#1A1A1A]/55 font-normal"> · #{p.unit_number}</span> : null}
        </div>
        <div className="text-[11px] text-[#1A1A1A]/60">
          {[p.developer_name, p.area, p.emirate].filter(Boolean).join(" · ")}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-semibold text-[#064E3B]">{formatAed(Number(p.purchase_price_aed))}</div>
        <div className="text-[10px] uppercase tracking-wide text-[#1A1A1A]/55">{p.status}</div>
      </div>
      <Button size="sm" variant="ghost" onClick={onDelete} className="text-[#b91c1c]"><Trash2 className="w-4 h-4" /></Button>
    </div>
  );
}

function AddPropertyDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    project_name: "", developer_name: "", area: "", emirate: "Dubai",
    unit_number: "", bedrooms: "" as any, size_sqft: "" as any,
    purchase_price_aed: "" as any, purchase_date: "", handover_date: "",
    status: "owned",
  });

  async function save() {
    if (!f.project_name || !f.purchase_price_aed) {
      toast.error("Project name and purchase price are required.");
      return;
    }
    setBusy(true);
    try {
      await createVaultProperty({
        project_name: f.project_name,
        developer_name: f.developer_name || null,
        area: f.area || null,
        emirate: f.emirate || null,
        unit_number: f.unit_number || null,
        bedrooms: f.bedrooms ? Number(f.bedrooms) : null,
        size_sqft: f.size_sqft ? Number(f.size_sqft) : null,
        purchase_price_aed: Number(f.purchase_price_aed),
        purchase_date: f.purchase_date || null,
        handover_date: f.handover_date || null,
        status: f.status,
        title_deed_doc_id: null,
      });
      toast.success("Property added — VIP rank recalculating.");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#064E3B]" /> Add a property
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Field className="col-span-2" label="Project / building *"><Input value={f.project_name} onChange={(e) => setF({ ...f, project_name: e.target.value })} /></Field>
          <Field label="Developer"><Input value={f.developer_name} onChange={(e) => setF({ ...f, developer_name: e.target.value })} /></Field>
          <Field label="Area"><Input value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} /></Field>
          <Field label="Unit #"><Input value={f.unit_number} onChange={(e) => setF({ ...f, unit_number: e.target.value })} /></Field>
          <Field label="Emirate"><Input value={f.emirate} onChange={(e) => setF({ ...f, emirate: e.target.value })} /></Field>
          <Field label="Bedrooms"><Input type="number" step="0.5" value={f.bedrooms} onChange={(e) => setF({ ...f, bedrooms: e.target.value })} /></Field>
          <Field label="Size (sqft)"><Input type="number" value={f.size_sqft} onChange={(e) => setF({ ...f, size_sqft: e.target.value })} /></Field>
          <Field className="col-span-2" label="Purchase price (AED) *"><Input type="number" value={f.purchase_price_aed} onChange={(e) => setF({ ...f, purchase_price_aed: e.target.value })} /></Field>
          <Field label="Purchase date"><Input type="date" value={f.purchase_date} onChange={(e) => setF({ ...f, purchase_date: e.target.value })} /></Field>
          <Field label="Handover date"><Input type="date" value={f.handover_date} onChange={(e) => setF({ ...f, handover_date: e.target.value })} /></Field>
          <Field className="col-span-2" label="Status">
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="owned">Owned</SelectItem>
                <SelectItem value="for_sale">For sale</SelectItem>
                <SelectItem value="for_rent">For rent</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="col-span-2 flex items-center gap-2 text-[11px] text-[#1A1A1A]/55 mt-1">
            <AlertCircle className="w-3.5 h-3.5" /> Upload the title deed under the “Properties” tab and link it later to mark this as Verified.
          </div>
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={busy} className="text-white"
              style={{ backgroundImage: "var(--jj-emerald-ombre, linear-gradient(135deg,#064E3B,#042c1c))" }}
              data-no-contrast-guard
            >
              {busy ? "Saving…" : "Save property"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-[11px] uppercase tracking-wide text-[#1A1A1A]/65">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
