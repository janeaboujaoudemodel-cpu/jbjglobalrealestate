import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import { CRM_MODULE_MAP } from "./modules";
import { schemaFor, type Field } from "./moduleSchemas";

/**
 * JBJ CRM — Create Record page (Phase 4).
 * Zoho-parity two-column create form: section headers, field label / input rows,
 * sticky action bar with Save / Save and New / Cancel.
 * Data-agnostic — submit is a no-op stub until per-module persistence lands.
 */

function FieldRow({ field }: { field: Field }) {
  const id = `jc-field-${field.key}`;
  return (
    <div className="jc-form__row">
      <label htmlFor={id} className="jc-form__label">
        {field.required ? <span className="jc-form__req" aria-hidden="true">*</span> : null}
        {field.label}
      </label>
      <div className="jc-form__control">
        {field.type === "textarea" ? (
          <textarea id={id} rows={3} className="jc-form__input" />
        ) : field.type === "select" ? (
          <div className="jc-form__select">
            <select id={id} className="jc-form__input" defaultValue="">
              <option value="" disabled>-None-</option>
              {(field.options ?? []).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </div>
        ) : (
          <input
            id={id}
            type={field.type === "phone" ? "tel" : field.type === "url" ? "url" : field.type}
            className="jc-form__input"
          />
        )}
      </div>
    </div>
  );
}

export default function CrmCreatePage() {
  const { section = "" } = useParams();
  const navigate = useNavigate();
  const mod = CRM_MODULE_MAP[section];
  const label = mod?.label ?? "Record";
  const slug = mod?.slug ?? section;
  const schema = useMemo(() => schemaFor(slug, label), [slug, label]);

  const close = () => navigate(`/owner/crm/jbj/${section}`);

  return (
    <div className="jc-create" data-no-contrast-guard>
      <header className="jc-create__head">
        <h1>Create {schema.singular}</h1>
        <button type="button" className="jc-create__close" aria-label="Close" onClick={close}>
          <X size={18} />
        </button>
      </header>

      <form
        className="jc-create__body"
        onSubmit={(e) => { e.preventDefault(); close(); }}
      >
        {schema.sections.map((sec) => (
          <fieldset key={sec.title} className="jc-form__section">
            <legend className="jc-form__section-title">{sec.title}</legend>
            <div className="jc-form__grid">
              {sec.fields.map((f) => (
                <FieldRow key={f.key} field={f} />
              ))}
            </div>
          </fieldset>
        ))}

        <div className="jc-create__actions">
          <button type="button" className="jc-btn jc-btn--ghost" onClick={close}>Cancel</button>
          <button type="submit" className="jc-btn jc-btn--outline">Save and New</button>
          <button type="submit" className="jc-btn jc-btn--primary">Save</button>
        </div>
      </form>
    </div>
  );
}
