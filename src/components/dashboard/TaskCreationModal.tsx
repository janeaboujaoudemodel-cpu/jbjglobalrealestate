/**
 * TaskCreationModal - Premium task creation form
 * Supports description, priority, category, due date, client contact, URL, file upload, voice transcription
 */
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Loader2, Mic, MicOff, Link2, Upload, Phone, Calendar,
  Flag, FolderOpen, X, Plus, FileText, CheckCircle2,
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
  const [dueDate, setDueDate] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setCategory("general");
    setDueDate("");
    setClientContact("");
    setReferenceUrl("");
    setAttachments([]);
  };

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

        // Transcribe via edge function
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

    // Reset input
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
      } as any);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["user-alert-counts"] });
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

          {/* Due Date & Client Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-black flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gold" /> Due Date
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 bg-white/80 border-gold/30 focus:border-gold text-black"
              />
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
