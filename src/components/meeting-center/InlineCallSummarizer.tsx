import { useState, useRef } from "react";
import { Phone, Upload, Mic, FileAudio, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface InlineCallSummarizerProps {
  onSuccess?: () => void;
}

const InlineCallSummarizer = ({ onSuccess }: InlineCallSummarizerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp4'];
      if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
        toast.error("Please upload an MP3, WAV, or M4A audio file");
        return;
      }
      setAudioFile(file);
      toast.success(`Audio file loaded: ${file.name}`);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        setAudioFile(file);
        stream.getTracks().forEach(track => track.stop());
        toast.success("Recording saved");
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording started...");
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (!clientName.trim() && !callNotes.trim() && !audioFile) {
      toast.error("Please provide client name, call notes, or upload audio");
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-call-summarizer', {
        body: {
          clientName,
          callNotes,
          hasAudio: !!audioFile,
        },
      });

      if (error) throw error;

      toast.success("Call summary generated!");
      
      // Reset form
      setClientName("");
      setCallNotes("");
      setAudioFile(null);
      setIsOpen(false);
      
      // Notify parent to refresh list
      onSuccess?.();
    } catch (error) {
      console.error("Summarization error:", error);
      toast.error("Failed to summarize call. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-zinc-900/80 border border-orange-500/50 rounded-xl overflow-hidden">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/80 rounded-none h-auto"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-white">Add Call Summary</h3>
                <p className="text-sm text-zinc-300">Summarize a phone call with AI</p>
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-white" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4 border-t border-zinc-700">
            {/* Client Name */}
            <div>
              <Label className="text-zinc-200 mb-2 block text-sm font-medium">Client Name</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400"
              />
            </div>

            {/* Audio Upload/Record */}
            <div>
              <Label className="text-zinc-200 mb-2 block text-sm font-medium">Audio (Optional)</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-medium"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Audio
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {!isRecording ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={startRecording}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-medium"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Record
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={stopRecording}
                    className="bg-red-600 hover:bg-red-500 text-white font-medium animate-pulse"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Stop Recording
                  </Button>
                )}
              </div>
              
              {audioFile && (
                <div className="mt-2 flex items-center gap-2 text-sm text-orange-300 font-medium">
                  <FileAudio className="w-4 h-4" />
                  {audioFile.name}
                </div>
              )}
            </div>

            {/* Call Notes */}
            <div>
              <Label className="text-zinc-200 mb-2 block text-sm font-medium">Call Notes</Label>
              <Textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Enter key discussion points..."
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 min-h-[100px]"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || (!clientName && !callNotes && !audioFile)}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Summarize Call
                </>
              )}
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default InlineCallSummarizer;
