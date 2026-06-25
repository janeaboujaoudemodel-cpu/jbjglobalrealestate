/**
 * JBJ Web Developer dock — owner/admin only.
 * Owner-only inline UI tweaker with:
 *  - Natural-language instruction
 *  - Optional screenshot of the current viewport (html2canvas)
 *  - Element picker (click any element to target it)
 *  - Voice note (ElevenLabs Scribe transcription)
 *  - Live CSS preview (`pending`) with explicit Save / Cancel
 *  - "Take me there" navigates to the affected route and highlights
 */
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Send,
  Check,
  X,
  ExternalLink,
  Loader2,
  Minus,
  Camera,
  MousePointerClick,
  Image as ImageIcon,
  Trash2,
  Mic,
  Square,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import WebDevVersionHistory from "./WebDevVersionHistory";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";
import { isOwnerEmail } from "@/config/ownerEmails";
import { useUserMode } from "@/hooks/useUserMode";


type ChangeRequest = {
  id: string;
  route: string;
  instruction: string;
  status: string;
  override_id: string | null;
  created_at: string;
};

function buildSelector(el: Element): string {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const parts: string[] = [];
  let node: Element | null = el;
  let depth = 0;
  while (node && depth < 4 && node.nodeType === 1 && node.tagName !== "BODY") {
    let part = node.tagName.toLowerCase();
    const cls = (node.getAttribute("class") || "")
      .split(/\s+/)
      .filter((c) => c && !c.startsWith("hover:") && !c.startsWith("data-") && c.length < 30)
      .slice(0, 2)
      .map((c) => `.${CSS.escape(c)}`)
      .join("");
    part += cls;
    parts.unshift(part);
    node = node.parentElement;
    depth++;
  }
  return parts.join(" > ");
}

export default function WebDevDock() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isOwner: authIsOwner, ownerLoading, loading: authLoading } = useAuth();
  const { isOwner: roleIsOwner, isLoading: roleLoading } = useIsAppOwner();
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 768px)").matches;
  });
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [targetSelector, setTargetSelector] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Strict desktop-only owner gate. Fails closed: phones, anonymous visitors,
  // public users, and non-owner/admin legacy roles never see the star.
  const { mode } = useUserMode();
  // Strict desktop + owner-mode gate. Fails closed: phones, anonymous visitors,
  // public users, non-owner/admin legacy roles, and any non-owner mode never see the star.
  const allowed = isDesktop && !!user && isOwnerEmail(user.email) && authIsOwner && roleIsOwner && mode === "owner";
  const gateLoading = authLoading || ownerLoading || roleLoading;


  const loadRequests = async () => {
    const { data } = await supabase
      .from("owner_change_requests")
      .select("id, route, instruction, status, override_id, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setRequests((data ?? []) as ChangeRequest[]);
  };
  useEffect(() => {
    if (allowed && open) loadRequests();
  }, [allowed, open]);

  // Refresh trigger from highlight overlay (Save/Cancel there)
  useEffect(() => {
    const onRefresh = () => { if (allowed) loadRequests(); };
    window.addEventListener("jbj:webdev-refresh", onRefresh);
    return () => window.removeEventListener("jbj:webdev-refresh", onRefresh);
  }, [allowed]);

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      const { data } = await supabase
        .from("owner_ui_overrides")
        .select("id, route_pattern, selector, css, status")
        .eq("status", "pending");
      window.dispatchEvent(
        new CustomEvent("jbj:override-preview", { detail: data ?? [] }),
      );
    })();
  }, [allowed, pathname, requests]);

  // Element picker
  useEffect(() => {
    if (!picking) return;
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;pointer-events:none;z-index:11999;border:2px solid #B89555;background:rgba(184,149,85,0.15);transition:all 80ms;";
    document.body.appendChild(overlay);
    const onMove = (e: MouseEvent) => {
      const panel = panelRef.current;
      const el = document
        .elementsFromPoint(e.clientX, e.clientY)
        .find((n) => !panel || !panel.contains(n));
      if (!el) return;
      const r = el.getBoundingClientRect();
      overlay.style.left = `${r.left}px`;
      overlay.style.top = `${r.top}px`;
      overlay.style.width = `${r.width}px`;
      overlay.style.height = `${r.height}px`;
    };
    const onClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const panel = panelRef.current;
      const el = document
        .elementsFromPoint(e.clientX, e.clientY)
        .find((n) => !panel || !panel.contains(n));
      if (el) {
        const sel = buildSelector(el);
        setTargetSelector(sel);
        toast({ title: "Target locked", description: sel });
      }
      setPicking(false);
    };
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.body.style.cursor = "crosshair";
    return () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.body.style.cursor = "";
      overlay.remove();
    };
  }, [picking]);

  const captureScreenshot = async () => {
    try {
      const panel = panelRef.current;
      if (panel) panel.style.visibility = "hidden";
      await new Promise((r) => setTimeout(r, 50));
      const canvas = await html2canvas(document.body, {
        logging: false,
        useCORS: true,
        scale: 0.6,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      if (panel) panel.style.visibility = "";
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      setScreenshot(dataUrl);
      toast({ title: "Screenshot captured", description: "Attached to next request." });
    } catch (e) {
      toast({
        title: "Screenshot failed",
        description: e instanceof Error ? e.message : "Unknown",
        variant: "destructive",
      });
    }
  };

  // ── Voice note ─────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        await transcribe(blob);
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch (e) {
      toast({
        title: "Microphone blocked",
        description: e instanceof Error ? e.message : "Allow mic access.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    setRecording(false);
  };

  const transcribe = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const fd = new FormData();
      fd.append("audio", blob, "voice.webm");
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/owner-webdev-voice`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
          body: fd,
        },
      );
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? "Transcription failed");
      const text = String(json.text ?? "").trim();
      if (text) {
        setInstruction((prev) => (prev ? `${prev.trim()} ${text}` : text));
        toast({ title: "Voice transcribed" });
      } else {
        toast({ title: "No speech detected" });
      }
    } catch (e) {
      toast({
        title: "Voice failed",
        description: e instanceof Error ? e.message : "Unknown",
        variant: "destructive",
      });
    } finally {
      setTranscribing(false);
    }
  };

  const submit = async () => {
    if (!instruction.trim()) return;
    setSubmitting(true);
    try {
      const domSnippet = document.body.innerHTML.slice(0, 6000);
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/owner-webdev-propose`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({
            route: pathname,
            instruction:
              targetSelector
                ? `Target selector: ${targetSelector}\n\n${instruction}`
                : instruction,
            domSnippet,
            screenshot,
            targetSelector,
          }),
        },
      );
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? "Failed");
      toast({
        title: "Preview ready",
        description: "Review the change, then Save to keep it.",
      });
      setInstruction("");
      setScreenshot(null);
      setTargetSelector(null);
      await loadRequests();

      // Auto-highlight if the change applies to the current route
      if (json?.override_id && json?.selector && json?.route === pathname) {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("jbj:webdev-highlight", {
              detail: {
                selector: json.selector,
                overrideId: json.override_id,
                requestId: json.request_id,
                changeLabel: instruction.slice(0, 60),
              },
            }),
          );
        }, 400);
      }
    } catch (e) {
      toast({
        title: "Couldn't apply",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const decide = async (cr: ChangeRequest, status: "approved" | "rejected") => {
    if (!cr.override_id) return;
    if (status === "approved") {
      await supabase.from("owner_ui_overrides").update({ status: "approved" }).eq("id", cr.override_id);
      await supabase.from("owner_change_requests").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", cr.id);
      toast({ title: "Saved", description: "Change is now live." });
    } else {
      await supabase.from("owner_ui_overrides").delete().eq("id", cr.override_id);
      await supabase.from("owner_change_requests").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", cr.id);
      window.dispatchEvent(new CustomEvent("jbj:override-preview", { detail: [] }));
      // Silent cancel — dock UI reflects the change; no floating toast (was rendering behind dock)
    }
    await loadRequests();
  };

  const takeMeThere = async (cr: ChangeRequest) => {
    // Fetch override row to get selector for highlighting
    let selector: string | null = null;
    if (cr.override_id) {
      const { data } = await supabase
        .from("owner_ui_overrides")
        .select("selector")
        .eq("id", cr.override_id)
        .maybeSingle();
      selector = data?.selector ?? null;
    }
    const dispatchHighlight = () => {
      if (!selector) return;
      window.dispatchEvent(
        new CustomEvent("jbj:webdev-highlight", {
          detail: {
            selector,
            overrideId: cr.override_id,
            requestId: cr.id,
            changeLabel: cr.instruction.slice(0, 60),
          },
        }),
      );
    };
    if (cr.route !== pathname) {
      navigate(cr.route);
      setTimeout(dispatchHighlight, 600);
    } else {
      dispatchHighlight();
    }
  };

  if (gateLoading || !allowed) return null;

  const openDock = () => {
    try {
      localStorage.setItem("jj_tour_completed", "true");
    } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent("jbj:webdev-open"));
    setOpen(true);
  };

  const hasRequests = requests.length > 0;

  return (
    <div
      className="hidden md:flex fixed bottom-6 right-6 z-[12000] flex-col items-end gap-3 isolate pointer-events-none"
      data-owner-webdev-dock
      data-no-contrast-guard
    >
      {open && (
        <div
          ref={panelRef}
          className="pointer-events-auto w-[min(460px,calc(100vw-2rem))] h-[min(720px,calc(100vh-3rem))] bg-[#FDFBF7] border border-[#B89555]/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          data-owner-webdev-dock
          data-no-contrast-guard
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-[#B89555]/30 bg-[#F7F2EA] shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#0A0A0A] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[#EFE6D6] allow-white" data-no-contrast-guard />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#1A1A1A] truncate">
                  JBJ Web Developer
                </div>
                <div className="text-[10px] text-[#1A1A1A]/60 truncate">
                  Owner-only · soft CSS overlay
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded hover:bg-[#EFE6D6] text-[#1A1A1A] shrink-0"
              aria-label="Minimize"
              title="Minimize"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Composer */}
          <div className="p-3 border-b border-[#B89555]/20 shrink-0 bg-[#FDFBF7]">
            <div className="text-[11px] text-[#1A1A1A]/60 mb-1.5 truncate">
              On <span className="font-medium text-[#1A1A1A]">{pathname}</span>
            </div>

            {/* Attachments preview */}
            {(screenshot || targetSelector) && (
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {screenshot && (
                  <div className="relative">
                    <img
                      src={screenshot}
                      alt="capture"
                      className="h-12 w-20 object-cover rounded border border-[#B89555]/40"
                    />
                    <button
                      onClick={() => setScreenshot(null)}
                      className="absolute -top-1 -right-1 bg-[#1A1A1A] text-white rounded-full p-0.5 allow-white"
                      aria-label="Remove screenshot"
                      data-no-contrast-guard
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
                {targetSelector && (
                  <div className="flex items-center gap-1 bg-[#EFE6D6] border border-[#B89555]/40 rounded-full px-2 py-1 text-[10px] text-[#1A1A1A] max-w-[220px]">
                    <MousePointerClick className="w-3 h-3 shrink-0" />
                    <span className="truncate font-mono">{targetSelector}</span>
                    <button onClick={() => setTargetSelector(null)} aria-label="Clear target">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <Textarea
              placeholder="Describe a UI change. e.g. Make the hero headline 20% larger and add 24px top padding."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={3}
              className="text-sm resize-none bg-white border-[#B89555]/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40"
            />

            {/* Action bar */}
            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={captureScreenshot}
                  className="inline-flex items-center gap-1 h-8 px-2 rounded-md border border-[#B89555]/40 bg-white hover:bg-[#EFE6D6] text-[#1A1A1A] text-xs"
                  title="Capture viewport screenshot"
                >
                  <Camera className="w-3.5 h-3.5" /> Shot
                </button>
                <button
                  type="button"
                  onClick={() => setPicking(true)}
                  className={`inline-flex items-center gap-1 h-8 px-2 rounded-md border text-xs ${
 picking
 ? "bg-[#B89555]/20 border-[#B89555] text-[#1A1A1A]"
 : "bg-white border-[#B89555]/40 hover:bg-[#EFE6D6] text-[#1A1A1A]"
 }`}
                  title="Pick an element to target"
                >
                  <MousePointerClick className="w-3.5 h-3.5" />
                  {picking ? "Pick…" : "Pick"}
                </button>
                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  disabled={transcribing}
                  className={`inline-flex items-center gap-1 h-8 px-2 rounded-md border text-xs ${
 recording
 ? "bg-red-600 border-red-700 text-white allow-white"
 : transcribing
 ? "bg-[#EFE6D6] border-[#B89555]/40 text-[#1A1A1A]/60"
 : "bg-white border-[#B89555]/40 hover:bg-[#EFE6D6] text-[#1A1A1A]"
 }`}
                  data-no-contrast-guard={recording ? "true" : undefined}
                  data-allow-dark-cta={recording ? "true" : undefined}
                  style={recording ? { color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" } : undefined}
                  title={recording ? "Stop recording" : "Voice note"}
                >
                  {transcribing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : recording ? (
                    <Square className="w-3.5 h-3.5" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                  {recording ? "Stop" : transcribing ? "…" : "Voice"}
                </button>
              </div>
              <button
                type="button"
                onClick={submit}
                disabled={submitting || !instruction.trim()}
                className="allow-white inline-flex items-center justify-center h-8 px-4 shrink-0 rounded-md font-semibold text-[13px] border border-[#B89555]/40 disabled:opacity-60 transition-colors"
                data-no-contrast-guard
                data-allow-dark-cta
                style={{ backgroundColor: "#0A0A0A", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1F1F1F")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0A0A0A")}
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" style={{ color: "#FFFFFF" }} />
                ) : (
                  <Send className="w-3.5 h-3.5 mr-1.5" style={{ color: "#FFFFFF" }} />
                )}
                <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Send</span>
              </button>
            </div>
          </div>

          {/* History — always a tall flex region so the dock keeps a generous chat surface */}
          <div className="flex-1 min-h-[260px] overflow-auto p-2 space-y-2 bg-[#FDFBF7]">
            {hasRequests &&
              requests.map((cr) => (
                <div
                  key={cr.id}
                  className="p-2.5 rounded-lg border border-[#B89555]/30 bg-white"
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span
                      className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
 cr.status === "approved"
 ? "jj-emerald-soft text-[color:var(--emerald-1)]"
 : cr.status === "rejected"
 ? "bg-red-50 text-red-700"
 : cr.status === "ready"
 ? "bg-amber-50 text-amber-700"
 : "bg-[#EFE6D6] text-[#1A1A1A]"
 }`}
                    >
                      {cr.status === "ready" ? "preview" : cr.status}
                    </span>
                    <span className="text-[10px] text-[#1A1A1A]/50 truncate">
                      {cr.route}
                    </span>
                  </div>
                  <p className="text-xs text-[#1A1A1A]/85 leading-snug line-clamp-3">
                    {cr.instruction}
                  </p>
                  {cr.status === "ready" && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => takeMeThere(cr)}
                        className="h-7 text-xs px-2 text-[#1A1A1A] hover:bg-[#EFE6D6]"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" /> Take me there
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => decide(cr, "approved")}
                        className="h-7 text-xs px-2 jj-surface-emerald hover:jj-surface-emerald text-white allow-white font-semibold"
                        data-no-contrast-guard
                        data-allow-dark-cta
                        style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                      >
                        <Check className="w-3 h-3 mr-1" style={{ color: "#FFFFFF" }} />
                        <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Save</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => decide(cr, "rejected")}
                        className="h-7 text-xs px-2 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  )}
                  {cr.override_id && (
                    <div className="mt-2 pt-2 border-t border-[#B89555]/15">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedHistoryId((prev) =>
                            prev === cr.id ? null : cr.id,
                          )
                        }
                        className="inline-flex items-center gap-1 text-[10px] text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
                      >
                        {expandedHistoryId === cr.id ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                        History
                      </button>
                      {expandedHistoryId === cr.id && (
                        <div className="mt-1.5">
                          <WebDevVersionHistory overrideId={cr.override_id} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {!open && (
        <button
          onClick={openDock}
          aria-label="Open Web Developer (owner)"
          title="Web Developer"
          className="pointer-events-auto inline-flex items-center justify-center h-11 w-11 rounded-full bg-[#0A0A0A] shadow-lg border border-[#B89555]/40 allow-white hover:bg-[#1F1F1F] transition-colors"
          data-owner-webdev-dock
          data-no-contrast-guard
          data-allow-dark-cta
          style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
        >
          <Sparkles className="w-5 h-5 text-[#EFE6D6] allow-white" />
        </button>
      )}

    </div>
  );
}
