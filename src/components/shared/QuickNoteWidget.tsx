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
        size="sm"
        className="h-7 text-[10px] border border-[#C9A84C]/20 text-black/60 hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]"
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
        <FileText className="w-3 h-3 mr-1" /> Save as Note
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-xs font-semibold text-black">Quick Notes</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] text-[#C9A84C] hover:bg-[#C9A84C]/10"
          onClick={() => navigate("/ai-notes")}
        >
          <ExternalLink className="w-3 h-3 mr-1" /> Open
        </Button>
      </div>

      {!showForm ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-[10px] border-[#C9A84C]/20 text-black/60 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-3 h-3 mr-1" /> New Note
        </Button>
      ) : (
        <div className="space-y-1.5 bg-white/70 rounded-lg border border-[#C9A84C]/15 p-2">
          <Input
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-7 text-xs bg-transparent border-[#C9A84C]/15"
          />
          <Textarea
            placeholder="Write your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60px] text-xs bg-transparent border-[#C9A84C]/15 resize-none"
          />
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-6 text-[10px] flex-1 bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-3 h-3 mr-1" /> {saving ? "Saving..." : "Save Note"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-black/40"
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
