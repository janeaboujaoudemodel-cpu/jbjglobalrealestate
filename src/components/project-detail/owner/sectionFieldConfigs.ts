/**
 * Per-section editable field registry for the Project Detail page.
 * Each section id matches the SUB_NAV_TABS id in ProjectDetailLayout.tsx.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "list"        // string[]
  | "distances"   // [{ label, time }]
  | "faqs"        // [{ question, answer }]
  | "highlights"  // string[] (same as list, distinct label)
  | "url"
  | "images"     // handled by <OwnerImageManager>
  | "select";

export interface FieldDef {
  key: string;          // column in `projects` table OR special "_images"
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface SectionConfig {
  title: string;
  scope: string;        // delegate scope key
  fields: FieldDef[];
  /** When true, render the OwnerImageManager inside the drawer. */
  includeImages?: boolean;
}

export const SECTION_CONFIGS: Record<string, SectionConfig> = {
  details: {
    title: "Details & Description",
    scope: "project_details",
    fields: [
      { key: "name", label: "Project name", type: "text" },
      { key: "location", label: "Location", type: "text", placeholder: "e.g. Jumeirah Golf Estates, Dubai" },
      { key: "area_name", label: "Area name", type: "text" },
      { key: "emirate", label: "Emirate", type: "text" },
      { key: "sale_status", label: "Sale status", type: "select", options: [
        { value: "off_plan", label: "Off-plan" },
        { value: "ready", label: "Ready" },
        { value: "off_sale", label: "Off-sale" },
      ] },
      { key: "description", label: "About this project", type: "textarea", help: "Plain text — formatting is added automatically." },
      { key: "property_type_label", label: "Property type", type: "text" },
      { key: "price_from", label: "Starting price (AED)", type: "number" },
      { key: "price_to", label: "Max price (AED)", type: "number" },
      { key: "bedrooms_min", label: "Bedrooms (min)", type: "number" },
      { key: "bedrooms_max", label: "Bedrooms (max)", type: "number" },
      { key: "size_min", label: "Size min (sqft)", type: "number" },
      { key: "size_max", label: "Size max (sqft)", type: "number" },
      { key: "handover_date", label: "Handover date", type: "date", help: "Past date = automatically labelled 'Ready' everywhere." },
    ],
  },
  gallery: {
    title: "Gallery Photos",
    scope: "project_photos",
    fields: [],
    includeImages: true,
  },
  units: {
    title: "Units & Inventory",
    scope: "project_units",
    fields: [
      { key: "total_units", label: "Total units", type: "number" },
      { key: "available_units", label: "Available units", type: "number" },
      { key: "availability_status", label: "Availability status", type: "text", placeholder: "available / limited / sold out" },
    ],
  },
  construction: {
    title: "Construction Progress",
    scope: "project_construction",
    fields: [
      { key: "construction_progress", label: "Progress %", type: "number", help: "0–100" },
      { key: "construction_start_date", label: "Start date", type: "date" },
      { key: "expected_completion", label: "Expected completion", type: "date" },
      { key: "construction_status", label: "Status text", type: "text" },
    ],
  },
  developer: {
    title: "Developer Information",
    scope: "developer_info",
    // NOTE: developer fields live on the `developers` table (joined). Marked with dev_ prefix.
    fields: [
      { key: "dev_name", label: "Developer name", type: "text" },
      { key: "dev_logo_url", label: "Logo URL", type: "url" },
      { key: "dev_headquarters", label: "Headquarters", type: "text" },
      { key: "dev_founded_year", label: "Founded year", type: "number" },
      { key: "dev_completed_projects", label: "Completed projects", type: "number" },
      { key: "dev_offplan_projects", label: "Off-plan projects", type: "number" },
      { key: "dev_total_units_delivered", label: "Total units delivered", type: "number" },
      { key: "dev_specialization", label: "Specialization", type: "text" },
      { key: "dev_ceo_name", label: "CEO / leadership", type: "text" },
      { key: "dev_website_url", label: "Website", type: "url" },
      { key: "dev_description", label: "About the developer", type: "textarea" },
      { key: "dev_notable_projects", label: "Notable projects", type: "textarea" },
    ],
  },
  usp: {
    title: "Highlights (Unique Selling Points)",
    scope: "project_usp",
    fields: [
      { key: "usp_headline", label: "Headline", type: "text" },
      { key: "usp_image_url", label: "Highlights image URL", type: "url" },
      { key: "usp_bullets", label: "Bullet points", type: "list", help: "One per line." },
    ],
  },
  "floor-plans": {
    title: "Floor Plans",
    scope: "project_floor_plans",
    fields: [
      // floor_plan_types is JSON [{label, pdfUrl?}] – left to a dedicated editor in a later pass.
    ],
    includeImages: false,
  },
  "house-details": {
    title: "House / Specs",
    scope: "project_specs",
    fields: [
      { key: "floors", label: "Floors", type: "number" },
      { key: "ceiling_height", label: "Ceiling height", type: "text", placeholder: "e.g. 3.2m" },
      { key: "finishing_standard", label: "Finishing standard", type: "text" },
      { key: "service_charge", label: "Service charge", type: "text", placeholder: "e.g. AED 18/sqft" },
    ],
  },
  amenities: {
    title: "Amenities & Features",
    scope: "project_amenities",
    fields: [
      { key: "amenities", label: "Amenities", type: "list", help: "One per line — these appear as chips." },
    ],
  },
  media: {
    title: "Video & Virtual Tour",
    scope: "project_media",
    fields: [
      { key: "video_url", label: "Video URL (YouTube/Vimeo)", type: "url" },
      { key: "virtual_tour_url", label: "Virtual tour URL", type: "url" },
    ],
  },
  location: {
    title: "Location Details",
    scope: "project_location",
    fields: [
      { key: "location_headline", label: "Location headline", type: "text" },
      { key: "location_description", label: "Location description", type: "textarea" },
      { key: "location_image_url", label: "Location image URL", type: "url" },
      { key: "latitude", label: "Latitude", type: "number" },
      { key: "longitude", label: "Longitude", type: "number" },
      { key: "location_distances", label: "Nearby places", type: "distances", help: "One per line: Place | 12 min" },
    ],
  },
  "master-plan": {
    title: "Master Plan",
    scope: "project_master_plan",
    fields: [
      { key: "master_plan_image_url", label: "Master plan image URL", type: "url" },
      { key: "community_highlights", label: "Community highlights", type: "list", help: "One per line." },
    ],
  },
  brochure: {
    title: "Brochure Card",
    scope: "project_brochure",
    fields: [
      // Brochure file lives in `project_documents`; managed by OwnerDocDropzone below.
      // No project-column copy is needed here; text in the brochure card is derived.
    ],
  },
  payment: {
    title: "Payment Plan",
    scope: "project_payment",
    fields: [
      { key: "payment_plan", label: "Payment plan summary", type: "textarea", help: "e.g. 60/40 — 60% during construction, 40% on handover" },
      { key: "down_payment_percent", label: "Down payment %", type: "number" },
    ],
  },
  investment: {
    title: "Investment Metrics",
    scope: "project_investment",
    fields: [
      { key: "roi_estimate", label: "ROI estimate %", type: "number" },
      { key: "rental_yield_estimate", label: "Rental yield %", type: "number" },
    ],
  },
  faq: {
    title: "Useful Info / FAQs",
    scope: "project_faqs",
    fields: [
      { key: "faqs", label: "FAQs", type: "faqs", help: "Each FAQ: question line, then answer line, blank line between FAQs." },
    ],
  },
};
