import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Calendar, Clock, MapPin, Camera, Navigation, CheckCircle, Loader2,
  Building2, AlertTriangle, User, Send
} from 'lucide-react';

const BriefingAttendance = () => {
  const { briefingId } = useParams<{ briefingId: string }>();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [briefing, setBriefing] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // RSVP state
  const [rsvpStatus, setRsvpStatus] = useState('attending');
  const [lateReason, setLateReason] = useState('');
  const [expectedTime, setExpectedTime] = useState('');
  const [submittingRsvp, setSubmittingRsvp] = useState(false);

  // Selfie state
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [streamRef, setStreamRef] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (briefingId && user) loadData();
  }, [briefingId, user]);

  useEffect(() => {
    return () => {
      if (streamRef) streamRef.getTracks().forEach(t => t.stop());
    };
  }, [streamRef]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: bData } = await supabase.from('briefing_requests').select('*').eq('id', briefingId).single();
      setBriefing(bData);

      if (user) {
        const { data: aData } = await supabase.from('briefing_attendance').select('*')
          .eq('briefing_request_id', briefingId).eq('broker_id', user.id).maybeSingle();
        setAttendance(aData);
        if (aData) setRsvpStatus(aData.rsvp_status || 'attending');
      }
    } catch (err) {
      console.error('Error loading briefing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async () => {
    if (!user || !briefingId) return;
    setSubmittingRsvp(true);
    try {
      if (attendance) {
        await supabase.from('briefing_attendance').update({
          rsvp_status: rsvpStatus,
          late_reason: rsvpStatus === 'late' ? lateReason : null,
          expected_arrival_time: rsvpStatus === 'late' ? expectedTime : null,
        } as any).eq('id', attendance.id);
      } else {
        await supabase.from('briefing_attendance').insert({
          briefing_request_id: briefingId,
          broker_id: user.id,
          rsvp_status: rsvpStatus,
          late_reason: rsvpStatus === 'late' ? lateReason : null,
          expected_arrival_time: rsvpStatus === 'late' ? expectedTime : null,
        } as any);
      }

      // Notify owner
      await supabase.from('user_notifications' as any).insert({
        user_id: '4944592b-93f1-4e05-ab59-4ebe1fee54f1',
        type: 'briefing_rsvp',
        title: `Broker RSVP: ${rsvpStatus}`,
        message: `A broker has RSVP'd "${rsvpStatus}" for briefing ${briefing?.project_name || briefingId}${rsvpStatus === 'late' ? `. Reason: ${lateReason}` : ''}`,
        is_read: false,
      }).catch(() => {});

      toast.success('RSVP submitted successfully');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit RSVP');
    } finally {
      setSubmittingRsvp(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreamRef(stream);
      setCameraActive(true);
    } catch (err) {
      toast.error('Camera access denied. Please allow camera permissions.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0);

    // Overlay timestamp + briefing info
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
    ctx.fillStyle = '#FFD700';
    ctx.font = '16px sans-serif';
    ctx.fillText(`${briefing?.project_name || 'Briefing'} — ${briefing?.developer_name || ''}`, 10, canvas.height - 35);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${new Date().toLocaleString()} | Attendance Confirmation`, 10, canvas.height - 15);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);

    // Stop camera
    if (streamRef) streamRef.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  };

  const getGPS = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Location captured');
      },
      (err) => { toast.error('Unable to get location: ' + err.message); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const confirmAttendance = async () => {
    if (!user || !briefingId || !capturedPhoto) {
      toast.error('Please capture a selfie first');
      return;
    }
    if (!gpsLocation) {
      toast.error('Please capture your GPS location');
      return;
    }

    setUploadingSelfie(true);
    try {
      // Upload selfie
      const blob = await fetch(capturedPhoto).then(r => r.blob());
      const path = `${briefingId}/${user.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('briefing-attendance').upload(path, blob);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('briefing-attendance').getPublicUrl(path);

      // Update or insert attendance
      const attendanceData = {
        confirmed_attended: true,
        selfie_url: urlData.publicUrl,
        gps_latitude: gpsLocation.lat,
        gps_longitude: gpsLocation.lng,
        gps_address: gpsLocation.address || `${gpsLocation.lat.toFixed(6)}, ${gpsLocation.lng.toFixed(6)}`,
        confirmed_at: new Date().toISOString(),
        points_earned: 10,
      };

      if (attendance) {
        await supabase.from('briefing_attendance').update(attendanceData as any).eq('id', attendance.id);
      } else {
        await supabase.from('briefing_attendance').insert({
          briefing_request_id: briefingId,
          broker_id: user.id,
          rsvp_status: 'attending',
          ...attendanceData,
        } as any);
      }

      // Notify owner with GPS
      await supabase.from('user_notifications' as any).insert({
        user_id: '4944592b-93f1-4e05-ab59-4ebe1fee54f1',
        type: 'briefing_confirmed',
        title: `Attendance Confirmed: ${briefing?.project_name}`,
        message: `A broker confirmed attendance at ${briefing?.project_name}. GPS: ${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)}. Selfie uploaded.`,
        is_read: false,
      }).catch(() => {});

      toast.success('Attendance confirmed! Points awarded.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm attendance');
    } finally {
      setUploadingSelfie(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)] flex items-center justify-center">
        <Card className="max-w-md w-full border-2 border-gold/30">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-bold text-foreground">Briefing Not Found</h2>
            <p className="text-muted-foreground mt-2">This briefing may have been removed or the link is invalid.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)] flex items-center justify-center">
        <Card className="max-w-md w-full border-2 border-gold/30">
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto text-gold mb-4" />
            <h2 className="text-xl font-bold text-foreground">Sign In Required</h2>
            <p className="text-muted-foreground mt-2">Please sign in to confirm your attendance.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPast = new Date(`${briefing.briefing_date}T${briefing.briefing_time}`) < new Date();
  const isConfirmed = attendance?.confirmed_attended;

  return (
    <>
      <SEOHead title={`Briefing Attendance: ${briefing.project_name}`} description="Confirm your attendance at the briefing session." />
      <div className="min-h-screen bg-gradient-to-b from-[hsl(40,33%,98%)] via-[hsl(38,30%,93%)] to-[hsl(36,25%,88%)]">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Briefing Info Card */}
          <Card className="border-2 border-gold/30 mb-6 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <CardTitle className="text-foreground">{briefing.project_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{briefing.developer_name}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gold" />{briefing.briefing_date}</div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gold" />{briefing.briefing_time} ({briefing.duration_minutes}m)</div>
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="w-4 h-4 text-gold" />
                  {briefing.location_type === 'developer_office' ? `Developer Office${briefing.location_address ? ` — ${briefing.location_address}` : ''}` : 'Our Office'}
                </div>
              </div>
              <div className="mt-3">
                <Badge className={briefing.status === 'approved' ? 'bg-emerald-500/20 text-emerald-700' : 'bg-amber-500/20 text-amber-700'}>
                  {briefing.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Confirmed Badge */}
          {isConfirmed && (
            <Card className="border-2 border-emerald-500/30 bg-emerald-50/50 mb-6">
              <CardContent className="py-6 text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-3" />
                <h3 className="text-xl font-bold text-emerald-800">Attendance Confirmed!</h3>
                <p className="text-sm text-emerald-600 mt-1">+{attendance?.points_earned || 10} points earned</p>
                {attendance?.selfie_url && (
                  <img src={attendance.selfie_url} alt="Attendance selfie" className="w-32 h-32 object-cover rounded-xl mx-auto mt-4 border-2 border-emerald-300" />
                )}
              </CardContent>
            </Card>
          )}

          {/* RSVP Section */}
          {!isConfirmed && (
            <Card className="border-2 border-gold/30 mb-6">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Send className="w-5 h-5 text-gold" /> RSVP
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={rsvpStatus} onValueChange={setRsvpStatus} className="space-y-3">
                  <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:border-gold/40">
                    <RadioGroupItem value="attending" id="rsvp-attending" />
                    <label htmlFor="rsvp-attending" className="cursor-pointer flex-1">
                      <span className="font-semibold text-emerald-700">✓ Attending</span>
                      <p className="text-xs text-muted-foreground">I will be there on time</p>
                    </label>
                  </div>
                  <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:border-gold/40">
                    <RadioGroupItem value="late" id="rsvp-late" />
                    <label htmlFor="rsvp-late" className="cursor-pointer flex-1">
                      <span className="font-semibold text-amber-700">⏰ Will Be Late</span>
                      <p className="text-xs text-muted-foreground">I'm attending but will arrive late</p>
                    </label>
                  </div>
                  <div className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:border-gold/40">
                    <RadioGroupItem value="not_attending" id="rsvp-no" />
                    <label htmlFor="rsvp-no" className="cursor-pointer flex-1">
                      <span className="font-semibold text-red-700">✕ Not Attending</span>
                      <p className="text-xs text-muted-foreground">I won't be able to make it</p>
                    </label>
                  </div>
                </RadioGroup>

                {rsvpStatus === 'late' && (
                  <div className="space-y-3 pl-4 border-l-2 border-amber-300">
                    <div>
                      <Label>Expected Arrival Time</Label>
                      <Input type="time" value={expectedTime} onChange={(e) => setExpectedTime(e.target.value)} />
                    </div>
                    <div>
                      <Label>Reason for Being Late</Label>
                      <Textarea value={lateReason} onChange={(e) => setLateReason(e.target.value)} placeholder="e.g. Traffic, prior meeting..." rows={2} />
                    </div>
                  </div>
                )}

                <Button onClick={handleRsvp} disabled={submittingRsvp} className="w-full bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-gold/40 text-foreground font-bold h-11">
                  {submittingRsvp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {attendance ? 'Update RSVP' : 'Submit RSVP'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Post-Briefing Confirmation */}
          {isPast && !isConfirmed && attendance?.rsvp_status !== 'not_attending' && (
            <Card className="border-2 border-blue-500/30 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" /> Confirm Your Attendance
                </CardTitle>
                <p className="text-sm text-muted-foreground">Take a selfie and share your location to verify you attended the briefing.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Camera */}
                <div className="space-y-3">
                  {cameraActive ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <video ref={videoRef} className="w-full rounded-xl" autoPlay playsInline muted />
                      <Button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-black shadow-lg hover:bg-zinc-100 rounded-full w-16 h-16">
                        <Camera className="w-8 h-8" />
                      </Button>
                    </div>
                  ) : capturedPhoto ? (
                    <div className="relative">
                      <img src={capturedPhoto} alt="Captured selfie" className="w-full rounded-xl border-2 border-gold/30" />
                      <Button onClick={() => { setCapturedPhoto(null); startCamera(); }} size="sm" variant="outline" className="absolute top-2 right-2">
                        Retake
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={startCamera} className="w-full h-24 border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100" variant="ghost">
                      <Camera className="w-8 h-8 mr-3" />
                      Open Camera for Selfie
                    </Button>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* GPS */}
                <div className="space-y-2">
                  <Button onClick={getGPS} variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
                    <Navigation className="w-4 h-4 mr-2" />
                    {gpsLocation ? `📍 ${gpsLocation.lat.toFixed(6)}, ${gpsLocation.lng.toFixed(6)}` : 'Capture GPS Location'}
                  </Button>
                  {gpsLocation && (
                    <a
                      href={`https://maps.google.com/?q=${gpsLocation.lat},${gpsLocation.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline block text-center"
                    >
                      View on Google Maps ↗
                    </a>
                  )}
                </div>

                {/* Submit */}
                <Button
                  onClick={confirmAttendance}
                  disabled={uploadingSelfie || !capturedPhoto || !gpsLocation}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12"
                >
                  {uploadingSelfie ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Confirm Attendance & Earn Points
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default BriefingAttendance;
