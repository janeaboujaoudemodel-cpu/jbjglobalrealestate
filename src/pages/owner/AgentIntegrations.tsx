import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Copy,
  Check,
  ExternalLink,
  Plug,
  ShieldCheck,
  Sparkles,
  Server,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import manifest from "../../../.lovable/mcp/manifest.json";

const PROJECT_REF =
  (import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined) ??
  "mdafrewypkkrildjgtey";

const MCP_URL = `https://${PROJECT_REF}.supabase.co${manifest.path}`;

const CONFIG = { mcpServers: { "jbj-global-real-estate": { url: MCP_URL } } };

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Clipboard unavailable — select the text and copy manually");
    }
  };
  return (
    <div className="rounded-xl border border-[#064E3B]/15 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[#064E3B]/12 bg-[#F6FAF8]">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#064E3B]">
          {label}
        </span>
        <Button
          size="sm"
          type="button"
          onClick={copy}
          className="owner-hub-pill h-8 !px-3 !py-0 text-xs"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy
            </>
          )}
        </Button>
      </div>
      <pre className="text-xs text-[#0F1A16] p-4 overflow-auto whitespace-pre-wrap break-all font-mono leading-relaxed">
        {value}
      </pre>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border border-[#064E3B]/12 bg-white rounded-2xl shadow-[0_1px_2px_rgba(6,78,59,0.05)]">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3 border-b border-[#064E3B]/10">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-[#0F1A16]">
          <span
            data-surface="emerald"
            className="w-8 h-8 rounded-lg bg-[image:var(--jj-emerald-ombre)] flex items-center justify-center shrink-0"
          >
            {icon}
          </span>
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

export default function AgentIntegrations() {
  const configJson = useMemo(() => JSON.stringify(CONFIG, null, 2), []);
  const tools = ((manifest as any).mcp?.tools ?? []) as any[];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      {/* Hero — emerald pair gradient, every glyph inside is pure white. */}
      <div
        data-surface="emerald"
        data-jbj-hero="emerald"
        className="rounded-2xl overflow-hidden bg-[image:var(--jj-emerald-ombre)] px-7 py-8"
      >
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-white/12 border border-white/25 flex items-center justify-center shrink-0">
            <Plug className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] font-bold opacity-80">
              Agent Integrations
            </p>
            <h1
              className="mt-1.5 text-3xl md:text-4xl font-normal tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              JBJ MCP Server
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed max-w-2xl opacity-90">
              Plug JBJ Global Real Estate into any Model Context Protocol client
              — Claude, ChatGPT, Cursor, Lovable, or your own agent — with one
              URL. External agents can search projects, fetch project detail and
              browse the developer directory on your behalf, secured by OAuth.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]">
                <ShieldCheck className="w-3.5 h-3.5" /> OAuth-secured
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]">
                <Sparkles className="w-3.5 h-3.5" /> {tools.length} tools live
              </span>
            </div>
          </div>
        </div>
      </div>

      <SectionCard icon={<Server className="w-4 h-4" />} title="Server endpoint">
        <div className="space-y-3">
          <CopyBlock label="MCP URL" value={MCP_URL} />
          <p className="text-xs text-[#4B5D55] leading-relaxed">
            First connection triggers a browser sign-in. The agent stores the
            returned OAuth token and re-uses it for every subsequent tool call —
            no long-lived API key to rotate.
          </p>
        </div>
      </SectionCard>

      <SectionCard icon={<Wrench className="w-4 h-4" />} title="Client configuration">
        <Tabs defaultValue="claude">
          <TabsList className="owner-hub-pills bg-transparent border-0 p-0 h-auto mb-4">
            <TabsTrigger value="claude" className="owner-hub-pill">
              Claude Desktop
            </TabsTrigger>
            <TabsTrigger value="cursor" className="owner-hub-pill">
              Cursor
            </TabsTrigger>
            <TabsTrigger value="raw" className="owner-hub-pill">
              Raw JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="claude" className="space-y-3 mt-0">
            <p className="text-sm text-[#4B5D55] leading-relaxed">
              Add this to{" "}
              <code className="rounded bg-[#F6FAF8] border border-[#064E3B]/12 px-1.5 py-0.5 text-[11px] text-[#064E3B]">
                ~/Library/Application Support/Claude/claude_desktop_config.json
              </code>{" "}
              (macOS) or{" "}
              <code className="rounded bg-[#F6FAF8] border border-[#064E3B]/12 px-1.5 py-0.5 text-[11px] text-[#064E3B]">
                %APPDATA%\Claude\claude_desktop_config.json
              </code>{" "}
              (Windows), then restart Claude.
            </p>
            <CopyBlock label="claude_desktop_config.json" value={configJson} />
          </TabsContent>

          <TabsContent value="cursor" className="space-y-3 mt-0">
            <p className="text-sm text-[#4B5D55] leading-relaxed">
              Open Cursor settings → <strong className="text-[#0F1A16]">MCP</strong> →{" "}
              <strong className="text-[#0F1A16]">Add new global MCP server</strong>{" "}
              and paste:
            </p>
            <CopyBlock label="MCP config" value={configJson} />
          </TabsContent>

          <TabsContent value="raw" className="mt-0">
            <CopyBlock label="mcp.json" value={configJson} />
          </TabsContent>
        </Tabs>
      </SectionCard>

      <SectionCard
        icon={<Sparkles className="w-4 h-4" />}
        title={`Exposed tools (${tools.length})`}
        action={
          <a
            href="https://modelcontextprotocol.io/introduction"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#064E3B] hover:underline inline-flex items-center gap-1"
          >
            MCP docs <ExternalLink className="w-3 h-3" />
          </a>
        }
      >
        <div className="space-y-3">
          {tools.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-[#064E3B]/12 bg-[#F6FAF8] p-4"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-[#0F1A16]">
                  {t.title || t.name}
                </h3>
                <code className="text-[11px] font-mono bg-white border border-[#064E3B]/12 text-[#064E3B] px-1.5 py-0.5 rounded">
                  {t.name}
                </code>
                {t.annotations?.readOnlyHint && (
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] rounded-full border border-[#064E3B]/20 bg-white px-2 py-0.5 text-[#064E3B]">
                    read-only
                  </span>
                )}
              </div>
              <p className="text-xs text-[#4B5D55] mt-2 leading-relaxed">
                {t.description}
              </p>
              {t.inputSchema?.properties && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {Object.keys(t.inputSchema.properties).map((p) => (
                    <span
                      key={p}
                      className="text-[10px] font-mono bg-white text-[#4B5D55] px-1.5 py-0.5 rounded border border-[#064E3B]/12"
                    >
                      {p}
                      {t.inputSchema.required?.includes(p) ? "*" : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
