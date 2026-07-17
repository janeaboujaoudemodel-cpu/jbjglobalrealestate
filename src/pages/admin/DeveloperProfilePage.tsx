import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  ShieldCheck, History, Sparkles, Star, Calendar, Clock, Send, EyeOff, Eye
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import OwnerCompanyProfileUploader from "@/components/owner/OwnerCompanyProfileUploader";
import DeveloperCustomFieldsSection from "@/components/owner/DeveloperCustomFieldsSection";

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
  custom_fields?: Record<string, unknown> | null;
  completed_projects?: number | null;
  offplan_projects?: number | null;
  total_units_delivered?: number | null;
  portfolio_worth?: number | null;

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

const asList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/[,\n]/).map((v) => v.trim()).filter(Boolean);
  return [];
};

const formatNumber = (value: number | null | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-AE", { notation: value >= 1_000_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
};

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
        .select("id, name, slug, status, handover_date, total_units, cover_image_url, updated_at, is_published, area_name, emirate, sale_status, source_url")
        .or(`developer_id.eq.${developer.id},developer_name.eq.${developer.name}`)
        .is("merged_into_project_id", null)
        .is("deleted_at", null)
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

  const { data: salesReps = [] } = useQuery({
    queryKey: ["dev-sales-reps", developer?.id],
    queryFn: async () => {
      if (!developer) return [];
      const { data } = await supabase
        .from("developer_sales_reps")
        .select("id, full_name, title, position, email, phone_e164, whatsapp_number, languages, nationality, is_active, is_primary, availability_status")
        .eq("developer_id", developer.id)
        .order("is_primary", { ascending: false })
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

  const { data: developerActivity = [] } = useQuery({
    queryKey: ["dev-activity", developer?.id, developer?.name],
    queryFn: async () => {
      if (!developer) return [];
      const { data } = await supabase
        .from("developer_activity_log" as any)
        .select("*")
        .or(`entity_id.eq.${developer.id},developer_name.eq.${developer.name},entity_name.eq.${developer.name}`)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data as any[]) || [];
    },
    enabled: !!developer && canEdit,
  });


  /* ---------- Briefings ---------- */
  const { data: briefings = [] } = useQuery({
    queryKey: ["dev-briefings", developer?.id, developer?.name],
    queryFn: async () => {
      if (!developer) return [];
      const { data, error } = await supabase
        .from("briefing_requests")
        .select(`
          id, 
          developer_name, 
          project_name, 
          briefing_date, 
          briefing_time, 
          location_type, 
          location_address, 
          notes, 
          status, 
          rating, 
          rating_notes, 
          sales_rep_id, 
          sales_rep:developer_sales_reps!briefing_requests_sales_rep_id_fkey(id, full_name, title),
          representative_id,
          representative:developer_representatives!briefing_requests_representative_id_fkey(id, full_name, position)
        `)
        .eq("developer_name", developer.name)
        .order("briefing_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!developer,
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

  const buildProfilePayload = useCallback(() => ({
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
  }), [form]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!developer) return;
      const payload: any = buildProfilePayload();

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

  const autoSaveProfile = useCallback(async () => {
    if (!developer || !canEdit || !dirty || saveMutation.isPending) return;
    const payload: any = buildProfilePayload();
    const { error } = await supabase.from("developers").update(payload).eq("id", developer.id);
    if (!error) {
      qc.invalidateQueries({ queryKey: ["dev-profile", slug] });
      qc.invalidateQueries({ queryKey: ["dev-audit", developer.id] });
    }
  }, [developer, canEdit, dirty, saveMutation.isPending, buildProfilePayload, qc, slug]);

  useEffect(() => {
    if (!dirty || !canEdit) return;
    const timer = window.setTimeout(() => {
      autoSaveProfile().catch(() => undefined);
    }, 1400);
    const flush = () => {
      if (document.visibilityState === "hidden") autoSaveProfile().catch(() => undefined);
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
    };
  }, [dirty, canEdit, autoSaveProfile]);

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
          needs_review: false,
          review_flags: [],
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
  const customFields = (developer.custom_fields && typeof developer.custom_fields === "object" ? developer.custom_fields : {}) as Record<string, unknown>;
  const sourceLinks = asList(customFields.ai_source_links ?? customFields.sources);
  const communities = asList(customFields.communities);
  const emirates = asList(customFields.emirates_active);
  const extraEntries = Object.entries(customFields).filter(([key, value]) =>
    !["sources", "ai_source_links", "ai_intel_website_url", "last_ai_extraction_at"].includes(key) &&
    value !== null && value !== undefined && String(Array.isArray(value) ? value.join(", ") : value).trim() !== "",
  );

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

        <Tabs defaultValue="overview">
          <TabsList className="bg-[#F7F2EA] border border-[#B89555]/30">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Portfolio ({projects.length})</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="contacts">Contacts & Reps ({reps.length + salesReps.length})</TabsTrigger>
            <TabsTrigger value="files">Files & Brochures</TabsTrigger>
            <TabsTrigger value="briefings">Briefings ({briefings.length})</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4">
            {canEdit && (
              <OwnerCompanyProfileUploader
                developerId={developer.id}
                developerName={developer.name}
                developerWebsiteUrl={developer.website_url}
                sourceLinks={sourceLinks}
              />
            )}

            <Card className="border border-[#B89555]/30 bg-[#F7F2EA]">
              <CardHeader>
                <CardTitle className="text-base text-[#1A1A1A]">Developer information</CardTitle>
                <p className="text-xs text-[#1A1A1A]/60">
                  The description is written in third person from the company profile. Keep only verified facts; never paste first-person “we / our” copy.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Description (third-person verified company profile copy)">
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

                <DeveloperCustomFieldsSection
                  developerId={developer.id}
                  canEdit={canEdit}
                  initialValues={(developer as any).custom_fields}
                />


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
                          I confirm that the description, website, logo and profile fields above are verified from the company profile or directly with the developer.
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


          {/* PORTFOLIO */}
          <TabsContent value="projects" className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["Completed", formatNumber(developer.completed_projects)],
                ["Off-plan", formatNumber(developer.offplan_projects)],
                ["Units delivered", formatNumber(developer.total_units_delivered)],
                ["Portfolio worth", developer.portfolio_worth ? `AED ${formatNumber(developer.portfolio_worth)}` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#1A1A1A]/55">{label}</div>
                  <div className="mt-1 text-xl font-black text-[#064E3B]">{value}</div>
                </div>
              ))}
            </div>

            {(developer.website_url || sourceLinks.length > 0 || communities.length > 0 || emirates.length > 0 || extraEntries.length > 0) && (
              <Card className="border border-[#B89555]/30 bg-[#FDFBF7]">
                <CardHeader><CardTitle className="text-base text-[#1A1A1A]">Extracted developer intelligence</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {developer.website_url && (
                    <div>
                      <Label className="text-[11px] uppercase tracking-wider text-[#1A1A1A]/60">Official website</Label>
                      <a href={developer.website_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#064E3B] underline">
                        <Globe className="w-3.5 h-3.5" /> {developer.website_url.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                  {sourceLinks.length > 0 && (
                    <div>
                      <Label className="text-[11px] uppercase tracking-wider text-[#1A1A1A]/60">Source links</Label>
                      <div className="mt-1 space-y-1">
                        {sourceLinks.slice(0, 8).map((link) => (
                          <a key={link} href={link} target="_blank" rel="noreferrer" className="block truncate text-sm text-[#064E3B] underline">{link}</a>
                        ))}
                      </div>
                    </div>
                  )}
                  {communities.length > 0 && (
                    <div>
                      <Label className="text-[11px] uppercase tracking-wider text-[#1A1A1A]/60">Areas & communities</Label>
                      <div className="mt-1 flex flex-wrap gap-1.5">{communities.map((v) => <Badge key={v} variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">{v}</Badge>)}</div>
                    </div>
                  )}
                  {emirates.length > 0 && (
                    <div>
                      <Label className="text-[11px] uppercase tracking-wider text-[#1A1A1A]/60">Emirates</Label>
                      <div className="mt-1 flex flex-wrap gap-1.5">{emirates.map((v) => <Badge key={v} className="jj-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30">{v}</Badge>)}</div>
                    </div>
                  )}
                  {extraEntries.length > 0 && (
                    <div className="md:col-span-2 grid gap-2 md:grid-cols-2">
                      {extraEntries.slice(0, 16).map(([key, value]) => (
                        <div key={key} className="rounded-md border border-[#B89555]/20 bg-[#F7F2EA] px-3 py-2">
                          <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-[#1A1A1A]/50">{key.replace(/_/g, " ")}</div>
                          <div className="text-sm text-[#1A1A1A] break-words">{Array.isArray(value) ? value.join(", ") : String(value)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                        <div className="text-xs text-[#1A1A1A]/70 truncate">
                          {[p.area_name, p.emirate].filter(Boolean).join(" · ") || "—"}
                        </div>
                        <div className="text-[11px] text-[#1A1A1A]/60 mt-0.5">
                          {(p.sale_status || p.status || "—")} · {p.handover_date || "TBD"} · {p.total_units ?? "—"} units
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
                {reps.length === 0 && salesReps.length === 0 && <p className="text-sm text-[#1A1A1A]/60">No representatives registered for this developer yet.</p>}
                {salesReps.map((r: any) => (
                  <div key={`sales-${r.id}`} className="p-3 rounded-lg border border-[#B89555]/20 bg-[#FDFBF7] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#064E3B] flex items-center justify-center text-white font-medium">
                      {(r.full_name || "?").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#1A1A1A]">{r.full_name}</span>
                        {r.is_primary && <Badge className="text-xs bg-[#064E3B] text-white border-[#064E3B]">Primary</Badge>}
                        <Badge variant="outline" className="text-xs border-[#B89555]/40 text-[#1A1A1A]">Sales Rep</Badge>
                        <Badge className={`text-xs ${r.is_active ? 'jj-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30' : 'bg-amber-50 text-amber-900 border-amber-200'}`}>{r.availability_status || (r.is_active ? "active" : "inactive")}</Badge>
                      </div>
                      <div className="text-xs text-[#1A1A1A]/60 flex items-center gap-3 flex-wrap mt-0.5">
                        {(r.title || r.position) && <span>{r.title || r.position}</span>}
                        {r.languages?.length > 0 && <span className="flex items-center gap-1"><Languages className="w-3 h-3" />{r.languages.join(", ")}</span>}
                        {r.nationality && <span>{r.nationality}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {r.phone_e164 && <a className="p-2 rounded bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/30" href={`tel:${r.phone_e164}`}><Phone className="w-3.5 h-3.5" /></a>}
                      {r.email && <a className="p-2 rounded bg-[#EFE6D6] text-[#064E3B] border border-[#B89555]/30" href={`mailto:${r.email}`}><Mail className="w-3.5 h-3.5" /></a>}
                    </div>
                  </div>
                ))}
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
                      {r.email && <a className="p-2 rounded bg-[#EFE6D6] text-[#064E3B] border border-[#B89555]/30" href={`mailto:${r.email}`}><Mail className="w-3.5 h-3.5" /></a>}
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
          <TabsContent value="activity" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button size="sm" className="jj-surface-emerald text-white" asChild><Link to="/crm/tasks"><Plus className="w-3.5 h-3.5 mr-1" /> Register task</Link></Button>
              <Button size="sm" variant="outline" className="border-[#B89555]/40" asChild><Link to="/crm/activities">Meeting / event / deal</Link></Button>
            </div>
            <Card className="border border-[#B89555]/30 bg-[#F7F2EA]">
              <CardHeader><CardTitle className="text-base flex items-center gap-2 text-[#1A1A1A]"><History className="w-4 h-4" /> Recent activity</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {[...developerActivity, ...audit].length === 0 && <p className="text-sm text-[#1A1A1A]/60">No activity yet.</p>}
                {[...developerActivity, ...audit].map((a) => (
                  <div key={`${a.activity_type || a.action}-${a.id}`} className="text-sm text-[#1A1A1A]/80 flex items-center justify-between border-b border-[#B89555]/15 py-1.5 gap-4">
                    <span>
                      <strong>{a.activity_type || a.action}</strong>{a.entity_name || a.field ? ` · ${a.entity_name || a.field}` : ""}
                    </span>
                    <span className="text-xs text-[#1A1A1A]/50">
                      {format(new Date(a.created_at), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BRIEFINGS */}
          <TabsContent value="briefings" className="space-y-4">
            <div className="flex justify-between items-center gap-2 flex-wrap">
              <p className="text-xs text-[#1A1A1A]/70">
                Surveys are sent by email after a briefing — recipients rate the sales rep on a secure link.
              </p>
              <Button size="sm" className="jj-surface-emerald text-white" asChild>
                <Link to="/owner/developers/briefings"><Plus className="w-3.5 h-3.5 mr-1" /> Add new briefing</Link>
              </Button>
            </div>
            {briefings.length === 0 ? (
              <Card className="border border-[#B89555]/30 bg-[#F7F2EA] p-6 text-center text-[#1A1A1A]/70">No briefings found for this developer.</Card>
            ) : (
              <div className="grid gap-3">
                {briefings.map((b: any) => (
                  <Card key={b.id} className="bg-[#FDFBF7] border border-[#B89555]/30 p-4 rounded-lg">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-[#1A1A1A]">{b.project_name}</h3>
                          <Badge variant="outline" className={`text-[10px] uppercase ${
                            b.status === 'approved' ? 'jj-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30' : 
                            b.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 
                            'bg-amber-50 text-amber-900 border-amber-200'
                          }`}>
                            {b.status}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-[#1A1A1A]/60 flex flex-wrap gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {b.briefing_date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.briefing_time?.slice(0, 5)}</span>
                          {b.location_type && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> 
                              {b.location_type.replace(/_/g, " ")}
                              {b.location_address ? ` — ${b.location_address}` : ""}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-[#1A1A1A]/70 flex flex-wrap gap-3">
                          {b.sales_rep && (
                            <span className="font-medium">CRM Rep: {b.sales_rep.full_name}</span>
                          )}
                          {b.representative && (
                            <span className="font-medium">Portal Rep: {b.representative.full_name}</span>
                          )}
                        </div>
                        {b.notes && <p className="mt-2 text-sm text-[#1A1A1A]/80 line-clamp-2 italic">"{b.notes}"</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {b.rating && (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star key={n} className={`w-3.5 h-3.5 ${n <= b.rating ? "fill-[#064E3B] text-[#064E3B]" : "text-[#B89555]/30"}`} />
                            ))}
                          </div>
                        )}
                        <Button
                          size="sm"
                          className="h-7 text-[10px] uppercase font-bold tracking-tight bg-[#064E3B] text-white hover:bg-[#042C1C]"
                          onClick={async () => {
                            const t = toast.loading("Sending survey emails…");
                            try {
                              const { data, error } = await supabase.functions.invoke("send-briefing-survey", {
                                body: { briefing_id: b.id },
                              });
                              if (error) throw error;
                              if (!(data as any)?.ok) throw new Error((data as any)?.error || "Failed");
                              toast.success(`Sent ${(data as any).sent}/${(data as any).total} survey email(s)`, { id: t });
                            } catch (e: any) {
                              toast.error(e?.message || "Could not send", { id: t });
                            }
                          }}
                        >
                          <Send className="w-3 h-3 mr-1" /> Send survey emails
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            <RepRatingsSection developerId={developer?.id} />
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
