import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Check,
  X,
  RefreshCw,
  Download,
  ChevronUp,
  Building2,
  Loader2,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ITEMS_PER_PAGE = 30;

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
  const navigate = useNavigate();
  const [pendingDevelopers, setPendingDevelopers] = useState<PendingDeveloper[]>([]);
  const [existingDevelopers, setExistingDevelopers] = useState<ExistingDeveloper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(pendingDevelopers.length / ITEMS_PER_PAGE) || 1;

  const paginatedDevelopers = pendingDevelopers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const fetchPendingDevelopers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("pending_developer_imports")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPendingDevelopers((data as PendingDeveloper[]) || []);
      setCurrentPage(1);
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
    setProcessingIds((prev) => new Set(prev).add(developer.id));
    try {
      const existingMatch = findMatchingDeveloper(developer.slug);

      if (existingMatch) {
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
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(developer.id);
        return next;
      });
    }
  };

  const rejectDeveloper = async (developer: PendingDeveloper) => {
    setProcessingIds((prev) => new Set(prev).add(developer.id));
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
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(developer.id);
        return next;
      });
    }
  };

  const findMatchingDeveloper = (slug: string): ExistingDeveloper | undefined => {
    return existingDevelopers.find(
      (d) =>
        d.slug.toLowerCase() === slug.toLowerCase() ||
        d.name.toLowerCase().includes(slug.replace(/-/g, " ").toLowerCase())
    );
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

  const handleCardClick = (slug: string) => {
    navigate(`/developer/${slug}`);
  };

  const renderPageNumbers = () => {
    const pages: React.ReactNode[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(i);
            }}
            isActive={i === currentPage}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return pages;
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
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={triggerExtraction}
              disabled={isExtracting}
              className="bg-gold text-black hover:bg-gold/90"
            >
              {isExtracting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Extract from Source
            </Button>
          </div>
        </div>

        {/* Bulk Actions Row */}
        {pendingDevelopers.length > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gold/10">
            <Button size="sm" onClick={approveAll} className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
          <>
            {/* Grid: 4 columns per row, matching Provident layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {paginatedDevelopers.map((developer) => {
                const isProcessing = processingIds.has(developer.id);
                const existingMatch = findMatchingDeveloper(developer.slug);

                return (
                  <div
                    key={developer.id}
                    className="group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer h-full"
                    onClick={() => handleCardClick(developer.slug)}
                  >
                    {/* Feature Image - Fixed height */}
                    <div className="relative h-[180px] bg-zinc-100 flex-shrink-0">
                      {developer.feature_image_url ? (
                        <img
                          src={developer.feature_image_url}
                          alt={developer.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // Prevent broken image icon in admin UI
                            (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-200 to-zinc-300">
                          <Building2 className="w-16 h-16 text-zinc-400" />
                        </div>
                      )}

                      {/* Logo overlay at bottom-left - Fixed height */}
                      <div className="absolute bottom-3 left-3 bg-white/95 px-2 py-1 rounded shadow h-8 flex items-center">
                        {developer.logo_url ? (
                          <img
                            src={developer.logo_url}
                            alt={`${developer.name} logo`}
                            className="h-5 w-auto object-contain max-w-[80px]"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                            }}
                          />
                        ) : (
                          <span className="text-xs text-zinc-400">No logo</span>
                        )}
                      </div>

                      {/* Update existing badge */}
                      {existingMatch && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-blue-500 text-white text-xs">Update Existing</Badge>
                        </div>
                      )}
                    </div>

                    {/* Content - Fixed heights */}
                    <div className="p-4 bg-white flex flex-col flex-grow">
                      {/* Name + arrow - Fixed height */}
                      <div className="flex items-center gap-2 mb-2 h-7 min-h-[28px]">
                        <h3 className="text-zinc-900 font-semibold text-sm leading-tight truncate flex-1 min-w-0">
                          {developer.name}
                        </h3>
                        <ChevronUp className="w-4 h-4 text-zinc-400 rotate-45 flex-shrink-0" />
                      </div>

                      {/* Description - Fixed height with line clamp */}
                      <p className="text-zinc-600 text-xs leading-relaxed mb-4 h-[54px] min-h-[54px] line-clamp-3 overflow-hidden">
                        {developer.description || "No description available"}
                      </p>

                      {/* Action buttons */}
                      <div
                        className="flex items-center gap-2 pt-3 border-t border-zinc-100 mt-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                              Approve
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
                          onClick={() => window.open(developer.provident_link || "#", "_blank")}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {renderPageNumbers()}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DeveloperApprovalQueue;
