import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  BookOpen, Plus, Search, Trash2, Edit3, Copy, Loader2,
  Globe, Mic, Building2, Calendar, FileText, Check, X
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "luxury", label: "Luxury" },
  { value: "energetic", label: "Energetic" },
  { value: "calm", label: "Calm" },
  { value: "persuasive", label: "Persuasive" },
  { value: "informative", label: "Informative" },
];

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ar", label: "Arabic", flag: "🇦🇪" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "ru", label: "Russian", flag: "🇷🇺" },
];

interface VoiceScript {
  id: string;
  title: string;
  script: string;
  language: string;
  tone: string;
  project_name: string | null;
  voice_name: string | null;
  word_count: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface ScriptLibraryProps {
  onLoadScript?: (script: string) => void;
  currentScript?: string;
  currentLanguage?: string;
  currentTone?: string;
  currentVoiceName?: string;
}

interface SaveDialogData {
  title: string;
  project_name: string;
  tone: string;
  language: string;
  tags: string;
}

export function ScriptLibrary({
  onLoadScript,
  currentScript = "",
  currentLanguage = "en",
  currentTone = "professional",
  currentVoiceName = "",
}: ScriptLibraryProps) {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<VoiceScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLang, setFilterLang] = useState("all");
  const [filterTone, setFilterTone] = useState("all");

  // Save dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveData, setSaveData] = useState<SaveDialogData>({
    title: "",
    project_name: "",
    tone: currentTone,
    language: currentLanguage,
    tags: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Edit dialog
  const [editingScript, setEditingScript] = useState<VoiceScript | null>(null);
  const [editText, setEditText] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editProjectName, setEditProjectName] = useState("");
  const [editTone, setEditTone] = useState("professional");
  const [editLanguage, setEditLanguage] = useState("en");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Copied state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchScripts = useCallback(async () => {
    if (!user?.id) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("voice_scripts")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setScripts((data || []) as VoiceScript[]);
    } catch (err: any) {
      toast.error("Failed to load scripts");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchScripts(); }, [fetchScripts]);

  // Open save dialog pre-filled with current settings
  const openSaveDialog = () => {
    setSaveData({
      title: "",
      project_name: "",
      tone: currentTone,
      language: currentLanguage,
      tags: "",
    });
    setShowSaveDialog(true);
  };

  const handleSave = async () => {
    if (!user?.id) { toast.error("Please log in to save scripts"); return; }
    if (!saveData.title.trim()) { toast.error("Please enter a title"); return; }
    if (!currentScript.trim()) { toast.error("No script to save"); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase.from("voice_scripts").insert({
        user_id: user.id,
        title: saveData.title.trim(),
        script: currentScript,
        language: saveData.language,
        tone: saveData.tone,
        project_name: saveData.project_name.trim() || null,
        voice_name: currentVoiceName || null,
        tags: saveData.tags ? saveData.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      });
      if (error) throw error;
      toast.success("Script saved to library!");
      setShowSaveDialog(false);
      fetchScripts();
    } catch (err: any) {
      toast.error(err.message || "Failed to save script");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (s: VoiceScript) => {
    setEditingScript(s);
    setEditText(s.script);
    setEditTitle(s.title);
    setEditProjectName(s.project_name || "");
    setEditTone(s.tone);
    setEditLanguage(s.language);
  };

  const handleUpdate = async () => {
    if (!editingScript) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("voice_scripts")
        .update({
          title: editTitle.trim(),
          script: editText,
          tone: editTone,
          language: editLanguage,
          project_name: editProjectName.trim() || null,
        })
        .eq("id", editingScript.id);
      if (error) throw error;
      toast.success("Script updated!");
      setEditingScript(null);
      fetchScripts();
    } catch (err: any) {
      toast.error(err.message || "Failed to update script");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("voice_scripts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Script deleted");
      setDeletingId(null);
      setScripts(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      toast.error("Failed to delete");
    }
  };

  const handleCopy = async (script: VoiceScript) => {
    await navigator.clipboard.writeText(script.script);
    setCopiedId(script.id);
    toast.success("Script copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLangDisplay = (code: string) => {
    const l = LANGUAGES.find(l => l.code === code);
    return l ? `${l.flag} ${l.label}` : code;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const filtered = scripts.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || s.title.toLowerCase().includes(q) ||
      (s.project_name || "").toLowerCase().includes(q) ||
      s.script.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q));
    const matchLang = filterLang === "all" || s.language === filterLang;
    const matchTone = filterTone === "all" || s.tone === filterTone;
    return matchSearch && matchLang && matchTone;
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search scripts, projects, tags…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={filterLang} onValueChange={setFilterLang}>
          <SelectTrigger className="w-36 bg-slate-800/60 border-slate-700 text-white text-sm">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all" className="text-white">All Languages</SelectItem>
            {LANGUAGES.map(l => (
              <SelectItem key={l.code} value={l.code} className="text-white">{l.flag} {l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTone} onValueChange={setFilterTone}>
          <SelectTrigger className="w-36 bg-slate-800/60 border-slate-700 text-white text-sm">
            <SelectValue placeholder="Tone" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all" className="text-white">All Tones</SelectItem>
            {TONES.map(t => (
              <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={openSaveDialog}
          disabled={!currentScript.trim()}
          className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white shrink-0"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Save Current Script
        </Button>
      </div>

      {/* Script count */}
      <p className="text-slate-500 text-xs">
        {filtered.length} of {scripts.length} scripts
      </p>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading library…</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && scripts.length === 0 && (
        <Card className="bg-slate-900/40 border-slate-700/50 border-dashed">
          <CardContent className="py-14 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-white font-medium">No saved scripts yet</h3>
            <p className="text-slate-500 text-sm max-w-xs">
              Write a script in the Script panel, then click "Save Current Script" to store it here for reuse.
            </p>
          </CardContent>
        </Card>
      )}

      {/* No results from filter */}
      {!isLoading && scripts.length > 0 && filtered.length === 0 && (
        <p className="text-center text-slate-500 text-sm py-8">No scripts match your search.</p>
      )}

      {/* Script grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(s => (
            <Card
              key={s.id}
              className="bg-slate-900/60 border-slate-700/50 hover:border-purple-500/40 transition-all group flex flex-col"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">{s.title}</h3>
                    {s.project_name && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3 text-slate-500 shrink-0" />
                        <span className="text-slate-400 text-xs truncate">{s.project_name}</span>
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleCopy(s)}
                      className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Copy script"
                    >
                      {copiedId === s.id ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => openEditDialog(s)}
                      className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Edit script"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(s.id)}
                      className="p-1.5 rounded-md hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete script"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge className="text-[10px] bg-purple-500/15 text-purple-300 border-purple-500/20 px-1.5 py-0.5">
                    <Globe className="h-2.5 w-2.5 mr-1" />
                    {getLangDisplay(s.language)}
                  </Badge>
                  <Badge className="text-[10px] bg-slate-700/60 text-slate-300 border-slate-600/40 px-1.5 py-0.5">
                    {s.tone.charAt(0).toUpperCase() + s.tone.slice(1)}
                  </Badge>
                  {s.voice_name && (
                    <Badge className="text-[10px] bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20 px-1.5 py-0.5">
                      <Mic className="h-2.5 w-2.5 mr-1" />
                      {s.voice_name}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col gap-3 pt-0">
                {/* Script preview */}
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
                  {s.script}
                </p>

                {/* Tags */}
                {s.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-slate-700/50 text-slate-400 rounded px-1.5 py-0.5">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {s.word_count ?? "—"} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(s.updated_at)}
                    </span>
                  </div>
                  {onLoadScript && (
                    <Button
                      size="sm"
                      onClick={() => { onLoadScript(s.script); toast.success(`"${s.title}" loaded into editor`); }}
                      className="h-7 text-xs bg-purple-600/80 hover:bg-purple-600 text-white px-3"
                    >
                      Load
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Save Dialog ── */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-400" />
              Save Script to Library
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Title *</Label>
              <Input
                placeholder="e.g. Marina Tower Luxury Voiceover"
                value={saveData.title}
                onChange={e => setSaveData(p => ({ ...p, title: e.target.value }))}
                className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Project Name</Label>
              <Input
                placeholder="e.g. Binghatti Hills, Palm Jumeirah Tower…"
                value={saveData.project_name}
                onChange={e => setSaveData(p => ({ ...p, project_name: e.target.value }))}
                className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs mb-1.5 block">Language</Label>
                <Select value={saveData.language} onValueChange={v => setSaveData(p => ({ ...p, language: v }))}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {LANGUAGES.map(l => (
                      <SelectItem key={l.code} value={l.code} className="text-white">{l.flag} {l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1.5 block">Tone</Label>
                <Select value={saveData.tone} onValueChange={v => setSaveData(p => ({ ...p, tone: v }))}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {TONES.map(t => (
                      <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Tags (comma-separated)</Label>
              <Input
                placeholder="e.g. luxury, arabic, off-plan"
                value={saveData.tags}
                onChange={e => setSaveData(p => ({ ...p, tags: e.target.value }))}
                className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            {/* Script preview */}
            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Script Preview</Label>
              <p className="text-slate-400 text-xs bg-slate-800/40 rounded-lg p-3 border border-slate-700/30 line-clamp-3">
                {currentScript || "No script entered."}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !saveData.title.trim()}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white"
            >
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <><BookOpen className="h-4 w-4 mr-2" />Save Script</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editingScript} onOpenChange={() => setEditingScript(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-purple-400" />
              Edit Script
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Title</Label>
              <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="bg-slate-800/60 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Project Name</Label>
              <Input
                value={editProjectName}
                onChange={e => setEditProjectName(e.target.value)}
                className="bg-slate-800/60 border-slate-700 text-white"
                placeholder="Optional project name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs mb-1.5 block">Language</Label>
                <Select value={editLanguage} onValueChange={setEditLanguage}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {LANGUAGES.map(l => (
                      <SelectItem key={l.code} value={l.code} className="text-white">{l.flag} {l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1.5 block">Tone</Label>
                <Select value={editTone} onValueChange={setEditTone}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {TONES.map(t => (
                      <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Script</Label>
              <Textarea
                value={editText}
                onChange={e => setEditText(e.target.value.slice(0, 5000))}
                className="min-h-[180px] bg-slate-800/60 border-slate-700 text-white resize-none text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">{editText.length.toLocaleString()} / 5,000</p>
            </div>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditingScript(null)} className="border-slate-600 text-slate-300 hover:bg-slate-800">
              <X className="h-4 w-4 mr-1.5" />Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating || !editTitle.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isUpdating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <><Check className="h-4 w-4 mr-2" />Save Changes</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="h-5 w-5" />
              Delete Script?
            </DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 text-sm mt-2">This action cannot be undone. The script will be permanently deleted.</p>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeletingId(null)} className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Cancel
            </Button>
            <Button
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
