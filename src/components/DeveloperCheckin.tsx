import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  MapPin, 
  Camera, 
  Clock, 
  CheckCircle2, 
  LogIn, 
  LogOut,
  Pencil,
  Phone,
  MessageCircle,
  Navigation
} from "lucide-react";
import { toast } from "sonner";

interface Developer {
  id: string;
  name: string;
  location: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface SalesRep {
  id: string;
  full_name: string;
  phone_e164: string;
  whatsapp_number: string | null;
  email: string | null;
  title: string | null;
}

interface CheckinSession {
  id: string;
  check_in_time: string;
  check_out_time: string | null;
  developer_id: string;
}

interface DeveloperCheckinProps {
  developer: Developer;
  salesReps: SalesRep[];
  activeCheckin?: CheckinSession | null;
  onCheckinComplete?: () => void;
}

const DeveloperCheckin = ({ developer, salesReps, activeCheckin, onCheckinComplete }: DeveloperCheckinProps) => {
  const { user } = useAuth();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [notes, setNotes] = useState("");
  const [confirmStatement, setConfirmStatement] = useState(false);
  const [signatureData, setSignatureData] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true }
      );
    });
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCheckin = async () => {
    if (!user || !confirmStatement) {
      toast.error("Please confirm the statement before checking in");
      return;
    }

    setIsCheckingIn(true);
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);

      const { error } = await supabase.from('developer_visit_checkins').insert({
        user_id: user.id,
        developer_id: developer.id,
        check_in_latitude: loc.lat,
        check_in_longitude: loc.lng,
        check_in_photo_url: photoPreview,
        notes,
        confirmation_statement: confirmStatement
      });

      if (error) throw error;

      // Award points for check-in
      await supabase.from('points_transactions').insert({
        user_id: user.id,
        points: 25,
        transaction_type: 'developer_visit_checkin',
        description: `Checked in at ${developer.name}`,
        reference_type: 'developer_visit'
      });

      toast.success(`Checked in at ${developer.name}! +25 points`);
      setIsDialogOpen(false);
      onCheckinComplete?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to check in");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckout = async () => {
    if (!user || !activeCheckin) return;
    
    setIsCheckingOut(true);
    try {
      const loc = await getCurrentLocation();
      
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas?.toDataURL() || "";

      const { error } = await supabase
        .from('developer_visit_checkins')
        .update({
          check_out_time: new Date().toISOString(),
          check_out_latitude: loc.lat,
          check_out_longitude: loc.lng,
          check_out_photo_url: photoPreview,
          signature_data: signatureDataUrl,
          notes
        })
        .eq('id', activeCheckin.id);

      if (error) throw error;

      // Award points for checkout
      await supabase.from('points_transactions').insert({
        user_id: user.id,
        points: 25,
        transaction_type: 'developer_visit_checkout',
        description: `Checked out from ${developer.name}`,
        reference_type: 'developer_visit'
      });

      toast.success(`Checked out from ${developer.name}! +25 points`);
      setIsDialogOpen(false);
      onCheckinComplete?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to check out");
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Canvas drawing handlers
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const openGoogleMaps = () => {
    if (developer.latitude && developer.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${developer.latitude},${developer.longitude}`, '_blank');
    } else if (developer.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(developer.address)}`, '_blank');
    }
  };

  const primaryRep = salesReps.find(r => r.title?.toLowerCase().includes('primary')) || salesReps[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{developer.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {developer.location}
            </CardDescription>
          </div>
          {activeCheckin && (
            <Badge variant="secondary" className="jj-surface-emerald-soft text-[color:var(--emerald-1)]">
              <Clock className="h-3 w-3 mr-1" />
              Checked In
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sales Rep Contact */}
        {primaryRep && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">{primaryRep.full_name}</p>
              <p className="text-xs text-muted-foreground">{primaryRep.title || 'Sales Representative'}</p>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" asChild>
                <a href={`tel:${primaryRep.phone_e164}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
              {primaryRep.whatsapp_number && (
                <Button size="icon" variant="outline" className="text-[color:var(--emerald-1)]" asChild>
                  <a href={`https://wa.me/${primaryRep.whatsapp_number.replace(/\D/g, '')}`} target="_blank">
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={openGoogleMaps}>
            <Navigation className="h-4 w-4 mr-2" />
            Directions
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1" variant={activeCheckin ? "destructive" : "default"}>
                {activeCheckin ? (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Check Out
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Check In
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {activeCheckin ? 'Check Out' : 'Check In'} - {developer.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Photo Capture */}
                <div>
                  <Label className="mb-2 block">Capture Photo</Label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full h-32 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="h-full object-cover rounded"  loading="lazy" decoding="async" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Camera className="h-8 w-8 mb-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Tap to capture photo</span>
                      </div>
                    )}
                  </Button>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about your visit..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Signature (for checkout) */}
                {activeCheckin && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Signature</Label>
                      <Button variant="ghost" size="sm" onClick={clearSignature}>
                        <Pencil className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                    <canvas
                      ref={canvasRef}
                      width={300}
                      height={150}
                      className="border rounded-lg w-full touch-none bg-[#FDFBF7]"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                )}

                {/* Confirmation Statement */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="confirm"
                    checked={confirmStatement}
                    onCheckedChange={(checked) => setConfirmStatement(checked as boolean)}
                  />
                  <Label htmlFor="confirm" className="text-sm leading-tight">
                    I confirm that all the information provided above is correct and accurate.
                  </Label>
                </div>

                <Button
                  className="w-full"
                  onClick={activeCheckin ? handleCheckout : handleCheckin}
                  disabled={(activeCheckin ? isCheckingOut : isCheckingIn) || !confirmStatement}
                >
                  {activeCheckin ? (
                    isCheckingOut ? "Checking out..." : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Complete Check Out
                      </>
                    )
                  ) : (
                    isCheckingIn ? "Checking in..." : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Complete Check In
                      </>
                    )
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeveloperCheckin;
