import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  MapPin, 
  Camera, 
  Loader2, 
  CheckCircle, 
  RefreshCw,
  AlertCircle
} from "lucide-react";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface SiteCheckInProps {
  developerId: string;
  developerName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SiteCheckIn({ developerId, developerName, onSuccess, onCancel }: SiteCheckInProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const [selfieData, setSelfieData] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get GPS location
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        setLocationError(
          error.code === 1
            ? "Location permission denied. Please enable location access."
            : "Failed to get location. Please try again."
        );
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError("Failed to access camera. Please grant camera permission.");
    }
  };

  // Capture selfie
  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setSelfieData(dataUrl);
      
      // Stop camera
      const stream = video.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  // Reset selfie
  const resetSelfie = () => {
    setSelfieData(null);
  };

  // Submit check-in
  const handleSubmit = async () => {
    if (!user || !location || !selfieData) {
      toast.error("Please capture both location and selfie");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload selfie to storage
      const fileName = `checkins/${user.id}/${Date.now()}.jpg`;
      const base64Data = selfieData.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });

      const { error: uploadError } = await supabase.storage
        .from("checkin-selfies")
        .upload(fileName, blob);

      // Get public URL (or use path if bucket doesn't exist)
      let selfieUrl = fileName;
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("checkin-selfies")
          .getPublicUrl(fileName);
        selfieUrl = urlData.publicUrl;
      }

      // Create check-in record using actual schema columns
      const { error } = await supabase.from("developer_visit_checkins").insert({
        user_id: user.id,
        developer_id: developerId,
        checkin_type: "gps_selfie",
        check_in_latitude: location.latitude,
        check_in_longitude: location.longitude,
        location_accuracy_m: location.accuracy,
        selfie_url: selfieUrl,
        check_in_time: new Date().toISOString(),
        notes: notes || null,
        points_awarded: 30, // As per points_config
      });

      if (error) throw error;

      toast.success("Check-in successful! You earned 30 points.");
      onSuccess?.();
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("Failed to complete check-in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = location && selfieData && !isSubmitting;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MapPin className="h-5 w-5 text-primary" />
          Site Check-In: {developerName}
        </CardTitle>
        <CardDescription>
          Capture your location and selfie to verify your visit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Section */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            GPS Location
          </Label>
          
          {location ? (
            <div className="p-3 rounded-lg jj-surface-emerald-soft border border-[color:var(--emerald-1)]/30/30">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Location captured</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                <br />
                Accuracy: ±{Math.round(location.accuracy)}m
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={getLocation}
                className="mt-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {locationError && (
                <div className="p-2 rounded bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {locationError}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={getLocation}
                disabled={isGettingLocation}
                className="w-full"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Capture Location
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Camera/Selfie Section */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Selfie Verification
          </Label>
          
          {selfieData ? (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border border-[color:var(--emerald-1)]/30/30">
                <img
                  src={selfieData}
                  alt="Selfie"
                  className="w-full h-48 object-cover"
                 loading="lazy" decoding="async" />
                <div className="absolute top-2 right-2">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetSelfie}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retake
              </Button>
            </div>
          ) : isCameraActive ? (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border border-border">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-48 object-cover"
                />
              </div>
              <Button type="button" onClick={captureSelfie} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {cameraError && (
                <div className="p-2 rounded bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {cameraError}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={startCamera}
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Notes Section */}
        <div className="space-y-2">
          <Label htmlFor="notes">Visit Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any observations or notes about your visit..."
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Check-In
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
