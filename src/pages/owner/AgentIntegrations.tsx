import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Check, ExternalLink, Plug, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import manifest from "../../../.lovable/mcp/manifest.json";

const PROJECT_REF =
  (import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined) ??
  "mdafrewypkkrildjgtey";

// Prefer the app's public custom domain if the site is served under one, so
// integrators paste a JBJ-branded URL rather than the raw functions host.
const MCP_URL = `https://${PROJECT_REF}.supabase.co${manifest.path}`;

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="rounded-xl border border-[#B89555]/40 bg-[#FDFBF7] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#B89555]/25">
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1A1A1A]/70">
          {label}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={copy}
          className="h-7 px-2 text-xs"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 mr-1" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" /> Copy
            </>
          )}
        </Button>
      </div>
      <pre className="text-xs text-[#1A1A1A] p-3 overflow-auto whitespace-pre-wrap break-all font-mono">
        {value}
      </pre>
    </div>
  );
}

export default function AgentIntegrations() {
  const claudeConfig = useMemo(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            "jbj-global": {
              url: MCP_URL,
            },
          },
        },
        null,
        2,
      ),
    [],
  );

  const cursorConfig = useMemo(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            "jbj-global": {
              url: MCP_URL,
            },
          },
        },
        null,
        2,
      ),
    [],
  );

  const tools = (manifest as any).mcp?.tools ?? [];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Hero */}
      <Card className="overflow-hidden border border-[#B89555]/35 rounded-2xl">
        <div className="bg-[image:var(--jj-emerald-ombre)] px-6 py-8 border-b border-[#B89555]/45">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Plug className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#EFE6D6] font-black">
                Agent Integrations
              </p>
              <h1 className="mt-1 text-3xl md:text-4xl font-black text-white tracking-tight">
                JBJ MCP Server
              </h1>
              <p className="mt-2 text-sm text-white/85 max-w-2xl">
                Plug JBJ Global Real Estate into any Model Context Protocol client
                — Claude, ChatGPT, Cursor, Lovable, or your own agent — with one
                URL. External agents can search projects, fetch project detail,
                and browse the developer directory on your behalf, secured by
                Lovable Cloud OAuth.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/50 text-[10px] font-black uppercase tracking-wide">
                  <ShieldCheck className="w-3 h-3 mr-1" /> OAuth-secured
                </Badge>
                <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/50 text-[10px] font-black uppercase tracking-wide">
                  <Sparkles className="w-3 h-3 mr-1" /> {tools.length} tools live
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Endpoint */}
      <Card className="border border-[#B89555]/30 bg-[#F7F2EA]">
        <CardHeader>
          <CardTitle className="text-base text-[#1A1A1A]">
            Server endpoint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CopyBlock label="MCP URL" value={MCP_URL} />
          <p className="text-xs text-[#1A1A1A]/70">
            First connection triggers a browser sign-in against Lovable Cloud.
            The agent stores the returned OAuth token and re-uses it for every
            subsequent tool call — no long-lived API key to rotate.
          </p>
        </CardContent>
      </Card>

      {/* Client configs */}
      <Card className="border border-[#B89555]/30 bg-[#F7F2EA]">
        <CardHeader>
          <CardTitle className="text-base text-[#1A1A1A]">
            Client configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="claude">
            <TabsList className="bg-[#FDFBF7] border border-[#B89555]/30">
              <TabsTrigger value="claude">Claude Desktop</TabsTrigger>
              <TabsTrigger value="cursor">Cursor</TabsTrigger>
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="claude" className="space-y-3 pt-3">
              <p className="text-sm text-[#1A1A1A]/80">
                Add this to <code className="bg-[#EFE6D6] px-1.5 py-0.5 rounded text-[11px]">~/Library/Application Support/Claude/claude_desktop_config.json</code>{" "}
                (macOS) or <code className="bg-[#EFE6D6] px-1.5 py-0.5 rounded text-[11px]">%APPDATA%\Claude\claude_desktop_config.json</code>{" "}
                (Windows), then restart Claude.
              </p>
              <CopyBlock label="claude_desktop_config.json" value={claudeConfig} />
            </TabsContent>

            <TabsContent value="cursor" className="space-y-3 pt-3">
              <p className="text-sm text-[#1A1A1A]/80">
                Open Cursor settings → <span className="font-semibold">MCP</span> →
                <span className="font-semibold"> Add new global MCP server</span> and paste:
              </p>
              <CopyBlock label="MCP config" value={cursorConfig} />
            </TabsContent>

            <TabsContent value="raw" className="pt-3">
              <CopyBlock
                label="mcp.json"
                value={JSON.stringify(
                  { mcpServers: { "jbj-global": { url: MCP_URL } } },
                  null,
                  2,
                )}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Tools */}
      <Card className="border border-[#B89555]/30 bg-[#F7F2EA]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base text-[#1A1A1A]">
            Exposed tools ({tools.length})
          </CardTitle>
          <a
            href="https://modelcontextprotocol.io/introduction"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A] inline-flex items-center gap-1 underline"
          >
            MCP docs <ExternalLink className="w-3 h-3" />
          </a>
        </CardHeader>
        <CardContent className="space-y-3">
          {tools.map((t: any) => (
            <div
              key={t.name}
              className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-[#1A1A1A]">
                      {t.title || t.name}
                    </h3>
                    <code className="text-[11px] font-mono bg-[#EFE6D6] text-[#1A1A1A]/80 px-1.5 py-0.5 rounded">
                      {t.name}
                    </code>
                    {t.annotations?.readOnlyHint && (
                      <Badge className="bg-emerald-50 text-emerald-900 border border-emerald-200 text-[9px] font-black uppercase tracking-wider">
                        read-only
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#1A1A1A]/80 mt-1.5 leading-relaxed">
                    {t.description}
                  </p>
                  {t.inputSchema?.properties && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.keys(t.inputSchema.properties).map((p: string) => (
                        <span
                          key={p}
                          className="text-[10px] font-mono bg-white text-[#1A1A1A]/70 px-1.5 py-0.5 rounded border border-[#B89555]/30"
                        >
                          {p}
                          {t.inputSchema.required?.includes(p) ? "*" : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-[#1A1A1A]/60 text-center">
        Add new tools by dropping a file in{" "}
        <code>src/lib/mcp/tools/</code> and registering it in{" "}
        <code>src/lib/mcp/index.ts</code> — the MCP edge function and this
        page pick them up automatically on rebuild.
      </p>
    </div>
  );
}
