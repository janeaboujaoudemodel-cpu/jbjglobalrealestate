import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Phone, PhoneCall, PhoneOff, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface CallTrackerProps {
  leadId?: string;
  phoneNumber?: string;
  onCallLogged?: () => void;
}

const CallTracker = ({ leadId, phoneNumber: initialPhone, onCallLogged }: CallTrackerProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || "");
  const [callType, setCallType] = useState("outbound");
  const [callStatus, setCallStatus] = useState("completed");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const startCall = () => {
    setIsCallActive(true);
    setCallStartTime(new Date());
    
    // Start timer
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Store interval ID to clear later
    (window as any).callTimerInterval = interval;

    // Open phone dialer
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self');
    }
  };

  const endCall = () => {
    setIsCallActive(false);
    if ((window as any).callTimerInterval) {
      clearInterval((window as any).callTimerInterval);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveCallLog = async () => {
    if (!user || !phoneNumber) {
      toast.error("Phone number is required");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('broker_call_logs').insert({
        user_id: user.id,
        lead_id: leadId || null,
        phone_number: phoneNumber,
        call_type: callType,
        call_status: callStatus,
        duration_seconds: elapsedTime,
        notes: notes || null
      });

      if (error) throw error;

      // Update activity stats
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('broker_activity_stats').upsert({
        user_id: user.id,
        date: today,
        calls_made: 1
      }, { 
        onConflict: 'user_id,date',
        ignoreDuplicates: false 
      });

      // Award points
      await supabase.from('points_transactions').insert({
        user_id: user.id,
        points: 10,
        transaction_type: 'call_logged',
        description: 'Logged a call',
        reference_type: 'call'
      });

      toast.success("Call logged successfully! +10 points");
      setIsOpen(false);
      resetForm();
      onCallLogged?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to log call");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setIsCallActive(false);
    setCallStartTime(null);
    setElapsedTime(0);
    setCallType("outbound");
    setCallStatus("completed");
    setNotes("");
    if (!initialPhone) setPhoneNumber("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Phone className="h-4 w-4 mr-1" />
          Log Call
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Track Call</DialogTitle>
          <DialogDescription>
            Log your call activity for this lead
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Call Timer Display */}
          {isCallActive && (
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <PhoneCall className="h-8 w-8 mx-auto text-green-500 animate-pulse mb-2" />
              <p className="text-2xl font-mono font-bold">{formatTime(elapsedTime)}</p>
              <p className="text-sm text-muted-foreground">Call in progress</p>
            </div>
          )}

          {/* Phone Number */}
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+971 XX XXX XXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isCallActive}
            />
          </div>

          {/* Call Type */}
          <div>
            <Label>Call Type</Label>
            <Select value={callType} onValueChange={setCallType} disabled={isCallActive}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outbound">Outbound</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Call Status */}
          <div>
            <Label>Call Status</Label>
            <Select value={callStatus} onValueChange={setCallStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no_answer">No Answer</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="voicemail">Voicemail</SelectItem>
                <SelectItem value="wrong_number">Wrong Number</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Call summary..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Duration (if manual entry) */}
          {!isCallActive && elapsedTime === 0 && (
            <div>
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="Enter duration in seconds"
                value={elapsedTime || ""}
                onChange={(e) => setElapsedTime(parseInt(e.target.value) || 0)}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isCallActive ? (
              <>
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={startCall}
                  disabled={!phoneNumber}
                >
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Start Call & Timer
                </Button>
                <Button 
                  variant="primary"
                  className="flex-1"
                  onClick={saveCallLog}
                  disabled={saving || !phoneNumber}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Log"}
                </Button>
              </>
            ) : (
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={endCall}
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                End Call ({formatTime(elapsedTime)})
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallTracker;
