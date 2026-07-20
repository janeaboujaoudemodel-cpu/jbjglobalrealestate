import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type GlobalSearchHit = {
  id: string;
  module: string;
  moduleLabel: string;
  title: string;
  subtitle: string;
  to: string;
};

type Source = {
  table: string;
  moduleLabel: string;
  slug: string; // module route slug under /owner/crm/jbj/
  select: string;
  searchCols: string[];
  buildTo: (row: any) => string;
  buildTitle: (row: any) => string;
  buildSubtitle: (row: any) => string;
};

const SOURCES: Source[] = [
  {
    table: "crm_leads",
    moduleLabel: "Leads",
    slug: "leads",
    select: "id, full_name, company_name",
    searchCols: ["full_name", "company_name"],
    buildTo: (r) => `/owner/crm/jbj/leads/${r.id}`,
    buildTitle: (r) => r.full_name || "Unnamed lead",
    buildSubtitle: (r) => r.company_name || "Lead",
  },
  {
    table: "developers",
    moduleLabel: "Developers",
    slug: "accounts",
    select: "id, name, slug",
    searchCols: ["name", "slug"],
    buildTo: (r) => `/developer/${r.slug || r.id}`,
    buildTitle: (r) => r.name || "Developer",
    buildSubtitle: () => "Developer",
  },
  {
    table: "projects",
    moduleLabel: "Projects",
    slug: "deals",
    select: "id, name, slug, emirate",
    searchCols: ["name", "slug"],
    buildTo: (r) => `/project/${r.slug || r.id}`,
    buildTitle: (r) => r.name || "Project",
    buildSubtitle: (r) => r.emirate || "Project",
  },
  {
    table: "crm_brokers",
    moduleLabel: "Brokers",
    slug: "contacts",
    select: "id, full_name, city, emirate",
    searchCols: ["full_name", "city"],
    buildTo: (r) => `/owner/crm/jbj/contacts/${r.id}`,
    buildTitle: (r) => r.full_name || "Broker",
    buildSubtitle: (r) => [r.city, r.emirate].filter(Boolean).join(" · ") || "Broker",
  },
  {
    table: "crm_brokerages",
    moduleLabel: "Brokerages",
    slug: "accounts",
    select: "id, company_name, emirate, email",
    searchCols: ["company_name", "email"],
    buildTo: (r) => `/owner/crm/jbj/accounts/${r.id}`,
    buildTitle: (r) => r.company_name || "Brokerage",
    buildSubtitle: (r) => r.emirate || r.email || "Brokerage",
  },
  {
    table: "crm_relationship_contacts",
    moduleLabel: "Contacts",
    slug: "contacts",
    select: "id, full_name, email, phone",
    searchCols: ["full_name", "email", "phone"],
    buildTo: (r) => `/owner/crm/jbj/contacts/${r.id}`,
    buildTitle: (r) => r.full_name || "Contact",
    buildSubtitle: (r) => r.email || r.phone || "Contact",
  },
  {
    table: "areas",
    moduleLabel: "Areas",
    slug: "areas",
    select: "id, name, slug, emirate",
    searchCols: ["name", "slug"],
    buildTo: (r) => `/area/${r.slug || r.id}`,
    buildTitle: (r) => r.name || "Area",
    buildSubtitle: (r) => r.emirate || "Area",
  },
  {
    table: "communities",
    moduleLabel: "Communities",
    slug: "communities",
    select: "id, name, slug",
    searchCols: ["name", "slug"],
    buildTo: (r) => `/community/${r.slug || r.id}`,
    buildTitle: (r) => r.name || "Community",
    buildSubtitle: () => "Community",
  },
  {
    table: "crm_tasks",
    moduleLabel: "Tasks",
    slug: "tasks",
    select: "id, title, status",
    searchCols: ["title"],
    buildTo: (r) => `/owner/crm/jbj/tasks/${r.id}`,
    buildTitle: (r) => r.title || "Task",
    buildSubtitle: (r) => r.status || "Task",
  },
  {
    table: "crm_documents",
    moduleLabel: "Documents",
    slug: "documents",
    select: "id, title, status",
    searchCols: ["title"],
    buildTo: () => `/owner/crm/jbj/documents`,
    buildTitle: (r) => r.title || "Document",
    buildSubtitle: (r) => r.status || "Document",
  },
];

async function searchSource(src: Source, term: string): Promise<GlobalSearchHit[]> {
  const safe = term.replace(/[%,]/g, " ").trim();
  if (!safe) return [];
  const or = src.searchCols.map((c) => `${c}.ilike.%${safe}%`).join(",");
  const { data, error } = await (supabase as any)
    .from(src.table)
    .select(src.select)
    .or(or)
    .limit(5);
  if (error || !data) return [];
  return (data as any[]).map((row) => ({
    id: String(row.id),
    module: src.slug,
    moduleLabel: src.moduleLabel,
    title: src.buildTitle(row),
    subtitle: src.buildSubtitle(row),
    to: src.buildTo(row),
  }));
}

export function useGlobalHubSearch(query: string) {
  const [hits, setHits] = useState<GlobalSearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await Promise.all(SOURCES.map((s) => searchSource(s, term)));
        if (cancelled) return;
        setHits(results.flat());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { hits, loading };
}
