/**
 * Shared amenity photo library (PASS 298 — NO EMPTY AMENITY CARDS).
 *
 * Every project page used to render an icon-only placeholder whenever the
 * project had no owner-supplied `amenity_images` entry, which left the
 * "Amenities & Features" grid looking unfinished. JBJ already owns a full
 * in-brand interior library (served from `/amra-brochure/*.jpg`), so amenities
 * are matched to that library by category keyword and photo-bearing amenities
 * are always shown first.
 *
 * Rules:
 * - Owner-supplied photos ALWAYS win over the library.
 * - Matching is keyword based and ordered most-specific → least-specific.
 * - An amenity with no library match renders as a compact "what's included"
 *   tick row instead of a large empty card.
 */

const asset = (name: string) => `/amra-brochure/${name}.jpg`;

type LibraryEntry = { match: RegExp; url: string };

/** Ordered most-specific first — the first match wins. */
const LIBRARY: LibraryEntry[] = [
  { match: /panoramic gym|sea view gym|gym with/i, url: asset("panoramic-gym") },
  { match: /gym|fitness|hiit|weight|strength|boxing|punch/i, url: asset("sea-view-gym") },
  { match: /virtual fitness|smart fitness|tech studio/i, url: asset("virtual-fitness") },
  { match: /cycl|spin studio/i, url: asset("cycling") },
  { match: /row(ing)?/i, url: asset("rowing-studio") },
  { match: /trampoline/i, url: asset("trampoline-studio") },
  { match: /parkour/i, url: asset("parkour") },
  { match: /yoga|pilates|meditation|dance|aerobic|studio/i, url: asset("studio") },

  { match: /infinity pool|lagoon|adult pool/i, url: asset("pool-cabanas-marina") },
  { match: /kids'? pool|children'?s pool|splash/i, url: asset("minimal-pool") },
  { match: /indoor pool|wellness pool|temperature controlled pool/i, url: asset("indoor-pool-columns") },
  { match: /hydro|jacuzzi|plunge|whirlpool/i, url: asset("spa-pool") },
  { match: /swim|pool deck|pool|cabana|sun ?deck|sun lounger/i, url: asset("pool-cabanas-marina") },

  { match: /sauna|steam|hammam/i, url: asset("sauna-steam") },
  { match: /cryo/i, url: asset("cryo-chamber") },
  { match: /salt/i, url: asset("salt-room") },
  { match: /snow/i, url: asset("snow-shower") },
  { match: /hyperbaric|oxygen/i, url: asset("hyperbaric-room") },
  { match: /red light|infrared/i, url: asset("red-light-therapy") },
  { match: /sound heal|sonic|singing bowl/i, url: asset("sound-healing-dome") },
  { match: /reiki|energy heal/i, url: asset("reiki-room") },
  { match: /sleep|nap|recovery pod|floating/i, url: asset("floating-sleep-pods") },
  { match: /massage|treatment room|therapy room|spa suite/i, url: asset("spa-treatment-room") },
  { match: /salon|beauty|barber|nail/i, url: asset("beauty-salon") },
  { match: /spa lounge|relax(ation)? lounge|wellness bar/i, url: asset("spa-lounge") },
  { match: /spa|wellness|longevity/i, url: asset("spa-hydrotherapy") },
  { match: /changing room|locker/i, url: asset("female-changing-room") },
  { match: /shower/i, url: asset("shower-room") },

  { match: /entrance lobby|grand lobby|luxur\w* lobby|sculpture/i, url: asset("entrance-lobby-featured-sculpture") },
  { match: /lobby|reception|concierge|welcome/i, url: asset("grand-lobby") },
  { match: /corridor|hallway|passage/i, url: asset("hallway-passage") },
  { match: /chandelier|grand lounge|residents'? lounge|lounge/i, url: asset("chandelier-lounge") },

  { match: /all day dining|restaurant/i, url: asset("all-day-dining") },
  { match: /in-?room dining|room service/i, url: asset("in-room-dining") },
  { match: /juice|smoothie|healthy caf|refreshment/i, url: asset("juice-bar-refreshments") },
  { match: /caf(e|é)|coffee|barista/i, url: asset("juice-bar-refreshments") },
  { match: /bbq|barbe|grill|outdoor dining|dining zone/i, url: asset("pool-cabanas-marina") },
  { match: /supermarket|grocer|spinneys|mini ?mart|convenience/i, url: asset("spinneys-supermarket") },
  { match: /pharmac|clinic|medical/i, url: asset("pharmacy") },
  { match: /retail|shop|boutique|mall/i, url: asset("spinneys-supermarket") },

  { match: /bowling/i, url: asset("bowling-lanes") },
  { match: /vr|virtual reality|simulator lounge|game zone|arcade|gaming/i, url: asset("vr-game-zone") },
  { match: /golf/i, url: asset("golf-simulator") },
  { match: /billiard|pool table|snooker|darts|foosball|table tennis/i, url: asset("arcade-pool-darts") },
  { match: /cinema|theat(re|er)|screening|movie/i, url: asset("art-gallery") },
  { match: /art|gallery/i, url: asset("art-gallery") },
  { match: /librar|book|reading|stor(y|ies) tell/i, url: asset("book-lounge-library") },

  { match: /kids club|soft play|nursery|daycare|creche|kids play|children'?s play|playground/i, url: asset("kids-soft-play") },
  { match: /climb/i, url: asset("kids-climbing") },
  { match: /parent|family room|bonding|intergener/i, url: asset("parent-child-studio") },

  { match: /co-?working|business (centre|center|zone)|meeting room|conference|board ?room|office/i, url: asset("business-zone") },

  { match: /padd(el|le)|pickle ?ball|futsal|badminton|tennis|basketball|squash|sports (deck|court)|court/i, url: asset("rooftop-sports-deck") },
  { match: /helipad|air taxi/i, url: asset("helipad-air-taxi") },
  { match: /marina|yacht|berth/i, url: asset("brochure-yacht-partnerships") },
  { match: /beach|sea view|waterfront|turtle/i, url: asset("sea-turtles") },
  { match: /smart home|home automation|iot|app[- ]enabled|digital/i, url: asset("brochure-citi-app") },
  { match: /digital detox/i, url: asset("digital-detox-cabins") },
  { match: /garden|park|landscap|green|podium|terrace|rooftop|jogging|walking track|cascade|water feature/i, url: asset("aerial-resort") },
];

/** Returns an in-brand library photo for an amenity label, or null. */
export const findLibraryAmenityPhoto = (amenity: string): string | null => {
  if (!amenity) return null;
  for (const entry of LIBRARY) {
    if (entry.match.test(amenity)) return entry.url;
  }
  return null;
};
