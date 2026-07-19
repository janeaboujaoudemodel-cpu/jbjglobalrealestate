type AnyDeveloper = Record<string, any>;

export type DeveloperCustomFields = Record<string, unknown> | null | undefined;

export const DEVELOPER_EXCEL_LABELS: Record<string, string> = {
  excel_serial: "Excel #",
  excel_status: "Registration status",
  facebook_url: "Facebook",
  global_presence: "Global presence",
  projects_outside_uae: "Projects outside UAE",
  projects_uae: "Projects in UAE",
  registration_link: "Registration link",
  remarks: "Remarks",
  rm_cp: "RM / CP",
  whatsapp_group_bool: "WhatsApp group",
};

export const humanizeDeveloperFieldKey = (key: string) =>
  DEVELOPER_EXCEL_LABELS[key] ||
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const getDeveloperCustomFields = (developer: AnyDeveloper | null | undefined): Record<string, unknown> => {
  const value = developer?.custom_fields;
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
};

export const fieldToText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(fieldToText).filter(Boolean).join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value).trim();
};

export const fieldToList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(fieldToText).filter(Boolean);
  const text = fieldToText(value);
  if (!text) return [];
  return text.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
};

export const normalizePublicUrl = (value?: string | null, platform?: "instagram") => {
  const raw = (value || "").trim();
  if (!raw) return "";
  if (platform === "instagram" && raw.startsWith("@")) {
    return `https://www.instagram.com/${raw.slice(1).replace(/^@+/, "")}`;
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, "")}`;
};

export const publicUrlLabel = (value: string) => {
  try {
    const url = new URL(normalizePublicUrl(value));
    return url.hostname.replace(/^www\./, "") + url.pathname.replace(/\/$/, "");
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
};

export const buildDeveloperSocialLinks = (developer: AnyDeveloper | null | undefined) => {
  // Public developer pages must never expose direct developer contact routes.
  // Website and social links stay owner-only to prevent clients bypassing JBJ.
  return [];
};

export const buildPublicDeveloperFacts = (developer: AnyDeveloper | null | undefined, projectCount = 0) => {
  if (!developer) return [];
  const custom = getDeveloperCustomFields(developer);
  const globalPresence = fieldToList(custom.global_presence);
  const facts = [
    { label: "Leadership", value: fieldToText(developer.ceo_name) },
    { label: "Founded", value: developer.founded_year ? String(developer.founded_year) : "" },
    { label: "Projects in UAE", value: fieldToText(custom.projects_uae) || (projectCount ? String(projectCount) : "") },
    { label: "Projects outside UAE", value: fieldToText(custom.projects_outside_uae) },
    { label: "Global presence", value: globalPresence.join(" · ") },
  ];
  return facts.filter((fact) => fact.value);
};

export const buildPublicDeveloperNarrative = (developer: AnyDeveloper | null | undefined, projectCount = 0) => {
  if (!developer) return "";
  const custom = getDeveloperCustomFields(developer);
  const parts = [`JBJ records ${developer.name} in its developer database`];
  if (developer.founded_year) parts.push(`founded in ${developer.founded_year}`);
  const uaeProjects = fieldToText(custom.projects_uae) || (projectCount ? String(projectCount) : "");
  if (uaeProjects) parts.push(`with ${uaeProjects} UAE project${uaeProjects === "1" ? "" : "s"} listed`);
  const outside = fieldToText(custom.projects_outside_uae);
  if (outside) parts.push(`and ${outside} project${outside === "1" ? "" : "s"} outside the UAE`);
  const presence = fieldToList(custom.global_presence);
  if (presence.length) parts.push(`across ${presence.join(", ")}`);
  return `${parts.join(", ")}.`;
};

export const getVisibleExcelEntries = (customFields: DeveloperCustomFields, exclude: string[] = []) => {
  const blocked = new Set(exclude);
  return Object.entries(customFields || {}).filter(([key, value]) => {
    if (blocked.has(key)) return false;
    const text = fieldToText(value);
    return text.length > 0;
  });
};