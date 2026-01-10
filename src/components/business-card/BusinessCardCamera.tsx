import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, RotateCcw, Loader2, SwitchCamera, Zap } from "lucide-react";
import { ScannedContact, generateContactId } from "@/utils/businessCardEncryption";
import { supabase } from "@/integrations/supabase/client";

interface BusinessCardCameraProps {
  onScanComplete: (contacts: ScannedContact[]) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  encryptionKey: string | null;
}

const BusinessCardCamera = ({ 
  onScanComplete, 
  isProcessing, 
  setIsProcessing,
  encryptionKey 
}: BusinessCardCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [capturedImages, setCapturedImages] = useState<string[]>([]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setStream(mediaStream);
        setIsCameraReady(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Unable to access camera. Please check permissions.");
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraReady(false);
    }
  }, [stream]);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  }, [stopCamera]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (facingMode && !stream) {
      // Don't auto-start - user must click to start
    }
  }, [facingMode]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImages(prev => [...prev, imageData]);
    toast.success("Card captured! You can capture more or process now.");
  }, []);

  const processImages = async () => {
    if (capturedImages.length === 0) {
      toast.error("Please capture at least one business card");
      return;
    }

    setIsProcessing(true);
    
    try {
      const contacts: ScannedContact[] = [];
      
      for (const imageData of capturedImages) {
        const { data, error } = await supabase.functions.invoke('business-card-ocr', {
          body: { 
            image: imageData,
            timestamp: new Date().toISOString()
          }
        });
        
        if (error) {
          console.error("OCR error:", error);
          toast.error("Failed to process one of the cards");
          continue;
        }
        
        if (data?.contact) {
          contacts.push({
            ...data.contact,
            id: generateContactId(),
            scannedAt: new Date().toISOString(),
            imagePreview: imageData.substring(0, 100) + '...',
            confidence: data.confidence || 0.85
          });
        }
      }
      
      if (contacts.length > 0) {
        onScanComplete(contacts);
        setCapturedImages([]);
      } else {
        toast.error("Could not extract contact information from the cards");
      }
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Failed to process business cards");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearCaptured = () => {
    setCapturedImages([]);
    toast.info("Captured images cleared");
  };

  return (
    <div className="space-y-4">
      {/* Camera Preview */}
      <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
        {!isCameraReady ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Camera className="h-12 w-12 text-muted-foreground" />
            <Button onClick={startCamera} className="gap-2">
              <Camera className="h-4 w-4" />
              Start Camera
            </Button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Camera overlay guide */}
            <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-lg pointer-events-none">
              <div className="absolute top-2 left-2 text-white/70 text-xs bg-black/30 px-2 py-1 rounded">
                Align business card within frame
              </div>
            </div>
          </>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Camera Controls */}
      {isCameraReady && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="icon" onClick={switchCamera}>
            <SwitchCamera className="h-4 w-4" />
          </Button>
          <Button 
            size="lg" 
            className="gap-2 px-8"
            onClick={captureImage}
            disabled={isProcessing}
          >
            <Zap className="h-5 w-5" />
            Capture Card
          </Button>
          <Button variant="outline" size="icon" onClick={stopCamera}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Captured Images Preview */}
      {capturedImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {capturedImages.length} card(s) captured
            </span>
            <Button variant="ghost" size="sm" onClick={clearCaptured}>
              Clear
            </Button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {capturedImages.map((img, index) => (
              <div 
                key={index}
                className="flex-shrink-0 w-24 h-16 rounded-md overflow-hidden border"
              >
                <img src={img} alt={`Card ${index + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          
          <Button 
            className="w-full gap-2"
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
                Process {capturedImages.length} Card(s)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BusinessCardCamera;
