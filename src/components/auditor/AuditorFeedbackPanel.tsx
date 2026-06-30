import { useState, useRef } from "react";
import { Camera, MessageSquare, Copy, Send, X, Mic, MicOff, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface AuditorFeedbackPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuditorFeedbackPanel = ({ isOpen, onClose }: AuditorFeedbackPanelProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"screenshot" | "task" | "message">("screenshot");
  const [noteText, setNoteText] = useState("");
  const [promptText, setPromptText] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  if (!isOpen) return null;

  const captureScreenshot = async () => {
    setIsCapturing(true);
    try {
      // Temporarily hide the feedback panel
      const panel = document.getElementById("auditor-feedback-panel");
      if (panel) panel.style.display = "none";

      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        scale: 1,
      });

      if (panel) panel.style.display = "";

      canvas.toBlob((blob) => {
        if (blob) {
          setScreenshotBlob(blob);
          setScreenshotUrl(URL.createObjectURL(blob));
        }
      }, "image/png");
    } catch (err) {
      toast.error("Failed to capture screenshot");
    } finally {
      setIsCapturing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setVoiceBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSend = async () => {
    if (!user) return;
    setIsSending(true);

    try {
      let uploadedScreenshotUrl: string | null = null;
      let uploadedVoiceUrl: string | null = null;

      // Upload screenshot if exists
      if (screenshotBlob) {
        const filename = `${user.id}/${Date.now()}_screenshot.png`;
        const { error: uploadErr } = await supabase.storage
          .from("auditor-feedback")
          .upload(filename, screenshotBlob, { contentType: "image/png" });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from("auditor-feedback")
            .getPublicUrl(filename);
          uploadedScreenshotUrl = urlData?.publicUrl || null;
        }
      }

      // Upload voice if exists
      if (voiceBlob) {
        const filename = `${user.id}/${Date.now()}_voice.webm`;
        const { error: uploadErr } = await supabase.storage
          .from("auditor-feedback")
          .upload(filename, voiceBlob, { contentType: "audio/webm" });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from("auditor-feedback")
            .getPublicUrl(filename);
          uploadedVoiceUrl = urlData?.publicUrl || null;
        }
      }

      const feedbackType = activeTab === "task" ? "task" : activeTab === "screenshot" ? "screenshot_note" : "message";

      const { error } = await supabase.from("auditor_feedback").insert({
        auditor_user_id: user.id,
        feedback_type: feedbackType,
        screenshot_url: uploadedScreenshotUrl,
        note_text: activeTab === "task" ? taskDescription : noteText,
        prompt_text: promptText || (activeTab === "task" ? taskTitle : null),
        voice_message_url: uploadedVoiceUrl,
        page_url: window.location.href,
        status: "new",
      });

      if (error) throw error;

      toast.success("Feedback sent to Jane successfully!");
      // Reset
      setNoteText("");
      setPromptText("");
      setTaskTitle("");
      setTaskDescription("");
      setScreenshotUrl(null);
      setScreenshotBlob(null);
      setVoiceBlob(null);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to send feedback");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      id="auditor-feedback-panel"
      className="fixed inset-0 z-[10002] flex items-center justify-center bg-[#1A1A1A]/60 backdrop-blur-sm"
    >
      <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] rounded-2xl border-2 border-[#B89555]/40 shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#B89555]/30">
          <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#1A1A1A]" />
            Send Feedback to Jane
          </h2>
          <button onClick={onClose} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#B89555]/20">
          {[
            { key: "screenshot" as const, label: "Screenshot & Note", icon: Camera },
            { key: "task" as const, label: "Assign Task", icon: ClipboardList },
            { key: "message" as const, label: "Message", icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
 activeTab === tab.key
 ? "text-[#1A1A1A] border-b-2 border-[#B89555] bg-[#EFE6D6]/5"
 : "text-[#1A1A1A]/50 hover:text-[#1A1A1A]"
 }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {/* Screenshot section */}
          {activeTab === "screenshot" && (
            <>
              <Button
                onClick={captureScreenshot}
                disabled={isCapturing}
                variant="outline"
                className="w-full border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
              >
                <Camera className="w-4 h-4 mr-2" />
                {isCapturing ? "Capturing..." : screenshotUrl ? "Retake Screenshot" : "Capture Screenshot"}
              </Button>
              {screenshotUrl && (
                <div className="rounded-lg border border-[#B89555]/30 overflow-hidden">
                  <img src={screenshotUrl} alt="Screenshot" className="w-full h-auto"  loading="lazy" decoding="async" />
                </div>
              )}
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Describe the issue or observation..."
                rows={4}
              />
            </>
          )}

          {/* Task section */}
          {activeTab === "task" && (
            <>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Task title (e.g., Fix homepage hero image)"
                className="bg-[#FDFBF7]/80 border-[#B89555]/40 text-[#1A1A1A]"
              />
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Task description — explain what needs to be done..."
                rows={4}
              />
            </>
          )}

          {/* Message section */}
          {activeTab === "message" && (
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write your message to Jane..."
              rows={4}
            />
          )}

          {/* Prompt field (all tabs) */}
          <div>
            <label className="text-xs font-semibold text-[#1A1A1A]/60 mb-1 block">
              Prompt / Instructions (Jane can copy this)
            </label>
            <div className="relative">
              <Textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Write a full prompt or instruction for Jane to copy and use..."
                rows={3}
              />
              {promptText && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(promptText);
                    toast.success("Prompt copied!");
                  }}
                  className="absolute top-2 right-2 text-[#1A1A1A] hover:text-[#1A1A1A]"
                  title="Copy prompt"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Voice recording */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              className={`border-[#B89555]/40 ${isRecording ? "text-red-600 border-red-400 bg-red-50" : "text-[#1A1A1A]"}`}
            >
              {isRecording ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
              {isRecording ? "Stop Recording" : "Record Voice"}
            </Button>
            {voiceBlob && !isRecording && (
              <span className="text-xs text-[color:var(--emerald-1)] font-medium">✓ Voice recorded</span>
            )}
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={isSending || (!noteText && !taskTitle && !promptText && !screenshotBlob && !voiceBlob)}
            className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-bold"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSending ? "Sending..." : "Send to Jane"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuditorFeedbackPanel;
