/**
 * EmailBodyEditor — lightweight contentEditable editor for the message
 * body of the e-signature send dialog. Produces clean HTML (sanitized
 * with DOMPurify) that flows directly into the email preview iframe and,
 * unchanged, into the actual outbound email. No markdown, no template
 * tokens shown to the owner.
 */
import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { Bold, Italic, Link2, List, ListOrdered, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  value: string;          // sanitized HTML
  onChange: (html: string) => void;
  placeholder?: string;
}

const SANITIZE = {
  ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br", "p", "div", "span", "a", "ul", "ol", "li", "blockquote", "h2", "h3"],
  ALLOWED_ATTR: ["href", "target", "rel", "style"],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|#|\/)/i,
};

export function EmailBodyEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Keep DOM in sync when the parent replaces the value (e.g. preset insert).
  // CRITICAL: skip while the editor is focused — assigning innerHTML during
  // typing wipes the caret and makes the field appear unresponsive.
  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;
    if (ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const emit = () => {
    if (!ref.current) return;
    const cleaned = DOMPurify.sanitize(ref.current.innerHTML, SANITIZE);
    onChange(cleaned);
  };

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const insertLink = () => {
    const url = window.prompt("Link URL (https://…)");
    if (!url) return;
    exec("createLink", url);
  };

  return (
    <div className="rounded-md border border-[#B89555]/40 bg-white overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#B89555]/30 bg-[#F7F2EA] px-2 py-1">
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => exec("bold")} title="Bold">
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => exec("italic")} title="Italic">
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={insertLink} title="Insert link">
          <Link2 className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => exec("insertUnorderedList")} title="Bulleted list">
          <List className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => exec("insertOrderedList")} title="Numbered list">
          <ListOrdered className="w-3.5 h-3.5" />
        </Button>
        <span className="mx-1 h-4 w-px bg-[#B89555]/40" />
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => exec("undo")} title="Undo">
          <Undo2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder}
        className="min-h-[180px] max-h-[320px] overflow-y-auto px-3 py-2.5 text-sm leading-relaxed text-[#1A1A1A] focus:outline-none [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-[#1A1A1A]/40"
      />
    </div>
  );
}
