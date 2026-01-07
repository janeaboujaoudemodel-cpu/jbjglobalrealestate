import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Clock, Bell, Phone, Video, MessageSquare } from "lucide-react";

interface FollowUpSchedulerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leadId: string;
  userId: string;
  leadName: string;
}

const REMINDER_TYPES = [
  { value: "call", label: "Call Reminder", icon: Phone },
  { value: "meeting", label: "Meeting", icon: Video },
  { value: "whatsapp", label: "WhatsApp Follow-up", icon: MessageSquare },
  { value: "general", label: "General Reminder", icon: Bell },
];

const QUICK_OPTIONS = [
  { label: "In 30 min", minutes: 30 },
  { label: "In 1 hour", minutes: 60 },
  { label: "In 2 hours", minutes: 120 },
  { label: "Tomorrow 10 AM", minutes: null, tomorrow: true },
];

const FollowUpScheduler = ({
  open,
  onClose,
  onSuccess,
  leadId,
  userId,
  leadName,
}: FollowUpSchedulerProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "call",
    title: "",
    notes: "",
    due_date: "",
    due_time: "",
  });

  const handleQuickOption = (option: typeof QUICK_OPTIONS[0]) => {
    const now = new Date();
    let dueDate: Date;

    if (option.tomorrow) {
      dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 1);
      dueDate.setHours(10, 0, 0, 0);
    } else if (option.minutes) {
      dueDate = new Date(now.getTime() + option.minutes * 60000);
    } else {
      return;
    }

    const dateStr = dueDate.toISOString().split('T')[0];
    const timeStr = dueDate.toTimeString().slice(0, 5);

    setFormData(prev => ({
      ...prev,
      due_date: dateStr,
      due_time: timeStr,
      title: prev.title || `Follow up with ${leadName}`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!formData.due_date || !formData.due_time) {
      toast.error("Please select date and time");
      return;
    }

    setLoading(true);
    try {
      const dueAt = new Date(`${formData.due_date}T${formData.due_time}`).toISOString();

      // Create task/follow-up
      const { error } = await supabase.from("crm_tasks").insert({
        lead_id: leadId,
        user_id: userId,
        title: formData.title.trim(),
        notes: formData.notes.trim() || null,
        due_at: dueAt,
        status: "pending",
      });

      if (error) throw error;

      // Update lead state with next followup
      await supabase
        .from("crm_lead_state_per_user")
        .upsert({
          lead_id: leadId,
          user_id: userId,
          next_followup_at: dueAt,
        }, { onConflict: "lead_id,user_id" });

      // Log activity
      await supabase.from("crm_activities").insert({
        lead_id: leadId,
        user_id: userId,
        activity_type: "followup_created",
        metadata: { 
          type: formData.type, 
          title: formData.title,
          due_at: dueAt 
        },
      });

      toast.success("Follow-up scheduled successfully!", {
        description: `Reminder set for ${new Date(dueAt).toLocaleString()}`,
      });

      // Reset form
      setFormData({
        type: "call",
        title: "",
        notes: "",
        due_date: "",
        due_time: "",
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to schedule follow-up:", err);
      toast.error("Failed to schedule follow-up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Schedule Follow-up
          </DialogTitle>
          <DialogDescription>
            Set a reminder for {leadName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Options */}
          <div className="flex flex-wrap gap-2">
            {QUICK_OPTIONS.map((option) => (
              <Button
                key={option.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickOption(option)}
                className="text-xs"
              >
                <Clock className="h-3 w-3 mr-1" />
                {option.label}
              </Button>
            ))}
          </div>

          {/* Reminder Type */}
          <div>
            <Label>Reminder Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={`Follow up with ${leadName}`}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="due_date">Date *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="due_time">Time *</Label>
              <Input
                id="due_time"
                type="time"
                value={formData.due_time}
                onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes for this follow-up..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpScheduler;
