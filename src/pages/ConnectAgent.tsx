import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Check, Copy, ExternalLink } from "lucide-react";

const APP_NAME = "JBJ Global Real Estate";
const SERVER_SLUG = "jbj-global-real-estate";

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex shrink-0 items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
      aria-label={`${label} to clipboard`}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {n}
      </span>
      <span className="text-sm leading-relaxed text-muted-foreground">{children}</span>
    </li>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

const linkClass = "inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4";

export default function ConnectAgent() {
  const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
  const mcpUrl = `https://${projectRef}.supabase.co/functions/v1/mcp`;

  const claudeUrl = useMemo(
    () =>
      `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=${encodeURIComponent(
        APP_NAME,
      )}&connectorUrl=${encodeURIComponent(mcpUrl)}`,
    [mcpUrl],
  );
  const claudeCodeCmd = `claude mcp add --scope user --transport http ${SERVER_SLUG} '${mcpUrl.replace(/'/g, "'\\''")}'`;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
      <Helmet>
        <title>Connect an AI Assistant | JBJ Global Real Estate</title>
        <meta
          name="description"
          content="Step-by-step instructions to connect ChatGPT, Claude, Claude Code, or any MCP client to JBJ Global Real Estate."
        />
      </Helmet>

      <header className="mb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Agent integrations</p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Connect an AI assistant</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Link ChatGPT, Claude, or another AI assistant to {APP_NAME} so it can search projects, developers, and market
          information on your behalf. Copy the server address below, then follow the steps for your assistant.
        </p>
      </header>

      <section className="mb-10 rounded-xl border border-primary/25 bg-primary/5 p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">Server address</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 break-all rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground">
            {mcpUrl}
          </code>
          <CopyButton value={mcpUrl} />
        </div>
      </section>

      <h2 className="mb-4 text-xl font-semibold text-foreground">Connect</h2>
      <div className="space-y-6">
        <Card title="ChatGPT">
          <ol className="space-y-3">
            <Step n={1}>
              Open{" "}
              <a className={linkClass} href="https://chatgpt.com/#settings/Connectors/Advanced" target="_blank" rel="noreferrer">
                ChatGPT settings → Apps <ExternalLink className="h-3 w-3" />
              </a>{" "}
              and turn on Developer mode (read the risk notice shown there). If it isn’t available, ask a ChatGPT admin to
              enable it.
            </Step>
            <Step n={2}>
              Open the{" "}
              <a
                className={linkClass}
                href="https://chatgpt.com/plugins#settings/Connectors?create-connector=true&redirectAfter=%2Fplugins"
                target="_blank"
                rel="noreferrer"
              >
                new plugin dialog <ExternalLink className="h-3 w-3" />
              </a>
              .
            </Step>
            <Step n={3}>
              Enter <strong className="text-foreground">{APP_NAME}</strong> as the name and paste the server address above
              into the URL field.
            </Step>
            <Step n={4}>
              Review the details, tick “I understand and want to continue” (ChatGPT shows this for every custom server),
              then click <strong className="text-foreground">Create</strong>.
            </Step>
            <Step n={5}>Enable the app from the chat composer, then ask ChatGPT to use it.</Step>
          </ol>
        </Card>

        <Card title="Claude">
          <ol className="space-y-3">
            <Step n={1}>
              Open the{" "}
              <a className={linkClass} href={claudeUrl} target="_blank" rel="noreferrer">
                prefilled Claude connector dialog <ExternalLink className="h-3 w-3" />
              </a>
              .
            </Step>
            <Step n={2}>
              Review the details and click <strong className="text-foreground">Add</strong>.
            </Step>
            <Step n={3}>
              If the prefilled form doesn’t open, go to Claude’s Connectors page, choose “Add custom connector”, name it{" "}
              {APP_NAME}, and paste the server address.
            </Step>
            <Step n={4}>Enable the connector from the chat composer, then ask Claude to use it.</Step>
          </ol>
        </Card>

        <Card title="Claude Code">
          <ol className="space-y-3">
            <Step n={1}>Run this command in a terminal:</Step>
          </ol>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 break-all rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs text-foreground">
              {claudeCodeCmd}
            </code>
            <CopyButton value={claudeCodeCmd} label="Copy command" />
          </div>
          <ol className="mt-4 space-y-3">
            <Step n={2}>
              Start Claude Code and run <code className="font-mono text-foreground">/mcp</code> to confirm the connection.
              You’ll be asked to sign in from that menu when a tool needs your account.
            </Step>
            <Step n={3}>Ask Claude Code to use the app.</Step>
          </ol>
        </Card>

        <Card title="Other MCP clients">
          <ol className="space-y-3">
            <Step n={1}>Open the assistant’s MCP server or custom connector settings.</Step>
            <Step n={2}>Create a new remote MCP server connection.</Step>
            <Step n={3}>Name it {APP_NAME} and paste the server address above.</Step>
            <Step n={4}>Complete any sign-in or authorization prompts.</Step>
            <Step n={5}>Enable the connection, then ask the assistant to use it.</Step>
          </ol>
        </Card>
      </div>

      <h2 className="mb-4 mt-12 text-xl font-semibold text-foreground">Refresh after the app changes</h2>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        Assistants remember what the app could do when they first connected. After we ship an update, refresh the
        connection so your assistant picks up the latest capabilities.
      </p>
      <div className="space-y-6">
        <Card title="ChatGPT">
          <ol className="space-y-3">
            <Step n={1}>Open ChatGPT’s Plugins page and select this app.</Step>
            <Step n={2}>Scroll to “Information” and click Refresh.</Step>
            <Step n={3}>
              ChatGPT can’t change an existing app’s URL — if the address above changed, delete the app and repeat the
              connect steps.
            </Step>
            <Step n={4}>Start a new chat and ask ChatGPT to use the app.</Step>
          </ol>
        </Card>
        <Card title="Claude">
          <ol className="space-y-3">
            <Step n={1}>Open the Connectors page and select this connector.</Step>
            <Step n={2}>Refresh or update the connector’s tools.</Step>
            <Step n={3}>
              Claude can’t change an existing connector’s URL — if the address changed, remove the connector and connect
              again.
            </Step>
            <Step n={4}>Ask Claude to use the app.</Step>
          </ol>
        </Card>
        <Card title="Claude Code">
          <ol className="space-y-3">
            <Step n={1}>Start a new Claude Code session — it loads the latest capabilities on connect.</Step>
            <Step n={2}>
              If the address changed, run{" "}
              <code className="font-mono text-foreground">claude mcp remove {SERVER_SLUG}</code> and run the install
              command again.
            </Step>
            <Step n={3}>Ask Claude Code to use the app.</Step>
          </ol>
        </Card>
        <Card title="Other MCP clients">
          <ol className="space-y-3">
            <Step n={1}>Open the assistant’s MCP server or connector settings.</Step>
            <Step n={2}>Select the connection you created for this app.</Step>
            <Step n={3}>Refresh the tool list, reload the server, or reconnect it.</Step>
            <Step n={4}>If the address changed, paste the latest one from above.</Step>
            <Step n={5}>Start a new chat or session and ask the assistant to use the app.</Step>
          </ol>
        </Card>
      </div>
    </main>
  );
}
