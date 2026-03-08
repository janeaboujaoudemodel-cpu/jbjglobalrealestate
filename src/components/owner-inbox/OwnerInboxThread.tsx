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
    <Card className="border-2 border-gold/20 bg-white/90 backdrop-blur-sm h-full flex flex-col overflow-hidden">
      {/* Header */}
      <CardHeader className="border-b border-gold/10 py-3 px-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border border-gold/20">
              {thread.contact_avatar_url ? (
                <img src={thread.contact_avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-gold" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-black">
                {thread.contact_name || thread.contact_identifier}
              </h3>
              <p className="text-xs text-zinc-500">{thread.contact_identifier}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={thread.status} onValueChange={(v) => onStatusChange(v as ThreadStatus)}>
              <SelectTrigger className="w-[130px] h-8 text-xs border-gold/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {thread.lead ? (
              <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                <LinkIcon className="h-3 w-3 mr-1" />
                {thread.lead.full_name}
              </Badge>
            ) : (
              <Button variant="outline" size="sm" className="h-8 text-xs border-gold/30">
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
          <TabsList className="grid grid-cols-4 h-8">
            <TabsTrigger value="conversation" className="text-xs">Conversation</TabsTrigger>
            <TabsTrigger value="lead" className="text-xs">Lead Profile</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">AI Suggestions</TabsTrigger>
          </TabsList>
        </Tabs>
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
                <Clock className="h-12 w-12 text-gold/30 mb-4" />
                <p className="text-zinc-500">No messages yet</p>
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
                        ? 'bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black rounded-tr-sm'
                        : 'bg-white border border-gold/20 text-black rounded-tl-sm'
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
                          <div className="h-1 flex-1 bg-gold/20 rounded-full">
                            <div className="h-full w-1/3 bg-gold rounded-full" />
                          </div>
                          <span className="text-xs text-zinc-500">
                            {message.voice_duration_seconds || 0}s
                          </span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-400">
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
                className="border-t border-gold/10 bg-gold/5 p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gold" />
                    <span className="text-sm font-medium text-black">AI Draft — Jane Bou Jaoude's style</span>
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
                <p className="text-sm text-zinc-600 mb-3">{aiDraft}</p>
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
                    className="border-gold/30"
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

          {/* Reply Input */}
          <div className="border-t border-gold/10 p-3 flex-shrink-0">
            <div className="flex items-end gap-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="min-h-[60px] max-h-[120px] resize-none border-gold/30"
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
                  className="h-9 w-9 border-gold/30"
                  onClick={handleGenerateAIReply}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-gold" />
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
            <p className="text-[10px] text-zinc-400 mt-2 text-center">
              Press <kbd className="px-1 py-0.5 bg-zinc-100 rounded text-[10px]">Enter</kbd> to send • <kbd className="px-1 py-0.5 bg-zinc-100 rounded text-[10px]">Shift+Enter</kbd> for new line
            </p>
          </div>
        </TabsContent>

        <TabsContent value="lead" className="flex-1 m-0 p-4 data-[state=inactive]:hidden">
          {thread.lead ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border-2 border-gold/30">
                  <User className="h-8 w-8 text-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">{thread.lead.full_name}</h3>
                  <p className="text-sm text-zinc-500">CRM Lead</p>
                </div>
              </div>
              <Button variant="outline" className="w-full border-gold/30">
                View Full Lead Profile
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <LinkIcon className="h-12 w-12 text-gold/30 mb-4" />
              <p className="text-zinc-500 font-medium">Not linked to a lead</p>
              <p className="text-zinc-400 text-sm mt-1">Link this conversation to an existing lead or create a new one</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="border-gold/30">
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
            <FileText className="h-12 w-12 text-gold/30 mb-4" />
            <p className="text-zinc-500">Activity timeline coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="flex-1 m-0 p-4 data-[state=inactive]:hidden">
          <div className="space-y-4">
            <h4 className="font-medium text-black flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold" />
              Quick Templates
            </h4>
            <div className="grid gap-2">
              {templates.slice(0, 5).map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="justify-start h-auto py-2 px-3 border-gold/20 text-left"
                  onClick={() => setReplyText(template.content)}
                >
                  <div>
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{template.content.substring(0, 50)}...</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>
      </CardContent>

      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} />
    </Card>
  );
}
