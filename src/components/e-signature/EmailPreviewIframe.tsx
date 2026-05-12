/**
 * EmailPreviewIframe — sandboxed iframe that re-renders the full branded
 * envelope email HTML on every change. Same renderer used by the edge
 * function, so what you see is byte-for-byte what the recipient gets.
 */
import { useMemo } from "react";
import { buildEnvelopeEmailHtml } from "@/lib/email/buildEnvelopeEmailHtml";

interface Props {
  subject: string;
  bodyHtml: string;
  docNumber?: string;
  docusignUrl?: string;
  attachmentName?: string;
  className?: string;
}

export function EmailPreviewIframe({ subject, bodyHtml, docNumber, docusignUrl, attachmentName, className }: Props) {
  const srcDoc = useMemo(
    () => buildEnvelopeEmailHtml({ subject, bodyHtml, docNumber, docusignUrl, attachmentName }),
    [subject, bodyHtml, docNumber, docusignUrl, attachmentName],
  );

  return (
    <iframe
      title="Email preview"
      srcDoc={srcDoc}
      sandbox="allow-same-origin"
      className={className ?? "w-full h-full bg-[#FDFBF7] rounded-md border border-[#B89555]/40"}
    />
  );
}
