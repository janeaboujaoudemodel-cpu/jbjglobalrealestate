import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileAudio, Loader2, Copy, Check, Sparkles, 
  ListChecks, Users, Clock, Target, Calendar,
  Home, Calculator, Brain, Send, Plus, Mic, Square,
  Timer, Globe, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAITool } from "../AIToolsProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AIToolPremiumLayout from "../AIToolPremiumLayout";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";

const DURATION_PRESETS = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "20 min", value: 20 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
];

const AIMeetingSummarizerPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    meetingTitle: "",
    participants: "",
    notes: "",
    duration: "",
  });
  const [copied, setCopied] = useState(false);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [tasksCreated, setTasksCreated] = useState(false);
  const [propertyResults, setPropertyResults] = useState<any[]>([]);
  const [searchingProperties, setSearchingProperties] = useState(false);
  const [mortgageResult, setMortgageResult] = useState<any>(null);
  const [mortgagePrice, setMortgagePrice] = useState("");

  // Live recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<Array<{ original: string; translated?: string; lang?: string }>>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-stop recording when duration reached
  useEffect(() => {
    if (isRecording && selectedDuration && recordingElapsed >= selectedDuration * 60) {
      stopRecording();
      toast.info("Recording ended — duration limit reached");
    }
  }, [recordingElapsed, selectedDuration, isRecording]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [liveTranscript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Collect chunks and transcribe every 15 seconds
      let chunkBuffer: Blob[] = [];
      let lastTranscribeTime = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          chunkBuffer.push(e.data);
        }
        // Transcribe every ~15 seconds of audio
        if (Date.now() - lastTranscribeTime >= 14000 && chunkBuffer.length > 0) {
          const audioBlob = new Blob(chunkBuffer, { type: mimeType.split(';')[0] });
          chunkBuffer = [];
          lastTranscribeTime = Date.now();
          transcribeChunk(audioBlob);
        }
      };

      mediaRecorder.onstop = async () => {
        // Transcribe remaining chunks
        if (chunkBuffer.length > 0) {
          const audioBlob = new Blob(chunkBuffer, { type: mimeType.split(';')[0] });
          chunkBuffer = [];
          await transcribeChunk(audioBlob);
        }
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };

      mediaRecorder.start(5000); // Collect data every 5 seconds
      setIsRecording(true);
      setRecordingElapsed(0);
      setLiveTranscript([]);

      timerRef.current = setInterval(() => {
        setRecordingElapsed(prev => prev + 1);
      }, 1000);

      toast.success("🎙️ Recording started — speak in any language");
    } catch (err: any) {
      if (err.name === 'NotAllowedError') toast.error("Microphone access denied");
      else if (err.name === 'NotFoundError') toast.error("Microphone not found");
      else toast.error("Could not access microphone");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      toast.success("Recording stopped — processing final transcription...");
    }
  }, [isRecording]);

  const transcribeChunk = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(audioBlob);
      });

      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64, language: 'auto' }
      });

      if (error) throw error;
      if (data?.text) {
        const entry = {
          original: data.text,
          translated: data.translated_text || undefined,
          lang: data.language_name || undefined,
        };
        setLiveTranscript(prev => [...prev, entry]);
        // Append to notes
        const appendText = data.translated_text && !data.is_english
          ? `[${data.language_name || 'Original'}]: ${data.text}\n[English]: ${data.translated_text}\n\n`
          : `${data.text}\n\n`;
        setFormData(prev => ({ ...prev, notes: prev.notes + appendText }));
      }
    } catch (err) {
      console.error("Chunk transcription error:", err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!formData.notes.trim()) {
      toast.error("Please enter meeting notes or record a session");
      return;
    }
    const result = await invokeTool("ai-meeting-summarizer", formData);
    if (result.success) {
      toast.success("Meeting summarized successfully!");
    }
  };

  const copyToClipboard = (text?: string) => {
    const content = text || response?.summary || "";
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateAllTasks = async () => {
    const items = response?.actionItems;
    if (!items?.length) return;
    setCreatingTasks(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please log in"); return; }
      
      // Create action item tasks + follow-up schedule
      const baseTasks = items.map((item: any) => ({
        title: typeof item === "string" ? item : item.task || item.title || String(item),
        description: `From meeting: ${formData.meetingTitle || "Untitled"}\nParticipants: ${formData.participants || "N/A"}`,
        priority: typeof item === "object" ? item.priority || "medium" : "medium",
        due_date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
        status: "pending",
        category: "follow-up",
        user_id: user.id,
      }));

      // Add follow-up reminders: 3-day, 7-day, 14-day
      const followUpTasks = [
        { days: 3, label: "3-day follow-up" },
        { days: 7, label: "7-day check-in" },
        { days: 14, label: "14-day deal progress review" },
      ].map(f => ({
        title: `${f.label}: ${formData.meetingTitle || "Meeting follow-up"}`,
        description: `Scheduled follow-up from meeting with ${formData.participants || "client"}.\n\nReview action items and check progress.`,
        priority: f.days <= 3 ? "high" : "medium",
        due_date: new Date(Date.now() + f.days * 86400000).toISOString().split("T")[0],
        status: "pending",
        category: "follow-up",
        user_id: user.id,
      }));

      const allTasks = [...baseTasks, ...followUpTasks];
      const { error } = await supabase.from("admin_tasks").insert(allTasks);
      if (error) throw error;
      setTasksCreated(true);
      toast.success(`${allTasks.length} tasks created (${baseTasks.length} actions + ${followUpTasks.length} follow-ups)`);
    } catch (e: any) {
      toast.error("Failed to create tasks: " + e.message);
    } finally {
      setCreatingTasks(false);
    }
  };

  const handlePropertySearch = async () => {
    setSearchingProperties(true);
    try {
      const notesLower = formData.notes.toLowerCase();
      let query = supabase
        .from("projects")
        .select("id, name, slug, price_from, area_name, developer_name, property_type_label, bedrooms_min, bedrooms_max, construction_status")
        .order("price_from", { ascending: false })
        .limit(6);

      const budgetMatch = formData.notes.match(/[\d,]+(?:\s*(?:aed|AED|million|m))/);
      if (budgetMatch) {
        let budget = parseInt(budgetMatch[0].replace(/[^0-9]/g, ""));
        if (budgetMatch[0].toLowerCase().includes("million") || budgetMatch[0].toLowerCase().includes("m")) budget *= 1000000;
        query = query.lte("price_from", budget * 1.3);
      }

      if (notesLower.includes("villa")) query = query.ilike("property_type_label", "%villa%");
      else if (notesLower.includes("apartment")) query = query.ilike("property_type_label", "%apartment%");
      if (notesLower.includes("marina")) query = query.ilike("area_name", "%marina%");
      else if (notesLower.includes("downtown")) query = query.ilike("area_name", "%downtown%");
      else if (notesLower.includes("palm")) query = query.ilike("area_name", "%palm%");

      const { data, error } = await query;
      if (error) throw error;
      setPropertyResults(data || []);
      if (!data?.length) toast.info("No matching properties found.");
    } catch (e: any) {
      toast.error("Property search failed: " + e.message);
    } finally {
      setSearchingProperties(false);
    }
  };

  const handleMortgageCalc = () => {
    const price = parseInt(mortgagePrice.replace(/[^0-9]/g, "")) || 2000000;
    const down = price * 0.2;
    const loan = price - down;
    const rate = 4.5 / 100 / 12;
    const n = 25 * 12;
    const monthly = (loan * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
    setMortgageResult({ price, down, loan, monthly: Math.round(monthly), rate: 4.5, years: 25 });
  };

  // Generate AI follow-up response
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState("");

  const handleGenerateResponse = async () => {
    if (!response && !formData.notes) return;
    setGeneratingResponse(true);
    try {
      const { data, error } = await supabase.functions.invoke('lovable-ai', {
        body: {
          model: 'openai/gpt-5-mini',
          messages: [
            { role: 'system', content: 'You are a professional real estate follow-up assistant for JBJ Global Real Estate Dubai. Generate a polished, warm follow-up message based on meeting context. Keep it concise (150-250 words). Include specific references to what was discussed.' },
            { role: 'user', content: `Generate a follow-up message for this meeting:\n\nTitle: ${formData.meetingTitle}\nParticipants: ${formData.participants}\nNotes: ${formData.notes.slice(0, 2000)}\n\nSummary: ${response?.summary || response?.executiveSummary || ''}\nAction Items: ${JSON.stringify(response?.actionItems?.slice(0, 5) || [])}` }
          ]
        }
      });
      if (error) throw error;
      setGeneratedResponse(data?.choices?.[0]?.message?.content || "Could not generate response.");
    } catch (e: any) {
      toast.error("Failed to generate response: " + e.message);
    } finally {
      setGeneratingResponse(false);
    }
  };

  return (
    <AIToolPremiumLayout
      title="AI Meeting Summarizer & CRM Assistant"
      subtitle="Record sessions, transcribe any language, extract action items, and sync with CRM"
      icon={<Brain className="h-8 w-8 text-violet-400" />}
      accentColor="violet"
      gradientFrom="violet"
      badge="Meeting Intelligence + CRM"
    >
      <div className="space-y-8">
        {/* Input Section */}
        <Card className="bg-violet-900/20 border-violet-500/30">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-2 text-violet-400 mb-4">
              <FileAudio className="h-5 w-5" />
              <span className="font-semibold">Meeting Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-400" />
                  Meeting Title
                </Label>
                <Input
                  placeholder="Client Discovery Call - Palm Jumeirah"
                  value={formData.meetingTitle}
                  onChange={(e) => handleChange("meetingTitle", e.target.value)}
                  className="bg-zinc-900/50 border-violet-500/30 text-white hover:border-violet-500/50 focus:border-violet-400 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Users className="h-4 w-4 text-violet-400" />
                  Participants
                </Label>
                <Input
                  placeholder="John Smith (Client), Sarah Ahmed (Agent)"
                  value={formData.participants}
                  onChange={(e) => handleChange("participants", e.target.value)}
                  className="bg-zinc-900/50 border-violet-500/30 text-white hover:border-violet-500/50 focus:border-violet-400 transition-colors"
                />
              </div>
            </div>

            {/* Duration Presets */}
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-2">
                <Timer className="h-4 w-4 text-violet-400" />
                Session Duration
              </Label>
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    size="sm"
                    variant={selectedDuration === preset.value ? "default" : "outline"}
                    onClick={() => {
                      setSelectedDuration(selectedDuration === preset.value ? null : preset.value);
                      handleChange("duration", `${preset.value} minutes`);
                    }}
                    className={selectedDuration === preset.value
                      ? "bg-violet-600 text-white border-violet-500"
                      : "border-violet-500/30 text-zinc-400 hover:text-white hover:border-violet-500/50"
                    }
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Live Recording Section */}
            <div className="bg-zinc-900/60 border border-violet-500/20 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-violet-400" />
                  <span className="text-white font-semibold text-sm">Live Session Recorder</span>
                  <Badge variant="outline" className="border-violet-500/30 text-violet-400 text-[10px]">
                    <Globe className="h-3 w-3 mr-1" /> Any Language
                  </Badge>
                </div>
                {isRecording && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-400 text-sm font-mono">{formatTime(recordingElapsed)}</span>
                    {selectedDuration && (
                      <span className="text-zinc-500 text-sm">/ {formatTime(selectedDuration * 60)}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={isRecording
                    ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                    : "bg-violet-600 hover:bg-violet-500 text-white"
                  }
                  size="default"
                >
                  {isRecording ? (
                    <><Square className="h-4 w-4 mr-2 fill-current" /> Stop Recording</>
                  ) : (
                    <><Mic className="h-4 w-4 mr-2" /> Start Recording Session</>
                  )}
                </Button>
                {isTranscribing && (
                  <span className="text-violet-400 text-xs flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Transcribing...
                  </span>
                )}
              </div>

              {/* Live Transcript Display */}
              {liveTranscript.length > 0 && (
                <div
                  ref={transcriptContainerRef}
                  className="bg-zinc-800/60 rounded-lg p-3 max-h-[200px] overflow-y-auto space-y-2"
                >
                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Live Transcript</p>
                  {liveTranscript.map((entry, i) => (
                    <div key={i} className="text-sm space-y-0.5">
                      {entry.translated ? (
                        <>
                          <p className="text-zinc-400">
                            <span className="text-violet-400 text-xs">[{entry.lang || 'Original'}]</span> {entry.original}
                          </p>
                          <p className="text-white">
                            <span className="text-emerald-400 text-xs">[English]</span> {entry.translated}
                          </p>
                        </>
                      ) : (
                        <p className="text-white">{entry.original}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-zinc-500 text-xs">
                Records audio, transcribes every 15 seconds, and auto-translates non-English speech. 
                Works with Zoom, phone calls, live meetings — any audio your mic picks up.
              </p>
            </div>

            {/* Notes Textarea with Voice Button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300">Meeting Notes / Transcript *</Label>
                <VoiceInputButton
                  onTranscript={(text) => handleChange("notes", formData.notes + (formData.notes ? "\n" : "") + text)}
                  onTranscriptResult={(result) => {
                    if (result.translated && !result.isEnglish) {
                      handleChange("notes", formData.notes + 
                        `\n[${result.languageName}]: ${result.original}\n[English]: ${result.translated}\n`
                      );
                    }
                  }}
                  size="sm"
                  variant="outline"
                  className="border-violet-500/30 text-violet-400 hover:text-white"
                />
              </div>
              <Textarea
                placeholder="Paste meeting notes, or use the recorder above / voice button to capture audio..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={8}
                className="bg-zinc-900/50 border-violet-500/30 text-white hover:border-violet-500/50 focus:border-violet-400 transition-colors"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-semibold py-6"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Summarizing Meeting...</>
              ) : (
                <><Sparkles className="h-5 w-5 mr-2" /> Generate Summary & Analysis</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {response ? (
            <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Action Items with CRM Sync */}
              {response.actionItems && response.actionItems.length > 0 && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <Card className="bg-violet-500/10 border-violet-500/30 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ListChecks className="h-5 w-5 text-violet-400" />
                        <h4 className="font-semibold text-white">Action Items</h4>
                        <Badge className="bg-violet-500/20 text-violet-400 border-0">{response.actionItems.length} items</Badge>
                      </div>
                      <Button size="sm" onClick={handleCreateAllTasks} disabled={creatingTasks || tasksCreated} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
                        {tasksCreated ? <><Check className="h-3 w-3 mr-1" /> Synced + Follow-ups</> : creatingTasks ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Creating...</> : <><Plus className="h-3 w-3 mr-1" /> Create Tasks + Follow-ups</>}
                      </Button>
                    </div>
                    <ul className="space-y-2">
                      {response.actionItems.map((item: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <span className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 text-xs text-violet-400 font-semibold">{idx + 1}</span>
                          <span className="text-zinc-300">{typeof item === "string" ? item : item.task || JSON.stringify(item)}</span>
                        </li>
                      ))}
                    </ul>
                    {tasksCreated && (
                      <p className="text-emerald-400 text-xs mt-3 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Tasks + 3-day, 7-day, 14-day follow-up reminders created
                      </p>
                    )}
                  </Card>
                </motion.div>
              )}

              {/* Key Decisions */}
              {response.keyDecisions && response.keyDecisions.length > 0 && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
                  <Card className="bg-emerald-500/10 border-emerald-500/30 p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-emerald-400" />
                      <h4 className="font-semibold text-white">Key Decisions</h4>
                    </div>
                    <ul className="space-y-2">
                      {response.keyDecisions.map((decision: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                          <span className="text-emerald-400">✓</span>
                          {typeof decision === "string" ? decision : decision.decision || JSON.stringify(decision)}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              )}

              {/* Follow-ups */}
              {response.followUps && response.followUps.length > 0 && (
                <Card className="bg-violet-900/20 border-violet-500/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-violet-400" />
                    <h4 className="font-semibold text-white">Follow-ups Required</h4>
                  </div>
                  <ul className="space-y-2">
                    {response.followUps.map((followUp: string, idx: number) => (
                      <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-0.5 text-violet-400 flex-shrink-0" />
                        {followUp}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Full Summary */}
              <Card className="bg-violet-900/20 border-violet-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white">Full Summary</h4>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard()}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[300px] overflow-y-auto">
                    {response.summary || response.executiveSummary || "No summary generated."}
                  </div>
                </CardContent>
              </Card>

              {/* AI Response Generator */}
              <Card className="bg-violet-900/20 border-violet-500/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-violet-400" />
                      <h4 className="font-semibold text-white">AI Follow-up Response</h4>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleGenerateResponse}
                      disabled={generatingResponse}
                      className="bg-violet-600 hover:bg-violet-500 text-white text-xs"
                    >
                      {generatingResponse ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generating...</> : <><Send className="h-3 w-3 mr-1" /> Generate Response</>}
                    </Button>
                  </div>
                  {generatedResponse && (
                    <div className="bg-zinc-800/50 p-4 rounded-lg space-y-2">
                      <p className="text-zinc-300 text-sm whitespace-pre-wrap">{generatedResponse}</p>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedResponse)} className="text-xs">
                        <Copy className="h-3 w-3 mr-1" /> Copy Message
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CRM Tools Tabs */}
              <Card className="bg-zinc-900/50 border-violet-500/20">
                <CardContent className="p-4">
                  <Tabs defaultValue="properties">
                    <TabsList className="bg-zinc-800 border-zinc-700 w-full">
                      <TabsTrigger value="properties" className="flex-1 data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                        <Home className="h-4 w-4 mr-1" /> Properties
                      </TabsTrigger>
                      <TabsTrigger value="mortgage" className="flex-1 data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                        <Calculator className="h-4 w-4 mr-1" /> Mortgage
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="properties" className="mt-4 space-y-3">
                      <p className="text-zinc-400 text-xs">Auto-detect property preferences from meeting notes:</p>
                      <Button onClick={handlePropertySearch} disabled={searchingProperties} size="sm" className="bg-violet-600 hover:bg-violet-500 text-white">
                        {searchingProperties ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Home className="h-4 w-4 mr-1" />}
                        Find Matching Properties
                      </Button>
                      {propertyResults.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {propertyResults.map((p) => (
                            <a key={p.id} href={`/project/${p.slug}`} target="_blank" rel="noopener noreferrer" className="block bg-zinc-800 rounded-lg p-3 hover:bg-zinc-700 transition-colors">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-white text-sm font-medium">{p.name}</p>
                                  <p className="text-zinc-400 text-xs">{p.area_name} · {p.property_type_label} · {p.bedrooms_min}-{p.bedrooms_max} BR</p>
                                </div>
                                <Badge className="bg-violet-500/20 text-violet-400 border-0 text-xs">AED {(p.price_from || 0).toLocaleString()}</Badge>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="mortgage" className="mt-4 space-y-3">
                      <div className="flex gap-2">
                        <Input placeholder="Property price (AED)" value={mortgagePrice} onChange={(e) => setMortgagePrice(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white text-sm" />
                        <Button onClick={handleMortgageCalc} size="sm" className="bg-violet-600 hover:bg-violet-500 text-white">Calculate</Button>
                      </div>
                      {mortgageResult && (
                        <div className="bg-zinc-800 rounded-lg p-3 space-y-1 text-sm">
                          <p className="text-white font-medium">Mortgage Estimate</p>
                          <p className="text-zinc-400">Property: <span className="text-white">AED {mortgageResult.price.toLocaleString()}</span></p>
                          <p className="text-zinc-400">Down Payment (20%): <span className="text-white">AED {mortgageResult.down.toLocaleString()}</span></p>
                          <p className="text-zinc-400">Loan: <span className="text-white">AED {mortgageResult.loan.toLocaleString()}</span></p>
                          <p className="text-zinc-400">Monthly: <span className="text-emerald-400 font-semibold">AED {mortgageResult.monthly.toLocaleString()}</span></p>
                          <p className="text-zinc-500 text-xs mt-1">Rate: {mortgageResult.rate}% · {mortgageResult.years} years · Estimate only</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-6 rounded-full bg-violet-500/10 mb-4">
                <Brain className="h-12 w-12 text-violet-400/50" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-400">Meeting Intelligence + CRM</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                Record a live session or paste notes to get AI summaries, action items with follow-up scheduling, property recommendations, and auto-generated client responses
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AIMeetingSummarizerPremium;
