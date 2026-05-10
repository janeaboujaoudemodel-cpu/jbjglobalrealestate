import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Upload, Mic, FileAudio, Loader2, CheckCircle,
  User, ListChecks, Target, ArrowRight, Copy, Check, Download, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AIToolPremiumLayout from "../AIToolPremiumLayout";
import AIToolGuide from "../AIToolGuide";

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
  const [copied, setCopied] = useState(false);
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
        if (e.data.size > 0) chunksRef.current.push(e.data);
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
        body: { clientName, callNotes, hasAudio: !!audioFile },
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

  const copyToClipboard = () => {
    if (!result) return;
    const text = `Call Summary: ${result.summary}\n\nAction Items:\n${result.actionItems.map(i => `- ${i}`).join('\n')}\n\nClient Needs:\n${result.clientNeeds.map(n => `- ${n}`).join('\n')}\n\nNext Steps:\n${result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReport = () => {
    if (!result) return;
    const content = `# Call Summary Report\n## Client: ${clientName || 'Unknown'}\n## Date: ${new Date().toLocaleDateString()}\n## Sentiment: ${result.sentiment}\n\n---\n\n### Summary\n${result.summary}\n\n### Action Items\n${result.actionItems.map(i => `- ${i}`).join('\n')}\n\n### Client Needs\n${result.clientNeeds.map(n => `- ${n}`).join('\n')}\n\n### Next Steps\n${result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n### Key Topics\n${result.keyTopics.map(t => `- ${t}`).join('\n')}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `call-summary-${clientName.replace(/\s+/g, "-").toLowerCase() || "report"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  const sentimentColor = (s: string) => {
    if (s === "positive") return "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
    if (s === "negative") return "text-red-400 bg-red-500/20 border-red-500/30";
    if (s === "mixed") return "text-[#1A1A1A] bg-amber-500/20 border-amber-500/30";
    return "text-[#1A1A1A]/70 bg-[#B89555]/20 border-[#B89555]/30/30";
  };

  return (
    <AIToolPremiumLayout
      title="AI Call Summarizer"
      subtitle="Summarize phone calls with clients instantly. Get AI-generated summaries, action items, and next steps."
      icon={<Phone className="h-8 w-8 text-orange-400" />}
      accentColor="orange"
      gradientFrom="orange"
      badge="Call Intelligence"
    >
      <AIToolGuide
        description="Upload audio or enter call notes to get structured summaries with action items, client needs, and next steps."
        steps={[
          "Enter client name and call notes",
          "Optionally upload or record audio",
          "Generate AI-powered summary",
          "Download or copy the report"
        ]}
        benefits={[
          "Instant call summarization",
          "Auto-extracted action items",
          "Client needs detection",
          "Sentiment analysis"
        ]}
        accentColor="orange"
      />

      <div className="space-y-8">
        {/* Input Section */}
        <Card className="bg-orange-900/20 border-orange-500/30">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-2 text-orange-400 mb-4">
              <Phone className="h-5 w-5" />
              <span className="font-semibold">Call Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#1A1A1A]/70">Client Name</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                  className="bg-[#FDFBF7]/50 border-orange-500/30 text-white hover:border-orange-500/50 focus:border-orange-400 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#1A1A1A]/70">Audio Recording (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="dark-outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-orange-500/50 hover:bg-orange-500/10"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload
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
                      size="sm"
                      onClick={startRecording}
                      className="border-orange-500/50 hover:bg-orange-500/10"
                    >
                      <Mic className="w-4 h-4 mr-1" />
                      Record
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={stopRecording}
                      className="bg-red-600 hover:bg-red-500 text-white"
                    >
                      <Mic className="w-4 h-4 mr-1 animate-pulse" />
                      Stop
                    </Button>
                  )}
                </div>
                {audioFile && (
                  <div className="flex items-center gap-2 text-sm text-orange-400 mt-1">
                    <FileAudio className="w-3 h-3" />
                    {audioFile.name}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#1A1A1A]/70">Call Notes</Label>
              <Textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Enter your call notes, key discussion points, and any important details..."
                className="bg-[#FDFBF7]/50 border-orange-500/30 text-white hover:border-orange-500/50 focus:border-orange-400 transition-colors min-h-[150px]"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isProcessing || (!clientName && !callNotes && !audioFile)}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold py-6"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Summarize Call
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Actions Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={`${sentimentColor(result.sentiment)} border`}>
                    {result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1)}
                  </Badge>
                  {result.keyTopics.slice(0, 3).map((topic, i) => (
                    <Badge key={i} variant="outline" className="border-orange-500/30 text-orange-300 text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="dark-outline" size="sm" onClick={copyToClipboard}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="dark-outline" size="sm" onClick={downloadReport}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Summary */}
              <Card className="bg-orange-500/10 border-orange-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-orange-400" />
                    <span className="text-sm font-semibold text-white">Call Summary</span>
                  </div>
                  <p className="text-[#1A1A1A]/70 leading-relaxed">{result.summary}</p>
                </CardContent>
              </Card>

              {/* Action Items */}
              <Card className="bg-orange-900/20 border-orange-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ListChecks className="h-4 w-4 text-orange-400" />
                    <span className="text-sm font-semibold text-white">Action Items</span>
                  </div>
                  <ul className="space-y-2">
                    {result.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[#1A1A1A]/70 text-sm">
                        <ArrowRight className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Client Needs + Next Steps side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-orange-900/20 border-orange-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-semibold text-white">Client Needs</span>
                    </div>
                    <ul className="space-y-2">
                      {result.clientNeeds.map((need, i) => (
                        <li key={i} className="flex items-start gap-2 text-[#1A1A1A]/70 text-sm">
                          <User className="w-3 h-3 text-orange-400 mt-1 flex-shrink-0" />
                          {need}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-orange-900/20 border-orange-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowRight className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-semibold text-white">Next Steps</span>
                    </div>
                    <ul className="space-y-2">
                      {result.nextSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-[#1A1A1A]/70 text-sm">
                          <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-xs flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="p-6 rounded-full bg-orange-500/10 mb-4">
                <Phone className="h-12 w-12 text-orange-400/50" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A]/70">Ready to Summarize</h3>
              <p className="text-sm text-[#1A1A1A]/70 mt-2 max-w-sm">
                Enter call details above to generate an AI-powered summary with action items and next steps
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AICallSummarizerPremium;