import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, UserX, UserCheck, Eye, Clock, MessageSquare, Camera, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";

const ExternalAccessManagement = () => {
  const queryClient = useQueryClient();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Fetch auditor profiles
  const { data: auditors, isLoading } = useQuery({
    queryKey: ["auditor-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditor_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch sessions for expanded user
  const { data: sessions } = useQuery({
    queryKey: ["auditor-sessions", expandedUser],
    queryFn: async () => {
      if (!expandedUser) return [];
      const { data, error } = await supabase
        .from("auditor_sessions")
        .select("*")
        .eq("auditor_user_id", expandedUser)
        .order("session_start", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!expandedUser,
  });

  // Fetch all feedback
  const { data: feedback } = useQuery({
    queryKey: ["auditor-feedback-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditor_feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const unreadCount = feedback?.filter((f: any) => f.status === "new").length || 0;

  // Suspend/unsuspend mutation
  const toggleSuspend = useMutation({
    mutationFn: async ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      const { error } = await supabase
        .from("auditor_profiles")
        .update({
          is_suspended: suspend,
          suspended_at: suspend ? new Date().toISOString() : null,
        })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["auditor-profiles"] });
      toast.success(vars.suspend ? "Access suspended" : "Access restored");
    },
  });

  // Mark feedback as read
  const markRead = useMutation({
    mutationFn: async (feedbackId: string) => {
      const { error } = await supabase
        .from("auditor_feedback")
        .update({ status: "read" })
        .eq("id", feedbackId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auditor-feedback-all"] });
    },
  });

  const formatDate = (d: string | null) => {
    if (!d) return "Never";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (auditor: any) => {
    if (auditor.is_suspended) return <Badge className="bg-red-500/20 text-red-600 border-red-500/40">Suspended</Badge>;
    if (auditor.access_expires_at && new Date(auditor.access_expires_at) < new Date())
      return <Badge className="bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/40">Expired</Badge>;
    return <Badge className="jj-surface-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30/40">Active</Badge>;
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return "No expiry";
    const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "Expired";
    return `${diff} days remaining`;
  };

  return (
    <>
      <SEOHead title="External Access Management | Owner" description="Manage auditor and external user access" canonicalPath="/owner/external-access" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#1A1A1A]" />
              External Access Management
            </h1>
            <p className="text-white/70 text-sm mt-1">
              Manage auditor access, monitor behavior, and review feedback
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white px-3 py-1">
              {unreadCount} unread feedback
            </Badge>
          )}
        </div>

        {/* Active Users */}
        <div className="bg-[#FDFBF7]/50 rounded-xl border border-[#1A1A1A] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1A1A1A]">
            <h2 className="text-lg font-semibold text-white">External Users</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-white/90">Loading...</div>
          ) : !auditors?.length ? (
            <div className="p-8 text-center text-white/90">No external users</div>
          ) : (
            <div className="divide-y divide-[#B89555]/20">
              {auditors.map((auditor: any) => (
                <div key={auditor.id}>
                  <div className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="text-white font-semibold">{auditor.display_name}</p>
                        {getStatusBadge(auditor)}
                      </div>
                      <p className="text-white/90 text-sm">{auditor.email}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-[#1A1A1A]/70">
                        <span>Logins: {auditor.total_logins}</span>
                        <span>Last: {formatDate(auditor.last_login_at)}</span>
                        <span>{getDaysRemaining(auditor.access_expires_at)}</span>
                        <span>Password changed: {auditor.password_changed ? "Yes" : "No"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedUser(expandedUser === auditor.user_id ? null : auditor.user_id)}
                        className="border-[#1A1A1A] text-white/85 hover:text-white"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {expandedUser === auditor.user_id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => toggleSuspend.mutate({ userId: auditor.user_id, suspend: !auditor.is_suspended })}
                        className={auditor.is_suspended
                          ? "jj-surface-emerald hover:jj-surface-emerald text-white"
                          : "bg-red-600 hover:bg-red-700 text-white"
                        }
                      >
                        {auditor.is_suspended ? <UserCheck className="w-4 h-4 mr-1" /> : <UserX className="w-4 h-4 mr-1" />}
                        {auditor.is_suspended ? "Restore" : "Suspend"}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded: Session History */}
                  {expandedUser === auditor.user_id && (
                    <div className="px-5 pb-4 bg-[#FDFBF7]/50">
                      <h3 className="text-sm font-semibold text-white/85 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Session History
                      </h3>
                      {!sessions?.length ? (
                        <p className="text-[#1A1A1A]/70 text-sm">No sessions recorded yet</p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {sessions.map((s: any) => (
                            <div key={s.id} className="bg-[#FDFBF7] rounded-lg p-3 text-xs">
                              <div className="flex justify-between text-white/70">
                                <span>{formatDate(s.session_start)}</span>
                                <span>{s.total_time_seconds ? `${Math.round(s.total_time_seconds / 60)}min` : "In progress"}</span>
                                <span>{s.device_type}</span>
                              </div>
                              {s.pages_visited && Array.isArray(s.pages_visited) && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {(s.pages_visited as any[]).slice(0, 10).map((p: any, i: number) => (
                                    <Badge key={i} variant="outline" className="text-[10px] border-[#1A1A1A] text-white/70">
                                      {p.path}
                                    </Badge>
                                  ))}
                                  {(s.pages_visited as any[]).length > 10 && (
                                    <Badge variant="outline" className="text-[10px] border-[#1A1A1A] text-white/90">
                                      +{(s.pages_visited as any[]).length - 10} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feedback Inbox */}
        <div className="bg-[#FDFBF7]/50 rounded-xl border border-[#1A1A1A] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1A1A1A]">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#1A1A1A]" />
              Auditor Feedback Inbox
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-2">{unreadCount} new</Badge>
              )}
            </h2>
          </div>

          {!feedback?.length ? (
            <div className="p-8 text-center text-white/90">No feedback received yet</div>
          ) : (
            <div className="divide-y divide-[#B89555]/20 max-h-[500px] overflow-y-auto">
              {feedback.map((f: any) => (
                <div
                  key={f.id}
                  className={`px-5 py-4 ${f.status === "new" ? "bg-[#EFE6D6]/5" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Screenshot thumbnail */}
                    {f.screenshot_url && (
                      <a href={f.screenshot_url} target="_blank" rel="noopener noreferrer" className="w-20 h-14 rounded border border-[#1A1A1A] overflow-hidden flex-shrink-0">
                        <img src={f.screenshot_url} alt="Screenshot" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                      </a>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={
                          f.feedback_type === "task" ? "bg-blue-500/20 text-blue-400 border-blue-500/40" :
                          f.feedback_type === "screenshot_note" ? "bg-amber-500/20 text-[#1A1A1A] border-amber-500/40" :
                          "bg-[#B89555]/20 text-white/70 border-[#B89555]/40"
                        }>
                          {f.feedback_type === "task" ? "Task" : f.feedback_type === "screenshot_note" ? "Screenshot" : "Message"}
                        </Badge>
                        <span className="text-[#1A1A1A]/70 text-xs">{formatDate(f.created_at)}</span>
                        {f.status === "new" && <Badge className="bg-red-500 text-white text-[10px]">New</Badge>}
                      </div>

                      {f.note_text && <p className="text-white/85 text-sm mb-1">{f.note_text}</p>}

                      {f.prompt_text && (
                        <div className="bg-[#FDFBF7] rounded-lg p-3 mt-2 relative group">
                          <p className="text-white/70 text-xs font-mono whitespace-pre-wrap">{f.prompt_text}</p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(f.prompt_text);
                              toast.success("Prompt copied!");
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#1A1A1A] hover:text-white"
                            title="Copy prompt"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {f.voice_message_url && (
                        <audio controls src={f.voice_message_url} className="mt-2 w-full h-8" />
                      )}

                      <p className="text-[#1A1A1A]/70 text-xs mt-1">Page: {f.page_url}</p>
                    </div>

                    {f.status === "new" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markRead.mutate(f.id)}
                        className="border-[#1A1A1A] text-white/70 hover:text-white flex-shrink-0"
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExternalAccessManagement;
