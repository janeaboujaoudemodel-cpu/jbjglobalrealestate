import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Camera,
  RotateCcw,
  Loader2,
  SwitchCamera,
  Zap,
  Scan,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Focus,
  X,
} from "lucide-react";
import {
  ScannedContact,
  generateContactId,
} from "@/utils/businessCardEncryption";
import { invalidBusinessCardMessage, isContactSaveable } from "@/utils/businessCardValidation";
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

type ScanStatus =
  | "idle"
  | "detecting"
  | "capturing"
  | "processing"
  | "success"
  | "error";

// Rose neon palette (matches scanner brand)
const ACCENT = "#FFFFFF";
const ACCENT_SOFT = "rgba(255,255,255,0.14)";
const ACCENT_BORDER = "rgba(255,255,255,0.45)";
const PANEL_BG =
  "linear-gradient(180deg, rgba(7,16,31,0.96) 0%, rgba(4,7,13,0.98) 100%)";

const BusinessCardCamera = ({
  onScanComplete,
  isProcessing,
  setIsProcessing,
}: BusinessCardCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { user } = useAuth();

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // Hard unmount cleanup — uses ref so we never re-trigger on state churn.
  useEffect(() => {
    return () => {
      const s = streamRef.current;
      if (s) {
        s.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const stopCamera = useCallback(() => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {}
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
    setScanStatus("idle");
    setStatusMessage("");
  }, []);

  const startCamera = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    setCameraError(null);
    setScanStatus("detecting");
    setStatusMessage("Requesting camera access…");

    // Stop any prior stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const attempts: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } } },
      { video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode } },
      { video: true },
    ];

    let mediaStream: MediaStream | null = null;
    let lastErr: unknown = null;
    for (const c of attempts) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(c);
        if (mediaStream) break;
      } catch (e) {
        lastErr = e;
      }
    }

    if (!mediaStream) {
      const err = lastErr as Error | undefined;
      let msg = "Unable to access camera.";
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        msg = "Camera access denied. Allow it in your browser, then try again.";
      } else if (err?.name === "NotFoundError") {
        msg = "No camera found on this device. Use the Upload tab instead.";
      } else if (err?.name === "NotReadableError") {
        msg = "Camera is in use by another app. Close it and try again.";
      } else if (err?.message) {
        msg = err.message;
      }
      setCameraError(msg);
      setScanStatus("error");
      setStatusMessage(msg);
      setStarting(false);
      toast.error(msg, { duration: 5000 });
      return;
    }

    streamRef.current = mediaStream;

    // Reveal the video element first, THEN attach the stream on the next tick
    // so videoRef.current is guaranteed to exist.
    setIsCameraReady(true);
    setStatusMessage("Starting preview…");

    // wait a tick for React to mount the <video>
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const video = videoRef.current;
    if (!video) {
      // Defensive: nothing we can do, stop the stream so the camera light goes off
      mediaStream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setIsCameraReady(false);
      setStarting(false);
      setCameraError("Preview element missing. Please retry.");
      toast.error("Preview element missing. Please retry.");
      return;
    }

    try {
      video.srcObject = mediaStream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      setScanStatus("idle");
      setStatusMessage(
        "Camera ready. Position the card in the frame and tap Capture.",
      );
      toast.success("Camera ready");
    } catch (e) {
      console.error("video.play failed", e);
      // keep stream so user can tap again, but show fallback
      setStatusMessage("Tap the preview to start playback.");
    } finally {
      setStarting(false);
    }
  }, [facingMode, starting]);

  const switchCamera = useCallback(async () => {
    const next: "user" | "environment" = facingMode === "user" ? "environment" : "user";
    // Stop current stream first
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try { videoRef.current.pause(); } catch {}
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);

    setFacingMode(next);
    setStatusMessage(`Switching to ${next === "user" ? "front" : "rear"} camera…`);

    // Try the requested facing mode directly (do not rely on state, which is async)
    setStarting(true);
    setCameraError(null);
    const attempts: MediaStreamConstraints[] = [
      { video: { facingMode: { exact: next } } },
      { video: { facingMode: next, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: next } },
      { video: true },
    ];
    let mediaStream: MediaStream | null = null;
    for (const c of attempts) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(c);
        if (mediaStream) break;
      } catch {}
    }
    if (!mediaStream) {
      setCameraError("Could not switch camera. Your device may only have one camera.");
      setStarting(false);
      toast.error("Couldn't switch camera — only one camera available?");
      return;
    }
    streamRef.current = mediaStream;
    setIsCameraReady(true);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const video = videoRef.current;
    if (video) {
      video.srcObject = mediaStream;
      video.muted = true;
      video.playsInline = true;
      try { await video.play(); } catch {}
    }
    setStatusMessage(`Camera ready (${next === "user" ? "front" : "rear"}).`);
    setStarting(false);
    toast.success(`Switched to ${next === "user" ? "front" : "rear"} camera`);
  }, [facingMode]);

  const captureImage = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) {
      toast.error("Preview not ready yet");
      return;
    }
    setScanStatus("capturing");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImages((p) => [...p, imageData]);
    setScanStatus("idle");
    setStatusMessage("Card captured — capture more or tap Process.");
    toast.success("Captured");
  }, []);

  const processImages = async () => {
    if (capturedImages.length === 0) {
      toast.error("Please capture at least one business card");
      return;
    }

    setIsProcessing(true);
    setScanStatus("processing");
    setProgress(0);

    try {
      const contacts: ScannedContact[] = [];
      const total = capturedImages.length;
      for (let i = 0; i < total; i++) {
        const imageData = capturedImages[i];
        setStatusMessage(`Processing card ${i + 1} of ${total}…`);
        setProgress((i / total) * 100);

        const { data, error } = await supabase.functions.invoke(
          "business-card-ocr",
          { body: { image: imageData, timestamp: new Date().toISOString() } },
        );

        if (error) {
          console.error("OCR error:", error);
          toast.error(`Failed to process card ${i + 1}`);
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
            imagePreview: imageData.substring(0, 100) + "...",
            imageDataUrl: imageData,
            confidence: typeof data.confidence === "number" ? data.confidence : 0,
            contactType: "client",
            labels: [],
            saveStatus: "idle",
          });
        } else if (data?.contact || data?.is_business_card === false) {
          toast.error(data?.reason || invalidBusinessCardMessage, { duration: 5500 });
        }

        setProgress(((i + 1) / total) * 100);
      }

      if (contacts.length > 0) {
        setScanStatus("success");
        setStatusMessage(`Extracted ${contacts.length} contact(s).`);
        onScanComplete(contacts);
        setCapturedImages([]);
        toast.success(`${contacts.length} business card(s) processed`);

        try {
          const sessionId =
            sessionStorage.getItem("visitor_session_id") ||
            `session_${Date.now()}`;
          for (const contact of contacts) {
            await supabase.from("visitor_documents").insert({
              session_id: sessionId,
              document_type: "business_card_scan",
              document_name: `Business Card - ${contact.name || "Unknown"}`,
              action: "scan",
              user_id: user?.id || null,
            } as any);
          }
        } catch (e) {
          console.error("Error tracking scanned cards:", e);
        }
      } else {
        setScanStatus("error");
        setStatusMessage("No business card contact details detected. Try a clearer business card image.");
        toast.error(invalidBusinessCardMessage, { duration: 5500 });
      }
    } catch (error) {
      console.error("Processing error:", error);
      setScanStatus("error");
      setStatusMessage("Processing failed. Please try again.");
      toast.error("Failed to process business cards");
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        if (streamRef.current) {
          setScanStatus("idle");
          setStatusMessage("Ready to scan more cards.");
        }
      }, 2500);
    }
  };

  const clearCaptured = () => {
    setCapturedImages([]);
    setStatusMessage("Cleared. Ready to capture.");
  };

  const StatusIcon = () => {
    switch (scanStatus) {
      case "detecting":
        return <Scan className="h-4 w-4 animate-pulse allow-white" style={{ color: ACCENT }} />;
      case "capturing":
        return <Camera className="h-4 w-4 animate-bounce allow-white" style={{ color: ACCENT }} />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin allow-white" style={{ color: ACCENT }} />;
      case "success":
        return <CheckCircle className="h-4 w-4 allow-white" style={{ color: "#34d399" }} />;
      case "error":
        return <AlertCircle className="h-4 w-4 allow-white" style={{ color: "#f87171" }} />;
      default:
        return <Focus className="h-4 w-4 allow-white" style={{ color: ACCENT }} />;
    }
  };

  return (
    <div
      data-no-contrast-guard
      data-allow-dark-cta
      className="space-y-4"
    >
      {/* Status bar */}
      <AnimatePresence mode="wait">
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg allow-white"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${ACCENT_BORDER}`,
              color: "#FFFFFF",
            }}
          >
            <StatusIcon />
            <span className="text-sm font-medium allow-white" style={{ color: "#FFFFFF" }}>
              {statusMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      {isProcessing && (
        <div className="space-y-1">
          <Progress
            value={progress}
            className="h-1.5"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
          <p className="text-xs text-right allow-white" style={{ color: "rgba(255,255,255,0.7)" }}>
            {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* Preview frame — video element ALWAYS mounted (so videoRef is always live) */}
      <div
        className="relative aspect-[4/3] rounded-xl overflow-hidden"
        style={{
          background: PANEL_BG,
          border: `1px solid ${ACCENT_BORDER}`,
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.18), 0 20px 60px -24px rgba(255,255,255,0.45)",
        }}
      >
        {/* Always-mounted video — hidden when not ready */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
          style={{
            visibility: isCameraReady ? "visible" : "hidden",
            transform: facingMode === "user" ? "scaleX(-1)" : "none",
          }}
        />

        {!isCameraReady && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center"
            style={{
              background:
                "radial-gradient(800px 400px at 50% 0%, rgba(255,255,255,0.18), transparent 60%), " +
                PANEL_BG,
            }}
          >
            {/* Camera badge */}
            <div className="relative">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: ACCENT_SOFT,
                  border: `1px solid ${ACCENT_BORDER}`,
                  boxShadow: `0 0 30px ${ACCENT}55`,
                }}
              >
                <Camera className="h-9 w-9 allow-white" style={{ color: ACCENT }} />
              </div>
              <motion.div
                aria-hidden
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl"
                style={{ border: `1px solid ${ACCENT}` }}
              />
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-base font-semibold allow-white" style={{ color: "#FFFFFF" }}>
                JBJ AI Business Card Scanner
              </h3>
              <p className="text-xs allow-white" style={{ color: "rgba(255,255,255,0.7)" }}>
                Scan front and back, batch up to 100 cards. End-to-end encrypted OCR.
              </p>
            </div>

            {cameraError && (
              <p
                className="text-xs max-w-sm allow-white"
                style={{ color: "#fca5a5" }}
              >
                {cameraError}
              </p>
            )}

            <Button
              onClick={startCamera}
              disabled={starting}
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white gap-2 px-6 py-5 rounded-xl font-semibold"
              style={{
                background: `linear-gradient(135deg, ${ACCENT} 0%, #022c1c 100%)`,
                color: "#FFFFFF",
                border: `1px solid ${ACCENT_BORDER}`,
                boxShadow: `0 14px 36px -14px ${ACCENT}88`,
              }}
            >
              {starting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {cameraError ? "Try again" : "Open Camera"}
            </Button>

            <p className="text-[11px] allow-white" style={{ color: "rgba(255,255,255,0.55)" }}>
              If the camera doesn't open, allow access in your browser or use the Upload tab.
            </p>
          </div>
        )}

        {/* Live overlay (only when ready) */}
        {isCameraReady && (
          <>
            {/* Corner brackets */}
            <div className="pointer-events-none absolute inset-0">
              <div
                className="absolute top-4 left-4 w-10 h-10 rounded-tl-lg"
                style={{ borderLeft: `2px solid ${ACCENT}`, borderTop: `2px solid ${ACCENT}` }}
              />
              <div
                className="absolute top-4 right-4 w-10 h-10 rounded-tr-lg"
                style={{ borderRight: `2px solid ${ACCENT}`, borderTop: `2px solid ${ACCENT}` }}
              />
              <div
                className="absolute bottom-4 left-4 w-10 h-10 rounded-bl-lg"
                style={{ borderLeft: `2px solid ${ACCENT}`, borderBottom: `2px solid ${ACCENT}` }}
              />
              <div
                className="absolute bottom-4 right-4 w-10 h-10 rounded-br-lg"
                style={{ borderRight: `2px solid ${ACCENT}`, borderBottom: `2px solid ${ACCENT}` }}
              />
              <div
                className="absolute inset-8 rounded-xl"
                style={{ border: `1px dashed ${ACCENT_BORDER}` }}
              />
              <div className="absolute top-3 left-1/2 -translate-x-1/2">
                <div
                  className="rounded-full px-3 py-1 text-[11px] font-medium allow-white"
                  style={{
                    background: "rgba(7,16,31,0.78)",
                    border: `1px solid ${ACCENT_BORDER}`,
                    color: "#FFFFFF",
                  }}
                >
                  Position the card in the frame
                </div>
              </div>
            </div>

            {/* Live indicator */}
            <div
              className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 allow-white"
              style={{
                background: "rgba(7,16,31,0.78)",
                border: `1px solid ${ACCENT_BORDER}`,
                color: "#FFFFFF",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#34d399" }}
              />
              <span className="text-[10px] font-medium tracking-wide allow-white" style={{ color: "#FFFFFF" }}>
                LIVE
              </span>
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Live controls */}
      {isCameraReady && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3"
        >
          <Button
            onClick={switchCamera}
            data-allow-dark-cta
            data-no-contrast-guard
            className="allow-white h-11 w-11 p-0 rounded-full"
            style={{
              background: "rgba(7,16,31,0.92)",
              border: `1px solid ${ACCENT_BORDER}`,
              color: "#FFFFFF",
              boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.18)`,
            }}
            title="Switch camera"
          >
            <SwitchCamera className="h-4 w-4 allow-white" style={{ color: "#FFFFFF" }} />
          </Button>

          <Button
            onClick={captureImage}
            disabled={isProcessing}
            data-allow-dark-cta
            data-no-contrast-guard
            className="allow-white gap-2 h-12 px-7 rounded-xl font-semibold"
            style={{
              background: `linear-gradient(135deg, ${ACCENT} 0%, #022c1c 100%)`,
              color: "#FFFFFF",
              border: `1px solid ${ACCENT_BORDER}`,
              boxShadow: `0 14px 36px -14px ${ACCENT}88`,
            }}
          >
            <Zap className="h-4 w-4" />
            Capture Card
          </Button>

          <Button
            onClick={stopCamera}
            data-allow-dark-cta
            data-no-contrast-guard
            className="allow-white h-11 w-11 p-0 rounded-full"
            style={{
              background: "rgba(7,16,31,0.92)",
              border: "1px solid rgba(248,113,113,0.65)",
              color: "#fca5a5",
              boxShadow: `inset 0 0 0 1px rgba(248,113,113,0.2)`,
            }}
            title="Stop camera"
          >
            <X className="h-4 w-4 allow-white" style={{ color: "#fca5a5" }} />
          </Button>
        </motion.div>
      )}

      {/* Captured previews */}
      {capturedImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 p-3 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${ACCENT_BORDER}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: ACCENT_SOFT, border: `1px solid ${ACCENT_BORDER}` }}
              >
                <CheckCircle className="h-3.5 w-3.5 allow-white" style={{ color: ACCENT }} />
              </div>
              <span className="text-sm font-semibold allow-white" style={{ color: "#FFFFFF" }}>
                {capturedImages.length} card(s) captured
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCaptured}
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white h-8 px-3"
              style={{ color: "#fca5a5" }}
            >
              Clear
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {capturedImages.map((img, i) => (
              <div
                key={i}
                className="relative flex-shrink-0 w-24 h-16 rounded-md overflow-hidden"
                style={{ border: `1px solid ${ACCENT_BORDER}` }}
              >
                <img src={img} alt={`Card ${i + 1}`} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
              </div>
            ))}
          </div>

          <Button
            onClick={processImages}
            disabled={isProcessing}
            data-allow-dark-cta
            data-no-contrast-guard
            className="allow-white w-full gap-2 h-11 rounded-xl font-semibold"
            style={{
              background: `linear-gradient(135deg, ${ACCENT} 0%, #022c1c 100%)`,
              color: "#FFFFFF",
              border: `1px solid ${ACCENT_BORDER}`,
              boxShadow: `0 14px 36px -14px ${ACCENT}88`,
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Process {capturedImages.length} card{capturedImages.length > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Tips */}
      {isCameraReady && capturedImages.length === 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { icon: Lightbulb, label: "Good lighting" },
            { icon: Focus, label: "Hold steady" },
            { icon: Scan, label: "Fill the frame" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full allow-white"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${ACCENT_BORDER}`,
                color: "#FFFFFF",
              }}
            >
              <Icon className="h-3 w-3 allow-white" style={{ color: ACCENT }} />
              <span className="text-[11px] font-medium allow-white" style={{ color: "#FFFFFF" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessCardCamera;
