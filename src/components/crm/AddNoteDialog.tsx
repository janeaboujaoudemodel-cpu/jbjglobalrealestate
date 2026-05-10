import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Loader2 } from "lucide-react";

interface AddNoteDialogProps {
  leadId: string;
  leadName: string;
  trigger?: React.ReactNode;
}

export default function AddNoteDialog({ leadId, leadName, trigger }: AddNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!note.trim() || !user) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('crm_notes')
        .insert({
          lead_id: leadId,
          user_id: user.id,
          body: note.trim()
        });

      if (error) throw error;

      // Log activity
      await supabase.from('crm_activities').insert({
        lead_id: leadId,
        user_id: user.id,
        activity_type: 'note',
        metadata: { preview: note.slice(0, 50) }
      });

      queryClient.invalidateQueries({ queryKey: ['crm-leads-inbox'] });
      toast.success('Note added successfully');
      setNote("");
      setOpen(false);
    } catch (err) {
      console.error('Failed to add note:', err);
      toast.error('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#EFE6D6]"
          >
            <StickyNote className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A]">Add Note for {leadName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Textarea
            placeholder="Enter your note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[120px] bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/50"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setOpen(false)}
              className="text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!note.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Note'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
