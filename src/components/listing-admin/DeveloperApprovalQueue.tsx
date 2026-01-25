import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Check, 
  X, 
  RefreshCw, 
  Download, 
  ChevronUp,
  Building2,
  Loader2,
  CheckCircle2,
  Pencil
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
      const existingMatch = findMatchingDeveloper(developer.slug);
      
      if (existingMatch) {
        // Merge with existing
        const updateData: Record<string, unknown> = {};
        if (developer.description) updateData.description = developer.description;
        if (developer.logo_url) updateData.logo_url = developer.logo_url;
        if (developer.feature_image_url) updateData.feature_image_url = developer.feature_image_url;

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from("developers")
            .update(updateData)
            .eq("id", existingMatch.id);

          if (updateError) throw updateError;
        }

        await supabase
          .from("pending_developer_imports")
          .update({
            status: "merged",
            matched_developer_id: existingMatch.id,
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id,
          })
          .eq("id", developer.id);

        toast.success(`Merged: ${developer.name}`);
      } else {
        // Create new
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

        await supabase
          .from("pending_developer_imports")
          .update({
            status: "approved",
            matched_developer_id: newDev.id,
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id,
          })
          .eq("id", developer.id);

        toast.success(`Approved: ${developer.name}`);
      }
      
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

  const rejectDeveloper = async (developer: PendingDeveloper) => {
    setProcessingIds(prev => new Set(prev).add(developer.id));
    try {
      await supabase
        .from("pending_developer_imports")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
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

  const truncateDescription = (desc: string | null, maxLength: number = 120) => {
    if (!desc) return "";
    if (desc.length <= maxLength) return desc;
    return desc.substring(0, maxLength).trim() + "...";
  };

  const approveAll = async () => {
    if (pendingDevelopers.length === 0) return;
    for (const developer of pendingDevelopers) {
      await approveDeveloper(developer);
    }
    toast.success(`Approved all ${pendingDevelopers.length} developers`);
  };

  const rejectAll = async () => {
    if (pendingDevelopers.length === 0) return;
    try {
      await supabase
        .from("pending_developer_imports")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("status", "pending");

      toast.success(`Rejected all pending developers`);
      fetchPendingDevelopers();
    } catch (error) {
      console.error("Bulk rejection error:", error);
      toast.error("Failed to reject all");
    }
  };

  const clearRejected = async () => {
    try {
      await supabase
        .from("pending_developer_imports")
        .delete()
        .eq("status", "rejected");

      toast.success("Cleared all rejected items");
    } catch (error) {
      console.error("Clear error:", error);
      toast.error("Failed to clear rejected items");
    }
  };

  return (
    <Card className="bg-zinc-900 border-gold/30">
      <CardHeader className="border-b border-gold/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gold" />
            <CardTitle className="text-white">Developer Approval Queue</CardTitle>
            <Badge variant="outline" className="border-gold/50 text-gold">
              {pendingDevelopers.length} Pending
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
        
        {/* Bulk Actions Row */}
        {pendingDevelopers.length > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gold/10">
            <Button
              size="sm"
              onClick={approveAll}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Approve All ({pendingDevelopers.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={rejectAll}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <X className="w-4 h-4 mr-2" />
              Reject All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearRejected}
              className="text-zinc-400 hover:text-white"
            >
              Clear Rejected
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
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
          /* Provident-style grid: 4 columns, squared cards with consistent alignment */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {pendingDevelopers.map((developer) => {
              const isProcessing = processingIds.has(developer.id);
              const existingMatch = findMatchingDeveloper(developer.slug);

              return (
                <div
                  key={developer.id}
                  className="group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Feature Image - Square aspect ratio */}
                  <div className="relative aspect-square bg-zinc-100 flex-shrink-0">
                    {developer.feature_image_url ? (
                      <img
                        src={developer.feature_image_url}
                        alt={developer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-200 to-zinc-300">
                        <Building2 className="w-16 h-16 text-zinc-400" />
                      </div>
                    )}
                    
                    {/* Existing match badge */}
                    {existingMatch && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-amber-500 text-white text-xs">
                          Will Merge
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content area - consistent height and alignment */}
                  <div className="p-4 bg-white flex flex-col flex-grow">
                    {/* Logo - fixed height container */}
                    <div className="h-10 mb-3 flex items-center">
                      {developer.logo_url ? (
                        <img
                          src={developer.logo_url}
                          alt={`${developer.name} logo`}
                          className="h-full w-auto object-contain max-w-[140px]"
                        />
                      ) : (
                        <div className="h-full" />
                      )}
                    </div>

                    {/* Name with arrow icon - fixed height */}
                    <div className="flex items-center gap-2 mb-2 h-6">
                      <h3 className="text-zinc-900 font-semibold text-base leading-tight truncate">
                        {developer.name}
                      </h3>
                      <ChevronUp className="w-4 h-4 text-zinc-400 rotate-45 flex-shrink-0" />
                    </div>

                    {/* Truncated description - fixed height */}
                    <p className="text-zinc-600 text-sm leading-relaxed mb-4 h-[60px] line-clamp-3">
                      {developer.description || "No description available"}
                    </p>

                    {/* Action buttons row - pushed to bottom */}
                    <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 mt-auto">
                      <Button
                        size="sm"
                        onClick={() => approveDeveloper(developer)}
                        disabled={isProcessing}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            {existingMatch ? "Merge" : "Approve"}
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectDeveloper(developer)}
                        disabled={isProcessing}
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-xs h-8"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(developer.provident_link || '#', '_blank')}
                        disabled={!developer.provident_link}
                        className="w-8 h-8 p-0 text-zinc-500 hover:text-zinc-900"
                        title="View Source"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
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
