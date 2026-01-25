import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Check, 
  X, 
  RefreshCw, 
  Download, 
  ExternalLink,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Merge
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PendingDeveloper {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  feature_image_url: string | null;
  logo_url: string | null;
  provident_link: string | null;
  source: string;
  status: string;
  matched_developer_id: string | null;
  admin_notes: string | null;
  extracted_at: string;
}

interface ExistingDeveloper {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export const DeveloperApprovalQueue = () => {
  const { user } = useAuth();
  const [pendingDevelopers, setPendingDevelopers] = useState<PendingDeveloper[]>([]);
  const [existingDevelopers, setExistingDevelopers] = useState<ExistingDeveloper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Record<string, string>>({});
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchPendingDevelopers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("pending_developer_imports")
        .select("*")
        .eq("status", "pending")
        .order("extracted_at", { ascending: false });

      if (error) throw error;
      setPendingDevelopers((data as PendingDeveloper[]) || []);
    } catch (error) {
      console.error("Error fetching pending developers:", error);
      toast.error("Failed to fetch pending developers");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExistingDevelopers = async () => {
    try {
      const { data, error } = await supabase
        .from("developers")
        .select("id, name, slug, logo_url")
        .order("name");

      if (error) throw error;
      setExistingDevelopers(data || []);
    } catch (error) {
      console.error("Error fetching existing developers:", error);
    }
  };

  useEffect(() => {
    fetchPendingDevelopers();
    fetchExistingDevelopers();
  }, []);

  const triggerExtraction = async () => {
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-developers-provident");
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(`Extracted ${data.count} developers from Provident`);
        fetchPendingDevelopers();
      } else {
        throw new Error(data?.error || "Extraction failed");
      }
    } catch (error) {
      console.error("Extraction error:", error);
      toast.error(`Extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const approveDeveloper = async (developer: PendingDeveloper) => {
    setProcessingIds(prev => new Set(prev).add(developer.id));
    try {
      // Create new developer in main table
      const { data: newDev, error: createError } = await supabase
        .from("developers")
        .insert({
          name: developer.name,
          slug: developer.slug,
          description: developer.description,
          logo_url: developer.logo_url,
          feature_image_url: developer.feature_image_url,
          headquarters: "Dubai, UAE",
          rank: 20,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Update pending import status
      await supabase
        .from("pending_developer_imports")
        .update({
          status: "approved",
          matched_developer_id: newDev.id,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          admin_notes: selectedNotes[developer.id] || null,
        })
        .eq("id", developer.id);

      toast.success(`Approved: ${developer.name}`);
      fetchPendingDevelopers();
      fetchExistingDevelopers();
    } catch (error) {
      console.error("Approval error:", error);
      toast.error(`Failed to approve: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(developer.id);
        return next;
      });
    }
  };

  const mergeDeveloper = async (developer: PendingDeveloper, existingId: string) => {
    setProcessingIds(prev => new Set(prev).add(developer.id));
    try {
      // Update existing developer with new data
      const updateData: Record<string, unknown> = {};
      if (developer.description) updateData.description = developer.description;
      if (developer.logo_url) updateData.logo_url = developer.logo_url;
      if (developer.feature_image_url) updateData.feature_image_url = developer.feature_image_url;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from("developers")
          .update(updateData)
          .eq("id", existingId);

        if (updateError) throw updateError;
      }

      // Update pending import status
      await supabase
        .from("pending_developer_imports")
        .update({
          status: "merged",
          matched_developer_id: existingId,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          admin_notes: selectedNotes[developer.id] || "Merged with existing developer",
        })
        .eq("id", developer.id);

      toast.success(`Merged: ${developer.name}`);
      fetchPendingDevelopers();
      fetchExistingDevelopers();
    } catch (error) {
      console.error("Merge error:", error);
      toast.error(`Failed to merge: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(developer.id);
        return next;
      });
    }
  };

  const rejectDeveloper = async (developer: PendingDeveloper) => {
    setProcessingIds(prev => new Set(prev).add(developer.id));
    try {
      await supabase
        .from("pending_developer_imports")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          admin_notes: selectedNotes[developer.id] || "Rejected by admin",
        })
        .eq("id", developer.id);

      toast.success(`Rejected: ${developer.name}`);
      fetchPendingDevelopers();
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error(`Failed to reject: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(developer.id);
        return next;
      });
    }
  };

  const findMatchingDeveloper = (slug: string): ExistingDeveloper | undefined => {
    return existingDevelopers.find(d => 
      d.slug.toLowerCase() === slug.toLowerCase() ||
      d.name.toLowerCase().includes(slug.replace(/-/g, ' ').toLowerCase())
    );
  };

  return (
    <Card className="bg-zinc-900 border-gold/30">
      <CardHeader className="border-b border-gold/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gold" />
            <CardTitle className="text-white">Developer Approval Queue</CardTitle>
            <Badge variant="outline" className="border-gold/50 text-gold">
              {pendingDevelopers.length} Pending
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPendingDevelopers}
              disabled={isLoading}
              className="border-gold/50 text-gold hover:bg-gold/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={triggerExtraction}
              disabled={isExtracting}
              className="bg-gold text-black hover:bg-gold/90"
            >
              {isExtracting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Extract from Provident
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : pendingDevelopers.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500/50" />
            <p>No pending developers to review</p>
            <p className="text-sm mt-2">Click "Extract from Provident" to fetch new developers</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingDevelopers.map((developer) => {
              const existingMatch = findMatchingDeveloper(developer.slug);
              const isProcessing = processingIds.has(developer.id);

              return (
                <div
                  key={developer.id}
                  className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden"
                >
                  <div className="flex">
                    {/* Image Preview */}
                    <div className="w-48 h-36 flex-shrink-0 relative bg-zinc-900">
                      {developer.feature_image_url ? (
                        <img
                          src={developer.feature_image_url}
                          alt={developer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Building2 className="w-8 h-8" />
                        </div>
                      )}
                      {/* Logo overlay */}
                      {developer.logo_url && (
                        <div className="absolute bottom-2 right-2 bg-white/90 rounded-lg p-1">
                          <img
                            src={developer.logo_url}
                            alt={`${developer.name} logo`}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-semibold text-lg">{developer.name}</h3>
                          <p className="text-zinc-500 text-sm">/{developer.slug}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {existingMatch && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Match Found
                            </Badge>
                          )}
                          {developer.provident_link && (
                            <a
                              href={developer.provident_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gold hover:text-gold/80"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>

                      <p className="text-zinc-400 text-sm line-clamp-2 mb-3">
                        {developer.description || "No description available"}
                      </p>

                      {/* Admin Notes */}
                      <Textarea
                        placeholder="Admin notes (optional)"
                        value={selectedNotes[developer.id] || ""}
                        onChange={(e) => setSelectedNotes(prev => ({ ...prev, [developer.id]: e.target.value }))}
                        className="bg-zinc-900 border-zinc-700 text-white text-sm h-16 mb-3"
                      />

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveDeveloper(developer)}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                          Approve
                        </Button>
                        
                        {existingMatch && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => mergeDeveloper(developer, existingMatch.id)}
                            disabled={isProcessing}
                            className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                          >
                            <Merge className="w-4 h-4 mr-1" />
                            Merge with {existingMatch.name}
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectDeveloper(developer)}
                          disabled={isProcessing}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeveloperApprovalQueue;
