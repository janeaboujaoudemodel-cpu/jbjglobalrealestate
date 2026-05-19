# Post-Batch-3 Backlog

Tracked debt that must NOT block Batch 3 closure but should be normalized later.

## CRM / Broker identity

- [ ] **Normalize broker pre-invite leads via `crm_leads.contact_type = 'broker'`**
  - Current: `vw_crm_broker_pre_invite_leads` detects pre-invite brokers via
    fuzzy `tags`/`source` matching (`%broker%`).
  - Target: introduce an explicit `contact_type` enum on `crm_leads` (values:
    `lead | broker | investor | developer | sales_rep | agency`) and rebuild
    the view to filter on that column.
  - Constraint: must remain non-destructive — keep `crm_brokers` as the
    canonical broker identity; `lead_id` is never aliased to `broker_id`.
  - Migration plan: backfill `contact_type` from existing heuristic, then
    swap the view definition behind the unchanged column projection.

## Picker rollout

- [ ] Promote `UnifiedBrokerPicker` from feature flag (`ff_unified_picker`) to
      default once visual QA, keyboard, mobile, empty-state and large-dataset
      tests pass against the legacy `BrokerCombobox`.
- [ ] Retire legacy `BrokerCombobox` only after at least one full QA cycle
      with the unified picker on by default.

## Pass 5–7 (not started)

- Rate-limit `crm-broker-invite-status`
- Auto-expire invitation scheduler
- Richer suspicious-session UI
- Email render diff CI
- Audit login events
- Unified lifecycle action centre (Pass 7)
