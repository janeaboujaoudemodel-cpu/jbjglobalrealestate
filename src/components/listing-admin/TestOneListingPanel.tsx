import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SafeImage } from "@/components/SafeImage";
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
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TestResult {
  success: boolean;
  project?: {
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
    images?: string[];
    documents?: {
      type: string;
      url: string;
      mirrored_url?: string;
    }[];
    usps?: string[];
    amenities?: string[];
  };
  error?: string;
  extraction_time_ms?: number;
}

interface TestOneListingPanelProps {
  onApproved: () => void;
  bulkExtractDisabled: boolean;
}

export function TestOneListingPanel({ onApproved, bulkExtractDisabled }: TestOneListingPanelProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  const runTestExtraction = async () => {
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
            error: "No pending items in queue. Run 'Rebuild Queue' first to discover listings.",
          });
          return;
        }
      }

      const targetItem = pendingItems?.[0] || null;
      
      if (!targetItem) {
        setTestResult({
          success: false,
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

      if (error) {
        // Check for credits exhausted
        if (data?.credits_exhausted) {
          setTestResult({
            success: false,
            error: "Firecrawl credits exhausted. Please top up your plan.",
          });
          return;
        }
        throw error;
      }

      // Fetch the updated project data
      const { data: updatedProject, error: projectError } = await supabase
        .from("pending_project_imports")
        .select("*")
        .eq("id", targetItem.id)
        .single();

      if (projectError) throw projectError;

      // Parse extracted data
      const images = (() => {
        try {
          const parsed = typeof updatedProject.images === "string" 
            ? JSON.parse(updatedProject.images) 
            : updatedProject.images;
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })();

      const documents = (() => {
        try {
          const parsed = typeof updatedProject.documents === "string"
            ? JSON.parse(updatedProject.documents)
            : updatedProject.documents;
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })();

      const uspBullets = (() => {
        try {
          const parsed = typeof updatedProject.usp_bullets === "string"
            ? JSON.parse(updatedProject.usp_bullets as string)
            : updatedProject.usp_bullets;
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })();

      const amenities = (() => {
        try {
          const parsed = typeof updatedProject.amenities === "string"
            ? JSON.parse(updatedProject.amenities as string)
            : updatedProject.amenities;
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })();

      // Validate extraction quality
      const hasImages = images.length >= 2;
      const hasDocs = documents.length >= 1;
      const hasDescription = updatedProject.description && updatedProject.description.length > 50;
      const hasDeveloper = updatedProject.developer_name && updatedProject.developer_name.toLowerCase() !== "unknown";

      const isComplete = hasImages && hasDocs && hasDescription && hasDeveloper;

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
        ? `From AED ${Number(updatedProject.price_from).toLocaleString()}`
        : null;

      // Build handover display from date
      const handoverDisplay = updatedProject.handover_date
        ? new Date(updatedProject.handover_date).toLocaleDateString("en-US", { year: "numeric", month: "short" })
        : null;

      setTestResult({
        success: isComplete,
        project: {
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
          usps: uspBullets,
          amenities,
        },
        extraction_time_ms,
        error: isComplete 
          ? undefined 
          : `Extraction incomplete: ${!hasImages ? 'Missing images. ' : ''}${!hasDocs ? 'Missing documents. ' : ''}${!hasDescription ? 'Missing description. ' : ''}${!hasDeveloper ? 'Missing developer. ' : ''}`,
      });

      if (isComplete) {
        toast.success("Test extraction successful! Review the result below.");
      } else {
        toast.warning("Extraction completed but data is incomplete. See details below.");
      }

    } catch (e: any) {
      console.error("Test extraction failed:", e);
      setTestResult({
        success: false,
        error: e?.message || "Failed to run test extraction",
      });
      toast.error(e?.message || "Test extraction failed");
    } finally {
      setIsExtracting(false);
    }
  };

  const approveTest = () => {
    setIsApproved(true);
    toast.success("Test approved! You can now run bulk extraction.");
    onApproved();
  };

  const rejectTest = () => {
    setTestResult(null);
    setIsApproved(false);
    toast.info("Test rejected. Fix the extraction logic and try again.");
  };

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
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
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
            {/* Status banner */}
            <div className={`rounded-lg p-4 flex items-start gap-3 ${
              testResult.success 
                ? "bg-emerald-100 border border-emerald-300" 
                : "bg-red-100 border border-red-300"
            }`}>
              {testResult.success ? (
                <Check className="w-5 h-5 text-emerald-600 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <div className={`font-medium ${testResult.success ? "text-emerald-800" : "text-red-800"}`}>
                  {testResult.success ? "Extraction Successful" : "Extraction Failed/Incomplete"}
                </div>
                {testResult.error && (
                  <div className="text-sm text-red-700 mt-1">{testResult.error}</div>
                )}
                {testResult.extraction_time_ms && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Completed in {(testResult.extraction_time_ms / 1000).toFixed(1)}s
                  </div>
                )}
              </div>
            </div>

            {/* Project preview */}
            {testResult.project && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Extracted data card */}
                <Card className="bg-white border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>Extracted Data</span>
                      <Badge variant="outline" className="text-xs">
                        {testResult.project.images?.length || 0} images
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Image gallery preview */}
                    {testResult.project.images && testResult.project.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-1">
                        {testResult.project.images.slice(0, 6).map((url, idx) => (
                          <div key={idx} className="aspect-video bg-zinc-100 rounded overflow-hidden">
                            <SafeImage
                              src={url}
                              alt={`Image ${idx + 1}`}
                              className="w-full h-full object-cover"
                              fallbackSrc="/placeholder.svg"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-lg">{testResult.project.name}</div>
                      
                      {testResult.project.developer_name && (
                        <div className="flex items-center gap-2 text-zinc-600">
                          <Building2 className="w-4 h-4" />
                          <span>{testResult.project.developer_name}</span>
                        </div>
                      )}
                      
                      {testResult.project.location && (
                        <div className="flex items-center gap-2 text-zinc-600">
                          <MapPin className="w-4 h-4" />
                          <span>{testResult.project.location}</span>
                        </div>
                      )}
                      
                      {testResult.project.price_text && (
                        <div className="flex items-center gap-2 text-zinc-600">
                          <DollarSign className="w-4 h-4" />
                          <span>{testResult.project.price_text}</span>
                        </div>
                      )}
                      
                      {testResult.project.bedrooms && (
                        <div className="flex items-center gap-2 text-zinc-600">
                          <Bed className="w-4 h-4" />
                          <span>{testResult.project.bedrooms}</span>
                        </div>
                      )}
                      
                      {testResult.project.handover_display && (
                        <div className="flex items-center gap-2 text-zinc-600">
                          <Calendar className="w-4 h-4" />
                          <span>{testResult.project.handover_display}</span>
                        </div>
                      )}
                    </div>

                    {/* Documents */}
                    {testResult.project.documents && testResult.project.documents.length > 0 && (
                      <div className="border-t pt-2">
                        <div className="text-xs font-medium text-zinc-500 mb-1">Documents</div>
                        <div className="flex flex-wrap gap-1">
                          {testResult.project.documents.map((doc, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {doc.type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description preview */}
                    {testResult.project.description && (
                      <div className="border-t pt-2">
                        <div className="text-xs font-medium text-zinc-500 mb-1">Description</div>
                        <p className="text-xs text-zinc-600 line-clamp-4">
                          {testResult.project.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Source URL card */}
                <Card className="bg-white border-zinc-200">
                  <CardHeader className="pb-2">
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
                  <CardContent>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <div className="text-xs font-mono break-all text-zinc-600">
                        {testResult.project.source_url}
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      <p className="mb-2">
                        <strong>Compare the extracted data above with the source page.</strong>
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Do all images load correctly?</li>
                        <li>Is the developer name accurate?</li>
                        <li>Are documents (brochure, floor plans) present?</li>
                        <li>Is the description complete?</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Approval buttons */}
            {!isApproved && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={approveTest}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!testResult.success}
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
