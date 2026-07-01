import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Loader2, X, Image as ImageIcon, Zap } from "lucide-react";
import { ScannedContact, generateContactId } from "@/utils/businessCardEncryption";
import { invalidBusinessCardMessage, isContactSaveable } from "@/utils/businessCardValidation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BusinessCardUploadProps {
  onScanComplete: (contacts: ScannedContact[]) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  encryptionKey: string | null;
}

const BusinessCardUpload = ({ 
  onScanComplete, 
  isProcessing, 
  setIsProcessing,
  encryptionKey 
}: BusinessCardUploadProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { user } = useAuth();

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const validFiles: File[] = [];
    const newPreviews: string[] = [];
    
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return;
      }
      
      validFiles.push(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          if (newPreviews.length === validFiles.length) {
            setPreviews(prev => [...prev, ...newPreviews]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setPreviews([]);
  };

  const processImages = async () => {
    if (previews.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    setIsProcessing(true);
    
    try {
      const contacts: ScannedContact[] = [];
      
      for (const preview of previews) {
        const { data, error } = await supabase.functions.invoke('business-card-ocr', {
          body: { 
            image: preview,
            timestamp: new Date().toISOString()
          }
        });
        
        if (error) {
          console.error("OCR error:", error);
          toast.error("Failed to process one of the cards");
          continue;
        }
        
        if (data?.contact && data?.is_business_card !== false && isContactSaveable(data.contact)) {
          const c = data.contact;
          contacts.push({
            ...c,
            id: generateContactId(),
            jobTitle: c.title || c.jobTitle || "",
            company: c.company_name || c.company || "",
            phone: c.mobile || c.phone || "",
            scannedAt: new Date().toISOString(),
            imagePreview: preview.substring(0, 100) + '...',
            imageDataUrl: preview,
            confidence: typeof data.confidence === "number" ? data.confidence : 0,
            contactType: "client",
            labels: [],
            saveStatus: "idle",
          });
        } else if (data?.contact || data?.is_business_card === false) {
          toast.error(data?.reason || invalidBusinessCardMessage, { duration: 5500 });
        }
      }
      
      if (contacts.length > 0) {
        onScanComplete(contacts);
        clearAll();
        
        // Track scanned business cards in visitor_documents
        try {
          const sessionId = sessionStorage.getItem('visitor_session_id') || `session_${Date.now()}`;
          for (const contact of contacts) {
            await supabase.from('visitor_documents').insert({
              session_id: sessionId,
              document_type: 'business_card_upload',
              document_name: `Business Card - ${contact.name || 'Unknown'}`,
              action: 'upload_scan',
              user_id: user?.id || null,
            } as any);
          }
        } catch (e) {
          console.error('Error tracking uploaded cards:', e);
        }
      } else {
        toast.error(invalidBusinessCardMessage, { duration: 5500 });
      }
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Failed to process business cards");
    } finally {
      setIsProcessing(false);
    }
  };

  const ACCENT = "#FFFFFF";
  const ACCENT_BORDER = "rgba(255,255,255,0.55)";

  return (
    <div className="space-y-4" data-no-contrast-guard data-allow-dark-cta>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bcs-drop rounded-xl p-8 text-center transition-colors flex items-center justify-center min-h-[460px] ${isDragging ? "is-dragging" : ""}`}
        style={{
          border: `2px dashed ${ACCENT_BORDER}`,
          background: isDragging ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.03)",
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="business-card-upload"
        />

        <label
          htmlFor="business-card-upload"
          className="cursor-pointer flex flex-col items-center gap-4"
        >
          <div
            className="p-4 rounded-full"
            style={{
              background: "rgba(255,255,255,0.14)",
              border: `1px solid ${ACCENT_BORDER}`,
              boxShadow: `0 0 24px ${ACCENT}33`,
            }}
          >
            <Upload className="h-8 w-8 allow-white" style={{ color: ACCENT }} />
          </div>
          <div>
            <p className="font-medium allow-white" style={{ color: "#FFFFFF" }}>Drop business cards here</p>
            <p className="bcs-drop-sub text-sm allow-white" style={{ color: "rgba(255,255,255,0.72)" }}>
              or click to browse (JPG, PNG, HEIC - max 10MB each)
            </p>
          </div>
          <Button
            type="button"
            data-allow-dark-cta
            data-no-contrast-guard
            className="allow-white gap-2"
            style={{
              background: `linear-gradient(135deg, ${ACCENT} 0%, #022c1c 100%)`,
              color: "#FFFFFF",
              border: `1px solid ${ACCENT_BORDER}`,
              boxShadow: `0 12px 30px -14px ${ACCENT}88`,
            }}
          >
            <ImageIcon className="h-4 w-4" />
            Select Images
          </Button>
        </label>
      </div>

      {/* Selected Files Preview */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium allow-white" style={{ color: "#FFFFFF" }}>
              {previews.length} image(s) selected
            </span>
            <Button
              size="sm"
              data-allow-dark-cta
              data-no-contrast-guard
              onClick={clearAll}
              className="allow-white h-8"
              style={{ background: "transparent", color: "#fca5a5", border: `1px solid ${ACCENT_BORDER}` }}
            >
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative aspect-[3/2] rounded-lg overflow-hidden group"
                style={{ border: `1px solid ${ACCENT_BORDER}` }}
              >
                <img
                  src={preview}
                  alt={`Card ${index + 1}`}
                  className="w-full h-full object-cover"
                 loading="lazy" decoding="async" />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: ACCENT, color: "#FFFFFF" }}
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
                <div
                  className="absolute bottom-0 left-0 right-0 text-xs p-1 text-center allow-white"
                  style={{ background: "rgba(7,16,31,0.7)", color: "#FFFFFF" }}
                >
                  Card {index + 1}
                </div>
              </div>
            ))}
          </div>

          <Button
            data-allow-dark-cta
            data-no-contrast-guard
            className="allow-white w-full gap-2 h-11 rounded-xl font-semibold"
            style={{
              background: `linear-gradient(135deg, ${ACCENT} 0%, #022c1c 100%)`,
              color: "#FFFFFF",
              border: `1px solid ${ACCENT_BORDER}`,
              boxShadow: `0 14px 36px -14px ${ACCENT}88`,
            }}
            onClick={processImages}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing with AI...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Process {previews.length} Card(s)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BusinessCardUpload;
