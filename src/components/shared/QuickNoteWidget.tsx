import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileText, Save, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface QuickNoteWidgetProps {
  prefillContent?: string;
  prefillTitle?: string;
  source?: "email" | "chat";
  compact?: boolean;
}

export default function QuickNoteWidget({
  prefillContent = "",
  prefillTitle = "",
  source = "email",
  compact = false,
}: QuickNoteWidgetProps) {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState(prefillTitle);
  const [content, setContent] = useState(prefillContent);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      toast.error("Please add a title or content");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to save notes");
        return;
      }
      const { error } = await supabase.from("ai_notes").insert({
        title: title || `Note from ${source}`,
        content,
        tags: [source, "quick-note"],
        source_type: `${source}-hub`,
        user_id: user.id,
      });
      if (error) throw error;
      toast.success("Note saved");
      setTitle("");
      setContent("");
      setShowForm(false);
    } catch (err: any) {
      console.error("Save note error:", err);
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Save as note"
        title="Save as note"
        data-chat-compact-action
        className="h-8 w-8 min-w-8 rounded-lg border border-[#B89555]/25 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6]/40"
        onClick={() => {
          if (prefillContent || prefillTitle) {
            setTitle(prefillTitle);
            setContent(prefillContent);
            setShowForm(true);
          } else {
            navigate("/ai-notes");
          }
        }}
      >
        <FileText className="w-3.5 h-3.5" />
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#B89555]" />
          <span className="text-xs font-semibold text-[#1A1A1A]">Quick Notes</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] text-[#B89555] hover:bg-[#B89555]/10"
          onClick={() => navigate("/ai-notes")}
        >
          <ExternalLink className="w-3 h-3 mr-1" /> Open
        </Button>
      </div>

      {!showForm ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-[10px] border-[#B89555]/20 text-[#1A1A1A]/60 hover:border-[#B89555]/40 hover:text-[#B89555]"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-3 h-3 mr-1" /> New Note
        </Button>
      ) : (
        <div className="space-y-1.5 bg-[#FDFBF7]/70 rounded-lg border border-[#B89555]/15 p-2">
          <Input
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-7 text-xs bg-transparent border-[#B89555]/15"
          />
          <Textarea
            placeholder="Write your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60px] text-xs bg-transparent border-[#B89555]/15 resize-none"
          />
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-6 text-[10px] flex-1 bg-gradient-to-r from-[#B89555] to-[#A68444] text-white"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-3 h-3 mr-1" /> {saving ? "Saving..." : "Save Note"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-[#1A1A1A]/40"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
