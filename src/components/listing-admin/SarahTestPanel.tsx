import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  FlaskConical, 
  Check, 
  XCircle, 
  Loader2, 
  Image, 
  FileText,
  AlertTriangle,
  Sparkles,
  Download,
  ExternalLink
} from "lucide-react";

// Filled check circle component for better visibility
const FilledCheckCircle = ({ className }: { className?: string }) => (
  <div className={`rounded-full bg-emerald-600 flex items-center justify-center ${className}`}>
    <Check className="w-3 h-3 text-white" />
  </div>
);
import { toast } from "sonner";

interface TestResult {
  success: boolean;
  queued?: boolean;
  queued_import_id?: string | null;
  queued_message?: string | null;
  project?: {
    name: string;
    developer: string;
    location: string;
    status: string;
    price_from: number | null;
    bedrooms_min: number | null;
    bedrooms_max: number | null;
    handover_date: string | null;
    property_type: string | null;
    status_label: string | null;
    description: string | null;
  };
  images: string[];
  documents: {
    brochure: string | null;
    floorPlans: string[];
    paymentPlan: string | null;
  };
  validationErrors: string[];
  apiCallsMade: number;
  totalApiCost: string;
  duration_ms?: number;
  message?: string;
  error?: string;
}

interface SarahTestPanelProps {
  /** Runs the real pipeline test (Page 1) and writes into the approval queue. */
  onRunPageOneTest?: () => void;
  /** Optional helper to switch UI to the Full Sync tab. */
  onGoToFullSync?: () => void;
  /** Optional helper to switch UI to the Projects/Approvals tab after queuing. */
  onGoToApprovals?: () => void;
}

export const SarahTestPanel = ({ onRunPageOneTest, onGoToFullSync, onGoToApprovals }: SarahTestPanelProps) => {
  const [testUrl, setTestUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const runTest = async (retrying = false) => {
    setIsLoading(true);
    if (!retrying) {
      setTestResult(null);
    }

    try {
      const { data, error } = await supabase.functions.invoke("sarah-test-extraction", {
        // This should behave like a REAL extraction: queue 1 listing for approval.
        body: { testUrl, queue: true, force: true }
      });

      if (error) {
        toast.error("Test failed: " + error.message);
        setTestResult({
          success: false,
          images: [],
          documents: { brochure: null, floorPlans: [], paymentPlan: null },
          validationErrors: [error.message],
          apiCallsMade: 0,
          totalApiCost: "$0",
          error: error.message
        });
        return;
      }

      setTestResult(data);

      if (data?.queued) {
        toast.success("Queued for approval — review it in Projects.");
        onGoToApprovals?.();
      } else {
        toast.info("Extraction completed — please review the results below.");
      }
      if (data.success) setRetryCount(0);
      else setRetryCount(prev => prev + 1);
    } catch (err: any) {
      toast.error("Test error: " + err.message);
      setTestResult({
        success: false,
        images: [],
        documents: { brochure: null, floorPlans: [], paymentPlan: null },
        validationErrors: [err.message],
        apiCallsMade: 0,
        totalApiCost: "$0",
        error: err.message
      });
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    runTest(true);
  };

  const suggestedUrls = [
    "https://providentestate.com/new-projects/sobha-seahaven/",
    "https://providentestate.com/new-projects/emaar-the-oasis/",
    "https://providentestate.com/new-projects/damac-lagoons/",
    "https://providentestate.com/new-projects/sobha-hartland-ii/",
  ];

  const formatPrice = (price: number | null) => {
    if (!price) return "N/A";
    return `AED ${price.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Test Header */}
      <Card className="bg-zinc-50 border-zinc-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-zinc-800">
            <FlaskConical className="w-5 h-5" />
            Sarah Extraction Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 mb-4">
            Paste a single Provident project link. Sarah will extract the full listing (images + PDFs) and queue it for your approval.
          </p>
          
          <div className="flex flex-col md:flex-row gap-2 mb-3">
            <Input
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="Enter project URL to test..."
              className="flex-1 bg-white"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => runTest()}
                disabled={isLoading}
                className="bg-zinc-900 hover:bg-zinc-800 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <FlaskConical className="w-4 h-4 mr-2" />
                    Run & Queue (1 listing)
                  </>
                )}
              </Button>

              {onRunPageOneTest && (
                <Button
                  onClick={() => {
                    onGoToFullSync?.();
                    onRunPageOneTest();
                  }}
                  disabled={isLoading}
                  variant="outline"
                >
                  Test Page 1 Only
                </Button>
              )}
            </div>
          </div>
          
          {/* Suggested URLs */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-zinc-500">Quick test:</span>
            {suggestedUrls.map((url, i) => {
              const name = url.split('/').filter(Boolean).pop()?.replace(/-/g, ' ');
              return (
                <button
                  key={i}
                  onClick={() => setTestUrl(url)}
                  className="text-xs px-2 py-0.5 rounded bg-zinc-200 hover:bg-zinc-300 text-zinc-700 capitalize"
                >
                  {name}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Test Result */}
      {testResult && (
        <div className="space-y-4">
          {/* Status Banner */}
          <Card className={`${testResult.success ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {testResult.success ? (
                    <FilledCheckCircle className="w-8 h-8" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                  <div>
                    <h3 className={`font-bold text-lg ${testResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                      {testResult.success ? "Extraction completed" : "Extraction needs review"}
                    </h3>
                    <p className={`text-sm ${testResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                      {testResult.success 
                        ? "Review the extracted fields and images below."
                        : "Review issues below (missing/incorrect fields, image problems, etc.)."}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="text-zinc-600">API Calls: {testResult.apiCallsMade}</div>
                    <div className="text-zinc-600">Cost: {testResult.totalApiCost}</div>
                    {testResult.duration_ms && (
                      <div className="text-zinc-600">Time: {(testResult.duration_ms / 1000).toFixed(1)}s</div>
                    )}
                  </div>
                  
                  {!testResult.success && (
                    <Button
                      onClick={handleRetry}
                      disabled={isLoading}
                      variant="outline"
                      className="border-red-400 text-red-700 hover:bg-red-100"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>Retry Test</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Errors */}
          {testResult.validationErrors.length > 0 && (
            <Card className="border-amber-300 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-amber-800 text-base">
                  <AlertTriangle className="w-5 h-5" />
                  Validation Issues ({testResult.validationErrors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {testResult.validationErrors.map((error, i) => (
                    <li key={i} className="flex items-center gap-2 text-amber-700 text-sm">
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Extracted Project Data */}
          {testResult.project && (
            <Card className="border-zinc-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-zinc-800 text-base">
                  <Sparkles className="w-5 h-5 text-zinc-600" />
                  Extracted Project Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-zinc-500">Provenance (source)</span>
                  <a
                    href={testUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-700 hover:underline"
                  >
                    Open source page
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-zinc-500 uppercase">Name</div>
                    <div className="font-medium">{testResult.project.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase">Developer</div>
                    <div className="font-medium">{testResult.project.developer}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase">Location</div>
                    <div className="font-medium">{testResult.project.location}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase">Price From</div>
                    <div className="font-medium text-emerald-600">{formatPrice(testResult.project.price_from)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase">Bedrooms</div>
                    <div className="font-medium">
                      {testResult.project.bedrooms_min 
                        ? `${testResult.project.bedrooms_min}${testResult.project.bedrooms_max && testResult.project.bedrooms_max !== testResult.project.bedrooms_min ? `-${testResult.project.bedrooms_max}` : ''} BR`
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase">Handover</div>
                    <div className="font-medium">{testResult.project.handover_date || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase">Status</div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {testResult.project.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase">Label</div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      {testResult.project.status_label || 'None'}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase">Property Type</div>
                    <div className="font-medium">{testResult.project.property_type || 'N/A'}</div>
                  </div>
                </div>
                
                {testResult.project.description && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-zinc-500 uppercase mb-1">Description</div>
                    <p className="text-sm text-zinc-700 line-clamp-3">
                      {testResult.project.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Extracted Images */}
          {testResult.images.length > 0 && (
            <Card className="border-zinc-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-zinc-800 text-base">
                  <Image className="w-5 h-5 text-zinc-600" />
                  Extracted Images ({testResult.images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full">
                  <div className="flex gap-3 pb-2">
                    {testResult.images.slice(0, 10).map((url, i) => (
                      <a 
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative flex-shrink-0 group"
                      >
                        <img
                          src={url}
                          alt={`Project image ${i + 1}`}
                          className="w-32 h-24 object-cover rounded-lg border border-zinc-200 hover:border-zinc-400 transition-colors"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-white" />
                        </div>
                      </a>
                    ))}
                    {testResult.images.length > 10 && (
                      <div className="flex-shrink-0 w-32 h-24 rounded-lg border border-dashed border-zinc-300 flex items-center justify-center bg-zinc-50">
                        <span className="text-sm text-zinc-500">+{testResult.images.length - 10} more</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Extracted Documents */}
          <Card className="border-zinc-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-zinc-800 text-base">
                <FileText className="w-5 h-5 text-zinc-600" />
                Extracted Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${testResult.documents.brochure ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.documents.brochure ? (
                      <FilledCheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-zinc-400" />
                    )}
                    <span className="font-medium">Brochure</span>
                  </div>
                  {testResult.documents.brochure && (
                    <a
                      href={testResult.documents.brochure}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </a>
                  )}
                </div>

                <div className={`p-4 rounded-lg border ${testResult.documents.paymentPlan ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.documents.paymentPlan ? (
                      <FilledCheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-zinc-400" />
                    )}
                    <span className="font-medium">Payment Plan</span>
                  </div>
                  {testResult.documents.paymentPlan && (
                    <a
                      href={testResult.documents.paymentPlan}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </a>
                  )}
                </div>

                <div className={`p-4 rounded-lg border ${testResult.documents.floorPlans.length > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.documents.floorPlans.length > 0 ? (
                      <FilledCheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-zinc-400" />
                    )}
                    <span className="font-medium">Floor Plans ({testResult.documents.floorPlans.length})</span>
                  </div>
                  {testResult.documents.floorPlans.length > 0 && (
                    <div className="space-y-1">
                      {testResult.documents.floorPlans.slice(0, 2).map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline block"
                        >
                          <Download className="w-4 h-4" />
                          Floor Plan {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next step helper */}
          {(onRunPageOneTest || onGoToFullSync) && (
            <Card className="border-zinc-200 bg-white">
              <CardContent className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="text-sm text-zinc-700">
                  Next step: run <strong>Test Page 1 Only</strong> to write real extracted projects into the approval queue.
                </div>
                <div className="flex gap-2">
                  {onGoToFullSync && (
                    <Button onClick={onGoToFullSync} variant="outline">
                      Open Full Sync
                    </Button>
                  )}
                  {onRunPageOneTest && (
                    <Button
                      onClick={() => {
                        onGoToFullSync?.();
                        onRunPageOneTest();
                      }}
                      variant="outline"
                    >
                      Test Page 1 Only
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
