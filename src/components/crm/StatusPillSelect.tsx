/**
 * StatusPillSelect — shared primitive (B2 in the CRM audit).
 *
 * Single canonical status pill + dropdown used across the leads table,
 * Kanban cards, Person/Company hubs and the lead detail page. Replaces
 * the 3 visual variants that existed before (pill-in-a-box, native
 * select, custom button trigger).
 *
 * For backwards compatibility we re-export the existing `InlineStatusSelect`
 * implementation — it already renders the flat pill trigger we want.
 */
export { default as StatusPillSelect } from "./InlineStatusSelect";
export { default } from "./InlineStatusSelect";
