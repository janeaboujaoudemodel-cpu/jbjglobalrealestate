/**
 * OwnerCardEditMenu — tiny pencil affordance shown on listing/project cards
 * (and any developer/area card) so the owner can edit sale-status visibility
 * and the sale-status label inline without leaving the page.
 *
 * Renders nothing for non-owners and while previewing-as-visitor.
 */
import { useState } from "react";
import { Pencil, Loader2, ExternalLink } from "lucide-react";
import { useEffectiveOwner } from "@/hooks/useEffectiveOwner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";

interface OwnerCardEditMenuProps {
  projectId: string;
  slug?: string | null;
  saleStatus?: string | null;
  showSaleStatus?: boolean | null;
  className?: string;
}

const SALE_OPTIONS = [
  { value: "__none__", label: "— None —" },
  { value: "On Sale", label: "On Sale" },
  { value: "Announced", label: "Announced" },
  { value: "Presale", label: "Presale" },
  { value: "Sold Out", label: "Sold Out" },
];

export default function OwnerCardEditMenu({
  projectId,
  slug,
  saleStatus,
  showSaleStatus,
  className,
}: OwnerCardEditMenuProps) {
  const { effectiveOwner } = useEffectiveOwner();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>(saleStatus ?? "__none__");
  const [show, setShow] = useState<boolean>(!!showSaleStatus);

  if (!effectiveOwner) return null;

  const save = async () => {
    setBusy(true);
    try {
      const patch: Record<string, unknown> = {
        show_sale_status: show,
        status_label: status === "__none__" ? null : status,
      };
      const { error } = await (supabase as any)
        .from("projects")
        .update(patch)
        .eq("id", projectId);
      if (error) throw error;
      toast.success("Card updated");
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["handpicked-projects"] });
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Edit listing"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          data-no-contrast-guard
          className={
            "inline-flex items-center justify-center w-7 h-7 rounded-full " +
            "bg-[#FDFBF7] border border-[#B89555] text-[#1A1A1A] " +
            "shadow-[0_6px_14px_rgba(0,0,0,0.18)] hover:bg-[#EFE6D6] transition-colors " +
            (className || "")
          }
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-72 p-4 bg-[#FDFBF7] border-[#B89555]/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]">
            Owner · Card controls
          </div>

          <div className="flex items-center justify-between gap-3">
            <label htmlFor="show-sale" className="text-sm text-[#1A1A1A]">
              Show sale-status badge
            </label>
            <Switch
              id="show-sale"
              checked={show}
              onCheckedChange={setShow}
              disabled={busy}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-[#1A1A1A]">Sale status</label>
            <Select value={status} onValueChange={setStatus} disabled={busy}>
              <SelectTrigger className="bg-white border-[#B89555]/50 text-[#1A1A1A]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SALE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {slug && (
              <Link
                to={`/owner/projects/${slug}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#B89555] hover:text-[#8E6E36]"
              >
                <ExternalLink className="w-3 h-3" /> Full editor
              </Link>
            )}
            <button
              type="button"
              onClick={save}
              disabled={busy}
              data-no-contrast-guard
              className="ml-auto inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#000] disabled:opacity-60"
            >
              {busy && <Loader2 className="w-3 h-3 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
