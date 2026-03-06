import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload, FileText, Globe, Loader2, Check, AlertTriangle,
  X, Trash2, ChevronRight, Sparkles, MapPin, Building2,
  DollarSign, LayoutGrid, Shield, Landmark, ClipboardList, RefreshCw,
} from "lucide-react";

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  preview?: string;
  base64?: string;
  mimeType: string;
}

interface ExtractedData {
  name: string | null;
  developer: string | null;
  developer_id: string | null;
  location: string | null;
  emirate: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  bedroomsMin: number | null;
  bedroomsMax: number | null;
  handoverDate: string | null;
  completionPercentage: number | null;
  description: string | null;
  amenities: string[];
  paymentPlan: string | null;
  paymentBreakdown: { milestone: string; percentage?: number | null; amount?: string | null; timing?: string | null }[];
  unitTypes: string[];
  unitDetails: { type: string; sizeMin?: number | null; sizeMax?: number | null; priceFrom?: number | null; priceTo?: number | null; bathrooms?: number | null; availableUnits?: number | null }[];
  projectStatus: string | null;
  keyFeatures: string[];
  propertyType: string | null;
  serviceCharge: string | null;
  totalUnits: number | null;
  floors: number | null;
  sizeMin: number | null;
  sizeMax: number | null;
  highlights: string[];
  nearbyLandmarks: { name: string; distance?: string | null; time?: string | null }[];
  reraNumber: string | null;
  faqs: { q: string; a: string }[];
  comparableProjects?: { name: string; developer?: string | null; reason?: string | null; _enriched?: boolean }[];
  slug: string;
  documents: { name: string; type: string; originalName: string }[];
}

interface DuplicateMatch {
  id: string;
  name: string;
  slug: string;
  source: "pending" | "live";
  source_url?: string;
  status?: string;
  created_at: string;
}

type Step = "input" | "processing" | "duplicates" | "preview";

const STORAGE_KEY = "jbj_listing_generator_state";

interface PersistedState {
  step: Step;
  url: string;
  description: string;
  extractedProjects: ExtractedData[];
  activeProjectIndex: number;
  duplicates: DuplicateMatch[];
  filesMeta: { id: string; name: string; mimeType: string; base64: string }[];
  currentJobId: string | null;
  cloudDraftId: string | null;
  savedAt: number;
}

function loadPersistedState(): Partial<PersistedState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function savePersistedState(state: Omit<PersistedState, "savedAt">) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
  } catch {
    // localStorage full or unavailable
  }
}

function clearPersistedState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

const ListingGenerator = () => {
  const persisted = useRef(loadPersistedState());

  const [step, setStep] = useState<Step>(persisted.current?.step || "input");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [url, setUrl] = useState(persisted.current?.url || "");
  const [description, setDescription] = useState(persisted.current?.description || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [extractedProjects, setExtractedProjects] = useState<ExtractedData[]>(persisted.current?.extractedProjects || []);
  const [activeProjectIndex, setActiveProjectIndex] = useState(persisted.current?.activeProjectIndex || 0);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>(persisted.current?.duplicates || []);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateProjectIndex, setDuplicateProjectIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(persisted.current?.currentJobId || null);
  const [cloudDraftId, setCloudDraftId] = useState<string | null>(persisted.current?.cloudDraftId || null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const syncDraftToCloud = useCallback(async (override?: Partial<PersistedState>) => {
    const filesMeta = files.map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      base64: f.base64 || "",
    }));

    const payload = {
      step,
      url,
      description,
      extractedProjects,
      activeProjectIndex,
      duplicates,
      filesMeta,
      currentJobId,
      cloudDraftId,
      ...(override || {}),
    };

    savePersistedState(payload);

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return;

    const upsertData: any = {
      user_id: userId,
      urls: payload.url ? [payload.url] : [],
      files: payload.filesMeta as any,
      results: payload as any,
      status: payload.step === "processing" ? "processing" : "draft",
    };

    if (payload.cloudDraftId) {
      const { error } = await supabase.from("listing_extraction_queue").update(upsertData).eq("id", payload.cloudDraftId).eq("user_id", userId);
      if (error) console.warn("Draft update failed:", error.message);
      return;
    }

    const { data, error } = await supabase.from("listing_extraction_queue").insert(upsertData).select("id").single();
    if (!error && data?.id) {
      setCloudDraftId(data.id);
    }
  }, [files, step, url, description, extractedProjects, activeProjectIndex, duplicates, currentJobId, cloudDraftId]);

  // Restore latest cloud draft if available
  useEffect(() => {
    const loadCloudDraft = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) return;

      const { data: draft } = await supabase
        .from("listing_extraction_queue")
        .select("id, status, files, results")
        .eq("user_id", userId)
        .in("status", ["draft", "processing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!draft) return;

      const result = (draft.results || {}) as Partial<PersistedState>;
      const filesMeta = Array.isArray(draft.files) ? draft.files as PersistedState["filesMeta"] : (result.filesMeta || []);

      if (result.url) setUrl(result.url);
      if (result.description) setDescription(result.description);
      if (Array.isArray(result.extractedProjects)) setExtractedProjects(result.extractedProjects);
      if (typeof result.activeProjectIndex === "number") setActiveProjectIndex(result.activeProjectIndex);
      if (Array.isArray(result.duplicates)) setDuplicates(result.duplicates);
      if (result.step) setStep(result.step);
      if (result.currentJobId) setCurrentJobId(result.currentJobId);
      setCloudDraftId(draft.id);

      if (filesMeta.length) {
        setFiles(filesMeta.map((fm) => ({
          id: fm.id,
          file: new File([], fm.name),
          name: fm.name,
          mimeType: fm.mimeType,
          base64: fm.base64,
        })));
      }
    };

    loadCloudDraft();
  }, []);

  // Persist state on every meaningful change (local + cloud)
  useEffect(() => {
    const timeout = setTimeout(() => {
      void syncDraftToCloud();
    }, 700);

    return () => clearTimeout(timeout);
  }, [syncDraftToCloud]);

  // Drag & drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    const newFiles: UploadedFile[] = [];

    for (const file of arr) {
      const id = crypto.randomUUID();
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] || "");
        };
        reader.readAsDataURL(file);
      });

      let preview: string | undefined;
      if (file.type.startsWith("image/")) {
        preview = URL.createObjectURL(file);
      }

      newFiles.push({
        id,
        file,
        name: file.name,
        preview,
        base64,
        mimeType: file.type || "application/octet-stream",
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  useEffect(() => {
    return () => {
      files.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canGenerate = files.length > 0 || url.trim().length > 0 || description.trim().length > 0;
  const hasFilesOnly = files.length > 0;
  const hasUrlOnly = !hasFilesOnly && url.trim().length > 0;

  // ========== POLL FOR JOB COMPLETION ==========
  const pollJob = async (jobId: string): Promise<any> => {
    const maxPolls = 450; // 15 minutes max
    for (let i = 0; i < maxPolls; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const { data, error } = await supabase.functions.invoke("generate-listing", {
        body: { action: "poll", job_id: jobId },
      });

      if (error) {
        if (i > 5) setProcessingStatus("Still processing in background...");
        continue;
      }

      if (data?.status === "processing" || data?.status === "pending" || data?.status === "queued") {
        if (i > 20) setProcessingStatus("AI is analyzing your documents — still running in background...");
        continue;
      }

      if (!data?.success) throw new Error(data?.error || "Extraction failed");
      return data;
    }

    throw new Error("Still processing in background. You can leave and come back — your draft is saved.");
  };

  // ========== GENERATE ==========
  const handleGenerate = async () => {
    if (!canGenerate) return;

    setStep("processing");
    setIsProcessing(true);
    setTimedOut(false);
    setElapsedSeconds(0);
    setProcessingStatus(hasUrlOnly ? "Scraping website..." : "Preparing documents...");

    // Start elapsed timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
      if (elapsed > 120) setTimedOut(true);
    }, 1000);

    try {
      const filePayloads = files.map((f) => ({
        name: f.name,
        base64: f.base64 || "",
        mimeType: f.mimeType,
      }));

      if (filePayloads.length > 0) {
        setProcessingStatus(`Uploading ${filePayloads.length} document(s) & starting AI extraction...`);
      } else if (url.trim()) {
        setProcessingStatus("Scraping website & starting extraction...");
      } else {
        setProcessingStatus("Analyzing description...");
      }

      // Step 1: Submit job (returns immediately with job_id)
      const { data: submitData, error: submitErr } = await supabase.functions.invoke("generate-listing", {
        body: {
          action: "extract",
          files: filePayloads,
          url: url.trim() || null,
          description: description.trim() || null,
        },
      });

      if (submitErr) throw new Error(submitErr.message || "Failed to start extraction");
      if (!submitData?.job_id) throw new Error(submitData?.error || "No job ID returned");

      setCurrentJobId(submitData.job_id);
      await syncDraftToCloud({ step: "processing", currentJobId: submitData.job_id });
      setProcessingStatus("AI is extracting project data...");

      const result = await pollJob(submitData.job_id);

      const projects: ExtractedData[] = result.projects || (result.extracted ? [result.extracted] : []);
      if (projects.length === 0) throw new Error("No projects extracted");

      setExtractedProjects(projects);
      setActiveProjectIndex(0);
      setDuplicates(result.duplicates || []);
      setCurrentJobId(null);

      if (result.duplicates?.length > 0) {
        setStep("duplicates");
        setShowDuplicateDialog(true);
        setDuplicateProjectIndex(0);
      } else {
        setStep("preview");
      }

      toast.success(`Extracted ${projects.length} project${projects.length > 1 ? "s" : ""}!`);
    } catch (err: any) {
      console.error("Generation error:", err);
      toast.error(err.message || "Failed to generate listing");
      setStep("input");
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // ========== SAVE ==========
  const handleSave = async (mode: "new" | "merge" | "replace", existingId?: string, projectIdx?: number) => {
    const idx = projectIdx ?? activeProjectIndex;
    const extracted = extractedProjects[idx];
    if (!extracted) return;
    setIsSaving(true);
    setShowDuplicateDialog(false);

    try {
      const uploadedDocs: any[] = [];
      for (const f of files) {
        try {
          const safeName = f.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const path = `listings/${extracted.slug}/${Date.now()}-${safeName}`;
          
          const { error: uploadErr } = await supabase.storage
            .from("project-documents")
            .upload(path, f.file, { contentType: f.mimeType, upsert: true });

          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from("project-documents").getPublicUrl(path);
            uploadedDocs.push({
              url: urlData?.publicUrl || "",
              name: f.name,
              type: extracted.documents.find((d) => d.originalName === f.name)?.type || "document",
              title: extracted.documents.find((d) => d.originalName === f.name)?.name || f.name,
            });
          }
        } catch (err) {
          console.warn("File upload failed:", f.name, err);
        }
      }

      const record: Record<string, any> = {
        name: extracted.name || "Unnamed Project",
        slug: mode === "new" && existingId ? `${extracted.slug}-${Date.now()}` : extracted.slug,
        developer_name: extracted.developer,
        developer_id: extracted.developer_id,
        location: extracted.location,
        emirate: extracted.emirate,
        price_from: extracted.priceFrom,
        price_to: extracted.priceTo,
        bedrooms_min: extracted.bedroomsMin,
        bedrooms_max: extracted.bedroomsMax,
        handover_date: extracted.handoverDate,
        completion_percentage: extracted.completionPercentage,
        description: extracted.description,
        amenities: extracted.amenities,
        payment_plan: extracted.paymentPlan,
        payment_breakdown: extracted.paymentBreakdown,
        unit_types: extracted.unitTypes,
        unit_details: extracted.unitDetails,
        project_status: extracted.projectStatus,
        key_features: extracted.keyFeatures,
        property_type: extracted.propertyType,
        service_charge: extracted.serviceCharge,
        total_units: extracted.totalUnits,
        floors: extracted.floors,
        size_min: extracted.sizeMin,
        size_max: extracted.sizeMax,
        highlights: extracted.highlights,
        nearby_landmarks: extracted.nearbyLandmarks,
        rera_number: extracted.reraNumber,
        faqs: extracted.faqs,
        documents: uploadedDocs,
        images: [],
        source: "manual_upload",
        source_url: url.trim() || null,
        status: "pending",
      };

      const { data: saveResult, error: saveErr } = await supabase.functions.invoke("generate-listing", {
        body: {
          action: "save",
          files: record,
          url: mode,
          existingId: existingId || null,
        },
      });

      if (saveErr) throw saveErr;
      if (!saveResult?.success) throw new Error("Save failed");

      toast.success(
        mode === "merge" ? "Listing merged successfully!" :
        mode === "replace" ? "Listing replaced successfully!" :
        `"${extracted.name}" saved to pending!`
      );

      // Remove saved project from list
      setExtractedProjects(prev => prev.filter((_, i) => i !== idx));
      if (extractedProjects.length <= 1) {
        // Reset if last project
        setStep("input");
        setFiles([]);
        setUrl("");
        setDescription("");
        setExtractedProjects([]);
        setDuplicates([]);
        clearPersistedState();
      } else {
        setActiveProjectIndex(0);
      }
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save listing");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateAction = (action: "merge" | "replace" | "new", dupId?: string) => {
    if (action === "new") {
      setShowDuplicateDialog(false);
      setStep("preview");
    } else {
      handleSave(action, dupId, duplicateProjectIndex);
    }
  };

  const resetToInput = () => {
    setStep("input");
    setExtractedProjects([]);
    setDuplicates([]);
    setProcessingStatus("");
    setTimedOut(false);
    setElapsedSeconds(0);
    clearPersistedState();
  };

  const extracted = extractedProjects[activeProjectIndex] || null;

  // ========== RENDER ==========
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {(["input", "processing", "preview"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step === s ? "bg-gold text-black" :
              (["input", "processing", "preview"].indexOf(step) > i) ? "bg-gold/30 text-gold" :
              "bg-zinc-200 text-zinc-500"
            }`}>
              {i + 1}
            </div>
            <span className={`text-sm font-medium ${step === s ? "text-foreground" : "text-muted-foreground"}`}>
              {s === "input" ? "Upload" : s === "processing" ? "Extract" : "Preview"}
            </span>
            {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* ========== STEP 1: INPUT ========== */}
      {step === "input" && (
        <div className="space-y-6">
          {/* Drop Zone */}
          <div
            ref={dropRef}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragOver
                ? "border-gold bg-gold/10 scale-[1.01]"
                : "border-border hover:border-gold/50 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="*/*"
              className="hidden"
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
            />
            <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragOver ? "text-gold animate-bounce" : "text-muted-foreground"}`} />
            <p className="text-foreground font-semibold text-lg">
              {isDragOver ? "Drop files here" : "Drop documents or click to upload"}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              PDFs, images, brochures, fact sheets — any project documents
            </p>
          </div>

          {/* Queued Files */}
          {files.length > 0 && (
            <Card className="border-gold/30 bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold" />
                  {files.length} Document{files.length > 1 ? "s" : ""} Ready
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                    {f.preview ? (
                      <img src={f.preview} alt={f.name} className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gold/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gold" />
                      </div>
                    )}
                    <span className="text-sm text-foreground flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{(f.file.size / 1024 / 1024).toFixed(1)} MB</span>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(f.id)} className="h-7 w-7">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-gold" />
              Project Website URL (optional)
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://developer.com/project-name or marketing link with multiple projects"
            />
            <p className="text-xs text-muted-foreground">
              💡 If the link contains multiple projects, each will be extracted as a separate listing
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-gold" />
              Additional Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste any additional project details, specifications, or notes..."
              rows={4}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            variant="primary"
            className="w-full h-14 text-lg font-semibold"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate Listing{hasUrlOnly ? " from URL" : ""}
          </Button>
        </div>
      )}

      {/* ========== STEP 2: PROCESSING ========== */}
      {step === "processing" && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-gold animate-spin" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-black" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {hasUrlOnly ? "Scraping Website" : "Analyzing Documents"}
            </h3>
            <p className="text-muted-foreground">{processingStatus}</p>
            <p className="text-xs text-muted-foreground">
              {hasUrlOnly ? "Using Gemini Flash for fast extraction" : "Using Gemini Pro Vision for complete extraction"}
            </p>
            <p className="text-sm font-medium text-gold">{elapsedSeconds}s elapsed</p>
          </div>
          <div className="w-64 h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(95, (elapsedSeconds / 60) * 100)}%` }}
            />
          </div>

          {timedOut && (
            <div className="text-center space-y-3">
              <p className="text-sm text-amber-600">Taking longer than expected...</p>
              <Button variant="outline" onClick={resetToInput}>
                <RefreshCw className="w-4 h-4 mr-2" /> Cancel & Retry
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ========== STEP 3: DUPLICATE DIALOG ========== */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Existing Listing Found
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              We found {duplicates.length} matching listing{duplicates.length > 1 ? "s" : ""}:
            </p>
            {duplicates.map((dup) => (
              <Card key={dup.id} className="border-border">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">{dup.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {dup.source === "live" ? "Published" : dup.status || "Pending"} · {new Date(dup.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={dup.source === "live" ? "default" : "secondary"} className="text-xs">
                    {dup.source === "live" ? "Live" : "Pending"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {duplicates[0] && (
              <>
                <Button
                  onClick={() => handleDuplicateAction("merge", duplicates[0].id)}
                  variant="primary"
                  className="w-full"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Merge with Existing
                </Button>
                <Button
                  onClick={() => handleDuplicateAction("replace", duplicates[0].id)}
                  variant="secondary"
                  className="w-full"
                  disabled={isSaving}
                >
                  Replace Existing
                </Button>
              </>
            )}
            <Button
              onClick={() => handleDuplicateAction("new")}
              variant="ghost"
              className="w-full"
              disabled={isSaving}
            >
              Save as New Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== STEP 4: PREVIEW ========== */}
      {step === "preview" && extractedProjects.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Extracted {extractedProjects.length} Project{extractedProjects.length > 1 ? "s" : ""}
            </h2>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={resetToInput}>
                <X className="w-4 h-4 mr-1" /> Start Over
              </Button>
            </div>
          </div>

          {/* Multi-project tabs */}
          {extractedProjects.length > 1 && (
            <Tabs
              value={String(activeProjectIndex)}
              onValueChange={(v) => setActiveProjectIndex(Number(v))}
            >
              <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
                {extractedProjects.map((p, i) => (
                  <TabsTrigger key={i} value={String(i)} className="text-xs">
                    {p.name || `Project ${i + 1}`}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {extracted && <ProjectPreview extracted={extracted} onSave={() => handleSave("new")} isSaving={isSaving} />}
        </div>
      )}
    </div>
  );
};

function ProjectPreview({ extracted, onSave, isSaving }: { extracted: ExtractedData; onSave: () => void; isSaving: boolean }) {
  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card className="border-gold/30 bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3]">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-foreground">{extracted.name || "Unnamed"}</h3>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {extracted.developer && (
                  <Badge className="bg-gold/20 text-foreground border-gold/30">
                    <Building2 className="w-3 h-3 mr-1" /> {extracted.developer}
                  </Badge>
                )}
                {extracted.location && (
                  <Badge variant="secondary">
                    <MapPin className="w-3 h-3 mr-1" /> {extracted.location}
                  </Badge>
                )}
                {extracted.emirate && <Badge variant="outline">{extracted.emirate}</Badge>}
                {extracted.projectStatus && <Badge variant="outline">{extracted.projectStatus}</Badge>}
              </div>
            </div>
            {extracted.priceFrom && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Starting from</p>
                <p className="text-xl font-bold text-gold">AED {extracted.priceFrom.toLocaleString()}</p>
                {extracted.priceTo && (
                  <p className="text-sm text-muted-foreground">to AED {extracted.priceTo.toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {extracted.description && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Description</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{extracted.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {extracted.bedroomsMin != null && (
          <Card className="border-border">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Bedrooms</p>
              <p className="font-bold text-foreground">{extracted.bedroomsMin}{extracted.bedroomsMax ? ` - ${extracted.bedroomsMax}` : ""}</p>
            </CardContent>
          </Card>
        )}
        {extracted.totalUnits && (
          <Card className="border-border">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Units</p>
              <p className="font-bold text-foreground">{extracted.totalUnits}</p>
            </CardContent>
          </Card>
        )}
        {extracted.floors && (
          <Card className="border-border">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Floors</p>
              <p className="font-bold text-foreground">{extracted.floors}</p>
            </CardContent>
          </Card>
        )}
        {extracted.handoverDate && (
          <Card className="border-border">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Handover</p>
              <p className="font-bold text-foreground">{extracted.handoverDate}</p>
            </CardContent>
          </Card>
        )}
        {extracted.serviceCharge && (
          <Card className="border-border">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Service Charge</p>
              <p className="font-bold text-foreground">{extracted.serviceCharge}</p>
            </CardContent>
          </Card>
        )}
        {extracted.reraNumber && (
          <Card className="border-border">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">RERA</p>
              <p className="font-bold text-foreground text-xs">{extracted.reraNumber}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Amenities */}
      {extracted.amenities.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-gold" /> Amenities ({extracted.amenities.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {extracted.amenities.map((a, i) => (
                <Badge key={i} variant="outline" className="text-xs">{a}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Plan */}
      {extracted.paymentBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gold" />
              Payment Plan {extracted.paymentPlan ? `(${extracted.paymentPlan})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {extracted.paymentBreakdown.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-background/50 border border-border">
                  <span className="text-sm text-foreground">{s.milestone}</span>
                  <div className="flex items-center gap-3">
                    {s.percentage != null && (
                      <Badge className="bg-gold/20 text-foreground border-gold/30">{s.percentage}%</Badge>
                    )}
                    {s.timing && <span className="text-xs text-muted-foreground">{s.timing}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unit Details */}
      {extracted.unitDetails.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-gold" /> Unit Types ({extracted.unitDetails.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {extracted.unitDetails.map((unit, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
                  <div>
                    <p className="font-medium text-foreground text-sm">{unit.type}</p>
                    {(unit.sizeMin || unit.sizeMax) && (
                      <p className="text-xs text-muted-foreground">
                        {unit.sizeMin && `${unit.sizeMin.toLocaleString()} sq.ft`}
                        {unit.sizeMin && unit.sizeMax && " – "}
                        {unit.sizeMax && `${unit.sizeMax.toLocaleString()} sq.ft`}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {unit.priceFrom && (
                      <p className="text-sm font-semibold text-gold">
                        AED {unit.priceFrom.toLocaleString()}
                        {unit.priceTo ? ` – ${unit.priceTo.toLocaleString()}` : ""}
                      </p>
                    )}
                    {unit.availableUnits && (
                      <p className="text-xs text-muted-foreground">{unit.availableUnits} units</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Features */}
      {extracted.keyFeatures.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Key Features</CardTitle></CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {extracted.keyFeatures.map((f, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Check className="w-3 h-3 text-gold mt-0.5 shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Nearby Landmarks */}
      {extracted.nearbyLandmarks.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Landmark className="w-4 h-4 text-gold" /> Nearby Landmarks</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {extracted.nearbyLandmarks.map((l, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{l.name}</span>
                  <span className="text-muted-foreground">
                    {l.distance}{l.time ? ` · ${l.time}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparable Projects */}
      {extracted.comparableProjects && extracted.comparableProjects.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Comparable Projects
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">AI Enriched</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {extracted.comparableProjects.map((cp, i) => (
                <div key={i} className="p-2 rounded bg-amber-50 border border-amber-200">
                  <p className="font-medium text-foreground text-sm">{cp.name}</p>
                  {cp.developer && <p className="text-xs text-muted-foreground">by {cp.developer}</p>}
                  {cp.reason && <p className="text-xs text-muted-foreground mt-1">{cp.reason}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {extracted.documents.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Documents ({extracted.documents.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {extracted.documents.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-gold" />
                  <span className="text-foreground">{d.name}</span>
                  <Badge variant="outline" className="text-xs">{d.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQs */}
      {extracted.faqs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">FAQs ({extracted.faqs.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {extracted.faqs.map((faq, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-foreground">{faq.q}</p>
                <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Bottom Save Bar */}
      <div className="sticky bottom-4 p-4 rounded-xl bg-gradient-to-r from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30 shadow-lg flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground">{extracted.name}</p>
          <p className="text-xs text-muted-foreground">
            {extracted.amenities.length} amenities · {extracted.unitDetails.length} unit types · {extracted.paymentBreakdown.length} payment steps
          </p>
        </div>
        <Button
          variant="primary"
          onClick={onSave}
          disabled={isSaving}
          className="min-w-[160px]"
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
          Save to Pending
        </Button>
      </div>
    </div>
  );
}

export default ListingGenerator;
