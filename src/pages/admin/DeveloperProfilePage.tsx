import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowLeft, Building2, Globe, MapPin, Phone, Mail, Upload,
  Image as ImageIcon, FileText, Video, Map as MapIcon, Trash2,
  CheckCircle2, AlertTriangle, Pencil, Plus, ExternalLink, Languages,
  ShieldCheck, History, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";

interface Developer {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  headquarters: string | null;
  founded_year: number | null;
  ceo_name: string | null;
  parent_company: string | null;
  office_phone: string | null;
  whatsapp: string | null;
  whatsapp_group_url: string | null;
  telegram_group_url: string | null;
  admin_email: string | null;
  office_address: string | null;
  google_maps_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  notable_projects: string | null;
  specialization: string | null;
  last_confirmed_by: string | null;
  last_confirmed_at: string | null;
  confirmation_source: string | null;
  description_languages: string[] | null;
  needs_review?: boolean | null;
  review_flags?: string[] | null;
  review_flagged_at?: string | null;
  unverified_snapshot?: Record<string, unknown> | null;

}

const MEDIA_KINDS = [
  { k: "photo", label: "Photos", icon: ImageIcon, accept: "image/*" },
  { k: "video", label: "Videos", icon: Video, accept: "video/*" },
  { k: "brochure", label: "Brochures", icon: FileText, accept: ".pdf,application/pdf" },
  { k: "floorplan", label: "Floor Plans", icon: FileText, accept: "image/*,.pdf" },
  { k: "map", label: "Maps", icon: MapIcon, accept: "image/*,.pdf" },
  { k: "file", label: "Other Files", icon: FileText, accept: "*/*" },
] as const;

const preferRicherDeveloper = (rows: Developer[]) => rows.reduce((best, row) => {
  const score = (d: Developer) => (d.logo_url ? 10 : 0) + (d.website_url ? 4 : 0) + (d.description?.length ?? 0) / 300 + (d.last_confirmed_at ? 2 : 0);
  return score(row) > score(best) ? row : best;
});

export default function DeveloperProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isOwner } = useAuth();
  const qc = useQueryClient();

  /* ---------- Load developer ---------- */
  const { data: developer, isLoading } = useQuery({
    queryKey: ["dev-profile", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("*")
        .eq("slug", slug!)
        .limit(10);
      if (error) throw error;
      const rows = (data ?? []) as unknown as Developer[];
      return rows.length ? preferRicherDeveloper(rows) : null;
    },
    enabled: !!slug,
  });

  /* ---------- Access check ---------- */
  const { data: canEdit = false } = useQuery({
    queryKey: ["dev-edit-access", developer?.id],
    queryFn: async () => {
      if (!developer?.id) return false;
      const { data } = await supabase.rpc("has_developer_edit_access" as any, {
        _developer_id: developer.id,
      });
      return !!data;
    },
    enabled: !!developer?.id,
  });

  /* ---------- Projects ---------- */
  const { data: projects = [] } = useQuery({
    queryKey: ["dev-projects", developer?.id, developer?.name],
    queryFn: async () => {
      if (!developer) return [];
      const { data } = await supabase
        .from("projects")
        .select("id, name, slug, status, handover_date, total_units, cover_image_url, updated_at, is_published")
        .or(`developer_id.eq.${developer.id},developer_name.eq.${developer.name}`)
        .order("updated_at", { ascending: false });
      return data || [];
    },
    enabled: !!developer,
  });

  /* ---------- Sales reps ---------- */
  const { data: reps = [] } = useQuery({
    queryKey: ["dev-reps", developer?.id, developer?.name],
    queryFn: async () => {
      if (!developer) return [];
      const { data } = await supabase
        .from("developer_representatives")
        .select("id, user_id, full_name, position, email, phone, whatsapp_number, languages, nationality, status, role, last_active_at")
        .or(`developer_id.eq.${developer.id},current_developer_id.eq.${developer.id},developer_name.eq.${developer.name}`)
        .order("full_name");
      return data || [];
    },
    enabled: !!developer,
  });

  /* ---------- Media ---------- */
  const { data: media = [] } = useQuery({
    queryKey: ["dev-media", developer?.id],
    queryFn: async () => {
      if (!developer) return [];
      const { data } = await supabase
        .from("developer_media" as any)
        .select("*")
        .eq("developer_id", developer.id)
        .order("display_order");
      return (data as any[]) || [];
    },
    enabled: !!developer && canEdit,
  });

  /* ---------- Audit log ---------- */
  const { data: audit = [] } = useQuery({
    queryKey: ["dev-audit", developer?.id],
    queryFn: async () => {
      if (!developer) return [];
      const { data } = await supabase
        .from("developer_audit_log" as any)
        .select("*")
        .eq("developer_id", developer.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data as any[]) || [];
    },
    enabled: !!developer && canEdit,
  });

  /* ---------- Edit form state ---------- */
  const [form, setForm] = useState<Partial<Developer>>({});
  useEffect(() => {
    if (developer) setForm(developer);
  }, [developer]);

  const dirty = useMemo(() => {
    if (!developer) return false;
    return JSON.stringify(form) !== JSON.stringify(developer);
  }, [form, developer]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!developer) return;
      const payload: any = {
        description: form.description ?? null,
        website_url: form.website_url ?? null,
        // Location fields are permanently nulled — JBJ never stores or displays
        // developer office locations. See mem: constraint/no-developer-location.
        headquarters: null,
        office_address: null,
        google_maps_url: null,
        founded_year: form.founded_year ?? null,
        ceo_name: form.ceo_name ?? null,
        parent_company: form.parent_company ?? null,
        office_phone: form.office_phone ?? null,
        whatsapp: form.whatsapp ?? null,
        whatsapp_group_url: form.whatsapp_group_url ?? null,
        telegram_group_url: form.telegram_group_url ?? null,
        admin_email: form.admin_email ?? null,
        instagram_url: form.instagram_url ?? null,
        linkedin_url: form.linkedin_url ?? null,
        notable_projects: form.notable_projects ?? null,
        specialization: form.specialization ?? null,
        description_languages: form.description_languages ?? [],
      };

      const { error } = await supabase.from("developers").update(payload).eq("id", developer.id);
      if (error) throw error;
      // audit
      await supabase.from("developer_audit_log" as any).insert({
        developer_id: developer.id,
        actor_id: user?.id,
        action: "profile_update",
        after_value: payload,
      });
    },
    onSuccess: () => {
      toast.success("Profile saved · please re-confirm");
      qc.invalidateQueries({ queryKey: ["dev-profile", slug] });
      qc.invalidateQueries({ queryKey: ["dev-audit", developer?.id] });
    },
    onError: (e: any) => toast.error(e.message || "Save failed"),
  });

  /* ---------- Logo upload ---------- */
  const logoInputRef = useRef<HTMLInputElement>(null);
  const uploadLogo = async (file: File) => {
    if (!developer) return;
    const ext = file.name.split(".").pop() || "png";
    const path = `${developer.id}/logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("developer-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) return toast.error(upErr.message);
    const { data: pub } = supabase.storage.from("developer-assets").getPublicUrl(path);
    const { error } = await supabase
      .from("developers")
      .update({ logo_url: pub.publicUrl })
      .eq("id", developer.id);
    if (error) return toast.error(error.message);
    toast.success("Logo updated");
    qc.invalidateQueries({ queryKey: ["dev-profile", slug] });
  };

  /* ---------- Media upload ---------- */
  const uploadMedia = async (file: File, kind: string) => {
    if (!developer) return;
    const ext = file.name.split(".").pop() || "bin";
    const path = `${developer.id}/${kind}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error: upErr } = await supabase.storage
      .from("developer-assets")
      .upload(path, file, { contentType: file.type });
    if (upErr) return toast.error(upErr.message);
    const { data: pub } = supabase.storage.from("developer-assets").getPublicUrl(path);
    const { error } = await supabase.from("developer_media" as any).insert({
      developer_id: developer.id,
      kind,
      url: pub.publicUrl,
      storage_path: path,
      mime_type: file.type,
      file_size_bytes: file.size,
      caption: file.name,
      uploaded_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success(`${kind} uploaded`);
    qc.invalidateQueries({ queryKey: ["dev-media", developer.id] });
  };

  const deleteMedia = async (m: any) => {
    if (!confirm("Delete this file?")) return;
    if (m.storage_path) await supabase.storage.from("developer-assets").remove([m.storage_path]);
    await supabase.from("developer_media" as any).delete().eq("id", m.id);
    qc.invalidateQueries({ queryKey: ["dev-media", developer?.id] });
  };

  /* ---------- Confirmation ---------- */
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);
  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!developer || !user) return;
      const source = isOwner ? "owner" : "sales_rep";
      const { error } = await supabase
        .from("developers")
        .update({
          last_confirmed_by: user.id,
          last_confirmed_at: new Date().toISOString(),
          confirmation_source: source,
        } as any)
        .eq("id", developer.id);
      if (error) throw error;
      await supabase.from("developer_audit_log" as any).insert({
        developer_id: developer.id,
        actor_id: user.id,
        actor_role: source,
        action: "confirmation_signed",
      });
    },
    onSuccess: () => {
      setConfirmChecked(false);
      setThanksOpen(true);
      qc.invalidateQueries({ queryKey: ["dev-profile", slug] });
      qc.invalidateQueries({ queryKey: ["dev-audit", developer?.id] });
    },
    onError: (e: any) => toast.error(e.message || "Confirmation failed"),
  });

  /* ---------- Auto-resolve logo from Clearbit when missing ---------- */
  useEffect(() => {
    if (!developer || developer.logo_url) return;
    if (!canEdit) return;
    const site = developer.website_url;
    if (!site) return;
    let host: string | null = null;
    try { host = new URL(site.startsWith("http") ? site : `https://${site}`).hostname.replace(/^www\./, ""); } catch { host = null; }
    if (!host) return;
    const candidate = `https://logo.clearbit.com/${host}`;
    const img = new Image();
    img.onload = async () => {
      await supabase.from("developers").update({ logo_url: candidate }).eq("id", developer.id);
      qc.invalidateQueries({ queryKey: ["dev-profile", slug] });
    };
    img.src = candidate;
  }, [developer, canEdit, qc, slug]);

  if (isLoading) {
    return <div className="p-12 text-center">Loading…</div>;
  }
  if (!developer) {
    return (
      <div className="p-12 text-center">
        <p className="text-[#1A1A1A]">Developer not found.</p>
        <Button onClick={() => navigate("/owner/developers")} className="mt-4">Back to Developers Portal</Button>
      </div>
    );
  }

  const confirmed = !!developer.last_confirmed_at;

  return (
    <div data-backend-portal="developer-profile" className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/owner/developers")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Developers Portal
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {confirmed ? (
              <Badge className="jj-emerald-soft text-[color:var(--emerald-1)] border border-[color:var(--emerald-1)]/30">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmed {format(new Date(developer.last_confirmed_at!), "MMM d, yyyy")}
              </Badge>
            ) : (
              <Badge className="bg-amber-50 text-amber-900 border border-amber-200">
                <AlertTriangle className="w-3 h-3 mr-1" /> Pending confirmation
              </Badge>
            )}
            {!canEdit && <Badge variant="outline">Read only</Badge>}
          </div>
        </div>

        {/* Identity card */}
        <Card className="overflow-hidden border border-[#B89555]/35 bg-[#F7F2EA] shadow-[0_22px_55px_-42px_rgba(26,26,26,0.5)] rounded-2xl">
          <CardContent className="p-0">
            <div className="relative bg-[image:var(--jj-emerald-ombre)] px-6 py-7 md:px-8 md:py-8 border-b border-[#B89555]/45">
              <div className="absolute inset-x-0 top-0 h-px bg-[#B89555]/70" />
              <div className="flex flex-col md:flex-row md:items-center gap-6">
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => logoInputRef.current?.click()}
              className="w-28 h-28 rounded-2xl border border-[#B89555]/55 bg-[#FDFBF7] flex items-center justify-center overflow-hidden group relative shrink-0 shadow-[0_22px_45px_-26px_rgba(0,0,0,0.65)]"
              title={canEdit ? "Click to upload logo" : "Logo"}
            >
              <DeveloperLogo src={developer.logo_url} alt={`${developer.name} logo`} name={developer.name} variant="card" renderFallback className="w-full h-full rounded-2xl border-0 shadow-none p-0" />
              {canEdit && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              )}
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#EFE6D6] font-black">Developer Profile</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">{developer.name}</h1>
              <div className="flex items-center gap-3 mt-3 text-sm text-white/85 flex-wrap">
                {developer.website_url && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#EFE6D6] border border-[#B89555]/50 text-[11px] font-black text-[#1A1A1A]">
                    <ShieldCheck className="w-3 h-3" /> Owner-only
                    <a href={developer.website_url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-1 underline">
                      <Globe className="w-3 h-3" /> {developer.website_url.replace(/^https?:\/\//, "")}
                    </a>
                  </span>
                )}
                <span className="font-semibold">{projects.length} projects · {reps.length} sales reps</span>
              </div>

            </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Needs-review flag: unverified fields were removed and are shown here for owner action */}
        {developer.needs_review && (
          <Card className="border-2 border-amber-400 bg-amber-50">
            <CardContent className="py-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold text-amber-900">
                  Needs verification — unverified profile fields were removed automatically.
                </p>
                <p className="text-xs text-amber-900/80">
                  We can't confirm these values came from the developer's official website or a
                  verified API, so they've been cleared to prevent showing wrong information to
                  clients. Contact the developer and re-enter the correct values below, then click
                  <span className="font-semibold"> "Confirm this profile"</span> to clear the flag.
                </p>
                {Array.isArray(developer.review_flags) && developer.review_flags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {developer.review_flags.map((f) => (
                      <Badge key={f} className="bg-amber-200 text-amber-900 border border-amber-400 text-[10px] font-black uppercase tracking-wide">
                        {f.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                )}
                {developer.unverified_snapshot && Object.keys(developer.unverified_snapshot).length > 0 && (
                  <details className="pt-2">
                    <summary className="text-xs font-semibold text-amber-900 cursor-pointer">
                      View removed values (for reference — do NOT paste unless you verify)
                    </summary>
                    <pre className="mt-2 text-[11px] bg-white/70 border border-amber-300 rounded p-2 overflow-auto max-h-48">
                      {JSON.stringify(developer.unverified_snapshot, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Privacy banner: everything below is owner-only */}
        <Card className="border border-[#B89555]/30 bg-[#FDFBF7]">
          <CardContent className="py-3 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-[#1A1A1A] mt-0.5 shrink-0" />
            <p className="text-xs text-[#1A1A1A]/80">
              <span className="font-semibold text-[#1A1A1A]">Internal only.</span> Website, email, phone and social/community links are
              <span className="font-semibold"> never shown publicly</span>. Developer office locations are
              <span className="font-semibold"> never stored or displayed anywhere</span>. These contact points exist so JBJ can reach the developer directly — clients must always close through us.
            </p>
          </CardContent>
        </Card>


        <Tabs defaultValue="overview">
          <TabsList className="bg-[#F7F2EA] border border-[#B89555]/30">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="contacts">Contacts & Reps ({reps.length})</TabsTrigger>
            <TabsTrigger value="files">Files & Brochures</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="border border-[#B89555]/30 bg-[#F7F2EA]">
              <CardHeader>
                <CardTitle className="text-base text-[#1A1A1A]">Developer information</CardTitle>
                <p className="text-xs text-[#1A1A1A]/60">
                  The description must match the developer's official website verbatim — do not paraphrase.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Description (as per the developer's official website)">
                  <Textarea
                    rows={8}
                    disabled={!canEdit}
                    value={form.description ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="bg-[#FDFBF7] border-[#B89555]/30"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Website URL">
                    <Input disabled={!canEdit} value={form.website_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))} className="bg-[#FDFBF7] border-[#B89555]/30" />
                  </Field>
                  {/* Headquarters intentionally removed — never store or display developer office locations. */}

                  <Field label="Founded year">
                    <Input type="number" disabled={!canEdit} value={form.founded_year ?? ""} onChange={(e) => setForm((f) => ({ ...f, founded_year: e.target.value ? parseInt(e.target.value) : null }))} className="bg-[#FDFBF7] border-[#B89555]/30" />
                  </Field>
                  <Field label="CEO">
                    <Input disabled={!canEdit} value={form.ceo_name ?? ""} onChange={(e) => setForm((f) => ({ ...f, ceo_name: e.target.value }))} className="bg-[#FDFBF7] border-[#B89555]/30" />
                  </Field>
                  <Field label="Parent company">
                    <Input disabled={!canEdit} value={form.parent_company ?? ""} onChange={(e) => setForm((f) => ({ ...f, parent_company: e.target.value }))} className="bg-[#FDFBF7] border-[#B89555]/30" />
                  </Field>
                  <Field label="Specialization">
                    <Input disabled={!canEdit} value={form.specialization ?? ""} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} className="bg-[#FDFBF7] border-[#B89555]/30" />
                  </Field>
                  <Field label="LinkedIn">
                    <Input disabled={!canEdit} value={form.linkedin_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))} className="bg-[#FDFBF7] border-[#B89555]/30" />
                  </Field>
                  <Field label="Instagram">
                    <Input disabled={!canEdit} value={form.instagram_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, instagram_url: e.target.value }))} className="bg-[#FDFBF7] border-[#B89555]/30" />
                  </Field>
                  <Field label="Office phone">
                    <Input disabled={!canEdit} value={form.office_phone ?? ""} onChange={(e) => setForm((f) => ({ ...f, office_phone: e.target.value }))} className="bg-[#FDFBF7] border-[#B89555]/30" placeholder="+971 …" />
                  </Field>
                  <Field label="WhatsApp (direct)">
                    <Input disabled={!canEdit} value={form.whatsapp ?? ""} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} className="bg-[#FDFBF7] border-[#B89555]/30" placeholder="+971 …" />
                  </Field>
                  <Field label="Admin email">
                    <Input disabled={!canEdit} value={form.admin_email ?? ""} onChange={(e) => setForm((f) => ({ ...f, admin_email: e.target.value }))} className="bg-[#FDFBF7] border-[#B89555]/30" placeholder="contact@developer.ae" />
                  </Field>
                  {/* Office address & Google Maps link intentionally removed —
                      never store or display developer physical locations. */}

                  <Field label="WhatsApp Group invite">
                    <Input disabled={!canEdit} value={form.whatsapp_group_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, whatsapp_group_url: e.target.value }))} className="bg-[#FDFBF7] border-[#B89555]/30" placeholder="https://chat.whatsapp.com/…" />
                  </Field>
                  <Field label="Telegram Group / Channel">
                    <Input disabled={!canEdit} value={form.telegram_group_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, telegram_group_url: e.target.value }))} className="bg-[#FDFBF7] border-[#B89555]/30" placeholder="https://t.me/…" />
                  </Field>
                </div>
                <Field label="Notable projects (free text)">
                  <Textarea rows={3} disabled={!canEdit} value={form.notable_projects ?? ""} onChange={(e) => setForm((f) => ({ ...f, notable_projects: e.target.value }))} className="bg-[#FDFBF7] border-[#B89555]/30" />
                </Field>

                {canEdit && (
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setForm(developer)} disabled={!dirty}>Reset</Button>
                    <Button onClick={() => saveMutation.mutate()} disabled={!dirty || saveMutation.isPending} className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 hover:bg-[#EFE6D6]/80">
                      {saveMutation.isPending ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Confirmation block — hidden entirely for owner (the source of truth) */}
            {!isOwner && (
              <Card className="border border-[#B89555]/30 bg-[#F7F2EA]">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-[#1A1A1A]">
                    <ShieldCheck className="w-4 h-4" /> Confirmation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {confirmed ? (
                    <p className="text-sm text-[#1A1A1A]/80">
                      Last confirmed by <strong>{developer.last_confirmed_by ?? "—"}</strong> ({developer.confirmation_source ?? "—"}) on{" "}
                      {format(new Date(developer.last_confirmed_at!), "PPpp")}.
                    </p>
                  ) : (
                    <p className="text-sm text-amber-800">This profile has unconfirmed edits. Please verify with the developer and sign below.</p>
                  )}
                  {canEdit && (
                    <>
                      <label
                        htmlFor="confirm-check"
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
 confirmChecked
 ? "border-[color:var(--emerald-1)]/30 jj-emerald-soft/60"
 : "border-[#B89555]/40 bg-[#FDFBF7] hover:border-[#B89555]/70"
 }`}
                      >
                        <Checkbox
                          id="confirm-check"
                          checked={confirmChecked}
                          onCheckedChange={(v) => setConfirmChecked(v === true)}
                          className="mt-0.5 h-5 w-5 border-[#1A1A1A]/40 data-[state=checked]:jj-surface-emerald data-[state=checked]:border-[color:var(--emerald-1)]/30 data-[state=checked]:text-white"
                        />
                        <span className="text-sm text-[#1A1A1A] flex-1 leading-relaxed">
                          I confirm that the description, website, logo and headquarters above match the developer's official website,
                          and I have verified this information directly with the developer.
                        </span>
                      </label>
                      <div className="flex justify-end">
                        <Button
                          disabled={!confirmChecked || confirmMutation.isPending}
                          onClick={() => confirmMutation.mutate()}
                          className="jj-surface-emerald hover:jj-surface-emerald text-white disabled:opacity-40"
                        >
                          {confirmMutation.isPending ? "Submitting…" : "I agree & confirm"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Premium thank-you screen */}
            <Dialog open={thanksOpen} onOpenChange={setThanksOpen}>
              <DialogContent className="max-w-md bg-[#FDFBF7] border-2 border-[#B89555]/40 p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-[#F7F2EA] via-[#EFE6D6] to-[#F7F2EA] px-8 pt-10 pb-8 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full jj-surface-emerald flex items-center justify-center shadow-lg shadow-emerald-600/20 mb-5">
                    <CheckCircle2 className="w-9 h-9 text-white" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-semibold text-[#1A1A1A] tracking-tight">Thank you</h2>
                  <p className="text-sm text-[#1A1A1A]/70 mt-2 leading-relaxed">
                    Your confirmation has been recorded and signed against <strong className="text-[#1A1A1A]">{developer.name}</strong>.
                    Our team will review and reflect any pending updates shortly.
                  </p>
                  <div className="mt-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDFBF7] border border-[#B89555]/40 text-xs text-[#1A1A1A]">
                    <Sparkles className="w-3 h-3" /> Signed {format(new Date(), "PPp")}
                  </div>
                </div>
                <div className="px-8 py-4 bg-[#FDFBF7] border-t border-[#B89555]/20 flex justify-end">
                  <Button onClick={() => setThanksOpen(false)} className="bg-[#EFE6D6] hover:bg-[#F7F2EA]/90 text-[#1A1A1A]">Close</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>


          {/* PROJECTS */}
          <TabsContent value="projects" className="space-y-3">
            {projects.length === 0 ? (
              <Card className="border border-[#B89555]/30 bg-[#F7F2EA] p-6 text-center text-[#1A1A1A]/70">No projects yet.</Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.slug}`}
                    className="block p-4 rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] hover:bg-[#EFE6D6] transition"
                  >
                    <div className="flex items-center gap-3">
                      {p.cover_image_url ? (
                        <img src={p.cover_image_url} alt="" className="w-14 h-14 rounded object-cover"  loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-14 h-14 rounded bg-[#EFE6D6] flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-[#1A1A1A]/60" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#1A1A1A] truncate">{p.name}</div>
                        <div className="text-xs text-[#1A1A1A]/60">
                          {p.status || "—"} · {p.handover_date || "TBD"} · {p.total_units ?? "—"} units
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#1A1A1A]/50" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* MEDIA */}
          <TabsContent value="media" className="space-y-6">
            {MEDIA_KINDS.filter((k) => ["photo", "video", "floorplan", "map"].includes(k.k)).map((k) => (
              <MediaSection
                key={k.k}
                kind={k.k}
                label={k.label}
                accept={k.accept}
                items={media.filter((m) => m.kind === k.k)}
                canEdit={canEdit}
                onUpload={(f) => uploadMedia(f, k.k)}
                onDelete={deleteMedia}
              />
            ))}
          </TabsContent>

          {/* CONTACTS */}
          <TabsContent value="contacts" className="space-y-4">
            <Card className="border border-[#B89555]/30 bg-[#F7F2EA]">
              <CardHeader><CardTitle className="text-base text-[#1A1A1A]">Developer contact</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Field label="Office phone">
                  <Input disabled={!canEdit} value={form.office_phone ?? ""} onChange={(e) => setForm((f) => ({ ...f, office_phone: e.target.value }))} className="bg-[#FDFBF7] border-[#B89555]/30" />
                </Field>
                <Field label="WhatsApp">
                  <Input disabled={!canEdit} value={form.whatsapp ?? ""} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} className="bg-[#FDFBF7] border-[#B89555]/30" />
                </Field>
                <Field label="Email">
                  <Input disabled={!canEdit} value={form.admin_email ?? ""} onChange={(e) => setForm((f) => ({ ...f, admin_email: e.target.value }))} className="bg-[#FDFBF7] border-[#B89555]/30" />
                </Field>
                {/* Google Maps URL & Office address intentionally removed —
                    never store or display developer physical locations. */}

                {canEdit && dirty && (
                  <div className="col-span-2 flex justify-end">
                    <Button onClick={() => saveMutation.mutate()} className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 hover:bg-[#EFE6D6]/80">Save</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-[#B89555]/30 bg-[#F7F2EA]">
              <CardHeader><CardTitle className="text-base text-[#1A1A1A]">Registered sales representatives</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {reps.length === 0 && <p className="text-sm text-[#1A1A1A]/60">No representatives registered for this developer yet.</p>}
                {reps.map((r: any) => (
                  <div key={r.id} className="p-3 rounded-lg border border-[#B89555]/20 bg-[#FDFBF7] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EFE6D6] flex items-center justify-center text-[#1A1A1A] font-medium">
                      {(r.full_name || "?").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#1A1A1A]">{r.full_name}</span>
                        {r.role && <Badge variant="outline" className="text-xs">{r.role}</Badge>}
                        {r.status && <Badge className={`text-xs ${r.status === 'active' || r.status === 'approved' ? 'jj-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30' : 'bg-amber-50 text-amber-900 border-amber-200'}`}>{r.status}</Badge>}
                      </div>
                      <div className="text-xs text-[#1A1A1A]/60 flex items-center gap-3 flex-wrap mt-0.5">
                        {r.position && <span>{r.position}</span>}
                        {r.languages?.length > 0 && <span className="flex items-center gap-1"><Languages className="w-3 h-3" />{r.languages.join(", ")}</span>}
                        {r.nationality && <span>{r.nationality}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {r.phone && <a className="p-2 rounded bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/30" href={`tel:${r.phone}`}><Phone className="w-3.5 h-3.5" /></a>}
                      {r.email && <a className="p-2 rounded bg-purple-50 text-purple-700" href={`mailto:${r.email}`}><Mail className="w-3.5 h-3.5" /></a>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FILES */}
          <TabsContent value="files" className="space-y-6">
            {MEDIA_KINDS.filter((k) => ["brochure", "file"].includes(k.k)).map((k) => (
              <MediaSection
                key={k.k}
                kind={k.k}
                label={k.label}
                accept={k.accept}
                items={media.filter((m) => m.kind === k.k)}
                canEdit={canEdit}
                onUpload={(f) => uploadMedia(f, k.k)}
                onDelete={deleteMedia}
              />
            ))}
          </TabsContent>

          {/* ACTIVITY */}
          <TabsContent value="activity">
            <Card className="border border-[#B89555]/30 bg-[#F7F2EA]">
              <CardHeader><CardTitle className="text-base flex items-center gap-2 text-[#1A1A1A]"><History className="w-4 h-4" /> Recent activity</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {audit.length === 0 && <p className="text-sm text-[#1A1A1A]/60">No activity yet.</p>}
                {audit.map((a) => (
                  <div key={a.id} className="text-sm text-[#1A1A1A]/80 flex items-center justify-between border-b border-[#B89555]/15 py-1.5">
                    <span>
                      <strong>{a.action}</strong>{a.field ? ` · ${a.field}` : ""}
                    </span>
                    <span className="text-xs text-[#1A1A1A]/50">
                      {format(new Date(a.created_at), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[#1A1A1A] text-xs uppercase tracking-wider">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function MediaSection({
  kind, label, accept, items, canEdit, onUpload, onDelete,
}: {
  kind: string; label: string; accept: string; items: any[]; canEdit: boolean;
  onUpload: (f: File) => void; onDelete: (m: any) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Card className="border border-[#B89555]/30 bg-[#F7F2EA]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base text-[#1A1A1A]">{label}</CardTitle>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => ref.current?.click()} className="border-[#B89555]/40">
            <Plus className="w-3.5 h-3.5 mr-1" /> Upload
          </Button>
        )}
        <input
          ref={ref}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => {
            Array.from(e.target.files || []).forEach(onUpload);
            if (ref.current) ref.current.value = "";
          }}
        />
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-[#1A1A1A]/60">No {label.toLowerCase()} uploaded.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map((m) => (
              <div key={m.id} className="relative group border border-[#B89555]/20 rounded-lg overflow-hidden bg-[#FDFBF7]">
                {kind === "photo" || kind === "floorplan" || kind === "map" ? (
                  <img src={m.url} alt={m.caption || ""} className="w-full h-28 object-cover"  loading="lazy" decoding="async" />
                ) : kind === "video" ? (
                  <video src={m.url} className="w-full h-28 object-cover" />
                ) : (
                  <a href={m.url} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center h-28 text-[#1A1A1A]/70">
                    <FileText className="w-8 h-8" />
                    <span className="text-xs mt-1 px-2 truncate w-full text-center">{m.caption || "Open"}</span>
                  </a>
                )}
                {canEdit && (
                  <button
                    onClick={() => onDelete(m)}
                    className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
