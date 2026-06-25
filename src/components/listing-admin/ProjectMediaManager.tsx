import { useState, useCallback, useRef } from "react";
import { X, GripVertical, Upload, Image as ImageIcon, Star, Layers, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/SafeImage";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAdminEdit } from "@/hooks/useAdminEditLog";

interface ProjectImage {
  id: string;
  image_url: string;
  is_primary?: boolean;
  display_order?: number;
}

interface ProjectMediaManagerProps {
  project: {
    id: string;
    name: string;
    cover_image_url?: string | null;
    card_image_url?: string | null;
    gallery_start_image_url?: string | null;
    images?: ProjectImage[];
  };
  onRefresh: () => void;
}

type ImageRole = "card" | "hero" | "gallery";

const ROLE_CONFIG: Record<ImageRole, { label: string; icon: typeof Star; color: string; field: string }> = {
  card: { label: "Card", icon: CreditCard, color: "bg-blue-500", field: "card_image_url" },
  hero: { label: "Hero / Cover", icon: Star, color: "bg-[#EFE6D6]", field: "cover_image_url" },
  gallery: { label: "Gallery Start", icon: Layers, color: "jj-surface-emerald", field: "gallery_start_image_url" },
};

export function ProjectMediaManager({ project, onRefresh }: ProjectMediaManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSettingRole, setIsSettingRole] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const images = project.images || [];

  const getImageRoles = (url: string): ImageRole[] => {
    const roles: ImageRole[] = [];
    if (project.card_image_url === url) roles.push("card");
    if (project.cover_image_url === url) roles.push("hero");
    if (project.gallery_start_image_url === url) roles.push("gallery");
    return roles;
  };

  const handleSetRole = async (imageUrl: string, role: ImageRole) => {
    const field = ROLE_CONFIG[role].field;
    setIsSettingRole(`${role}-${imageUrl}`);
    try {
      // If already set to this image, unset it
      const currentValue = role === "card" ? project.card_image_url
        : role === "hero" ? project.cover_image_url
        : project.gallery_start_image_url;

      const newValue = currentValue === imageUrl ? null : imageUrl;

      const { error } = await supabase
        .from("projects")
        .update({ [field]: newValue } as any)
        .eq("id", project.id);

      if (error) throw error;

      await logAdminEdit({
        entity_type: "project",
        entity_id: project.id,
        entity_name: project.name,
        action: "set_image_role",
        changed_fields: [field],
        summary: newValue ? `Set ${ROLE_CONFIG[role].label} image` : `Unset ${ROLE_CONFIG[role].label} image`,
      });

      toast.success(newValue ? `${ROLE_CONFIG[role].label} image set` : `${ROLE_CONFIG[role].label} image cleared`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to set image role");
    } finally {
      setIsSettingRole(null);
    }
  };

  const handleDeleteImage = async (img: ProjectImage) => {
    if (!confirm("Delete this image? This cannot be undone.")) return;
    setIsDeletingId(img.id);
    try {
      // Remove from storage if it's our file
      const urlParts = img.image_url.split("/project-files/");
      if (urlParts[1]) {
        await supabase.storage.from("project-files").remove([urlParts[1]]);
      }

      const { error } = await supabase.from("project_images").delete().eq("id", img.id);
      if (error) throw error;

      // Clear any role references to this image
      const updates: Record<string, null> = {};
      if (project.card_image_url === img.image_url) updates.card_image_url = null;
      if (project.cover_image_url === img.image_url) updates.cover_image_url = null;
      if (project.gallery_start_image_url === img.image_url) updates.gallery_start_image_url = null;

      if (Object.keys(updates).length > 0) {
        await supabase.from("projects").update(updates as any).eq("id", project.id);
      }

      await logAdminEdit({
        entity_type: "project",
        entity_id: project.id,
        entity_name: project.name,
        action: "delete_image",
        changed_fields: ["images"],
        summary: "Deleted an image",
      });

      toast.success("Image deleted");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete image");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    try {
      for (const file of Array.from(files)) {
        const fileName = `${project.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("project-files").upload(fileName, file);
        if (uploadError) continue;

        const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(fileName);
        const { error: dbError } = await supabase.from("project_images").insert({
          project_id: project.id,
          image_url: urlData.publicUrl,
          is_primary: false,
          display_order: images.length + successCount,
        } as any);
        if (!dbError) successCount++;
      }

      if (successCount > 0) {
        toast.success(`${successCount} image(s) uploaded`);
        await logAdminEdit({
          entity_type: "project",
          entity_id: project.id,
          entity_name: project.name,
          action: "upload_image",
          changed_fields: ["images"],
          summary: `Uploaded ${successCount} image(s)`,
        });
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  // Drag & drop reorder
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex !== null && draggedIndex !== index) setDragOverIndex(index);
  }, [draggedIndex]);

  const handleDrop = useCallback(async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...images];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    // Update display_order in DB
    const updates = reordered.map((img, idx) =>
      supabase.from("project_images").update({ display_order: idx } as any).eq("id", img.id)
    );
    await Promise.all(updates);

    toast.success("Image order updated");
    onRefresh();
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, images, onRefresh]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Role summary cards at top
  const roleEntries = Object.entries(ROLE_CONFIG) as [ImageRole, typeof ROLE_CONFIG["card"]][];

  return (
    <div className="space-y-6">
      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {roleEntries.map(([role, config]) => {
          const currentUrl = role === "card" ? project.card_image_url
            : role === "hero" ? project.cover_image_url
            : project.gallery_start_image_url;
          const Icon = config.icon;

          return (
            <div key={role} className="flex items-center gap-3 p-3 rounded-xl border-2 border-[#B89555]/20 bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA]">
              <div className={cn("w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 border-[#B89555]/30", !currentUrl && "flex items-center justify-center bg-muted")}>
                {currentUrl ? (
                  <SafeImage src={currentUrl} alt={config.label} className="w-full h-full object-cover" fallbackSrc="/placeholder.svg" />
                ) : (
                  <Icon className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">{config.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {currentUrl ? "Set ✓" : "Not set — click an image below"}
                </p>
              </div>
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", currentUrl ? "jj-surface-emerald" : "bg-[#E5D9C4]")} />
            </div>
          );
        })}
      </div>

      {/* Upload Button */}
      <div className="flex items-center gap-3">
        <Button onClick={() => imageInputRef.current?.click()} disabled={isUploading} variant="secondary" size="sm">
          {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          Upload Images
        </Button>
        <span className="text-xs text-muted-foreground">{images.length} image{images.length !== 1 ? "s" : ""} • Drag to reorder</span>
        <input ref={imageInputRef} type="file" className="hidden" accept="image/*" multiple onChange={handleUpload} />
      </div>

      {/* Image Grid */}
      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#B89555]/30 rounded-xl bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA]">
          <ImageIcon className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No images uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, index) => {
            const roles = getImageRoles(img.image_url);
            const isDeleting = isDeletingId === img.id;

            return (
              <div
                key={img.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "relative group rounded-xl border-2 transition-all duration-200 cursor-move overflow-hidden aspect-square",
                  draggedIndex === index ? "opacity-50 border-[#B89555] scale-95"
                    : dragOverIndex === index ? "border-[#B89555] bg-[#EFE6D6]/10"
                    : "border-[#B89555]/20 hover:border-[#B89555]/50"
                )}
              >
                <SafeImage
                  src={img.image_url}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                  fallbackSrc="/placeholder.svg"
                />

                {/* Drag handle */}
                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-[#1A1A1A]/70 text-white p-1 rounded">
                    <GripVertical className="w-4 h-4" />
                  </div>
                </div>

                {/* Order badge */}
                <div className="absolute top-2 right-2 z-10">
                  <div className="bg-[#1A1A1A]/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    #{index + 1}
                  </div>
                </div>

                {/* Role badges */}
                {roles.length > 0 && (
                  <div className="absolute top-8 right-2 z-10 flex flex-col gap-1">
                    {roles.map((role) => (
                      <Badge key={role} className={cn("text-[9px] px-1.5 py-0 text-white border-0", ROLE_CONFIG[role].color)}>
                        {ROLE_CONFIG[role].label}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Action overlay on hover */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex flex-wrap gap-1">
                    {roleEntries.map(([role, config]) => {
                      const isActive = roles.includes(role);
                      const isLoading = isSettingRole === `${role}-${img.image_url}`;
                      return (
                        <button
                          key={role}
                          onClick={(e) => { e.stopPropagation(); handleSetRole(img.image_url, role); }}
                          disabled={!!isSettingRole}
                          className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded font-medium transition-colors",
                            isActive ? `${config.color} text-white` : "bg-[#FDFBF7]/20 text-white hover:bg-[#FDFBF7]/40"
                          )}
                        >
                          {isLoading ? "..." : isActive ? `✓ ${config.label}` : config.label}
                        </button>
                      );
                    })}
                  </div>
                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(img); }}
                    disabled={isDeleting}
                    className="mt-1.5 w-full text-[10px] py-1 rounded bg-red-500/80 hover:bg-red-600 text-white font-medium transition-colors"
                  >
                    {isDeleting ? "Deleting..." : "Delete Image"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
