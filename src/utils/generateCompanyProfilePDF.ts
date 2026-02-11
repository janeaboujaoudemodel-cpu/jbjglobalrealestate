import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { CONTACT_INFO } from "@/constants/stats";

const PROFILE_CONTENT = {
  executiveSummary: `JBJ Global Real Estate is a Dubai-based real estate brokerage built on precision, transparency, and long-term client relationships. Operating across Dubai's most active residential and investment markets, the firm provides structured advisory for buying, selling, leasing, and investing in property. Our approach is defined by clarity rather than volume. Every engagement begins with understanding the client's objective, risk profile, and timeline, followed by data-driven market evaluation and disciplined execution. We work with homeowners, landlords, investors, and institutional buyers who value informed decision-making and professional representation. JBJ Global Real Estate combines on-ground market expertise with modern intelligence tools, ensuring each recommendation is grounded in verifiable information, not assumptions. From first consultation to completion and beyond, clients receive direct access, responsive communication, and accountability at every stage.`,

  brandStory: `JBJ Global Real Estate was founded with a clear mandate: to elevate the standard of real estate advisory in Dubai by replacing transactional brokerage with structured, client-centric representation. The Dubai property market is dynamic, fast-moving, and opportunity-rich — but it also demands discipline, accurate information, and local expertise. JBJ was established to guide clients through this complexity with confidence and clarity. The firm's foundation is built on experience across residential sales, leasing, investment structuring, and developer-led projects. Founder-led and strategically focused, JBJ Global Real Estate operates with the understanding that real estate decisions have long-term financial and lifestyle impact. Our role is not to sell inventory, but to interpret the market, present clear options, and support informed decisions aligned with each client's goals. Today, JBJ Global Real Estate serves local and international clients seeking reliable representation, transparent processes, and premium service delivery in Dubai's evolving property landscape.`,

  vision: "To be a trusted reference for real estate advisory in Dubai through clarity, discipline, and client confidence.",
  mission: "To provide structured, transparent real estate guidance that protects client interests and supports informed decision-making.",

  values: [
    { title: "Clarity", description: "Information presented accurately, without exaggeration." },
    { title: "Integrity", description: "Advice aligned with client objectives, not incentives." },
    { title: "Discipline", description: "Consistent processes and risk-aware execution." },
    { title: "Responsiveness", description: "Direct access and timely communication." },
    { title: "Loyalty", description: "Long-term commitment to client success and trust." },
    { title: "Accountability", description: "Responsibility throughout the transaction lifecycle." }
  ],

  services: [
    { title: "Residential Sales Advisory", description: "Advisory support for primary and secondary market purchases.", idealFor: "Homeowners and investors.", deliverables: "Market evaluation, property shortlisting, transaction coordination." },
    { title: "Premium Leasing (Rentals)", description: "Structured leasing for residential properties.", idealFor: "Tenants and landlords.", deliverables: "Rental valuation, tenant sourcing, contract coordination." },
    { title: "Seller Representation & Pricing Strategy", description: "Professional representation for property owners.", idealFor: "Homeowners and investors selling assets.", deliverables: "Pricing strategy, marketing coordination, negotiation support." },
    { title: "Landlord Services / Property Management", description: "Operational support for rental assets.", idealFor: "Portfolio landlords.", deliverables: "Leasing oversight, tenant coordination, renewal management." },
    { title: "Investment Advisory", description: "Data-driven advisory for property investment decisions.", idealFor: "Yield-focused investors.", deliverables: "Market analysis, risk assessment, scenario comparison." },
    { title: "New Developments / Off-Plan Advisory", description: "Guidance on developer-led projects.", idealFor: "Investors and early buyers.", deliverables: "Project evaluation, payment plan analysis, booking coordination." }
  ],

  process: [
    { step: 1, title: "Consultation", description: "Understand objectives and constraints." },
    { step: 2, title: "Market Review", description: "Data-based evaluation of options." },
    { step: 3, title: "Shortlisting", description: "Curated selection aligned with goals." },
    { step: 4, title: "Execution", description: "Viewing, negotiation, coordination." },
    { step: 5, title: "Transaction", description: "Documentation and closing support." },
    { step: 6, title: "After-Care", description: "Post-transaction guidance and follow-up." }
  ],

  differentiators: [
    "Objective-driven advisory",
    "Clear pricing and market logic",
    "Curated property selection",
    "Strong developer and landlord network",
    "Negotiation discipline",
    "Transparent communication",
    "End-to-end coordination",
    "Client confidentiality"
  ],

  areas: [
    "Downtown Dubai", "Business Bay", "Dubai Marina", "Palm Jumeirah",
    "JBR", "City Walk", "DIFC", "Meydan",
    "Dubai Hills Estate", "Jumeirah Islands", "Jumeirah Village Circle", "Arabian Ranches"
  ],

  clientExperience: [
    "Clear expectations from day one",
    "Verified information only",
    "Timely updates",
    "Single point of contact",
    "Confidential handling of data",
    "No pressure-based selling",
    "Structured documentation",
    "Post-transaction support"
  ],

  trustCompliance: `All information is provided for guidance and is subject to change. JBJ Global Real Estate does not guarantee outcomes, returns, or timelines. Property data may be updated by developers, owners, or authorities. Client information is handled in accordance with applicable data protection standards.`,

  founderProfile: {
    name: "Jane Bou Jaoude",
    title: "Founder & CEO",
    bio: `Jane Bou Jaoude is the Founder & CEO of JBJ Global Real Estate. Her leadership philosophy centers on clarity, accountability, and long-term client trust. With hands-on involvement in advisory strategy and client engagement, she ensures that every transaction reflects disciplined market understanding rather than speculation. Clients working with JBJ can expect direct oversight, transparent communication, and advice grounded in practical market realities. Jane's approach prioritizes alignment with client objectives, risk awareness, and execution quality.`,
    quote: "Real estate decisions deserve clarity, not pressure."
  },

  companySnapshot: {
    headquarters: "Dubai, UAE",
    serviceAreas: "GCC & Globally",
    languages: "English",
    contact: CONTACT_INFO.phone,
    email: CONTACT_INFO.email,
    website: "WWW.JBJ.AE",
    whatsapp: CONTACT_INFO.phone,
    workingHours: "Monday-Sunday, 9:00 AM - 9:00 PM"
  },

  ctas: [
    { title: "Request a Private Consultation", description: "Book a confidential advisory session." },
    { title: "List Your Property", description: "Receive a structured pricing strategy." },
    { title: "Get a Curated Shortlist", description: "Access verified opportunities." }
  ]
};

export async function generateCompanyProfilePDF(includeFounder: boolean): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 50;

  const goldColor = rgb(0.66, 0.57, 0.35);
  const blackColor = rgb(0.05, 0.05, 0.05);
  const grayColor = rgb(0.4, 0.4, 0.4);
  const whiteColor = rgb(1, 1, 1);

  const wrapText = (text: string, maxWidth: number, fontSize: number, font: typeof helvetica): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // === PAGE 1: Cover ===
  const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
  page1.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: blackColor });
  page1.drawRectangle({ x: 0, y: pageHeight - 8, width: pageWidth, height: 8, color: goldColor });
  page1.drawText("JBJ", { x: pageWidth / 2 - 60, y: pageHeight / 2 + 80, size: 96, font: helveticaBold, color: goldColor });
  page1.drawText("GLOBAL REAL ESTATE", { x: pageWidth / 2 - 140, y: pageHeight / 2 + 20, size: 24, font: helveticaBold, color: whiteColor });
  page1.drawRectangle({ x: margin, y: pageHeight / 2 - 10, width: pageWidth - margin * 2, height: 1, color: goldColor });
  page1.drawText("COMPANY PROFILE", { x: pageWidth / 2 - 100, y: pageHeight / 2 - 60, size: 28, font: helveticaBold, color: goldColor });

  if (includeFounder) {
    page1.drawText("Founder & CEO, Jane Bou Jaoude", { x: pageWidth / 2 - 120, y: pageHeight / 2 - 100, size: 14, font: helvetica, color: grayColor });
  }

  page1.drawText(`${new Date().getFullYear()} Edition`, { x: pageWidth / 2 - 40, y: 60, size: 12, font: helvetica, color: grayColor });
  page1.drawRectangle({ x: 0, y: 0, width: pageWidth, height: 8, color: goldColor });

  // === PAGE 2: Table of Contents ===
  const tocPage = pdfDoc.addPage([pageWidth, pageHeight]);
  tocPage.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: whiteColor });
  tocPage.drawRectangle({ x: 0, y: pageHeight - 50, width: pageWidth, height: 50, color: blackColor });
  tocPage.drawText("JBJ GLOBAL REAL ESTATE", { x: margin, y: pageHeight - 32, size: 12, font: helveticaBold, color: goldColor });
  tocPage.drawText("TABLE OF CONTENTS", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
  tocPage.drawRectangle({ x: margin, y: pageHeight - 108, width: 180, height: 3, color: goldColor });

  const tocEntries = [
    { title: "Executive Summary", page: 3 },
    { title: "Brand Story", page: 4 },
    { title: "Vision, Mission & Values", page: 5 },
    { title: "Services", page: 6 },
    { title: "Our Process", page: 7 },
    { title: "Why JBJ", page: 8 },
    { title: "Areas of Focus", page: 9 },
    { title: "Client Experience Standards", page: 10 },
    { title: "Trust & Compliance", page: 11 },
    ...(includeFounder ? [{ title: "Founder Profile", page: 12 }] : []),
    { title: "Company Snapshot & Contact", page: includeFounder ? 13 : 12 },
  ];

  let tocY = pageHeight - 160;
  tocEntries.forEach((entry, index) => {
    tocPage.drawText(`${index + 1}.`, { x: margin, y: tocY, size: 12, font: helveticaBold, color: goldColor });
    tocPage.drawText(entry.title, { x: margin + 30, y: tocY, size: 12, font: helvetica, color: blackColor });
    tocPage.drawText(`${entry.page}`, { x: pageWidth - margin - 20, y: tocY, size: 12, font: helvetica, color: grayColor });
    tocY -= 28;
  });
  tocPage.drawText("www.jbj.ae", { x: pageWidth / 2 - 30, y: 25, size: 10, font: helvetica, color: goldColor });

  // Helper to draw page header
  const drawPageHeader = (page: ReturnType<typeof pdfDoc.addPage>, pageNum: number) => {
    page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: whiteColor });
    page.drawRectangle({ x: 0, y: pageHeight - 50, width: pageWidth, height: 50, color: blackColor });
    page.drawText("JBJ GLOBAL REAL ESTATE", { x: margin, y: pageHeight - 32, size: 12, font: helveticaBold, color: goldColor });
    page.drawText(`Page ${pageNum}`, { x: pageWidth - margin - 35, y: pageHeight - 32, size: 10, font: helvetica, color: grayColor });
  };

  const drawFooter = (page: ReturnType<typeof pdfDoc.addPage>) => {
    page.drawText("www.jbj.ae", { x: pageWidth / 2 - 30, y: 25, size: 10, font: helvetica, color: goldColor });
  };

  // === PAGE 3: Executive Summary ===
  const p3 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawPageHeader(p3, 3);
  p3.drawText("EXECUTIVE SUMMARY", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
  p3.drawRectangle({ x: margin, y: pageHeight - 108, width: 140, height: 3, color: goldColor });
  let yPos = pageHeight - 140;
  wrapText(PROFILE_CONTENT.executiveSummary, pageWidth - margin * 2 - 50, 10, helvetica).forEach((line) => {
    p3.drawText(line, { x: margin, y: yPos, size: 10, font: helvetica, color: grayColor });
    yPos -= 16;
  });
  drawFooter(p3);

  // === PAGE 4: Brand Story ===
  const p4 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawPageHeader(p4, 4);
  p4.drawText("BRAND STORY", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
  p4.drawRectangle({ x: margin, y: pageHeight - 108, width: 100, height: 3, color: goldColor });
  yPos = pageHeight - 140;
  wrapText(PROFILE_CONTENT.brandStory, pageWidth - margin * 2 - 50, 10, helvetica).forEach((line) => {
    p4.drawText(line, { x: margin, y: yPos, size: 10, font: helvetica, color: grayColor });
    yPos -= 16;
  });
  drawFooter(p4);

  // === PAGE 5: Vision / Mission / Values ===
  const p5 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawPageHeader(p5, 5);
  p5.drawText("VISION", { x: margin, y: pageHeight - 100, size: 18, font: helveticaBold, color: blackColor });
  p5.drawRectangle({ x: margin, y: pageHeight - 106, width: 50, height: 2, color: goldColor });
  yPos = pageHeight - 130;
  wrapText(PROFILE_CONTENT.vision, pageWidth - margin * 2 - 100, 11, helvetica).forEach((line) => {
    p5.drawText(line, { x: margin, y: yPos, size: 11, font: helvetica, color: grayColor });
    yPos -= 18;
  });
  yPos -= 20;
  p5.drawText("MISSION", { x: margin, y: yPos, size: 18, font: helveticaBold, color: blackColor });
  p5.drawRectangle({ x: margin, y: yPos - 6, width: 60, height: 2, color: goldColor });
  yPos -= 30;
  wrapText(PROFILE_CONTENT.mission, pageWidth - margin * 2 - 100, 11, helvetica).forEach((line) => {
    p5.drawText(line, { x: margin, y: yPos, size: 11, font: helvetica, color: grayColor });
    yPos -= 18;
  });
  yPos -= 20;
  p5.drawText("VALUES", { x: margin, y: yPos, size: 18, font: helveticaBold, color: blackColor });
  p5.drawRectangle({ x: margin, y: yPos - 6, width: 50, height: 2, color: goldColor });
  yPos -= 35;
  PROFILE_CONTENT.values.forEach((value) => {
    p5.drawText(`- ${value.title}`, { x: margin, y: yPos, size: 11, font: helveticaBold, color: blackColor });
    p5.drawText(` -- ${value.description}`, { x: margin + 80, y: yPos, size: 10, font: helvetica, color: grayColor });
    yPos -= 22;
  });
  drawFooter(p5);

  // === PAGE 6: Services ===
  const p6 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawPageHeader(p6, 6);
  p6.drawText("WHAT WE DO -- SERVICES", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
  p6.drawRectangle({ x: margin, y: pageHeight - 108, width: 180, height: 3, color: goldColor });
  yPos = pageHeight - 140;
  PROFILE_CONTENT.services.forEach((service) => {
    p6.drawText(service.title, { x: margin, y: yPos, size: 12, font: helveticaBold, color: blackColor });
    yPos -= 16;
    p6.drawText(service.description, { x: margin, y: yPos, size: 9, font: helvetica, color: grayColor });
    yPos -= 14;
    p6.drawText(`Ideal for: ${service.idealFor}`, { x: margin, y: yPos, size: 9, font: helvetica, color: grayColor });
    yPos -= 14;
    p6.drawText(`Deliverables: ${service.deliverables}`, { x: margin, y: yPos, size: 9, font: helvetica, color: grayColor });
    yPos -= 28;
  });
  drawFooter(p6);

  // === PAGE 7: Process ===
  const p7 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawPageHeader(p7, 7);
  p7.drawText("OUR PROCESS", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
  p7.drawRectangle({ x: margin, y: pageHeight - 108, width: 100, height: 3, color: goldColor });
  yPos = pageHeight - 160;
  PROFILE_CONTENT.process.forEach((step) => {
    p7.drawText(`${step.step}.`, { x: margin, y: yPos, size: 24, font: helveticaBold, color: goldColor });
    p7.drawText(step.title, { x: margin + 40, y: yPos, size: 14, font: helveticaBold, color: blackColor });
    p7.drawText(step.description, { x: margin + 40, y: yPos - 18, size: 10, font: helvetica, color: grayColor });
    yPos -= 55;
  });
  drawFooter(p7);

  // === PAGE 8: Why JBJ ===
  const p8 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawPageHeader(p8, 8);
  p8.drawText("WHY JBJ", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
  p8.drawRectangle({ x: margin, y: pageHeight - 108, width: 70, height: 3, color: goldColor });
  yPos = pageHeight - 150;
  const leftCol = PROFILE_CONTENT.differentiators.slice(0, 4);
  const rightCol = PROFILE_CONTENT.differentiators.slice(4);
  leftCol.forEach((item, i) => {
    p8.drawText("-", { x: margin, y: yPos - (i * 35), size: 14, font: helveticaBold, color: goldColor });
    p8.drawText(item, { x: margin + 20, y: yPos - (i * 35), size: 12, font: helvetica, color: blackColor });
  });
  rightCol.forEach((item, i) => {
    p8.drawText("-", { x: pageWidth / 2, y: yPos - (i * 35), size: 14, font: helveticaBold, color: goldColor });
    p8.drawText(item, { x: pageWidth / 2 + 20, y: yPos - (i * 35), size: 12, font: helvetica, color: blackColor });
  });
  drawFooter(p8);

  // === PAGE 9: Areas of Focus ===
  const p9 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawPageHeader(p9, 9);
  p9.drawText("AREAS OF FOCUS", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
  p9.drawRectangle({ x: margin, y: pageHeight - 108, width: 120, height: 3, color: goldColor });
  yPos = pageHeight - 150;
  const areaLeftCol = PROFILE_CONTENT.areas.slice(0, 6);
  const areaRightCol = PROFILE_CONTENT.areas.slice(6);
  areaLeftCol.forEach((area, i) => {
    p9.drawText("-", { x: margin, y: yPos - (i * 30), size: 14, font: helveticaBold, color: goldColor });
    p9.drawText(area, { x: margin + 20, y: yPos - (i * 30), size: 12, font: helvetica, color: blackColor });
  });
  areaRightCol.forEach((area, i) => {
    p9.drawText("-", { x: pageWidth / 2, y: yPos - (i * 30), size: 14, font: helveticaBold, color: goldColor });
    p9.drawText(area, { x: pageWidth / 2 + 20, y: yPos - (i * 30), size: 12, font: helvetica, color: blackColor });
  });
  drawFooter(p9);

  // === PAGE 10: Client Experience (FIX: replaced "✓" with ">") ===
  const p10 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawPageHeader(p10, 10);
  p10.drawText("CLIENT EXPERIENCE STANDARDS", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
  p10.drawRectangle({ x: margin, y: pageHeight - 108, width: 220, height: 3, color: goldColor });
  yPos = pageHeight - 150;
  PROFILE_CONTENT.clientExperience.forEach((item) => {
    p10.drawText(">", { x: margin, y: yPos, size: 14, font: helveticaBold, color: goldColor });
    p10.drawText(item, { x: margin + 25, y: yPos, size: 12, font: helvetica, color: blackColor });
    yPos -= 35;
  });
  drawFooter(p10);

  // === PAGE 11: Trust & Compliance ===
  const p11 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawPageHeader(p11, 11);
  p11.drawText("TRUST & COMPLIANCE", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
  p11.drawRectangle({ x: margin, y: pageHeight - 108, width: 150, height: 3, color: goldColor });
  yPos = pageHeight - 150;
  wrapText(PROFILE_CONTENT.trustCompliance, pageWidth - margin * 2 - 100, 11, helvetica).forEach((line) => {
    p11.drawText(line, { x: margin, y: yPos, size: 11, font: helvetica, color: grayColor });
    yPos -= 20;
  });
  drawFooter(p11);

  // === PAGE 12: Founder Profile (CONDITIONAL) ===
  if (includeFounder) {
    const founderPage = pdfDoc.addPage([pageWidth, pageHeight]);
    founderPage.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: blackColor });
    founderPage.drawRectangle({ x: 0, y: pageHeight - 8, width: pageWidth, height: 8, color: goldColor });
    founderPage.drawText("Page 12", { x: pageWidth - margin - 35, y: pageHeight - 32, size: 10, font: helvetica, color: grayColor });
    founderPage.drawText("FOUNDER PROFILE", { x: margin, y: pageHeight - 80, size: 22, font: helveticaBold, color: goldColor });
    founderPage.drawRectangle({ x: margin, y: pageHeight - 88, width: 130, height: 2, color: goldColor });
    founderPage.drawText(PROFILE_CONTENT.founderProfile.name, { x: margin, y: pageHeight - 130, size: 28, font: helveticaBold, color: whiteColor });
    founderPage.drawText(PROFILE_CONTENT.founderProfile.title, { x: margin, y: pageHeight - 155, size: 14, font: helvetica, color: goldColor });
    yPos = pageHeight - 200;
    wrapText(PROFILE_CONTENT.founderProfile.bio, pageWidth - margin * 2 - 50, 10, helvetica).forEach((line) => {
      founderPage.drawText(line, { x: margin, y: yPos, size: 10, font: helvetica, color: grayColor });
      yPos -= 16;
    });
    founderPage.drawText(`"${PROFILE_CONTENT.founderProfile.quote}"`, { x: margin, y: 100, size: 16, font: helveticaBold, color: goldColor });
    founderPage.drawText("-- Jane Bou Jaoude", { x: margin, y: 75, size: 12, font: helvetica, color: grayColor });
    founderPage.drawRectangle({ x: 0, y: 0, width: pageWidth, height: 8, color: goldColor });
  }

  // === FINAL PAGE: Company Snapshot & Contact ===
  const finalPageNum = includeFounder ? 13 : 12;
  const finalPage = pdfDoc.addPage([pageWidth, pageHeight]);
  finalPage.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: blackColor });
  finalPage.drawRectangle({ x: 0, y: pageHeight - 8, width: pageWidth, height: 8, color: goldColor });
  finalPage.drawText(`Page ${finalPageNum}`, { x: pageWidth - margin - 35, y: pageHeight - 32, size: 10, font: helvetica, color: grayColor });
  finalPage.drawText("COMPANY SNAPSHOT", { x: margin, y: pageHeight - 80, size: 22, font: helveticaBold, color: goldColor });
  finalPage.drawRectangle({ x: margin, y: pageHeight - 88, width: 150, height: 2, color: goldColor });

  const snapshotItems = [
    { label: "Headquarters", value: PROFILE_CONTENT.companySnapshot.headquarters },
    { label: "Service Areas", value: PROFILE_CONTENT.companySnapshot.serviceAreas },
    { label: "Languages", value: PROFILE_CONTENT.companySnapshot.languages },
    { label: "Contact", value: PROFILE_CONTENT.companySnapshot.contact },
    { label: "Email", value: PROFILE_CONTENT.companySnapshot.email },
    { label: "Website", value: PROFILE_CONTENT.companySnapshot.website },
    { label: "Working Hours", value: PROFILE_CONTENT.companySnapshot.workingHours },
  ];

  yPos = pageHeight - 130;
  snapshotItems.forEach((item) => {
    finalPage.drawText(item.label + ":", { x: margin, y: yPos, size: 10, font: helvetica, color: grayColor });
    finalPage.drawText(item.value, { x: margin + 120, y: yPos, size: 11, font: helveticaBold, color: whiteColor });
    yPos -= 28;
  });

  yPos = 180;
  finalPage.drawText("READY TO START?", { x: pageWidth / 2 - 80, y: yPos, size: 18, font: helveticaBold, color: goldColor });
  finalPage.drawRectangle({ x: pageWidth / 2 - 60, y: yPos - 8, width: 120, height: 2, color: goldColor });

  PROFILE_CONTENT.ctas.forEach((cta) => {
    yPos -= 35;
    finalPage.drawText(`- ${cta.title}`, { x: margin + 100, y: yPos, size: 12, font: helveticaBold, color: whiteColor });
    finalPage.drawText(cta.description, { x: margin + 100, y: yPos - 15, size: 10, font: helvetica, color: grayColor });
  });

  finalPage.drawRectangle({ x: 0, y: 0, width: pageWidth, height: 8, color: goldColor });

  // Save and download
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const suffix = includeFounder ? "_With_Founder" : "_Standard";
  a.download = `JBJ_Global_Real_Estate_Company_Profile${suffix}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
