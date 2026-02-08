import { useState } from "react";
import { format } from "date-fns";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSupportTicketDetail,
  useUpdateTicketStatus,
  useSendTicketReply,
} from "@/hooks/useSupportTickets";
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
  low: { label: "Low", className: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
};

const statusConfig: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle }
> = {
  open: { label: "Open", className: "bg-yellow-500/20 text-yellow-400", icon: AlertCircle },
  in_progress: { label: "In Progress", className: "bg-blue-500/20 text-blue-400", icon: Clock },
  resolved: { label: "Resolved", className: "bg-green-500/20 text-green-400", icon: CheckCircle },
};

const TicketDetailPanel = ({ ticketId, onClose }: TicketDetailPanelProps) => {
  const { data, isLoading } = useSupportTicketDetail(ticketId);
  const updateStatus = useUpdateTicketStatus();
  const sendReply = useSendTicketReply();
  const [replyMessage, setReplyMessage] = useState("");

  if (!ticketId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 rounded-xl border border-gold/20">
        <div className="text-center text-zinc-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gold/30" />
          <p>Select a ticket to view details</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 rounded-xl border border-gold/20 p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 bg-zinc-800" />
          <Skeleton className="h-4 w-full bg-zinc-800" />
          <Skeleton className="h-4 w-3/4 bg-zinc-800" />
          <Skeleton className="h-32 w-full bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 rounded-xl border border-gold/20">
        <p className="text-zinc-400">Ticket not found</p>
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
        },
      }
    );
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 rounded-xl border border-gold/20 flex flex-col overflow-hidden shadow-[0_0_30px_rgba(200,167,102,0.05)]">
      {/* Header */}
      <div className="p-4 border-b border-gold/20 flex items-start justify-between bg-zinc-900/50">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-gold font-mono font-bold text-lg">
              {ticket.ticket_number}
            </span>
            <Badge className={cn("border", priority.className)}>
              {priority.label}
            </Badge>
            <Badge className={cn("flex items-center gap-1", status.className)}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </Badge>
          </div>
          <h2 className="text-lg font-semibold text-white">{ticket.subject}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Customer Info */}
          <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3 border border-gold/10">
            <h3 className="text-sm font-semibold text-gold uppercase tracking-wide mb-3">
              Customer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gold" />
                <span className="text-white">{ticket.full_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gold" />
                <a
                  href={`mailto:${ticket.email}`}
                  className="text-gold hover:underline"
                >
                  {ticket.email}
                </a>
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
                <span className="text-white">{ticket.service_category}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gold uppercase tracking-wide mb-3">
              Issue Description
            </h3>
            <div className="bg-zinc-800/30 rounded-lg p-4 text-white text-sm whitespace-pre-wrap border border-gold/10">
              {ticket.description}
            </div>
          </div>

          {/* Attachments */}
          {ticket.attachment_urls && ticket.attachment_urls.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gold uppercase tracking-wide mb-3">
                Attachments
              </h3>
              <div className="flex flex-wrap gap-2">
                {ticket.attachment_urls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-lg text-sm text-gold hover:bg-zinc-700 transition-colors border border-gold/20"
                  >
                    <Paperclip className="w-4 h-4" />
                    Attachment {idx + 1}
                  </a>
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
            </div>
          </div>

          {/* Message Thread */}
          <div>
            <h3 className="text-sm font-semibold text-gold uppercase tracking-wide mb-3">
              Conversation ({messages.length})
            </h3>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-zinc-400 text-sm italic">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "rounded-lg p-3",
                      msg.sender_type === "staff"
                        ? "bg-gold/10 border border-gold/20 ml-6"
                        : "bg-zinc-800/50 border border-zinc-700 mr-6"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={cn(
                          "text-xs font-semibold uppercase",
                          msg.sender_type === "staff"
                            ? "text-gold"
                            : "text-zinc-300"
                        )}
                      >
                        {msg.sender_type === "staff" ? "Staff Reply" : "Customer"}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {format(new Date(msg.created_at), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm text-white whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-zinc-400 pt-4 border-t border-gold/10">
            <p>Created: {format(new Date(ticket.created_at), "MMM d, yyyy h:mm a")}</p>
            {ticket.customer_confirmation_sent_at && (
              <p className="text-green-400">
                ✓ Confirmation email sent{" "}
                {format(new Date(ticket.customer_confirmation_sent_at), "MMM d, yyyy h:mm a")}
              </p>
            )}
            {ticket.customer_confirmation_status === "failed" && (
              <p className="text-red-400">
                ✗ Confirmation email failed: {ticket.customer_confirmation_error}
              </p>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Reply Composer - Using native textarea for proper dark styling */}
      <div className="p-4 border-t border-gold/20 bg-zinc-900/80">
        <div className="flex gap-3">
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Type your reply to the customer..."
            rows={3}
            className="flex-1 min-h-[80px] px-4 py-3 rounded-lg bg-zinc-800 border border-gold/30 text-white placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
          />
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
    </div>
  );
};

export default TicketDetailPanel;
