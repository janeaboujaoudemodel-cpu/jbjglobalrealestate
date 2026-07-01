import { useParams } from "react-router-dom";
import { CRM_MODULE_MAP } from "./modules";

export default function CrmModulePage() {
  const { section = "" } = useParams();
  const mod = CRM_MODULE_MAP[section];
  const Icon = mod?.icon;

  return (
    <div className="jc-page">
      <div className="jc-page__header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {Icon ? (
            <div
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: "var(--jbjcrm-emerald-soft)",
                color: "var(--jbjcrm-emerald-ink)",
                display: "grid", placeItems: "center",
              }}
            >
              <Icon size={18} />
            </div>
          ) : null}
          <div>
            <h1 className="jc-page__title">{mod?.label ?? "Unknown module"}</h1>
            <div className="jc-page__subtitle">JBJ CRM</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="jc-btn" type="button">Import</button>
          <button className="jc-btn jc-btn--primary" type="button">Create {mod?.label ?? "Record"}</button>
        </div>
      </div>

      <div className="jc-card">
        <div className="jc-empty">
          <div className="jc-empty__title">Module shell only</div>
          <div>
            The <strong>{mod?.label ?? section}</strong> module will be built
            from scratch on top of this shell once Phase 1 is approved.
            Every table, filter, drawer, and form here is planned as a native
            JBJ component backed by our own database.
          </div>
        </div>
      </div>
    </div>
  );
}
