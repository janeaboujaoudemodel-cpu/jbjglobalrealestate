import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  X,
  User,
  Mail,
  Phone,
  Tag,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Send,
  Paperclip,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Image as ImageIcon,
  FileText,
  Calendar,
  StickyNote,
  RotateCcw,
  Download,
  Maximize2,
  Minimize2,
  Mic,
} from "lucide-react";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSupportTicketDetail,
  useUpdateTicketStatus,
  useSendTicketReply,
} from "@/hooks/useSupportTickets";
import { useAITicketSuggestions, type AISuggestion } from "@/hooks/useAITicketSuggestions";
import { useSignedAttachmentUrl, isImageUrl, getFilenameFromUrl } from "@/hooks/useTicketAttachments";
import { cn } from "@/lib/utils";

interface TicketDetailPanelProps {
  ticketId: string | null;
  onClose: () => void;
}

const priorityConfig: Record<
  string,
  { label: string; className: string }
> = {
  critical: { label: "Critical", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  high: { label: "High", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  normal: { label: "Normal", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  low: { label: "Low", className: "bg-green-500/20 text-green-400 border-green-500/30" },
};

const statusConfig: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle }
> = {
  open: { label: "Open", className: "bg-yellow-500/20 text-yellow-400", icon: AlertCircle },
  in_progress: { label: "In Progress", className: "bg-blue-500/20 text-blue-400", icon: Clock },
  resolved: { label: "Resolved", className: "bg-green-500/20 text-green-400", icon: CheckCircle },
};

// Attachment item component with signed URL support
const AttachmentItem = ({ url, index }: { url: string; index: number }) => {
  const { getSignedUrl, loading, errors } = useSignedAttachmentUrl();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const isImage = isImageUrl(url);
  const filename = getFilenameFromUrl(url);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      const signed = await getSignedUrl(url);
      if (signed) {
        setSignedUrl(signed);
        if (isImage) {
          setImagePreview(signed);
        }
      }
    };
    fetchSignedUrl();
  }, [url, getSignedUrl, isImage]);

  const handleDownload = async () => {
    if (!signedUrl) return;
    try {
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || `attachment-${index + 1}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch {
      // Fallback: open in new tab
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleView = () => {
    if (signedUrl) {
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading[url]) {
    return (
      <div className="flex items-center gap-2 bg-[#F5EBD7]/20 px-3 py-2 rounded-lg text-sm text-gold border border-gold/30">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </div>
    );
  }

  if (errors[url]) {
    return (
      <div className="flex items-center gap-2 bg-red-900/20 px-3 py-2 rounded-lg text-sm text-red-400 border border-red-500/30">
        <AlertCircle className="w-4 h-4" />
        Attachment unavailable
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {imagePreview && (
        <div 
          onClick={handleView}
          className="cursor-pointer rounded-lg overflow-hidden border border-gold/20 hover:border-gold transition-colors"
        >
          <img 
            src={imagePreview} 
            alt={filename}
            className="max-w-full max-h-32 object-cover"
          />
        </div>
      )}
      <div className="flex gap-1">
        <button
          onClick={handleView}
          disabled={!signedUrl}
          className="flex items-center gap-2 bg-[#FDFBF7] px-3 py-2 rounded-lg text-sm text-gold hover:bg-[#F5EBD7] transition-colors border border-gold/30 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
        >
          {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          <span className="truncate max-w-[120px]">{filename || `Attachment ${index + 1}`}</span>
          <ExternalLink className="w-3 h-3 ml-auto" />
        </button>
        <button
          onClick={handleDownload}
          disabled={!signedUrl}
          className="flex items-center gap-1 bg-gold/20 px-3 py-2 rounded-lg text-sm text-gold hover:bg-gold/30 transition-colors border border-gold/30 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// AI Suggestion Card Component with expandable preview
const SuggestionCard = ({ 
  suggestion, 
  onSelect,
  isSelected,
}: { 
  suggestion: AISuggestion; 
  onSelect: () => void;
  isSelected: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const typeColors = {
    quick_resolution: 'border-gold/40 bg-gradient-to-br from-[#FDFBF7] to-[#F5EBD7]',
    needs_info: 'border-gold/40 bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3]',
    acknowledgment: 'border-gold/40 bg-gradient-to-br from-[#F5EBD7] to-[#D4C4A8]/30',
  };

  const typeLabels = {
    quick_resolution: 'Quick Resolution',
    needs_info: 'Needs Info',
    acknowledgment: 'Acknowledgment',
  };

  return (
    <>
      <button
        onClick={() => setExpanded(true)}
        className={cn(
          "w-full text-left p-3 rounded-lg border transition-all duration-200",
          typeColors[suggestion.type] || 'border-gold/30 bg-gold/10',
          isSelected ? 'ring-2 ring-gold' : 'hover:border-gold/50'
        )}
      >
        <p className="text-xs font-semibold text-gold uppercase tracking-wide mb-1">
          {typeLabels[suggestion.type] || suggestion.title}
        </p>
        <p className="text-xs text-[#8B7355] line-clamp-2">
          {suggestion.message.slice(0, 120)}...
        </p>
        <p className="text-[10px] text-gold/60 mt-1">Click to preview full response</p>
      </button>

      {/* Expanded Preview Modal */}
      {expanded && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setExpanded(false)}>
          <div
            className="bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl shadow-[0_0_60px_rgba(200,167,102,0.3)] max-w-lg w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gold/30 flex items-center justify-between">
              <div>
                <Badge className={cn("border text-xs mb-1", typeColors[suggestion.type])}>
                  {typeLabels[suggestion.type] || suggestion.title}
                </Badge>
                <h3 className="text-black font-bold text-lg">{suggestion.title}</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setExpanded(false)} className="text-gold hover:text-black hover:bg-gold/20 border border-gold/40">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-5">
              <div className="bg-white/60 border border-gold/20 rounded-lg p-4">
                <p className="text-black text-sm whitespace-pre-wrap leading-relaxed">{suggestion.message}</p>
              </div>
            </ScrollArea>
            <div className="px-5 py-4 border-t border-gold/30 flex gap-3">
              <Button
                onClick={() => {
                  onSelect();
                  setExpanded(false);
                }}
                className="flex-1 bg-gradient-to-r from-gold to-gold/80 text-black font-bold hover:from-gold/90 hover:to-gold/70"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Use This Reply
              </Button>
              <Button
                variant="outline"
                onClick={() => setExpanded(false)}
                className="border-2 border-gold text-gold hover:bg-gold/20 font-semibold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const TicketDetailPanel = ({ ticketId, onClose }: TicketDetailPanelProps) => {
  const navigate = useNavigate();
  const { data, isLoading } = useSupportTicketDetail(ticketId);
  const updateStatus = useUpdateTicketStatus();
  const sendReply = useSendTicketReply();
  const aiSuggestions = useAITicketSuggestions();
  const [replyMessage, setReplyMessage] = useState("");
  const [replyMaximized, setReplyMaximized] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);

  // Clear state when ticket changes
  useEffect(() => {
    setReplyMessage("");
    setSelectedSuggestion(null);
    aiSuggestions.clearSuggestions();
  }, [ticketId]);

  // Auto "in_review" when admin views an open ticket
  useEffect(() => {
    if (data?.ticket && data.ticket.status === "open") {
      updateStatus.mutate({ ticketId: data.ticket.id, status: "in_progress" });
    }
  }, [data?.ticket?.id, data?.ticket?.status]);

  if (!ticketId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#FDFBF7]/80 to-[#EDE4D3]/80 rounded-xl border border-gold/20">
        <div className="text-center text-gold/60">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gold/30" />
          <p>Select a ticket to view details</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-gradient-to-b from-[#FDFBF7]/80 to-[#EDE4D3]/80 rounded-xl border border-gold/20 p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 bg-gold/20" />
          <Skeleton className="h-4 w-full bg-gold/20" />
          <Skeleton className="h-4 w-3/4 bg-gold/20" />
          <Skeleton className="h-32 w-full bg-gold/20" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#FDFBF7]/80 to-[#EDE4D3]/80 rounded-xl border border-gold/20">
        <p className="text-gold/60">Ticket not found</p>
      </div>
    );
  }

  const { ticket, messages } = data;
  const priority = priorityConfig[ticket.priority] || priorityConfig.normal;
  const status = statusConfig[ticket.status] || statusConfig.open;
  const StatusIcon = status.icon;

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate({ ticketId: ticket.id, status: newStatus });
  };

  const handleGenerateAISuggestions = () => {
    aiSuggestions.generateSuggestions(ticket, messages);
  };

  const handleSelectSuggestion = (index: number) => {
    setSelectedSuggestion(index);
    setReplyMessage(aiSuggestions.suggestions[index].message);
  };

  const handleSendReply = () => {
    if (!replyMessage.trim()) return;

    sendReply.mutate(
      {
        ticketId: ticket.id,
        message: replyMessage,
        ticketNumber: ticket.ticket_number,
        customerEmail: ticket.email,
        customerName: ticket.full_name,
      },
      {
        onSuccess: () => {
          setReplyMessage("");
          setSelectedSuggestion(null);
          aiSuggestions.clearSuggestions();
        },
      }
    );
  };

  const handleEmailClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // If we have AI suggestions and a selected one, use it for email
    if (aiSuggestions.suggestions.length > 0 && selectedSuggestion !== null) {
      const subject = `Re: [${ticket.ticket_number}] ${ticket.subject}`;
      const body = encodeURIComponent(aiSuggestions.suggestions[selectedSuggestion].message);
      window.location.href = `mailto:${ticket.email}?subject=${encodeURIComponent(subject)}&body=${body}`;
    } else {
      // Generate suggestions first, then compose
      handleGenerateAISuggestions();
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-[#FDFBF7] to-[#EDE4D3] rounded-xl border border-gold/30 flex flex-col overflow-hidden shadow-[0_0_30px_rgba(200,167,102,0.1)]">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gold/30 flex items-start justify-between bg-gradient-to-r from-[#F5EBD7] to-[#EDE4D3]">
        <div className="min-w-0 flex-1 mr-2">
          <div className="flex items-center gap-2 mb-1 overflow-x-auto scrollbar-hide whitespace-nowrap">
            <span className="text-gold font-mono font-bold text-sm whitespace-nowrap shrink-0">
              {ticket.ticket_number}
            </span>
            <Badge className={cn("border text-[10px] px-1.5 py-0 whitespace-nowrap shrink-0", priority.className)}>
              {priority.label}
            </Badge>
            <Badge className={cn("flex items-center gap-1 text-[10px] px-1.5 py-0 whitespace-nowrap shrink-0", status.className)}>
              <StatusIcon className="w-2.5 h-2.5" />
              {status.label}
            </Badge>
          </div>
          <h2 className="text-sm font-semibold text-black truncate">{ticket.subject}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="bg-gold border-2 border-gold text-black hover:bg-gold/80 transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Reopened Ticket Alert */}
          {ticket.is_reopened && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-400">
                <RotateCcw className="w-5 h-5" />
                <span className="font-semibold">Ticket Reopened</span>
              </div>
              <p className="text-sm text-orange-300 mt-1">
                Customer indicated issue not resolved. 
                Reopened {ticket.reopen_count || 1} time(s)
                {ticket.reopened_at && (
                  <> on {format(new Date(ticket.reopened_at), "MMM d, yyyy 'at' HH:mm")}</>
                )}
              </p>
            </div>
          )}

          {/* Customer Info */}
          <div className="bg-white/50 rounded-lg p-3 space-y-2 border border-gold/20">
            <h3 className="text-xs font-semibold text-gold uppercase tracking-wide mb-2">
              Customer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gold" />
                <span className="text-black">{ticket.full_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gold" />
                <button
                  onClick={handleEmailClick}
                  className="text-gold hover:underline flex items-center gap-1"
                >
                  {ticket.email}
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              {ticket.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gold" />
                  <a
                    href={`tel:${ticket.phone}`}
                    className="text-gold hover:underline"
                  >
                    {ticket.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Tag className="w-4 h-4 text-gold" />
                <span className="text-black">{ticket.service_category}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gold uppercase tracking-wide mb-3">
              Issue Description
            </h3>
            <div className="bg-white/40 rounded-lg p-4 text-black text-sm whitespace-pre-wrap break-words overflow-hidden max-w-full border border-gold/20">
              {ticket.description}
            </div>
          </div>

          {/* Attachments */}
          {ticket.attachment_urls && ticket.attachment_urls.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gold uppercase tracking-wide mb-3">
                Attachments ({ticket.attachment_urls.length})
              </h3>
              <div className="flex flex-wrap gap-3">
                {ticket.attachment_urls.map((url, idx) => (
                  <AttachmentItem key={idx} url={url} index={idx} />
                ))}
              </div>
            </div>
          )}

          {/* Status Actions */}
          <div>
            <h3 className="text-sm font-semibold text-gold uppercase tracking-wide mb-3">
              Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              {ticket.status === "open" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("in_progress")}
                  disabled={updateStatus.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Clock className="w-4 h-4 mr-2" />
                  )}
                  Mark In Progress
                </Button>
              )}
              {ticket.status !== "resolved" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("resolved")}
                  disabled={updateStatus.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Mark Resolved
                </Button>
              )}
              {ticket.status === "resolved" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("open")}
                  disabled={updateStatus.isPending}
                  className="bg-transparent border border-gold/50 text-gold hover:bg-gold/10"
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  )}
                  Reopen Ticket
                </Button>
              )}
              
              {/* Calendar & Notes Integration */}
              <Button
                size="sm"
                onClick={() => navigate(`/ai-calendar?ticket=${ticket.ticket_number}&title=Follow-up: ${encodeURIComponent(ticket.subject)}`)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Add Follow-up
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/ai-notes?ticket=${ticket.ticket_number}&title=${encodeURIComponent(`Note: ${ticket.subject}`)}`)}
                className="bg-gold/30 hover:bg-gold/50 text-black border border-gold/40"
              >
                <StickyNote className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>
          </div>

          {/* AI Suggestions Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gold uppercase tracking-wide">
                AI Reply Suggestions
              </h3>
              <Button
                size="sm"
                onClick={handleGenerateAISuggestions}
                disabled={aiSuggestions.isLoading}
                className="bg-gradient-to-r from-gold to-[#D4C4A8] hover:from-gold/90 hover:to-[#D4C4A8]/90 text-black font-semibold"
              >
                {aiSuggestions.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Suggest Reply
              </Button>
            </div>

            {aiSuggestions.isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full bg-gold/20" />
                <Skeleton className="h-16 w-full bg-gold/20" />
                <Skeleton className="h-16 w-full bg-gold/20" />
              </div>
            )}

            {aiSuggestions.error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {aiSuggestions.error}
              </div>
            )}

            {aiSuggestions.suggestions.length > 0 && (
              <div className="space-y-2">
                {aiSuggestions.suggestions.map((suggestion, idx) => (
                  <SuggestionCard
                    key={idx}
                    suggestion={suggestion}
                    onSelect={() => handleSelectSuggestion(idx)}
                    isSelected={selectedSuggestion === idx}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Message Thread */}
          <div>
            <h3 className="text-sm font-semibold text-gold uppercase tracking-wide mb-3">
              Conversation ({messages.length})
            </h3>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-gold/60 text-sm italic">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "rounded-lg p-3",
                      msg.sender_type === "staff"
                        ? "bg-gold/10 border border-gold/20 ml-6"
                        : "bg-white/40 border border-gold/15 mr-6"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={cn(
                          "text-xs font-semibold uppercase",
                          msg.sender_type === "staff"
                            ? "text-gold"
                            : "text-[#8B7355]"
                        )}
                      >
                        {msg.sender_type === "staff" ? "Staff Reply" : "Customer"}
                      </span>
                      <span className="text-xs text-gold/60">
                        {format(new Date(msg.created_at), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm text-black whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-gold/60 pt-4 border-t border-gold/20">
            <p>Created: {format(new Date(ticket.created_at), "MMM d, yyyy h:mm a")}</p>
            {ticket.customer_confirmation_sent_at && (
              <p className="text-green-400">
                ✓ Confirmation email sent{" "}
                {format(new Date(ticket.customer_confirmation_sent_at), "MMM d, yyyy h:mm a")}
              </p>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Reply Composer */}
      <div className="p-3 border-t border-gold/30 bg-gradient-to-r from-[#F5EBD7] to-[#EDE4D3]">
        <p className="text-[10px] text-gold/60 mb-1 flex items-center gap-1">
          <Mic className="w-3 h-3" /> Speak in any language — auto-translated to English
        </p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply to the customer..."
              rows={2}
              className="w-full min-h-[56px] px-3 py-2 pr-16 rounded-lg bg-white/80 border border-gold/30 text-black text-sm placeholder:text-gold/40 resize-none focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
            />
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <VoiceInputButton
                onTranscript={(text) => setReplyMessage(prev => prev ? `${prev} ${text}` : text)}
                onTranscriptResult={(result) => {
                  if (result.translated && !result.isEnglish) {
                    // Show both original and translated
                    const combined = `[${result.languageName || 'Original'}]: ${result.original}\n[English]: ${result.translated}`;
                    setReplyMessage(prev => prev ? `${prev}\n\n${combined}` : combined);
                  }
                }}
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-gold/60 hover:text-gold"
              />
              <button
                onClick={() => setReplyMaximized(true)}
                className="text-gold/60 hover:text-gold transition-colors p-0.5"
                title="Maximize reply editor"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <Button
            onClick={handleSendReply}
            disabled={!replyMessage.trim() || sendReply.isPending}
            className="bg-gold hover:bg-gold/90 text-black self-end"
          >
            {sendReply.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Maximized Reply Editor Modal */}
      {replyMaximized && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setReplyMaximized(false)}>
          <div
            className="bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl shadow-[0_0_60px_rgba(200,167,102,0.3)] max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gold/30 flex items-center justify-between">
              <h3 className="text-black font-bold text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gold" />
                Reply Editor
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setReplyMaximized(false)} className="text-gold hover:text-black hover:bg-gold/20 border border-gold/40">
                <Minimize2 className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 p-5">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply to the customer..."
                className="w-full h-[45vh] px-4 py-3 rounded-lg bg-white/80 border border-gold/30 text-black text-sm placeholder:text-gold/40 resize-none focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all leading-relaxed"
                autoFocus
              />
            </div>
            <div className="px-5 py-4 border-t border-gold/30 flex gap-3 items-center">
              <VoiceInputButton
                onTranscript={(text) => setReplyMessage(prev => prev ? `${prev} ${text}` : text)}
                onTranscriptResult={(result) => {
                  if (result.translated && !result.isEnglish) {
                    const combined = `[${result.languageName || 'Original'}]: ${result.original}\n[English]: ${result.translated}`;
                    setReplyMessage(prev => prev ? `${prev}\n\n${combined}` : combined);
                  }
                }}
                size="default"
                variant="outline"
                className="border-2 border-gold text-gold hover:bg-gold/20"
              />
              <div className="flex-1" />
              <Button
                variant="outline"
                onClick={() => setReplyMaximized(false)}
                className="border-2 border-gold text-gold hover:bg-gold/20 font-semibold"
              >
                <Minimize2 className="w-4 h-4 mr-2" />
                Minimize
              </Button>
              <Button
                onClick={() => {
                  handleSendReply();
                  setReplyMaximized(false);
                }}
                disabled={!replyMessage.trim() || sendReply.isPending}
                className="bg-gradient-to-r from-gold to-gold/80 text-black font-bold hover:from-gold/90 hover:to-gold/70"
              >
                {sendReply.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Reply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetailPanel;
