/**
 * usePushInventoryToSecondaryMarket — reusable hook the Brokerage / Developer /
 * Broker entity drawers can call to bulk-insert listings into `resale_listings`
 * tagged with the source CRM entity. Phase 3 of the Relationships Hub upgrade.
 *
 * Each row inserted carries `source_entity_type` + `source_entity_id` so the
 * Secondary Market Hub can attribute the listing back to the partner that
 * uploaded it (no parallel inventory table — one source of truth).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type InventorySourceType = "developer" | "brokerage" | "broker" | "direct";

export interface InventoryRow {
  title: string;
  location?: string;
  area_name?: string;
  emirate?: string;
  property_type?: string;
  bedrooms?: number;
  size_sqft?: number;
  asking_price?: number;
  currency?: string;
  developer_name?: string;
  project_name?: string;
  handover_status?: string;
  description?: string;
  images?: string[];
}

export interface PushInventoryArgs {
  source_entity_type: InventorySourceType;
  source_entity_id: string;
  source_entity_name: string;
  imported_from?: string;
  source_file_url?: string;
  rows: InventoryRow[];
}

export function usePushInventoryToSecondaryMarket() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: PushInventoryArgs) => {
      if (!args.rows.length) throw new Error("No rows to import.");

      // Generate a single batch id so all rows from this upload can be
      // traced/rolled-back together.
      const batchId = (globalThis.crypto as Crypto).randomUUID();

      const payload = args.rows.map((r) => ({
        ...r,
        source_entity_type: args.source_entity_type,
        source_entity_id: args.source_entity_id,
        source_entity_name: args.source_entity_name,
        imported_from: args.imported_from ?? "entity_drawer_bulk_upload",
        import_batch_id: batchId,
        source_file_url: args.source_file_url ?? null,
        status: "active",
        currency: r.currency ?? "AED",
      }));

      const { data, error } = await supabase
        .from("resale_listings")
        .insert(payload)
        .select("id");

      if (error) throw error;
      return { inserted: data?.length ?? 0, batchId };
    },
    onSuccess: (res, vars) => {
      toast.success(
        `${res.inserted} listing${res.inserted === 1 ? "" : "s"} pushed to Secondary Market`,
        { description: `From ${vars.source_entity_name} · batch ${res.batchId.slice(0, 8)}` },
      );
      qc.invalidateQueries({ queryKey: ["secondary-market-listings"] });
      qc.invalidateQueries({ queryKey: ["secondary-market-brokerages"] });
      qc.invalidateQueries({ queryKey: ["secondary-market-developers"] });
    },
    onError: (e: Error) => {
      toast.error("Inventory push failed", { description: e.message });
    },
  });
}
