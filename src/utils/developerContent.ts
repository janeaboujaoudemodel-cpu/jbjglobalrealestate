import { sanitizeForDisplay } from "@/utils/contentSanitizer";

const UNSAFE_DEVELOPER_COPY = /\b(404|page\s+not\s+found|returned\s+(?:a\s+)?(?:'|")?404|returned\s+.*error|time\s+of\s+extraction|inquiry\s+metadata|provident\s+estate|reelly)\b/i;

const VERIFIED_DEVELOPER_COPY: Record<string, string> = {
  "majid-al-futtaim":
    "Majid Al Futtaim is a Dubai-headquartered group founded in 1992, with real estate and community development activity including landmark destinations and residential communities such as Tilal Al Ghaf.",
};

export function hasUnsafeDeveloperCopy(text?: string | null) {
  return !!text && UNSAFE_DEVELOPER_COPY.test(text);
}

export function getSafeDeveloperDescription(developer: {
  name?: string | null;
  slug?: string | null;
  description?: string | null;
}) {
  const slug = developer.slug || "";
  const clean = sanitizeForDisplay(developer.description);
  if (clean && !hasUnsafeDeveloperCopy(clean)) return clean;
  if (VERIFIED_DEVELOPER_COPY[slug]) return VERIFIED_DEVELOPER_COPY[slug];
  return `${developer.name || "This developer"} profile information is being verified. JBJ only displays confirmed project and portfolio data on this page.`;
}
