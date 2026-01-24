import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  FlaskConical, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Image, 
  FileText,
  AlertTriangle,
  Sparkles,
  Download,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface TestResult {
  success: boolean;
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
  onTestPassed: () => void;
}

export function SarahTestPanel({ onTestPassed }: SarahTestPanelProps) {
  const [testUrl, setTestUrl] = useState("https://providentestate.com/new-projects/damac-sun-city/");
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const runTest = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("sarah-test-extraction", {
        body: { testUrl }
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
      
      if (data.success) {
        toast.success("✅ Test PASSED! Sarah is ready for full extraction.");
      } else {
        toast.error("❌ Test FAILED. Review errors below.");
      }
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
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "N/A";
    return `AED ${price.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Test Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <FlaskConical className="w-5 h-5" />
            Sarah Extraction Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-purple-700 mb-4">
            Test Sarah's extraction on ONE project first. She will extract all data including
            high-quality images, brochures, floor plans, and payment plans. Only approve her
            for full extraction if this test passes 100%.
          </p>
          
          <div className="flex gap-2">
            <Input
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="Enter project URL to test..."
              className="flex-1 bg-white"
            />
            <Button
              onClick={runTest}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4 mr-2" />
                  Run Test
                </>
              )}
            </Button>
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
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                  <div>
                    <h3 className={`font-bold text-lg ${testResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                      {testResult.success ? "✅ Test PASSED" : "❌ Test FAILED"}
                    </h3>
                    <p className={`text-sm ${testResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                      {testResult.success 
                        ? "Sarah is ready for full extraction!"
                        : "Fix the issues below before proceeding"}
                    </p>
                  </div>
                </div>
                
                <div className="text-right text-sm">
                  <div className="text-zinc-600">API Calls: {testResult.apiCallsMade}</div>
                  <div className="text-zinc-600">Cost: {testResult.totalApiCost}</div>
                  {testResult.duration_ms && (
                    <div className="text-zinc-600">Time: {(testResult.duration_ms / 1000).toFixed(1)}s</div>
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
                  <Sparkles className="w-5 h-5 text-gold" />
                  Extracted Project Data
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                  <Image className="w-5 h-5 text-purple-600" />
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
                          className="w-32 h-24 object-cover rounded-lg border border-zinc-200 hover:border-gold transition-colors"
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
                <FileText className="w-5 h-5 text-gold" />
                Extracted Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${testResult.documents.brochure ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.documents.brochure ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
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
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
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
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
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

          {/* Approve Button */}
          {testResult.success && (
            <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300">
              <CardContent className="py-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-emerald-800 mb-2">
                  Sarah Passed All Tests!
                </h3>
                <p className="text-emerald-700 mb-4">
                  Extraction is working perfectly. You can now approve Sarah to extract all 1,324 listings.
                </p>
                <Button
                  onClick={onTestPassed}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Approve Sarah for Full Extraction
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
