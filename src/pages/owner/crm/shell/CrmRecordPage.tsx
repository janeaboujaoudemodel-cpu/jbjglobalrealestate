import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronDown, Mail, Pencil, Phone, MoreHorizontal, ArrowLeft } from "lucide-react";
import { CRM_MODULE_MAP } from "./modules";
import { schemaFor } from "./moduleSchemas";

/**
 * JBJ CRM — Record Detail page (Phase 4).
 * Zoho-parity record page: business card header, related-list rail,
 * field sections (empty state), timeline placeholder.
 */
export default function CrmRecordPage() {
  const { section = "", id = "" } = useParams();
  const navigate = useNavigate();
  const mod = CRM_MODULE_MAP[section];
  const slug = mod?.slug ?? section;
  const label = mod?.label ?? "Record";
  const schema = useMemo(() => schemaFor(slug, label), [slug, label]);

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
            {(id[0] ?? schema.singular[0] ?? "?").toUpperCase()}
          </div>
          <div className="jc-record__ident">
            <h1>New {schema.singular}</h1>
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
                <strong>—</strong>
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
                  <strong>—</strong>
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
