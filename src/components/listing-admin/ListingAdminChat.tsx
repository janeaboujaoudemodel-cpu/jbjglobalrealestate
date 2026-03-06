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
import { useNavigate } from "react-router-dom";
import {
  Send, Loader2, Upload, Link as LinkIcon, X, CheckCircle, Clock,
  Trash2, Copy, Plus, Zap, ListChecks, Paperclip, Image as ImageIcon,
  FileText, RefreshCw, Eye, ExternalLink, MapPin, Building2, Calendar,
} from "lucide-react";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "processing" | "success" | "error";
  attachments?: { name: string; type: string; size: number }[];
  listings?: ListingCard[];
  failedItems?: FailedItem[];
  retryPayload?: any;
}

interface ListingCard {
  importId: string;
  projectName: string;
  developer?: string;
  location?: string;
  status: string;
  imageCount: number;
  docCount: number;
  viewUrl: string;
  duration?: number;
  amenities?: string[];
  paymentPlan?: string;
  description?: string;
  unitTypes?: string[];
  unitDetails?: { type: string; sizeMin?: number; sizeMax?: number; priceFrom?: number; priceTo?: number; bathrooms?: number }[];
  priceFrom?: number;
  priceTo?: number;
  bedroomsMin?: number;
  bedroomsMax?: number;
  handoverDate?: string;
  propertyType?: string;
  projectStatus?: string;
  totalUnits?: number;
  floors?: number;
  heroImage?: string;
}

interface FailedItem {
  url?: string;
  name?: string;
  error: string;
}

interface ListingAdminChatProps {
  onBulkUpload?: (url: string) => void;
  onCreateListing?: (type: "off-plan" | "secondary", data: any) => void;
}

const ListingAdminChat = ({ onBulkUpload, onCreateListing }: ListingAdminChatProps) => {
  const adminPersona = getListingAdmin();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

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
  // Auto-approve permanently disabled — manual publish only
  const autoApprove = false;
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialScrollDone = useRef(false);

  // Load existing chat session
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
            listings: m.listings || undefined,
            failedItems: m.failedItems || undefined,
            retryPayload: m.retryPayload || undefined,
          }));
          if (savedMessages.length > 0) setMessages(savedMessages);
        } else {
          const { data: newSession, error: createError } = await supabase
            .from("listing_admin_chat_sessions")
            .insert({ user_id: user.id, messages: JSON.stringify([getWelcomeMessage()]), status: "active" } as any)
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
        const serializable = messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
          type: m.type,
          attachments: m.attachments,
          listings: m.listings,
          failedItems: m.failedItems,
          retryPayload: m.retryPayload,
        }));
        await supabase
          .from("listing_admin_chat_sessions")
          .update({ messages: serializable as any })
          .eq("id", sessionId);
      } catch {}
    };
    const debounce = setTimeout(saveMessages, 500);
    return () => clearTimeout(debounce);
  }, [messages, sessionId]);

  const isNearBottom = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    isNearBottom.current = nearBottom;
    setShowJumpToLatest(!nearBottom);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Auto-scroll: always scroll to bottom on initial load, then only when near bottom
  useEffect(() => {
    if (!initialScrollDone.current && messages.length > 1) {
      // Force scroll to bottom on initial load
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        initialScrollDone.current = true;
      }, 100);
    } else if (isNearBottom.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const preventBrowserDropOpen = (event: DragEvent) => { event.preventDefault(); };
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
      if (sessionId) await supabase.from("listing_admin_chat_sessions").delete().eq("id", sessionId);
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

  // ── RETRY handler ──
  const handleRetry = async (payload: any) => {
    if (isLoading) return;
    setIsLoading(true);

    const retryMsg: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Retrying extraction...",
      timestamp: new Date(),
      type: "processing",
    };
    setMessages(prev => [...prev, retryMsg]);

    try {
      if (payload.retryImportId) {
        // Retry a specific import
        const { data, error } = await supabase.functions.invoke("extract-listing-from-link", {
          body: { retryImportId: payload.retryImportId },
        });
        if (error) throw error;
        handleExtractionResults(data, retryMsg.id);
      } else if (payload.urls) {
        await processUrls(payload.urls, retryMsg.id);
      } else if (payload.files) {
        const { data, error } = await supabase.functions.invoke("extract-listing-from-link", {
          body: { files: payload.files, userId: user?.id, auto_approve: autoApprove, queue: true },
        });
        if (error) throw error;
        handleExtractionResults(data, retryMsg.id);
      }
    } catch (err: any) {
      setMessages(prev => {
        const without = prev.filter(m => m.id !== retryMsg.id);
        return [...without, {
          id: (Date.now() + 1).toString(), role: "assistant" as const,
          content: `Retry failed: ${err.message}`, timestamp: new Date(), type: "error" as const,
          retryPayload: payload,
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractionResults = (data: any, processingMsgId: string) => {
    const listings: ListingCard[] = [];
    const failedItems: FailedItem[] = [];

    if (data?.results) {
      for (const r of data.results) {
        if (r.success) {
          listings.push({
            importId: r.importId,
            projectName: r.projectName,
            developer: r.developer,
            location: r.location,
            status: r.status,
            imageCount: r.media?.images || 0,
            docCount: r.media?.documents || 0,
            viewUrl: r.view_url || "",
            duration: r.duration_ms,
            amenities: r.amenities,
            paymentPlan: r.paymentPlan,
            description: r.description,
            unitTypes: r.unitTypes,
            unitDetails: r.unitDetails,
            priceFrom: r.priceFrom,
            priceTo: r.priceTo,
            bedroomsMin: r.bedroomsMin,
            bedroomsMax: r.bedroomsMax,
            handoverDate: r.handoverDate,
            propertyType: r.propertyType,
            projectStatus: r.projectStatus,
            totalUnits: r.totalUnits,
            floors: r.floors,
            heroImage: r.heroImage,
          });
        } else {
          failedItems.push({ url: r.url, name: r.name, error: r.error });
        }
      }
    }

    const successText = listings.length > 0
      ? `**${listings.length} listing${listings.length > 1 ? "s" : ""} extracted successfully!**`
      : "";
    const failText = failedItems.length > 0
      ? `\n\n**${failedItems.length} failed** — use the retry button below.`
      : "";

    setMessages(prev => {
      const without = prev.filter(m => m.id !== processingMsgId);
      return [...without, {
        id: (Date.now() + 2).toString(),
        role: "assistant" as const,
        content: successText + failText,
        timestamp: new Date(),
        type: listings.length > 0 ? "success" as const : "error" as const,
        listings,
        failedItems,
        retryPayload: failedItems.length > 0 ? { urls: failedItems.filter(f => f.url).map(f => f.url!) } : undefined,
      }];
    });

    if (listings.length > 0) {
      toast.success(`${listings.length} listing(s) ${autoApprove ? "auto-approved" : "queued for approval"}`);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const urlPattern = /https?:\/\/[^\s]+/g;
      const detectedUrls = textToSend.match(urlPattern);

      if (detectedUrls && detectedUrls.length > 0) {
        const processingMsg: Message = {
          id: (Date.now() + 1).toString(), role: "assistant",
          content: `Processing ${detectedUrls.length} link${detectedUrls.length > 1 ? "s" : ""}... ${autoApprove ? "⚡ Auto-approve ON" : "Queuing for approval"}`,
          timestamp: new Date(), type: "processing",
        };
        setMessages(prev => [...prev, processingMsg]);
        await processUrls(detectedUrls, processingMsg.id);
      } else {
        const conversationHistory = messages.map(m => ({ role: m.role, content: m.content }));
        const { data, error } = await supabase.functions.invoke("listing-admin-chat", {
          body: { message: textToSend, conversationHistory, personaName: adminPersona?.name || "Sarah Mitchell", personaRole: adminPersona?.role || "Senior Listing Administrator", language },
        });
        if (error) throw error;
        let responseText = data?.response || "I couldn't process that. Please try again.";
        responseText = responseText.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F910}-\u{1F96B}]|[\u{1F980}-\u{1F9E0}]/gu, '');
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: responseText.trim(), timestamp: new Date() }]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: "assistant",
        content: "Error processing request. Please try again.", timestamp: new Date(), type: "error",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const pollForResults = useCallback(async (jobId: string, processingMsgId: string) => {
    const maxAttempts = 60; // 3 minutes max (60 * 3s)
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const { data: job, error } = await supabase
          .from("listing_extraction_queue")
          .select("status, results, error_message, urls")
          .eq("id", jobId)
          .single();

        if (error) throw error;

        if (job.status === "completed" && job.results) {
          handleExtractionResults(job.results as any, processingMsgId);
          setIsLoading(false);
          return;
        }

        if (job.status === "failed") {
          setMessages(prev => {
            const without = prev.filter(m => m.id !== processingMsgId);
            return [...without, {
              id: (Date.now() + 2).toString(), role: "assistant" as const,
              content: `Extraction failed: ${job.error_message || "Unknown error"}. Use the retry button below.`,
              timestamp: new Date(), type: "error" as const,
              retryPayload: { urls: (job as any).urls || [] },
            }];
          });
          setIsLoading(false);
          return;
        }

        // Update processing message with progress
        if (attempts % 3 === 0) {
          setMessages(prev => prev.map(m =>
            m.id === processingMsgId
              ? { ...m, content: `Still processing... (${Math.round(attempts * 3)}s elapsed)` }
              : m
          ));
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setMessages(prev => {
            const without = prev.filter(m => m.id !== processingMsgId);
            return [...without, {
              id: (Date.now() + 2).toString(), role: "assistant" as const,
              content: "Extraction timed out. The job may still be processing in the background. Use retry to try again.",
              timestamp: new Date(), type: "error" as const,
              retryPayload: { urls: [] },
            }];
          });
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Poll error:", err);
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        }
      }
    };

    setTimeout(poll, 3000);
  }, []);

  const processUrls = async (urls: string[], processingMsgId?: string) => {
    const msgId = processingMsgId || (Date.now() + 1).toString();

    try {
      const { data, error } = await supabase.functions.invoke("extract-listing-from-link", {
        body: { urls, userId: user?.id, auto_approve: autoApprove, queue: true, async_mode: true },
      });
      if (error) throw error;

      // If async mode returned a jobId, start polling
      if (data?.async && data?.jobId) {
        setMessages(prev => prev.map(m =>
          m.id === msgId
            ? { ...m, content: `Queued! Extracting ${urls.length} link${urls.length > 1 ? "s" : ""} in background... ${autoApprove ? "⚡ Auto-approve ON" : ""}` }
            : m
        ));
        await pollForResults(data.jobId, msgId);
      } else {
        // Synchronous fallback
        handleExtractionResults(data, msgId);
      }
    } catch (err: any) {
      setMessages(prev => {
        const without = prev.filter(m => m.id !== msgId);
        return [...without, {
          id: (Date.now() + 2).toString(), role: "assistant" as const,
          content: `Error: ${err.message || "Failed to process links"}`,
          timestamp: new Date(), type: "error" as const,
          retryPayload: { urls },
        }];
      });
      toast.error("Failed to process links");
    }
  };

  const handleBulkUpload = async () => {
    const validUrls = urlInputs.filter(u => u.trim() && (u.startsWith("http://") || u.startsWith("https://")));
    if (validUrls.length === 0) { toast.error("Please enter at least one valid URL"); return; }

    const userMsg: Message = {
      id: Date.now().toString(), role: "user",
      content: `Extract listings from ${validUrls.length} link${validUrls.length > 1 ? "s" : ""}:\n${validUrls.map(u => `• ${u}`).join("\n")}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setUrlInputs([""]); setShowBulkUpload(false); setIsLoading(true);

    const processingMsg: Message = {
      id: (Date.now() + 1).toString(), role: "assistant",
      content: `Processing ${validUrls.length} URLs...`, timestamp: new Date(), type: "processing",
    };
    setMessages(prev => [...prev, processingMsg]);

    try {
      await processUrls(validUrls, processingMsg.id);
    } finally {
      setIsLoading(false);
    }
  };

  const addUrlInput = () => { if (urlInputs.length < 20) setUrlInputs(prev => [...prev, ""]); };
  const removeUrlInput = (index: number) => { if (urlInputs.length > 1) setUrlInputs(prev => prev.filter((_, i) => i !== index)); };
  const updateUrlInput = (index: number, value: string) => { setUrlInputs(prev => prev.map((u, i) => i === index ? value : u)); };

  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(text);
    toast.success("Voice transcribed! Review and send.");
  }, []);

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const userMsg: Message = {
      id: Date.now().toString(), role: "user",
      content: `Uploading ${fileArray.length} file${fileArray.length > 1 ? "s" : ""}...`,
      timestamp: new Date(),
      attachments: fileArray.map(f => ({ name: f.name, type: f.type, size: f.size })),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const processingMsg: Message = {
      id: (Date.now() + 1).toString(), role: "assistant",
      content: `Analyzing ${fileArray.length} file${fileArray.length > 1 ? "s" : ""}...`,
      timestamp: new Date(), type: "processing",
    };
    setMessages(prev => [...prev, processingMsg]);

    try {
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
          if (uploadError) throw new Error(`${file.name}: ${uploadError.message}`);
          const { data: urlData } = supabase.storage.from("project-documents").getPublicUrl(path);
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

      if (uploadedUrls.length === 0) throw new Error("All file uploads failed.");

      const { data, error } = await supabase.functions.invoke("extract-listing-from-link", {
        body: { files: uploadedUrls, userId: user?.id, auto_approve: autoApprove, queue: true, async_mode: true, detect_duplicates: true },
      });

      if (error) throw error;

      if (data?.async && data?.jobId) {
        setMessages(prev => prev.map(m =>
          m.id === processingMsg.id
            ? { ...m, content: `Files uploaded! Extracting listing data in background...` }
            : m
        ));
        await pollForResults(data.jobId, processingMsg.id);
      } else {
        handleExtractionResults(data, processingMsg.id);
      }

      if (failedUploads.length > 0) {
        toast.error(`${failedUploads.length} file(s) failed to upload`);
      }
    } catch (err: any) {
      setMessages(prev => {
        const without = prev.filter(m => m.id !== processingMsg.id);
        return [...without, {
          id: (Date.now() + 2).toString(), role: "assistant" as const,
          content: `Error: ${err.message || "Unknown error"}`,
          timestamp: new Date(), type: "error" as const,
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
    setUploadedFiles(prev => {
      const existing = new Set(prev.map(f => `${f.name}-${f.size}-${f.lastModified}`));
      const deduped = incomingFiles.filter(f => !existing.has(`${f.name}-${f.size}-${f.lastModified}`));
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
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
    if (e.dataTransfer?.files?.length) {
      queueFiles(Array.from(e.dataTransfer.files));
      toast.success(`${e.dataTransfer.files.length} file(s) added.`);
    }
  };

  const removeQueuedFile = (index: number) => setUploadedFiles(prev => prev.filter((_, i) => i !== index));

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

  // ── LISTING CARD COMPONENT (Premium photo-based) ──
  const ListingPreviewCard = ({ listing }: { listing: ListingCard }) => {
    const isApproved = listing.status === "auto-approved";
    const formatPrice = (price?: number) => {
      if (!price) return null;
      if (price >= 1000000) return `AED ${(price / 1000000).toFixed(1)}M`;
      if (price >= 1000) return `AED ${(price / 1000).toFixed(0)}K`;
      return `AED ${price.toLocaleString()}`;
    };
    const priceDisplay = listing.priceFrom
      ? listing.priceTo && listing.priceTo !== listing.priceFrom
        ? `${formatPrice(listing.priceFrom)} - ${formatPrice(listing.priceTo)}`
        : `From ${formatPrice(listing.priceFrom)}`
      : null;
    const bedroomDisplay = listing.bedroomsMin != null
      ? listing.bedroomsMax && listing.bedroomsMax !== listing.bedroomsMin
        ? `${listing.bedroomsMin} - ${listing.bedroomsMax} BR`
        : `${listing.bedroomsMin} BR`
      : listing.unitTypes?.length ? listing.unitTypes.join(" • ") : null;

    return (
      <div
        className="bg-white rounded-2xl border border-zinc-200 shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
        onClick={() => {
          if (listing.viewUrl.startsWith("http")) window.open(listing.viewUrl, "_blank");
          else navigate(listing.viewUrl);
        }}
      >
        {/* Hero Image */}
        <div className="relative h-40 bg-gradient-to-br from-zinc-100 to-zinc-200 overflow-hidden">
          {listing.heroImage ? (
            <img
              src={listing.heroImage}
              alt={listing.projectName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="w-12 h-12 text-zinc-300" />
            </div>
          )}
          {/* Status Badge */}
          <div className="absolute top-2 left-2">
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold backdrop-blur-sm ${
              isApproved ? "bg-green-500/90 text-white" : "bg-amber-500/90 text-white"
            }`}>
              {isApproved ? "● LIVE" : "◎ PENDING REVIEW"}
            </span>
          </div>
          {/* Photo/Doc Count */}
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />{listing.imageCount}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm flex items-center gap-1">
              <FileText className="w-3 h-3" />{listing.docCount}
            </span>
          </div>
          {/* Project Status */}
          {listing.projectStatus && (
            <div className="absolute top-2 right-2">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm uppercase tracking-wider font-medium">
                {listing.projectStatus}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4 className="font-bold text-sm text-foreground leading-tight">{listing.projectName}</h4>
          </div>

          {listing.developer && (
            <div className="flex items-center gap-1.5 mb-1">
              <Building2 className="w-3.5 h-3.5 text-[#C8A766]" />
              <span className="text-xs font-medium text-[#C8A766]">{listing.developer}</span>
            </div>
          )}
          {listing.location && (
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{listing.location}</span>
            </div>
          )}

          {/* Price & Bedrooms Row */}
          {(priceDisplay || bedroomDisplay) && (
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-100">
              {priceDisplay && (
                <span className="text-sm font-bold text-foreground">{priceDisplay}</span>
              )}
              {bedroomDisplay && (
                <span className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-full font-medium">{bedroomDisplay}</span>
              )}
            </div>
          )}

          {/* Key Details Grid */}
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {listing.propertyType && (
              <div className="text-center px-1.5 py-1 bg-zinc-50 rounded-lg">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Type</p>
                <p className="text-[11px] font-semibold text-foreground truncate">{listing.propertyType}</p>
              </div>
            )}
            {listing.handoverDate && (
              <div className="text-center px-1.5 py-1 bg-zinc-50 rounded-lg">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Handover</p>
                <p className="text-[11px] font-semibold text-foreground truncate">{listing.handoverDate}</p>
              </div>
            )}
            {listing.paymentPlan && (
              <div className="text-center px-1.5 py-1 bg-zinc-50 rounded-lg">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Payment</p>
                <p className="text-[11px] font-semibold text-foreground">{listing.paymentPlan}</p>
              </div>
            )}
            {listing.totalUnits && (
              <div className="text-center px-1.5 py-1 bg-zinc-50 rounded-lg">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Units</p>
                <p className="text-[11px] font-semibold text-foreground">{listing.totalUnits}</p>
              </div>
            )}
            {listing.floors && (
              <div className="text-center px-1.5 py-1 bg-zinc-50 rounded-lg">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Floors</p>
                <p className="text-[11px] font-semibold text-foreground">{listing.floors}</p>
              </div>
            )}
          </div>

          {/* Unit Details (per bedroom) */}
          {listing.unitDetails && listing.unitDetails.length > 0 && (
            <div className="mb-2 p-2 bg-gradient-to-r from-[#FDFBF7] to-[#F5F0E6] rounded-lg border border-[#C8A766]/20">
              <p className="text-[9px] font-bold text-[#C8A766] uppercase tracking-wider mb-1">Unit Breakdown</p>
              <div className="space-y-0.5">
                {listing.unitDetails.slice(0, 6).map((u, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <span className="font-medium text-foreground">{u.type}</span>
                    <span className="text-muted-foreground">
                      {u.sizeMin ? `${u.sizeMin.toLocaleString()}${u.sizeMax && u.sizeMax !== u.sizeMin ? `-${u.sizeMax.toLocaleString()}` : ""} sqft` : ""}
                      {u.priceFrom ? ` · ${formatPrice(u.priceFrom)}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {listing.amenities.slice(0, 5).map((a, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded-full">{a}</span>
              ))}
              {listing.amenities.length > 5 && (
                <span className="text-[9px] px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded-full">+{listing.amenities.length - 5}</span>
              )}
            </div>
          )}

          {/* Duration */}
          {listing.duration && (
            <p className="text-[9px] text-muted-foreground mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Extracted in {(listing.duration / 1000).toFixed(1)}s
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-8 text-xs bg-gradient-to-r from-[#D4A853] to-[#C19A3E] text-white hover:opacity-90 rounded-lg font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                if (listing.viewUrl.startsWith("http")) window.open(listing.viewUrl, "_blank");
                else navigate(listing.viewUrl);
              }}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              {isApproved ? "View Live Project" : "Review & Approve"}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ── RENDER MESSAGE ──
  const renderMessageContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const lines = content.split("\n");
    return lines.map((line, li) => {
      const parts = line.split(urlRegex);
      return (
        <span key={li}>
          {parts.map((part, pi) =>
            /^https?:\/\//.test(part) ? (
              <a key={pi} href={part} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80 text-[#D4A853]">{part}</a>
            ) : (
              <span key={pi}>{part}</span>
            )
          )}
          {li < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div
      className={`flex flex-col h-full bg-white overflow-hidden transition-all ${isDragOver ? "ring-2 ring-gold ring-inset" : ""}`}
      style={{ borderRadius: 0 }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!isDragOver) setIsDragOver(true); }}
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
      onDragLeave={(e) => {
        e.preventDefault(); e.stopPropagation();
        const related = e.relatedTarget as Node | null;
        if (!related || !e.currentTarget.contains(related)) setIsDragOver(false);
      }}
      onDrop={handleDropFiles}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-zinc-200 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]" style={{ borderRadius: 0 }}>
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

      {/* Manual Review Mode - Auto-approve disabled */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-100 bg-zinc-50">
        <CheckCircle className="w-4 h-4 text-emerald-500" />
        <span className="text-xs font-medium text-zinc-700 flex-1">Manual Review Mode</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
          REVIEW
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
              <div className="flex flex-col max-w-[85%]">
                <div className={`rounded-2xl px-4 py-2.5 select-text cursor-text ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border border-gold/30 shadow-md"
                    : message.type === "processing"
                    ? "bg-amber-50 text-black border border-amber-200"
                    : message.type === "success"
                    ? "bg-green-50 text-black border border-green-200"
                    : message.type === "error"
                    ? "bg-red-50 text-black border border-red-200"
                    : "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black border border-gold/20 shadow-sm"
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
                  {message.type === "error" && (
                    <div className="flex items-center gap-2 mb-2 text-red-600">
                      <X className="w-4 h-4" />
                      <span className="text-xs font-medium">Error</span>
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
                  <div className="text-sm whitespace-pre-wrap leading-relaxed select-text">{renderMessageContent(message.content)}</div>
                  <p className="text-[10px] mt-1 opacity-60 select-none">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {/* LISTING PREVIEW CARDS */}
                {message.listings && message.listings.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.listings.map((listing) => (
                      <ListingPreviewCard key={listing.importId} listing={listing} />
                    ))}
                  </div>
                )}

                {/* FAILED ITEMS */}
                {message.failedItems && message.failedItems.length > 0 && (
                  <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs font-medium text-red-700 mb-1">Failed items:</p>
                    {message.failedItems.map((item, i) => (
                      <p key={i} className="text-[11px] text-red-600 truncate">• {item.url || item.name}: {item.error}</p>
                    ))}
                  </div>
                )}

                {/* RETRY BUTTON */}
                {(message.type === "error" || (message.failedItems && message.failedItems.length > 0)) && message.retryPayload && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 self-start h-7 text-xs border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                    onClick={() => handleRetry(message.retryPayload)}
                    disabled={isLoading}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Try Again
                  </Button>
                )}

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
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Jump to latest button */}
      {showJumpToLatest && (
        <div className="flex justify-center -mt-10 mb-2 relative z-10">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs bg-white/90 backdrop-blur-sm border-gold/30 shadow-md hover:bg-gold/10"
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              isNearBottom.current = true;
              setShowJumpToLatest(false);
            }}
          >
            ↓ Jump to latest
          </Button>
        </div>
      )}

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
          <p className="text-xs text-zinc-600 mb-3">Add multiple URLs. Each will be scraped, documents saved, and queued.</p>
          <div className="space-y-2 mb-3">
            {urlInputs.map((urlVal, i) => (
              <div key={i} className="flex gap-2">
                <Input value={urlVal} onChange={(e) => updateUrlInput(i, e.target.value)} placeholder={`https://example.com/project-${i + 1}`} className="flex-1 bg-white border-zinc-300 text-black text-sm h-9" />
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
            <Button onClick={handleBulkUpload} variant="primary" size="sm" disabled={isLoading || urlInputs.every(u => !u.trim())} className="ml-auto text-xs h-8">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-3 h-3 mr-1" />Extract {urlInputs.filter(u => u.trim()).length || 0} URL{urlInputs.filter(u => u.trim()).length !== 1 ? "s" : ""}</>}
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
      <input ref={fileInputRef} type="file" multiple accept="*/*" onChange={handleFileInputChange} className="hidden" />

      {isDragOver && (
        <div className="px-4 py-2 border-t border-gold/30 bg-gold/10 text-center">
          <p className="text-xs font-medium text-gold">Drop files here to add them to Sarah's queue</p>
        </div>
      )}

      {/* Queued Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-zinc-200 bg-zinc-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-700">{uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""} ready</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setUploadedFiles([])} className="h-6 text-[10px] text-zinc-500 hover:text-red-500 px-2">Clear all</Button>
              <Button variant="ghost" size="sm" onClick={openMultiFilePicker} className="h-6 text-[10px] text-gold px-2"><Plus className="w-3 h-3 mr-1" /> Add more</Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
            {uploadedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-white border border-zinc-200 rounded text-xs text-foreground group/file">
                {file.type.includes("image") ? <ImageIcon className="w-3 h-3 text-blue-500" /> : <FileText className="w-3 h-3 text-red-500" />}
                <span className="truncate max-w-[100px]">{file.name}</span>
                <button onClick={() => removeQueuedFile(idx)} className="ml-0.5 text-zinc-400 hover:text-red-500"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          {/* Send queued files button */}
          <Button
            size="sm"
            className="w-full mt-2 h-8 text-xs bg-gradient-to-r from-[#D4A853] to-[#C19A3E] text-white hover:opacity-90"
            onClick={sendQueuedFiles}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
            Process {uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""}
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-zinc-200 bg-white" style={{ borderRadius: 0 }}>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={openMultiFilePicker} className="h-10 w-10 p-0 text-zinc-600 hover:text-gold hover:bg-gold/10" title="Upload files" disabled={isLoading}>
            <Paperclip className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowBulkUpload(!showBulkUpload)}
            className={`h-10 w-10 p-0 ${showBulkUpload ? "text-gold bg-gold/10" : "text-zinc-600 hover:text-gold hover:bg-gold/10"}`} title="Batch URL Extraction">
            <LinkIcon className="w-5 h-5" />
          </Button>
          <VoiceInputButton onTranscript={handleVoiceTranscript} disabled={isLoading} language={language} variant="ghost" className="h-10 w-10 p-0 text-zinc-600 hover:text-gold hover:bg-gold/10" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            placeholder="Paste a URL, ask Sarah anything, or upload files..."
            className="flex-1 bg-zinc-50 border-zinc-300 text-black placeholder:text-zinc-400 h-10"
            disabled={isLoading}
          />
          <Button onClick={() => handleSendMessage()} disabled={isLoading || !input.trim()} className="h-10 w-10 p-0 bg-gradient-to-r from-[#D4A853] to-[#C19A3E] text-white hover:opacity-90 disabled:opacity-50">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ListingAdminChat;
