import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronDown, Mail, Pencil, Phone, MoreHorizontal, ArrowLeft } from "lucide-react";
import { CRM_MODULE_MAP } from "./modules";
import { schemaFor } from "./moduleSchemas";
import { supabase } from "@/integrations/supabase/client";

/**
 * JBJ CRM — Record Detail page.
 *
 * Fetches the actual record from `crm_leads` (or the module's source table)
 * and paints the real values into the Business Card + Lead Information grids.
 * Prior version rendered "—" for every field regardless of the record, which
 * is why real leads like "Imad Kassir" appeared empty.
 */

type LeadRecord = Record<string, unknown> & {
  id: string;
  full_name?: string | null;
  email_lower?: string | null;
  email_normalized?: string | null;
  phone_e164?: string | null;
  phone_normalized?: string | null;
  company_name?: string | null;
  source?: string | null;
  pipeline_stage?: string | null;
  nationality?: string | null;
  preferred_language?: string | null;
  current_location_city?: string | null;
  current_location_country?: string | null;
  notes?: string | null;
  created_at?: string | null;
  lead_type?: string | null;
  lead_intent?: string | null;
};

const FIELD_MAP: Record<string, (r: LeadRecord) => string | null | undefined> = {
  first_name: (r) => (r.full_name ?? "").split(/\s+/)[0] || null,
  last_name: (r) => (r.full_name ?? "").split(/\s+/).slice(1).join(" ") || null,
  full_name: (r) => r.full_name ?? null,
  name: (r) => r.full_name ?? null,
  email: (r) => r.email_normalized ?? r.email_lower ?? null,
  phone: (r) => r.phone_e164 ?? r.phone_normalized ?? null,
  mobile: (r) => r.phone_e164 ?? r.phone_normalized ?? null,
  company: (r) => r.company_name ?? null,
  company_name: (r) => r.company_name ?? null,
  lead_source: (r) => r.source ?? null,
  source: (r) => r.source ?? null,
  lead_status: (r) => r.pipeline_stage ?? null,
  status: (r) => r.pipeline_stage ?? null,
  stage: (r) => r.pipeline_stage ?? null,
  nationality: (r) => r.nationality ?? null,
  language: (r) => r.preferred_language ?? null,
  preferred_language: (r) => r.preferred_language ?? null,
  city: (r) => r.current_location_city ?? null,
  country: (r) => r.current_location_country ?? null,
  location: (r) => [r.current_location_city, r.current_location_country].filter(Boolean).join(", ") || null,
  lead_type: (r) => r.lead_type ?? null,
  intent: (r) => r.lead_intent ?? null,
  notes: (r) => r.notes ?? null,
  description: (r) => r.notes ?? null,
};

function valueFor(record: LeadRecord | null, key: string): string {
  if (!record) return "—";
  const mapper = FIELD_MAP[key];
  const v = mapper ? mapper(record) : (record as any)[key];
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

export default function CrmRecordPage() {
  const { section = "", id = "" } = useParams();
  const navigate = useNavigate();
  const mod = CRM_MODULE_MAP[section];
  const slug = mod?.slug ?? section;
  const label = mod?.label ?? "Record";
  const schema = useMemo(() => schemaFor(slug, label), [slug, label]);

  const [record, setRecord] = useState<LeadRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setLoading(false);
      return;
    }
    // Currently we only have a rich record shape for leads. Contacts/deals
    // can be added the same way once their tables are wired.
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("crm_leads")
        .select(
          "id, full_name, email_lower, email_normalized, phone_e164, phone_normalized, company_name, source, pipeline_stage, nationality, preferred_language, current_location_city, current_location_country, notes, created_at, lead_type, lead_intent",
        )
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      setRecord((data as LeadRecord) ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const displayName = record?.full_name?.trim() || (loading ? "Loading…" : `New ${schema.singular}`);
  const avatarLetter = (record?.full_name?.trim()?.[0] || schema.singular[0] || "?").toUpperCase();

  return (
    <div className="jc-record" data-no-contrast-guard>
      <aside className="jc-record__rail" aria-label="Related list navigation">
        <button
          type="button"
          className="jc-record__back"
          onClick={() => navigate(`/owner/crm/jbj/${section}`)}
        >
          <ArrowLeft size={14} /> {schema.label}
        </button>
        <div className="jc-record__rail-title">Related List</div>
        <ul className="jc-record__rail-list">
          {schema.relatedLists.map((r) => (
            <li key={r}><a href={`#rl-${r.replace(/\s+/g, "-").toLowerCase()}`}>{r}</a></li>
          ))}
        </ul>
      </aside>

      <div className="jc-record__main">
        <header className="jc-record__head">
          <div className="jc-record__avatar" aria-hidden="true">
            {avatarLetter}
          </div>
          <div className="jc-record__ident">
            <h1>{displayName}</h1>
            <p className="jc-record__meta">Record ID: {id}</p>
          </div>
          <div className="jc-record__cta">
            <button type="button" className="jc-btn jc-btn--ghost"><Mail size={14} /> Send Email</button>
            <button type="button" className="jc-btn jc-btn--ghost"><Phone size={14} /> Call</button>
            <button type="button" className="jc-btn jc-btn--primary"><Pencil size={14} /> Edit</button>
            <button type="button" className="jc-btn jc-btn--icon" aria-label="More"><MoreHorizontal size={16} /></button>
          </div>
        </header>

        <section className="jc-record__biz">
          <h2>Business Card <button type="button" className="jc-record__more"><ChevronDown size={14} /></button></h2>
          <div className="jc-record__biz-grid">
            {schema.sections[0].fields.slice(0, 6).map((f) => (
              <div key={f.key} className="jc-record__biz-cell">
                <span>{f.label}</span>
                <strong>{valueFor(record, f.key)}</strong>
              </div>
            ))}
          </div>
        </section>

        {schema.sections.map((sec) => (
          <section key={sec.title} className="jc-record__section">
            <h2>{sec.title}</h2>
            <div className="jc-record__fields">
              {sec.fields.map((f) => (
                <div key={f.key} className="jc-record__field">
                  <span>{f.label}</span>
                  <strong>{valueFor(record, f.key)}</strong>
                </div>
              ))}
            </div>
          </section>
        ))}

        {schema.relatedLists.map((r) => (
          <section
            key={r}
            id={`rl-${r.replace(/\s+/g, "-").toLowerCase()}`}
            className="jc-record__rl"
          >
            <header><h2>{r}</h2><span>0 Records</span></header>
            <div className="jc-record__rl-empty">No records to display.</div>
          </section>
        ))}
      </div>
    </div>
  );
}
