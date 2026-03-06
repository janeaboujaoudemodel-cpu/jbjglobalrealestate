import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useListingAdmin } from "@/hooks/useListingAdmin";
import ProjectDetailLayout, { type ProjectDetailData } from "@/components/project-detail/ProjectDetailLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { filterValidImages } from "@/lib/imageUtils";
import {
  Download,
  Check,
  X,
  Merge,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface ImageData {
  url: string;
  alt?: string;
}

interface DocumentData {
  url: string;
  type: string;
  name?: string;
}

interface PendingImport {
  id: string;
  name: string;
  slug: string | null;
  developer_name: string | null;
  developer_id: string | null;
  location: string | null;
  emirate: string;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  size_min: number | null;
  size_max: number | null;
  handover_date: string | null;
  payment_plan: string | null;
  payment_breakdown: Json | null;
  property_type_label: string | null;
  status_label: string | null;
  amenities: string[] | null;
  amenities_list: Json | null;
  usp_headline: string | null;
  usp_bullets: Json | null;
  usp_image_url: string | null;
  location_headline: string | null;
  location_description: string | null;
  location_distances: Json | null;
  location_image_url: string | null;
  floor_plan_types: Json | null;
  faqs: Json | null;
  images: ImageData[];
  documents: DocumentData[];
  matched_project_id: string | null;
  is_new_project: boolean;
  source_url: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
}

const parseJsonArray = <T,>(json: Json | null, defaultVal: T[] = []): T[] => {
  if (!json) return defaultVal;
  if (Array.isArray(json)) return json as T[];
  return defaultVal;
};

const parseJsonObject = (json: Json | null): Record<string, unknown> | null => {
  if (!json) return null;
  if (typeof json === "object" && !Array.isArray(json)) return json as Record<string, unknown>;
  return null;
};

const PendingImportPreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isOwner } = useAuth();
  const { isListingAdmin, isLoading: checkingAdmin } = useListingAdmin();
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const hasAccess = isListingAdmin || isOwner;

  useEffect(() => {
    if (!checkingAdmin && !user) {
      navigate("/auth?redirect=/listing-admin");
    }
  }, [user, checkingAdmin, navigate]);

  useEffect(() => {
    const fetchImport = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("pending_project_imports")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          setPendingImport({
            id: data.id,
            name: data.name,
            slug: data.slug,
            developer_name: data.developer_name,
            developer_id: data.developer_id,
            location: data.location,
            emirate: data.emirate || "Dubai",
            description: data.description,
            price_from: data.price_from,
            price_to: data.price_to,
            bedrooms_min: data.bedrooms_min,
            bedrooms_max: data.bedrooms_max,
            size_min: data.size_min,
            size_max: data.size_max,
            handover_date: data.handover_date,
            payment_plan: data.payment_plan,
            payment_breakdown: data.payment_breakdown,
            property_type_label: data.property_type_label,
            status_label: data.status_label,
            amenities: data.amenities,
            amenities_list: data.amenities_list,
            usp_headline: data.usp_headline,
            usp_bullets: data.usp_bullets,
            usp_image_url: data.usp_image_url,
            location_headline: data.location_headline,
            location_description: data.location_description,
            location_distances: data.location_distances,
            location_image_url: data.location_image_url,
            floor_plan_types: data.floor_plan_types,
            faqs: data.faqs,
            images: parseJsonArray<ImageData>(data.images),
            documents: parseJsonArray<DocumentData>(data.documents),
            matched_project_id: data.matched_project_id,
            is_new_project: data.is_new_project ?? true,
            source_url: data.source_url,
            created_at: data.created_at,
            latitude: (data as any).latitude ?? null,
            longitude: (data as any).longitude ?? null,
          });
        }
      } catch (error) {
        console.error("Error fetching pending import:", error);
        toast({
          title: "Error",
          description: "Failed to load project preview",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchImport();
  }, [id, toast]);

  const mapped = useMemo<ProjectDetailData | null>(() => {
    if (!pendingImport) return null;

    const amenities = pendingImport.amenities?.length
      ? pendingImport.amenities
      : parseJsonArray<string>(pendingImport.amenities_list);

    const floorPlanTypes = parseJsonArray<{ label: string; pdfUrl?: string }>(pendingImport.floor_plan_types);
    const faqs = parseJsonArray<{ question: string; answer: string }>(pendingImport.faqs);
    const locationDistances = parseJsonArray<{ label: string; time: string }>(pendingImport.location_distances);
    const uspBullets = parseJsonArray<string>(pendingImport.usp_bullets);
    const paymentBreakdownObj = parseJsonObject(pendingImport.payment_breakdown);
    
    // Filter and normalize images (remove broken/placeholder URLs)
    const rawImages = (pendingImport.images || []).map((img, idx) => ({
      id: `pending-img-${idx}`,
      url: img.url,
      alt: img.alt || pendingImport.name,
    }));
    const validImages = filterValidImages(rawImages);

    return {
      id: pendingImport.matched_project_id || pendingImport.id,
      name: pendingImport.name,
      slug: pendingImport.slug,
      description: pendingImport.description,
      location: pendingImport.location,
      developer: pendingImport.developer_name ? { name: pendingImport.developer_name } : null,
      price_from: pendingImport.price_from,
      price_to: pendingImport.price_to,
      bedrooms_min: pendingImport.bedrooms_min,
      bedrooms_max: pendingImport.bedrooms_max,
      size_min: pendingImport.size_min,
      size_max: pendingImport.size_max,
      handover_date: pendingImport.handover_date,
      payment_plan: pendingImport.payment_plan,
      property_type_label: pendingImport.property_type_label,
      status_label: pendingImport.status_label,
      amenities: amenities.length ? amenities : null,
      // Use filtered, normalized images
      images: validImages,
      documents: (pendingImport.documents || []).map((d, idx) => ({
        id: `pending-doc-${idx}`,
        type: d.type,
        url: d.url,
        name: d.name || d.type,
      })),
      usp_headline: pendingImport.usp_headline,
      usp_bullets: uspBullets.length ? uspBullets : null,
      usp_image_url: pendingImport.usp_image_url,
      location_headline: pendingImport.location_headline,
      location_description: pendingImport.location_description,
      location_distances: locationDistances.length ? locationDistances : null,
      location_image_url: pendingImport.location_image_url,
      floor_plan_types: floorPlanTypes.length ? floorPlanTypes : null,
      faqs: faqs.length ? faqs : null,
      payment_breakdown: paymentBreakdownObj
        ? {
            down_payment: typeof paymentBreakdownObj.down_payment === "string" ? paymentBreakdownObj.down_payment : undefined,
            during_construction:
              typeof paymentBreakdownObj.during_construction === "string" ? paymentBreakdownObj.during_construction : undefined,
            on_completion: typeof paymentBreakdownObj.on_completion === "string" ? paymentBreakdownObj.on_completion : undefined,
          }
        : null,
      latitude: pendingImport.latitude,
      longitude: pendingImport.longitude,
    };
  }, [pendingImport]);

  // Duplicate detection – mirrors ProjectApprovalQueue logic
  const checkForDuplicates = useCallback(
    async (
      importData: PendingImport
    ): Promise<{ isDuplicate: boolean; existingProject?: { id: string; name: string } }> => {
      const normalizedName = importData.name.toLowerCase().trim();

      const { data: existingProjects } = await supabase
        .from("projects")
        .select("id, name, slug")
        .or(
          `name.ilike.%${normalizedName}%,slug.ilike.%${importData.slug || normalizedName}%`
        );

      if (existingProjects && existingProjects.length > 0) {
        const exactMatch = existingProjects.find(
          (p) =>
            p.name.toLowerCase().trim() === normalizedName ||
            (p.slug && importData.slug && p.slug === importData.slug)
        );
        if (exactMatch) {
          return { isDuplicate: true, existingProject: { id: exactMatch.id, name: exactMatch.name } };
        }
      }
      return { isDuplicate: false };
    },
    []
  );

  const handleApprove = async (forceCreate = false) => {
    if (!pendingImport) return;
    setIsProcessing(true);
    try {
      // Duplicate check unless forcing
      if (!forceCreate) {
        const { isDuplicate, existingProject } = await checkForDuplicates(pendingImport);
        if (isDuplicate && existingProject) {
          // Update import to mark as duplicate
          await supabase
            .from("pending_project_imports")
            .update({
              matched_project_id: existingProject.id,
              is_new_project: false,
              match_confidence: 100,
            })
            .eq("id", pendingImport.id);

          // Update local state
          setPendingImport((prev) =>
            prev ? { ...prev, matched_project_id: existingProject.id, is_new_project: false } : prev
          );

          toast({
            title: "Duplicate Detected",
            description: `"${existingProject.name}" already exists. Use "Merge Updates" instead.`,
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }
      }

      const projectData = {
        name: pendingImport.name,
        slug: pendingImport.slug || pendingImport.name.toLowerCase().replace(/\s+/g, "-"),
        developer_id: pendingImport.developer_id,
        location: pendingImport.location,
        emirate: pendingImport.emirate,
        description: pendingImport.description,
        price_from: pendingImport.price_from,
        price_to: pendingImport.price_to,
        bedrooms_min: pendingImport.bedrooms_min,
        bedrooms_max: pendingImport.bedrooms_max,
        size_min: pendingImport.size_min,
        size_max: pendingImport.size_max,
        handover_date: pendingImport.handover_date,
        payment_plan: pendingImport.payment_plan,
        property_type_label: pendingImport.property_type_label,
        status_label: pendingImport.status_label,
        source_url: pendingImport.source_url,
        is_offplan: true,
        status: "active",
      };

      const { data: newProject, error: projectError } = await supabase
        .from("projects")
        .insert(projectData)
        .select()
        .single();

      if (projectError) throw projectError;

      if (pendingImport.images.length > 0 && newProject) {
        const imageInserts = pendingImport.images.map((img, index) => ({
          project_id: newProject.id,
          image_url: img.url,
          alt_text: img.alt || pendingImport.name,
          display_order: index,
        }));
        await supabase.from("project_images").insert(imageInserts);
      }

      if (pendingImport.documents.length > 0 && newProject) {
        const docInserts = pendingImport.documents.map((doc, idx) => ({
          project_id: newProject.id,
          file_url: doc.url,
          document_type: doc.type,
          file_name: doc.name || `${doc.type}-${idx + 1}`,
          display_order: idx,
        }));
        await supabase.from("project_documents").insert(docInserts);
      }

      await supabase
        .from("pending_project_imports")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", pendingImport.id);

      toast({
        title: "Project Approved",
        description: `"${pendingImport.name}" has been added to your listings`,
      });

      navigate("/listing-admin");
    } catch (error) {
      console.error("Error approving import:", error);
      toast({
        title: "Error",
        description: "Failed to approve project",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMerge = async () => {
    if (!pendingImport || !pendingImport.matched_project_id) return;
    setIsProcessing(true);
    try {
      // Update existing project with new data
      const updateData: Record<string, unknown> = {};
      if (pendingImport.description) updateData.description = pendingImport.description;
      if (pendingImport.price_from) updateData.price_from = pendingImport.price_from;
      if (pendingImport.price_to) updateData.price_to = pendingImport.price_to;
      if (pendingImport.handover_date) updateData.handover_date = pendingImport.handover_date;
      if (pendingImport.payment_plan) updateData.payment_plan = pendingImport.payment_plan;
      if (pendingImport.property_type_label) updateData.property_type_label = pendingImport.property_type_label;
      if (pendingImport.status_label) updateData.status_label = pendingImport.status_label;

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from("projects")
          .update(updateData)
          .eq("id", pendingImport.matched_project_id);
      }

      // Add new images
      if (pendingImport.images.length > 0) {
        const { data: existingImages } = await supabase
          .from("project_images")
          .select("image_url")
          .eq("project_id", pendingImport.matched_project_id);

        const existingUrls = new Set(existingImages?.map((i) => i.image_url) || []);
        const newImages = pendingImport.images.filter((img) => !existingUrls.has(img.url));

        if (newImages.length > 0) {
          const imageInserts = newImages.map((img, index) => ({
            project_id: pendingImport.matched_project_id,
            image_url: img.url,
            alt_text: img.alt || pendingImport.name,
            display_order: (existingImages?.length || 0) + index,
          }));
          await supabase.from("project_images").insert(imageInserts);
        }
      }

      // Mark as merged
      await supabase
        .from("pending_project_imports")
        .update({ status: "merged", reviewed_at: new Date().toISOString() })
        .eq("id", pendingImport.id);

      toast({
        title: "Project Merged",
        description: `Updates merged into existing "${pendingImport.name}"`,
      });

      navigate("/listing-admin");
    } catch (error) {
      console.error("Error merging import:", error);
      toast({
        title: "Error",
        description: "Failed to merge project",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!pendingImport) return;
    setIsProcessing(true);
    try {
      await supabase
        .from("pending_project_imports")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          review_notes: "Rejected by admin",
        })
        .eq("id", pendingImport.id);

      toast({
        title: "Project Rejected",
        description: "The import has been rejected",
      });

      navigate("/listing-admin");
    } catch (error) {
      console.error("Error rejecting import:", error);
      toast({
        title: "Error",
        description: "Failed to reject import",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (checkingAdmin || isLoading) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 bg-black">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 bg-zinc-800 mb-8" />
          <Skeleton className="aspect-[16/9] w-full rounded-lg bg-zinc-800 mb-8" />
          <Skeleton className="h-12 w-64 bg-zinc-800 mb-4" />
          <Skeleton className="h-6 w-full max-w-2xl bg-zinc-800" />
        </div>
      </section>
    );
  }

  if (!hasAccess) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Access Denied</h1>
          <Link to="/" className="text-primary hover:underline">
            Go Home
          </Link>
        </div>
      </section>
    );
  }

  if (!pendingImport) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Project not found</h1>
          <Link to="/listing-admin" className="text-primary hover:underline">
            Back to Listing Admin
          </Link>
        </div>
      </section>
    );
  }

  if (!mapped) return null;

  return (
    <ProjectDetailLayout
      project={mapped}
      adminBar={
        <section className="bg-gradient-to-r from-champagne via-champagne-light to-champagne border-b border-gold/30 py-4 sticky top-20 lg:top-24 z-40 shadow-md">
          <div className="container mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
            <Button 
              variant="primary" 
              onClick={() => navigate("/listing-admin")}
              className="hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Queue
            </Button>

            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="border-2 border-gold/60 bg-card text-foreground font-semibold">PENDING REVIEW</Badge>
              <Badge className="border-2 border-gold/60 bg-card text-foreground font-semibold">
                {pendingImport.is_new_project ? "New Project" : "Update Existing"}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="tertiary" 
                onClick={handleReject} 
                disabled={isProcessing}
                className="border-red-500/60 hover:border-red-500 hover:bg-red-50 transition-all"
              >
                <X className="h-4 w-4 text-red-600" />
                <span className="text-red-600">Reject</span>
              </Button>

              {!pendingImport.is_new_project && pendingImport.matched_project_id && (
                <Button 
                  variant="tertiary" 
                  onClick={handleMerge} 
                  disabled={isProcessing}
                  className="hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <Merge className="h-4 w-4" />
                  Merge Updates
                </Button>
              )}

              <Button 
                variant="primary" 
                onClick={() => handleApprove(false)} 
                disabled={isProcessing}
                className="hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <Check className="h-4 w-4" />
                {pendingImport.is_new_project ? "Approve & Create" : "Approve as New"}
              </Button>
            </div>
          </div>
        </section>
      }
    />
  );
};

export default PendingImportPreview;
