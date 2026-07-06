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
import { Loader2, ChevronLeft, ChevronRight, Upload, X, ShieldCheck, Clock, Save } from "lucide-react";
import { toast } from "sonner";
import { useDeveloperAutoPublish } from "@/hooks/useDeveloperAutoPublish";
import { validateFile } from "@/utils/developerFileValidation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Uploaded { url: string; name: string; type: string; size: number }

const STEPS = ["Basics", "Media", "Brochures", "Review"] as const;

const DeveloperProjectWizard = () => {
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const publish = useDeveloperAutoPublish();
  const [step, setStep] = useState(0);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");

  const [basics, setBasics] = useState({
    name: "",
    short_description: "",
    description: "",
    emirate: "",
    location: "",
    handover_date: "",
    price_from: "",
    price_to: "",
    bedrooms_min: "",
    bedrooms_max: "",
    payment_plan: "",
  });
  const [cover, setCover] = useState<Uploaded | null>(null);
  const [gallery, setGallery] = useState<Uploaded[]>([]);
  const [brochures, setBrochures] = useState<Uploaded[]>([]);
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
      if (draft?.selectedDeveloperId) setSelectedDeveloperId(draft.selectedDeveloperId);
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, [draftKey]);

  useEffect(() => {
    const payload = { basics, step, cover, gallery, brochures, selectedDeveloperId, savedAt: new Date().toISOString() };
    try { window.localStorage.setItem(draftKey, JSON.stringify(payload)); } catch {}
  }, [basics, step, cover, gallery, brochures, selectedDeveloperId, draftKey]);

  const activeDeveloperId = isOwner ? selectedDeveloperId : developer?.id;
  const activeDeveloperName = isOwner ? ownerDevelopers.find((d) => d.id === selectedDeveloperId)?.name : developer?.name;
  const trustLevel = developer?.trust_level as string | undefined;
  const willPublishLive = isOwner || trustLevel === "auto_publish";

  const uploadFile = async (file: File, bucket = "rel-media") => {
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
    return { url: data.publicUrl, name: v.sanitizedName, type: file.type, size: file.size } as Uploaded;
  };

  const onCover = async (f: File) => {
    const u = await uploadFile(f);
    if (u) setCover(u);
  };
  const onGallery = async (files: FileList) => {
    for (const f of Array.from(files)) {
      const u = await uploadFile(f);
      if (u) setGallery((g) => [...g, u]);
    }
  };
  const onBrochures = async (files: FileList) => {
    for (const f of Array.from(files)) {
      const u = await uploadFile(f);
      if (u) setBrochures((b) => [...b, u]);
    }
  };

  const canSubmit =
    !!activeDeveloperId && !!basics.name.trim() && !!basics.handover_date && !!basics.price_from;

  const saveDraft = () => {
    try {
      window.localStorage.setItem(draftKey, JSON.stringify({ basics, step, cover, gallery, brochures, selectedDeveloperId, savedAt: new Date().toISOString() }));
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
    const res = await publish.mutateAsync({
      developer_id: activeDeveloperId,
      patch: {
        name: basics.name.trim(),
        short_description: basics.short_description || null,
        description: basics.description || null,
        emirate: basics.emirate || null,
        location: basics.location || null,
        handover_date: basics.handover_date,
        price_from: Number(basics.price_from),
        price_to: basics.price_to ? Number(basics.price_to) : null,
        bedrooms_min: basics.bedrooms_min ? Number(basics.bedrooms_min) : null,
        bedrooms_max: basics.bedrooms_max ? Number(basics.bedrooms_max) : null,
        payment_plan: basics.payment_plan || null,
        cover_image_url: cover?.url || null,
        developer_name: activeDeveloperName || null,
      },
      images: gallery.filter((g) => g.type.startsWith("image/")).map((g, i) => ({ image_url: g.url, alt_text: g.name, display_order: i + 1 })),
      documents: brochures.map((b) => ({ file_url: b.url, file_name: b.name, document_type: "brochure" })),
    });
    try { window.localStorage.removeItem(draftKey); } catch {}
    if (res.status === "published") navigate(ownerRoute ? "/owner/developers/projects" : "/developer-hub/projects");
    else navigate(ownerRoute ? "/owner/developers" : "/developer-hub");
  };

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

      <Card className="bg-[#F7F2EA] border-[#B89555]/40 p-6 rounded-lg">
        {step === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isOwner && (
              <div className="md:col-span-2">
                <Label className="text-[#1A1A1A]">Developer *</Label>
                <Select value={selectedDeveloperId} onValueChange={setSelectedDeveloperId}>
                  <SelectTrigger className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] mt-1">
                    <SelectValue placeholder="Select developer" />
                  </SelectTrigger>
                  <SelectContent>
                    {ownerDevelopers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="md:col-span-2">
              <Label className="text-[#1A1A1A]">Project name *</Label>
              <Input value={basics.name} onChange={(e) => setBasics({ ...basics, name: e.target.value })} className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] mt-1" />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Emirate</Label>
              <Input value={basics.emirate} onChange={(e) => setBasics({ ...basics, emirate: e.target.value })} className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] mt-1" />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Community / Location</Label>
              <Input value={basics.location} onChange={(e) => setBasics({ ...basics, location: e.target.value })} className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] mt-1" />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Handover date *</Label>
              <Input type="date" value={basics.handover_date} onChange={(e) => setBasics({ ...basics, handover_date: e.target.value })} className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] mt-1" />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Payment plan</Label>
              <Input value={basics.payment_plan} onChange={(e) => setBasics({ ...basics, payment_plan: e.target.value })} placeholder="e.g. 60/40" className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] mt-1" />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Starting price (AED) *</Label>
              <Input type="number" value={basics.price_from} onChange={(e) => setBasics({ ...basics, price_from: e.target.value })} className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] mt-1" />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Max price (AED)</Label>
              <Input type="number" value={basics.price_to} onChange={(e) => setBasics({ ...basics, price_to: e.target.value })} className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] mt-1" />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Bedrooms min</Label>
              <Input type="number" value={basics.bedrooms_min} onChange={(e) => setBasics({ ...basics, bedrooms_min: e.target.value })} className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] mt-1" />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Bedrooms max</Label>
              <Input type="number" value={basics.bedrooms_max} onChange={(e) => setBasics({ ...basics, bedrooms_max: e.target.value })} className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-[#1A1A1A]">Short description</Label>
              <Textarea value={basics.short_description} onChange={(e) => setBasics({ ...basics, short_description: e.target.value })} className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-[#1A1A1A]">Full description</Label>
              <Textarea rows={5} value={basics.description} onChange={(e) => setBasics({ ...basics, description: e.target.value })} className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] mt-1" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label className="text-[#1A1A1A]">Cover image</Label>
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
                  <span className="text-sm text-[#1A1A1A]">Upload cover</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onCover(e.target.files[0])} />
                </label>
              )}
            </div>

            <div>
              <Label className="text-[#1A1A1A]">Gallery images</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {gallery.map((g, i) => (
                  <div key={i} className="relative">
                    <img src={g.url} alt={g.name} className="h-24 rounded border border-[#B89555]/40"  loading="lazy" decoding="async" />
                    <button onClick={() => setGallery(gallery.filter((_, j) => j !== i))} className="absolute -top-2 -right-2 bg-[#FDFBF7] border border-[#B89555]/40 rounded-full p-1">
                      <X className="w-3 h-3 text-[#1A1A1A]" />
                    </button>
                  </div>
                ))}
                <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-[#B89555]/60 rounded cursor-pointer hover:bg-[#EFE6D6]/60 transition-colors">
                  <Upload className="w-4 h-4 text-[#1A1A1A]" />
                  <span className="text-sm text-[#1A1A1A]">Add project media</span>
                  <input type="file" multiple className="hidden" onChange={(e) => e.target.files && onGallery(e.target.files)} />
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <Label className="text-[#1A1A1A]">Brochures & project documents</Label>
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
                <span className="text-sm text-[#1A1A1A]">Add brochure</span>
                <input type="file" multiple className="hidden" onChange={(e) => e.target.files && onBrochures(e.target.files)} />
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-sm text-[#1A1A1A]">
            <h3 className="text-lg font-semibold">Review & Publish</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div><span className="text-[#1A1A1A]/60">Name:</span> {basics.name || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Emirate:</span> {basics.emirate || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Location:</span> {basics.location || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Handover:</span> {basics.handover_date || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Price from:</span> {basics.price_from || "—"} AED</div>
              <div><span className="text-[#1A1A1A]/60">Payment plan:</span> {basics.payment_plan || "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Cover image:</span> {cover ? "✓" : "—"}</div>
              <div><span className="text-[#1A1A1A]/60">Gallery:</span> {gallery.length} images</div>
              <div><span className="text-[#1A1A1A]/60">Brochures:</span> {brochures.length}</div>
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
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
