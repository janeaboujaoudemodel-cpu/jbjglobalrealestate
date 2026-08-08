import emaarCreekHarbour from "@/assets/developer-covers/emaar-dubai-creek-harbour-master-community.jpg";
import nakheelPalmJebelAli from "@/assets/developer-covers/nakheel-palm-jebel-ali-master-community.jpg";
import alFahadFlagship from "@/assets/developer-logos/verified-local/alfahad-project.jpg";
import amisFlagship from "@/assets/developer-logos/verified-local/amis-project.jpg";
import anaxFlagship from "@/assets/developer-logos/verified-local/anax-project.jpg";
import sobhaFlagship from "@/assets/developer-logos/verified-local/sobha-project.jpg";

const normalizeIdentity = (value?: string | null) =>
  (value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

const VERIFIED_FLAGSHIP_MEDIA: Array<{ identities: string[]; url: string }> = [
  { identities: ["emaar", "emaarproperties"], url: emaarCreekHarbour },
  { identities: ["nakheel", "nakheelproperties"], url: nakheelPalmJebelAli },
  { identities: ["sobha", "sobharealty"], url: sobhaFlagship },
  { identities: ["alfahadholding"], url: alFahadFlagship },
  { identities: ["amisdevelopment"], url: amisFlagship },
  { identities: ["anaxdevelopment", "anaxdevelopments"], url: anaxFlagship },
  {
    identities: ["4directiondevelopments"],
    url: "https://4direction.ae/wp-content/uploads/2025/04/BARARI-GARDENS1.png",
  },
  {
    identities: ["omniyat"],
    url: "https://cdn.prod.website-files.com/64cd0df1806781d956403b26/6819deb6d3bcde4e482f8006_BINYAN_LIV3021_Plot31_S060_EXT_HeroBack_BeachSide_Final_3500%20(1).jpg",
  },
  {
    identities: ["agarkredevelopment"],
    url: "https://agproperty.ae/wp-content/uploads/2026/01/ag-residence.jpg",
  },
];

/**
 * Curated developer cover registry. These images are verified development or
 * master-community media and therefore outrank database scoring everywhere.
 */
export const getVerifiedDeveloperFlagship = (
  name?: string | null,
  slug?: string | null,
) => {
  const identities = [normalizeIdentity(name), normalizeIdentity(slug)].filter(Boolean);
  return VERIFIED_FLAGSHIP_MEDIA.find((entry) =>
    entry.identities.some((candidate) =>
      identities.some((identity) => identity === candidate || identity.includes(candidate)),
    ),
  )?.url;
};

export const isUsableDeveloperCover = (value?: string | null) =>
  Boolean(value) &&
  !/(?:logo|wordmark|favicon|snapedit|screenshot|whatsapp|convert\.io|1080x1080|\/x\/16x16\/|mobile[-_]?app|app[-_]?banner|iphone|phone|meeting|celebration|team[-_]|portrait|suspended[_-]?account|beback[-_]?soon|coming[-_]?soon|under[-_]?construction)/i.test(
    value || "",
  );