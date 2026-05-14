/**
 * Voice Agent Control Panel
 * Owner-only dashboard for the ElevenLabs concierge: call history, metrics,
 * and quick-config links. The actual agent prompt/voice is managed in the
 * ElevenLabs dashboard; this page surfaces the operational state.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, PhoneCall, Clock, Users, ExternalLink, Mic2, Settings, Save, Send, Loader2, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface AgentConfig {
  agent_id: string;
  name: string;
  prompt: string;
  first_message: string;
  language: string;
  voice_id: string;
  llm: string;
}

interface TestMessage { role: "user" | "assistant"; content: string }

type Row = {
  id: string;
  user_id: string | null;
  conversation_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
};

function fmtDuration(sec: number | null): string {
  if (!sec || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function VoiceAgentControlPanel() {
  const { data: logs = [], isLoading } = useQuery<Row[]>({
    queryKey: ["voice_call_logs_owner"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voice_call_logs")
        .select("id,user_id,conversation_id,started_at,ended_at,duration_seconds")
        .order("started_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const stats = useMemo(() => {
    const total = logs.length;
    const completed = logs.filter((l) => l.ended_at).length;
    const totalSec = logs.reduce((s, l) => s + (l.duration_seconds || 0), 0);
    const unique = new Set(logs.map((l) => l.user_id).filter(Boolean)).size;
    const avg = completed > 0 ? Math.round(totalSec / completed) : 0;
    return { total, completed, totalSec, unique, avg };
  }, [logs]);

  // Live agent config (prompt/voice/language/first message)
  const qc = useQueryClient();
  const { data: agent, isLoading: loadingAgent, error: agentError } = useQuery<AgentConfig>({
    queryKey: ["elevenlabs_agent_config"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("elevenlabs-agent", { method: "GET" });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      return data as AgentConfig;
    },
  });

  const [draft, setDraft] = useState<AgentConfig | null>(null);
  useEffect(() => { if (agent && !draft) setDraft(agent); }, [agent, draft]);

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<AgentConfig>) => {
      const { data, error } = await supabase.functions.invoke("elevenlabs-agent", {
        method: "POST",
        body: payload,
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      return data;
    },
    onSuccess: () => {
      toast.success("Agent updated in ElevenLabs");
      qc.invalidateQueries({ queryKey: ["elevenlabs_agent_config"] });
    },
    onError: (e: Error) => toast.error(e.message || "Save failed"),
  });

  // Free text-mode tester (uses Lovable AI gateway, no ElevenLabs credits)
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testing, setTesting] = useState(false);
  const testEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { testEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [testMessages, testing]);

  const runTest = async () => {
    const text = testInput.trim();
    if (!text || !draft) return;
    const next: TestMessage[] = [...testMessages, { role: "user", content: text }];
    setTestMessages(next);
    setTestInput("");
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("elevenlabs-agent-test-chat", {
        body: { systemPrompt: draft.prompt, messages: next },
      });
      if (error) throw error;
      const reply = (data as { reply?: string; error?: string })?.reply ?? "";
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setTestMessages((m) => [...m, { role: "assistant", content: reply || "(no reply)" }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
    } finally {
      setTesting(false);
    }
  };

  const dirty = !!(agent && draft && (
    draft.prompt !== agent.prompt ||
    draft.first_message !== agent.first_message ||
    draft.language !== agent.language ||
    draft.voice_id !== agent.voice_id
  ));

  return (
    <div className="min-h-screen bg-[#FDFBF7] px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold text-[#1A1A1A]">Voice Agent</h1>
            <p className="text-sm text-[#1A1A1A]/70 mt-1">
              ElevenLabs concierge — live status, call history, and configuration.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="border-[#B89555]/40 bg-[#F7F2EA] hover:bg-[#EFE6D6] text-[#1A1A1A]">
              <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer">
                <Settings className="w-4 h-4 mr-2" />
                Agent Settings
                <ExternalLink className="w-3.5 h-3.5 ml-2" />
              </a>
            </Button>
            <Button asChild variant="outline" className="border-[#B89555]/40 bg-[#F7F2EA] hover:bg-[#EFE6D6] text-[#1A1A1A]">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <Phone className="w-4 h-4 mr-2" />
                Test Concierge
              </a>
            </Button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/40">
            <div className="flex items-center gap-3">
              <IconTile icon={PhoneCall} tone="emerald" size="md" />
              <div>
                <div className="text-2xl font-semibold text-[#1A1A1A]">{stats.total}</div>
                <div className="text-xs text-[#1A1A1A]/70">Total calls</div>
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/40">
            <div className="flex items-center gap-3">
              <IconTile icon={Clock} tone="blue" size="md" />
              <div>
                <div className="text-2xl font-semibold text-[#1A1A1A]">{fmtDuration(stats.totalSec)}</div>
                <div className="text-xs text-[#1A1A1A]/70">Total talk time</div>
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/40">
            <div className="flex items-center gap-3">
              <IconTile icon={Mic2} tone="amber" size="md" />
              <div>
                <div className="text-2xl font-semibold text-[#1A1A1A]">{fmtDuration(stats.avg)}</div>
                <div className="text-xs text-[#1A1A1A]/70">Avg call length</div>
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/40">
            <div className="flex items-center gap-3">
              <IconTile icon={Users} tone="purple" size="md" />
              <div>
                <div className="text-2xl font-semibold text-[#1A1A1A]">{stats.unique}</div>
                <div className="text-xs text-[#1A1A1A]/70">Unique callers</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Call history */}
        <Card className="bg-[#F7F2EA] border border-[#B89555]/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#B89555]/30 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Recent calls</h2>
            <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
              Last {logs.length}
            </Badge>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-[#1A1A1A]/60 text-sm">Loading call history…</div>
          ) : logs.length === 0 ? (
            <div className="p-10 text-center">
              <Phone className="w-10 h-10 mx-auto text-[#1A1A1A]/30 mb-3" />
              <p className="text-[#1A1A1A]/70 text-sm">
                No calls yet. The concierge widget on the homepage logs every voice session here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#EFE6D6] text-[#1A1A1A]/80">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Started</th>
                    <th className="text-left px-5 py-3 font-medium">Duration</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Conversation</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => (
                    <tr key={row.id} className="border-t border-[#B89555]/20">
                      <td className="px-5 py-3 text-[#1A1A1A]">
                        {formatDistanceToNow(new Date(row.started_at), { addSuffix: true })}
                      </td>
                      <td className="px-5 py-3 text-[#1A1A1A]">{fmtDuration(row.duration_seconds)}</td>
                      <td className="px-5 py-3">
                        {row.ended_at ? (
                          <Badge variant="outline" className="border-emerald-600/40 text-emerald-700">
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-600/40 text-amber-700">
                            In progress
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[#1A1A1A]/70 font-mono text-xs">
                        {row.conversation_id ? row.conversation_id.slice(0, 16) + "…" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Configuration note */}
        <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/40">
          <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">Configuration</h3>
          <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">
            The agent's prompt, voice, language, and tools are managed in the ElevenLabs Conversational AI dashboard.
            The conversation token is minted server-side by the <code className="bg-[#EFE6D6] px-1.5 py-0.5 rounded text-xs">elevenlabs-conversation-token</code> edge function
            and connects over WebRTC. Calls are logged here automatically.
          </p>
        </Card>
      </div>
    </div>
  );
}
