import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Inbox, Send, FileText, Trash2, Star, Archive, Tag, Search,
  Pencil, Reply, ReplyAll, Forward, MoreVertical, Paperclip,
  ChevronDown, RefreshCw, Mail, AlertCircle, Clock
} from "lucide-react";
import { toast } from "sonner";

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
}

const EmailClient = () => {
  const [emails, setEmails] = useState<Email[]>([
    {
      id: "1",
      from: "JJ Global Capital",
      fromEmail: "info@jjglobalcapital.com",
      to: "you@example.com",
      subject: "Welcome to your Email Client",
      body: "Thank you for using our email client! This is a demo email to show you how the interface works.\n\nYou can compose new emails, reply to existing ones, organize them into folders, and much more.\n\nBest regards,\nJJ Global Capital Team",
      date: new Date().toISOString(),
      read: false,
      starred: false,
      folder: "inbox",
      labels: ["important"],
      hasAttachment: false
    },
    {
      id: "2",
      from: "Property Alert",
      fromEmail: "alerts@jjglobalcapital.com",
      to: "you@example.com",
      subject: "New Property Listings in Dubai Marina",
      body: "Dear Investor,\n\nWe have exciting new property listings available in Dubai Marina that match your preferences.\n\n• 2BR Apartment - AED 2.5M\n• 3BR Penthouse - AED 5.8M\n• 1BR Studio - AED 1.2M\n\nContact us to schedule a viewing.\n\nBest,\nProperty Team",
      date: new Date(Date.now() - 3600000).toISOString(),
      read: true,
      starred: true,
      folder: "inbox",
      labels: ["properties"],
      hasAttachment: true
    }
  ]);
  
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeFolder, setActiveFolder] = useState<"inbox" | "sent" | "drafts" | "trash" | "archive">("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [newEmail, setNewEmail] = useState({ to: "", subject: "", body: "" });

  const folders = [
    { id: "inbox", label: "Inbox", icon: Inbox, count: emails.filter(e => e.folder === "inbox" && !e.read).length },
    { id: "sent", label: "Sent", icon: Send, count: 0 },
    { id: "drafts", label: "Drafts", icon: FileText, count: emails.filter(e => e.folder === "drafts").length },
    { id: "archive", label: "Archive", icon: Archive, count: 0 },
    { id: "trash", label: "Trash", icon: Trash2, count: 0 },
  ];

  const labels = [
    { name: "important", color: "bg-red-500" },
    { name: "work", color: "bg-blue-500" },
    { name: "personal", color: "bg-green-500" },
    { name: "properties", color: "bg-purple-500" },
  ];

  const filteredEmails = emails
    .filter(e => e.folder === activeFolder)
    .filter(e => 
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.from.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const markAsRead = (id: string) => {
    setEmails(emails.map(e => e.id === id ? { ...e, read: true } : e));
  };

  const toggleStar = (id: string) => {
    setEmails(emails.map(e => e.id === id ? { ...e, starred: !e.starred } : e));
  };

  const moveToTrash = (id: string) => {
    setEmails(emails.map(e => e.id === id ? { ...e, folder: "trash" } : e));
    setSelectedEmail(null);
    toast.success("Email moved to trash");
  };

  const moveToArchive = (id: string) => {
    setEmails(emails.map(e => e.id === id ? { ...e, folder: "archive" } : e));
    setSelectedEmail(null);
    toast.success("Email archived");
  };

  const sendEmail = () => {
    if (!newEmail.to || !newEmail.subject) {
      toast.error("Please fill in recipient and subject");
      return;
    }

    const email: Email = {
      id: Date.now().toString(),
      from: "You",
      fromEmail: "you@example.com",
      to: newEmail.to,
      subject: newEmail.subject,
      body: newEmail.body,
      date: new Date().toISOString(),
      read: true,
      starred: false,
      folder: "sent",
      labels: [],
      hasAttachment: false
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
    
    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-4">
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Pencil className="w-4 h-4 mr-2" />
                Compose
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
              <DialogHeader>
                <DialogTitle>New Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
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
                  <Button variant="ghost">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attach
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setComposeOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={sendEmail} className="bg-blue-600 hover:bg-blue-700">
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Folders */}
        <div className="flex-1 px-2">
          {folders.map((folder) => (
            <button
              key={folder.id}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1 ${
                activeFolder === folder.id 
                  ? "bg-zinc-700 text-white" 
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
              onClick={() => { setActiveFolder(folder.id as any); setSelectedEmail(null); }}
            >
              <span className="flex items-center gap-3">
                <folder.icon className="w-4 h-4" />
                {folder.label}
              </span>
              {folder.count > 0 && (
                <Badge variant="secondary" className="text-xs">{folder.count}</Badge>
              )}
            </button>
          ))}

          <div className="mt-6 mb-2 px-3">
            <span className="text-xs font-semibold text-zinc-500 uppercase">Labels</span>
          </div>
          {labels.map((label) => (
            <button
              key={label.name}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <div className={`w-3 h-3 rounded-full ${label.color}`} />
              <span className="capitalize">{label.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Email List */}
      <div className="w-96 border-r border-zinc-800 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>

        {/* Email List Header */}
        <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-sm text-zinc-400 capitalize">{activeFolder}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Emails */}
        <ScrollArea className="flex-1">
          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
              <Mail className="w-12 h-12 mb-2 opacity-50" />
              <p>No emails</p>
            </div>
          ) : (
            filteredEmails.map((email) => (
              <button
                key={email.id}
                className={`w-full text-left p-4 border-b border-zinc-800 hover:bg-zinc-900 transition-colors ${
                  selectedEmail?.id === email.id ? "bg-zinc-800" : ""
                } ${!email.read ? "bg-zinc-900/50" : ""}`}
                onClick={() => { setSelectedEmail(email); markAsRead(email.id); }}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(email.id); }}
                    className={`mt-1 ${email.starred ? "text-yellow-400" : "text-zinc-600 hover:text-zinc-400"}`}
                  >
                    <Star className="w-4 h-4" fill={email.starred ? "currentColor" : "none"} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm truncate ${!email.read ? "font-semibold" : ""}`}>
                        {email.from}
                      </span>
                      <span className="text-xs text-zinc-500">{formatDate(email.date)}</span>
                    </div>
                    <p className={`text-sm truncate ${!email.read ? "text-white" : "text-zinc-400"}`}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-zinc-500 truncate mt-1">
                      {email.body.substring(0, 60)}...
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {email.hasAttachment && <Paperclip className="w-3 h-3 text-zinc-500" />}
                      {email.labels.map((label) => (
                        <Badge key={label} variant="outline" className="text-xs capitalize">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Email View */}
      <div className="flex-1 flex flex-col">
        {selectedEmail ? (
          <>
            {/* Email Header */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{selectedEmail.subject}</h2>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => moveToArchive(selectedEmail.id)}>
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => moveToTrash(selectedEmail.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="font-semibold">{selectedEmail.from[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium">{selectedEmail.from}</p>
                    <p className="text-sm text-zinc-400">{selectedEmail.fromEmail}</p>
                  </div>
                </div>
                <span className="text-sm text-zinc-500">
                  {new Date(selectedEmail.date).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Email Body */}
            <ScrollArea className="flex-1 p-6">
              <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed">
                {selectedEmail.body}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="p-4 border-t border-zinc-800 flex gap-2">
              <Button variant="outline">
                <Reply className="w-4 h-4 mr-2" />
                Reply
              </Button>
              <Button variant="outline">
                <ReplyAll className="w-4 h-4 mr-2" />
                Reply All
              </Button>
              <Button variant="outline">
                <Forward className="w-4 h-4 mr-2" />
                Forward
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <Mail className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">Select an email to read</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailClient;
