// Authored lesson content for Broker Academy training modules.
// Sourced from the Market Intelligence reference material already shown on /broker/learning
// (NEVER_SAY / ALWAYS_USE / Golden Rules) plus short authored copy that matches each
// module title exactly. Read-only — no DB calls.

export interface Lesson {
  title: string;
  body: string;
  bullets?: string[];
  doAndDont?: { do: string[]; dont: string[] };
}

export const BROKER_LESSONS: Record<string, Lesson[]> = {
  // ── Reading the Market ──────────────────────────────────────────────────
  "reading-market": [
    {
      title: "How to interpret market trends",
      body:
        "A trend is a direction over time, not a prediction. When you describe a trend, anchor it to a clear window (last quarter, last 12 months) and a clear source (Dubai Land Department, DXBinteract, official Open Data). Your job is to translate the number into a sentence the client can act on, without claiming to know the future.",
      bullets: [
        "State the window: 'over the last 6 months…'",
        "State the source: 'according to DLD transaction data…'",
        "State the direction: rising, flat, softening — never 'guaranteed'.",
      ],
    },
    {
      title: "What data can and cannot say",
      body:
        "Transaction prices, rental indices and absorption rates describe what already happened. They cannot tell you what will happen next month. Frame every insight as a description of the past and present, and let the client draw the forward-looking conclusion.",
      doAndDont: {
        do: [
          "Average price per sqft in this community rose 6% YoY.",
          "Rental yields here have stayed between 6.5% and 7.2% for two years.",
        ],
        dont: [
          "Prices will definitely keep going up.",
          "This is the best time to buy — you will make money.",
        ],
      },
    },
    {
      title: "Reading demand vs supply signals",
      body:
        "Demand signals: search volume, agent enquiry counts, days-on-market shrinking, multiple offers. Supply signals: new launches in pipeline, completion handovers in the next 12 months, inventory build-up. A healthy read combines both sides — never quote one in isolation.",
      bullets: [
        "Falling days-on-market + flat new supply = tightening.",
        "Rising launches + flat absorption = softening pressure.",
        "Always present demand and supply together.",
      ],
    },
    {
      title: "How to explain trends to clients",
      body:
        "Lead with the headline, then the evidence, then the implication for them specifically. Keep the implication factual ('this means inventory in your budget is limited'), not directional ('so you should buy now').",
    },
  ],

  // ── RENT Conversations ──────────────────────────────────────────────────
  "rent-conversations": [
    {
      title: "Explaining rent trends clearly",
      body:
        "Tenants and landlords both want a number they can plan around. Give them the median, the range, and the 12-month change for the exact community and unit type. Never quote a city-wide average to a community-specific question.",
      bullets: [
        "Median rent for 2-bed in Dubai Marina, last 90 days.",
        "Year-on-year change, with the source named.",
        "RERA rental index reference where applicable.",
      ],
    },
    {
      title: "Handling client hesitation",
      body:
        "Hesitation usually means the client is missing one fact. Ask, listen, then answer with data. Do not push. The phrase 'based on recent transactions in this building…' resolves more hesitation than any closing line.",
      doAndDont: {
        do: [
          "Based on recent contracts here, your offer is within market range.",
          "Would it help if I sent you the last five comparable rentals?",
        ],
        dont: [
          "Trust me, this is a great deal.",
          "If you wait, you will lose it.",
        ],
      },
    },
    {
      title: "Area-specific narratives",
      body:
        "Every community has a story — handovers landing, school catchment, metro extension, retail opening. Tie the rent conversation to the one or two facts that actually move that community's rent, not generic Dubai talking points.",
    },
  ],

  // ── BUY vs RENT Context ────────────────────────────────────────────────
  "buy-vs-rent": [
    {
      title: "When rent demand is stronger",
      body:
        "If rental absorption is high and sale transactions are flat in the same community, tenants are voting with their feet. Present this neutrally: 'rentals here are clearing within 14 days while resale stock sits 90 days on average.' Let the client decide what that means for them.",
    },
    {
      title: "When sale demand is slower",
      body:
        "Softer sale demand is not a failure signal — it is a negotiation signal. Walk the client through transacted discounts to listing price over the last quarter, and what that does to their entry basis if they buy.",
    },
    {
      title: "Market timing conversations",
      body:
        "Never claim to time the market. Frame timing as a personal cashflow question: holding period, financing cost, opportunity cost of rent. The data informs the question — the client owns the answer.",
      bullets: [
        "Compare 5-year rent outflow vs purchase carrying cost.",
        "Disclose financing rate sensitivity.",
        "Disclose that past returns do not guarantee future returns.",
      ],
    },
  ],

  // ── Compliance & Language Guardrails ───────────────────────────────────
  "compliance-language": [
    {
      title: "Words brokers must NOT use",
      body:
        "These phrases create regulatory exposure and break client trust the moment a market shifts. They are banned in every channel — WhatsApp, email, calls, social.",
      bullets: [
        '"guaranteed returns"',
        '"sure investment"',
        '"prices will definitely…"',
        '"you should buy now"',
        '"this is the best time"',
        '"I predict / I promise"',
        '"100% ROI"',
      ],
    },
    {
      title: "Difference between 'insight' and 'advice'",
      body:
        "Insight describes what the data shows. Advice tells the client what to do. JBJ brokers deliver insight; clients (with their own legal/tax counsel) make the decision. This single distinction keeps you compliant.",
      doAndDont: {
        do: [
          "Insight: 'transactions in this tower closed 4% below asking last quarter.'",
          "Insight: 'rental yield in this community averaged 6.8% last year.'",
        ],
        dont: [
          "Advice: 'so you should offer 5% under asking.'",
          "Advice: 'this is the property you should buy.'",
        ],
      },
    },
    {
      title: "Approved phrasing examples",
      body:
        "Use these openers verbatim when in doubt. They keep the message factual, sourced and decision-neutral.",
      bullets: [
        '"Based on recent data…"',
        '"Historical trends indicate…"',
        '"Market activity suggests…"',
        '"According to official Open Data…"',
        '"The data shows…"',
        '"This area has experienced…"',
      ],
    },
    {
      title: "The three golden rules",
      body:
        "Describe, do not predict. Insight, not advice. Cite your sources. If every message you send passes these three filters, you are operating inside JBJ standards.",
    },
  ],
};
