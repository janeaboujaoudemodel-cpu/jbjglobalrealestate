export type SuccessStory = {
  slug: string;
  client: string;
  outcome: string;
  headline: string;
  body: string;
  tag: string;
  cover: string;
};

export const SUCCESS_STORIES: SuccessStory[] = [
  {
    slug: "hedge-fund-portfolio-marina",
    client: "London-based hedge fund principal",
    outcome: "AED 42M portfolio · +34% appraisal in 18 months",
    headline: "From a single Marina 2-bed to a 6-unit yielding portfolio",
    body: "We built a staged acquisition programme across Dubai Marina and Business Bay — mixing ready inventory for cash-flow with two off-plan units for capital appreciation. Handled DLD, escrow, currency and property management end-to-end.",
    tag: "Investor",
    cover: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&auto=format&q=80",
  },
  {
    slug: "family-office-palm-villa",
    client: "European family office",
    outcome: "AED 78M signature villa · closed off-market in 21 days",
    headline: "Sourcing an off-market Palm Jumeirah villa",
    body: "Client wanted a beachfront villa with view frontage without going through public listings. Our developer and private-seller network surfaced three qualified opportunities in a week; we closed on frond G in 21 days including full title transfer.",
    tag: "Off-Market",
    cover: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&auto=format&q=80",
  },
  {
    slug: "golden-visa-family-relocation",
    client: "Indian tech founder + family",
    outcome: "Golden visa + primary residence · relocated in 90 days",
    headline: "Golden Visa, primary residence, and school placement in one motion",
    body: "Structured a AED 2.1M off-plan purchase that qualified for the 10-year Golden Visa, coordinated escrow release around visa timelines, and referred the family to our education partners. Everything closed inside the school term window.",
    tag: "Relocation",
    cover: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1400&auto=format&q=80",
  },
];
