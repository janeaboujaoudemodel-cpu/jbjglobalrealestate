import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Download, CheckCircle, XCircle, AlertCircle, ArrowLeft, ExternalLink, Key, Info } from "lucide-react";
import { Link } from "react-router-dom";

interface ImportResult {
  name: string;
  slug: string;
  action: "created" | "updated";
  id: string;
}

interface ImportError {
  url: string;
  error: string;
}

interface ImportSummary {
  processed: number;
  created: number;
  updated: number;
  failed: number;
}

const TARGET_PROJECTS = [
  "Divine Elements",
  "The Meriva Collection",
  "Al Hasin Residence Six",
  "Confident Preston",
];

const ReellyImportTest = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [authStatus, setAuthStatus] = useState<"unknown" | "success" | "failed">("unknown");
  const [discoveredLinks, setDiscoveredLinks] = useState<string[]>([]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [showApiInfo, setShowApiInfo] = useState(true);

  const handleTestAuth = async () => {
    setIsAuthenticating(true);
    setAuthStatus("unknown");

    try {
      const { data, error } = await supabase.functions.invoke("reelly-scrape", {
        body: { action: "authenticate" },
      });

      if (error) throw error;

      if (data?.success) {
        setAuthStatus("success");
        toast.success("Reelly authentication successful!");
      } else {
        setAuthStatus("failed");
        toast.error("Reelly authentication failed. Check credentials.");
      }
    } catch (err) {
      console.error("Auth test error:", err);
      setAuthStatus("failed");
      toast.error("Failed to test authentication");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDiscover = async () => {
    setIsDiscovering(true);
    setDiscoveredLinks([]);

    try {
      const { data, error } = await supabase.functions.invoke("reelly-scrape", {
        body: { action: "discover" },
      });

      if (error) throw error;

      if (data?.projectLinks) {
        setDiscoveredLinks(data.projectLinks);
        toast.success(`Found ${data.projectLinks.length} project links`);
      } else {
        toast.warning("No project links discovered");
      }
    } catch (err) {
      console.error("Discovery error:", err);
      toast.error("Failed to discover projects");
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportResults([]);
    setImportErrors([]);
    setImportSummary(null);

    try {
      const { data, error } = await supabase.functions.invoke("reelly-scrape", {
        body: { action: "import", projectIds: discoveredLinks.length > 0 ? discoveredLinks : [] },
      });

      if (error) throw error;

      if (data?.results) {
        setImportResults(data.results);
      }
      if (data?.errors) {
        setImportErrors(data.errors);
      }
      if (data?.summary) {
        setImportSummary(data.summary);
        toast.success(`Import complete: ${data.summary.created} created, ${data.summary.updated} updated`);
      }
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link to="/listing-admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Listing Admin
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Reelly Import Test</h1>
          <p className="text-muted-foreground">
            Phase 1: Import 4 test projects from Reelly platform
          </p>
        </div>

        {/* Scraping Info */}
        <Alert className="mb-6 border-primary/50 bg-primary/5">
          <Info className="h-4 w-4" />
          <AlertTitle>Web Scraping Mode</AlertTitle>
          <AlertDescription>
            Using Firecrawl to scrape project data directly from Reelly. 
            This extracts project details, images, and documents from each listing page.
          </AlertDescription>
        </Alert>

        {/* Target Projects */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Target Projects</CardTitle>
            <CardDescription>These 4 projects will be imported for testing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {TARGET_PROJECTS.map((project) => (
                <Badge key={project} variant="outline" className="text-sm">
                  {project}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Authentication */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Step 1: Test Authentication
              {authStatus === "success" && <CheckCircle className="h-5 w-5 text-primary" />}
              {authStatus === "failed" && <XCircle className="h-5 w-5 text-destructive" />}
            </CardTitle>
            <CardDescription>
              Verify that Reelly credentials are working correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleTestAuth} 
              disabled={isAuthenticating}
              variant={authStatus === "success" ? "outline" : "default"}
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Authentication"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Discover Projects */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Step 2: Discover Projects</CardTitle>
            <CardDescription>
              Scan Reelly to find available project URLs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleDiscover} 
              disabled={isDiscovering}
              variant="outline"
            >
              {isDiscovering ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Discovering...
                </>
              ) : (
                "Discover Projects"
              )}
            </Button>

            {discoveredLinks.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Found {discoveredLinks.length} project links:
                </p>
                <div className="max-h-40 overflow-y-auto bg-muted/50 rounded-lg p-3">
                  {discoveredLinks.map((link, i) => (
                    <p key={i} className="text-xs text-muted-foreground truncate">
                      {link}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Import */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Step 3: Import Projects
              {importSummary && importSummary.failed === 0 && (
                <CheckCircle className="h-5 w-5 text-primary" />
              )}
              {importSummary && importSummary.failed > 0 && (
                <AlertCircle className="h-5 w-5 text-accent" />
              )}
            </CardTitle>
            <CardDescription>
              Import the 4 target projects into the database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleImport} 
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import 4 Test Projects
                </>
              )}
            </Button>

            {isImporting && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}

            {importSummary && (
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{importSummary.processed}</p>
                  <p className="text-xs text-muted-foreground">Processed</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{importSummary.created}</p>
                  <p className="text-xs text-muted-foreground">Created</p>
                </div>
                <div className="bg-secondary/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-secondary-foreground">{importSummary.updated}</p>
                  <p className="text-xs text-muted-foreground">Updated</p>
                </div>
                <div className="bg-destructive/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-destructive">{importSummary.failed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
            )}

            {importResults.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-foreground mb-2">Imported Projects:</p>
                <div className="space-y-2">
                  {importResults.map((result, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium text-foreground">{result.name}</p>
                        <p className="text-xs text-muted-foreground">/project/{result.slug}</p>
                      </div>
                      <Badge variant={result.action === "created" ? "default" : "secondary"}>
                        {result.action}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-destructive mb-2">Errors:</p>
                <div className="space-y-2">
                  {importErrors.map((error, i) => (
                    <div 
                      key={i} 
                      className="bg-destructive/10 rounded-lg p-3"
                    >
                      <p className="text-xs text-muted-foreground truncate">{error.url}</p>
                      <p className="text-sm text-destructive">{error.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        {importResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link to="/properties">
                <Button variant="outline" size="sm">View Properties</Button>
              </Link>
              <Link to="/listing-admin">
                <Button variant="outline" size="sm">Listing Admin</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReellyImportTest;
