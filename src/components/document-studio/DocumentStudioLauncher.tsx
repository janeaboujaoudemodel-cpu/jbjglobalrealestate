/**
 * DocumentStudioLauncher
 * ----------------------
 * Compact champagne card embedded into hubs that surfaces the unified
 * generator. Catalog "all" merges staff + client templates into a single
 * Document Studio (the standard going forward); "staff" / "client" remain
 * supported for backwards-compatible hub embeds.
 */

import { Wand2, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import DocumentStudio from "./DocumentStudio";
import { DocumentScope, getCatalogByAudience } from "@/config/documentCatalog";

interface Props {
  catalog: DocumentScope;
  /** Optional preset template ID (used when a hub card opens the studio). */
  presetTemplateId?: string;
  /** Override the card title/subtitle for the hosting context. */
  title?: string;
  subtitle?: string;
}

export default function DocumentStudioLauncher({
  catalog,
  presetTemplateId,
  title,
  subtitle,
}: Props) {
  const templates = getCatalogByAudience(catalog);

  const eyebrow =
    catalog === "staff"
      ? "Careers · Document Studio"
      : catalog === "client"
        ? "Client · Document Studio"
        : "Document Studio";

  const defaultTitle =
    catalog === "staff"
      ? "Generate a staff document with AI"
      : catalog === "client"
        ? "Generate a client document with AI"
        : "Generate a document with AI";

  const defaultSubtitle =
    catalog === "staff"
      ? "Job offers, employment contracts, NDAs, warning letters, partnership agreements — one unified engine, locked premium letterhead, live AI editing, branded-email send."
      : catalog === "client"
        ? "Form A, Form F (MoU), Form I, PAA, tenancy addenda — same engine, same locked premium letterhead, same branded-email send."
        : "Every JBJ template — staff (offers, contracts, NDAs, partnerships) and client (Form A/B/F/I/U, MoU, PAA, tenancy, holiday-home) — in one unified engine with locked premium letterhead, live AI editing and branded-email send.";

  return (
    <div
      className="relative rounded-2xl border border-[#B89555]/30 bg-gradient-to-br from-[#F7F2EA] via-[#F0E7D4] to-[#E6D8BC] p-5 md:p-6 mb-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/70">
              {eyebrow}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#1A1A1A]/60 ml-1">
              <Lock className="w-3 h-3" /> Locked letterhead
            </span>
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-[#1A1A1A]">
            {title || defaultTitle}
          </h3>
          <p className="text-sm text-[#1A1A1A]/75 mt-1">
            {subtitle || defaultSubtitle}
          </p>
          <p className="text-[11px] text-[#1A1A1A]/60 mt-2">
            {templates.length} template{templates.length === 1 ? "" : "s"} available · branded email + test-send wired
          </p>
        </div>
        <div className="shrink-0">
          <DocumentStudio
            catalog={catalog}
            presetTemplateId={presetTemplateId}
            trigger={
              <Button size="lg" className="shadow-sm">
                <Wand2 className="w-4 h-4 mr-2" /> Generate Document
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
