import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
  MailOpen, ChevronLeft, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    id: "1",
    from: "Property Alert",
    fromEmail: "alerts@jbj.ae",
    to: "ceo@jbj.ae",
    subject: "New Property Listings in Dubai Marina",
    body: "Dear CEO,\n\nWe have exciting new property listings available in Dubai Marina that match your preferences.\n\n• 2BR Apartment - AED 2.5M\n• 3BR Penthouse - AED 5.8M\n• 1BR Studio - AED 1.2M\n\nContact us to schedule a viewing.\n\nBest,\nProperty Team",
    date: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    starred: true,
    folder: "inbox",
    labels: ["properties"],
    hasAttachment: true,
    account: "company",
  },
  {
    id: "2",
    from: "Developer Relations",
    fromEmail: "dev@emaar.com",
    to: "ceo@jbj.ae",
    subject: "Emaar Partnership — Q2 Briefing Schedule",
    body: "Dear Team,\n\nPlease find attached the Q2 briefing schedule for Emaar projects. We'd like to arrange a meeting to discuss the upcoming launches in Downtown Dubai.\n\nAvailability:\n- March 18, 10:00 AM\n- March 20, 2:00 PM\n\nPlease confirm at your earliest.\n\nRegards,\nEmaar Developer Relations",
    date: new Date(Date.now() - 7200000).toISOString(),
    read: true,
    starred: false,
    folder: "inbox",
    labels: ["work"],
    hasAttachment: true,
    account: "company",
  },
  {
    id: "3",
    from: "Travel Concierge",
    fromEmail: "concierge@emirates.com",
    to: "personal@ceo.com",
    subject: "Your upcoming flight confirmation — EK203",
    body: "Dear Valued Customer,\n\nYour flight EK203 from Dubai to London Heathrow on March 25 has been confirmed.\n\nFlight Details:\n- Departure: 08:15 DXB\n- Arrival: 12:30 LHR\n- Class: Business\n- Seat: 4A\n\nSafe travels!",
    date: new Date(Date.now() - 86400000).toISOString(),
    read: false,
    starred: false,
    folder: "inbox",
    labels: ["personal"],
    hasAttachment: false,
    account: "personal",
  },
  {
    id: "4",
    from: "Amanda Clarke",
    fromEmail: "amanda@jbj.ae",
    to: "ceo@jbj.ae",
    subject: "Daily Summary — 5 pending approvals",
    body: "Good morning,\n\nHere's your daily summary:\n\n✅ 3 new developer submissions\n⏳ 5 pending project approvals\n📊 CRM: 12 hot leads requiring follow-up\n📅 2 meetings scheduled today\n\nI've prepared draft responses for the top 3 leads. Review them in the CRM.\n\nBest,\nAmanda",
    date: new Date(Date.now() - 1800000).toISOString(),
    read: false,
    starred: true,
    folder: "inbox",
    labels: ["important"],
    hasAttachment: false,
    account: "company",
  },
];

const EmailClient = () => {
  const [emails, setEmails] = useState<Email[]>(DEMO_EMAILS);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeFolder, setActiveFolder] = useState<"inbox" | "sent" | "drafts" | "trash" | "archive">("inbox");
  const [activeAccount, setActiveAccount] = useState<"all" | "personal" | "company">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSender, setComposeSender] = useState<"company" | "personal">("company");
  const [newEmail, setNewEmail] = useState({ to: "", subject: "", body: "" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
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

  const markAsRead = (id: string) => {
    setEmails(emails.map(e => e.id === id ? { ...e, read: true } : e));
  };

  const toggleStar = (id: string) => {
    setEmails(emails.map(e => e.id === id ? { ...e, starred: !e.starred } : e));
  };

  const moveToTrash = (ids: string[]) => {
    setEmails(emails.map(e => ids.includes(e.id) ? { ...e, folder: "trash" } : e));
    setSelectedEmail(null);
    setSelectedIds(new Set());
    toast.success(`${ids.length} email(s) moved to trash`);
  };

  const moveToArchive = (ids: string[]) => {
    setEmails(emails.map(e => ids.includes(e.id) ? { ...e, folder: "archive" } : e));
    setSelectedEmail(null);
    setSelectedIds(new Set());
    toast.success(`${ids.length} email(s) archived`);
  };

  const markSelectedRead = () => {
    setEmails(emails.map(e => selectedIds.has(e.id) ? { ...e, read: true } : e));
    setSelectedIds(new Set());
    toast.success("Marked as read");
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedEmails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedEmails.map(e => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const sendEmail = () => {
    if (!newEmail.to || !newEmail.subject) {
      toast.error("Please fill in recipient and subject");
      return;
    }

    const email: Email = {
      id: Date.now().toString(),
      from: composeSender === "company" ? "JBJ Global Real Estate" : "Personal",
      fromEmail: composeSender === "company" ? "ceo@jbj.ae" : "personal@ceo.com",
      to: newEmail.to,
      subject: newEmail.subject,
      body: newEmail.body,
      date: new Date().toISOString(),
      read: true,
      starred: false,
      folder: "sent",
      labels: [],
      hasAttachment: false,
      account: composeSender,
    };

    setEmails([...emails, email]);
    setNewEmail({ to: "", subject: "", body: "" });
    setComposeOpen(false);
    toast.success("Email sent!");
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
    <div className="h-[calc(100vh-60px)] bg-background text-foreground flex">
      {/* Sidebar */}
      <div className="w-56 border-r border-border flex flex-col bg-card">
        {/* Compose + Search area with proper padding */}
        <div className="p-4 space-y-3 border-b border-border">
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button variant="primary" className="w-full">
                <Pencil className="w-4 h-4 mr-2" />
                Compose
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">New Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Sender Selector */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">From:</span>
                  <Select value={composeSender} onValueChange={(v) => setComposeSender(v as any)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">
                        <span className="flex items-center gap-2"><Building2 className="w-3 h-3" /> ceo@jbj.ae</span>
                      </SelectItem>
                      <SelectItem value="personal">
                        <span className="flex items-center gap-2"><User className="w-3 h-3" /> personal@ceo.com</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm"><Paperclip className="w-4 h-4 mr-1" /> Attach</Button>
                    <Button variant="ghost" size="sm"><Sparkles className="w-4 h-4 mr-1" /> Draft with Amanda</Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
                    <Button onClick={sendEmail} variant="primary"><Send className="w-4 h-4 mr-2" /> Send</Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Account Tabs */}
        <div className="px-2 pt-3 pb-1">
          <Tabs value={activeAccount} onValueChange={(v) => { setActiveAccount(v as any); setCurrentPage(1); }}>
            <TabsList className="w-full h-8 bg-muted">
              <TabsTrigger value="all" className="text-[10px] flex-1 h-6 data-[state=active]:bg-gold data-[state=active]:text-black">All</TabsTrigger>
              <TabsTrigger value="company" className="text-[10px] flex-1 h-6 data-[state=active]:bg-gold data-[state=active]:text-black">
                <Building2 className="w-3 h-3 mr-1" />Company
              </TabsTrigger>
              <TabsTrigger value="personal" className="text-[10px] flex-1 h-6 data-[state=active]:bg-gold data-[state=active]:text-black">
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
                  ? "bg-gold/15 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              onClick={() => { setActiveFolder(folder.id); setSelectedEmail(null); setCurrentPage(1); }}
            >
              <span className="flex items-center gap-2.5">
                <folder.icon className="w-4 h-4" />
                {folder.label}
              </span>
              {folder.count > 0 && (
                <Badge className="bg-gold text-black text-[10px] px-1.5 h-5 font-bold">{folder.count}</Badge>
              )}
            </button>
          ))}

          <div className="mt-4 mb-2 px-3">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Labels</span>
          </div>
          {labels.map((label) => (
            <button
              key={label.name}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <div className={cn("w-2.5 h-2.5 rounded-full", label.color)} />
              <span className="capitalize">{label.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Email List */}
      <div className="w-[340px] border-r border-border flex flex-col bg-background">
        {/* Toolbar */}
        <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.size > 0 && selectedIds.size === paginatedEmails.length}
              onCheckedChange={toggleSelectAll}
              className="border-border"
            />
            {selectedIds.size > 0 && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={markSelectedRead} title="Mark read">
                  <MailOpen className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveToArchive(Array.from(selectedIds))} title="Archive">
                  <Archive className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveToTrash(Array.from(selectedIds))} title="Trash">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <span className="text-[10px] text-muted-foreground">{selectedIds.size} selected</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Refresh">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            {totalPages > 1 && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-[10px] text-muted-foreground">{currentPage}/{totalPages}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Emails */}
        <ScrollArea className="flex-1">
          {paginatedEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Mail className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No emails</p>
            </div>
          ) : (
            paginatedEmails.map((email) => (
              <div
                key={email.id}
                className={cn(
                  "flex items-start gap-2 px-3 py-3 border-b border-border/50 cursor-pointer transition-colors",
                  selectedEmail?.id === email.id ? "bg-gold/10" : "hover:bg-muted/50",
                  !email.read && "bg-primary/5"
                )}
                onClick={() => { setSelectedEmail(email); markAsRead(email.id); }}
              >
                <Checkbox
                  checked={selectedIds.has(email.id)}
                  onCheckedChange={() => toggleSelect(email.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 border-border"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); toggleStar(email.id); }}
                  className={cn("mt-1 flex-shrink-0", email.starred ? "text-gold" : "text-muted-foreground/40 hover:text-muted-foreground")}
                >
                  <Star className="w-3.5 h-3.5" fill={email.starred ? "currentColor" : "none"} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={cn("text-sm truncate", !email.read && "font-semibold")}>{email.from}</span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{formatDate(email.date)}</span>
                  </div>
                  <p className={cn("text-sm truncate", !email.read ? "text-foreground" : "text-muted-foreground")}>{email.subject}</p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{email.body.substring(0, 80)}…</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {email.account === "company" ? (
                      <Badge variant="outline" className="text-[9px] h-4 px-1 border-gold/30"><Building2 className="w-2.5 h-2.5 mr-0.5" />Company</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] h-4 px-1 border-emerald-300"><User className="w-2.5 h-2.5 mr-0.5" />Personal</Badge>
                    )}
                    {email.hasAttachment && <Paperclip className="w-3 h-3 text-muted-foreground" />}
                    {email.labels.map((l) => (
                      <Badge key={l} variant="outline" className="text-[9px] h-4 px-1 capitalize">{l}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Email View */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedEmail ? (
          <>
            {/* Email Header */}
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-foreground">{selectedEmail.subject}</h2>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveToArchive([selectedEmail.id])} title="Archive">
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveToTrash([selectedEmail.id])} title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold",
                    selectedEmail.account === "company" ? "bg-gold" : "bg-emerald-500"
                  )}>
                    {selectedEmail.from[0]}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{selectedEmail.from}</p>
                    <p className="text-sm text-muted-foreground">{selectedEmail.fromEmail}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{new Date(selectedEmail.date).toLocaleString()}</span>
              </div>
            </div>

            {/* Email Body */}
            <ScrollArea className="flex-1 p-6">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed max-w-3xl">
                {selectedEmail.body}
              </div>

              {/* AI Assistance Panel */}
              <div className="mt-8 p-4 rounded-xl border-2 border-gold/20 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-sm font-semibold text-foreground">Amanda's Suggestions</span>
                </div>
                <div className="space-y-2">
                  <button className="w-full text-left text-sm px-3 py-2 rounded-lg bg-background/60 border border-gold/20 hover:border-gold/40 transition-colors text-foreground">
                    💬 "Thanks for reaching out. I've reviewed the listings and would like to schedule a viewing for the penthouse…"
                  </button>
                  <button className="w-full text-left text-sm px-3 py-2 rounded-lg bg-background/60 border border-gold/20 hover:border-gold/40 transition-colors text-foreground">
                    📋 Summarize this thread
                  </button>
                  <button className="w-full text-left text-sm px-3 py-2 rounded-lg bg-background/60 border border-gold/20 hover:border-gold/40 transition-colors text-foreground">
                    📅 Create task from this email
                  </button>
                </div>
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="p-4 border-t border-border flex gap-2">
              <Button variant="outline" size="sm"><Reply className="w-4 h-4 mr-1.5" /> Reply</Button>
              <Button variant="outline" size="sm"><ReplyAll className="w-4 h-4 mr-1.5" /> Reply All</Button>
              <Button variant="outline" size="sm"><Forward className="w-4 h-4 mr-1.5" /> Forward</Button>
              <Button variant="outline" size="sm" className="ml-auto border-gold/30 text-gold hover:bg-gold/10">
                <Sparkles className="w-4 h-4 mr-1.5" /> Draft with Amanda
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Mail className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Select an email to read</p>
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
