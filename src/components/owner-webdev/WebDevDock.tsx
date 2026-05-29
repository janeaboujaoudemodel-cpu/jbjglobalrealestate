/**
 * Persistent JBJ Web Developer dock — visible only to owner/admin users
 * on owner-authenticated routes. Lets the owner describe a UI change,
 * generates a scoped CSS override (soft mode), and exposes Approve /
 * Reject / Take me there controls.
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Check,
  X,
  ExternalLink,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type ChangeRequest = {
  id: string;
  route: string;
  instruction: string;
  status: string;
  override_id: string | null;
  created_at: string;
};

export default function WebDevDock() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [allowed, setAllowed] = useState(false);

  // Gate: only owner/admin sees the dock
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id);
      const ok = (roles ?? []).some(
        (r: { role: string }) => r.role === "owner" || r.role === "admin",
      );
      setAllowed(ok);
    })();
  }, []);

  // Load recent requests
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

  // Pull previews (pending overrides) for current route
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
            instruction,
            domSnippet,
          }),
        },
      );
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? "Failed");
      toast({
        title: "Web Developer ready",
        description: "Review the change on this page and Approve or Reject.",
      });
      setInstruction("");
      await loadRequests();
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
      await supabase
        .from("owner_ui_overrides")
        .update({ status: "approved" })
        .eq("id", cr.override_id);
      await supabase
        .from("owner_change_requests")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", cr.id);
    } else {
      await supabase
        .from("owner_ui_overrides")
        .delete()
        .eq("id", cr.override_id);
      await supabase
        .from("owner_change_requests")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", cr.id);
      // remove from live preview
      window.dispatchEvent(
        new CustomEvent("jbj:override-preview", { detail: [] }),
      );
    }
    await loadRequests();
  };

  const takeMeThere = (cr: ChangeRequest) => {
    if (cr.route === pathname) {
      // pulse the element
      // selectors are stored on override row; do a soft scroll to first matching
      const sel = (cr.instruction ?? "").slice(0, 0); // placeholder
      void sel;
    } else {
      navigate(cr.route);
    }
  };

  if (!allowed) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[9998]"
      data-no-contrast-guard
    >
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#102540] text-white shadow-lg border border-[#B89555]/40 allow-white hover:bg-[#1a3d63] transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#EFE6D6]" />
            <span className="text-sm font-medium">Web Developer</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="w-[360px] max-h-[78vh] bg-[#FDFBF7] border border-[#B89555]/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            data-gold-hairline
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#B89555]/20 bg-[#F7F2EA]" data-gold-hairline>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#102540] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#EFE6D6]" data-no-contrast-guard />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1A1A1A]">JBJ Web Developer</div>
                  <div className="text-[10px] text-[#1A1A1A]/60">Soft mode · CSS overlay</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded hover:bg-[#EFE6D6] text-[#1A1A1A]"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-[#B89555]/20" data-gold-hairline>
              <div className="text-[11px] text-[#1A1A1A]/60 mb-1.5">
                On <span className="font-medium text-[#1A1A1A]">{pathname}</span>
              </div>
              <Textarea
                placeholder="e.g. Move the search bar up by 20px and add 12px padding"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                rows={3}
                className="text-sm resize-none bg-white border-[#B89555]/30"
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={submit}
                  disabled={submitting || !instruction.trim()}
                  className="bg-[#102540] hover:bg-[#1a3d63] text-white allow-white"
                  data-no-contrast-guard
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Send
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-2 space-y-2">
              {requests.length === 0 && (
                <div className="text-center text-xs text-[#1A1A1A]/60 py-6">
                  No requests yet. Describe a UI change above.
                </div>
              )}
              {requests.map((cr) => (
                <div
                  key={cr.id}
                  className="p-2.5 rounded-lg border border-[#B89555]/20 bg-white"
                  data-gold-hairline
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        cr.status === "approved"
                          ? "bg-emerald-50 text-emerald-700"
                          : cr.status === "rejected"
                          ? "bg-red-50 text-red-700"
                          : "bg-[#EFE6D6] text-[#1A1A1A]"
                      }`}
                    >
                      {cr.status}
                    </span>
                    <span className="text-[10px] text-[#1A1A1A]/50 truncate max-w-[140px]">
                      {cr.route}
                    </span>
                  </div>
                  <p className="text-xs text-[#1A1A1A]/85 leading-snug line-clamp-3">
                    {cr.instruction}
                  </p>
                  {cr.status === "ready" && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => takeMeThere(cr)}
                        className="h-7 text-xs px-2 text-[#1A1A1A]"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" /> Take me there
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => decide(cr, "approved")}
                        className="h-7 text-xs px-2 bg-emerald-600 hover:bg-emerald-700 text-white allow-white"
                        data-no-contrast-guard
                      >
                        <Check className="w-3 h-3 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => decide(cr, "rejected")}
                        className="h-7 text-xs px-2 text-red-700 hover:bg-red-50"
                      >
                        <X className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
