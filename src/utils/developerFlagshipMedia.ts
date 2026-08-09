import emaarCreekHarbour from "@/assets/developer-covers/emaar-dubai-creek-harbour-master-community.jpg";
import nakheelPalmJebelAli from "@/assets/developer-covers/nakheel-palm-jebel-ali-master-community.jpg";
import alFahadFlagship from "@/assets/developer-logos/verified-local/alfahad-project.jpg";
import amisFlagship from "@/assets/developer-logos/verified-local/amis-project.jpg";
import anaxFlagship from "@/assets/developer-logos/verified-local/anax-project.jpg";
import sobhaFlagship from "@/assets/developer-logos/verified-local/sobha-project.jpg";
import sobhaStableCover from "@/assets/developer-covers/sobha-cover.jpg.asset.json";
import aldarStableCover from "@/assets/developer-covers/aldar-cover.png.asset.json";
import wellingtonStableCover from "@/assets/developer-covers/wellington-cover.jpg.asset.json";
import majidAlFuttaimStableCover from "@/assets/developer-covers/majid-al-futtaim-cover.jpg.asset.json";

const normalizeIdentity = (value?: string | null) =>
  (value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

const VERIFIED_FLAGSHIP_MEDIA: Array<{ identities: string[]; url: string }> = [
  { identities: ["emaar", "emaarproperties"], url: emaarCreekHarbour },
  { identities: ["nakheel", "nakheelproperties"], url: nakheelPalmJebelAli },
  { identities: ["sobha", "sobharealty"], url: sobhaStableCover.url || sobhaFlagship },
  { identities: ["aldar", "aldarproperties"], url: aldarStableCover.url },
  { identities: ["wellingtondevelopment", "wellingtondevelopmentllc"], url: wellingtonStableCover.url },
  { identities: ["majidalfuttaim"], url: majidAlFuttaimStableCover.url },
  { identities: ["alfahadholding"], url: alFahadFlagship },
  { identities: ["amisdevelopment"], url: amisFlagship },
  { identities: ["anaxdevelopment", "anaxdevelopments"], url: anaxFlagship },
  {
    identities: ["alfahadholding", "alfahaddevelopment"],
    url: "https://www.alfahadholding.com/images/fullscreen/1.jpg",
  },
  {
    identities: ["barondevelopment", "baronprime"],
    url: "https://baron.ae/wp-content/uploads/2025/09/10015.webp",
  },
  {
    identities: ["majidalfuttaim", "majidalfuttaimcommunities", "majidalfuttaimproperties"],
    url: "https://communities.majidalfuttaim.com/en/assets/images/allbanner/Ghaf-Woods-1.jpg",
  },
  {
    identities: ["seventides", "seventidesrealestatedevelopmentllc"],
    url: "https://www.seventides.com/static/img/hospitality/nhcollection/exterior/2.webp",
  },
  {
    identities: ["bamx", "bamxdevelopment"],
    url: "https://api.reelly.io/vault/ZZLvFZFt/Uqo6KpqJWGgNmS1lLiXKV3llDm8/uxWd1A../day-3.jpg",
  },
  {
    identities: ["gfsdevelopments", "gfsdevelopment"],
    url: "https://gfsdevelopments.ae/public_assets/img/VR.webp",
  },
  {
    identities: ["laraixdevelopers", "laraixdevelopment"],
    url: "https://reelly-backend.s3.amazonaws.com/projects/3060/images/21b8d500d280472cb79554dbe4d7eeea.webp",
  },
  {
    identities: ["saas", "saasproperties"],
    url: "https://api.reelly.io/vault/ZZLvFZFt/_JuPIAasUn6kzrzvEMucUsycYTg/JrnbNA../cover.jpeg",
  },
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
  !/(?:\.svg(?:\?|$)|logo|wordmark|favicon|snapedit|screenshot|whatsapp|convert\.io|1080x1080|\/x\/(?:16x16|118x|296x)\/|mobile[-_]?app|app[-_]?banner|iphone|phone|meeting|celebration|team[-_]|portrait|suspended[_-]?account|beback[-_]?soon|coming[-_]?soon|under[-_]?construction)/i.test(
    value || "",
  );