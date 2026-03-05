import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getListingAdmin } from "@/config/team-members";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  Upload,
  Link as LinkIcon,
  X,
  FolderOpen,
  CheckCircle,
  Clock,
  Trash2,
  Copy,
  Plus,
  Zap,
  ListChecks,
  Paperclip,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "processing" | "success";
  attachments?: { name: string; type: string; size: number }[];
}

interface ListingAdminChatProps {
  onBulkUpload?: (url: string) => void;
  onCreateListing?: (type: "off-plan" | "secondary", data: any) => void;
}

const ListingAdminChat = ({ onBulkUpload, onCreateListing }: ListingAdminChatProps) => {
  const adminPersona = getListingAdmin();
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const getWelcomeMessage = (): Message => ({
    id: "welcome",
    role: "assistant",
    content: `Hello! I'm ${adminPersona?.name || "Sarah Mitchell"}, your Senior Listing Administrator.

---

**What I can do:**

📎 **Paste any link** — I'll scrape it, extract all project details, photos, floor plans, brochures, amenities, payment plans, and queue it for your approval.

📋 **Multiple links** — Paste several URLs at once. I'll process them all and queue each one separately.

📁 **Upload files** — Drop photos, PDFs, brochures, floor plans. I'll group them by project intelligently.

🔍 **Duplicate detection** — If a project already exists on the website, I'll flag it and give you options: **Replace**, **Merge**, or **Skip**.

⚡ **Auto-Approve mode** — Toggle it ON below when you trust the extraction quality. Listings go live instantly.

📄 **Documents saved** — Brochures, floor plans, and payment plans are downloaded and saved permanently in storage.

---

**Supported inputs:**
• Developer websites (Emaar, DAMAC, Sobha, etc.)
• Property portals (Bayut, PropertyFinder, Dubizzle)
• Photos, PDFs, brochures, floor plans (drag & drop or click 📎)
• Links with multiple projects — I'll separate each one
• Any URL with property data

**Paste a link or upload files below to get started!**`,
    timestamp: new Date(),
  });

  const [messages, setMessages] = useState<Message[]>([getWelcomeMessage()]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [urlInputs, setUrlInputs] = useState<string[]>([""]);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing chat session on mount
  useEffect(() => {
    const loadChatSession = async () => {
      if (!user) return;
      try {
        const { data: sessions, error } = await supabase
          .from("listing_admin_chat_sessions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("updated_at", { ascending: false })
          .limit(1);

        if (error) return;

        if (sessions && sessions.length > 0) {
          const session = sessions[0];
          setSessionId(session.id);
          const savedMessages = (session.messages as any[]).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
          if (savedMessages.length > 0) setMessages(savedMessages);
        } else {
          const { data: newSession, error: createError } = await supabase
            .from("listing_admin_chat_sessions")
            .insert({
              user_id: user.id,
              messages: JSON.stringify([getWelcomeMessage()]),
              status: "active",
            } as any)
            .select()
            .single();
          if (!createError && newSession) setSessionId(newSession.id);
        }
      } catch (err) {
        console.error("Error loading chat:", err);
      }
    };
    loadChatSession();
  }, [user]);

  // Save messages
  useEffect(() => {
    const saveMessages = async () => {
      if (!sessionId || messages.length <= 1) return;
      try {
        await supabase
          .from("listing_admin_chat_sessions")
          .update({ messages: messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })) })
          .eq("id", sessionId);
      } catch {}
    };
    const debounce = setTimeout(saveMessages, 500);
    return () => clearTimeout(debounce);
  }, [messages, sessionId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const preventBrowserDropOpen = (event: DragEvent) => {
      event.preventDefault();
    };

    window.addEventListener("dragover", preventBrowserDropOpen);
    window.addEventListener("drop", preventBrowserDropOpen);

    return () => {
      window.removeEventListener("dragover", preventBrowserDropOpen);
      window.removeEventListener("drop", preventBrowserDropOpen);
    };
  }, []);

  const handleClearChat = async () => {
    if (!confirm("Clear chat history?")) return;
    try {
      if (sessionId) {
        await supabase.from("listing_admin_chat_sessions").delete().eq("id", sessionId);
      }
      const welcomeMsg = getWelcomeMessage();
      setMessages([welcomeMsg]);
      setSessionId(null);
      if (user) {
        const { data: newSession } = await supabase
          .from("listing_admin_chat_sessions")
          .insert({ user_id: user.id, messages: [{ ...welcomeMsg, timestamp: welcomeMsg.timestamp.toISOString() }], status: "active" } as any)
          .select().single();
        if (newSession) setSessionId(newSession.id);
      }
      toast.success("Chat cleared");
    } catch {}
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: textToSend, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Check if user pasted URLs in the chat input
      const urlPattern = /https?:\/\/[^\s]+/g;
      const detectedUrls = textToSend.match(urlPattern);

      if (detectedUrls && detectedUrls.length > 0) {
        // Process as URL extraction
        await processUrls(detectedUrls);
      } else {
        // Regular chat with AI
        const conversationHistory = messages.map((m) => ({ role: m.role, content: m.content }));
        const { data, error } = await supabase.functions.invoke("listing-admin-chat", {
          body: { message: textToSend, conversationHistory, personaName: adminPersona?.name || "Sarah Mitchell", personaRole: adminPersona?.role || "Senior Listing Administrator", language },
        });
        if (error) throw error;
        let responseText = data?.response || "I couldn't process that. Please try again.";
        responseText = responseText.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F910}-\u{1F96B}]|[\u{1F980}-\u{1F9E0}]/gu, '');
        setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: responseText.trim(), timestamp: new Date() }]);
        if (data?.action === "suggest_listing" && onCreateListing) {
          toast.success("Ready to create listing");
        }
      }
    } catch (error: any) {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: "Error processing request. Please try again.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const processUrls = async (urls: string[]) => {
    // Show processing message
    const processingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `Processing ${urls.length} link${urls.length > 1 ? "s" : ""}... ${autoApprove ? "⚡ Auto-approve is ON" : "Queuing for your approval"}\n\nThis may take a moment while I scrape, extract, and save all documents.`,
      timestamp: new Date(),
      type: "processing",
    };
    setMessages((prev) => [...prev, processingMsg]);

    try {
      const { data, error } = await supabase.functions.invoke("extract-listing-from-link", {
        body: { urls, userId: user?.id, auto_approve: autoApprove, queue: true },
      });

      if (error) throw error;

      // Build response
      let response = "";
      if (data?.results) {
        const succeeded = data.results.filter((r: any) => r.success);
        const failed = data.results.filter((r: any) => !r.success);

        if (succeeded.length > 0) {
          response += `**${succeeded.length} listing${succeeded.length > 1 ? "s" : ""} extracted successfully!**\n\n`;
          
          for (const r of succeeded) {
            response += `---\n\n`;
            response += `**${r.projectName}**\n`;
            if (r.developer) response += `Developer: ${r.developer}\n`;
            if (r.location) response += `Location: ${r.location}\n`;
            response += `\n`;
            response += `Media: ${r.media.images} photos, ${r.media.documents} documents saved, ${r.media.videos} videos\n`;
            if (r.amenities?.length > 0) response += `Amenities: ${r.amenities.slice(0, 8).join(", ")}${r.amenities.length > 8 ? ` +${r.amenities.length - 8} more` : ""}\n`;
            if (r.paymentPlan) response += `Payment Plan: ${r.paymentPlan}\n`;
            if (r.unitTypes?.length > 0) response += `Unit Types: ${r.unitTypes.join(", ")}\n`;
            if (r.description) response += `\n${r.description}...\n`;
            response += `\nStatus: **${r.status === "auto-approved" ? "AUTO-APPROVED - Live now" : "Pending your approval"}**\n`;
            response += `Processing time: ${(r.duration_ms / 1000).toFixed(1)}s\n\n`;
          }
        }

        if (failed.length > 0) {
          response += `\n**${failed.length} failed:**\n`;
          for (const r of failed) {
            response += `- ${r.url}: ${r.error}\n`;
          }
        }

        if (!autoApprove && succeeded.length > 0) {
          response += `\n---\n\n**Next steps:** Go to the **"Approvals"** tab to review and approve ${succeeded.length > 1 ? "each listing" : "the listing"}.`;
        }
      } else {
        response = data?.message || "Processing complete.";
      }

      // Remove the processing message and add the result
      setMessages((prev) => {
        const without = prev.filter(m => m.id !== processingMsg.id);
        return [...without, {
          id: (Date.now() + 2).toString(),
          role: "assistant" as const,
          content: response,
          timestamp: new Date(),
          type: "success" as const,
        }];
      });

      if (data?.succeeded > 0) {
        toast.success(`${data.succeeded} listing(s) ${autoApprove ? "auto-approved" : "queued for approval"}`);
      }
    } catch (err: any) {
      setMessages((prev) => {
        const without = prev.filter(m => m.id !== processingMsg.id);
        return [...without, {
          id: (Date.now() + 2).toString(),
          role: "assistant" as const,
          content: `Error: ${err.message || "Failed to process links"}. Please try again.`,
          timestamp: new Date(),
        }];
      });
      toast.error("Failed to process links");
    }
  };

  const handleBulkUpload = async () => {
    const validUrls = urlInputs.filter(u => u.trim() && (u.startsWith("http://") || u.startsWith("https://")));
    if (validUrls.length === 0) {
      toast.error("Please enter at least one valid URL");
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Extract listings from ${validUrls.length} link${validUrls.length > 1 ? "s" : ""}:\n${validUrls.map(u => `• ${u}`).join("\n")}${autoApprove ? "\n\n⚡ Auto-approve: ON" : ""}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setUrlInputs([""]);
    setShowBulkUpload(false);
    setIsLoading(true);

    try {
      await processUrls(validUrls);
    } finally {
      setIsLoading(false);
    }
  };

  const addUrlInput = () => {
    if (urlInputs.length < 20) setUrlInputs(prev => [...prev, ""]);
  };

  const removeUrlInput = (index: number) => {
    if (urlInputs.length > 1) setUrlInputs(prev => prev.filter((_, i) => i !== index));
  };

  const updateUrlInput = (index: number, value: string) => {
    setUrlInputs(prev => prev.map((u, i) => i === index ? value : u));
  };

  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(text);
    toast.success("Voice transcribed! Review and send.");
  }, []);

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Uploading ${fileArray.length} file${fileArray.length > 1 ? "s" : ""} for extraction...`,
      timestamp: new Date(),
      attachments: fileArray.map(f => ({ name: f.name, type: f.type, size: f.size })),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const processingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `Analyzing ${fileArray.length} file${fileArray.length > 1 ? "s" : ""}...\n\nI'm grouping documents by project, detecting duplicates with existing listings, and extracting all details. This may take a moment.`,
      timestamp: new Date(),
      type: "processing",
    };
    setMessages((prev) => [...prev, processingMsg]);

    try {
      // Upload files to storage and get URLs (parallel for speed)
      const uploadedUrls: { name: string; url: string; type: string }[] = [];
      const failedUploads: string[] = [];
      const baseTs = Date.now();

      const uploadResults = await Promise.allSettled(
        fileArray.map(async (file, index) => {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `sarah-uploads/${user?.id || "anon"}/${baseTs}-${index}-${safeName}`;

          const { error: uploadError } = await supabase.storage
            .from("project-documents")
            .upload(path, file, { contentType: file.type, upsert: true });

          if (uploadError) {
            throw new Error(`${file.name}: ${uploadError.message}`);
          }

          const { data: urlData } = supabase.storage
            .from("project-documents")
            .getPublicUrl(path);

          return {
            name: file.name,
            url: urlData.publicUrl,
            type: file.type.includes("pdf") ? "pdf" : file.type.includes("image") ? "image" : "document",
          };
        })
      );

      for (const result of uploadResults) {
        if (result.status === "fulfilled") uploadedUrls.push(result.value);
        else failedUploads.push(result.reason?.message || "Unknown upload failure");
      }

      if (uploadedUrls.length === 0) {
        throw new Error("All file uploads failed. Please retry.");
      }

      // Send to AI for extraction
      const { data, error } = await supabase.functions.invoke("extract-listing-from-link", {
        body: {
          files: uploadedUrls,
          userId: user?.id,
          auto_approve: autoApprove,
          queue: true,
          detect_duplicates: true,
        },
      });

      if (error) throw error;

      let response = "";
      if (data?.results) {
        const succeeded = data.results.filter((r: any) => r.success);
        const failed = data.results.filter((r: any) => !r.success);

        if (succeeded.length > 0) {
          response += `**${succeeded.length} listing${succeeded.length > 1 ? "s" : ""} extracted from files!**\n\n`;
          for (const r of succeeded) {
            response += `---\n**${r.projectName}**\n`;
            if (r.developer) response += `Developer: ${r.developer}\n`;
            if (r.location) response += `Location: ${r.location}\n`;
            response += `Files: ${r.files_processed || 0} processed\n`;
            response += `Status: **${r.status === "auto-approved" ? "AUTO-APPROVED" : "Pending approval"}**\n`;
            if (r.view_url) response += `View: ${r.view_url}\n`;
            response += `\n`;
          }
        }

        if (failed.length > 0) {
          response += `\n**${failed.length} could not be processed:**\n`;
          for (const r of failed) {
            response += `- ${r.name || r.url}: ${r.error}\n`;
          }
        }

        if (failedUploads.length > 0) {
          response += `\n**${failedUploads.length} upload failure(s):**\n`;
          for (const uploadError of failedUploads.slice(0, 8)) {
            response += `- ${uploadError}\n`;
          }
          if (failedUploads.length > 8) response += `- +${failedUploads.length - 8} more\n`;
        }

        if (!autoApprove && succeeded.length > 0) {
          response += `\n---\n\n**Next steps:** Go to the **"Approvals"** tab to review. You can **Replace**, **Merge**, or **Skip** each listing.`;
        }
      } else {
        response = `${uploadedUrls.length} file${uploadedUrls.length > 1 ? "s" : ""} uploaded successfully. Processing complete.\n\nCheck the **"Approvals"** tab to review extracted listings.`;
      }

      setMessages((prev) => {
        const without = prev.filter(m => m.id !== processingMsg.id);
        return [...without, {
          id: (Date.now() + 2).toString(),
          role: "assistant" as const,
          content: response,
          timestamp: new Date(),
          type: "success" as const,
        }];
      });

      if (uploadedUrls.length > 0) {
        toast.success(`${uploadedUrls.length} file(s) processed`);
      }
    } catch (err: any) {
      setMessages((prev) => {
        const without = prev.filter(m => m.id !== processingMsg.id);
        return [...without, {
          id: (Date.now() + 2).toString(),
          role: "assistant" as const,
          content: `Error processing files: ${err.message || "Unknown error"}. Please try again.`,
          timestamp: new Date(),
        }];
      });
      toast.error("Failed to process files");
    } finally {
      setIsLoading(false);
      setUploadedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const queueFiles = (incomingFiles: File[]) => {
    if (incomingFiles.length === 0) return;

    setUploadedFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`));
      const deduped = incomingFiles.filter((f) => !existing.has(`${f.name}-${f.size}-${f.lastModified}`));
      return [...prev, ...deduped];
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      queueFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDropFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer?.files?.length) {
      queueFiles(Array.from(e.dataTransfer.files));
      toast.success(`${e.dataTransfer.files.length} file(s) added.`);
    }
  };

  const removeQueuedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendQueuedFiles = async () => {
    if (uploadedFiles.length === 0) return;
    const filesToSend = [...uploadedFiles];
    setUploadedFiles([]);
    await handleFileUpload(filesToSend);
  };

  const openMultiFilePicker = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.multiple = true;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  return (
    <div
      className={`flex flex-col h-full bg-white overflow-hidden transition-all ${isDragOver ? "ring-2 ring-gold ring-inset" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragOver) setIsDragOver(true);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const currentTarget = e.currentTarget;
        const related = e.relatedTarget as Node | null;
        if (!related || !currentTarget.contains(related)) {
          setIsDragOver(false);
        }
      }}
      onDrop={handleDropFiles}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-zinc-200 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <Avatar className="w-10 h-10 border-2 border-gold/30">
          <AvatarImage src={adminPersona?.avatar} alt={adminPersona?.name} />
          <AvatarFallback className="bg-gold/20 text-gold font-semibold">SM</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-black text-sm">{adminPersona?.name || "Sarah Mitchell"}</h3>
          <p className="text-xs text-zinc-600">{adminPersona?.role || "Senior Listing Administrator"}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClearChat} className="h-8 w-8 p-0 text-zinc-500 hover:text-red-500 hover:bg-red-50" title="Clear chat">
          <Trash2 className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-zinc-600">Online</span>
        </div>
      </div>

      {/* Auto-Approve Toggle */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-100 bg-zinc-50">
        <Zap className={`w-4 h-4 ${autoApprove ? "text-amber-500" : "text-zinc-400"}`} />
        <Label htmlFor="auto-approve" className="text-xs font-medium text-zinc-700 cursor-pointer flex-1">
          Auto-Approve Mode
        </Label>
        <Switch
          id="auto-approve"
          checked={autoApprove}
          onCheckedChange={setAutoApprove}
          className="data-[state=checked]:bg-amber-500"
        />
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${autoApprove ? "bg-amber-100 text-amber-700" : "bg-zinc-200 text-zinc-500"}`}>
          {autoApprove ? "LIVE" : "REVIEW"}
        </span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 group ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              {message.role === "assistant" && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={adminPersona?.avatar} alt={adminPersona?.name} />
                  <AvatarFallback className="bg-gold/20 text-gold text-xs">SM</AvatarFallback>
                </Avatar>
              )}
              <div className="flex flex-col max-w-[80%]">
                <div className={`rounded-xl px-4 py-2.5 select-text cursor-text ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border border-gold/30 shadow-md rounded-tr-sm"
                    : message.type === "processing"
                    ? "bg-amber-50 text-black border border-amber-200 rounded-tl-sm"
                    : message.type === "success"
                    ? "bg-green-50 text-black border border-green-200 rounded-tl-sm"
                    : "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black border border-gold/20 shadow-sm rounded-tl-sm"
                }`}>
                  {message.type === "processing" && (
                    <div className="flex items-center gap-2 mb-2 text-amber-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs font-medium">Processing...</span>
                    </div>
                  )}
                  {message.type === "success" && (
                    <div className="flex items-center gap-2 mb-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Complete</span>
                    </div>
                  )}
                  {/* File attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {message.attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-gold/10 rounded text-xs text-foreground">
                          {att.type.includes("image") ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          <span className="truncate max-w-[120px]">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed select-text">{message.content}</p>
                  <p className="text-[10px] mt-1 opacity-60 select-none">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button
                  onClick={async () => { await navigator.clipboard.writeText(message.content); toast.success("Copied"); }}
                  className={`flex items-center gap-1 mt-1 text-[10px] text-zinc-400 hover:text-zinc-700 transition-colors opacity-0 group-hover:opacity-100 ${message.role === "user" ? "self-end mr-1" : "self-start ml-1"}`}
                >
                  <Copy className="w-3 h-3" /><span>Copy</span>
                </button>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={adminPersona?.avatar} alt={adminPersona?.name} />
                <AvatarFallback className="bg-gold/20 text-gold text-xs">SM</AvatarFallback>
              </Avatar>
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-xl px-4 py-3 flex items-center gap-2 border border-gold/20">
                <Loader2 className="w-4 h-4 animate-spin text-gold" />
                <span className="text-sm text-zinc-600">Extracting & processing...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Multi-URL Upload Section */}
      {showBulkUpload && (
        <div className="p-4 border-t border-zinc-200 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] max-h-[300px] overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-5 h-5 text-gold" />
            <span className="font-medium text-black text-sm">Batch URL Extraction</span>
            <Button variant="ghost" size="sm" onClick={() => setShowBulkUpload(false)} className="ml-auto h-6 w-6 p-0 text-zinc-600 hover:text-black">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-zinc-600 mb-3">
            Add multiple URLs. Each will be scraped, documents saved, and queued {autoApprove ? "with auto-approval" : "for your review"}.
          </p>
          <div className="space-y-2 mb-3">
            {urlInputs.map((urlVal, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={urlVal}
                  onChange={(e) => updateUrlInput(i, e.target.value)}
                  placeholder={`https://example.com/project-${i + 1}`}
                  className="flex-1 bg-white border-zinc-300 text-black text-sm h-9"
                />
                {urlInputs.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeUrlInput(i)} className="h-9 w-9 p-0 text-zinc-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addUrlInput} className="text-xs h-8 border-zinc-300 text-zinc-600" disabled={urlInputs.length >= 20}>
              <Plus className="w-3 h-3 mr-1" /> Add URL
            </Button>
            <Button
              onClick={handleBulkUpload}
              variant="primary"
              size="sm"
              disabled={isLoading || urlInputs.every(u => !u.trim())}
              className="ml-auto text-xs h-8"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Upload className="w-3 h-3 mr-1" />
                  Extract {urlInputs.filter(u => u.trim()).length || 0} URL{urlInputs.filter(u => u.trim()).length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded">Google Drive</span>
            <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Bayut</span>
            <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded">PropertyFinder</span>
            <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 rounded">Developer Sites</span>
            <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded">Provident</span>
            <span className="text-[10px] px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded">Any URL</span>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {isDragOver && (
        <div className="px-4 py-2 border-t border-gold/30 bg-gold/10 text-center">
          <p className="text-xs font-medium text-gold">Drop files here to add them to Sarah queue</p>
        </div>
      )}

      {/* Queued Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-zinc-200 bg-zinc-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-700">{uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""} ready</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setUploadedFiles([])} className="h-6 text-[10px] text-zinc-500 hover:text-red-500 px-2">
                Clear all
              </Button>
              <Button variant="ghost" size="sm" onClick={openMultiFilePicker} className="h-6 text-[10px] text-gold px-2">
                <Plus className="w-3 h-3 mr-1" /> Add more
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
            {uploadedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-white border border-zinc-200 rounded text-xs text-foreground group/file">
                {file.type.includes("image") ? <ImageIcon className="w-3 h-3 text-blue-500" /> : <FileText className="w-3 h-3 text-red-500" />}
                <span className="truncate max-w-[100px]">{file.name}</span>
                <button onClick={() => removeQueuedFile(idx)} className="ml-0.5 text-zinc-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-zinc-200 bg-white">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={openMultiFilePicker}
            className="h-10 w-10 p-0 text-zinc-600 hover:text-gold hover:bg-gold/10"
            title="Upload multiple files at once"
            disabled={isLoading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBulkUpload(!showBulkUpload)}
            className={`h-10 w-10 p-0 ${showBulkUpload ? "text-gold bg-gold/10" : "text-zinc-600 hover:text-gold hover:bg-gold/10"}`}
            title="Batch URL Extraction"
          >
            <LinkIcon className="w-5 h-5" />
          </Button>
          <VoiceInputButton
            onTranscript={handleVoiceTranscript}
            disabled={isLoading}
            language={language}
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-zinc-600 hover:text-gold hover:bg-gold/10"
          />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                if (uploadedFiles.length > 0 && !input.trim()) {
                  sendQueuedFiles();
                } else {
                  handleSendMessage();
                }
              }
            }}
            placeholder={uploadedFiles.length > 0 ? "Add a note or press Enter to send files..." : "Paste a URL, upload files, or ask Sarah anything..."}
            className="flex-1 bg-zinc-50 border-zinc-300 text-black"
            disabled={isLoading}
          />
          <Button
            onClick={() => {
              if (uploadedFiles.length > 0 && !input.trim()) {
                sendQueuedFiles();
              } else {
                handleSendMessage();
              }
            }}
            disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading}
            className="h-10 w-10 p-0 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 hover:bg-black hover:border-black group transition-all duration-300"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-gold" /> : <Send className="w-5 h-5 text-gold group-hover:text-white" />}
          </Button>
        </div>
        <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-zinc-400">
          <span>📎 Files & photos • 🔗 URLs • 🎙 Voice • Duplicates auto-detected • {autoApprove ? "⚡ Auto-approve ON" : "Manual approval mode"}</span>
        </div>
      </div>
    </div>
  );
};

export default ListingAdminChat;
