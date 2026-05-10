import { useState, useCallback } from "react";
import { X, GripVertical, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/SafeImage";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  url: string;
  name?: string;
  type: "image" | "document";
  displayOrder?: number;
}

interface DraggableMediaGridProps {
  items: MediaItem[];
  onReorder: (items: MediaItem[]) => void;
  onDelete?: (item: MediaItem) => void;
  type: "images" | "documents";
}

const DraggableMediaGrid = ({ items, onReorder, onDelete, type }: DraggableMediaGridProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    // Update display orders
    const reorderedItems = newItems.map((item, idx) => ({
      ...item,
      displayOrder: idx,
    }));

    onReorder(reorderedItems);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, items, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#B89555]/30 rounded-xl bg-[#F7F2EA]">
        {type === "images" ? (
          <ImageIcon className="w-8 h-8 text-[#1A1A1A]/70 mb-2" />
        ) : (
          <FileText className="w-8 h-8 text-[#1A1A1A]/70 mb-2" />
        )}
        <p className="text-sm text-[#1A1A1A]/70">
          No {type} uploaded yet
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "grid gap-3",
      type === "images" ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" : "grid-cols-1"
    )}>
      {items.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={cn(
            "relative group rounded-lg border-2 transition-all duration-200 cursor-move",
            draggedIndex === index 
              ? "opacity-50 border-[#B89555] scale-95" 
              : dragOverIndex === index
              ? "border-[#B89555] bg-[#EFE6D6]/10"
              : "border-muted hover:border-[#B89555]/50",
            type === "images" ? "aspect-square" : "p-3"
          )}
        >
          {/* Drag Handle */}
          <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-[#1A1A1A]/70 text-white p-1 rounded">
              <GripVertical className="w-4 h-4" />
            </div>
          </div>

          {/* Order Badge */}
          <div className="absolute top-2 right-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-[#EFE6D6] text-[#1A1A1A] text-xs font-bold px-2 py-0.5 rounded">
              #{index + 1}
            </div>
          </div>

          {/* Delete Button */}
          {onDelete && (
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
                className="h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {type === "images" ? (
            <SafeImage
              src={item.url}
              alt={item.name || `Image ${index + 1}`}
              className="w-full h-full object-cover rounded-md"
              draggable={false}
              fallbackSrc="/placeholder.svg"
            />
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#EFE6D6]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1A1A] truncate">
                  {item.name || `Document ${index + 1}`}
                </p>
                <p className="text-xs text-[#1A1A1A]/70">
                  Drag to reorder
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DraggableMediaGrid;