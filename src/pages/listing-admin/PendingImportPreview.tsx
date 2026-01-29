import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useListingAdmin } from "@/hooks/useListingAdmin";
import Footer from "@/components/Footer";
import ImageCarousel from "@/components/ImageCarousel";
import DocumentDownloads from "@/components/DocumentDownloads";
import MortgageCalculator from "@/components/MortgageCalculator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  MapPin,
  Download,
  MessageCircle,
  Phone,
  Bed,
  Building2,
  Calendar,
  DollarSign,
  Layers,
  Map as MapIcon,
  Info,
  ChevronLeft,
  Check,
  X,
  Merge,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { getWhatsAppUrl, getCallUrl, CONTACT_INFO } from "@/constants/stats";
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
  property_type_label: string | null;
  status_label: string | null;
  images: ImageData[];
  documents: DocumentData[];
  matched_project_id: string | null;
  is_new_project: boolean;
  source_url: string | null;
  created_at: string;
}

const parseJsonArray = <T,>(json: Json | null, defaultVal: T[] = []): T[] => {
  if (!json) return defaultVal;
  if (Array.isArray(json)) return json as T[];
  return defaultVal;
};

const PendingImportPreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { isListingAdmin, isLoading: checkingAdmin } = useListingAdmin();
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const inquiryRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const hasAccess = isListingAdmin || isAdmin;

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
            property_type_label: data.property_type_label,
            status_label: data.status_label,
            images: parseJsonArray<ImageData>(data.images),
            documents: parseJsonArray<DocumentData>(data.documents),
            matched_project_id: data.matched_project_id,
            is_new_project: data.is_new_project ?? true,
            source_url: data.source_url,
            created_at: data.created_at,
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

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `AED ${(price / 1000000).toFixed(2)}M`;
    }
    return `AED ${price.toLocaleString()}`;
  };

  const handleApprove = async () => {
    if (!pendingImport) return;
    setIsProcessing(true);
    try {
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

  const whatsappMessage = `Hi, I'm interested in ${pendingImport.name}${
    pendingImport.location ? ` at ${pendingImport.location}` : ""
  }. Please share more details.`;
  const brochure = pendingImport.documents.find((d) => d.type === "brochure");

  const handleWhatsApp = () => {
    window.open(getWhatsAppUrl(whatsappMessage), "_blank");
  };

  const handleCall = () => {
    window.location.href = getCallUrl();
  };

  const carouselImages =
    pendingImport.images.length > 0
      ? pendingImport.images.map((img, idx) => ({
          id: `pending-img-${idx}`,
          image_url: img.url,
          alt_text: img.alt || pendingImport.name,
        }))
      : [];

  const documentsList = pendingImport.documents.map((d, idx) => ({
    id: `pending-doc-${idx}`,
    file_url: d.url,
    document_type: d.type,
    file_name: d.name || d.type,
  }));

  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] min-h-[400px]">
        <div className="absolute inset-0">
          {pendingImport.images[0]?.url ? (
            <img
              src={pendingImport.images[0].url}
              alt={pendingImport.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-zinc-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end pb-12">
          <div className="flex items-center gap-2 text-sm mb-4 flex-wrap text-white/80">
            <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <span>/</span>
            <Link to="/listing-admin" className="hover:text-white transition-colors">
              Listing Admin
            </Link>
            <span>/</span>
            <span className="text-white">{pendingImport.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-amber-500 text-black font-semibold">PENDING REVIEW</Badge>
                {pendingImport.is_new_project ? (
                  <Badge className="bg-emerald-500 text-white">New Project</Badge>
                ) : (
                  <Badge className="bg-blue-500 text-white">Update Existing</Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{pendingImport.name}</h1>
              {pendingImport.developer_name && (
                <p className="text-lg text-white/80">by {pendingImport.developer_name}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {brochure && (
                <a href={brochure.url} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    <Download className="w-4 h-4 mr-2" />
                    Download Brochure
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Admin Action Bar */}
      <section className="bg-zinc-900 border-b border-zinc-800 py-4 sticky top-20 lg:top-24 z-40">
        <div className="container mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/listing-admin")}
            className="text-white hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Queue
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={isProcessing}
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>

            {!pendingImport.is_new_project && pendingImport.matched_project_id && (
              <Button
                variant="outline"
                disabled={isProcessing}
                className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
              >
                <Merge className="h-4 w-4 mr-2" />
                Merge Updates
              </Button>
            )}

            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              {pendingImport.is_new_project ? "Approve & Create" : "Approve as New"}
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Image Carousel */}
              {carouselImages.length > 0 && (
                <div className="bg-zinc-50 rounded-xl p-4">
                  <ImageCarousel images={carouselImages} projectName={pendingImport.name} />
                </div>
              )}

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {pendingImport.price_from && (
                  <div className="bg-zinc-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <DollarSign className="w-5 h-5" />
                      <span className="text-sm font-medium text-zinc-600">Starting Price</span>
                    </div>
                    <p className="text-xl font-bold text-black">
                      {formatPrice(pendingImport.price_from)}
                    </p>
                  </div>
                )}

                {pendingImport.handover_date && (
                  <div className="bg-zinc-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm font-medium text-zinc-600">Handover</span>
                    </div>
                    <p className="text-xl font-bold text-black">{pendingImport.handover_date}</p>
                  </div>
                )}

                {pendingImport.payment_plan && (
                  <div className="bg-zinc-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Layers className="w-5 h-5" />
                      <span className="text-sm font-medium text-zinc-600">Payment Plan</span>
                    </div>
                    <p className="text-xl font-bold text-black">{pendingImport.payment_plan}</p>
                  </div>
                )}

                {pendingImport.location && (
                  <div className="bg-zinc-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <MapPin className="w-5 h-5" />
                      <span className="text-sm font-medium text-zinc-600">Location</span>
                    </div>
                    <p className="text-lg font-semibold text-black">{pendingImport.location}</p>
                  </div>
                )}

                {pendingImport.bedrooms_min && (
                  <div className="bg-zinc-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Bed className="w-5 h-5" />
                      <span className="text-sm font-medium text-zinc-600">Bedrooms</span>
                    </div>
                    <p className="text-lg font-semibold text-black">
                      {pendingImport.bedrooms_min === pendingImport.bedrooms_max
                        ? `${pendingImport.bedrooms_min} BR`
                        : `${pendingImport.bedrooms_min}-${pendingImport.bedrooms_max} BR`}
                    </p>
                  </div>
                )}

                {pendingImport.property_type_label && (
                  <div className="bg-zinc-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Building2 className="w-5 h-5" />
                      <span className="text-sm font-medium text-zinc-600">Property Type</span>
                    </div>
                    <p className="text-lg font-semibold text-black">
                      {pendingImport.property_type_label}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {pendingImport.description && (
                <div className="bg-zinc-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-black mb-4">About This Project</h3>
                  <p className="text-zinc-700 whitespace-pre-line">{pendingImport.description}</p>
                </div>
              )}

              {/* Location Map */}
              <div className="bg-zinc-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-black">Location</h3>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      pendingImport.name +
                        (pendingImport.location ? ", " + pendingImport.location : "") +
                        ", Dubai, UAE"
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                  >
                    <MapIcon className="w-4 h-4" />
                    View Larger Map
                  </a>
                </div>
                <div className="rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
                      pendingImport.name +
                        (pendingImport.location ? ", " + pendingImport.location : "") +
                        ", Dubai, UAE"
                    )}&maptype=satellite`}
                    width="100%"
                    height="350"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${pendingImport.name} Location Map`}
                  />
                </div>
                <p className="text-zinc-500 text-xs mt-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Use two fingers to zoom on touch devices
                </p>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Quick Contact */}
              <div className="bg-zinc-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-black mb-4">Get in Touch</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </button>
                  <button
                    onClick={handleCall}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-black hover:bg-zinc-800 text-white font-medium transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    Call
                  </button>
                </div>
              </div>

              {/* Documents */}
              {documentsList.length > 0 && (
                <div className="bg-zinc-50 rounded-xl">
                  <DocumentDownloads documents={documentsList} />
                </div>
              )}

              {/* Mortgage Calculator */}
              {pendingImport.price_from && (
                <div className="bg-zinc-50 rounded-xl overflow-hidden">
                  <MortgageCalculator defaultPrice={pendingImport.price_from} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default PendingImportPreview;
