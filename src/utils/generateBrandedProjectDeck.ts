/**
 * generateBrandedProjectDeck — direct PDF download (no editor, no navigation).
 *
 * Produces a fixed, JBJ-branded co-branded deck for a specific project using
 * the locked champagne/gold/ink palette. Users cannot change colors, fonts,
 * or template — by design.
 *
 * Mirrors the "Realty AI" style flow: click → file downloads. That's it.
 */
import jsPDF from "jspdf";

export interface BrandedDeckInput {
  projectName: string;
  developerName?: string | null;
  location?: string | null;
  priceFrom?: number | null;
  bedroomsText?: string | null;
  sizeText?: string | null;
  handoverText?: string | null;
  description?: string | null;
  heroImageUrl?: string | null;
  broker?: {
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    logoUrl?: string | null;
    headshotUrl?: string | null;
    agencyName?: string | null;
  } | null;
}

// Locked JBJ palette — DO NOT make user-configurable.
const PAGE_BG = "#FDFBF7";        // champagne page
const SURFACE = "#F7F2EA";        // champagne surface
const INK = "#1A1A1A";
const GOLD = "#B89555";
const INK_SOFT = "#4A4A4A";
const ORANGE = "#FB923C";         // price orange

const PAGE_W = 1920;
const PAGE_H = 1080;
const M = 96;

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  try {
    const res = await fetch(url, { mode: "cors" }).catch(() => null);
    if (!res || !res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(blob);
    });
  } catch {
    return null;
  }
}

function drawChrome(pdf: jsPDF, pageIndex: number, total: number) {
  // Background
  pdf.setFillColor(PAGE_BG);
  pdf.rect(0, 0, PAGE_W, PAGE_H, "F");
  // Top gold hairline
  pdf.setDrawColor(GOLD);
  pdf.setLineWidth(2);
  pdf.line(M, 80, PAGE_W - M, 80);
  // Footer wordmark + page number
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(INK);
  pdf.text("JBJ GLOBAL REAL ESTATE", M, PAGE_H - 56);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(16);
  pdf.setTextColor(INK_SOFT);
  pdf.text(`${pageIndex} / ${total}`, PAGE_W - M, PAGE_H - 56, { align: "right" });
}

function formatPrice(n?: number | null): string | null {
  if (typeof n !== "number" || !isFinite(n) || n <= 0) return null;
  return `AED ${n.toLocaleString()}`;
}

export async function generateBrandedProjectDeck(input: BrandedDeckInput): Promise<void> {
  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [PAGE_W, PAGE_H] });

  const hero = input.heroImageUrl ? await loadImage(input.heroImageUrl) : null;
  const logo = input.broker?.logoUrl ? await loadImage(input.broker.logoUrl) : null;
  const headshot = input.broker?.headshotUrl ? await loadImage(input.broker.headshotUrl) : null;

  const total = 5;

  // ── COVER ─────────────────────────────────────────────────────────────
  if (hero) {
    try { pdf.addImage(hero, "JPEG", 0, 0, PAGE_W, PAGE_H, undefined, "FAST"); }
    catch { /* fall through */ }
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(new (pdf as any).GState({ opacity: 0.55 }));
    pdf.rect(0, 0, PAGE_W, PAGE_H, "F");
    pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
  } else {
    pdf.setFillColor(INK);
    pdf.rect(0, 0, PAGE_W, PAGE_H, "F");
  }
  // Gold rule
  pdf.setDrawColor(GOLD);
  pdf.setLineWidth(3);
  pdf.line(M, M + 60, M + 120, M + 60);
  // Eyebrow
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(GOLD);
  pdf.text("PROJECT PRESENTATION", M, M + 30);
  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(120);
  pdf.setTextColor("#FFFFFF");
  pdf.text(input.projectName, M, M + 220);
  if (input.developerName) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(32);
    pdf.setTextColor("#F5F5F5");
    pdf.text(`by ${input.developerName}`, M, M + 280);
  }
  if (input.location) {
    pdf.setFontSize(28);
    pdf.setTextColor("#EAEAEA");
    pdf.text(input.location, M, M + 330);
  }
  const priceStr = formatPrice(input.priceFrom);
  if (priceStr) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(48);
    pdf.setTextColor(ORANGE);
    pdf.text(`Starting from ${priceStr}`, M, PAGE_H - 220);
  }
  // Footer wordmark on cover
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor("#FFFFFF");
  pdf.text("JBJ GLOBAL REAL ESTATE", M, PAGE_H - 80);
  if (input.broker?.fullName) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(18);
    pdf.text(`Presented by ${input.broker.fullName}${input.broker.agencyName ? ` · ${input.broker.agencyName}` : ""}`, PAGE_W - M, PAGE_H - 80, { align: "right" });
  }

  // ── OVERVIEW ──────────────────────────────────────────────────────────
  pdf.addPage([PAGE_W, PAGE_H], "landscape");
  drawChrome(pdf, 2, total);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(72);
  pdf.setTextColor(INK);
  pdf.text("Project Overview", M, M + 120);
  pdf.setDrawColor(GOLD);
  pdf.setLineWidth(3);
  pdf.line(M, M + 150, M + 100, M + 150);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(28);
  pdf.setTextColor(INK_SOFT);
  const desc = (input.description || "A flagship development crafted for discerning investors and end-users.").slice(0, 900);
  const wrapped = pdf.splitTextToSize(desc, PAGE_W - M * 2);
  pdf.text(wrapped, M, M + 230);

  // ── KEY FACTS ─────────────────────────────────────────────────────────
  pdf.addPage([PAGE_W, PAGE_H], "landscape");
  drawChrome(pdf, 3, total);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(72);
  pdf.setTextColor(INK);
  pdf.text("Key Facts", M, M + 120);
  pdf.setDrawColor(GOLD);
  pdf.line(M, M + 150, M + 100, M + 150);

  const facts: Array<[string, string | null]> = [
    ["Developer", input.developerName || null],
    ["Location", input.location || null],
    ["Starting Price", priceStr],
    ["Bedrooms", input.bedroomsText || null],
    ["Size", input.sizeText || null],
    ["Handover", input.handoverText || null],
  ].filter((f) => f[1]) as Array<[string, string]>;

  const colW = (PAGE_W - M * 2 - 60) / 2;
  facts.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (colW + 60);
    const y = M + 230 + row * 130;
    pdf.setFillColor(SURFACE);
    pdf.roundedRect(x, y, colW, 100, 12, 12, "F");
    pdf.setDrawColor(GOLD);
    pdf.setLineWidth(1);
    pdf.roundedRect(x, y, colW, 100, 12, 12, "S");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(20);
    pdf.setTextColor(GOLD);
    pdf.text(label.toUpperCase(), x + 28, y + 36);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(32);
    pdf.setTextColor(INK);
    pdf.text(value!, x + 28, y + 76);
  });

  // ── WHY THIS PROJECT ──────────────────────────────────────────────────
  pdf.addPage([PAGE_W, PAGE_H], "landscape");
  drawChrome(pdf, 4, total);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(72);
  pdf.setTextColor(INK);
  pdf.text("Why " + input.projectName, M, M + 120);
  pdf.setDrawColor(GOLD);
  pdf.line(M, M + 150, M + 100, M + 150);
  const bullets = [
    "Prime location with strong capital appreciation history.",
    "Developer with a proven delivery record.",
    "Flexible payment plan options.",
    "Curated amenities and considered design.",
    "Strong rental demand and yield potential.",
  ];
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(28);
  pdf.setTextColor(INK);
  bullets.forEach((b, i) => {
    const y = M + 240 + i * 70;
    pdf.setFillColor(GOLD);
    pdf.circle(M + 14, y - 10, 6, "F");
    pdf.text(b, M + 44, y);
  });

  // ── PRESENTED BY ──────────────────────────────────────────────────────
  pdf.addPage([PAGE_W, PAGE_H], "landscape");
  drawChrome(pdf, 5, total);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(72);
  pdf.setTextColor(INK);
  pdf.text("Presented by", M, M + 120);
  pdf.setDrawColor(GOLD);
  pdf.line(M, M + 150, M + 100, M + 150);

  const cardX = M;
  const cardY = M + 220;
  const cardW = PAGE_W - M * 2;
  const cardH = 480;
  pdf.setFillColor(SURFACE);
  pdf.roundedRect(cardX, cardY, cardW, cardH, 18, 18, "F");
  pdf.setDrawColor(GOLD);
  pdf.setLineWidth(1.5);
  pdf.roundedRect(cardX, cardY, cardW, cardH, 18, 18, "S");

  let textX = cardX + 60;
  if (headshot) {
    try {
      pdf.addImage(headshot, "JPEG", cardX + 50, cardY + 60, 360, 360, undefined, "FAST");
      textX = cardX + 470;
    } catch { /* ignore */ }
  }
  if (logo) {
    try { pdf.addImage(logo, "PNG", PAGE_W - M - 320, cardY + 50, 260, 110, undefined, "FAST"); }
    catch { /* ignore */ }
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(48);
  pdf.setTextColor(INK);
  pdf.text(input.broker?.fullName || "Your Broker", textX, cardY + 130);
  if (input.broker?.agencyName) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(26);
    pdf.setTextColor(INK_SOFT);
    pdf.text(input.broker.agencyName, textX, cardY + 180);
  }
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(24);
  pdf.setTextColor(INK);
  let lineY = cardY + 260;
  if (input.broker?.email) { pdf.text(input.broker.email, textX, lineY); lineY += 44; }
  if (input.broker?.phone) { pdf.text(input.broker.phone, textX, lineY); lineY += 44; }
  pdf.setTextColor(INK_SOFT);
  pdf.setFontSize(20);
  pdf.text("In partnership with JBJ Global Real Estate", textX, cardY + cardH - 50);

  // Save
  const safeName = input.projectName.replace(/[^a-z0-9\-]+/gi, "-").toLowerCase();
  pdf.save(`${safeName}-branded-presentation.pdf`);
}
