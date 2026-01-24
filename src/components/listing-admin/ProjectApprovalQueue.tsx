import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, X, Clock, RefreshCw, Building2, MapPin, Calendar, 
  DollarSign, Bed, Ruler, FileText, Image as ImageIcon,
  ChevronLeft, ChevronRight, Merge, Plus
} from "lucide-react";
import { format } from "date-fns";
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
  community_name: string | null;
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
  match_confidence: number;
  is_new_project: boolean;
  status: string;
  source_url: string | null;
  created_at: string;
}

interface ProjectApprovalQueueProps {
  onRefresh?: () => void;
}

const parseJsonArray = <T,>(json: Json | null, defaultVal: T[] = []): T[] => {
  if (!json) return defaultVal;
  if (Array.isArray(json)) return json as T[];
  return defaultVal;
};

export function ProjectApprovalQueue({ onRefresh }: ProjectApprovalQueueProps) {
  const [imports, setImports] = useState<PendingImport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedImport, setSelectedImport] = useState<PendingImport | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { toast } = useToast();

  const fetchPendingImports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("pending_project_imports")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const parsed: PendingImport[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        developer_name: item.developer_name,
        developer_id: item.developer_id,
        community_name: item.community_name,
        location: item.location,
        emirate: item.emirate || 'Dubai',
        description: item.description,
        price_from: item.price_from,
        price_to: item.price_to,
        bedrooms_min: item.bedrooms_min,
        bedrooms_max: item.bedrooms_max,
        size_min: item.size_min,
        size_max: item.size_max,
        handover_date: item.handover_date,
        payment_plan: item.payment_plan,
        property_type_label: item.property_type_label,
        status_label: item.status_label,
        images: parseJsonArray<ImageData>(item.images),
        documents: parseJsonArray<DocumentData>(item.documents),
        matched_project_id: item.matched_project_id,
        match_confidence: item.match_confidence || 0,
        is_new_project: item.is_new_project ?? true,
        status: item.status || 'pending',
        source_url: item.source_url,
        created_at: item.created_at
      }));
      
      setImports(parsed);
    } catch (error) {
      console.error("Error fetching pending imports:", error);
      toast({
        title: "Error",
        description: "Failed to load pending imports",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingImports();
  }, []);

  const handleApprove = async (importData: PendingImport) => {
    setProcessingId(importData.id);
    try {
      // Create the project
      const projectData = {
        name: importData.name,
        slug: importData.slug || importData.name.toLowerCase().replace(/\s+/g, '-'),
        developer_id: importData.developer_id,
        community_id: null,
        location: importData.location,
        emirate: importData.emirate,
        description: importData.description,
        price_from: importData.price_from,
        price_to: importData.price_to,
        bedrooms_min: importData.bedrooms_min,
        bedrooms_max: importData.bedrooms_max,
        size_min: importData.size_min,
        size_max: importData.size_max,
        handover_date: importData.handover_date,
        payment_plan: importData.payment_plan,
        property_type_label: importData.property_type_label,
        status_label: importData.status_label,
        source_url: importData.source_url,
        is_offplan: true,
        status: 'active'
      };

      const { data: newProject, error: projectError } = await supabase
        .from("projects")
        .insert(projectData)
        .select()
        .single();

      if (projectError) throw projectError;

      // Insert images
      if (importData.images.length > 0 && newProject) {
        const imageInserts = importData.images.map((img, index) => ({
          project_id: newProject.id,
          image_url: img.url,
          alt_text: img.alt || importData.name,
          display_order: index
        }));

        const { error: imgError } = await supabase
          .from("project_images")
          .insert(imageInserts);

        if (imgError) console.error("Error inserting images:", imgError);
      }

      // Insert documents
      if (importData.documents.length > 0 && newProject) {
        const docInserts = importData.documents.map((doc, idx) => ({
          project_id: newProject.id,
          file_url: doc.url,
          document_type: doc.type,
          file_name: doc.name || `${doc.type}-${idx + 1}`,
          display_order: idx
        }));

        const { error: docError } = await supabase
          .from("project_documents")
          .insert(docInserts);

        if (docError) console.error("Error inserting documents:", docError);
      }

      // Mark import as approved
      await supabase
        .from("pending_project_imports")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString()
        })
        .eq("id", importData.id);

      toast({
        title: "Project Approved",
        description: `"${importData.name}" has been added to your listings`,
      });

      setSelectedImport(null);
      fetchPendingImports();
      onRefresh?.();
    } catch (error) {
      console.error("Error approving import:", error);
      toast({
        title: "Error",
        description: "Failed to approve project",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleMerge = async (importData: PendingImport) => {
    if (!importData.matched_project_id) return;
    
    setProcessingId(importData.id);
    try {
      // Update existing project with new data
      const updateData: Record<string, any> = {};
      
      if (importData.description) updateData.description = importData.description;
      if (importData.price_from) updateData.price_from = importData.price_from;
      if (importData.price_to) updateData.price_to = importData.price_to;
      if (importData.handover_date) updateData.handover_date = importData.handover_date;
      if (importData.payment_plan) updateData.payment_plan = importData.payment_plan;
      if (importData.property_type_label) updateData.property_type_label = importData.property_type_label;
      if (importData.status_label) updateData.status_label = importData.status_label;

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from("projects")
          .update(updateData)
          .eq("id", importData.matched_project_id);
      }

      // Add new images
      if (importData.images.length > 0) {
        const { data: existingImages } = await supabase
          .from("project_images")
          .select("image_url")
          .eq("project_id", importData.matched_project_id);

        const existingUrls = new Set(existingImages?.map(i => i.image_url) || []);
        const newImages = importData.images.filter(img => !existingUrls.has(img.url));

        if (newImages.length > 0) {
          const imageInserts = newImages.map((img, index) => ({
            project_id: importData.matched_project_id,
            image_url: img.url,
            alt_text: img.alt || importData.name,
            display_order: (existingImages?.length || 0) + index
          }));

          await supabase.from("project_images").insert(imageInserts);
        }
      }

      // Mark as merged
      await supabase
        .from("pending_project_imports")
        .update({
          status: "merged",
          reviewed_at: new Date().toISOString()
        })
        .eq("id", importData.id);

      toast({
        title: "Project Merged",
        description: `Updates merged into existing "${importData.name}"`,
      });

      setSelectedImport(null);
      fetchPendingImports();
      onRefresh?.();
    } catch (error) {
      console.error("Error merging import:", error);
      toast({
        title: "Error",
        description: "Failed to merge project",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (importData: PendingImport, reason?: string) => {
    setProcessingId(importData.id);
    try {
      await supabase
        .from("pending_project_imports")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          review_notes: reason || "Rejected by admin"
        })
        .eq("id", importData.id);

      toast({
        title: "Project Rejected",
        description: "The import has been rejected",
      });

      setSelectedImport(null);
      fetchPendingImports();
    } catch (error) {
      console.error("Error rejecting import:", error);
      toast({
        title: "Error",
        description: "Failed to reject import",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (isLoading) {
    return (
      <Card className="bg-white border-zinc-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Project Approval Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white border-zinc-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-zinc-900">
            <Building2 className="h-5 w-5 text-gold" />
            Project Approval Queue
            {imports.length > 0 && (
              <Badge className="bg-amber-100 text-amber-800 ml-2">
                {imports.length} pending
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchPendingImports}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {imports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Check className="h-16 w-16 mb-4 text-emerald-500" />
              <p className="text-xl font-medium text-zinc-900">All caught up!</p>
              <p className="text-sm">No projects awaiting approval</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {imports.map((item) => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-zinc-200"
                  onClick={() => {
                    setSelectedImport(item);
                    setCurrentImageIndex(0);
                  }}
                >
                  {/* Image Preview */}
                  <div className="relative h-48 bg-zinc-100">
                    {item.images.length > 0 ? (
                      <img
                        src={item.images[0].url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-zinc-300" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-2">
                      {item.is_new_project ? (
                        <Badge className="bg-emerald-500 text-white">
                          <Plus className="h-3 w-3 mr-1" />
                          New
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500 text-white">
                          <Merge className="h-3 w-3 mr-1" />
                          Update
                        </Badge>
                      )}
                      {item.status_label && (
                        <Badge variant="secondary">{item.status_label}</Badge>
                      )}
                    </div>
                    
                    {/* Image count */}
                    {item.images.length > 0 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        {item.images.length}
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-zinc-900 mb-1 line-clamp-1">
                      {item.name}
                    </h3>
                    
                    {item.developer_name && (
                      <p className="text-sm text-zinc-600 mb-2">
                        by {item.developer_name}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-zinc-500 mb-3">
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        {item.price_from && (
                          <span className="font-medium text-zinc-900">
                            From {formatPrice(item.price_from)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {item.documents.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {item.documents.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedImport} onOpenChange={() => setSelectedImport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedImport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedImport.is_new_project ? (
                    <Badge className="bg-emerald-500">New Project</Badge>
                  ) : (
                    <Badge className="bg-blue-500">Update Existing</Badge>
                  )}
                  {selectedImport.name}
                </DialogTitle>
              </DialogHeader>

              {/* Image Gallery */}
              {selectedImport.images.length > 0 && (
                <div className="relative">
                  <div className="aspect-video bg-zinc-100 rounded-lg overflow-hidden">
                    <img
                      src={selectedImport.images[currentImageIndex]?.url}
                      alt={selectedImport.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  
                  {selectedImport.images.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80"
                        onClick={() => setCurrentImageIndex(i => 
                          i === 0 ? selectedImport.images.length - 1 : i - 1
                        )}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80"
                        onClick={() => setCurrentImageIndex(i => 
                          i === selectedImport.images.length - 1 ? 0 : i + 1
                        )}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded">
                        {currentImageIndex + 1} / {selectedImport.images.length}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Thumbnail Strip */}
              {selectedImport.images.length > 1 && (
                <ScrollArea className="w-full">
                  <div className="flex gap-2 py-2">
                    {selectedImport.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-colors ${
                          idx === currentImageIndex ? 'border-gold' : 'border-transparent'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <Separator />

              {/* Project Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  {selectedImport.developer_name && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm">
                        <span className="text-zinc-500">Developer:</span>{' '}
                        <span className="font-medium">{selectedImport.developer_name}</span>
                      </span>
                    </div>
                  )}
                  
                  {selectedImport.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm">
                        <span className="text-zinc-500">Location:</span>{' '}
                        <span className="font-medium">{selectedImport.location}</span>
                      </span>
                    </div>
                  )}

                  {selectedImport.handover_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm">
                        <span className="text-zinc-500">Handover:</span>{' '}
                        <span className="font-medium">{selectedImport.handover_date}</span>
                      </span>
                    </div>
                  )}

                  {(selectedImport.bedrooms_min || selectedImport.bedrooms_max) && (
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm">
                        <span className="text-zinc-500">Bedrooms:</span>{' '}
                        <span className="font-medium">
                          {selectedImport.bedrooms_min === selectedImport.bedrooms_max
                            ? selectedImport.bedrooms_min
                            : `${selectedImport.bedrooms_min || '?'} - ${selectedImport.bedrooms_max || '?'}`}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {selectedImport.price_from && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm">
                        <span className="text-zinc-500">Price From:</span>{' '}
                        <span className="font-medium">{formatPrice(selectedImport.price_from)}</span>
                      </span>
                    </div>
                  )}

                  {selectedImport.size_min && (
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm">
                        <span className="text-zinc-500">Size:</span>{' '}
                        <span className="font-medium">
                          {selectedImport.size_min?.toLocaleString()} - {selectedImport.size_max?.toLocaleString()} sq ft
                        </span>
                      </span>
                    </div>
                  )}

                  {selectedImport.property_type_label && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{selectedImport.property_type_label}</Badge>
                    </div>
                  )}

                  {selectedImport.status_label && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gold/20 text-gold-dark">{selectedImport.status_label}</Badge>
                    </div>
                  )}
                </div>
              </div>

              {selectedImport.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-zinc-600 line-clamp-4">
                    {selectedImport.description}
                  </p>
                </div>
              )}

              {selectedImport.payment_plan && (
                <div>
                  <h4 className="font-medium mb-2">Payment Plan</h4>
                  <p className="text-sm text-zinc-600">{selectedImport.payment_plan}</p>
                </div>
              )}

              {/* Documents */}
              {selectedImport.documents.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents ({selectedImport.documents.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedImport.documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-100 rounded hover:bg-zinc-200 transition-colors text-sm"
                      >
                        <FileText className="h-4 w-4 text-zinc-500" />
                        {doc.name || doc.type}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-500">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Extracted {format(new Date(selectedImport.created_at), "MMM d, yyyy 'at' h:mm a")}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedImport)}
                    disabled={processingId === selectedImport.id}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  
                  {!selectedImport.is_new_project && selectedImport.matched_project_id && (
                    <Button
                      variant="outline"
                      onClick={() => handleMerge(selectedImport)}
                      disabled={processingId === selectedImport.id}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Merge className="h-4 w-4 mr-2" />
                      Merge Updates
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => handleApprove(selectedImport)}
                    disabled={processingId === selectedImport.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {selectedImport.is_new_project ? 'Approve & Create' : 'Approve as New'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}