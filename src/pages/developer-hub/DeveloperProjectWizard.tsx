import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft, ChevronRight, Upload, X, ShieldCheck, Clock, Save, Sparkles, FileText, Building2, ExternalLink, Copy, CheckCircle2, Image as ImageIcon, Images, FolderUp, MessageCircle, Mail, Phone, PercentCircle } from "lucide-react";
import { toast } from "sonner";
import { useDeveloperAutoPublish, type AutoPublishResponse } from "@/hooks/useDeveloperAutoPublish";
import { validateFile } from "@/utils/developerFileValidation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Uploaded { url: string; name: string; type: string; size: number; extractionUrl?: string; path?: string; bucket?: string; role?: "cover" | "gallery" | "fact_sheet" | "brochure" | "document" }

const STEPS = ["Basics", "Media", "Brochures", "Review"] as const;

const emptyBasics = {
  name: "",
  short_description: "",
  description: "",
  emirate: "",
  location: "",
  handover_date: "",
  launch_date: "",
  price_from: "",
  price_to: "",
  bedrooms_min: "",
  bedrooms_max: "",
  payment_plan: "",
  service_charge: "",
  built_up_area: "",
  plot_area: "",
  number_of_stories: "",
  furnished_status: "",
  amenities: "",
  is_serviced: "",
  is_managed: "",
  management_type: "",
  owner_can_use: "",
};

type Basics = typeof emptyBasics;

const DeveloperProjectWizard = () => {
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const publish = useDeveloperAutoPublish();
  const [step, setStep] = useState(0);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");

  const [basics, setBasics] = useState<Basics>(emptyBasics);
  const [cover, setCover] = useState<Uploaded | null>(null);
  const [gallery, setGallery] = useState<Uploaded[]>([]);
  const [brochures, setBrochures] = useState<Uploaded[]>([]);
  const [smartFiles, setSmartFiles] = useState<Uploaded[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [lastExtractedFields, setLastExtractedFields] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [additionalInfoMode, setAdditionalInfoMode] = useState<"keep" | "enrich">("enrich");
  const [publishResult, setPublishResult] = useState<AutoPublishResponse | null>(null);
  const [extractedDeveloperName, setExtractedDeveloperName] = useState("");
  const [developerDescription, setDeveloperDescription] = useState("");
  const [developerLogoNeeded, setDeveloperLogoNeeded] = useState(false);
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  const draftKey = useMemo(() => `jbj_project_upload_draft_${user?.id || "guest"}`, [user?.id]);
  const ownerRoute = location.pathname.startsWith("/owner");

  const { data: rep } = useQuery({
    queryKey: ["dev-rep-wizard", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_representatives")
        .select("current_developer_id, status")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: developer } = useQuery({
    queryKey: ["dev-trust-wizard", rep?.current_developer_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developers")
        .select("id, name, trust_level")
        .eq("id", rep!.current_developer_id!)
        .maybeSingle();
      return data;
    },
    enabled: !!rep?.current_developer_id,
  });

  const { data: ownerDevelopers = [] } = useQuery({
    queryKey: ["owner-project-wizard-developers", isOwner],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("id, name")
        .order("name", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data || []) as Array<{ id: string; name: string }>;
    },
    enabled: !!isOwner,
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft?.basics) setBasics((s) => ({ ...s, ...draft.basics }));
      if (typeof draft?.step === "number") setStep(Math.max(0, Math.min(STEPS.length - 1, draft.step)));
      if (draft?.cover) setCover(draft.cover);
      if (Array.isArray(draft?.gallery)) setGallery(draft.gallery);
      if (Array.isArray(draft?.brochures)) setBrochures(draft.brochures);
      if (Array.isArray(draft?.smartFiles)) setSmartFiles(draft.smartFiles);
      if (draft?.selectedDeveloperId) setSelectedDeveloperId(draft.selectedDeveloperId);
      if (draft?.extractedDeveloperName) setExtractedDeveloperName(draft.extractedDeveloperName);
      if (draft?.developerDescription) setDeveloperDescription(draft.developerDescription);
      if (typeof draft?.developerLogoNeeded === "boolean") setDeveloperLogoNeeded(draft.developerLogoNeeded);
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, [draftKey]);

  useEffect(() => {
    const payload = { basics, step, cover, gallery, brochures, smartFiles, selectedDeveloperId, extractedDeveloperName, developerDescription, developerLogoNeeded, savedAt: new Date().toISOString() };
    try { window.localStorage.setItem(draftKey, JSON.stringify(payload)); } catch {}
  }, [basics, step, cover, gallery, brochures, smartFiles, selectedDeveloperId, extractedDeveloperName, developerDescription, developerLogoNeeded, draftKey]);

  const activeDeveloperId = isOwner ? selectedDeveloperId : developer?.id;
  const activeDeveloperName = isOwner ? (ownerDevelopers.find((d) => d.id === selectedDeveloperId)?.name || extractedDeveloperName) : developer?.name;
  const trustLevel = developer?.trust_level as string | undefined;
  const willPublishLive = isOwner || trustLevel === "auto_publish";

  const uploadFile = async (file: File, bucket = "rel-media", role?: Uploaded["role"]) => {
    const v = validateFile(file);
    if (!v.isValid) {
      toast.error(v.rejectionReason || "File rejected");
      return null;
    }
    const path = `project-uploads/${user?.id || "owner"}/${crypto.randomUUID()}-${v.sanitizedName}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
    if (error) {
      toast.error(error.message);
      return null;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
    return { url: data.publicUrl, extractionUrl: signed?.signedUrl || data.publicUrl, path, bucket, name: v.sanitizedName, type: file.type, size: file.size, role } as Uploaded;
  };

  const onCover = async (f: File) => {
    const u = await uploadFile(f, "rel-media", "cover");
    if (u) setCover(u);
  };
  const onGallery = async (files: FileList) => {
    for (const f of Array.from(files)) {
      const u = await uploadFile(f, "rel-media", "gallery");
      if (u) setGallery((g) => [...g, u]);
    }
  };
  const onBrochures = async (files: FileList, role: Uploaded["role"] = "brochure", extractAfterUpload = false) => {
    const uploaded: Uploaded[] = [];
    for (const f of Array.from(files)) {
      const u = await uploadFile(f, "rel-media", role);
      if (u) uploaded.push(u);
    }
    if (!uploaded.length) return;
    setBrochures((b) => [...b, ...uploaded]);
    if (extractAfterUpload) {
      const extractionFiles = [...smartFiles, ...uploaded];
      setSmartFiles(extractionFiles);
      await runExtraction(extractionFiles);
    }
  };

  const onSmartUpload = async (files: FileList) => {
    const uploaded: Uploaded[] = [];
    for (const f of Array.from(files)) {
      const u = await uploadFile(f, "rel-media", "document");
      if (u) uploaded.push(u);
    }
    if (uploaded.length === 0) return;
    const imageFiles = uploaded.filter((u) => u.type.startsWith("image/"));
    const documentFiles = uploaded.filter((u) => !u.type.startsWith("image/"));
    if (!cover && imageFiles.length) setCover({ ...imageFiles[0], role: "cover" });
    if (imageFiles.length > 1) setGallery((g) => [...g, ...imageFiles.slice(1).map((u) => ({ ...u, role: "gallery" as const }))]);
    if (documentFiles.length) {
      const extractionFiles = [...smartFiles, ...documentFiles];
      setSmartFiles(extractionFiles);
      setBrochures((b) => [...b, ...documentFiles]);
      await runExtraction(extractionFiles);
    } else {
      toast.success("Image uploaded. Add a brochure or fact sheet to run AI extraction.");
    }
  };

  const runExtraction = async (files: Uploaded[]) => {
    if (!files.length) return;
    setExtracting(true);
    setLastExtractedFields([]);
    try {
      const { data, error } = await supabase.functions.invoke("ai-project-brochure-extract", {
          body: { files: files.map((f) => ({ url: f.extractionUrl || f.url, name: f.name, type: f.type, role: f.role })) },
      });
      if (error) {
        let message = error.message || "Extraction failed";
        const ctx = (error as any)?.context;
        if (ctx && typeof ctx.json === "function") {
          try {
            const body = await ctx.json();
            message = body?.error || body?.detail || message;
            if (Array.isArray(body?.files_skipped) && body.files_skipped.length) {
              message += ` (${body.files_skipped.map((f: any) => `${f.name}: ${f.reason}`).join("; ")})`;
            }
          } catch {}
        }
        throw new Error(message);
      }
      if (data?.error) throw new Error(String(data.error));
      const extracted = (data?.extracted ?? {}) as Record<string, unknown>;
      const filled: string[] = [];
      setBasics((prev) => {
        const next = { ...prev };
        const setIfEmpty = (key: keyof Basics, v: unknown) => {
          if (v === null || v === undefined || v === "") return;
          if ((key === "handover_date" || key === "launch_date") && !/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return;
          if (!next[key] || next[key] === "") {
            next[key] = String(v) as any;
            filled.push(String(key));
          }
        };
        setIfEmpty("name", extracted.name);
        setIfEmpty("short_description", extracted.short_description);
        setIfEmpty("description", extracted.description);
        setIfEmpty("emirate", extracted.emirate);
        setIfEmpty("location", extracted.location);
        setIfEmpty("handover_date", extracted.handover_date);
        setIfEmpty("launch_date", extracted.launch_date);
        setIfEmpty("price_from", extracted.price_from);
        setIfEmpty("price_to", extracted.price_to);
        setIfEmpty("bedrooms_min", extracted.bedrooms_min);
        setIfEmpty("bedrooms_max", extracted.bedrooms_max);
        setIfEmpty("payment_plan", extracted.payment_plan);
        setIfEmpty("service_charge", extracted.service_charge);
        setIfEmpty("built_up_area", extracted.built_up_area);
        setIfEmpty("plot_area", extracted.plot_area);
        setIfEmpty("number_of_stories", extracted.number_of_stories);
        setIfEmpty("furnished_status", extracted.furnished_status);
        setIfEmpty("management_type", extracted.management_type);
        setIfEmpty("short_description", extracted.listing_title);
        if (Array.isArray(extracted.amenities) && extracted.amenities.length && !next.amenities) {
          next.amenities = (extracted.amenities as string[]).join(", ");
          filled.push("amenities");
        }
        if (typeof extracted.is_serviced === "boolean" && !next.is_serviced) { next.is_serviced = extracted.is_serviced ? "yes" : "no"; filled.push("is_serviced"); }
        if (typeof extracted.is_managed === "boolean" && !next.is_managed) { next.is_managed = extracted.is_managed ? "yes" : "no"; filled.push("is_managed"); }
        if (typeof extracted.owner_can_use === "boolean" && !next.owner_can_use) { next.owner_can_use = extracted.owner_can_use ? "yes" : "no"; filled.push("owner_can_use"); }
        return next;
      });
      const developerInfo = (data as any)?.developer;
      if (typeof extracted.developer_name === "string" && extracted.developer_name.trim()) setExtractedDeveloperName(extracted.developer_name.trim());
      if (developerInfo?.developer_id && isOwner) setSelectedDeveloperId(developerInfo.developer_id);
      if (typeof extracted.developer_description === "string" && extracted.developer_description.trim()) setDeveloperDescription(extracted.developer_description.trim());
      setDeveloperLogoNeeded(Boolean(developerInfo?.developer_logo_needed));
      setLastExtractedFields(filled);
      if (Array.isArray((data as any)?.files_skipped) && (data as any).files_skipped.length) {
        toast.warning(`${(data as any).files_skipped.length} file(s) were skipped. The rest were extracted.`);
      }
      toast.success(filled.length ? `AI filled ${filled.length} field${filled.length === 1 ? "" : "s"} from your brochure` : "AI could not confidently extract new fields — please fill manually");
    } catch (e: any) {
      toast.error(e?.message || "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const canSubmit =
    !!activeDeveloperId && !!basics.name.trim() && !!basics.handover_date && !!basics.price_from;

  const paymentPlanParts = basics.payment_plan
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const applyAdditionalInfo = () => {
    const text = additionalInfo.trim();
    if (!text) return;
    if (additionalInfoMode === "keep") {
      setBasics((prev) => ({ ...prev, description: [prev.description, text].filter(Boolean).join("\n\n") }));
      toast.success("Additional information added to full description");
      return;
    }

    setBasics((prev) => {
      const next = { ...prev };
      const lower = text.toLowerCase();
      if (/amenit|pool|gym|spa|concierge|play|park|beach|court/.test(lower)) {
        const existing = prev.amenities ? `${prev.amenities}, ` : "";
        next.amenities = `${existing}${text}`;
      } else if (/payment|down|handover|installment|instalment|post[- ]handover|\d+\s*\//.test(lower)) {
        next.payment_plan = [prev.payment_plan, text].filter(Boolean).join("\n");
      } else if (/service charge|managed|management|rental|short.?term|owner use|furnished/.test(lower)) {
        next.description = [prev.description, `Management / usage notes: ${text}`].filter(Boolean).join("\n\n");
      } else {
        next.description = [prev.description, text].filter(Boolean).join("\n\n");
      }
      return next;
    });
    toast.success("Additional information distributed into the listing fields");
  };

  const saveDraft = () => {
    try {
      window.localStorage.setItem(draftKey, JSON.stringify({ basics, step, cover, gallery, brochures, smartFiles, selectedDeveloperId, extractedDeveloperName, developerDescription, developerLogoNeeded, savedAt: new Date().toISOString() }));
      toast.success("Draft saved on this device");
    } catch {
      toast.error("Draft could not be saved on this device");
    }
  };

  const handleSubmit = async () => {
    if (!activeDeveloperId) {
      toast.error(isOwner ? "Choose a developer first" : "No developer associated with your account");
      return;
    }
    const yn = (v: string) => (v === "yes" ? true : v === "no" ? false : null);
    const amenitiesArr = basics.amenities
      ? basics.amenities.split(",").map((s) => s.trim()).filter(Boolean)
      : null;
    const res = await publish.mutateAsync({
      developer_id: activeDeveloperId,
      patch: {
        name: basics.name.trim(),
        short_description: basics.short_description || null,
        description: basics.description || null,
        emirate: basics.emirate || null,
        location: basics.location || null,
        handover_date: basics.handover_date,
        launch_date: basics.launch_date || null,
        price_from: Number(basics.price_from),
        price_to: basics.price_to ? Number(basics.price_to) : null,
        bedrooms_min: basics.bedrooms_min ? Number(basics.bedrooms_min) : null,
        bedrooms_max: basics.bedrooms_max ? Number(basics.bedrooms_max) : null,
        payment_plan: basics.payment_plan || null,
        service_charge: basics.service_charge || null,
        built_up_area: basics.built_up_area || null,
        plot_area: basics.plot_area || null,
        number_of_stories: basics.number_of_stories ? Number(basics.number_of_stories) : null,
        furnished_status: basics.furnished_status || null,
        amenities: amenitiesArr,
        is_serviced: yn(basics.is_serviced),
        is_managed: yn(basics.is_managed),
        management_type: basics.management_type || null,
        owner_can_use: yn(basics.owner_can_use),
        cover_image_url: cover?.url || null,
        developer_name: activeDeveloperName || null,
      },
      images: gallery.filter((g) => g.type.startsWith("image/")).map((g, i) => ({ image_url: g.url, alt_text: g.name, display_order: i + 1 })),
      documents: brochures.map((b) => ({ file_url: b.url, file_name: b.name, document_type: "brochure" })),
      developer_patch: developerDescription ? { description: developerDescription } : undefined,
    });
    try { window.localStorage.removeItem(draftKey); } catch {}
    if (res.project_id || res.slug || res.public_path) setPublishResult(res);
    else navigate(ownerRoute ? "/owner/developers" : "/developer-hub");
  };

  const inputCls = "bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] mt-1";
  const UploadTile = ({ icon: Icon, title, note, accept, multiple, onFiles }: { icon: typeof Upload; title: string; note: string; accept?: string; multiple?: boolean; onFiles: (files: FileList) => void }) => (
    <label className="flex min-h-[96px] cursor-pointer flex-col justify-between rounded-lg border border-white/25 bg-white/10 p-3 text-white transition-colors hover:bg-white/15">
      <span className="flex items-center gap-2 text-sm font-semibold text-white"><Icon className="h-4 w-4" /> {title}</span>
      <span className="text-xs leading-snug text-white/80">{note}</span>
      <input type="file" multiple={multiple} accept={accept} className="hidden" disabled={extracting} onChange={(e) => e.target.files && onFiles(e.target.files)} />
    </label>
  );

  if (publishResult) {
    const publicPath = publishResult.public_path || (publishResult.slug ? `/project/${publishResult.slug}` : null);
    const fullUrl = publicPath && typeof window !== "undefined" ? `${window.location.origin}${publicPath}` : publicPath;
    const isPublished = publishResult.status === "published";
    const publishError = (publishResult as AutoPublishResponse & { publish_error?: string | null }).publish_error;

    return (
      <div className="space-y-6 max-w-4xl">
        <Card className="bg-[#F7F2EA] border-[#B89555]/40 p-6 rounded-lg">
          <div className="flex items-start gap-4">
            <div data-surface="emerald" data-backend-icon-tile="emerald" className="allow-white w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold text-[#1A1A1A] tracking-tight">{isPublished ? "Project published live" : "Project saved for review"}</h1>
              <p className="text-[#1A1A1A]/70 text-sm mt-1">
                {isPublished ? "The public project page is ready. Open it now or copy the direct URL." : "The project record was created and a preview URL was generated. Complete the missing listing data to publish live."}
              </p>
              {publishError && (
                <p className="mt-3 rounded-md border border-[#B89555]/35 bg-[#FDFBF7] px-3 py-2 text-sm text-[#1A1A1A]">
                  Publish blocker: {publishError.replace(/^Cannot publish project [^:]+:\s*/i, "")}
                </p>
              )}
              {fullUrl && (
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <Input readOnly value={fullUrl} className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]" />
                  <Button
                    type="button"
                    data-surface="emerald"
                    className="allow-white bg-[#064E3B] text-white hover:bg-[#042c1c]"
                    onClick={() => { navigator.clipboard?.writeText(fullUrl); toast.success("Project URL copied"); }}
                  >
                    <Copy className="w-4 h-4 mr-2" /> Copy
                  </Button>
                  <Button
                    type="button"
                    data-surface="emerald"
                    className="allow-white bg-[#064E3B] text-white hover:bg-[#042c1c]"
                    onClick={() => publicPath && window.open(publicPath, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> {isPublished ? "Open" : "Preview"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {publicPath && (
            <Card className="overflow-hidden rounded-lg border-[#B89555]/40 bg-[#FDFBF7] hover:border-[#B89555] transition-colors">
              <button type="button" onClick={() => window.open(publicPath, "_blank", "noopener,noreferrer")} className="block w-full text-left">
                <div className="aspect-[16/7] bg-gradient-to-br from-[#064E3B] to-[#042c1c] grid place-items-center text-white" data-surface="emerald">
                  {cover?.url ? <img src={cover.url} alt="Project cover preview" className="h-full w-full object-cover" loading="lazy" decoding="async" /> : <Building2 className="h-14 w-14 text-white" />}
                </div>
              </button>
              <div className="p-5 space-y-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[#B89555] font-bold">{isPublished ? "Live listing preview" : "Saved listing preview"}</p>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-[#1A1A1A] leading-tight">{basics.name || "Project name"}</h2>
                    <p className="text-sm text-[#1A1A1A]/70">{activeDeveloperName || "Developer"} · {basics.location || basics.emirate || "Location"}</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-[#B89555] shrink-0" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[#1A1A1A]">
                  <div className="rounded border border-[#B89555]/25 bg-[#F7F2EA] p-2"><span className="block text-[#1A1A1A]/60">Price from</span>AED {basics.price_from || "—"}</div>
                  <div className="rounded border border-[#B89555]/25 bg-[#F7F2EA] p-2"><span className="block text-[#1A1A1A]/60">Handover</span>{basics.handover_date || "—"}</div>
                  <div className="rounded border border-[#B89555]/25 bg-[#F7F2EA] p-2"><span className="block text-[#1A1A1A]/60">Bedrooms</span>{basics.bedrooms_min || "—"} - {basics.bedrooms_max || "—"}</div>
                  <div className="rounded border border-[#B89555]/25 bg-[#F7F2EA] p-2"><span className="block text-[#1A1A1A]/60">Docs</span>{brochures.length}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="flex h-9 flex-1 items-center justify-center gap-1 rounded bg-[#064E3B] text-sm font-semibold text-white" data-surface="emerald"><MessageCircle className="h-4 w-4" /> Chat</button>
                  <button type="button" className="flex h-9 flex-1 items-center justify-center gap-1 rounded bg-[#064E3B] text-sm font-semibold text-white" data-surface="emerald"><Mail className="h-4 w-4" /> Email</button>
                  <button type="button" className="flex h-9 flex-1 items-center justify-center gap-1 rounded bg-[#064E3B] text-sm font-semibold text-white" data-surface="emerald"><Phone className="h-4 w-4" /> Call</button>
                </div>
                {basics.payment_plan && (
                  <div className="rounded border border-[#B89555]/25 bg-[#F7F2EA] p-3 text-[#1A1A1A]">
                    <button type="button" onClick={() => setPaymentExpanded((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-[#1A1A1A]">
                      <span className="flex items-center gap-2"><PercentCircle className="h-5 w-5 text-[#064E3B]" /> Payment plan</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#064E3B] text-xs text-[#064E3B]">{paymentPlanParts[0]?.match(/\d+\/?\d*/)?.[0] || "%"}</span>
                    </button>
                    {paymentExpanded && <div className="mt-3 space-y-1 text-sm text-[#1A1A1A]/80">{paymentPlanParts.map((part, i) => <p key={i}>{part}</p>)}</div>}
                  </div>
                )}
              </div>
            </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] tracking-tight">Add a project</h1>
          <p className="text-[#1A1A1A]/70 text-sm mt-1">
            {willPublishLive
              ? "Will publish live immediately when you click Publish. Draft autosaves on this device."
              : "Will be queued for one-time owner approval. After that, every future edit goes live automatically."}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
 willPublishLive
 ? "jj-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30"
 : "bg-amber-50 text-amber-800 border-amber-200"
 }`}>
          {willPublishLive ? <ShieldCheck className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          {willPublishLive ? "Live publishing" : "Pending approval"}
        </span>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 text-xs">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`flex-1 h-[3px] rounded-full ${i <= step ? "bg-[#B89555]" : "bg-[#EFE6D6]"}`} />
            <span className={`whitespace-nowrap font-semibold ${i === step ? "text-[#1A1A1A]" : "text-[#1A1A1A]/50"}`}>
              {i + 1}. {label}
            </span>
          </div>
        ))}
      </div>

      {/* Smart brochure extract */}
      {step === 0 && (
        <Card data-surface="emerald" className="bg-gradient-to-br from-[#064E3B] to-[#042c1c] text-white p-5 rounded-lg border-[#064E3B]">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="rounded-full p-2 bg-white/10"><Sparkles className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold text-white">Smart brochure extract</h3>
                <p className="text-white/80 text-sm mt-1 max-w-xl">
                  Upload one or many brochures, payment plans, floor plans or fact sheets (PDF or image). AI will read them and pre-fill everything below. Unknown fields stay empty — nothing is invented.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <UploadTile icon={ImageIcon} title="Main cover photo" note="Used immediately on the listing preview card." accept="image/*" onFiles={(files) => files[0] && onCover(files[0])} />
            <UploadTile icon={Images} title="Gallery photos" note="Adds project gallery images and floor-plan visuals." accept="image/*" multiple onFiles={onGallery} />
            <UploadTile icon={FileText} title="Fact sheet / brochure" note="Reads the official project facts first." accept="application/pdf,image/*" multiple onFiles={(files) => onBrochures(files, "fact_sheet", true)} />
            <UploadTile icon={FolderUp} title={extracting ? "Extracting…" : "All documents"} note="Bulk upload payment plans, floor plans and documents together." accept="application/pdf,image/*" multiple onFiles={onSmartUpload} />
          </div>
          {smartFiles.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {smartFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/90">
                  <FileText className="w-3.5 h-3.5" /> {f.name}
                </div>
              ))}
            </div>
          )}
          {lastExtractedFields.length > 0 && (
            <div className="mt-3 text-xs text-white/80">
              Filled: {lastExtractedFields.join(", ")}. Review below and edit anything you want.
            </div>
          )}
          {smartFiles.length > 0 && !extracting && (
            <button onClick={() => runExtraction(smartFiles)} className="mt-3 text-xs underline text-white/90 hover:text-white">
              Re-run extraction on all uploaded files
            </button>
          )}
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="bg-[#F7F2EA] border-[#B89555]/40 p-6 rounded-lg min-w-0">
        {step === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isOwner && (
              <div className="md:col-span-2">
                <Label className="text-[#1A1A1A]">Developer *</Label>
                <Select value={selectedDeveloperId} onValueChange={setSelectedDeveloperId}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Select developer" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedDeveloperId && activeDeveloperName && !ownerDevelopers.some((d) => d.id === selectedDeveloperId) && (
                      <SelectItem value={selectedDeveloperId}>{activeDeveloperName}</SelectItem>
                    )}
                    {ownerDevelopers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {extractedDeveloperName && (
                  <p className="mt-2 text-xs text-[#1A1A1A]/70">
                    AI matched developer: <span className="font-semibold text-[#1A1A1A]">{extractedDeveloperName}</span>{developerLogoNeeded ? " — logo still needed for the developer profile." : ""}
                  </p>
                )}
              </div>
            )}
            <div className="md:col-span-2">
              <Label className="text-[#1A1A1A]">Project name *</Label>
              <Input value={basics.name} onChange={(e) => setBasics({ ...basics, name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Emirate</Label>
              <Input value={basics.emirate} onChange={(e) => setBasics({ ...basics, emirate: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Community / Location</Label>
              <Input value={basics.location} onChange={(e) => setBasics({ ...basics, location: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Handover date *</Label>
              <Input type="date" value={basics.handover_date} onChange={(e) => setBasics({ ...basics, handover_date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Launch date</Label>
              <Input type="date" value={basics.launch_date} onChange={(e) => setBasics({ ...basics, launch_date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Starting price (AED) *</Label>
              <Input type="number" value={basics.price_from} onChange={(e) => setBasics({ ...basics, price_from: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Max price (AED)</Label>
              <Input type="number" value={basics.price_to} onChange={(e) => setBasics({ ...basics, price_to: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Bedrooms min</Label>
              <Input type="number" value={basics.bedrooms_min} onChange={(e) => setBasics({ ...basics, bedrooms_min: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Bedrooms max</Label>
              <Input type="number" value={basics.bedrooms_max} onChange={(e) => setBasics({ ...basics, bedrooms_max: e.target.value })} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-[#1A1A1A]">Payment plan</Label>
              <Textarea rows={2} value={basics.payment_plan} onChange={(e) => setBasics({ ...basics, payment_plan: e.target.value })} placeholder="e.g. 10% down, 50% during construction, 40% on handover" className={inputCls} />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Service charge</Label>
              <Input value={basics.service_charge} onChange={(e) => setBasics({ ...basics, service_charge: e.target.value })} placeholder="e.g. AED 18/sqft/year" className={inputCls} />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Built-up area</Label>
              <Input value={basics.built_up_area} onChange={(e) => setBasics({ ...basics, built_up_area: e.target.value })} placeholder="e.g. 650 - 2,400 sqft" className={inputCls} />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Plot area</Label>
              <Input value={basics.plot_area} onChange={(e) => setBasics({ ...basics, plot_area: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Number of stories</Label>
              <Input type="number" value={basics.number_of_stories} onChange={(e) => setBasics({ ...basics, number_of_stories: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Furnishing</Label>
              <Select value={basics.furnished_status} onValueChange={(v) => setBasics({ ...basics, furnished_status: v })}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="furnished">Furnished</SelectItem>
                  <SelectItem value="semi-furnished">Semi-furnished</SelectItem>
                  <SelectItem value="unfurnished">Unfurnished</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Serviced apartment?</Label>
              <Select value={basics.is_serviced} onValueChange={(v) => setBasics({ ...basics, is_serviced: v })}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Property management included?</Label>
              <Select value={basics.is_managed} onValueChange={(v) => setBasics({ ...basics, is_managed: v })}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
              </Select>
            </div>
            {basics.is_managed === "yes" && (
              <div>
                <Label className="text-[#1A1A1A]">Management type</Label>
                <Select value={basics.management_type} onValueChange={(v) => setBasics({ ...basics, management_type: v })}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yearly">Yearly rental</SelectItem>
                    <SelectItem value="short_term">Short-term rental</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-[#1A1A1A]">Owner can use the unit?</Label>
              <Select value={basics.owner_can_use} onValueChange={(v) => setBasics({ ...basics, owner_can_use: v })}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-[#1A1A1A]">Amenities (comma-separated)</Label>
              <Textarea rows={2} value={basics.amenities} onChange={(e) => setBasics({ ...basics, amenities: e.target.value })} placeholder="e.g. Pool, Gym, Concierge, Kids play area" className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-[#1A1A1A]">Short description</Label>
              <Textarea value={basics.short_description} onChange={(e) => setBasics({ ...basics, short_description: e.target.value })} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-[#1A1A1A]">Full description</Label>
              <Textarea rows={5} value={basics.description} onChange={(e) => setBasics({ ...basics, description: e.target.value })} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-[#1A1A1A]">Developer description</Label>
              <Textarea rows={3} value={developerDescription} onChange={(e) => setDeveloperDescription(e.target.value)} placeholder="AI will prepare this from the brochure when available; edit or leave blank." className={inputCls} />
            </div>
            <div className="md:col-span-2 rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-4">
              <Label className="text-[#1A1A1A]">Additional information</Label>
              <Textarea rows={4} value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} placeholder="Add any extra project notes, amenities, payment plan details, management rules or owner-use rules." className={inputCls} />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button type="button" variant={additionalInfoMode === "enrich" ? "default" : "outline"} size="sm" onClick={() => setAdditionalInfoMode("enrich")} data-surface={additionalInfoMode === "enrich" ? "emerald" : undefined} className={additionalInfoMode === "enrich" ? "allow-white bg-[#064E3B] text-white" : "border-[#B89555]/40 text-[#1A1A1A]"}>Use to enrich listing</Button>
                <Button type="button" variant={additionalInfoMode === "keep" ? "default" : "outline"} size="sm" onClick={() => setAdditionalInfoMode("keep")} data-surface={additionalInfoMode === "keep" ? "emerald" : undefined} className={additionalInfoMode === "keep" ? "allow-white bg-[#064E3B] text-white" : "border-[#B89555]/40 text-[#1A1A1A]"}>Keep as full text</Button>
                <Button type="button" variant="outline" size="sm" onClick={applyAdditionalInfo} disabled={!additionalInfo.trim()} className="border-[#B89555]/40 text-[#1A1A1A]">Apply text</Button>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label className="text-[#1A1A1A]">Main cover photo</Label>
              {cover ? (
                <div className="relative inline-block mt-2">
                  <img src={cover.url} alt="cover" className="h-40 rounded border border-[#B89555]/40"  loading="lazy" decoding="async" />
                  <button onClick={() => setCover(null)} className="absolute -top-2 -right-2 bg-[#FDFBF7] border border-[#B89555]/40 rounded-full p-1">
                    <X className="w-3.5 h-3.5 text-[#1A1A1A]" />
                  </button>
                </div>
              ) : (
                <label className="mt-2 flex items-center gap-2 px-4 py-3 border border-dashed border-[#B89555]/60 rounded cursor-pointer hover:bg-[#EFE6D6]/60 transition-colors w-fit">
                  <Upload className="w-4 h-4 text-[#1A1A1A]" />
                  <span className="text-sm text-[#1A1A1A]">Upload main cover</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onCover(e.target.files[0])} />
                </label>
              )}
            </div>

            <div>
              <Label className="text-[#1A1A1A]">Gallery images</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {gallery.map((g, i) => (
                  <div key={i} className="relative">
                    {g.type.startsWith("image/") ? (
                      <img src={g.url} alt={g.name} className="h-24 rounded border border-[#B89555]/40"  loading="lazy" decoding="async" />
                    ) : (
                      <div className="h-24 w-24 flex items-center justify-center rounded border border-[#B89555]/40 text-xs text-[#1A1A1A] px-2 text-center">{g.name}</div>
                    )}
                    <button onClick={() => setGallery(gallery.filter((_, j) => j !== i))} className="absolute -top-2 -right-2 bg-[#FDFBF7] border border-[#B89555]/40 rounded-full p-1">
                      <X className="w-3 h-3 text-[#1A1A1A]" />
                    </button>
                  </div>
                ))}
                <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-[#B89555]/60 rounded cursor-pointer hover:bg-[#EFE6D6]/60 transition-colors">
                  <Upload className="w-4 h-4 text-[#1A1A1A]" />
                  <span className="text-sm text-[#1A1A1A]">Add gallery photos</span>
                  <input type="file" multiple className="hidden" onChange={(e) => e.target.files && onGallery(e.target.files)} />
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <Label className="text-[#1A1A1A]">Fact sheet, brochures & project documents</Label>
            <p className="text-xs text-[#1A1A1A]/60 mt-1">Any file type, any size, unlimited count. Uploaded brochures can also be sent to the AI extractor on step 1.</p>
            <div className="space-y-2 mt-2">
              {brochures.map((b, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 bg-[#FDFBF7] border border-[#B89555]/40 rounded">
                  <span className="text-sm text-[#1A1A1A] truncate">{b.name}</span>
                  <button onClick={() => setBrochures(brochures.filter((_, j) => j !== i))}>
                    <X className="w-4 h-4 text-[#1A1A1A]" />
                  </button>
                </div>
              ))}
              <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-[#B89555]/60 rounded cursor-pointer hover:bg-[#EFE6D6]/60 transition-colors w-fit">
                <Upload className="w-4 h-4 text-[#1A1A1A]" />
                  <span className="text-sm text-[#1A1A1A]">Add fact sheet / brochure</span>
                <input type="file" multiple className="hidden" onChange={(e) => e.target.files && onBrochures(e.target.files, "brochure", false)} />
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-sm text-[#1A1A1A]">
            <h3 className="text-lg font-semibold">Review & Publish</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div><span className="text-[#1A1A1A]/60">Name:</span> {basics.name || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Developer:</span> {activeDeveloperName || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Emirate:</span> {basics.emirate || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Location:</span> {basics.location || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Handover:</span> {basics.handover_date || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Launch:</span> {basics.launch_date || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Price from:</span> {basics.price_from || "—"} AED</div>
              <div><span className="text-[#1A1A1A]/60">Price to:</span> {basics.price_to || "—"} AED</div>
              <div><span className="text-[#1A1A1A]/60">Payment plan:</span> {basics.payment_plan || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Service charge:</span> {basics.service_charge || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Built-up:</span> {basics.built_up_area || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Plot:</span> {basics.plot_area || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Stories:</span> {basics.number_of_stories || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Furnishing:</span> {basics.furnished_status || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Serviced:</span> {basics.is_serviced || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Managed:</span> {basics.is_managed || "—"}{basics.is_managed === "yes" && basics.management_type ? ` (${basics.management_type})` : ""}</div>
              <div><span className="text-[#1A1A1A]/60">Owner use:</span> {basics.owner_can_use || "—"}</div>
              <div className="col-span-2"><span className="text-[#1A1A1A]/60">Amenities:</span> {basics.amenities || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Cover image:</span> {cover ? "✓" : "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Gallery:</span> {gallery.length} items</div>
              <div><span className="text-[#1A1A1A]/60">Brochures:</span> {brochures.length}</div>
              <div className="col-span-2"><span className="text-[#1A1A1A]/60">Developer description:</span> {developerDescription || "—"}</div>
            </div>
          </div>
        )}
      </Card>

      <aside className="space-y-4 min-w-0">
        <Card className="overflow-hidden rounded-lg border-[#B89555]/40 bg-[#FDFBF7]">
          <div className="aspect-[4/3] bg-gradient-to-br from-[#064E3B] to-[#042c1c] grid place-items-center text-white">
            {cover?.url ? <img src={cover.url} alt="Project cover preview" className="h-full w-full object-cover" loading="lazy" decoding="async" /> : <Building2 className="h-12 w-12 text-white" />}
          </div>
          <div className="p-4 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#B89555] font-bold">Listing preview</p>
              <h3 className="text-lg font-semibold text-[#1A1A1A] leading-tight">{basics.name || "Project name"}</h3>
              <p className="text-sm text-[#1A1A1A]/70">{activeDeveloperName || "Developer"} · {basics.location || basics.emirate || "Location"}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#1A1A1A]">
              <div className="rounded border border-[#B89555]/25 bg-[#F7F2EA] p-2"><span className="block text-[#1A1A1A]/60">Price from</span>AED {basics.price_from || "—"}</div>
              <div className="rounded border border-[#B89555]/25 bg-[#F7F2EA] p-2"><span className="block text-[#1A1A1A]/60">Handover</span>{basics.handover_date || "—"}</div>
              <div className="rounded border border-[#B89555]/25 bg-[#F7F2EA] p-2"><span className="block text-[#1A1A1A]/60">Bedrooms</span>{basics.bedrooms_min || "—"} - {basics.bedrooms_max || "—"}</div>
              <div className="rounded border border-[#B89555]/25 bg-[#F7F2EA] p-2"><span className="block text-[#1A1A1A]/60">Docs</span>{brochures.length}</div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="flex h-9 flex-1 items-center justify-center gap-1 rounded bg-[#064E3B] text-sm font-semibold text-white" data-surface="emerald"><MessageCircle className="h-4 w-4" /> Chat</button>
              <button type="button" className="flex h-9 flex-1 items-center justify-center gap-1 rounded bg-[#064E3B] text-sm font-semibold text-white" data-surface="emerald"><Mail className="h-4 w-4" /> Email</button>
              <button type="button" className="flex h-9 flex-1 items-center justify-center gap-1 rounded bg-[#064E3B] text-sm font-semibold text-white" data-surface="emerald"><Phone className="h-4 w-4" /> Call</button>
            </div>
            {basics.payment_plan && (
              <div className="rounded border border-[#B89555]/25 bg-[#F7F2EA] p-3 text-[#1A1A1A]">
                <button type="button" onClick={() => setPaymentExpanded((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-[#1A1A1A]">
                  <span className="flex items-center gap-2"><PercentCircle className="h-5 w-5 text-[#064E3B]" /> Payment plan</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#064E3B] text-xs text-[#064E3B]">{paymentPlanParts[0]?.match(/\d+\/?\d*/)?.[0] || "%"}</span>
                </button>
                {paymentExpanded && (
                  <div className="mt-3 space-y-1 text-sm text-[#1A1A1A]/80">
                    {paymentPlanParts.length ? paymentPlanParts.map((part, i) => <p key={i}>{part}</p>) : <p>{basics.payment_plan}</p>}
                  </div>
                )}
              </div>
            )}
            <p className="text-sm text-[#1A1A1A]/75 line-clamp-4">{basics.short_description || basics.description || "AI-extracted summary will appear here. Edit fields on the left before publishing."}</p>
          </div>
        </Card>
      </aside>
      </div>

      <div className="sticky bottom-0 z-20 -mx-2 flex items-center justify-between rounded-lg border border-[#B89555]/25 bg-[#FDFBF7]/95 p-2 shadow-[0_-10px_30px_-24px_rgba(26,26,26,0.45)] backdrop-blur">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || publish.isPending}
            className="border-[#B89555]/40 text-[#1A1A1A]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button variant="outline" onClick={saveDraft} disabled={publish.isPending} className="border-[#B89555]/40 text-[#1A1A1A]">
            <Save className="w-4 h-4 mr-1" /> Save draft
          </Button>
        </div>
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            className="bg-[#1A1A1A] text-[#FDFBF7] hover:bg-[#1A1A1A]/90"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || publish.isPending}
            className="bg-[#1A1A1A] text-[#FDFBF7] hover:bg-[#1A1A1A]/90"
          >
            {publish.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {willPublishLive ? "Publish live" : "Submit for approval"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default DeveloperProjectWizard;
