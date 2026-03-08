import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileAudio, Loader2, Copy, Check, Sparkles, 
  ListChecks, Users, Clock, Target, Calendar,
  Home, Calculator, Brain, Send, Plus, Mic, Square,
  Globe, MessageSquare, Search, UserPlus, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAITool } from "../AIToolsProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AIToolPremiumLayout from "../AIToolPremiumLayout";

interface LinkedLead {
  id: string;
  full_name: string;
  phone_e164: string | null;
  email_lower: string | null;
}

const TRANSLATION_LANGUAGES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ru', label: 'Russian' },
  { value: 'zh', label: 'Chinese' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'hi', label: 'Hindi' },
  { value: 'tr', label: 'Turkish' },
  { value: 'fa', label: 'Farsi/Persian' },
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

  // Translation language
  const [translationLang, setTranslationLang] = useState("auto");

  // CRM Lead Search
  const [leadSearch, setLeadSearch] = useState("");
  const [leadSearchResults, setLeadSearchResults] = useState<LinkedLead[]>([]);
  const [searchingLeads, setSearchingLeads] = useState(false);
  const [linkedLead, setLinkedLead] = useState<LinkedLead | null>(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [creatingLead, setCreatingLead] = useState(false);

  // Live recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [sessionDuration, setSessionDuration] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<Array<{ original: string; translated?: string; lang?: string }>>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // Debounced lead search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!leadSearch.trim()) {
      setLeadSearchResults([]);
      setShowAddLead(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingLeads(true);
      try {
        const { data, error } = await supabase
          .from("crm_leads")
          .select("id, full_name, phone_e164, email_lower")
          .or(`full_name.ilike.%${leadSearch}%,phone_e164.ilike.%${leadSearch}%,phone_raw.ilike.%${leadSearch}%`)
          .is("deleted_at", null)
          .limit(5);
        if (error) throw error;
        setLeadSearchResults(data || []);
        setShowAddLead(!data || data.length === 0);
        if (data && data.length === 0) {
          setNewLeadName(leadSearch);
          setNewLeadPhone("");
        }
      } catch (e) {
        console.error("Lead search error:", e);
      } finally {
        setSearchingLeads(false);
      }
    }, 400);
  }, [leadSearch]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 44100 }
      });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setSessionDuration(null);
      setSessionDate(null);

      let chunkBuffer: Blob[] = [];
      let lastTranscribeTime = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          chunkBuffer.push(e.data);
        }
        if (Date.now() - lastTranscribeTime >= 14000 && chunkBuffer.length > 0) {
          const audioBlob = new Blob(chunkBuffer, { type: mimeType.split(';')[0] });
          chunkBuffer = [];
          lastTranscribeTime = Date.now();
          transcribeChunk(audioBlob);
        }
      };

      mediaRecorder.onstop = async () => {
        if (chunkBuffer.length > 0) {
          const audioBlob = new Blob(chunkBuffer, { type: mimeType.split(';')[0] });
          chunkBuffer = [];
          await transcribeChunk(audioBlob);
        }
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };

      mediaRecorder.start(5000);
      setIsRecording(true);
      setRecordingElapsed(0);
      setLiveTranscript([]);

      timerRef.current = setInterval(() => {
        setRecordingElapsed(prev => prev + 1);
      }, 1000);

      toast.success("Recording started — speak in any language");
    } catch (err: any) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        toast.error("Microphone access denied. Please allow in browser settings.");
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        toast.error("Microphone not found. Please check your device.");
      } else {
        toast.error("Could not access microphone");
      }
    }
  }, [translationLang]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const durationStr = formatTime(recordingElapsed);
      const dateStr = new Date().toLocaleString('en-US', { 
        weekday: 'short', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      });
      setSessionDuration(durationStr);
      setSessionDate(dateStr);
      handleChange("duration", durationStr);
      toast.success(`Recording stopped — Session: ${durationStr}`);
    }
  }, [isRecording, recordingElapsed]);

  const transcribeChunk = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(audioBlob);
      });

      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64, language: translationLang === 'auto' ? 'auto' : translationLang }
      });

      if (error) throw error;
      if (data?.text) {
        const entry = {
          original: data.text,
          translated: data.translated_text || undefined,
          lang: data.language_name || undefined,
        };
        setLiveTranscript(prev => [...prev, entry]);
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

  const handleSelectLead = (lead: LinkedLead) => {
    setLinkedLead(lead);
    setLeadSearch("");
    setLeadSearchResults([]);
    setShowAddLead(false);
    handleChange("participants", lead.full_name + (formData.participants ? `, ${formData.participants}` : ""));
    toast.success(`Linked to ${lead.full_name}`);
  };

  const handleCreateNewLead = async () => {
    if (!newLeadName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    setCreatingLead(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please log in"); return; }

      const { data, error } = await supabase
        .from("crm_leads")
        .insert([{
          full_name: newLeadName.trim(),
          phone_raw: newLeadPhone.trim() || null,
          phone_e164: newLeadPhone.trim() || null,
          owner_user_id: user.id,
          owner_type: "broker_owned" as const,
          source: "Meeting Summarizer",
          notes: `Created from meeting: ${formData.meetingTitle || "Untitled"}`,
        }])
        .select("id, full_name, phone_e164, email_lower")
        .single();

      if (error) throw error;
      setLinkedLead(data);
      setLeadSearch("");
      setShowAddLead(false);
      handleChange("participants", data.full_name + (formData.participants ? `, ${formData.participants}` : ""));
      toast.success(`Lead "${data.full_name}" created and linked`);
    } catch (e: any) {
      toast.error("Failed to create lead: " + e.message);
    } finally {
      setCreatingLead(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.notes.trim()) {
      toast.error("Please enter meeting notes or record a session");
      return;
    }
    const result = await invokeTool("ai-meeting-summarizer", {
      meetingNotes: formData.notes,
      meetingType: formData.meetingTitle || "client meeting",
      participants: formData.participants,
      propertyContext: linkedLead?.full_name || "",
      linkedLeadId: linkedLead?.id,
      sessionDate,
      fullTranscript: liveTranscript.map(t => t.original).join(' '),
    });
    if (result.success) {
      toast.success("Meeting summarized successfully!");
      // Update linked lead if exists
      if (linkedLead?.id) {
        try {
          await supabase.from("crm_leads").update({
            notes: `Meeting on ${sessionDate || new Date().toLocaleDateString()}: ${formData.meetingTitle || 'Meeting'}\n${formData.notes.slice(0, 500)}...`,
            updated_at: new Date().toISOString(),
          }).eq("id", linkedLead.id);
        } catch (e) {
          console.error("Failed to update lead:", e);
        }
      }
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

      const baseTasks = items.map((item: any) => ({
        title: typeof item === "string" ? item : item.task || item.title || String(item),
        description: `From meeting: ${formData.meetingTitle || "Untitled"}\nParticipants: ${formData.participants || "N/A"}${linkedLead ? `\nLinked Lead: ${linkedLead.full_name}` : ""}`,
        priority: typeof item === "object" ? item.priority || "medium" : "medium",
        due_date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
        status: "pending",
        category: "follow-up",
        user_id: user.id,
      }));

      const followUpTasks = [
        { days: 3, label: "3-day follow-up" },
        { days: 7, label: "7-day check-in" },
        { days: 14, label: "14-day deal progress review" },
      ].map(f => ({
        title: `${f.label}: ${formData.meetingTitle || "Meeting follow-up"}`,
        description: `Scheduled follow-up from meeting with ${formData.participants || "client"}.\n\nReview action items and check progress.${linkedLead ? `\nLinked Lead: ${linkedLead.full_name}` : ""}`,
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
      icon={<Brain className="h-8 w-8 text-gold" />}
      accentColor="violet"
      gradientFrom="violet"
      badge="Meeting Intelligence + CRM"
    >
      <div className="space-y-6">
        {/* Meeting Details */}
        <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/30 shadow-md">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <FileAudio className="h-4 w-4 text-gold" />
              </div>
              <span className="font-semibold text-black text-lg">Meeting Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-700 text-sm flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gold" />
                  Meeting Title
                </Label>
                <Input
                  placeholder="Client Discovery Call - Palm Jumeirah"
                  value={formData.meetingTitle}
                  onChange={(e) => handleChange("meetingTitle", e.target.value)}
                  className="bg-white border-gold/30 text-black placeholder:text-zinc-400 focus:border-gold focus:ring-gold/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-700 text-sm flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-gold" />
                  Participants
                </Label>
                <Input
                  placeholder="John Smith (Client), Sarah Ahmed (Agent)"
                  value={formData.participants}
                  onChange={(e) => handleChange("participants", e.target.value)}
                  className="bg-white border-gold/30 text-black placeholder:text-zinc-400 focus:border-gold focus:ring-gold/20"
                />
              </div>
            </div>

            {/* CRM Lead Link Section */}
            <div className="bg-white border border-gold/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center">
                  <Search className="h-3.5 w-3.5 text-gold" />
                </div>
                <span className="text-black font-semibold text-sm">Link to CRM Lead</span>
              </div>

              {linkedLead ? (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-black font-medium text-sm">{linkedLead.full_name}</p>
                    <p className="text-zinc-500 text-xs">{linkedLead.phone_e164 || linkedLead.email_lower || "No contact"}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLinkedLead(null)}
                    className="text-zinc-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder="Search by name or phone..."
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      className="pl-10 bg-white border-gold/30 text-black placeholder:text-zinc-400"
                    />
                    {searchingLeads && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold animate-spin" />}
                  </div>

                  {leadSearchResults.length > 0 && (
                    <div className="space-y-1 max-h-[150px] overflow-y-auto">
                      {leadSearchResults.map((lead) => (
                        <button
                          key={lead.id}
                          onClick={() => handleSelectLead(lead)}
                          className="w-full text-left p-2 rounded-lg hover:bg-gold/10 border border-transparent hover:border-gold/30 transition-colors"
                        >
                          <p className="text-black font-medium text-sm">{lead.full_name}</p>
                          <p className="text-zinc-500 text-xs">{lead.phone_e164 || lead.email_lower || "No contact"}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {showAddLead && (
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
                      <p className="text-zinc-600 text-xs font-medium">No lead found — Add new lead:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Full Name"
                          value={newLeadName}
                          onChange={(e) => setNewLeadName(e.target.value)}
                          className="bg-white border-zinc-300 text-black text-sm"
                        />
                        <Input
                          placeholder="Phone (optional)"
                          value={newLeadPhone}
                          onChange={(e) => setNewLeadPhone(e.target.value)}
                          className="bg-white border-zinc-300 text-black text-sm"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleCreateNewLead}
                        disabled={creatingLead || !newLeadName.trim()}
                        className="w-full bg-black hover:bg-zinc-800 text-gold text-xs"
                      >
                        {creatingLead ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <UserPlus className="h-3 w-3 mr-1" />}
                        Create & Link Lead
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Live Recording Section */}
            <div className="bg-white border border-gold/20 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                    <Mic className="h-4 w-4 text-gold" />
                  </div>
                  <span className="text-black font-semibold">Live Session Recorder</span>
                </div>
                
                {/* Translation Language Selector */}
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gold" />
                  <Select value={translationLang} onValueChange={setTranslationLang}>
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-white border-gold/30 text-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSLATION_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value} className="text-xs">
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={isRecording
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/25 animate-pulse px-6"
                    : "bg-black hover:bg-zinc-800 text-gold shadow-lg shadow-black/20 px-6"
                  }
                  size="lg"
                >
                  {isRecording ? (
                    <><Square className="h-4 w-4 mr-2 fill-current" /> Stop Recording</>
                  ) : (
                    <><Mic className="h-4 w-4 mr-2" /> Start Recording Session</>
                  )}
                </Button>
                
                {isRecording && (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-600 text-sm font-mono font-bold">{formatTime(recordingElapsed)}</span>
                  </div>
                )}
                
                {isTranscribing && (
                  <span className="text-gold text-xs flex items-center gap-1.5 font-medium">
                    <Loader2 className="h-3 w-3 animate-spin" /> Transcribing...
                  </span>
                )}
              </div>

              {/* Session Info After Recording */}
              {!isRecording && sessionDuration && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <Clock className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-black font-medium text-sm">Session Recorded</p>
                    <p className="text-zinc-600 text-xs">Duration: {sessionDuration} · {sessionDate}</p>
                  </div>
                </div>
              )}

              {/* Live Transcript Display */}
              {liveTranscript.length > 0 && (
                <div
                  ref={transcriptContainerRef}
                  className="bg-[#FDFBF7] border border-gold/15 rounded-lg p-3 max-h-[200px] overflow-y-auto space-y-2"
                >
                  <p className="text-gold text-[10px] uppercase tracking-wider font-semibold mb-1">Live Transcript</p>
                  {liveTranscript.map((entry, i) => (
                    <div key={i} className="text-sm space-y-0.5">
                      {entry.translated ? (
                        <>
                          <p className="text-zinc-500">
                            <span className="text-gold text-xs font-medium">[{entry.lang || 'Original'}]</span> {entry.original}
                          </p>
                          <p className="text-black font-medium">
                            <span className="text-emerald-600 text-xs font-medium">[English]</span> {entry.translated}
                          </p>
                        </>
                      ) : (
                        <p className="text-black">{entry.original}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-zinc-500 text-xs leading-relaxed">
                Records audio, transcribes every 15 seconds, and auto-translates non-English speech. 
                Works with Zoom, phone calls, live meetings — any audio your mic picks up.
              </p>
            </div>

            {/* Notes Textarea */}
            <div className="space-y-1.5">
              <Label className="text-zinc-700 text-sm">Meeting Notes / Transcript *</Label>
              <Textarea
                placeholder="Paste meeting notes, or use the recorder above to capture audio..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={8}
                className="bg-white border-gold/30 text-black placeholder:text-zinc-400 focus:border-gold focus:ring-gold/20"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-black hover:bg-zinc-800 text-gold font-semibold py-6 shadow-lg shadow-black/20 text-base"
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
            <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
              {/* Action Items */}
              {response.actionItems && response.actionItems.length > 0 && (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/30 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center">
                          <ListChecks className="h-3.5 w-3.5 text-gold" />
                        </div>
                        <h4 className="font-semibold text-black">Action Items</h4>
                        <Badge className="bg-gold/10 text-gold border border-gold/30 text-xs">{response.actionItems.length}</Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleCreateAllTasks}
                        disabled={creatingTasks || tasksCreated}
                        className={tasksCreated
                          ? "bg-emerald-600 text-white text-xs"
                          : "bg-black hover:bg-zinc-800 text-gold text-xs"
                        }
                      >
                        {tasksCreated ? <><Check className="h-3 w-3 mr-1" /> Synced + Follow-ups</> : creatingTasks ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Creating...</> : <><Plus className="h-3 w-3 mr-1" /> Create Tasks + Follow-ups</>}
                      </Button>
                    </div>
                    <ul className="space-y-2.5">
                      {response.actionItems.map((item: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <span className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0 text-xs text-gold font-semibold">{idx + 1}</span>
                          <span className="text-zinc-700">{typeof item === "string" ? item : item.task || JSON.stringify(item)}</span>
                        </li>
                      ))}
                    </ul>
                    {tasksCreated && (
                      <p className="text-emerald-600 text-xs mt-3 flex items-center gap-1 font-medium">
                        <Check className="h-3 w-3" /> Tasks + 3-day, 7-day, 14-day follow-up reminders created
                      </p>
                    )}
                  </Card>
                </motion.div>
              )}

              {/* Key Decisions */}
              {response.keyDecisions && response.keyDecisions.length > 0 && (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
                  <Card className="bg-gradient-to-br from-[#F0FDF4] to-[#ECFDF5] border border-emerald-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center">
                        <Target className="h-3.5 w-3.5 text-white" />
                      </div>
                      <h4 className="font-semibold text-black">Key Decisions</h4>
                    </div>
                    <ul className="space-y-2">
                      {response.keyDecisions.map((decision: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-zinc-700">
                          <span className="text-emerald-600 font-bold">[OK]</span>
                          {typeof decision === "string" ? decision : decision.decision || JSON.stringify(decision)}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              )}

              {/* Follow-ups */}
              {response.followUps && response.followUps.length > 0 && (
                <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/30 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center">
                      <Calendar className="h-3.5 w-3.5 text-gold" />
                    </div>
                    <h4 className="font-semibold text-black">Follow-ups Required</h4>
                  </div>
                  <ul className="space-y-2">
                    {response.followUps.map((followUp: string, idx: number) => (
                      <li key={idx} className="text-sm text-zinc-700 flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-0.5 text-gold flex-shrink-0" />
                        {followUp}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Full Summary */}
              <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/30">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-black">Full Summary</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard()}
                      className="border-gold/30 text-gold hover:bg-gold/10"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="bg-white border border-gold/15 p-4 rounded-lg text-zinc-700 whitespace-pre-wrap text-sm max-h-[300px] overflow-y-auto">
                    {response.summary || response.executiveSummary || "No summary generated."}
                  </div>
                </CardContent>
              </Card>

              {/* AI Response Generator */}
              <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/30">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center">
                        <MessageSquare className="h-3.5 w-3.5 text-gold" />
                      </div>
                      <h4 className="font-semibold text-black">AI Follow-up Response</h4>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleGenerateResponse}
                      disabled={generatingResponse}
                      className="bg-black hover:bg-zinc-800 text-gold text-xs"
                    >
                      {generatingResponse ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generating...</> : <><Send className="h-3 w-3 mr-1" /> Generate Response</>}
                    </Button>
                  </div>
                  {generatedResponse && (
                    <div className="bg-white border border-gold/15 p-4 rounded-lg space-y-2">
                      <p className="text-zinc-700 text-sm whitespace-pre-wrap">{generatedResponse}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedResponse)}
                        className="text-xs border-gold/30 text-gold hover:bg-gold/10"
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy Message
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CRM Tools Tabs */}
              <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/30">
                <CardContent className="p-5">
                  <Tabs defaultValue="properties">
                    <TabsList className="bg-white border border-gold/20 w-full">
                      <TabsTrigger value="properties" className="flex-1 data-[state=active]:bg-black data-[state=active]:text-gold text-zinc-600">
                        <Home className="h-4 w-4 mr-1" /> Properties
                      </TabsTrigger>
                      <TabsTrigger value="mortgage" className="flex-1 data-[state=active]:bg-black data-[state=active]:text-gold text-zinc-600">
                        <Calculator className="h-4 w-4 mr-1" /> Mortgage
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="properties" className="mt-4 space-y-3">
                      <p className="text-zinc-500 text-xs">Auto-detect property preferences from meeting notes:</p>
                      <Button
                        onClick={handlePropertySearch}
                        disabled={searchingProperties}
                        size="sm"
                        className="bg-black hover:bg-zinc-800 text-gold"
                      >
                        {searchingProperties ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Home className="h-4 w-4 mr-1" />}
                        Find Matching Properties
                      </Button>
                      {propertyResults.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {propertyResults.map((p) => (
                            <a key={p.id} href={`/project/${p.slug}`} target="_blank" rel="noopener noreferrer" className="block bg-white border border-gold/15 rounded-lg p-3 hover:border-gold/40 transition-colors">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-black text-sm font-medium">{p.name}</p>
                                  <p className="text-zinc-500 text-xs">{p.area_name} · {p.property_type_label} · {p.bedrooms_min}-{p.bedrooms_max} BR</p>
                                </div>
                                <Badge className="bg-gold/10 text-gold border border-gold/30 text-xs">AED {(p.price_from || 0).toLocaleString()}</Badge>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="mortgage" className="mt-4 space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Property price (AED)"
                          value={mortgagePrice}
                          onChange={(e) => setMortgagePrice(e.target.value)}
                          className="bg-white border-gold/30 text-black focus:border-gold text-sm"
                        />
                        <Button onClick={handleMortgageCalc} size="sm" className="bg-black hover:bg-zinc-800 text-gold">
                          Calculate
                        </Button>
                      </div>
                      {mortgageResult && (
                        <div className="bg-white border border-gold/15 rounded-lg p-3 space-y-1 text-sm">
                          <p className="text-black font-medium">Mortgage Estimate</p>
                          <p className="text-zinc-500">Property: <span className="text-black font-medium">AED {mortgageResult.price.toLocaleString()}</span></p>
                          <p className="text-zinc-500">Down Payment (20%): <span className="text-black font-medium">AED {mortgageResult.down.toLocaleString()}</span></p>
                          <p className="text-zinc-500">Loan: <span className="text-black font-medium">AED {mortgageResult.loan.toLocaleString()}</span></p>
                          <p className="text-zinc-500">Monthly: <span className="text-emerald-600 font-bold">AED {mortgageResult.monthly.toLocaleString()}</span></p>
                          <p className="text-zinc-400 text-xs mt-1">Rate: {mortgageResult.rate}% · {mortgageResult.years} years · Estimate only</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-6 rounded-full bg-gold/10 border border-gold/20 mb-4">
                <Brain className="h-12 w-12 text-gold" />
              </div>
              <h3 className="text-lg font-semibold text-black">Meeting Intelligence + CRM</h3>
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
