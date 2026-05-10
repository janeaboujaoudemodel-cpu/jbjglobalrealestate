import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Phone, PhoneOff, Clock, CheckCircle } from "lucide-react";

interface Lead {
  id: string;
  full_name: string;
  phone: string | null;
}

interface AIBrokerCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  brokerId: string;
  brokerName: string;
}

export function AIBrokerCallDialog({
  open,
  onOpenChange,
  lead,
  brokerId,
  brokerName,
}: AIBrokerCallDialogProps) {
  const [callStatus, setCallStatus] = useState<string>("completed");
  const [notes, setNotes] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setCallStatus("completed");
      setNotes("");
      setIsCallActive(false);
      setCallDuration(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [open]);

  const startCall = () => {
    if (!lead.phone) {
      toast.error("No phone number available");
      return;
    }

    // Open phone dialer
    window.open(`tel:${lead.phone}`, "_self");
    
    // Start call timer
    setIsCallActive(true);
    startTimeRef.current = new Date();
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor(
          (new Date().getTime() - startTimeRef.current.getTime()) / 1000
        );
        setCallDuration(elapsed);
      }
    }, 1000);

    toast.info(`Calling ${lead.full_name}...`);
  };

  const endCall = () => {
    setIsCallActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLogCall = async () => {
    if (!lead.phone) {
      toast.error("No phone number available");
      return;
    }

    setIsLogging(true);

    try {
      const { data, error } = await supabase.functions.invoke("broker-log-call", {
        body: {
          broker_id: brokerId,
          lead_id: lead.id,
          phone_number: lead.phone,
          call_type: "outbound",
          duration_seconds: callDuration,
          call_status: callStatus,
          notes: notes.trim() || undefined,
        },
      });

      if (error) throw error;

      toast.success(`Call logged for ${lead.full_name}`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error logging call:", error);
      toast.error("Failed to log call");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FDFBF7] border-[#1A1A1A] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Phone className="h-5 w-5 text-purple-500" />
            Call {lead.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Phone Number Display */}
          <div>
            <Label className="text-[#1A1A1A]/70">Phone Number</Label>
            <div className="bg-[#1A1A1A] border border-[#1A1A1A] rounded-md px-3 py-2 mt-1 text-white font-mono">
              {lead.phone || "N/A"}
            </div>
          </div>

          {/* Call Timer */}
          <div className="bg-[#1A1A1A] rounded-lg p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-[#1A1A1A]/70 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Call Duration</span>
            </div>
            <p className="text-white text-4xl font-mono font-bold">
              {formatDuration(callDuration)}
            </p>
          </div>

          {/* Call Controls */}
          <div className="flex gap-3">
            {!isCallActive ? (
              <Button
                onClick={startCall}
                disabled={!lead.phone}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Phone className="h-4 w-4 mr-2" />
                Start Call
              </Button>
            ) : (
              <Button
                onClick={endCall}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                End Call
              </Button>
            )}
          </div>

          {/* Call Outcome */}
          <div>
            <Label className="text-[#1A1A1A]/70">Call Outcome</Label>
            <Select value={callStatus} onValueChange={setCallStatus}>
              <SelectTrigger className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#FDFBF7] border-[#1A1A1A]">
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no_answer">No Answer</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="voicemail">Voicemail</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Call Notes */}
          <div>
            <Label className="text-[#1A1A1A]/70">Call Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Summary of the call discussion..."
              className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1 min-h-[100px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#1A1A1A]">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleLogCall}
              disabled={isLogging}
            >
              {isLogging ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Log Call
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
