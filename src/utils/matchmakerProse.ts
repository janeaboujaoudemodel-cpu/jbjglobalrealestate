import { sanitizeForDisplay, stripHtmlTags } from "@/utils/contentSanitizer";

const SECTION_HEADERS = [
  "project general facts",
  "general facts",
  "project overview",
  "overview",
  "finishing and materials",
  "kitchen and appliances",
  "furnishing",
  "location description and benefits",
  "location description",
  "amenities",
];

const headerKey = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

const isHeader = (line: string) => SECTION_HEADERS.includes(headerKey(line.replace(/[:.\-–—]+$/, "")));

const toPlainText = (html?: string | null) =>
  stripHtmlTags(
    (html || "")
      .replace(/<style[^>]*>.*?<\/style>/gis, "")
      .replace(/<script[^>]*>.*?<\/script>/gis, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h\d)>/gi, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&quot;/g, '"')
  )
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const sentenceCase = (value: string) => {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.charAt(0).toUpperCase() + clean.slice(1).replace(/\s+\./g, ".");
};

const limitWords = (text: string, maxWords: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ").replace(/[,.!?;:]$/, "")}…`;
};

function parseSections(text: string) {
  const sections: Record<string, string[]> = {};
  let current = "overview";
  for (const rawLine of text.split(/\n+/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const inline = line.match(/^(Finishing and materials|Kitchen and appliances|Furnishing|Location description and benefits|Location description)\s*[:\-–—]\s*(.+)$/i);
    if (inline) {
      const key = headerKey(inline[1]);
      sections[key] = sections[key] || [];
      sections[key].push(inline[2]);
      current = key;
      continue;
    }
    if (isHeader(line)) {
      current = headerKey(line.replace(/[:.\-–—]+$/, ""));
      sections[current] = sections[current] || [];
      continue;
    }
    sections[current] = sections[current] || [];
    sections[current].push(line);
  }
  return sections;
}

export function buildPropertyPresentationParagraphs(project: any, maxParagraphs = 3): string[] {
  const text = toPlainText(project?.description || project?.developer?.description || "");
  if (!text) return [];

  const sections = parseSections(text);
  const paragraphs: string[] = [];
  const community = project?.community?.name || project?.area_name || project?.location || "the community";
  const overview = [
    ...(sections["project general facts"] || []),
    ...(sections["general facts"] || []),
    ...(sections.overview || []),
    ...(sections["project overview"] || []),
  ].join(" ");

  const cleanOverview = sanitizeForDisplay(overview);
  if (cleanOverview) paragraphs.push(limitWords(sentenceCase(cleanOverview), 86));

  const finishing = sanitizeForDisplay((sections["finishing and materials"] || []).join(" "));
  const kitchen = sanitizeForDisplay((sections["kitchen and appliances"] || []).join(" "));
  const furnishing = sanitizeForDisplay((sections.furnishing || []).join(" "));
  const lifestyleSentences: string[] = [];
  if (finishing) lifestyleSentences.push(`Finished with ${finishing.replace(/\.$/, "").toLowerCase()}.`);
  if (kitchen) lifestyleSentences.push(`The kitchen is delivered ${kitchen.replace(/\.$/, "").toLowerCase()}.`);
  if (furnishing) {
    const f = furnishing.toLowerCase();
    lifestyleSentences.push(
      /^(yes|fully|furnished)/i.test(f)
        ? "Comes fully furnished, making it easier to move in or prepare the home for rental."
        : /^(no|unfurnished)/i.test(f)
          ? "Delivered unfurnished, ready for your own interior styling and furniture choices."
          : sentenceCase(furnishing)
    );
  }
  if (lifestyleSentences.length) paragraphs.push(limitWords(lifestyleSentences.join(" "), 72));

  const location = sanitizeForDisplay([
    ...(sections["location description and benefits"] || []),
    ...(sections["location description"] || []),
  ].join(" "));
  if (location) {
    paragraphs.push(limitWords(`Set in ${community}, ${location.charAt(0).toLowerCase()}${location.slice(1)}`, 92));
  }

  if (!paragraphs.length) {
    const fallback = sanitizeForDisplay(text);
    if (fallback) paragraphs.push(limitWords(sentenceCase(fallback), 90));
  }

  return paragraphs
    .map((p) => p.replace(/\b(Furnishing|Kitchen and appliances|Finishing and materials|Location description and benefits)\b\s*[:\-–—]?/gi, "").trim())
    .filter(Boolean)
    .slice(0, maxParagraphs);
}

export function findAmenityPhotoUrl(amenity: string, amenityImages?: Record<string, string> | null): string | null {
  if (!amenityImages) return null;
  if (amenityImages[amenity]) return amenityImages[amenity];
  const lower = amenity.toLowerCase();
  for (const [key, url] of Object.entries(amenityImages)) {
    const k = key.toLowerCase();
    if (k === lower || lower.includes(k) || k.includes(lower)) return url;
  }
  return null;
}