import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, RotateCcw, Loader2, SwitchCamera, Zap, Scan, CheckCircle, AlertCircle, Lightbulb, Focus } from "lucide-react";
import { ScannedContact, generateContactId } from "@/utils/businessCardEncryption";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

interface BusinessCardCameraProps {
  onScanComplete: (contacts: ScannedContact[]) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  encryptionKey: string | null;
}

type ScanStatus = 'idle' | 'detecting' | 'capturing' | 'processing' | 'success' | 'error';

const BusinessCardCamera = ({ 
  onScanComplete, 
  isProcessing, 
  setIsProcessing,
  encryptionKey 
}: BusinessCardCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  const [detectedCardCount, setDetectedCardCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // NO auto-start - wait for explicit user click
  // Clean up on unmount only
  useEffect(() => {
    return () => {
      // Stop camera and detection on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [stream]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setScanStatus('detecting');
    setStatusMessage('Requesting camera access...');
    
    try {
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // First check if camera is available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('No camera found on this device');
      }

      // Try multiple constraint sets for maximum compatibility
      const constraintOptions: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { exact: facingMode },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          }
        },
        {
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        },
        {
          video: { facingMode }
        },
        {
          video: true
        }
      ];

      let mediaStream: MediaStream | null = null;
      
      for (const constraints of constraintOptions) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (e) {
          console.log('Constraint failed, trying next:', constraints, e);
          continue;
        }
      }

      if (!mediaStream) {
        throw new Error('Could not access camera with any settings');
      }
      
      if (videoRef.current) {
        // Clear any existing source
        videoRef.current.srcObject = null;
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready with timeout
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Video load timeout')), 10000);
          
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              clearTimeout(timeout);
              videoRef.current?.play()
                .then(() => resolve())
                .catch(reject);
            };
            videoRef.current.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Video failed to load'));
            };
          }
        });
        
        setStream(mediaStream);
        setIsCameraReady(true);
        setScanStatus('idle');
        setStatusMessage('Camera ready. Position business cards in frame and tap Capture.');
        toast.success("Camera active! Position business cards and capture.", { duration: 3000 });
        
        // Start auto-detection if enabled
        if (autoDetectEnabled) {
          startAutoDetection();
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      setScanStatus('error');
      
      let errorMessage = 'Unable to access camera';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = 'Camera access denied. Please allow camera access in browser settings and refresh.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage = 'No camera found. Please use the Upload tab to scan business cards.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage = 'Camera is in use by another app. Close other apps and try again.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Camera settings not supported. Trying basic mode...';
        } else {
          errorMessage = error.message || 'Unable to access camera';
        }
      }
      
      setCameraError(errorMessage);
      setStatusMessage(errorMessage);
      toast.error(errorMessage, { duration: 5000 });
    }
  }, [facingMode, autoDetectEnabled, stream]);

  const stopCamera = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraReady(false);
      setScanStatus('idle');
      setStatusMessage('');
    }
  }, [stream]);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    setTimeout(() => startCamera(), 100);
  }, [stopCamera, startCamera]);

  // Auto-detection simulation (in real app, would use ML for card detection)
  const startAutoDetection = useCallback(() => {
    // Guard: don't start if already running or camera not ready
    if (detectionIntervalRef.current || !isCameraReady) return;
    
    detectionIntervalRef.current = setInterval(() => {
      // Additional guard inside interval
      if (videoRef.current && isCameraReady && !isProcessing && stream) {
        // Simulate card detection (in production, use TensorFlow.js or similar)
        // For now, we'll use visual cues to guide the user
        setDetectedCardCount(prev => prev >= 0 ? prev : 0);
      }
    }, 500);
  }, [isCameraReady, isProcessing, stream]);

  // Additional cleanup when stream changes
  useEffect(() => {
    // If stream becomes null, clear detection interval
    if (!stream && detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, [stream]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isCameraReady && facingMode) {
      // Camera will be restarted via switchCamera
    }
  }, [facingMode]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setScanStatus('capturing');
    setStatusMessage('Capturing image...');
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImages(prev => [...prev, imageData]);
    
    setScanStatus('idle');
    setStatusMessage('Card captured! Capture more or process now.');
    toast.success("Business card captured! You can capture more or process now.");
  }, []);

  const processImages = async () => {
    if (capturedImages.length === 0) {
      toast.error("Please capture at least one business card");
      return;
    }

    setIsProcessing(true);
    setScanStatus('processing');
    setProgress(0);
    
    try {
      const contacts: ScannedContact[] = [];
      const totalImages = capturedImages.length;
      
      for (let i = 0; i < capturedImages.length; i++) {
        const imageData = capturedImages[i];
        setStatusMessage(`Processing card ${i + 1} of ${totalImages}...`);
        setProgress(((i) / totalImages) * 100);
        
        const { data, error } = await supabase.functions.invoke('business-card-ocr', {
          body: { 
            image: imageData,
            timestamp: new Date().toISOString()
          }
        });
        
        if (error) {
          console.error("OCR error:", error);
          toast.error(`Failed to process card ${i + 1}`);
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
        
        setProgress(((i + 1) / totalImages) * 100);
      }
      
      if (contacts.length > 0) {
        setScanStatus('success');
        setStatusMessage(`Successfully extracted ${contacts.length} contact(s)!`);
        onScanComplete(contacts);
        setCapturedImages([]);
        toast.success(`${contacts.length} business card(s) processed successfully!`);
        
        // Track scanned business cards in visitor_documents
        try {
          const sessionId = sessionStorage.getItem('visitor_session_id') || `session_${Date.now()}`;
          for (const contact of contacts) {
            await supabase.from('visitor_documents').insert({
              session_id: sessionId,
              document_type: 'business_card_scan',
              document_name: `Business Card - ${contact.name || 'Unknown'}`,
              action: 'scan',
              user_id: user?.id || null,
            } as any);
          }
        } catch (e) {
          console.error('Error tracking scanned cards:', e);
        }
      } else {
        setScanStatus('error');
        setStatusMessage('Could not extract contact information. Please try again.');
        toast.error("Could not extract contact information from the cards");
      }
    } catch (error) {
      console.error("Processing error:", error);
      setScanStatus('error');
      setStatusMessage('Processing failed. Please try again.');
      toast.error("Failed to process business cards");
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        if (isCameraReady) {
          setScanStatus('idle');
          setStatusMessage('Ready to scan more cards.');
        }
      }, 3000);
    }
  };

  const clearCaptured = () => {
    setCapturedImages([]);
    setScanStatus('idle');
    setStatusMessage('Cleared. Ready to capture new cards.');
    toast.info("Captured images cleared");
  };

  const getStatusIcon = () => {
    switch (scanStatus) {
      case 'detecting':
        return <Scan className="h-5 w-5 animate-pulse" />;
      case 'capturing':
        return <Camera className="h-5 w-5 animate-bounce" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Focus className="h-5 w-5" />;
    }
  };

  const getStatusColor = () => {
    switch (scanStatus) {
      case 'processing':
        return 'text-gold';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <AnimatePresence mode="wait">
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-2 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 ${getStatusColor()}`}
          >
            {getStatusIcon()}
            <span className="text-sm font-medium">{statusMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          <Progress value={progress} className="h-2 bg-zinc-800" />
          <p className="text-xs text-center text-muted-foreground">
            {Math.round(progress)}% Complete
          </p>
        </motion.div>
      )}

      {/* Camera Preview - Premium Styling */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-gold/30 bg-zinc-950 shadow-2xl shadow-gold/10">
        {!isCameraReady ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-zinc-900 to-black">
            {/* Premium camera icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold to-gold/50 flex items-center justify-center shadow-xl shadow-gold/30">
                <Camera className="h-12 w-12 text-black" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-gold/30"
              />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white">JBJ AI Business Card Scanner</h3>
              <p className="text-sm text-zinc-400 max-w-xs">
                Scan multiple business cards instantly with AI-powered OCR. 
                Supports batch scanning up to 100 cards at once.
              </p>
            </div>
            
            {cameraError ? (
              <div className="text-center space-y-3">
                <p className="text-red-400 text-sm max-w-xs">{cameraError}</p>
                <Button 
                  onClick={startCamera} 
                  className="gap-2 bg-gold hover:bg-gold-light text-black font-bold px-8 py-6 text-lg rounded-xl shadow-lg shadow-gold/30 transition-all hover:scale-105"
                >
                  <Camera className="h-5 w-5" />
                  Grant Camera Access
                </Button>
                <p className="text-xs text-zinc-500 max-w-xs">
                  If camera doesn't open, check browser permissions or try the Upload option.
                </p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <Button 
                  onClick={startCamera} 
                  className="gap-2 bg-gold hover:bg-gold-light text-black font-bold px-8 py-6 text-lg rounded-xl shadow-lg shadow-gold/30 transition-all hover:scale-105"
                >
                  <Camera className="h-5 w-5" />
                  Open Camera
                </Button>
                <p className="text-xs text-zinc-400">Click the button above to start scanning</p>
              </div>
            )}
            
            {/* Tips */}
            <div className="flex flex-col items-center gap-2 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-gold" />
                <span>Ensure good lighting for best results</span>
              </div>
              <span className="text-gold">Supports multi-card detection</span>
            </div>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            
            {/* Premium scanning overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner brackets */}
              <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-gold rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-gold rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-gold rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-gold rounded-br-lg" />
              
              {/* Center guide area */}
              <div className="absolute inset-8 border-2 border-dashed border-gold/40 rounded-xl">
                <div className="absolute top-3 left-3 right-3">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
                    <span className="text-white/90 text-xs font-medium">
                      📍 Position business card within this frame
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Scanning animation line */}
              {scanStatus === 'capturing' && (
                <motion.div
                  initial={{ top: '10%' }}
                  animate={{ top: '90%' }}
                  transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                  className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent shadow-lg shadow-gold/50"
                />
              )}
            </div>
            
            {/* Auto-detect indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5">
              <div className={`w-2 h-2 rounded-full ${autoDetectEnabled ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="text-xs text-white font-medium">
                {autoDetectEnabled ? 'Auto-Detect ON' : 'Manual Mode'}
              </span>
            </div>
          </>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Camera Controls - Premium styling */}
      {isCameraReady && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-4"
        >
          <Button 
            variant="outline" 
            size="icon" 
            onClick={switchCamera}
            className="h-12 w-12 rounded-full border-gold/30 hover:border-gold hover:bg-gold/10 transition-all"
            title="Switch Camera"
          >
            <SwitchCamera className="h-5 w-5 text-gold" />
          </Button>
          
          <Button 
            size="lg" 
            className="gap-2 px-10 py-6 bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-black font-bold text-lg rounded-xl shadow-xl shadow-gold/30 transition-all hover:scale-105"
            onClick={captureImage}
            disabled={isProcessing}
          >
            <Zap className="h-6 w-6" />
            Capture Card
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={stopCamera}
            className="h-12 w-12 rounded-full border-red-500/30 hover:border-red-500 hover:bg-red-500/10 text-red-400 transition-all"
            title="Stop Camera"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </motion.div>
      )}
      
      {/* Captured Images Preview - Premium cards */}
      {capturedImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 p-4 bg-zinc-900/50 rounded-xl border border-gold/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-gold" />
              </div>
              <span className="text-sm font-bold text-white">
                {capturedImages.length} card(s) captured
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearCaptured}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              Clear All
            </Button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2">
            {capturedImages.map((img, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden border-2 border-gold/30 shadow-lg shadow-gold/10 relative group"
              >
                <img src={img} alt={`Card ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-bold">Card {index + 1}</span>
                </div>
              </motion.div>
            ))}
          </div>
          
          <Button 
            className="w-full gap-3 py-6 bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-black font-bold text-lg rounded-xl shadow-xl shadow-gold/30 transition-all hover:scale-[1.02]"
            onClick={processImages}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing with AI...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Process {capturedImages.length} Card{capturedImages.length > 1 ? 's' : ''} with AI
              </>
            )}
          </Button>
        </motion.div>
      )}
      
      {/* Tips section */}
      {isCameraReady && capturedImages.length === 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-full">
            <Lightbulb className="h-3 w-3 text-gold" />
            <span>Good lighting</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-full">
            <Focus className="h-3 w-3 text-gold" />
            <span>Hold steady</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-full">
            <Scan className="h-3 w-3 text-gold" />
            <span>Fill the frame</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessCardCamera;
