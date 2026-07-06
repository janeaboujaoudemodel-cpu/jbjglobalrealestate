/**
 * Owner Inbox Thread Component - JBJ Global Real Estate
 * Displays conversation thread with AI reply capabilities
 */

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Mic,
  User,
  Clock,
  CheckCircle,
  Edit3,
  LinkIcon,
  MoreHorizontal,
  Volume2,
  Loader2,
  Copy,
  X,
  Calendar,
  FileText,
  Play,
  Pause,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CommThread, ThreadStatus, useThreadMessages } from "@/hooks/useOwnerInbox";
import useAIReplyEngine from "@/hooks/useAIReplyEngine";
import useCommAITriage, { CATEGORY_META } from "@/hooks/useCommAITriage";
import { useEffect as useReactEffect } from "react";
import { Brain, ListTodo, CalendarPlus, NotebookPen, Wand2 } from "lucide-react";

interface OwnerInboxThreadProps {
  thread: CommThread;
  onStatusChange: (status: ThreadStatus) => void;
  onClose: () => void;
}

const statusOptions: { value: ThreadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'needs_reply', label: 'Needs Reply' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'follow_up_due', label: 'Follow-up Due' },
  { value: 'closed', label: 'Closed' },
];

export default function OwnerInboxThread({ thread, onStatusChange, onClose }: OwnerInboxThreadProps) {
  const [activeTab, setActiveTab] = useState('conversation');
  const [replyText, setReplyText] = useState('');
  const [showAIDraft, setShowAIDraft] = useState(false);
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, isSending } = useThreadMessages(thread.id);
  const {
    templates,
    generateReply,
    generateVoiceReply,
    approveDraft,
    isGenerating,
    isGeneratingVoice,
  } = useAIReplyEngine();
  const { triage, createTask, scheduleMeeting, saveNote } = useCommAITriage();

  // Auto-trigger triage once per thread on open if not yet processed
  useReactEffect(() => {
    if (thread?.id && !thread.ai_processed_at && !triage.isPending) {
      triage.mutate({ threadId: thread.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    sendMessage({ content: replyText.trim() });
    setReplyText('');
  };

  const handleGenerateAIReply = async () => {
    generateReply(
      {
        threadId: thread.id,
        thread,
        messages,
        replyType: 'text',
        language: 'en',
      },
      {
        onSuccess: (data) => {
          setAiDraft(data.draft.content);
          setShowAIDraft(true);
        },
      }
    );
  };

  const handleGenerateVoiceReply = async () => {
    if (!aiDraft) {
      toast.error('Generate a text reply first');
      return;
    }

    generateVoiceReply(
      { script: aiDraft, threadId: thread.id },
      {
        onSuccess: (data) => {
          // Play the generated audio
          if (audioRef.current) {
            audioRef.current.src = data.audioUrl;
            audioRef.current.play();
          }
          toast.success('Voice reply generated');
        },
      }
    );
  };

  const handleApproveAIDraft = () => {
    if (!aiDraft) return;
    setReplyText(aiDraft);
    setShowAIDraft(false);
    setAiDraft(null);
  };

  const handlePlayVoice = (url: string) => {
    if (playingAudio === url) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingAudio(url);
      }
    }
  };

  return (
    <Card className="border-2 border-[#B89555]/20 bg-[#FDFBF7]/90 backdrop-blur-sm h-full flex flex-col overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <CardHeader className="border-b border-[#B89555]/10 py-3 px-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border border-[#B89555]/20">
              {thread.contact_avatar_url ? (
                <img src={thread.contact_avatar_url} alt="" className="w-full h-full rounded-full object-cover"  loading="lazy" decoding="async" />
              ) : (
                <User className="h-5 w-5 text-[#1A1A1A]" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-[#1A1A1A] truncate">
                {thread.contact_name || thread.contact_identifier}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-[#1A1A1A]/70 truncate max-w-[240px]">{thread.contact_identifier}</p>
                {thread.ai_category && CATEGORY_META[thread.ai_category] && (
                  <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${CATEGORY_META[thread.ai_category].color}`}>
                    {CATEGORY_META[thread.ai_category].label}
                  </Badge>
                )}
                {thread.ai_priority && thread.ai_priority !== "medium" && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-[#B89555]/30">
                    {thread.ai_priority}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Select value={thread.status} onValueChange={(v) => onStatusChange(v as ThreadStatus)}>
              <SelectTrigger className="w-[130px] h-8 text-xs border-[#B89555]/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {thread.lead ? (
              <Badge variant="outline" className="text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30 text-xs">
                <LinkIcon className="h-3 w-3 mr-1" />
                {thread.lead.full_name}
              </Badge>
            ) : (
              <Button variant="outline" size="sm" className="h-8 text-xs border-[#B89555]/30">
                <LinkIcon className="h-3 w-3 mr-1" />
                Link to Lead
              </Button>
            )}

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-3">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto w-full gap-1 p-1">
            <TabsTrigger value="conversation" className="text-xs min-h-8 whitespace-nowrap data-[state=active]:jj-emerald-metallic data-[state=active]:text-white">Conversation</TabsTrigger>
            <TabsTrigger value="lead" className="text-xs min-h-8 whitespace-nowrap data-[state=active]:jj-emerald-metallic data-[state=active]:text-white">Lead Profile</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs min-h-8 whitespace-nowrap data-[state=active]:jj-emerald-metallic data-[state=active]:text-white">Activity</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs min-h-8 whitespace-nowrap data-[state=active]:jj-emerald-metallic data-[state=active]:text-white">AI Suggestions</TabsTrigger>
          </TabsList>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <TabsContent value="conversation" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <Skeleton className="h-16 w-3/4 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Clock className="h-12 w-12 text-[#1A1A1A]/70 mb-4" />
                <p className="text-[#1A1A1A]/70">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
 message.direction === 'outbound'
 ? 'bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] text-[#1A1A1A] rounded-tr-sm'
 : 'bg-[#FDFBF7] border border-[#B89555]/20 text-[#1A1A1A] rounded-tl-sm'
 }`}>
                      {message.voice_url && (
                        <div className="flex items-center gap-2 mb-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handlePlayVoice(message.voice_url!)}
                          >
                            {playingAudio === message.voice_url ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <div className="h-1 flex-1 bg-[#EFE6D6]/20 rounded-full">
                            <div className="h-full w-1/3 bg-[#EFE6D6] rounded-full" />
                          </div>
                          <span className="text-xs text-[#1A1A1A]/70">
                            {message.voice_duration_seconds || 0}s
                          </span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-[#1A1A1A]/70">
                        <span>
                          {format(new Date(message.created_at), 'HH:mm')}
                        </span>
                        {message.is_ai_generated && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1">
                            <Sparkles className="h-2 w-2 mr-0.5" />
                            AI
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* AI Draft Preview */}
          <AnimatePresence>
            {showAIDraft && aiDraft && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-[#B89555]/10 bg-[#EFE6D6]/5 p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#1A1A1A]" />
                    <span className="text-sm font-medium text-[#1A1A1A]">AI Draft — Jane Bou Jaoude's style</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowAIDraft(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-[#1A1A1A]/70 mb-3">{aiDraft}</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleApproveAIDraft}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Use This
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateVoiceReply}
                    disabled={isGeneratingVoice}
                    className="border-[#B89555]/30"
                  >
                    {isGeneratingVoice ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Volume2 className="h-3 w-3 mr-1" />
                    )}
                    Voice Reply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(aiDraft);
                      toast.success('Copied');
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Triage Panel — always visible so the user is never staring at a blank pane */}
          <div className="border-t border-[#B89555]/10 bg-[#EFE6D6]/20 p-3 flex-shrink-0 space-y-2 max-h-[40%] overflow-y-auto">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#1A1A1A]" />
                  <span className="text-xs font-semibold text-[#1A1A1A]">AI Triage</span>
                  {triage.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px]"
                  onClick={() => triage.mutate({ threadId: thread.id, force: true })}
                  disabled={triage.isPending}
                >
                  <Wand2 className="h-3 w-3 mr-1" /> {thread.ai_summary ? "Re-run" : "Analyze"}
                </Button>
              </div>
              {thread.ai_summary ? (
                <p className="text-xs text-[#1A1A1A]/80 italic">"{thread.ai_summary}"</p>
              ) : (
                <p className="text-xs text-[#1A1A1A]/60 italic">
                  {triage.isPending ? "Analyzing this conversation…" : "AI summary will appear after triage."}
                </p>
              )}
              {thread.ai_suggested_reply ? (
                <div className="rounded-lg border border-[#B89555]/20 bg-[#FDFBF7] p-2">
                  <p className="text-[10px] uppercase tracking-wide text-[#1A1A1A]/60 mb-1">Suggested reply</p>
                  <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{thread.ai_suggested_reply}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button size="sm" variant="primary" className="h-7 text-xs"
                      onClick={() => setReplyText(thread.ai_suggested_reply || "")}>
                      <Edit3 className="h-3 w-3 mr-1" /> Use reply
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs border-[#B89555]/30"
                      onClick={() => { sendMessage({ content: thread.ai_suggested_reply || "" }); }}>
                      <Send className="h-3 w-3 mr-1" /> Send now
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[#B89555]/20 bg-[#FDFBF7]/60 p-2">
                  <p className="text-[11px] text-[#1A1A1A]/60">
                    {thread.ai_category && ["marketing","advertising","campaign","system","business_linkedin","spam"].includes(thread.ai_category)
                      ? "No reply needed — automated/marketing notification."
                      : "No suggested reply yet. Click Analyze to generate one."}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs border-[#B89555]/30"
                  onClick={() => createTask.mutate({
                    thread,
                    title: thread.ai_next_step?.title || `Follow up: ${thread.contact_name ?? thread.contact_identifier}`,
                    dueInHours: thread.ai_next_step?.due_in_hours ?? 24,
                  })}
                  disabled={createTask.isPending}>
                  <ListTodo className="h-3 w-3 mr-1" /> Create task
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs border-[#B89555]/30"
                  onClick={() => scheduleMeeting.mutate({
                    thread,
                    title: thread.ai_next_step?.title || `Meeting: ${thread.contact_name ?? thread.contact_identifier}`,
                    startInHours: thread.ai_next_step?.due_in_hours ?? 24,
                  })}
                  disabled={scheduleMeeting.isPending}>
                  <CalendarPlus className="h-3 w-3 mr-1" /> Schedule meeting
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs border-[#B89555]/30"
                  onClick={() => saveNote.mutate({
                    thread,
                    content: thread.ai_summary || thread.ai_suggested_reply || "Note from AI triage",
                  })}
                  disabled={saveNote.isPending}>
                  <NotebookPen className="h-3 w-3 mr-1" /> Save note
                </Button>
              </div>
              {thread.ai_next_step?.reasoning && (
                <p className="text-[10px] text-[#1A1A1A]/60">Next step: {thread.ai_next_step.reasoning}</p>
              )}
            </div>

          {/* Reply Input */}
          <div className="border-t border-[#B89555]/10 p-3 flex-shrink-0">
            <div className="flex items-end gap-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="min-h-[60px] max-h-[120px] resize-none border-[#B89555]/30"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-[#B89555]/30"
                  onClick={handleGenerateAIReply}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-[#1A1A1A]" />
                  )}
                </Button>
                <Button
                  variant="primary"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-[#1A1A1A]/70 mt-2 text-center">
              Press <kbd className="px-1 py-0.5 bg-[#F7F2EA] rounded text-[10px]">Enter</kbd> to send • <kbd className="px-1 py-0.5 bg-[#F7F2EA] rounded text-[10px]">Shift+Enter</kbd> for new line
            </p>
          </div>
        </TabsContent>

        <TabsContent value="lead" className="flex-1 m-0 p-4 data-[state=inactive]:hidden">
          {thread.lead ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border-2 border-[#B89555]/30">
                  <User className="h-8 w-8 text-[#1A1A1A]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A]">{thread.lead.full_name}</h3>
                  <p className="text-sm text-[#1A1A1A]/70">CRM Lead</p>
                </div>
              </div>
              <Button variant="outline" className="w-full border-[#B89555]/30">
                View Full Lead Profile
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <LinkIcon className="h-12 w-12 text-[#1A1A1A]/70 mb-4" />
              <p className="text-[#1A1A1A]/70 font-medium">Not linked to a lead</p>
              <p className="text-[#1A1A1A]/70 text-sm mt-1">Link this conversation to an existing lead or create a new one</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="border-[#B89555]/30">
                  Link to Lead
                </Button>
                <Button variant="primary">
                  Create Lead
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="flex-1 m-0 p-4 data-[state=inactive]:hidden">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="h-12 w-12 text-[#1A1A1A]/70 mb-4" />
            <p className="text-[#1A1A1A]/70">Activity timeline coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="flex-1 m-0 p-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {/* AI Summary card with confidence chip */}
              <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-[#1A1A1A]" />
                    <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">Summary</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {thread.ai_category && (
                      <Badge variant="outline" className="text-[10px] h-5 border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A]">
                        {CATEGORY_META[thread.ai_category]?.label || thread.ai_category}
                      </Badge>
                    )}
                    {typeof (thread as any).ai_confidence === "number" && (
                      <Badge variant="outline" className="text-[10px] h-5 border-[#B89555]/40 bg-[#EFE6D6] text-[#1A1A1A]">
                        {Math.round(((thread as any).ai_confidence as number) * 100)}% conf.
                      </Badge>
                    )}
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]"
                      onClick={() => triage.mutate({ threadId: thread.id, force: true })}
                      disabled={triage.isPending}>
                      <Wand2 className="h-3 w-3 mr-1" /> {thread.ai_summary ? "Re-run" : "Analyze"}
                    </Button>
                  </div>
                </div>
                {thread.ai_summary ? (
                  <p className="text-sm text-[#1A1A1A]/85 italic leading-relaxed">"{thread.ai_summary}"</p>
                ) : (
                  <p className="text-xs text-[#1A1A1A]/60 italic">
                    {triage.isPending ? "Analyzing this conversation…" : "Click Analyze to generate a summary."}
                  </p>
                )}
              </div>

              {/* Suggested reply card */}
              <div className="rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#1A1A1A]" />
                    <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">Suggested reply</span>
                  </div>
                </div>
                {thread.ai_suggested_reply ? (
                  <>
                    <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap leading-relaxed">{thread.ai_suggested_reply}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button size="sm" variant="gold" className="h-8 text-xs"
                        onClick={() => { sendMessage({ content: thread.ai_suggested_reply || "" }); toast.success("Reply sent"); }}>
                        <Send className="h-3 w-3 mr-1" /> Use draft
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs border-[#B89555]/40"
                        onClick={() => { setReplyText(thread.ai_suggested_reply || ""); setActiveTab("conversation"); }}>
                        <Edit3 className="h-3 w-3 mr-1" /> Edit & send
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 text-xs"
                        onClick={() => { navigator.clipboard.writeText(thread.ai_suggested_reply || ""); toast.success("Copied"); }}>
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-[#1A1A1A]/60 italic">
                    {thread.ai_category && ["marketing","advertising","campaign","system","business_linkedin","spam"].includes(thread.ai_category)
                      ? "No reply needed — automated/marketing notification."
                      : "No suggested reply yet — run Analyze above to generate one."}
                  </p>
                )}
              </div>

              {/* Next-step card */}
              {thread.ai_next_step?.title && (
                <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarPlus className="h-4 w-4 text-[#1A1A1A]" />
                    <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">Recommended next step</span>
                  </div>
                  <p className="text-sm text-[#1A1A1A]">{thread.ai_next_step.title}</p>
                  {thread.ai_next_step.reasoning && (
                    <p className="text-[11px] text-[#1A1A1A]/70 mt-1">{thread.ai_next_step.reasoning}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" variant="outline" className="h-8 text-xs border-[#B89555]/40"
                      onClick={() => createTask.mutate({
                        thread,
                        title: thread.ai_next_step?.title || `Follow up: ${thread.contact_name ?? thread.contact_identifier}`,
                        dueInHours: thread.ai_next_step?.due_in_hours ?? 24,
                      })}
                      disabled={createTask.isPending}>
                      <ListTodo className="h-3 w-3 mr-1" /> Create task
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs border-[#B89555]/40"
                      onClick={() => scheduleMeeting.mutate({
                        thread,
                        title: thread.ai_next_step?.title || `Meeting: ${thread.contact_name ?? thread.contact_identifier}`,
                        startInHours: thread.ai_next_step?.due_in_hours ?? 24,
                      })}
                      disabled={scheduleMeeting.isPending}>
                      <CalendarPlus className="h-3 w-3 mr-1" /> Schedule meeting
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs"
                      onClick={() => saveNote.mutate({
                        thread,
                        content: thread.ai_summary || thread.ai_suggested_reply || "Note from AI triage",
                      })}
                      disabled={saveNote.isPending}>
                      <NotebookPen className="h-3 w-3 mr-1" /> Save note
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick templates card */}
              {templates.length > 0 && (
                <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-[#1A1A1A]" />
                    <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">Quick templates</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {templates.slice(0, 6).map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => { setReplyText(template.content); setActiveTab("conversation"); toast.success("Template loaded into reply"); }}
                        className="text-left rounded-lg border border-[#B89555]/25 bg-[#F7F2EA] hover:bg-[#EFE6D6] hover:border-[#B89555]/60 transition p-2.5 min-w-0"
                      >
                        <p className="font-medium text-xs text-[#1A1A1A] truncate">{template.name}</p>
                        <p className="text-[11px] text-[#1A1A1A]/70 line-clamp-2 mt-0.5">{template.content}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

      </CardContent>
      </Tabs>

      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} />
    </Card>
  );
}
