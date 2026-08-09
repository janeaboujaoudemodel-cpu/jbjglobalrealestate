/**
 * Verified pure-white developer marks (LOCKED).
 *
 * Every asset here is the developer's OFFICIAL logo, repainted to pure white
 * (never redrawn or regenerated) so it reads premium on the emerald plate.
 * Because the artwork is already white, it must render with `filter: none`
 * and `mix-blend-mode: normal` — see getLogoPaintStyle in DeveloperLogo.tsx.
 */
import adeWhite from "@/assets/developer-logos/verified-local/ade-white.png";
import agWhite from "@/assets/developer-logos/verified-local/ag-white.png";
import aiznWhite from "@/assets/developer-logos/verified-local/aizn-white.png";
import amisWhite from "@/assets/developer-logos/verified-local/amis-white.png";
import anaxWhite from "@/assets/developer-logos/verified-local/anax-white.png";
import ellingtonWhite from "@/assets/developer-logos/verified-local/ellington-white.png";
import sobhaWhite from "@/assets/developer-logos/verified-local/sobha-white.svg";
import ahmadyarWhite from "@/assets/developer-logos/verified-local/ahmadyar-white.png";
import aradaWhite from "@/assets/developer-logos/verified-local/arada-white.svg";
import tigerWhite from "@/assets/developer-logos/verified-local/tiger-white.png";
import hvmLivingWhite from "@/assets/developer-logos/verified-local/hvm-living-white.png";
import abraWhite from "@/assets/developer-logos/verified-local/abra-white.png.asset.json";
import majidAlFuttaimWhite from "@/assets/developer-logos/verified-local/majid-al-futtaim-white.png.asset.json";
import bamxWhite from "@/assets/developer-logos/verified-local/bamx-white.png.asset.json";
import alFahadWhite from "@/assets/developer-logos/verified-local/alfahad-white.png.asset.json";
import albaitWhite from "@/assets/developer-logos/verified-local/albait-white.png.asset.json";

const normalizeIdentity = (value: unknown) =>
  typeof value === "string" ? value.replace(/[^a-z0-9]+/gi, "").toLowerCase() : "";

const VERIFIED_WHITE_LOGOS: Array<{ match: RegExp; logo: string }> = [
  { match: /^adeproperties(llc)?$/, logo: adeWhite },
  { match: /^agproperties(llc)?$/, logo: agWhite },
  { match: /^aizn(realestate)?development(llc)?$/, logo: aiznWhite },
  { match: /^amisdevelopment(llc)?$/, logo: amisWhite },
  { match: /^anaxdevelopments?(llc)?$/, logo: anaxWhite },
  { match: /^ellington(properties|propertiesllc)?$/, logo: ellingtonWhite },
  { match: /^sobha(realty|properties|group)?(llc)?$/, logo: sobhaWhite },
  { match: /^arada(properties|developments?|holding)?(llc)?$/, logo: aradaWhite },
  { match: /^ahmadyar(developments?|realestatedevelopment)?(llc)?$/, logo: ahmadyarWhite },
  // Tiger Group / Tiger Properties — official horizontal mark, repainted white.
  { match: /^tiger(properties|group|developments?|realestate(development)?)?(llc)?$/, logo: tigerWhite },
  { match: /^hvmliving(realestate)?development(llc)?$/, logo: hvmLivingWhite },
  { match: /^abra(group)?$/, logo: abraWhite.url },
  { match: /^majidalfuttaim(communities|properties|group)?$/, logo: majidAlFuttaimWhite.url },
  { match: /^bamx(development)?$/, logo: bamxWhite.url },
  { match: /^alfahad(holding|development)?$/, logo: alFahadWhite.url },
  { match: /^albaitalduwaliy(realestate)?(development)?$/, logo: albaitWhite.url },
];

export function getVerifiedWhiteLogo(name: unknown): string | null {
  const identity = normalizeIdentity(name);
  if (!identity) return null;
  return VERIFIED_WHITE_LOGOS.find((entry) => entry.match.test(identity))?.logo ?? null;
}
