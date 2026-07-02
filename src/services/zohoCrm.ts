/**
 * Client wrapper around the `zoho-crm-proxy` edge function.
 * All Zoho REST calls flow through the connector gateway server-side —
 * the access token is never exposed to the browser.
 *
 * UI is intentionally not built here; this exposes typed placeholders so
 * new module pages (starting with Leads) can wire live data with one call.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  ZohoModuleName,
  ZohoListResponse,
  ZohoLead,
  ZohoContact,
  ZohoAccount,
  ZohoDeal,
  ZohoTask,
} from "@/types/zohoCrm";
import { ZOHO_DEFAULT_FIELDS } from "@/types/zohoCrm";

type ZohoOp = "list" | "get" | "search" | "create" | "update" | "delete";

interface ZohoInvokeArgs {
  op: ZohoOp;
  module: ZohoModuleName;
  id?: string;
  fields?: string[];
  page?: number;
  per_page?: number;
  criteria?: string;
  data?: Record<string, unknown> | Record<string, unknown>[];
}

async function invoke<T>(args: ZohoInvokeArgs): Promise<T> {
  const { data, error } = await supabase.functions.invoke("zoho-crm-proxy", { body: args });
  if (error) throw new Error(error.message || "Zoho CRM proxy error");
  if (data && typeof data === "object" && "error" in (data as any)) {
    throw new Error(String((data as any).error));
  }
  return data as T;
}

export const zohoCrm = {
  list<T = unknown>(module: ZohoModuleName, opts: { fields?: string[]; page?: number; per_page?: number } = {}) {
    return invoke<ZohoListResponse<T>>({
      op: "list",
      module,
      fields: opts.fields ?? ZOHO_DEFAULT_FIELDS[module],
      page: opts.page ?? 1,
      per_page: opts.per_page ?? 50,
    });
  },
  get<T = unknown>(module: ZohoModuleName, id: string) {
    return invoke<ZohoListResponse<T>>({ op: "get", module, id });
  },
  search<T = unknown>(module: ZohoModuleName, criteria: string, fields?: string[]) {
    return invoke<ZohoListResponse<T>>({
      op: "search",
      module,
      criteria,
      fields: fields ?? ZOHO_DEFAULT_FIELDS[module],
    });
  },
  create(module: ZohoModuleName, data: Record<string, unknown> | Record<string, unknown>[]) {
    return invoke<{ data: Array<{ code: string; details?: { id: string }; message: string; status: string }> }>(
      { op: "create", module, data },
    );
  },
  update(module: ZohoModuleName, data: Record<string, unknown> | Record<string, unknown>[]) {
    return invoke<{ data: Array<{ code: string; details?: { id: string }; message: string; status: string }> }>(
      { op: "update", module, data },
    );
  },
  remove(module: ZohoModuleName, id: string) {
    return invoke<{ data: Array<{ code: string; message: string; status: string }> }>({
      op: "delete",
      module,
      id,
    });
  },

  // Typed conveniences per module — placeholders for future UI wiring.
  leads: {
    list: (opts?: { page?: number; per_page?: number }) => zohoCrm.list<ZohoLead>("Leads", opts),
    get: (id: string) => zohoCrm.get<ZohoLead>("Leads", id),
    search: (criteria: string) => zohoCrm.search<ZohoLead>("Leads", criteria),
  },
  contacts: {
    list: (opts?: { page?: number; per_page?: number }) => zohoCrm.list<ZohoContact>("Contacts", opts),
    get: (id: string) => zohoCrm.get<ZohoContact>("Contacts", id),
  },
  accounts: {
    list: (opts?: { page?: number; per_page?: number }) => zohoCrm.list<ZohoAccount>("Accounts", opts),
    get: (id: string) => zohoCrm.get<ZohoAccount>("Accounts", id),
  },
  deals: {
    list: (opts?: { page?: number; per_page?: number }) => zohoCrm.list<ZohoDeal>("Deals", opts),
    get: (id: string) => zohoCrm.get<ZohoDeal>("Deals", id),
  },
  tasks: {
    list: (opts?: { page?: number; per_page?: number }) => zohoCrm.list<ZohoTask>("Tasks", opts),
    get: (id: string) => zohoCrm.get<ZohoTask>("Tasks", id),
  },
};

export type ZohoCrmClient = typeof zohoCrm;
