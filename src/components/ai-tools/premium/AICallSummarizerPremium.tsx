import { useState, useRef } from "react";
import { Phone, Upload, Mic, FileAudio, Loader2, CheckCircle, User, ListChecks, Target, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CallSummary {
  summary: string;
  actionItems: string[];
  clientNeeds: string[];
  nextSteps: string[];
  sentiment: string;
  keyTopics: string[];
}

const AICallSummarizerPremium = () => {
  const [clientName, setClientName] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CallSummary | null>(null);
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
      // For now, we'll use text-based summarization
      // Audio transcription would require a dedicated edge function
      const { data, error } = await supabase.functions.invoke('ai-call-summarizer', {
        body: {
          clientName,
          callNotes,
          hasAudio: !!audioFile,
        },
      });

      if (error) throw error;

      setResult(data.summary);
      toast.success("Call summary generated!");
    } catch (error) {
      console.error("Summarization error:", error);
      toast.error("Failed to summarize call. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-950/40 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-600/20 via-transparent to-transparent opacity-50" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full mb-6">
            <Phone className="w-5 h-5 text-orange-400" />
            <span className="text-orange-400 font-medium text-sm">AI Call Intelligence</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI Call <span className="text-orange-400">Summarizer</span>
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Summarize phone calls with clients instantly. Upload audio or enter call notes 
            to get AI-generated summaries, action items, and next steps.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="bg-zinc-900/80 border border-orange-500/30 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Call Details</h2>
          </div>

          <div className="space-y-6">
            {/* Client Name */}
            <div>
              <Label className="text-zinc-300 mb-2 block">Client Name</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            {/* Audio Upload/Record */}
            <div>
              <Label className="text-zinc-300 mb-2 block">Audio Recording (Optional)</Label>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="dark-outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-orange-500/50 hover:bg-orange-500/10"
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
                    variant="dark-outline"
                    onClick={startRecording}
                    className="border-orange-500/50 hover:bg-orange-500/10"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Record
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={stopRecording}
                    className="bg-red-600 hover:bg-red-500 text-white"
                  >
                    <Mic className="w-4 h-4 mr-2 animate-pulse" />
                    Stop Recording
                  </Button>
                )}
              </div>
              
              {audioFile && (
                <div className="mt-3 flex items-center gap-2 text-sm text-orange-400">
                  <FileAudio className="w-4 h-4" />
                  {audioFile.name}
                </div>
              )}
            </div>

            {/* Call Notes */}
            <div>
              <Label className="text-zinc-300 mb-2 block">Call Notes</Label>
              <Textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Enter your call notes, key discussion points, and any important details..."
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[150px]"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || (!clientName && !callNotes && !audioFile)}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-6 text-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5 mr-2" />
                  Summarize Call
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-6">
            {/* Summary */}
            <div className="bg-zinc-900/80 border border-orange-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-orange-400" />
                <h3 className="text-xl font-bold text-white">Call Summary</h3>
              </div>
              <p className="text-zinc-300 leading-relaxed">{result.summary}</p>
            </div>

            {/* Action Items */}
            <div className="bg-zinc-900/80 border border-orange-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <ListChecks className="w-6 h-6 text-orange-400" />
                <h3 className="text-xl font-bold text-white">Action Items</h3>
              </div>
              <ul className="space-y-2">
                {result.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-zinc-300">
                    <ArrowRight className="w-4 h-4 text-orange-400 mt-1 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Client Needs */}
            <div className="bg-zinc-900/80 border border-orange-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-orange-400" />
                <h3 className="text-xl font-bold text-white">Client Needs</h3>
              </div>
              <ul className="space-y-2">
                {result.clientNeeds.map((need, i) => (
                  <li key={i} className="flex items-start gap-2 text-zinc-300">
                    <User className="w-4 h-4 text-orange-400 mt-1 flex-shrink-0" />
                    {need}
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Steps */}
            <div className="bg-zinc-900/80 border border-orange-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <ArrowRight className="w-6 h-6 text-orange-400" />
                <h3 className="text-xl font-bold text-white">Next Steps</h3>
              </div>
              <ul className="space-y-2">
                {result.nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-zinc-300">
                    <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-sm flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AICallSummarizerPremium;
