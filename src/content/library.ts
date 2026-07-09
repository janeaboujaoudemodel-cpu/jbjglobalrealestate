/** Placeholder Library — replace via CMS + Storage bucket in Batch B. */
export type LibraryDoc = {
  slug: string;
  category: string;
  title: string;
  description: string;
  pages: number;
  format: "PDF" | "eBook" | "White Paper" | "Playbook";
  cover: string;
  size?: string;
};

export const LIBRARY_DOCS: LibraryDoc[] = [
  {
    slug: "jbj-investor-playbook-2026",
    category: "JBJ Guides",
    title: "JBJ Investor Playbook 2026",
    description: "The complete framework we use with private clients — from thesis to exit.",
    pages: 84, format: "Playbook",
    cover: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&q=80",
    size: "8.2 MB",
  },
  {
    slug: "dubai-off-plan-white-paper",
    category: "White Papers",
    title: "Dubai Off-Plan — A White Paper",
    description: "Handover risk, payment plans, developer stratification, and the maths that actually matters.",
    pages: 42, format: "White Paper",
    cover: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&q=80",
    size: "4.1 MB",
  },
  {
    slug: "market-research-h2-2025",
    category: "Market Research",
    title: "H2 2025 Market Research Report",
    description: "Community-level supply, absorption, and price velocity across 34 Dubai neighbourhoods.",
    pages: 96, format: "PDF",
    cover: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&q=80",
    size: "12.6 MB",
  },
  {
    slug: "golden-visa-application-pack",
    category: "Educational PDFs",
    title: "Golden Visa Application Pack",
    description: "Checklists, sample forms, translated exhibits, and the documents most applicants forget.",
    pages: 28, format: "PDF",
    cover: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&q=80",
    size: "3.2 MB",
  },
  {
    slug: "dld-broker-handbook",
    category: "DLD Resources",
    title: "DLD Broker Reference — 2026 Edition",
    description: "Field-tested distillation of DLD procedures every practising broker should have on file.",
    pages: 64, format: "PDF",
    cover: "https://images.unsplash.com/photo-1517959105821-eaf2591984ca?w=800&auto=format&q=80",
    size: "6.9 MB",
  },
  {
    slug: "rera-compliance-checklist",
    category: "Government Docs",
    title: "RERA Compliance Checklist",
    description: "Signed-off audit template for brokerages preparing for their next RERA inspection.",
    pages: 18, format: "PDF",
    cover: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&q=80",
    size: "1.4 MB",
  },
  {
    slug: "broker-prospecting-playbook",
    category: "Training Manuals",
    title: "Broker Prospecting Playbook",
    description: "The 12-week outbound cadence that graduates from JBJ Academy execute in their first year.",
    pages: 38, format: "Playbook",
    cover: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&auto=format&q=80",
    size: "3.9 MB",
  },
  {
    slug: "roi-modelling-spreadsheet-guide",
    category: "Investment Playbooks",
    title: "Off-Plan ROI Modelling Guide",
    description: "A step-by-step walk-through of our internal ROI/DCF model with sample deals.",
    pages: 22, format: "eBook",
    cover: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&q=80",
    size: "2.1 MB",
  },
];

export const LIBRARY_CATEGORIES = [
  "All",
  "JBJ Guides",
  "Investment Playbooks",
  "Market Research",
  "White Papers",
  "Educational PDFs",
  "DLD Resources",
  "Government Docs",
  "Training Manuals",
];
