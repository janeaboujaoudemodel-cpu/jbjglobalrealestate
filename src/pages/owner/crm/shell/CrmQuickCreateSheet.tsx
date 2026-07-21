import { FormEvent, useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { schemaFor, type Field } from "./moduleSchemas";
import { CRM_MODULE_MAP } from "./modules";

/**
 * CrmQuickCreateSheet — inline record create.
 * Replaces the redirect-to-/new page. Opens as a right-side sheet and
 * saves without leaving the current page.
 *
 * Persistence is deliberately stubbed to a local-only insert until each
 * module gets its dedicated mutation; the previous /new page had the
 * same stub behavior. Emitting `jc-record-created` lets list pages
 * refresh if they choose to listen.
 */

type Props = {
  slug: string | null;
  onClose: () => void;
};

function Row({ field, value, onChange }: {
  field: Field;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `jc-quick-${field.key}`;
  return (
    <div className="jc-form__row">
      <label htmlFor={id} className="jc-form__label">
        {field.required ? <span className="jc-form__req" aria-hidden="true">*</span> : null}
        {field.label}
      </label>
      <div className="jc-form__control">
        {field.type === "textarea" ? (
          <textarea
            id={id}
            rows={3}
            className="jc-form__input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : field.type === "select" ? (
          <div className="jc-form__select">
            <select
              id={id}
              className="jc-form__input"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="">-None-</option>
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
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}

export default function CrmQuickCreateSheet({ slug, onClose }: Props) {
  const open = !!slug;
  const mod = slug ? CRM_MODULE_MAP[slug] : undefined;
  const label = mod?.label ?? slug ?? "Record";
  const moduleSlug = mod?.slug ?? slug ?? "";
  const schema = useMemo(() => schemaFor(moduleSlug, label), [moduleSlug, label]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const submit = async (e: FormEvent, andNew = false) => {
    e.preventDefault();
    // required-field check
    const missing = schema.sections
      .flatMap((s) => s.fields)
      .filter((f) => f.required && !values[f.key]?.trim())
      .map((f) => f.label);
    if (missing.length) {
      toast({
        title: "Missing required fields",
        description: missing.join(", "),
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      window.dispatchEvent(
        new CustomEvent("jc-record-created", { detail: { slug: moduleSlug, values } })
      );
      toast({ title: `${schema.singular} saved`, description: "Created inline — no page reload." });
      setValues({});
      if (!andNew) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[560px] p-0 bg-white"
        data-no-contrast-guard
      >
        <SheetHeader className="jc-quick-create__head">
          <SheetTitle className="jc-quick-create__title">Create {schema.singular}</SheetTitle>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="jc-quick-create__close"
          >
            <X size={18} />
          </button>
        </SheetHeader>
        <form
          className="jc-quick-create__body"
          onSubmit={(e) => submit(e, false)}
        >
          {schema.sections.map((sec) => (
            <fieldset key={sec.title} className="jc-form__section">
              <legend className="jc-form__section-title">{sec.title}</legend>
              <div className="jc-form__grid">
                {sec.fields.map((f) => (
                  <Row
                    key={f.key}
                    field={f}
                    value={values[f.key] ?? ""}
                    onChange={(v) => set(f.key, v)}
                  />
                ))}
              </div>
            </fieldset>
          ))}
          <div className="jc-quick-create__actions">
            <button
              type="button"
              className="jc-btn jc-btn--ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="jc-btn jc-btn--outline"
              onClick={(e) => submit(e as unknown as FormEvent, true)}
              disabled={saving}
            >
              Save and New
            </button>
            <button
              type="submit"
              className="jc-btn jc-btn--primary"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
