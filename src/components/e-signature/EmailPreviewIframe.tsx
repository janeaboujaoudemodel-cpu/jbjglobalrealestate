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
  attachmentUrl?: string;
  className?: string;
}

export function EmailPreviewIframe({ subject, bodyHtml, docNumber, docusignUrl, attachmentName, attachmentUrl, className }: Props) {
  const srcDoc = useMemo(
    () => buildEnvelopeEmailHtml({ subject, bodyHtml, docNumber, docusignUrl, attachmentName, attachmentUrl }),
    [subject, bodyHtml, docNumber, docusignUrl, attachmentName, attachmentUrl],
  );

  return (
    <iframe
      title="Email preview"
      srcDoc={srcDoc}
      // allow-popups + allow-popups-to-escape-sandbox so the OPEN IN DOCUSIGN
      // button + attachment link actually open in a new tab while previewing.
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      className={className ?? "w-full h-full bg-[#FDFBF7] rounded-md border border-[#B89555]/40"}
    />
  );
}
