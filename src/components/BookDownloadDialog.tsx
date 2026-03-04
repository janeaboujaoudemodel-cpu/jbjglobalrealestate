/**
 * BookDownloadDialog - Email capture + download tracking for the Market Intelligence book.
 * Public users provide email; logged-in users auto-fill.
 * Tracks page source, UTM params, device info, and sends admin notification.
 */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Mail, User, CheckCircle, Loader2, BookOpen } from "lucide-react";

interface BookDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookSlug?: string;
  bookTitle?: string;
  pageSource?: string;
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let deviceType = "desktop";
  if (/Mobi|Android/i.test(ua)) deviceType = "mobile";
  else if (/Tablet|iPad/i.test(ua)) deviceType = "tablet";

  let browser = "unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";

  return { deviceType, browser, userAgent: ua };
}

function getUTMParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || null,
    utm_medium: params.get("utm_medium") || null,
    utm_campaign: params.get("utm_campaign") || null,
  };
}

export default function BookDownloadDialog({
  open,
  onOpenChange,
  bookSlug = "market-intelligence-2026",
  bookTitle = "UAE Real Estate Market Intelligence",
  pageSource = "homepage",
}: BookDownloadDialogProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUser({ id: data.user.id, email: data.user.email || "" });
        setEmail(data.user.email || "");
      }
    });
  }, [open]);

  useEffect(() => {
    if (!open) {
      setIsSuccess(false);
    }
  }, [open]);

  const handleDownload = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const { deviceType, browser, userAgent } = getDeviceInfo();
      const utmParams = getUTMParams();

      const { error } = await supabase.from("book_downloads").insert({
        book_slug: bookSlug,
        book_title: bookTitle,
        downloader_email: email.trim(),
        downloader_name: name.trim() || null,
        user_id: currentUser?.id || null,
        page_source: pageSource,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        device_type: deviceType,
        browser,
        user_agent: userAgent,
      });

      if (error) throw error;

      // Create admin notification
      await supabase.from("user_notifications").insert({
        user_id: currentUser?.id || "00000000-0000-0000-0000-000000000000",
        title: `📖 Book Download: ${bookTitle}`,
        message: `${name || "Guest"} (${email}) downloaded "${bookTitle}" from ${pageSource}`,
        type: "book_download",
        is_read: false,
      }).then(() => {});

      setIsSuccess(true);
      toast.success("Request received!");

      // Auto-close after showing success
      setTimeout(() => {
        onOpenChange(false);
      }, 3000);
    } catch (err) {
      console.error("Download tracking error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 bg-gradient-to-br from-[#FEFCF9] via-[#FAF6EE] to-[#F3EDD9] border-2 border-gold/50 overflow-hidden shadow-[0_25px_80px_-12px_rgba(0,0,0,0.35)]">
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-black">Request Received!</DialogTitle>
            <p className="text-black/60 text-sm">
              Thank you for your interest in <span className="font-semibold text-black">{bookTitle}</span>. Our team will send it to your email shortly.
            </p>
          </div>
        ) : (
          <>
            {/* Header with book preview */}
            <div className="bg-gradient-to-r from-zinc-900 via-black to-zinc-900 p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <BookOpen className="w-6 h-6 text-gold" />
                <DialogTitle className="text-lg font-bold text-white tracking-tight">Free Download</DialogTitle>
              </div>
              <p className="text-gold text-sm font-semibold">{bookTitle}</p>
              <p className="text-zinc-500 text-xs mt-1">2026 Edition • By JBJ Global Real Estate</p>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <p className="text-black/70 text-sm text-center">
                Enter your details to receive your complimentary copy
              </p>

              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/60" />
                  <Input
                    type="text"
                    placeholder="Your name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-11 bg-white/90 border-gold/25 rounded-xl focus:border-gold focus:ring-2 focus:ring-gold/20"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/60" />
                  <Input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDownload()}
                    className="pl-10 h-11 bg-white/90 border-gold/25 rounded-xl focus:border-gold focus:ring-2 focus:ring-gold/20"
                    required
                  />
                </div>
              </div>

              <Button
                onClick={handleDownload}
                disabled={isSubmitting || !email.trim()}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#C8A766] via-[#D4AF37] to-[#C8A766] text-white font-bold text-sm shadow-[0_4px_20px_rgba(200,167,102,0.4)] hover:shadow-[0_6px_28px_rgba(200,167,102,0.55)] hover:brightness-105 transition-all border-0"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? "Processing..." : "Download Free Report"}
              </Button>

              <p className="text-[10px] text-black/40 text-center">
                By downloading, you agree to receive market updates from JBJ Global Real Estate. Unsubscribe anytime.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
