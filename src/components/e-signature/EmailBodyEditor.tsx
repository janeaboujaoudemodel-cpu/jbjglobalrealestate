/**
 * EmailBodyEditor — controlled plain-text editor (textarea) for the
 * message body of the e-signature send dialog. Plain text is converted
 * to safe HTML (paragraphs + <br/>) for the live email preview and the
 * outbound payload, so what the owner types is exactly what's delivered.
 *
 * Why textarea (not contentEditable):
 *   - contentEditable + React state caused caret jumps, double-deletes
 *     and "letters appearing in wrong place" because innerHTML was being
 *     re-assigned during typing. A controlled <textarea> behaves like any
 *     normal input — typing, deleting, selection all work as expected.
 */
import { useEffect, useMemo, useRef } from "react";
import DOMPurify from "dompurify";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  /** HTML representation of the current body (round-trips through plain text). */
  value: string;
  /** Receives sanitized HTML built from the textarea contents. */
  onChange: (html: string) => void;
  placeholder?: string;
}

const SANITIZE = {
  ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br", "p", "a"],
  ALLOWED_ATTR: ["href", "target", "rel"],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|#|\/)/i,
};

/** Decode HTML entities that might have been double-escaped by an upstream
 *  writer (e.g. saved body containing literal `&lt;p&gt;Dear&lt;/p&gt;`).
 *  Without this, htmlToText would leave them as visible `<p>` text and the
 *  next textToHtml pass would re-escape them, delivering raw tags to the
 *  recipient. We decode at most twice — anything beyond that is intentional. */
function decodeEntitiesIfNeeded(input: string): string {
  let s = String(input || "");
  for (let i = 0; i < 2; i++) {
    if (!/&(?:lt|gt|amp|quot|#39|nbsp);/i.test(s)) break;
    s = s
      .replace(/&nbsp;/gi, " ")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&amp;/gi, "&");
  }
  return s;
}

/** HTML → plain text. Treats </p> and <br> as line breaks; strips tags. */
function htmlToText(html: string): string {
  if (!html) return "";
  // Decode any encoded markup FIRST so we don't leave `<p>` as visible text.
  const decoded = decodeEntitiesIfNeeded(String(html).replace(/\r\n/g, "\n"));
  return decoded
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n\n")
    .replace(/<\s*p[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Plain text → safe HTML: paragraphs split on blank lines, <br/> inside. */
function textToHtml(text: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const paragraphs = String(text || "").replace(/\r\n/g, "\n").split(/\n{2,}/);
  const html = paragraphs
    .map((p) => `<p>${escape(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
  return DOMPurify.sanitize(html, SANITIZE);
}

export function EmailBodyEditor({ value, onChange, placeholder }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Mirror of the parent value as plain text. We only re-derive from `value`
  // when the textarea is NOT focused (preset insert, dialog hydration). While
  // focused, the textarea owns the truth — preventing caret jumps.
  const lastEmittedHtml = useRef<string>("");

  const derivedText = useMemo(() => htmlToText(value), [value]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (document.activeElement === el) return;
    // Avoid clobbering when the parent value is just our own echo.
    if (value === lastEmittedHtml.current) return;
    el.value = derivedText;
  }, [value, derivedText]);

  return (
    <Textarea
      ref={textareaRef}
      defaultValue={derivedText}
      onChange={(e) => {
        const html = textToHtml(e.target.value);
        lastEmittedHtml.current = html;
        onChange(html);
      }}
      placeholder={placeholder}
      rows={10}
      className="min-h-[220px] font-sans text-sm leading-relaxed"
    />
  );
}
