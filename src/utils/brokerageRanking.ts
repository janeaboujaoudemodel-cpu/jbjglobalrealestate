// Famous-agency ranking for the UAE real estate brokerage CRM.
// Higher score = pinned higher in the directory list & exports.

const FAMOUS_BOOSTS: Array<{ match: RegExp; boost: number }> = [
  { match: /\bf[äa]m\s*propert/i, boost: 1000 },
  { match: /\bbetter\s*homes\b|\bbhomes\b/i, boost: 980 },
  { match: /\ballsopp\s*&\s*allsopp\b/i, boost: 960 },
  { match: /\bmetropolitan\b/i, boost: 940 },
  { match: /\bd\s*&\s*b\s*propert/i, boost: 920 },
  { match: /\bax\s*capital\b/i, boost: 900 },
  { match: /\bdriven\s*propert/i, boost: 890 },
  { match: /\bprovident\b/i, boost: 880 },
  { match: /\bhaus\s*&\s*haus\b/i, boost: 870 },
  { match: /\bwhite\s*&\s*co\b/i, boost: 860 },
  { match: /\bengel\s*&?\s*v[öo]?lkers\b/i, boost: 850 },
  { match: /\bespace\b/i, boost: 840 },
  { match: /\bknight\s*frank\b/i, boost: 830 },
  { match: /\bcbre\b/i, boost: 820 },
  { match: /\bjll\b/i, boost: 810 },
  { match: /\basteco\b/i, boost: 800 },
  { match: /\bcoldwell\s*banker\b/i, boost: 790 },
  { match: /\bsavills\b/i, boost: 780 },
  { match: /\bchestertons\b/i, boost: 770 },
  { match: /\bmccone\b/i, boost: 760 },
  { match: /\bunique\s*propert/i, boost: 750 },
  { match: /\baeon\s*&\s*trisl\b/i, boost: 740 },
  { match: /\bbinayah\b/i, boost: 720 },
  { match: /\bkensington\b/i, boost: 710 },
  { match: /\bluxhabitat\b|\bsotheby/i, boost: 700 },
  { match: /\bcore\s+real\b/i, boost: 690 },
];

export function brokerageRankScore(b: any): number {
  const name = String(b?.company_name || "");
  let score = 0;

  for (const { match, boost } of FAMOUS_BOOSTS) {
    if (match.test(name)) {
      score += boost;
      break;
    }
  }

  if (typeof b?.directory_rank === "number") {
    // directory_rank: 1 is best — convert to a positive boost
    score += Math.max(0, 500 - b.directory_rank);
  }

  const agents = Number(b?.estimated_agent_count) || 0;
  score += Math.min(agents, 1000) * 0.6;

  const rating = Number(b?.star_rating) || 0;
  score += rating * 30;

  const deals = Number(b?.deal_count_cached || b?.deal_count) || 0;
  score += deals * 5;

  if (b?.entry_source === "directory") score += 25;
  if (b?.email) score += 4;
  if (b?.phone) score += 4;
  if (b?.instagram_url) score += 2;

  return score;
}

export function sortBrokeragesForDirectory<T extends Record<string, any>>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const sa = brokerageRankScore(a);
    const sb = brokerageRankScore(b);
    if (sb !== sa) return sb - sa;
    return String(a.company_name || "").localeCompare(String(b.company_name || ""));
  });
}

const NORMALIZE_MAP: Record<string, string> = {
  ä: "a", á: "a", à: "a", â: "a",
  ë: "e", é: "e", è: "e", ê: "e",
  ï: "i", í: "i", ì: "i", î: "i",
  ö: "o", ó: "o", ò: "o", ô: "o",
  ü: "u", ú: "u", ù: "u", û: "u",
  ñ: "n", ç: "c",
};

export function normalizeForSearch(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .toLowerCase()
    .replace(/[äáàâëéèêïíìîöóòôüúùûñç]/g, (c) => NORMALIZE_MAP[c] || c)
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
