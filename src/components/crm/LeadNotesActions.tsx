import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  StickyNote, Calendar, Bell, Plus, Check, Clock, 
  Trash2, Edit2, Save, X
} from "lucide-react";

interface Note {
  id: string;
  content: string;
  created_at: string;
  created_by?: string;
}

interface LeadNotesActionsProps {
  leadId: string;
  userId: string;
  initialNotes?: Note[];
  followUpDate?: string;
  onNotesUpdate?: (notes: Note[]) => void;
}

const LeadNotesActions = ({ 
  leadId, 
  userId, 
  initialNotes = [], 
  followUpDate,
  onNotesUpdate 
}: LeadNotesActionsProps) => {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [nextFollowUp, setNextFollowUp] = useState(followUpDate || "");
  const [reminderSet, setReminderSet] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const addNote = async () => {
    if (!newNote.trim()) return;

    const newNoteObj: Note = {
      id: `note_${Date.now()}`,
      content: newNote.trim(),
      created_at: new Date().toISOString(),
      created_by: userId,
    };

    const updatedNotes = [...notes, newNoteObj];
    setNotes(updatedNotes);
    setNewNote("");
    setIsAddingNote(false);
    onNotesUpdate?.(updatedNotes);
    toast.success("Note added");
  };

  const deleteNote = async (noteId: string) => {
    const updatedNotes = notes.filter(n => n.id !== noteId);
    setNotes(updatedNotes);
    onNotesUpdate?.(updatedNotes);
    toast.success("Note deleted");
  };

  const startEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const saveEditNote = async () => {
    if (!editingNoteId) return;
    
    const updatedNotes = notes.map(n => 
      n.id === editingNoteId ? { ...n, content: editContent } : n
    );
    setNotes(updatedNotes);
    setEditingNoteId(null);
    setEditContent("");
    onNotesUpdate?.(updatedNotes);
    toast.success("Note updated");
  };

  const setFollowUpReminder = () => {
    if (!nextFollowUp) {
      toast.error("Please select a follow-up date");
      return;
    }
    setReminderSet(true);
    toast.success(`Follow-up reminder set for ${format(new Date(nextFollowUp), "MMM d, yyyy")}`);
  };

  return (
    <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-[#1A1A1A]" />
          Notes & Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Follow-up Date */}
        <div className="p-3 bg-[#F7F2EA]/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/70 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Next Follow-up
            </span>
            {reminderSet && (
              <Badge className="bg-green-500/20 text-green-400">
                <Bell className="w-3 h-3 mr-1" />
                Reminder Set
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              value={nextFollowUp}
              onChange={(e) => setNextFollowUp(e.target.value)}
              className="bg-[#FDFBF7] border-[#1A1A1A] text-white flex-1"
            />
            <Button 
              onClick={setFollowUpReminder} 
              size="sm"
              className="bg-[#EFE6D6]/20 text-[#1A1A1A] hover:bg-[#EFE6D6]/30"
            >
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Notes List */}
        <div className="space-y-2">
          {notes.length === 0 && !isAddingNote && (
            <p className="text-sm text-white/90 text-center py-3">
              No notes yet. Add your first note below.
            </p>
          )}
          
          {notes.map((note) => (
            <div 
              key={note.id} 
              className="p-3 bg-[#F7F2EA]/50 rounded-lg group"
            >
              {editingNoteId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="bg-[#FDFBF7] border-[#1A1A1A] text-white text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEditNote} className="bg-green-500/20 text-green-400">
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingNoteId(null)}>
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-white/85 whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-white/90">
                      {format(new Date(note.created_at), "MMM d, h:mm a")}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="w-6 h-6"
                        onClick={() => startEditNote(note)}
                      >
                        <Edit2 className="w-3 h-3 text-white/70" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="w-6 h-6"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add Note */}
        {isAddingNote ? (
          <div className="space-y-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write your note here..."
              className="bg-[#F7F2EA] border-[#1A1A1A] text-white text-sm"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <Button onClick={addNote} size="sm" variant="primary">
                <Check className="w-3 h-3 mr-1" />
                Save Note
              </Button>
              <Button 
                onClick={() => { setIsAddingNote(false); setNewNote(""); }} 
                size="sm" 
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={() => setIsAddingNote(true)} 
            variant="outline" 
            className="w-full border-dashed border-[#1A1A1A] text-white/70 hover:text-white hover:border-[#B89555]/50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadNotesActions;
