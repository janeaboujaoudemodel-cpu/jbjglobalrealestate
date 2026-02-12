import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SafeImage } from "@/components/SafeImage";
import { filterValidImages, getFirstValidImageUrl } from "@/lib/imageUtils";
import {
  Loader2,
  ExternalLink,
  Check,
  X,
  RefreshCw,
  Image as ImageIcon,
  FileText,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  Bed,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
  Eye,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// ========== CORRECT TYPES matching DB schema ==========
interface ImageObj {
  url: string;
  alt_text?: string;
  display_order?: number;
}

interface DocumentObj {
  url: string;
  type: string;
  name?: string;
}

interface TestResult {
  success: boolean;
  coreComplete: boolean;
  fullyComplete: boolean;
  project?: {
    id: string;
    name: string;
    slug: string;
    source_url: string;
    developer_name?: string;
    location?: string;
    bedrooms?: string;
    price_text?: string;
    handover_display?: string;
    property_type_label?: string;
    status_label?: string;
    description?: string;
    images: ImageObj[];
    documents: DocumentObj[];
    usp_bullets: string[];
    amenities_list: string[];
    faqs: Array<{ question: string; answer: string }>;
    location_distances: Array<{ label: string; time: string }>;
    payment_breakdown: { down_payment?: string; during_construction?: string; on_completion?: string };
  };
  error?: string;
  extraction_time_ms?: number;
  checklist?: {
    hasImages: boolean;
    imageCount: number;
    hasDocs: boolean;
    docCount: number;
    hasBrochure: boolean;
    hasDescription: boolean;
    descriptionLength: number;
    hasDeveloper: boolean;
    hasUsps: boolean;
    uspCount: number;
    hasAmenities: boolean;
    amenityCount: number;
    hasLocation: boolean;
    hasPrice: boolean;
    hasHandover: boolean;
    hasFaqs: boolean;
    faqCount: number;
    hasDistances: boolean;
    distanceCount: number;
    hasPaymentBreakdown: boolean;
    hasFloorPlans: boolean;
    floorPlanCount: number;
  };
}

interface TestOneListingPanelProps {
  onApproved: () => void;
  bulkExtractDisabled: boolean;
}

const SESSION_KEY_RESULT = "test_extraction_result";
const SESSION_KEY_APPROVED = "test_extraction_approved";

// Helper to parse JSON fields safely
function parseJsonField<T>(value: unknown, defaultVal: T): T {
  if (!value) return defaultVal;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultVal;
    }
  }
  return value as T;
}

export function TestOneListingPanel({ onApproved, bulkExtractDisabled }: TestOneListingPanelProps) {
  const navigate = useNavigate();
  const [isExtracting, setIsExtracting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  
  // Restore state from sessionStorage on mount
  const [testResult, setTestResult] = useState<TestResult | null>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY_RESULT);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return null;
  });
  
  const [isApproved, setIsApproved] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY_APPROVED) === "true";
    } catch {
      return false;
    }
  });

  // Persist testResult to sessionStorage whenever it changes
  useEffect(() => {
    try {
      if (testResult) {
        sessionStorage.setItem(SESSION_KEY_RESULT, JSON.stringify(testResult));
      } else {
        sessionStorage.removeItem(SESSION_KEY_RESULT);
      }
    } catch { /* ignore */ }
  }, [testResult]);

  // Persist isApproved to sessionStorage whenever it changes
  useEffect(() => {
    try {
      if (isApproved) {
        sessionStorage.setItem(SESSION_KEY_APPROVED, "true");
      } else {
        sessionStorage.removeItem(SESSION_KEY_APPROVED);
      }
    } catch { /* ignore */ }
  }, [isApproved]);

  const runTestExtraction = async () => {
    if (bulkExtractDisabled) {
      setTestResult({
        success: false,
        coreComplete: false,
        fullyComplete: false,
        error:
          "Test extraction is currently disabled (sync/rebuild running or credits exhausted).",
      });
      return;
    }

    setIsExtracting(true);
    setTestResult(null);
    setIsApproved(false);

    try {
      // Find the first pending queue item with PENDING_SCRAPE status
      const { data: pendingItems, error: fetchError } = await supabase
        .from("pending_project_imports")
        .select("id, source_url, slug, name")
        .eq("status", "pending")
        .ilike("review_notes", "%PENDING_SCRAPE%")
        .limit(1);

      if (fetchError) throw fetchError;

      let fallbackItem: any = null;

      if (!pendingItems || pendingItems.length === 0) {
        // Try to find ANY pending item that needs extraction
        const { data: anyPending, error: anyError } = await supabase
          .from("pending_project_imports")
          .select("id, source_url, slug, name")
          .eq("status", "pending")
          .limit(1);

        if (anyError) throw anyError;

        if (!anyPending || anyPending.length === 0) {
          setTestResult({
            success: false,
            coreComplete: false,
            fullyComplete: false,
            error: "No pending items in queue. Run 'Rebuild Queue (Add Missing)' first to discover listings.",
          });
          return;
        }

        fallbackItem = anyPending?.[0] || null;
      }

      const targetItem = pendingItems?.[0] || fallbackItem;
      
      if (!targetItem) {
        setTestResult({
          success: false,
          coreComplete: false,
          fullyComplete: false,
          error: "No pending items in queue.",
        });
        return;
      }

      toast.info(`Testing extraction for: ${targetItem.name || targetItem.slug}`);

      const startTime = Date.now();

      // Run extraction for just ONE item
      const { data, error } = await supabase.functions.invoke("batch-extract-pending", {
        body: { 
          limit: 1, 
          throttleMs: 0, 
          concurrency: 1, 
          maxDurationMs: 60_000,
          targetId: targetItem.id // Extract specific item
        },
      });

      const extraction_time_ms = Date.now() - startTime;

      // Credits exhausted can come back as either data OR an error
      if (data?.credits_exhausted) {
        setTestResult({
          success: false,
          coreComplete: false,
          fullyComplete: false,
          error: "Firecrawl credits exhausted. Please top up your plan at firecrawl.dev/pricing",
        });
        return;
      }

      if (error) throw error;

      // Fetch the updated project data
      const { data: updatedProject, error: projectError } = await supabase
        .from("pending_project_imports")
        .select("*")
        .eq("id", targetItem.id)
        .single();

      if (projectError) throw projectError;

      // ========== FIXED: Parse extracted data with CORRECT types ==========
      const rawImages: ImageObj[] = parseJsonField<ImageObj[]>(updatedProject.images, []);
      // Filter out broken/placeholder images immediately
      const images = filterValidImages(rawImages);
      
      const documents: DocumentObj[] = parseJsonField<DocumentObj[]>(updatedProject.documents, []);
      const uspBullets: string[] = parseJsonField<string[]>(updatedProject.usp_bullets, []);
      // FIXED: Read amenities_list, not amenities
      const amenitiesList: string[] = parseJsonField<string[]>(updatedProject.amenities_list, []);
      const faqs: Array<{ question: string; answer: string }> = parseJsonField(updatedProject.faqs, []);
      const locationDistances: Array<{ label: string; time: string }> = parseJsonField(updatedProject.location_distances, []);
      const paymentBreakdown = parseJsonField<{ down_payment?: string; during_construction?: string; on_completion?: string }>(
        updatedProject.payment_breakdown, 
        {}
      );

      // Build checklist with CORRECT field checks
      const hasImages = images.length >= 2;
      // FIXED: Check for brochure document with URL (not mirrored_url which doesn't exist)
      const hasBrochure = documents.some((d) => d.type === "brochure" && d.url);
      const hasDocs = documents.length > 0;
      const hasDescription = updatedProject.description && updatedProject.description.length > 50;
      const hasDeveloper = updatedProject.developer_name && 
        updatedProject.developer_name.toLowerCase() !== "unknown" &&
        updatedProject.developer_name.trim() !== "";
      const hasUsps = uspBullets.length >= 2;
      const hasAmenities = amenitiesList.length >= 3;
      const hasLocation = !!updatedProject.location && updatedProject.location.trim() !== "";
      const hasPrice = !!updatedProject.price_from;
      const hasHandover = !!updatedProject.handover_date;
      const hasFaqs = faqs.length >= 1;
      const hasDistances = locationDistances.length >= 1;
      const hasPaymentBreakdown = !!(paymentBreakdown.down_payment || paymentBreakdown.during_construction || paymentBreakdown.on_completion);
      
      // Parse floor plan types
      const floorPlanTypes: Array<{ label: string }> = parseJsonField(updatedProject.floor_plan_types, []);
      const hasFloorPlans = floorPlanTypes.length >= 1;

      const checklist = {
        hasImages,
        imageCount: images.length,
        hasDocs,
        docCount: documents.length,
        hasBrochure,
        hasDescription,
        descriptionLength: updatedProject.description?.length ?? 0,
        hasDeveloper,
        hasUsps,
        uspCount: uspBullets.length,
        hasAmenities,
        amenityCount: amenitiesList.length,
        hasLocation,
        hasPrice,
        hasHandover,
        hasFaqs,
        faqCount: faqs.length,
        hasDistances,
        distanceCount: locationDistances.length,
        hasPaymentBreakdown,
        hasFloorPlans,
        floorPlanCount: floorPlanTypes.length,
      };

      // Core Complete: 2+ images + brochure + description (>50 chars) + valid developer
      const coreComplete = hasImages && hasBrochure && hasDescription && hasDeveloper;
      
      // Fully Complete: Core + USPs + amenities + location + price + handover + FAQs + distances + payment
      const fullyComplete = coreComplete && hasUsps && hasAmenities && hasLocation && hasPrice && hasFaqs;

      // Build bedrooms display from min/max
      const bedroomsDisplay = updatedProject.bedrooms_min && updatedProject.bedrooms_max
        ? updatedProject.bedrooms_min === updatedProject.bedrooms_max
          ? `${updatedProject.bedrooms_min} Bedrooms`
          : `${updatedProject.bedrooms_min}-${updatedProject.bedrooms_max} Bedrooms`
        : updatedProject.bedrooms_min
          ? `${updatedProject.bedrooms_min}+ Bedrooms`
          : null;

      // Build price display
      const priceDisplay = updatedProject.price_from
        ? `From AED ${Math.round(Number(updatedProject.price_from)).toLocaleString()}`
        : null;

      // Build handover display from date
      const handoverDisplay = updatedProject.handover_date
        ? new Date(updatedProject.handover_date).toLocaleDateString("en-US", { year: "numeric", month: "short" })
        : null;

      setTestResult({
        success: coreComplete,
        coreComplete,
        fullyComplete,
        project: {
          id: updatedProject.id,
          name: updatedProject.name || "Unknown",
          slug: updatedProject.slug,
          source_url: updatedProject.source_url,
          developer_name: updatedProject.developer_name,
          location: updatedProject.location,
          bedrooms: bedroomsDisplay,
          price_text: priceDisplay,
          handover_display: handoverDisplay,
          property_type_label: updatedProject.property_type_label,
          status_label: updatedProject.status_label,
          description: updatedProject.description,
          images,
          documents,
          usp_bullets: uspBullets,
          amenities_list: amenitiesList,
          faqs,
          location_distances: locationDistances,
          payment_breakdown: paymentBreakdown,
        },
        extraction_time_ms,
        checklist,
      });

      if (coreComplete) {
        toast.success("Test extraction successful! Core data extracted.");
      } else {
        toast.warning("Extraction completed but core data is missing. See checklist below.");
      }

    } catch (e: any) {
      console.error("Test extraction failed:", e);
      setTestResult({
        success: false,
        coreComplete: false,
        fullyComplete: false,
        error: e?.message || "Failed to run test extraction",
      });
      toast.error(e?.message || "Test extraction failed");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApproveFromCard = async () => {
    if (!testResult?.project?.id) return;
    
    setIsApproving(true);
    try {
      // Mark as approved in DB (create actual project)
      const projectData = testResult.project;
      
      const { data: newProject, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: projectData.name,
          slug: projectData.slug,
          location: projectData.location,
          description: projectData.description,
          price_from: testResult.project.price_text ? parseInt(testResult.project.price_text.replace(/[^\d]/g, "")) : null,
          source_url: projectData.source_url,
          is_offplan: true,
          status: "active",
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Insert images
      if (projectData.images.length > 0 && newProject) {
        const imageInserts = projectData.images.map((img, index) => ({
          project_id: newProject.id,
          image_url: img.url,
          alt_text: img.alt_text || projectData.name,
          display_order: index,
        }));
        await supabase.from("project_images").insert(imageInserts);
      }

      // Insert documents
      if (projectData.documents.length > 0 && newProject) {
        const docInserts = projectData.documents.map((doc, idx) => ({
          project_id: newProject.id,
          file_url: doc.url,
          document_type: doc.type,
          file_name: doc.name || `${doc.type}-${idx + 1}`,
          display_order: idx,
        }));
        await supabase.from("project_documents").insert(docInserts);
      }

      // Mark pending import as approved
      await supabase
        .from("pending_project_imports")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", projectData.id);

      setIsApproved(true);
      toast.success(`"${projectData.name}" approved and added to listings!`);
      onApproved();
    } catch (e: any) {
      toast.error(e?.message || "Failed to approve project");
    } finally {
      setIsApproving(false);
    }
  };

  const approveTestGate = () => {
    setIsApproved(true);
    toast.success("Test approved! You can now run bulk extraction.");
    onApproved();
  };

  const rejectTest = () => {
    setTestResult(null);
    setIsApproved(false);
    // Clear sessionStorage
    try {
      sessionStorage.removeItem(SESSION_KEY_RESULT);
      sessionStorage.removeItem(SESSION_KEY_APPROVED);
    } catch { /* ignore */ }
    toast.info("Test rejected. Fix the extraction logic and try again.");
  };

  // NOTE: openFullPagePreview removed - using Link component instead for reliable navigation

  const ChecklistItem = ({ label, passed, detail }: { label: string; passed: boolean; detail?: string }) => (
    <div className="flex items-center justify-between py-1 px-2 rounded bg-zinc-50">
      <div className="flex items-center gap-2">
        {passed ? (
          <CheckCircle className="w-4 h-4 text-emerald-600" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
        <span className={`text-sm ${passed ? "text-zinc-700" : "text-red-700"}`}>{label}</span>
      </div>
      {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
    </div>
  );

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <RefreshCw className="w-5 h-5 text-amber-600" />
          Test One Listing Before Bulk Extraction
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Extract a single listing to verify quality. You must approve the test result before bulk extraction is enabled.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test button */}
        {!testResult && !isExtracting && (
          <Button
            onClick={runTestExtraction}
            disabled={bulkExtractDisabled}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            title={bulkExtractDisabled ? "Disabled while rebuilding/syncing or when credits are exhausted." : undefined}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Extract One Test Listing
          </Button>
        )}

        {/* Loading state */}
        {isExtracting && (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            <span className="text-sm text-muted-foreground">Extracting test listing...</span>
          </div>
        )}

        {/* Test result display */}
        {testResult && (
          <div className="space-y-4">
            {/* Status banners */}
            <div className="flex flex-wrap gap-2">
              {testResult.coreComplete ? (
                <Badge className="bg-emerald-600 text-white gap-1">
                  <Check className="w-3 h-3" />
                  Core Complete — Ready for Bulk
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Core Incomplete
                </Badge>
              )}
              {testResult.fullyComplete && (
                <Badge className="bg-amber-500 text-white gap-1">
                  <Award className="w-3 h-3" />
                  Premium Quality
                </Badge>
              )}
            </div>

            {/* Error message */}
            {testResult.error && !testResult.coreComplete && (
              <div className="rounded-lg p-4 bg-red-100 border border-red-300 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800">Extraction Issue</div>
                  <div className="text-sm text-red-700 mt-1">{testResult.error}</div>
                </div>
              </div>
            )}

            {/* Time taken */}
            {testResult.extraction_time_ms && (
              <div className="text-xs text-muted-foreground">
                Completed in {(testResult.extraction_time_ms / 1000).toFixed(1)}s
              </div>
            )}

            {/* ========== TWO-VIEW PREVIEW ========== */}
            {testResult.project && (
              <div className="space-y-4">
                {/* SMALL CARD PREVIEW (Provident style) */}
                <Card className="bg-white border-gold shadow-lg overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Main Image */}
                    <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0 bg-muted">
                      {testResult.project.images.length > 0 ? (
                        <SafeImage
                          src={testResult.project.images[0].url}
                          alt={testResult.project.images[0].alt_text || testResult.project.name}
                          className="w-full h-full object-cover"
                          fallbackSrc="/placeholder.svg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}
                      {testResult.project.status_label && (
                        <div className="absolute top-2 right-2 rounded bg-background/90 text-foreground border border-border px-2 py-1 text-[11px] font-medium">
                          {testResult.project.status_label}
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="flex-1 p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">{testResult.project.name}</h3>
                        {testResult.project.developer_name && (
                          <p className="text-sm text-gold">by {testResult.project.developer_name}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {testResult.project.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {testResult.project.location}
                          </span>
                        )}
                        {testResult.project.bedrooms && (
                          <span className="flex items-center gap-1">
                            <Bed className="w-3.5 h-3.5" />
                            {testResult.project.bedrooms}
                          </span>
                        )}
                      </div>

                      {/* Description truncated with ...more */}
                      {testResult.project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {testResult.project.description.slice(0, 120)}
                          {testResult.project.description.length > 120 && (
                            <Link
                              to={`/listing-admin/preview/${testResult.project.id}`}
                              className="bg-gradient-to-r from-gold via-handover to-gold bg-clip-text text-transparent font-semibold hover:opacity-80 transition-opacity ml-1"
                            >
                              ...more
                            </Link>
                          )}
                        </p>
                      )}

                      {/* Price */}
                      {testResult.project.price_text && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">From </span>
                          <span className="font-semibold text-foreground">{testResult.project.price_text}</span>
                        </div>
                      )}

                      {/* ========== OUTSIDE APPROVE/REJECT BUTTONS ========== */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          onClick={handleApproveFromCard}
                          disabled={isApproving || isApproved}
                          size="sm"
                          className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                          Approve
                        </Button>
                        <Button
                          onClick={rejectTest}
                          variant="outline"
                          size="sm"
                          className="gap-1 border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* CHECKLIST */}
                {testResult.checklist && (
                  <Card className="bg-white border-zinc-200">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm">Extraction Checklist (Provident Mirror Standard)</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Uses Gatsby page-data.json (free) + Firecrawl scraping for comprehensive extraction
                      </p>
                    </CardHeader>
                    <CardContent className="py-2 px-3 space-y-1">
                      <div className="text-xs font-medium text-zinc-500 mb-2">Core Requirements (needed for approval)</div>
                      <ChecklistItem 
                        label="Images (2+ required)" 
                        passed={testResult.checklist.hasImages} 
                        detail={`${testResult.checklist.imageCount} found`}
                      />
                      <ChecklistItem 
                        label="Brochure Document" 
                        passed={testResult.checklist.hasBrochure} 
                        detail={testResult.checklist.hasBrochure ? "✓ Mirrored to storage" : "Not found in page-data or Firecrawl"}
                      />
                      <ChecklistItem 
                        label="Description (>50 chars)" 
                        passed={testResult.checklist.hasDescription} 
                        detail={`${testResult.checklist.descriptionLength} chars`}
                      />
                      <ChecklistItem 
                        label="Developer Name" 
                        passed={testResult.checklist.hasDeveloper}
                        detail={testResult.checklist.hasDeveloper ? testResult.project?.developer_name : "Unknown or missing"}
                      />
                      
                      <div className="text-xs font-medium text-zinc-500 mt-3 mb-2">Extended Fields (from page-data.json + Firecrawl)</div>
                      <ChecklistItem 
                        label="USP Bullets (2+ recommended)" 
                        passed={testResult.checklist.hasUsps} 
                        detail={testResult.checklist.uspCount > 0 ? `${testResult.checklist.uspCount} found` : "Not in page-data or markdown"}
                      />
                      <ChecklistItem 
                        label="Amenities (3+ recommended)" 
                        passed={testResult.checklist.hasAmenities} 
                        detail={testResult.checklist.amenityCount > 0 ? `${testResult.checklist.amenityCount} found` : "Not in page-data or markdown"}
                      />
                      <ChecklistItem 
                        label="FAQs" 
                        passed={testResult.checklist.hasFaqs} 
                        detail={testResult.checklist.faqCount > 0 ? `${testResult.checklist.faqCount} found` : "Not in Useful Information section"}
                      />
                      <ChecklistItem 
                        label="Location Distances" 
                        passed={testResult.checklist.hasDistances} 
                        detail={testResult.checklist.distanceCount > 0 ? `${testResult.checklist.distanceCount} found` : "Not in Location section"}
                      />
                      <ChecklistItem 
                        label="Payment Breakdown" 
                        passed={testResult.checklist.hasPaymentBreakdown}
                        detail={testResult.checklist.hasPaymentBreakdown ? "✓ Parsed" : "Not found in Payment Plans section"}
                      />
                      <ChecklistItem 
                        label="Floor Plans" 
                        passed={testResult.checklist.hasFloorPlans} 
                        detail={testResult.checklist.floorPlanCount > 0 ? `${testResult.checklist.floorPlanCount} types` : "None found"}
                      />
                      <ChecklistItem 
                        label="Location" 
                        passed={testResult.checklist.hasLocation}
                        detail={testResult.checklist.hasLocation ? testResult.project?.location : "Not extracted"}
                      />
                      <ChecklistItem 
                        label="Price" 
                        passed={testResult.checklist.hasPrice}
                        detail={testResult.checklist.hasPrice ? testResult.project?.price_text : "Not found"}
                      />
                      <ChecklistItem 
                        label="Handover Date" 
                        passed={testResult.checklist.hasHandover}
                        detail={testResult.checklist.hasHandover ? testResult.project?.handover_display : "Not extracted"}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* ========== EXTRACTED DATA PREVIEW ========== */}
                {testResult.project && (
                  <Card className="bg-white border-zinc-200">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm">Extracted Data Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3 space-y-4">
                      {/* FAQs */}
                      {testResult.project.faqs && testResult.project.faqs.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-zinc-500 mb-2 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            FAQs ({testResult.project.faqs.length})
                          </div>
                          <ScrollArea className="max-h-48">
                            <div className="space-y-2">
                              {testResult.project.faqs.map((faq, idx) => (
                                <div key={idx} className="bg-zinc-50 rounded p-2 text-xs">
                                  <div className="font-medium text-zinc-800">{faq.question}</div>
                                  <div className="text-zinc-600 mt-1 line-clamp-2">{faq.answer}</div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      {/* Location Distances */}
                      {testResult.project.location_distances && testResult.project.location_distances.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-zinc-500 mb-2 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Location Distances ({testResult.project.location_distances.length})
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {testResult.project.location_distances.map((dist, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-800">
                                {dist.time} – {dist.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* USP Bullets */}
                      {testResult.project.usp_bullets && testResult.project.usp_bullets.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-zinc-500 mb-2 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            USP Bullets ({testResult.project.usp_bullets.length})
                          </div>
                          <ul className="space-y-1">
                            {testResult.project.usp_bullets.slice(0, 5).map((usp, idx) => (
                              <li key={idx} className="text-xs text-zinc-700 flex items-start gap-1">
                                <Check className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                                {usp}
                              </li>
                            ))}
                            {testResult.project.usp_bullets.length > 5 && (
                              <li className="text-xs text-zinc-500">+{testResult.project.usp_bullets.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Amenities */}
                      {testResult.project.amenities_list && testResult.project.amenities_list.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-zinc-500 mb-2 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            Amenities ({testResult.project.amenities_list.length})
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {testResult.project.amenities_list.slice(0, 10).map((amenity, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-green-50 border-green-200 text-green-800">
                                {amenity}
                              </Badge>
                            ))}
                            {testResult.project.amenities_list.length > 10 && (
                              <Badge variant="outline" className="text-xs bg-zinc-100 border-zinc-200 text-zinc-600">
                                +{testResult.project.amenities_list.length - 10} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Payment Breakdown */}
                      {testResult.project.payment_breakdown && 
                       (testResult.project.payment_breakdown.down_payment || 
                        testResult.project.payment_breakdown.during_construction || 
                        testResult.project.payment_breakdown.on_completion) && (
                        <div>
                          <div className="text-xs font-medium text-zinc-500 mb-2 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Payment Breakdown
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {testResult.project.payment_breakdown.down_payment && (
                              <Badge className="text-xs bg-gold/10 text-gold border border-gold/30">
                                {testResult.project.payment_breakdown.down_payment} Down Payment
                              </Badge>
                            )}
                            {testResult.project.payment_breakdown.during_construction && (
                              <Badge className="text-xs bg-gold/10 text-gold border border-gold/30">
                                {testResult.project.payment_breakdown.during_construction} During Construction
                              </Badge>
                            )}
                            {testResult.project.payment_breakdown.on_completion && (
                              <Badge className="text-xs bg-gold/10 text-gold border border-gold/30">
                                {testResult.project.payment_breakdown.on_completion} On Completion
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Empty state for extended fields */}
                      {(!testResult.project.faqs || testResult.project.faqs.length === 0) &&
                       (!testResult.project.location_distances || testResult.project.location_distances.length === 0) &&
                       (!testResult.project.usp_bullets || testResult.project.usp_bullets.length === 0) &&
                       (!testResult.project.amenities_list || testResult.project.amenities_list.length === 0) && (
                        <div className="text-center py-4 text-zinc-400 text-sm">
                          <AlertTriangle className="w-5 h-5 mx-auto mb-2" />
                          No extended data extracted (FAQs, Distances, USPs, Amenities)
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* IMAGE GALLERY PREVIEW */}
                {testResult.project.images.length > 0 && (
                  <Card className="bg-white border-zinc-200">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>Image Gallery Preview</span>
                        <Badge variant="outline" className="text-xs">
                          {testResult.project.images.length} images
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <div className="grid grid-cols-4 gap-1">
                        {testResult.project.images.slice(0, 8).map((img, idx) => (
                          <div key={idx} className="aspect-video bg-zinc-100 rounded overflow-hidden">
                            <SafeImage
                              src={img.url}
                              alt={img.alt_text || `Image ${idx + 1}`}
                              className="w-full h-full object-cover"
                              fallbackSrc="/placeholder.svg"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* SOURCE URL */}
                <Card className="bg-white border-zinc-200">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>Source URL</span>
                      <a
                        href={testResult.project.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </a>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3">
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <div className="text-xs font-mono break-all text-zinc-600">
                        {testResult.project.source_url}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Gate approval buttons (for bulk unlock, separate from item approval) */}
            {!isApproved && testResult.coreComplete && (
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={approveTestGate}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve & Enable Bulk Extraction
                </Button>
                <Button
                  onClick={rejectTest}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject & Try Again
                </Button>
              </div>
            )}

            {isApproved && (
              <div className="rounded-lg bg-emerald-100 border border-emerald-300 p-4 flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="font-medium text-emerald-800">Test Approved!</div>
                  <div className="text-sm text-emerald-700">
                    Bulk extraction is now enabled. Go to the "Full Sync" tab and click "Start Bulk Extract".
                  </div>
                </div>
              </div>
            )}

            {/* Retry button */}
            {!isApproved && (
              <Button
                onClick={runTestExtraction}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Another Test
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
