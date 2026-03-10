/**
 * TaskCreationModal - Premium task creation form
 * Supports description, priority, category, smart date, CRM lead integration,
 * client contact, URL, file upload, voice transcription
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Loader2, Mic, MicOff, Link2, Upload, Phone, Calendar as CalendarIcon,
  Flag, FolderOpen, X, Plus, FileText, CheckCircle2, Users, UserPlus, Search,
} from "lucide-react";

const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  { value: "medium", label: "Medium", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  { value: "high", label: "High", color: "bg-red-500/15 text-red-600 border-red-500/30" },
  { value: "urgent", label: "Urgent", color: "bg-purple-500/15 text-purple-600 border-purple-500/30" },
];

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "follow-up", label: "Follow-up" },
  { value: "listing", label: "Listing" },
  { value: "support", label: "Support" },
  { value: "cv", label: "CV / Career" },
  { value: "hr", label: "HR" },
  { value: "finance", label: "Finance" },
  { value: "marketing", label: "Marketing" },
  { value: "legal", label: "Legal" },
];

// ── Smart Date Parser ──
function parseSmartDate(raw: string): string {
  const cleaned = raw.replace(/[^0-9]/g, "");
  // Try DD MM YYYY (8 digits)
  if (cleaned.length === 8) {
    const dd = parseInt(cleaned.slice(0, 2));
    const mm = parseInt(cleaned.slice(2, 4));
    const yyyy = parseInt(cleaned.slice(4, 8));
    if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && yyyy >= 2020 && yyyy <= 2099) {
      return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    }
  }
  // Try with separators: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const parts = raw.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const dd = parseInt(parts[0]);
    const mm = parseInt(parts[1]);
    const yyyy = parseInt(parts[2]);
    if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && yyyy >= 2020 && yyyy <= 2099) {
      return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    }
  }
  return "";
}

function formatDateDisplay(isoDate: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

interface CrmLead {
  id: string;
  full_name: string | null;
  phone_raw: string | null;
  email_normalized: string | null;
}

interface TaskCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TaskCreationModal({ open, onOpenChange }: TaskCreationModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("general");
  const [dueDate, setDueDate] = useState(""); // YYYY-MM-DD
  const [dueDateText, setDueDateText] = useState(""); // display text
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [clientContact, setClientContact] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // CRM Lead state
  const [leadMode, setLeadMode] = useState<"none" | "select" | "new">("none");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeadName, setSelectedLeadName] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [leadResults, setLeadResults] = useState<CrmLead[]>([]);
  const [leadSearching, setLeadSearching] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setCategory("general");
    setDueDate("");
    setDueDateText("");
    setClientContact("");
    setReferenceUrl("");
    setAttachments([]);
    setLeadMode("none");
    setSelectedLeadId(null);
    setSelectedLeadName("");
    setLeadSearch("");
    setLeadResults([]);
    setNewLeadName("");
    setNewLeadPhone("");
  };

  // ── Lead Search ──
  useEffect(() => {
    if (leadMode !== "select" || leadSearch.length < 2) {
      setLeadResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLeadSearching(true);
      const { data } = await supabase
        .from("crm_leads")
        .select("id, full_name, phone, email")
        .or(`full_name.ilike.%${leadSearch}%,phone.ilike.%${leadSearch}%,email.ilike.%${leadSearch}%`)
        .limit(8);
      setLeadResults((data as CrmLead[]) || []);
      setLeadSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [leadSearch, leadMode]);

  // ── Voice Recording ──
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        toast.info("Transcribing audio...");
        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");

          const { data, error } = await supabase.functions.invoke("transcribe-audio", {
            body: formData,
          });

          if (error) throw error;
          if (data?.text) {
            setDescription((prev) => (prev ? prev + "\n\n" : "") + data.text);
            toast.success("Audio transcribed successfully");
          } else {
            toast.error("Could not transcribe audio");
          }
        } catch {
          toast.error("Transcription failed — audio appended as note");
          setDescription((prev) => (prev ? prev + "\n\n" : "") + "[Voice note recorded]");
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      toast.info("Recording... Click mic again to stop");
    } catch {
      toast.error("Microphone access denied");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // ── Smart Date Blur ──
  const handleDateBlur = () => {
    if (!dueDateText) {
      setDueDate("");
      return;
    }
    const parsed = parseSmartDate(dueDateText);
    if (parsed) {
      setDueDate(parsed);
      setDueDateText(formatDateDisplay(parsed));
    } else {
      toast.error("Invalid date. Use DD/MM/YYYY format");
      setDueDateText(formatDateDisplay(dueDate));
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const iso = format(date, "yyyy-MM-dd");
      setDueDate(iso);
      setDueDateText(format(date, "dd/MM/yyyy"));
    }
    setCalendarOpen(false);
  };

  // ── File Upload ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setIsUploading(true);
    const newAttachments: { name: string; url: string }[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 20MB limit`);
        continue;
      }

      const filePath = `task-attachments/${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(filePath, file);

      if (error) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);
      newAttachments.push({ name: file.name, url: urlData.publicUrl });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    setIsUploading(false);
    if (newAttachments.length > 0) toast.success(`${newAttachments.length} file(s) uploaded`);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    try {
      let leadId: string | null = selectedLeadId;

      // Create new lead if needed
      if (leadMode === "new" && newLeadName.trim()) {
        const { data: newLead, error: leadErr } = await supabase
          .from("crm_leads")
          .insert({
            full_name: newLeadName.trim(),
            phone: newLeadPhone.trim() || null,
            source: "task",
            lead_source_type: "manual",
            status: "new",
            user_id: user.id,
          } as any)
          .select("id")
          .single();

        if (leadErr) {
          console.error("Lead creation error:", leadErr);
          toast.error("Failed to create new lead");
        } else if (newLead) {
          leadId = newLead.id;
        }
      }

      const { error } = await supabase.from("admin_tasks").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        category,
        due_date: dueDate || null,
        status: "pending",
        client_contact: clientContact.trim() || null,
        reference_url: referenceUrl.trim() || null,
        attachments: attachments.length > 0 ? attachments : [],
        lead_id: leadId,
      } as any);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["user-alert-counts"] });
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      toast.success("Task created successfully");
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Task creation error:", err);
      toast.error("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl p-0 overflow-hidden border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-4 border-b border-gold/20">
          <DialogTitle className="text-xl font-bold text-black flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center">
              <Plus className="w-5 h-5 text-gold" />
            </div>
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-black">Task Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="h-11 bg-white/80 border-gold/30 focus:border-gold text-black placeholder:text-zinc-400"
              autoFocus
            />
          </div>

          {/* Description with voice */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-black">Description</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "h-8 px-3 text-xs gap-1.5",
                  isRecording
                    ? "border-red-500 bg-red-500/10 text-red-600 animate-pulse"
                    : "border-gold/30 text-gold hover:bg-gold/10"
                )}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                {isRecording ? "Stop Recording" : "Voice Note"}
              </Button>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, notes, or instructions..."
              className="min-h-[100px] bg-white/80 border-gold/30 focus:border-gold text-black placeholder:text-zinc-400 resize-y"
            />
          </div>

          {/* Priority & Category row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-black flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-gold" /> Priority
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                      priority === p.value
                        ? cn(p.color, "ring-1 ring-offset-1 ring-gold/40")
                        : "bg-white/60 border-gold/20 text-zinc-500 hover:border-gold/40"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-black flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-gold" /> Category
              </Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-lg border border-gold/30 bg-white/80 text-black text-sm px-3 focus:outline-none focus:border-gold"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date — Smart Input + Calendar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-black flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-gold" /> Due Date
              </Label>
              <div className="flex gap-2">
                <Input
                  value={dueDateText}
                  onChange={(e) => setDueDateText(e.target.value)}
                  onBlur={handleDateBlur}
                  onKeyDown={(e) => { if (e.key === "Enter") handleDateBlur(); }}
                  placeholder="DD/MM/YYYY"
                  className="h-10 bg-white/80 border-gold/30 focus:border-gold text-black placeholder:text-zinc-400 flex-1"
                />
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-10 p-0 border-gold/30 hover:bg-gold/10"
                    >
                      <CalendarIcon className="w-4 h-4 text-gold" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[10060]" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate ? new Date(dueDate + "T00:00:00") : undefined}
                      onSelect={handleCalendarSelect}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {dueDate && (
                <p className="text-xs text-gold/70">Saved: {formatDateDisplay(dueDate)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-black flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gold" /> Client Contact
              </Label>
              <Input
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                placeholder="+971 50 123 4567"
                className="h-10 bg-white/80 border-gold/30 focus:border-gold text-black placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* CRM Lead Section */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-black flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gold" /> Link to Lead
            </Label>
            <div className="flex gap-2 mb-2">
              {(["none", "select", "new"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setLeadMode(mode);
                    setSelectedLeadId(null);
                    setSelectedLeadName("");
                    setLeadSearch("");
                    setNewLeadName("");
                    setNewLeadPhone("");
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                    leadMode === mode
                      ? "bg-gold/20 border-gold text-black"
                      : "bg-white/60 border-gold/20 text-zinc-500 hover:border-gold/40"
                  )}
                >
                  {mode === "none" ? "No Lead" : mode === "select" ? "Select Lead" : "Add New Lead"}
                </button>
              ))}
            </div>

            {leadMode === "select" && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/60" />
                  <Input
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    placeholder="Search by name, phone, or email..."
                    className="h-10 pl-9 bg-white/80 border-gold/30 focus:border-gold text-black placeholder:text-zinc-400"
                  />
                </div>
                {selectedLeadId && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gold/10 border border-gold/30 rounded-lg">
                    <Users className="w-4 h-4 text-gold" />
                    <span className="text-sm text-black font-medium">{selectedLeadName}</span>
                    <button type="button" onClick={() => { setSelectedLeadId(null); setSelectedLeadName(""); }} className="ml-auto">
                      <X className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500" />
                    </button>
                  </div>
                )}
                {leadResults.length > 0 && !selectedLeadId && (
                  <div className="border border-gold/20 rounded-lg bg-white/90 max-h-[160px] overflow-y-auto">
                    {leadResults.map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setSelectedLeadName(lead.full_name || lead.email || "Lead");
                          setLeadSearch("");
                          setLeadResults([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gold/10 border-b border-gold/10 last:border-0 text-sm"
                      >
                        <span className="font-medium text-black">{lead.full_name || "—"}</span>
                        {lead.phone && <span className="text-zinc-500 ml-2">{lead.phone}</span>}
                        {lead.email && <span className="text-zinc-400 ml-2 text-xs">{lead.email}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {leadSearching && <p className="text-xs text-zinc-400">Searching...</p>}
              </div>
            )}

            {leadMode === "new" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-500">Lead Name *</Label>
                  <Input
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    placeholder="Full name"
                    className="h-9 bg-white/80 border-gold/30 text-black placeholder:text-zinc-400 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-500">Phone</Label>
                  <Input
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="h-9 bg-white/80 border-gold/30 text-black placeholder:text-zinc-400 text-sm"
                  />
                </div>
                <p className="col-span-2 text-xs text-gold/70 flex items-center gap-1">
                  <UserPlus className="w-3 h-3" /> This lead will be added to your CRM under "Manual — Task Source"
                </p>
              </div>
            )}
          </div>

          {/* Reference URL */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-black flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-gold" /> Reference URL
            </Label>
            <Input
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              placeholder="https://..."
              className="h-10 bg-white/80 border-gold/30 focus:border-gold text-black placeholder:text-zinc-400"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-black flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-gold" /> Attachments
            </Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gold/30 rounded-xl p-4 text-center cursor-pointer hover:border-gold/60 hover:bg-gold/5 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt,.csv"
              />
              {isUploading ? (
                <div className="flex items-center justify-center gap-2 text-gold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              ) : (
                <div className="text-zinc-500 text-sm">
                  <Upload className="w-5 h-5 mx-auto mb-1 text-gold/60" />
                  Click to upload documents (PDF, images, spreadsheets)
                </div>
              )}
            </div>

            {/* Uploaded files list */}
            {attachments.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 bg-white/80 border border-gold/20 rounded-lg"
                  >
                    <FileText className="w-4 h-4 text-gold shrink-0" />
                    <span className="text-xs text-black truncate flex-1">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="text-red-400 hover:text-red-600 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-3 border-t border-gold/20 bg-gradient-to-r from-gold/5 to-transparent flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => { resetForm(); onOpenChange(false); }}
            className="border-gold/30 text-black hover:bg-gold/5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
            className="bg-gradient-to-r from-gold via-gold to-gold/90 hover:from-gold/90 hover:to-gold text-black font-bold px-8 shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-2" /> Create Task</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
