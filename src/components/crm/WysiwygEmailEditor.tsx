/**
 * WysiwygEmailEditor — rendered, click-to-edit email body.
 *
 * Renders the FULL preview HTML (logos, gold buttons, calendar SVG, mini-calendar
 * tile) inside a contentEditable iframe so the operator can click any sentence
 * and just retype. On every change we serialize the iframe body, then walk the
 * DOM and substitute the live sample strings BACK into their {{token}} form
 * before bubbling the new HTML up to the dialog state.
 *
 * Tokens that appear only as attribute values (e.g. href="{{project_url}}") or
 * that the user never typed over are preserved verbatim because we tokenize
 * against a longest-first map of {sample → token}.
 */
import { useEffect, useRef } from "react";

export type TokenMap = Record<string, string>; // token -> sample value

interface Props {
  /** Full HTML with {{tokens}} unsubstituted (source of truth). */
  html: string;
  /** Mapping of token -> sample string used for rendering. */
  tokenSamples: TokenMap;
  /** Called with the new HTML (re-tokenized) whenever the user edits. */
  onChange: (nextTokenizedHtml: string) => void;
  disabled?: boolean;
}

function substituteTokens(html: string, samples: TokenMap): string {
  let out = html;
  for (const [tok, val] of Object.entries(samples)) {
    out = out.split(`{{${tok}}}`).join(val ?? "");
  }
  // Strip handlebars conditionals — keep inner content if sample is non-empty.
  out = out.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_m, k, inner) => {
    return samples[k] && samples[k].trim() ? inner : "";
  });
  return out;
}

function retokenize(html: string, samples: TokenMap): string {
  // Replace longest sample values first to avoid partial collisions.
  const entries = Object.entries(samples)
    .filter(([, v]) => v && v.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);
  let out = html;
  for (const [tok, val] of entries) {
    if (!val) continue;
    // Escape regex special chars in val
    const safe = val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(safe, "g"), `{{${tok}}}`);
  }
  return out;
}

export function WysiwygEmailEditor({ html, tokenSamples, onChange, disabled }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastIncomingHtml = useRef(html);
  const debounceRef = useRef<number | null>(null);

  // Inject HTML when the source-of-truth changes (variant switch / external set)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    if (lastIncomingHtml.current === html && iframe.contentDocument?.body?.innerHTML) {
      // Already in sync — don't blow away cursor.
      return;
    }
    lastIncomingHtml.current = html;
    const doc = iframe.contentDocument;
    if (!doc) return;
    const rendered = substituteTokens(html, tokenSamples);
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><base target="_blank" /></head><body style="margin:0;padding:0">${rendered}</body></html>`);
    doc.close();
    doc.body.contentEditable = disabled ? "false" : "true";
    doc.body.style.outline = "none";
    doc.body.style.minHeight = "100%";
    // Disable link navigation while editing (clicks should land caret, not navigate)
    doc.addEventListener("click", (e) => {
      const t = e.target as HTMLElement;
      if (t.closest("a")) e.preventDefault();
    });
    doc.addEventListener("input", () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        const body = doc.body;
        if (!body) return;
        // Reconstruct whole HTML preserving <head> from source (style block)
        const headMatch = lastIncomingHtml.current.match(/<head[\s\S]*?<\/head>/i);
        const head = headMatch ? headMatch[0] : "";
        const newBody = body.innerHTML;
        const retoked = retokenize(newBody, tokenSamples);
        const next = `<!DOCTYPE html><html>${head}<body style="margin:0;padding:0;background:#FDFBF7;font-family:Inter,-apple-system,Segoe UI,Arial,sans-serif;color:#1A1A1A;line-height:1.6">${retoked}</body></html>`;
        lastIncomingHtml.current = next;
        onChange(next);
      }, 350);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, JSON.stringify(tokenSamples), disabled]);

  return (
    <div className="border border-[#1A1A1A]/10 rounded-lg overflow-hidden bg-[#FDFBF7]">
      <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-[#1A1A1A]/70 border-b border-[#1A1A1A]/10 bg-[#F7F2EA]">
        Click any text to edit · Links are inactive while editing
      </div>
      <iframe
        ref={iframeRef}
        title="WYSIWYG email editor"
        className="w-full bg-[#FDFBF7]"
        style={{ minHeight: 600, border: 0 }}
      />
    </div>
  );
}
