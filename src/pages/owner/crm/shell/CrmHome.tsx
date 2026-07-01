export default function CrmHome() {
  return (
    <div className="jc-page">
      <div className="jc-page__header">
        <div>
          <h1 className="jc-page__title">Home</h1>
          <div className="jc-page__subtitle">JBJ CRM — Shell Preview</div>
        </div>
      </div>
      <div className="jc-card">
        <div className="jc-empty">
          <div className="jc-empty__title">Shell approved?</div>
          <div>
            This is the Phase 1 application shell only. Once you confirm the
            header, sidebar, spacing, and colors match the Zoho reference
            (with JBJ branding), each module will be built individually on top
            of this frame with its own JBJ backend.
          </div>
        </div>
      </div>
    </div>
  );
}
