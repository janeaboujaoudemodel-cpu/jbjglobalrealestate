import { useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Inbox, Send, FileText, Trash2, Star, Archive, Tag, Search,
  Pencil, Reply, ReplyAll, Forward, MoreVertical, Paperclip,
  RefreshCw, Mail, Building2, User, Sparkles, CheckCheck,
  MailOpen, ChevronLeft, ChevronRight, Shield, UserCircle,
  Headphones, Phone, Megaphone, Stamp, Signature, Zap, MessageSquare,
  Calendar, Settings
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import EmailSettingsPanel from "@/components/email/EmailSettingsPanel";

// ─── Sender Identities ───
interface SenderIdentity {
  id: string;
  label: string;
  name: string;
  email: string;
  title: string;
  icon: React.ReactNode;
  account: "company" | "personal";
}

const SENDER_IDENTITIES: SenderIdentity[] = [
  { id: "owner", label: "Owner — Jane Bou Jaoude", name: "Jane Bou Jaoude", email: "ceo@jbj.ae", title: "Founder & CEO", icon: <Shield className="w-3 h-3" />, account: "company" },
  { id: "amanda", label: "Amanda Clarke — Assistant", name: "Amanda Clarke", email: "amanda@jbj.ae", title: "Executive Assistant to CEO", icon: <Sparkles className="w-3 h-3" />, account: "company" },
  { id: "hr", label: "HR Team", name: "HR Department", email: "hr@jbj.ae", title: "Human Resources", icon: <UserCircle className="w-3 h-3" />, account: "company" },
  { id: "admin", label: "Admin", name: "Admin Team", email: "admin@jbj.ae", title: "Administration", icon: <Building2 className="w-3 h-3" />, account: "company" },
  { id: "frontdesk", label: "Front Desk", name: "Front Desk", email: "frontdesk@jbj.ae", title: "Reception", icon: <Phone className="w-3 h-3" />, account: "company" },
  { id: "helpdesk", label: "Help Desk", name: "Help Desk", email: "support@jbj.ae", title: "IT Support", icon: <Headphones className="w-3 h-3" />, account: "company" },
  { id: "marketing", label: "Marketing Department", name: "Marketing Team", email: "marketing@jbj.ae", title: "Marketing & Communications", icon: <Megaphone className="w-3 h-3" />, account: "company" },
  { id: "personal", label: "Personal Email", name: "Jane Bou Jaoude", email: "jane@personal.com", title: "Personal", icon: <User className="w-3 h-3" />, account: "personal" },
];

interface Email {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
  folder: "inbox" | "sent" | "drafts" | "trash" | "archive";
  labels: string[];
  hasAttachment: boolean;
  account: "personal" | "company";
  selected?: boolean;
}

const DEMO_EMAILS: Email[] = [
  {
    id: "1", from: "Property Alert", fromEmail: "alerts@jbj.ae", to: "ceo@jbj.ae",
    subject: "New Property Listings in Dubai Marina",
    body: "Dear CEO,\n\nWe have exciting new property listings available in Dubai Marina that match your preferences.\n\n• 2BR Apartment - AED 2.5M\n• 3BR Penthouse - AED 5.8M\n• 1BR Studio - AED 1.2M\n\nContact us to schedule a viewing.\n\nBest,\nProperty Team",
    date: new Date(Date.now() - 3600000).toISOString(), read: false, starred: true, folder: "inbox", labels: ["properties"], hasAttachment: true, account: "company",
  },
  {
    id: "2", from: "Developer Relations", fromEmail: "dev@emaar.com", to: "ceo@jbj.ae",
    subject: "Emaar Partnership — Q2 Briefing Schedule",
    body: "Dear Team,\n\nPlease find attached the Q2 briefing schedule for Emaar projects.\n\nAvailability:\n- March 18, 10:00 AM\n- March 20, 2:00 PM\n\nRegards,\nEmaar Developer Relations",
    date: new Date(Date.now() - 7200000).toISOString(), read: true, starred: false, folder: "inbox", labels: ["work"], hasAttachment: true, account: "company",
  },
  {
    id: "3", from: "Travel Concierge", fromEmail: "concierge@emirates.com", to: "personal@ceo.com",
    subject: "Your upcoming flight confirmation — EK203",
    body: "Dear Valued Customer,\n\nYour flight EK203 from Dubai to London Heathrow on March 25 has been confirmed.\n\nFlight Details:\n- Departure: 08:15 DXB\n- Arrival: 12:30 LHR\n- Class: Business\n- Seat: 4A\n\nSafe travels!",
    date: new Date(Date.now() - 86400000).toISOString(), read: false, starred: false, folder: "inbox", labels: ["personal"], hasAttachment: false, account: "personal",
  },
  {
    id: "4", from: "Amanda Clarke", fromEmail: "amanda@jbj.ae", to: "ceo@jbj.ae",
    subject: "Daily Summary — 5 pending approvals",
    body: "Good morning,\n\nHere's your daily summary:\n\n3 new developer submissions\n5 pending project approvals\nCRM: 12 hot leads requiring follow-up\n2 meetings scheduled today\n\nBest,\nAmanda",
    date: new Date(Date.now() - 1800000).toISOString(), read: false, starred: true, folder: "inbox", labels: ["important"], hasAttachment: false, account: "company",
  },
];

const EmailClient = () => {
  const [emails, setEmails] = useState<Email[]>(DEMO_EMAILS);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeFolder, setActiveFolder] = useState<"inbox" | "sent" | "drafts" | "trash" | "archive">("inbox");
  const [activeAccount, setActiveAccount] = useState<"all" | "personal" | "company">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSender, setComposeSender] = useState("owner");
  const [sendViaResend, setSendViaResend] = useState(true);
  const [newEmail, setNewEmail] = useState({ to: "", subject: "", body: "" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [approvePreviewOpen, setApprovePreviewOpen] = useState(false);
  const [alsoNotifyChat, setAlsoNotifyChat] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const emailsPerPage = 20;

  const folders = [
    { id: "inbox" as const, label: "Inbox", icon: Inbox, count: emails.filter(e => e.folder === "inbox" && !e.read).length },
    { id: "sent" as const, label: "Sent", icon: Send, count: 0 },
    { id: "drafts" as const, label: "Drafts", icon: FileText, count: emails.filter(e => e.folder === "drafts").length },
    { id: "archive" as const, label: "Archive", icon: Archive, count: 0 },
    { id: "trash" as const, label: "Trash", icon: Trash2, count: 0 },
  ];

  const labels = [
    { name: "important", color: "bg-red-500" },
    { name: "work", color: "bg-blue-500" },
    { name: "personal", color: "bg-emerald-500" },
    { name: "properties", color: "bg-purple-500" },
  ];

  const filteredEmails = emails
    .filter(e => e.folder === activeFolder)
    .filter(e => activeAccount === "all" || e.account === activeAccount)
    .filter(e =>
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.body.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const totalPages = Math.ceil(filteredEmails.length / emailsPerPage);
  const paginatedEmails = filteredEmails.slice((currentPage - 1) * emailsPerPage, currentPage * emailsPerPage);

  const markAsRead = (id: string) => setEmails(emails.map(e => e.id === id ? { ...e, read: true } : e));
  const toggleStar = (id: string) => setEmails(emails.map(e => e.id === id ? { ...e, starred: !e.starred } : e));
  
  const moveToTrash = (ids: string[]) => {
    setEmails(emails.map(e => ids.includes(e.id) ? { ...e, folder: "trash" } : e));
    setSelectedEmail(null); setSelectedIds(new Set());
    toast.success(`${ids.length} email(s) moved to trash`);
  };

  const moveToArchive = (ids: string[]) => {
    setEmails(emails.map(e => ids.includes(e.id) ? { ...e, folder: "archive" } : e));
    setSelectedEmail(null); setSelectedIds(new Set());
    toast.success(`${ids.length} email(s) archived`);
  };

  const markSelectedRead = () => {
    setEmails(emails.map(e => selectedIds.has(e.id) ? { ...e, read: true } : e));
    setSelectedIds(new Set()); toast.success("Marked as read");
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedEmails.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedEmails.map(e => e.id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const currentSender = SENDER_IDENTITIES.find(s => s.id === composeSender) || SENDER_IDENTITIES[0];

  const [isSending, setIsSending] = useState(false);

  const sendEmail = async () => {
    if (!newEmail.to || !newEmail.subject) {
      toast.error("Please fill in recipient and subject");
      return;
    }
    setIsSending(true);
    try {
      // Call backend edge function
      const { data, error } = await supabase.functions.invoke("send-owner-email", {
        body: {
          to: newEmail.to,
          subject: newEmail.subject,
          body: newEmail.body,
          senderId: currentSender.id,
          senderName: currentSender.name,
          senderEmail: currentSender.email,
          senderTitle: currentSender.title,
          account: currentSender.account,
          useResend: sendViaResend,
          alsoNotifyChat,
        },
      });

      if (error) throw error;

      // Add to local state for immediate UI feedback
      const email: Email = {
        id: Date.now().toString(),
        from: currentSender.name,
        fromEmail: currentSender.email,
        to: newEmail.to,
        subject: newEmail.subject,
        body: newEmail.body,
        date: new Date().toISOString(),
        read: true, starred: false, folder: "sent", labels: [], hasAttachment: false,
        account: currentSender.account,
      };
      setEmails([...emails, email]);
      setNewEmail({ to: "", subject: "", body: "" });
      setComposeOpen(false);
      setAlsoNotifyChat(false);

      const method = data?.sendMethod === "resend" ? "via Resend API" : "normally";
      toast.success(`Email sent ${method}`);
    } catch (err: any) {
      console.error("Send email error:", err);
      toast.error(err.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const unreadCount = emails.filter(e => e.folder === "inbox" && !e.read).length;

  return (
    <div className="h-[calc(100vh-11rem)] bg-background text-foreground flex rounded-xl border-2 border-[#C9A84C]/20 overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className="w-56 border-r border-[#C9A84C]/15 flex flex-col bg-gradient-to-b from-[#FDFBF7] to-[#F5F0E6]">
        {/* Compose + Search */}
        <div className="p-4 space-y-3 border-b border-[#C9A84C]/15">
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-gradient-to-r from-[#C9A84C] to-[#B8973F] hover:from-[#B8973F] hover:to-[#A78636] text-white">
                <Pencil className="w-4 h-4 mr-2" />
                Compose
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-2 border-[#C9A84C]/30 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-black flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#C9A84C]" />
                  New Message
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Sender Identity Selector */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-black/60 whitespace-nowrap w-12">From:</span>
                  <Select value={composeSender} onValueChange={setComposeSender}>
                    <SelectTrigger className="flex-1 border-[#C9A84C]/30 bg-[#FDFBF7]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#C9A84C]/30">
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-black/40 uppercase tracking-wider">Company Email</div>
                      {SENDER_IDENTITIES.filter(s => s.account === 'company').map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="flex items-center gap-2">
                            {s.icon}
                            <span className="text-black">{s.label}</span>
                            <span className="text-black/40 text-xs">({s.email})</span>
                          </span>
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-black/40 uppercase tracking-wider border-t border-[#C9A84C]/10 mt-1">Personal Email</div>
                      {SENDER_IDENTITIES.filter(s => s.account === 'personal').map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="flex items-center gap-2">
                            {s.icon}
                            <span className="text-black">{s.label}</span>
                            <span className="text-black/40 text-xs">({s.email})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Send Method Toggle */}
                <div className="flex items-center justify-between bg-[#FDFBF7] border border-[#C9A84C]/20 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#C9A84C]" />
                    <span className="text-sm text-black">Send via Resend API</span>
                  </div>
                  <Switch checked={sendViaResend} onCheckedChange={setSendViaResend} />
                </div>

                <Input
                  placeholder="To"
                  value={newEmail.to}
                  onChange={(e) => setNewEmail({ ...newEmail, to: e.target.value })}
                />
                <Input
                  placeholder="Subject"
                  value={newEmail.subject}
                  onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                />
                <Textarea
                  placeholder="Write your message..."
                  value={newEmail.body}
                  onChange={(e) => setNewEmail({ ...newEmail, body: e.target.value })}
                  className="min-h-[200px]"
                />

                {/* Signature info */}
                <div className="bg-[#FDFBF7] border border-[#C9A84C]/20 rounded-lg p-3">
                  <p className="text-xs text-black/60 mb-1">Sending as: <strong className="text-black">{currentSender.name}</strong></p>
                  <p className="text-[10px] text-black/40">{currentSender.title} · {currentSender.email}</p>
                </div>

                  <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-black/60 hover:bg-[#C9A84C]/10">
                      <Paperclip className="w-4 h-4 mr-1" /> Attach
                    </Button>
                    <Button variant="ghost" size="sm" className="text-[#C9A84C] hover:bg-[#C9A84C]/10">
                      <Stamp className="w-4 h-4 mr-1" /> Stamp
                    </Button>
                    <Button variant="ghost" size="sm" className="text-[#C9A84C] hover:bg-[#C9A84C]/10">
                      <Sparkles className="w-4 h-4 mr-1" /> Draft with Amanda
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setComposeOpen(false)} className="border-[#C9A84C]/30">Cancel</Button>
                    <Button onClick={() => setApprovePreviewOpen(true)} className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] hover:from-[#B8973F] hover:to-[#A78636] text-white">
                      <CheckCheck className="w-4 h-4 mr-2" /> Preview & Send
                    </Button>
                  </div>
                </div>

                {/* Also notify in chat toggle — show if recipient might be internal */}
                <div className="flex items-center justify-between bg-[#FDFBF7] border border-[#C9A84C]/20 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#C9A84C]" />
                    <span className="text-sm text-black">Also notify in Team Chat</span>
                    <span className="text-[10px] text-black/40">(if internal user)</span>
                  </div>
                  <Switch checked={alsoNotifyChat} onCheckedChange={setAlsoNotifyChat} />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* ── Approve & Send Confirmation Modal ── */}
          <Dialog open={approvePreviewOpen} onOpenChange={setApprovePreviewOpen}>
            <DialogContent className="bg-white border-2 border-[#C9A84C]/30 max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-black flex items-center gap-2">
                  <CheckCheck className="w-5 h-5 text-[#C9A84C]" />
                  Approve & Send — Final Preview
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Send Method Badge */}
                <div className="flex items-center gap-3">
                  <Badge className={cn(
                    "text-xs px-2 py-0.5",
                    sendViaResend ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-zinc-100 text-zinc-600 border-zinc-300"
                  )}>
                    {sendViaResend ? "⚡ Resend API" : "📤 Normal Send"}
                  </Badge>
                  {alsoNotifyChat && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs px-2 py-0.5">
                      💬 + Team Chat Notification
                    </Badge>
                  )}
                </div>

                {/* Full email preview */}
                <div className="border-2 border-[#C9A84C]/20 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-[#FDFBF7] to-[#F5F0E6] px-6 py-4 border-b border-[#C9A84C]/15">
                    <p className="text-sm text-black/60">From: <strong className="text-black">{currentSender.name}</strong> &lt;{currentSender.email}&gt;</p>
                    <p className="text-sm text-black/60">To: <strong className="text-black">{newEmail.to}</strong></p>
                    <p className="text-sm text-black/60">Subject: <strong className="text-black">{newEmail.subject}</strong></p>
                  </div>
                  <div className="px-6 py-5 bg-white">
                    <div className="whitespace-pre-wrap text-black leading-relaxed min-h-[120px]">
                      {newEmail.body}
                    </div>
                  </div>
                  {/* Signature Block */}
                  <div className="px-6 py-4 bg-[#FDFBF7] border-t border-[#C9A84C]/15">
                    <p className="text-sm text-black/70">Best regards,</p>
                    <p className="text-sm font-semibold text-black mt-1">{currentSender.name}</p>
                    <p className="text-xs text-black/50">{currentSender.title}</p>
                    {currentSender.id !== "personal" && (
                      <p className="text-xs text-black/50">JBJ Global Real Estate</p>
                    )}
                    <p className="text-xs text-[#C9A84C] mt-0.5">{currentSender.email}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setApprovePreviewOpen(false)} className="border-[#C9A84C]/30">Back to Edit</Button>
                  <Button
                    onClick={() => { setApprovePreviewOpen(false); sendEmail(); }}
                    disabled={isSending}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-6"
                  >
                    {isSending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    {isSending ? "Sending…" : "Approve & Send"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm bg-white border-[#C9A84C]/20 focus-visible:ring-[#C9A84C]/30"
            />
          </div>
        </div>

        {/* Account Section Tabs */}
        <div className="px-2 pt-3 pb-1">
          <Tabs value={activeAccount} onValueChange={(v) => { setActiveAccount(v as any); setCurrentPage(1); }}>
            <TabsList className="w-full h-9 bg-[#F5F0E6]">
              <TabsTrigger value="all" className="text-[10px] flex-1 h-7 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C9A84C] data-[state=active]:to-[#B8973F] data-[state=active]:text-white">All</TabsTrigger>
              <TabsTrigger value="company" className="text-[10px] flex-1 h-7 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C9A84C] data-[state=active]:to-[#B8973F] data-[state=active]:text-white">
                <Building2 className="w-3 h-3 mr-1" />Company
              </TabsTrigger>
              <TabsTrigger value="personal" className="text-[10px] flex-1 h-7 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C9A84C] data-[state=active]:to-[#B8973F] data-[state=active]:text-white">
                <User className="w-3 h-3 mr-1" />Personal
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Folders */}
        <div className="flex-1 px-2 py-1 overflow-y-auto">
          {folders.map((folder) => (
            <button
              key={folder.id}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors",
                activeFolder === folder.id
                  ? "bg-[#C9A84C]/15 text-black font-medium"
                  : "text-black/60 hover:bg-[#C9A84C]/5 hover:text-black"
              )}
              onClick={() => { setActiveFolder(folder.id); setSelectedEmail(null); setCurrentPage(1); }}
            >
              <span className="flex items-center gap-2.5">
                <folder.icon className="w-4 h-4" />
                {folder.label}
              </span>
              {folder.count > 0 && (
                <Badge className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white text-[10px] px-1.5 h-5 font-bold border-0">{folder.count}</Badge>
              )}
            </button>
          ))}

          <div className="mt-4 mb-2 px-3">
            <span className="text-[10px] font-semibold text-black/40 uppercase tracking-wider">Labels</span>
          </div>
          {labels.map((label) => (
            <button
              key={label.name}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-black/60 hover:bg-[#C9A84C]/5 hover:text-black"
            >
              <div className={cn("w-2.5 h-2.5 rounded-full", label.color)} />
              <span className="capitalize">{label.name}</span>
            </button>
          ))}
        </div>

        {/* Settings Button */}
        <div className="p-2 border-t border-[#C9A84C]/15">
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-black/60 hover:bg-[#C9A84C]/10 hover:text-black"
            onClick={() => setShowEmailSettings(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Email Settings & API Keys
          </Button>
        </div>
      </div>

      {/* Email Settings Dialog */}
      <Dialog open={showEmailSettings} onOpenChange={setShowEmailSettings}>
        <DialogContent className="bg-white border-2 border-[#C9A84C]/30 max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-black flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#C9A84C]" />
              Email Settings & API Integration
            </DialogTitle>
          </DialogHeader>
          <EmailSettingsPanel />
        </DialogContent>
      </Dialog>

      {/* Email List */}
      <div className="w-[340px] border-r border-[#C9A84C]/15 flex flex-col bg-[#FDFBF7]">
        {/* Toolbar */}
        <div className="px-3 py-2 border-b border-[#C9A84C]/15 flex items-center justify-between gap-2 bg-white/80">
          <div className="flex items-center gap-2">
            <Checkbox checked={selectedIds.size > 0 && selectedIds.size === paginatedEmails.length} onCheckedChange={toggleSelectAll} className="border-[#C9A84C]/30" />
            {selectedIds.size > 0 && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#C9A84C]/10" onClick={markSelectedRead}><MailOpen className="w-3.5 h-3.5 text-black/60" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#C9A84C]/10" onClick={() => moveToArchive(Array.from(selectedIds))}><Archive className="w-3.5 h-3.5 text-black/60" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#C9A84C]/10" onClick={() => moveToTrash(Array.from(selectedIds))}><Trash2 className="w-3.5 h-3.5 text-black/60" /></Button>
                <span className="text-[10px] text-black/40">{selectedIds.size} selected</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#C9A84C]/10"><RefreshCw className="w-3.5 h-3.5 text-black/60" /></Button>
            {totalPages > 1 && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="w-3.5 h-3.5" /></Button>
                <span className="text-[10px] text-black/40">{currentPage}/{totalPages}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="w-3.5 h-3.5" /></Button>
              </>
            )}
          </div>
        </div>

        {/* Emails */}
        <ScrollArea className="flex-1">
          {paginatedEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-black/40">
              <Mail className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No emails</p>
            </div>
          ) : (
            paginatedEmails.map((email) => (
              <div
                key={email.id}
                className={cn(
                  "flex items-start gap-2 px-3 py-3 border-b border-[#C9A84C]/10 cursor-pointer transition-colors",
                  selectedEmail?.id === email.id ? "bg-[#C9A84C]/10" : "hover:bg-[#C9A84C]/5",
                  !email.read && "bg-[#C9A84C]/[0.03]"
                )}
                onClick={() => { setSelectedEmail(email); markAsRead(email.id); }}
              >
                <Checkbox
                  checked={selectedIds.has(email.id)}
                  onCheckedChange={() => toggleSelect(email.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 border-[#C9A84C]/30"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); toggleStar(email.id); }}
                  className={cn("mt-1 flex-shrink-0", email.starred ? "text-[#C9A84C]" : "text-black/20 hover:text-black/40")}
                >
                  <Star className="w-3.5 h-3.5" fill={email.starred ? "currentColor" : "none"} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={cn("text-sm truncate text-black", !email.read && "font-semibold")}>{email.from}</span>
                    <span className="text-[10px] text-black/40 flex-shrink-0 ml-2">{formatDate(email.date)}</span>
                  </div>
                  <p className={cn("text-sm truncate", !email.read ? "text-black" : "text-black/60")}>{email.subject}</p>
                  <p className="text-[11px] text-black/40 truncate mt-0.5">{email.body.substring(0, 80)}…</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {email.account === "company" ? (
                      <Badge variant="outline" className="text-[9px] h-4 px-1 border-[#C9A84C]/30 text-[#C9A84C]"><Building2 className="w-2.5 h-2.5 mr-0.5" />Company</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] h-4 px-1 border-emerald-300 text-emerald-600"><User className="w-2.5 h-2.5 mr-0.5" />Personal</Badge>
                    )}
                    {email.hasAttachment && <Paperclip className="w-3 h-3 text-black/40" />}
                    {email.labels.map((l) => (
                      <Badge key={l} variant="outline" className="text-[9px] h-4 px-1 capitalize border-[#C9A84C]/20 text-black/50">{l}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Email View */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedEmail ? (
          <>
            {/* Email Header */}
            <div className="p-5 border-b border-[#C9A84C]/15">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-black">{selectedEmail.subject}</h2>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#C9A84C]/10" onClick={() => moveToArchive([selectedEmail.id])}><Archive className="w-4 h-4 text-black/60" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#C9A84C]/10" onClick={() => moveToTrash([selectedEmail.id])}><Trash2 className="w-4 h-4 text-black/60" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#C9A84C]/10"><MoreVertical className="w-4 h-4 text-black/60" /></Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold",
                    selectedEmail.account === "company" ? "bg-gradient-to-br from-[#C9A84C] to-[#B8973F]" : "bg-emerald-500"
                  )}>
                    {selectedEmail.from[0]}
                  </div>
                  <div>
                    <p className="font-medium text-black">{selectedEmail.from}</p>
                    <p className="text-sm text-black/50">{selectedEmail.fromEmail}</p>
                  </div>
                </div>
                <span className="text-sm text-black/40">{new Date(selectedEmail.date).toLocaleString()}</span>
              </div>
            </div>

            {/* Email Body */}
            <ScrollArea className="flex-1 p-6">
              <div className="whitespace-pre-wrap text-black leading-relaxed max-w-3xl">
                {selectedEmail.body}
              </div>

              {/* Amanda AI Panel — Bilingual Summaries & Actions */}
              <div className="mt-8 p-4 rounded-xl border-2 border-[#C9A84C]/20 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                  <span className="text-sm font-semibold text-black">Amanda Clarke — Executive Assistant</span>
                  <Badge className="bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/30 text-[9px]">Auto</Badge>
                </div>
                
                {/* Summary EN/AR */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white/70 rounded-lg border border-[#C9A84C]/15 p-3">
                    <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-1">Summary (EN)</p>
                    <p className="text-xs text-black/70 leading-relaxed">Sender requesting a meeting to discuss partnership terms. Mentions Q2 schedule and availability on two dates. Requires confirmation.</p>
                  </div>
                  <div className="bg-white/70 rounded-lg border border-[#C9A84C]/15 p-3" dir="rtl">
                    <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-1 text-right">ملخص (AR)</p>
                    <p className="text-xs text-black/70 leading-relaxed text-right">المرسل يطلب اجتماعاً لمناقشة شروط الشراكة. يذكر جدول الربع الثاني وتوفره في تاريخين. يتطلب تأكيداً.</p>
                  </div>
                </div>

                {/* Suggested Reply */}
                <div className="bg-white/70 rounded-lg border border-[#C9A84C]/15 p-3 mb-3">
                  <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-1">Suggested Reply</p>
                  <p className="text-xs text-black/70 leading-relaxed">"Thank you for reaching out. I've reviewed the details and would be happy to schedule a meeting. Please confirm the preferred date so I can block the time."</p>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#C9A84C]/30 text-[#C9A84C]">
                      <Reply className="w-3 h-3 mr-1" /> Use as Reply
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#C9A84C]/30 text-black/60">
                      Edit Draft
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#C9A84C]/20 text-black/60 hover:bg-[#C9A84C]/10">
                    <CheckCheck className="w-3 h-3 mr-1" /> Create Task
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#C9A84C]/20 text-black/60 hover:bg-[#C9A84C]/10">
                    <Calendar className="w-3 h-3 mr-1" /> Add to Calendar
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#C9A84C]/20 text-black/60 hover:bg-[#C9A84C]/10">
                    <Star className="w-3 h-3 mr-1" /> Set Reminder
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#C9A84C]/20 text-black/60 hover:bg-[#C9A84C]/10">
                    <Tag className="w-3 h-3 mr-1" /> Needs Reply
                  </Button>
                </div>
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="p-4 border-t border-[#C9A84C]/15 flex gap-2">
              <Button variant="outline" size="sm" className="border-[#C9A84C]/30 text-black hover:bg-[#C9A84C]/10"><Reply className="w-4 h-4 mr-1.5" /> Reply</Button>
              <Button variant="outline" size="sm" className="border-[#C9A84C]/30 text-black hover:bg-[#C9A84C]/10"><ReplyAll className="w-4 h-4 mr-1.5" /> Reply All</Button>
              <Button variant="outline" size="sm" className="border-[#C9A84C]/30 text-black hover:bg-[#C9A84C]/10"><Forward className="w-4 h-4 mr-1.5" /> Forward</Button>
              <Button variant="outline" size="sm" className="ml-auto border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10">
                <Sparkles className="w-4 h-4 mr-1.5" /> Draft with Amanda
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-black/40">
            <Mail className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium text-black/60">Select an email to read</p>
            <p className="text-sm mt-1">
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : "All caught up"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailClient;
