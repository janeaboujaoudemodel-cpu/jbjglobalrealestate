/**
 * Market Report HTML Template Builder
 * Generates the full HTML for the UAE Real Estate Market Intelligence book
 */

import luxuryVilla1 from "@/assets/luxury-villa-1.jpeg";
import founderCompanyProfile from "@/assets/founder-company-profile.jpg";
import backCoverImageV2 from "@/assets/books/market-intelligence-back-cover-v2.jpg";
import { ytd2026, fullYear2025, topAreas2026, topAreas2025, topNationalities } from "@/constants/dldMarketData";
import { CONTACT_INFO } from "@/constants/stats";

export interface MarketReportTemplateData {
  liveYtd: typeof ytd2026;
  liveTopAreas: typeof topAreas2026;
  liveNationalities: typeof topNationalities;
  latestNews: any[];
  featuredProjects: any[];
  featuredAreas: any[];
  featuredDevelopers: any[];
  isFounderVisible: boolean;
}

export function buildMarketReportHtml(data: MarketReportTemplateData): string {
  const {
    liveYtd, liveTopAreas, liveNationalities,
    latestNews, featuredProjects, featuredAreas, featuredDevelopers,
    isFounderVisible,
  } = data;

  const downloadDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const websiteUrl = "https://JBJ.AE";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(websiteUrl + "/quiz")}`;
  const villaImages = [luxuryVilla1, luxuryVilla1, luxuryVilla1, luxuryVilla1, luxuryVilla1];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>UAE Real Estate Market Intelligence 2026 | JBJ Global Real Estate</title>
<meta name="description" content="Comprehensive UAE Real Estate Market Intelligence Report by JBJ Global Real Estate - Your guide to UAE property market 2026" />
${getStyles()}
</head>
<body>
  ${getShareBar()}
  ${getCoverPage(villaImages, isFounderVisible)}
  ${getPage2IdentityAndTOC(isFounderVisible)}
  ${isFounderVisible ? getFounderPage(founderCompanyProfile) : ""}
  ${getPage4WhyThisBook(isFounderVisible, villaImages, liveNationalities)}
  ${getPage5FullYearReview(fullYear2025)}
  ${getPage6GdpRankings()}
  ${getPage7TransactionDashboard(liveYtd, downloadDate)}
  ${getPage8TopAreas(liveTopAreas)}
  ${getPage9Nationalities(liveNationalities)}
  ${getPage10PropertyTypes()}
  ${getPage11InvestmentIndicators()}
  ${getPage12CommunityGuide()}
  ${getPage13DeveloperFramework()}
  ${getPage14OffPlanVsReady(liveYtd)}
  ${getPage15DueDiligence()}
  ${getPage16MarketOutlook(liveYtd)}
  ${getPage17RiskManagement()}
  ${getPage18AIMatchmaker(qrUrl, websiteUrl)}
  ${getPage19LatestNews(latestNews, downloadDate)}
  ${getPage20FeaturedAreas(featuredAreas, downloadDate)}
  ${getPage21FeaturedDevelopers(featuredDevelopers)}
  ${getPage22FeaturedProjects(featuredProjects, downloadDate)}
  ${getPage23ExploreAndContact(qrUrl, websiteUrl)}
  ${getBackCover(qrUrl, websiteUrl, backCoverImageV2)}
  <script>
    function downloadPDF() { window.print(); }
    function shareBook() {
      if (navigator.share) {
        navigator.share({ title: 'UAE Real Estate Market Intelligence 2026 - JBJ Global Real Estate', url: 'https://JBJ.ae/market-report' }).catch(console.error);
      } else {
        navigator.clipboard.writeText('https://JBJ.ae/market-report').then(() => alert('Link copied!')).catch(() => alert('Visit JBJ.ae/market-report'));
      }
    }
  </script>
</body>
</html>`;
}

// ─── Style Sheet ─────────────────────────────────────────────────────────────
function getStyles(): string {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap');
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Poppins', sans-serif; background: #FDFBF7; color: #2C2A26; line-height: 1.7; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 794px; min-height: 1123px; padding: 56px 55px 56px; page-break-after: always; background: linear-gradient(180deg, #FDFBF7 0%, #F5F0E6 100%); position: relative; overflow: visible; display: flex; flex-direction: column; }
  .page::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #A8925A, #d4c4a0, #A8925A); }
  .page::after { content: 'JBJ'; position: absolute; bottom: 30px; left: 55px; font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: rgba(168,146,90,0.08); letter-spacing: 0.15em; }
  .page.cover { background: radial-gradient(ellipse at center, #1a1814 0%, #0a0a0a 70%); padding: 0 !important; display: flex; flex-direction: column; }
  .page.cover::before { display: none; }
  .page.cover::after { display: none; }
  .page-number { position: absolute; bottom: 30px; right: 55px; color: #A8925A; font-size: 11px; letter-spacing: 0.1em; }
  h2 { font-family: 'Playfair Display', serif; font-size: 27px; font-weight: 600; color: #1A1814; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 2px solid #A8925A; }
  h3 { font-size: 16px; font-weight: 600; color: #A8925A; margin: 16px 0 10px 0; }
  h4 { font-size: 14px; font-weight: 600; color: #1A1814; margin: 10px 0 8px 0; }
  p { font-size: 13px; color: #2C2A26; margin-bottom: 10px; }
  .highlight-box { background: rgba(168,146,90,0.10); border: 1px solid rgba(168,146,90,0.35); border-left: 4px solid #A8925A; border-radius: 12px; padding: 16px 18px; margin: 14px 0; }
  .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
  .stat-box { background: #FFFFFF; border: 1px solid rgba(168,146,90,0.3); border-top: 3px solid #A8925A; border-radius: 12px; padding: 14px; text-align: center; }
  .stat-box .number { font-family: 'Playfair Display', serif; font-size: 27px; font-weight: 700; color: #A8925A; margin-bottom: 5px; line-height: 1.1; }
  .stat-box .label { font-size: 10px; color: #6B6459; text-transform: uppercase; letter-spacing: 0.1em; }
  ul { list-style: none; padding: 0; margin: 10px 0; }
  li { padding: 7px 0 7px 20px; position: relative; color: #2C2A26; font-size: 12px; border-bottom: 1px solid rgba(168,146,90,0.15); }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 14px 0; }
  .info-card { background: #FFFFFF; border: 1px solid rgba(168,146,90,0.25); border-radius: 12px; padding: 14px; }
  .checklist li::before { content: '✓'; font-weight: bold; color: #A8925A; }
  .warning-box { background: rgba(180,20,20,0.06); border: 1px solid rgba(180,20,20,0.25); border-left: 4px solid #B41414; border-radius: 12px; padding: 18px 22px; margin: 18px 0; }
  .warning-box h4 { color: #B41414; margin-bottom: 8px; }
  .warning-box p { color: #5C1A1A; }
  .warning-box li { color: #5C1A1A; border-bottom-color: rgba(180,20,20,0.15); }
  .table-wrapper { overflow-x: auto; margin: 22px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: rgba(168,146,90,0.15); color: #A8925A; padding: 14px; text-align: left; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; font-size: 11px; }
  td { padding: 13px 14px; border-bottom: 1px solid rgba(168,146,90,0.15); color: #3A3632; }
  tr:hover td { background: rgba(168,146,90,0.04); }
  .toc { margin: 20px 0; }
  .toc-item { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid rgba(168,146,90,0.2); cursor: pointer; }
  .toc-item a { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #1A1814; flex: 1; font-size: 13px; font-weight: 500; transition: color 0.15s; }
  .toc-item a:hover { color: #A8925A; }
  .toc-item .toc-num { font-size: 11px; color: #A8925A; font-weight: 700; width: 20px; flex-shrink: 0; }
  .toc-item .toc-arrow { color: #A8925A; font-size: 13px; margin-left: auto; margin-right: 8px; }
  .toc-item .page-num { color: #A8925A; font-weight: 700; font-size: 13px; flex-shrink: 0; }
  .identity-card { background: #0A0A0A; border: 1px solid rgba(168,146,90,0.5); border-radius: 16px; padding: 36px 40px; margin-bottom: 36px; display: flex; gap: 40px; align-items: stretch; }
  .identity-card-logo { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 110px; border-right: 1px solid rgba(168,146,90,0.3); padding-right: 40px; }
  .identity-card-logo .monogram { font-family: 'Playfair Display', serif; font-size: 52px; font-weight: 700; color: #A8925A; line-height: 1; margin-bottom: 8px; }
  .identity-card-logo .rera { font-size: 9px; color: rgba(168,146,90,0.6); letter-spacing: 0.15em; text-transform: uppercase; margin-top: 6px; }
  .identity-card-details { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 6px; }
  .identity-card-details .company-name { font-size: 18px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.04em; margin-bottom: 6px; }
  .identity-card-details .detail-row { font-size: 13px; color: rgba(212,196,160,0.85); display: flex; align-items: center; gap: 8px; }
  .identity-card-details .detail-row .icon { font-size: 14px; }
  .identity-card-bottom { border-top: 1px solid rgba(168,146,90,0.3); margin-top: 28px; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; }
  .identity-card-bottom .web { font-size: 12px; color: rgba(168,146,90,0.7); letter-spacing: 0.12em; text-transform: uppercase; }
  .qr-section { display: flex; align-items: center; gap: 30px; background: rgba(168,146,90,0.08); border: 1px solid rgba(168,146,90,0.3); border-radius: 16px; padding: 28px; margin: 36px 0; }
  .qr-code { width: 130px; height: 130px; background: #fff; padding: 8px; border-radius: 10px; flex-shrink: 0; }
  .villa-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; margin: 26px 0; }
  .villa-gallery img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; object-position: center center; border-radius: 16px; border: 1px solid rgba(168,146,90,0.3); background: #F5EBD7; display: block; }
  .founder-image { width: 200px; height: 200px; border-radius: 50%; object-fit: contain; object-position: center top; transform: scaleX(1.08); border: 4px solid #A8925A; margin: 0 auto 24px; display: block; background: #ffffff; box-shadow: 0 8px 30px rgba(168,146,90,0.3); }
  .founder-section { text-align: center; padding: 28px 0; }
  .disclaimer { background: rgba(168,146,90,0.06); border: 1px solid rgba(168,146,90,0.2); border-radius: 12px; padding: 18px 22px; margin: 26px 0; font-size: 11px; color: #6B6459; line-height: 1.6; }
  .chart-container { background: #FFFFFF; border: 1px solid rgba(168,146,90,0.25); border-radius: 14px; padding: 22px; margin: 22px 0; }
  .bar-chart { display: flex; flex-direction: column; gap: 13px; }
  .bar-item { display: flex; align-items: center; gap: 13px; }
  .bar-label { width: 130px; font-size: 12px; color: #6B6459; flex-shrink: 0; }
  .bar-track { flex: 1; height: 22px; background: rgba(168,146,90,0.12); border-radius: 4px; overflow: hidden; position: relative; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #A8925A, #d4c4a0); border-radius: 4px; display: flex; align-items: center; justify-content: space-between; padding: 0 10px; }
  .bar-value { font-size: 11px; font-weight: 600; color: #FFFFFF; }
  .area-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
  .area-card { background: #FFFFFF; border: 1px solid rgba(168,146,90,0.3); border-radius: 10px; overflow: hidden; text-decoration: none; display: block; }
  .area-card img { width: 100%; aspect-ratio: 4/3; object-fit: contain; object-position: center; display: block; background: #F5EBD7; }
  .area-card-body { padding: 12px; min-height: 92px; display: flex; flex-direction: column; justify-content: center; }
  .area-card-body .area-name { font-size: 11px; font-weight: 600; color: #1A1814; margin: 0 0 3px 0; line-height: 1.3; }
  .area-card-body .area-meta { font-size: 9px; color: #6B6459; margin: 0 0 2px 0; }
  .area-card-body .area-link { font-size: 9px; color: #A8925A; text-decoration: none; }
  .badge-trending { display: inline-block; background: rgba(168,146,90,0.15); color: #A8925A; font-size: 9px; font-weight: 700; letter-spacing: 0.05em; padding: 2px 7px; border-radius: 20px; border: 1px solid rgba(168,146,90,0.4); margin-bottom: 4px; }
  .badge-demand { display: inline-block; background: rgba(234,88,12,0.1); color: #C2410C; font-size: 9px; font-weight: 700; letter-spacing: 0.05em; padding: 2px 7px; border-radius: 20px; border: 1px solid rgba(234,88,12,0.3); margin-bottom: 4px; }
  .section-footer-link { text-align: center; margin-top: 22px; padding: 16px 24px; background: rgba(168,146,90,0.08); border: 1px solid rgba(168,146,90,0.25); border-radius: 10px; }
  .section-footer-link a { color: #A8925A; text-decoration: none; font-size: 13px; font-weight: 600; }
  .social-links { display: flex; gap: 12px; justify-content: center; margin-top: 14px; }
  .social-links a { color: #A8925A; text-decoration: none; font-size: 12px; padding: 7px 14px; border: 1px solid rgba(168,146,90,0.35); border-radius: 8px; }
  .contact-link { color: #A8925A !important; text-decoration: none; }
  .footer-brand { text-align: center; margin-top: 40px; padding-top: 26px; border-top: 1px solid rgba(168,146,90,0.2); }
  .footer-brand .logo { font-size: 14px; letter-spacing: 0.3em; color: #A8925A; margin-bottom: 8px; }
  .footer-brand p { font-size: 11px; color: #6B6459; }
  .share-bar { position: fixed; top: 0; left: 0; right: 0; background: rgba(253,251,247,0.97); padding: 14px 30px; display: flex; justify-content: space-between; align-items: center; z-index: 1000; backdrop-filter: blur(10px); border-bottom: 2px solid rgba(168,146,90,0.4); box-shadow: 0 2px 20px rgba(168,146,90,0.15); }
  .share-bar .brand { color: #A8925A; font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 600; }
  .share-bar .actions { display: flex; gap: 10px; }
  .share-bar button { padding: 10px 20px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; display: flex; align-items: center; gap: 8px; }
  .share-bar .btn-download { background: linear-gradient(135deg, #A8925A 0%, #8a7648 100%); color: #fff; }
  .share-bar .btn-download:hover { opacity: 0.9; }
  .share-bar .btn-share { background: transparent; color: #A8925A; border: 1px solid rgba(168,146,90,0.5); }
  .share-bar .btn-close { background: transparent; color: #6B6459; padding: 10px; }
  .share-bar .btn-close:hover { color: #1A1814; }
  .legend-item { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #3A3632; }
  .legend-dot { width: 12px; height: 12px; border-radius: 3px; }
  @media print { .page { page-break-after: always; } body { background: #FDFBF7; } .share-bar { display: none; } }
  @media (max-width: 768px) { .page { padding: 50px 25px 44px; } .cover h1 { font-size: 36px; } h2 { font-size: 22px; } .stat-grid { grid-template-columns: 1fr; } .two-col { grid-template-columns: 1fr; } .area-grid { grid-template-columns: repeat(2, 1fr); } .share-bar { padding: 10px 15px; } .share-bar .brand { display: none; } }
</style>`;
}

// ─── Individual page builders ──────────────────────────────────────────────

function getShareBar(): string {
  return `<div class="share-bar">
    <div class="brand">JBJ | GLOBAL REAL ESTATE</div>
    <div class="actions">
      <button class="btn-share" onclick="shareBook()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Share</button>
      <button class="btn-download" onclick="downloadPDF()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download</button>
      <button class="btn-close" onclick="window.close()">✕</button>
    </div>
  </div>`;
}

function getCoverPage(villaImages: string[], isFounderVisible: boolean): string {
  return `<div class="page cover" style="display: flex; flex-direction: column; position: relative; width: 794px; height: 1123px; background: #09090b;">
    <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 24px; background: linear-gradient(to right, rgba(168,146,90,0.4), rgba(168,146,90,0.15), transparent); z-index: 2;"></div>
    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1;">
      <img src="${villaImages[0]}" alt="" style="width: 100%; height: 100%; object-fit: cover; object-position: center center; opacity: 0.45;" />
      <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.7) 70%, #09090b 92%);"></div>
    </div>
    <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 2px; background: linear-gradient(to bottom, transparent, rgba(168,146,90,0.4), transparent); z-index: 2;"></div>
    <div style="position: relative; z-index: 5; flex: 1; display: flex; flex-direction: column; justify-content: flex-end; padding: 0 48px 48px 48px;">
      <div style="width: 64px; height: 4px; background: linear-gradient(to right, #A8925A, #C8A766); margin-bottom: 18px; border-radius: 2px;"></div>
      <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 999px; background: rgba(168,146,90,0.1); border: 1px solid rgba(168,146,90,0.3); width: fit-content; margin-bottom: 18px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A8925A" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
        <span style="color: #A8925A; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em;">Latest Edition 2026</span>
      </div>
      <h1 style="font-family: 'Poppins', sans-serif; font-size: 38px; font-weight: 700; color: #FFFFFF; line-height: 1.2; margin: 0 0 8px 0; background: none; -webkit-text-fill-color: #fff;">UAE Real Estate</h1>
      <h1 style="font-family: 'Poppins', sans-serif; font-size: 38px; font-weight: 700; color: #A8925A; line-height: 1.2; margin: 0 0 24px 0; background: none; -webkit-text-fill-color: #A8925A;">Market Intelligence</h1>
      ${isFounderVisible ? `<div style="margin-top: 28px;"><p style="color: #71717a; font-size: 12px; margin: 0;">By Founder &amp; CEO Jane Bou Jaoude</p></div>` : ""}
      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #27272a;">
        <p style="color: #a1a1aa; font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; margin: 0;">JBJ Global Real Estate</p>
      </div>
    </div>
  </div>`;
}

function getPage2IdentityAndTOC(isFounderVisible: boolean): string {
  const tocItems = [
    [2,"Company Overview &amp; Identity"],
    ...(isFounderVisible ? [[3,"From the Founder"]] : []),
    [4, isFounderVisible ? "Why I Created This Book" : "Why We Created This Book"],
    [5,"2025 Full Year Market Review"],
    [6,"UAE GDP &amp; Global Rankings"],
    [7,"Dubai Transaction Dashboard (DLD Live)"],
    [8,"Top Areas by Volume (DLD Live)"],
    [9,"Top Buyer Nationalities"],
    [10,"Property Types &amp; Rental Yields"],
    [11,"Key Investment Indicators"],
    [12,"Community Comparison Guide"],
    [13,"Developer Framework"],
    [14,"Off-Plan vs Ready Properties"],
    [15,"Due Diligence Checklist"],
    [16,"Market Outlook 2026"],
    [17,"Risk Management"],
    [18,"AI Property Matchmaker"],
    [19,"Latest Market News (Live)"],
    [20,"Featured Areas"],
    [21,"Featured Developers"],
    [22,"Featured Projects"],
    [23,"Explore All &amp; Contact"],
  ];

  return `<div class="page" id="page-2">
    <div class="identity-card">
      <div class="identity-card-logo">
        <div class="monogram">JBJ</div>
        <div style="width: 40px; height: 1px; background: rgba(168,146,90,0.5); margin: 10px 0;"></div>
        <div class="rera">Real Estate</div>
        <div class="rera" style="margin-top: 4px;">Brokerage</div>
      </div>
      <div style="flex: 1;">
        <div class="identity-card-details">
          <div class="company-name">JBJ Global Real Estate L.L.C S.O.C.</div>
          <div style="width: 60px; height: 1px; background: rgba(168,146,90,0.5); margin: 10px 0;"></div>
          <div class="detail-row"><span class="icon" style="font-size:14px;">☎</span><span>+971 56 591 1000</span></div>
          <div class="detail-row"><span class="icon" style="font-size:14px;">✉</span><span>CONTACT@JBJ.AE</span></div>
          <div class="detail-row"><span class="icon" style="font-size:14px;">⌖</span><span>Downtown Dubai, UAE</span></div>
          <div class="detail-row"><span class="icon" style="font-size:14px;">⊕</span><span>JBJ.AE</span></div>
        </div>
        <div class="identity-card-bottom">
          <div class="web">JBJ.AE</div>
          <div style="font-size: 10px; color: rgba(168,146,90,0.5); letter-spacing: 0.1em;">MARKET INTELLIGENCE 2026</div>
        </div>
      </div>
    </div>
    <h2>Table of Contents</h2>
    <div class="toc">
      ${tocItems.map(([pg, title], i) => `<div class="toc-item"><a href="#page-${pg}"><span class="toc-num">${i+1}.</span><span>${title}</span><span class="toc-arrow">→</span></a><span class="page-num">${pg}</span></div>`).join("")}
    </div>
    <span class="page-number">2</span>
  </div>`;
}

function getFounderPage(founderImg: string): string {
  return `<div class="page" id="page-3">
    <div class="founder-section">
      <h2 style="text-align: center; border-bottom: none; margin-bottom: 36px;">From the Founder</h2>
      <img src="${founderImg}" alt="Jane Bou Jaoude" class="founder-image" onerror="this.style.display='none'" />
      <h3 style="text-align: center; margin-bottom: 8px;">Jane Bou Jaoude</h3>
      <p style="color: #6B6459; text-align: center; font-size: 13px; margin-bottom: 4px;">Founder, JBJ Global Real Estate</p>
      <p style="color: #8A8278; text-align: center; font-size: 11px; margin-bottom: 28px;">Real Estate Brokerage • Dubai, UAE</p>
    </div>
    <div class="highlight-box" style="text-align: center;">
      <p style="font-style: italic; font-size: 18px; color: #1A1814; margin-bottom: 0; font-family: 'Playfair Display', serif;">"We Create | We Elevate | We Lead"</p>
    </div>
    <p style="text-align: center; margin-top: 28px; font-size: 15px; color: #2C2A26;">Welcome to the UAE Real Estate Market Intelligence Report. I am honored to share with you the insights, frameworks, and data-driven analysis that have guided thousands of successful property purchases in the UAE market.</p>
    <p style="text-align: center; font-size: 14px; color: #3A3632;">This book represents my commitment to investor education and transparency in one of the world's most dynamic real estate markets.</p>
    <span class="page-number">3</span>
  </div>`;
}

function getPage4WhyThisBook(isFounderVisible: boolean, villaImages: string[], liveNationalities: any[]): string {
  const pronoun = isFounderVisible ? "I" : "we";
  const possessive = isFounderVisible ? "my" : "our";
  return `<div class="page" id="page-4">
    <h2>${isFounderVisible ? "Why I Created This Book" : "Why We Created This Book"}</h2>
    <div class="two-col">
      <div>
        <p style="font-size: 15px; line-height: 1.8; color: #1A1814;">After years of guiding buyers through UAE real estate transactions, ${pronoun} recognized a critical gap: there was no single, comprehensive resource that combined official market data with practical decision-making frameworks.</p>
        <p>Too many property buyers were making decisions based on incomplete information, marketing hype, or unreliable sources. ${isFounderVisible ? "I" : "We"} wanted to change that.</p>
        <p>This book distills ${possessive} experience into structured frameworks that help you evaluate opportunities objectively — whether you are a first-time buyer or an experienced portfolio investor.</p>
      </div>
      <div><img src="${villaImages[1]}" alt="Luxury Property" style="width: 100%; aspect-ratio: 1/1; object-fit: cover; object-position: center center; border-radius: 16px; border: 1px solid rgba(168,146,90,0.3);" /></div>
    </div>
    <h3>What You Will Learn</h3>
    <div class="two-col" style="margin-bottom: 16px;">
      <div class="info-card"><h4 style="margin-top: 0;">Market Intelligence</h4><ul style="margin: 8px 0;"><li style="padding: 6px 0 6px 28px;">Official DLD &amp; RERA data analysis</li><li style="padding: 6px 0 6px 28px;">Price trends by community</li><li style="padding: 6px 0 6px 28px;">Supply &amp; demand forecasts</li><li style="padding: 6px 0 6px 28px;">Top buyer nationalities</li></ul></div>
      <div class="info-card"><h4 style="margin-top: 0;">Decision Frameworks</h4><ul style="margin: 8px 0;"><li style="padding: 6px 0 6px 28px;">Developer comparison matrices</li><li style="padding: 6px 0 6px 28px;">Investment checklists</li><li style="padding: 6px 0 6px 28px;">Risk assessment tools</li><li style="padding: 6px 0 6px 28px;">Payment plan structures</li></ul></div>
    </div>
    <h3 style="margin-top: 16px;">Top Buyer Nationalities — 2026 YTD</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 10px 0;">
      ${liveNationalities.slice(0, 10).map((n: any, i: number) => `<div style="display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: #FFFFFF; border-radius: 8px; border: 1px solid rgba(168,146,90,0.18);"><span style="color: #8A8278; font-size: 10px; width: 14px; font-weight: 600;">${i + 1}</span><span style="font-size: 16px;">${n.flag}</span><span style="color: #1A1814; font-size: 11px; flex: 1; font-weight: ${i < 3 ? 600 : 400};">${n.country}</span><span style="color: #A8925A; font-weight: 700; font-size: 12px;">${n.percentage}%</span></div>`).join("")}
    </div>
    <span class="page-number">4</span>
  </div>`;
}

function getPage5FullYearReview(fy: typeof fullYear2025): string {
  return `<div class="page" id="page-5">
    <h2>2025 Full Year Market Review</h2>
    <p>Dubai's 2025 full-year performance set historic records, driven by global capital inflows, Golden Visa expansions, and a growing millionaire population choosing to make the UAE their home.</p>
    <div class="stat-grid">
      <div class="stat-box"><div class="number">${fy.value}</div><div class="label">Full Year 2025 Value</div></div>
      <div class="stat-box"><div class="number">${fy.transactions.toLocaleString()}</div><div class="label">Total Transactions</div></div>
      <div class="stat-box"><div class="number">${fy.growth}</div><div class="label">YoY Growth</div></div>
    </div>
    <div class="chart-container">
      <h4 style="margin-top: 0; margin-bottom: 18px; color: #1A1814;">2025 Transaction Volume by Type (Source: DLD)</h4>
      <div class="bar-chart">
        <div class="bar-item"><span class="bar-label">Off-Plan</span><div class="bar-track"><div class="bar-fill" style="width: ${((fy.offPlan / fy.transactions) * 100).toFixed(0)}%;"><span class="bar-value">${fy.offPlan.toLocaleString()}</span></div></div></div>
        <div class="bar-item"><span class="bar-label">Secondary</span><div class="bar-track"><div class="bar-fill" style="width: ${((fy.secondary / fy.transactions) * 100).toFixed(0)}%; background: linear-gradient(90deg, #8A7648, #C4AA6A);"><span class="bar-value">${fy.secondary.toLocaleString()}</span></div></div></div>
        <div class="bar-item"><span class="bar-label">Cash</span><div class="bar-track"><div class="bar-fill" style="width: ${((fy.cash / fy.transactions) * 100).toFixed(0)}%;"><span class="bar-value">${fy.cash.toLocaleString()}</span></div></div></div>
        <div class="bar-item"><span class="bar-label">Mortgage</span><div class="bar-track"><div class="bar-fill" style="width: ${((fy.mortgage / fy.transactions) * 100).toFixed(0)}%; background: linear-gradient(90deg, #8A7648, #C4AA6A);"><span class="bar-value">${fy.mortgage.toLocaleString()}</span></div></div></div>
      </div>
    </div>
    <div class="two-col">
      <div class="info-card"><h4>Price Performance</h4><ul><li>Average Sale Price: AED 2.5M</li><li>Average Price/Sq Ft: AED 1,913</li><li>Price Growth: +17.4% (vs 2024)</li><li>Luxury segment: +90% YoY</li></ul></div>
      <div class="info-card"><h4>Population &amp; Demand</h4><ul><li>Population surpassed 4 million</li><li>9,800+ new millionaires in 2025</li><li>D33 Agenda: Double economy by 2033</li><li>Strong East-West buyer mix</li></ul></div>
    </div>
    <span class="page-number">5</span>
  </div>`;
}

function getPage6GdpRankings(): string {
  return `<div class="page" id="page-6">
    <h2>UAE GDP &amp; Global Rankings</h2>
    <p>The UAE is not just a real estate story — it is an economic powerhouse reshaping the global investment landscape.</p>
    <div class="stat-grid">
      <div class="stat-box"><div class="number">$509B</div><div class="label">UAE GDP 2024 (USD)</div></div>
      <div class="stat-box"><div class="number">$115B</div><div class="label">Dubai GDP 2024 (USD)</div></div>
      <div class="stat-box"><div class="number">4.1%</div><div class="label">UAE GDP Growth 2025 (IMF)</div></div>
    </div>
    <div class="chart-container">
      <h4 style="margin-top: 0; margin-bottom: 18px; color: #1A1814;">Global Financial Centre Rankings — GFCI 36</h4>
      <div class="bar-chart">
         <div class="bar-item"><span class="bar-label">New York</span><div class="bar-track"><div class="bar-fill" style="width: 100%; background: linear-gradient(90deg, #C4AA6A, #A8925A);"><span class="bar-value" style="color:#fff;">#1</span></div></div></div>
         <div class="bar-item"><span class="bar-label">London</span><div class="bar-track"><div class="bar-fill" style="width: 90%; background: linear-gradient(90deg, #B8A06A, #9A8A52);"><span class="bar-value" style="color:#fff;">#2</span></div></div></div>
         <div class="bar-item"><span class="bar-label">Singapore</span><div class="bar-track"><div class="bar-fill" style="width: 80%; background: linear-gradient(90deg, #A8925A, #8A7648);"><span class="bar-value" style="color:#fff;">#3</span></div></div></div>
         <div class="bar-item"><span class="bar-label">Hong Kong</span><div class="bar-track"><div class="bar-fill" style="width: 72%; background: linear-gradient(90deg, #9A8A52, #7A6A42);"><span class="bar-value" style="color:#fff;">#4</span></div></div></div>
         <div class="bar-item"><span class="bar-label">Dubai</span><div class="bar-track"><div class="bar-fill" style="width: 55%; background: linear-gradient(90deg, #D4AF37, #F5E6B8);"><span class="bar-value" style="color:#1A1814; font-weight:700;">#7 Global · #1 MENA</span></div></div></div>
      </div>
    </div>
    <div class="two-col">
      <div class="info-card"><h4>Population &amp; Tourism</h4><ul><li>UAE Population: 10.1M (2025)</li><li>Dubai Population: 4.1M (2025)</li><li>International Visitors: 17.15M (2024 DET)</li><li>Target: 25M visitors by 2025</li></ul></div>
      <div class="info-card"><h4>Investor Advantages</h4><ul><li>Zero personal income tax</li><li>100,000+ Golden Visas issued (2024)</li><li>USD-pegged stable currency (AED)</li><li>World-class infrastructure</li></ul></div>
    </div>
    <div class="highlight-box">
      <h4 style="margin-top: 0;">Sources</h4>
      <p style="margin-bottom: 0; font-size: 12px; color: #6B6459;">IMF World Economic Outlook • Dubai Department of Economy &amp; Tourism (DET) • Global Financial Centres Index (GFCI 36) • UAE Federal Competitiveness &amp; Statistics Authority</p>
    </div>
    <span class="page-number">6</span>
  </div>`;
}

function getPage7TransactionDashboard(liveYtd: any, downloadDate: string): string {
  return `<div class="page" id="page-7">
    <h2>Dubai Transaction Dashboard</h2>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <p style="margin: 0; color: #6B6459;">Live market statistics from the Dubai Land Department. Data refreshed at download.</p>
      <span style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.35); border-radius: 20px; padding: 5px 14px; font-size: 11px; color: #059669; font-weight: 600;">Updated ${downloadDate}</span>
    </div>
    <div class="stat-grid">
      <div class="stat-box"><div class="number">${liveYtd.value}</div><div class="label">2026 YTD Value</div></div>
      <div class="stat-box"><div class="number">${liveYtd.transactions.toLocaleString()}+</div><div class="label">2026 YTD Transactions</div></div>
      <div class="stat-box"><div class="number">${liveYtd.growth}</div><div class="label">YoY Growth</div></div>
    </div>
    <h3>Transaction Breakdown — 2026 YTD</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 18px 0;">
      <div class="info-card">
        <h4 style="margin-top: 0;">Transaction Type</h4>
        <div style="margin: 10px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #3A3632; font-size: 13px;">Off-Plan</span><span style="color: #A8925A; font-weight: 700;">${liveYtd.offPlan.toLocaleString()} (${((liveYtd.offPlan / (liveYtd.offPlan + liveYtd.secondary)) * 100).toFixed(0)}%)</span></div>
          <div style="width: 100%; height: 8px; background: rgba(168,146,90,0.12); border-radius: 4px;"><div style="height: 100%; width: ${((liveYtd.offPlan / (liveYtd.offPlan + liveYtd.secondary)) * 100).toFixed(0)}%; background: linear-gradient(90deg, #A8925A, #d4c4a0); border-radius: 4px;"></div></div>
        </div>
        <div style="margin: 10px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #3A3632; font-size: 13px;">Secondary</span><span style="color: #6B6459; font-weight: 700;">${liveYtd.secondary.toLocaleString()} (${((liveYtd.secondary / (liveYtd.offPlan + liveYtd.secondary)) * 100).toFixed(0)}%)</span></div>
          <div style="width: 100%; height: 8px; background: rgba(168,146,90,0.12); border-radius: 4px;"><div style="height: 100%; width: ${((liveYtd.secondary / (liveYtd.offPlan + liveYtd.secondary)) * 100).toFixed(0)}%; background: rgba(168,146,90,0.4); border-radius: 4px;"></div></div>
        </div>
      </div>
      <div class="info-card">
        <h4 style="margin-top: 0;">Payment Method</h4>
        <div style="margin: 10px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #3A3632; font-size: 13px;">Cash</span><span style="color: #059669; font-weight: 700;">${liveYtd.cash.toLocaleString()} (${((liveYtd.cash / (liveYtd.cash + liveYtd.mortgage)) * 100).toFixed(0)}%)</span></div>
          <div style="width: 100%; height: 8px; background: rgba(168,146,90,0.12); border-radius: 4px;"><div style="height: 100%; width: ${((liveYtd.cash / (liveYtd.cash + liveYtd.mortgage)) * 100).toFixed(0)}%; background: linear-gradient(90deg, #059669, #34d399); border-radius: 4px;"></div></div>
        </div>
        <div style="margin: 10px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #3A3632; font-size: 13px;">Mortgage</span><span style="color: #6B6459; font-weight: 700;">${liveYtd.mortgage.toLocaleString()} (${((liveYtd.mortgage / (liveYtd.cash + liveYtd.mortgage)) * 100).toFixed(0)}%)</span></div>
          <div style="width: 100%; height: 8px; background: rgba(168,146,90,0.12); border-radius: 4px;"><div style="height: 100%; width: ${((liveYtd.mortgage / (liveYtd.cash + liveYtd.mortgage)) * 100).toFixed(0)}%; background: rgba(168,146,90,0.4); border-radius: 4px;"></div></div>
        </div>
      </div>
    </div>
    <div class="highlight-box" style="text-align: center;">
      <p style="font-size: 11px; color: #8A8278; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px;">Gift Transactions 2026 YTD</p>
      <p style="font-family: 'Playfair Display', serif; font-size: 40px; color: #A8925A; margin: 0;">${liveYtd.gifts.toLocaleString()}</p>
    </div>
    <p style="font-size: 11px; color: #8A8278; text-align: center; margin-top: 10px;">Sources: Dubai Land Department (DLD) · DXB Interact · Property Finder · Bayut</p>
    <span class="page-number">7</span>
  </div>`;
}

function getPage8TopAreas(liveTopAreas: any[]): string {
  return `<div class="page" id="page-8">
    <h2>Top Areas by Transaction Volume</h2>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <p style="margin: 0; color: #6B6459;">2026 YTD — ranked by total registered transactions (DLD).</p>
      <span style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.35); border-radius: 20px; padding: 5px 14px; font-size: 11px; color: #059669; font-weight: 600;">Live Data</span>
    </div>
    <div class="chart-container">
      <div class="bar-chart">
        ${liveTopAreas.map((a: any, i: number) => {
          const maxTx = liveTopAreas[0].transactions;
          const pct = ((a.transactions / maxTx) * 100).toFixed(0);
          return `<div class="bar-item">
            <span class="bar-label" style="font-weight: ${i < 3 ? 700 : 400}; color: ${i < 3 ? '#A8925A' : '#6B6459'};">${a.area.split(' ').slice(0, 2).join(' ')}</span>
            <div class="bar-track"><div class="bar-fill" style="width: ${pct}%; ${i >= 3 ? 'background: linear-gradient(90deg, #8A7648, #C4AA6A);' : ''}"><span class="bar-value">${a.transactions.toLocaleString()}</span></div></div>
            <span style="font-size: 11px; color: #059669; width: 36px; flex-shrink: 0;">${a.change}</span>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="table-wrapper">
      <table>
        <tr><th>#</th><th>Area</th><th>Transactions</th><th>YoY Change</th></tr>
        ${liveTopAreas.map((a: any, i: number) => `<tr><td style="color: #A8925A; font-weight: 700;">${i + 1}</td><td style="font-weight: ${i < 3 ? 600 : 400}; color: #1A1814;">${a.area}</td><td style="color: #A8925A; font-weight: 700;">${a.transactions.toLocaleString()}</td><td><span style="color: #059669; font-size: 12px; font-weight: 600;">${a.change}</span></td></tr>`).join('')}
      </table>
    </div>
    <p style="font-size: 11px; color: #8A8278; text-align: center;">Sources: Dubai Land Department (DLD) · DXB Interact · Bayut</p>
    <span class="page-number">8</span>
  </div>`;
}

function getPage9Nationalities(liveNationalities: any[]): string {
  return `<div class="page" id="page-9">
    <h2>Top Buyer Nationalities</h2>
    <p style="color: #6B6459;">Dubai's buyer pool reflects its status as a global investment hub — attracting capital from every continent. 2026 YTD data from DLD.</p>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0;">
      ${liveNationalities.map((n: any, i: number) => `
      <div style="display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #FFFFFF; border-radius: 10px; border: 1px solid rgba(168,146,90,0.22);">
        <span style="color: #8A8278; font-size: 12px; width: 18px; font-weight: 600;">${i + 1}</span>
        <span style="font-size: 20px;">${n.flag}</span>
        <span style="color: #1A1814; font-size: 13px; flex: 1; font-weight: ${i < 3 ? 600 : 400};">${n.country}</span>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
          <span style="color: #A8925A; font-weight: 700; font-size: 14px;">${n.percentage}%</span>
          <span style="color: #8A8278; font-size: 10px;">${n.transactions.toLocaleString()} txns</span>
        </div>
      </div>`).join('')}
    </div>
    <div class="highlight-box">
      <h4 style="margin-top: 0;">Key Insight</h4>
      <p style="margin-bottom: 0;">Indian nationals consistently lead Dubai property purchases, driven by strong business ties, diaspora network, and attractive rental yields compared to home markets. The European buyer segment (UK, France, Germany) continues to grow as dollar-pegged returns attract Western capital.</p>
    </div>
    <p style="font-size: 11px; color: #8A8278; text-align: center;">Sources: Dubai Land Department (DLD) · DXB Interact</p>
    <span class="page-number">9</span>
  </div>`;
}

function getPage10PropertyTypes(): string {
  return `<div class="page" id="page-10">
    <h2>Property Types &amp; Rental Yields</h2>
    <p>The UAE real estate sector demonstrates remarkable resilience, driven by economic diversification and favorable policies.</p>
    <div class="chart-container">
      <h4 style="margin-top: 0; margin-bottom: 18px; color: #1A1814;">Price Per Sq Ft Growth (Source: Property Monitor)</h4>
      <div class="bar-chart">
        <div class="bar-item"><span class="bar-label">2022</span><div class="bar-track"><div class="bar-fill" style="width: 70%;"><span class="bar-value">AED 1,450</span></div></div></div>
        <div class="bar-item"><span class="bar-label">2023</span><div class="bar-track"><div class="bar-fill" style="width: 78%;"><span class="bar-value">AED 1,629</span></div></div></div>
        <div class="bar-item"><span class="bar-label">2024</span><div class="bar-track"><div class="bar-fill" style="width: 85%;"><span class="bar-value">AED 1,734</span></div></div></div>
        <div class="bar-item"><span class="bar-label">2025</span><div class="bar-track"><div class="bar-fill" style="width: 100%;"><span class="bar-value">AED 1,913</span></div></div></div>
      </div>
    </div>
    <h3>Property Segment Analysis (2025)</h3>
    <div class="table-wrapper">
      <table>
        <tr><th>Segment</th><th>Avg. Price</th><th>Avg. Size</th><th>Gross Yield</th><th>Top Unit</th></tr>
        <tr><td>Apartments</td><td>AED 1.77M</td><td>1,031 sq ft</td><td>6–8%</td><td>1-Bedroom</td></tr>
        <tr><td>Townhouses</td><td>AED 2.86M</td><td>2,100 sq ft</td><td>5–7%</td><td>3-Bedroom</td></tr>
        <tr><td>Villas</td><td>AED 6.2M</td><td>4,500 sq ft</td><td>4–6%</td><td>4-Bedroom</td></tr>
        <tr><td>Penthouses</td><td>AED 12M+</td><td>6,000+ sq ft</td><td>3–5%</td><td>Sky Villa</td></tr>
        <tr><td>Plots</td><td>Varies</td><td>Varies</td><td>Build strategy</td><td>Freehold</td></tr>
      </table>
    </div>
    <div class="two-col">
      <div class="info-card"><h4>Economic Drivers</h4><ul><li>Zero income tax policy</li><li>Golden Visa programme</li><li>GDP growth 4.1% (IMF 2025)</li><li>Tourism exceeding 17M visitors</li></ul></div>
      <div class="info-card"><h4>Market Dynamics</h4><ul><li>Population growth 2%+ annually</li><li>Urban Master Plan 2040</li><li>Infrastructure megaprojects</li><li>Expo 2020 legacy developments</li></ul></div>
    </div>
    <span class="page-number">10</span>
  </div>`;
}

function getPage11InvestmentIndicators(): string {
  return `<div class="page" id="page-11">
    <h2>Key Investment Indicators</h2>
    <p>Successful real estate investment requires understanding and monitoring key market indicators.</p>
    <div class="two-col">
      <div class="info-card"><h4>Transaction Volume</h4><p>Monthly counts indicate market momentum. Rising volumes suggest growing demand.</p></div>
      <div class="info-card"><h4>Price Per Sq. Ft.</h4><p>Compare against 3-year averages to identify value opportunities or overheated zones.</p></div>
      <div class="info-card"><h4>Rental Yield</h4><p>Annual rent ÷ Property value × 100. Dubai averages 6-8% gross yield.</p></div>
      <div class="info-card"><h4>Days on Market</h4><p>Properties selling under 30 days indicate strong demand and liquid market.</p></div>
    </div>
    <h3>Market Health Signals</h3>
    <div class="table-wrapper">
      <table>
        <tr><th>Indicator</th><th>Healthy Market</th><th>Caution Zone</th></tr>
        <tr><td>Transaction Growth YoY</td><td>5–15% increase</td><td>Over 25% or negative</td></tr>
        <tr><td>Price Growth YoY</td><td>3–10% increase</td><td>Over 20% (bubble risk)</td></tr>
        <tr><td>Rental Yield</td><td>6–8%</td><td>Under 4% (overvalued)</td></tr>
        <tr><td>Supply Pipeline</td><td>Moderate (2–3% of stock)</td><td>Over 5% of existing stock</td></tr>
      </table>
    </div>
    <div class="highlight-box">
      <h4 style="margin-top: 0;">Pro Tip: Data Sources</h4>
      <p style="margin-bottom: 0;">Access real-time transaction data through DXB Interact (mo.dld.gov.ae), Property Finder, Bayut, and Property Monitor for comprehensive market analytics. Khaleej Times property section provides daily news and GDP updates.</p>
    </div>
    <div class="two-col">
      <div class="info-card"><h4>Transaction Costs</h4><ul class="checklist"><li>DLD Registration Fee: 4%</li><li>Agency Commission: 2%</li><li>NOC Fee: AED 500–5,000</li><li>Mortgage Registration: 0.25%</li></ul></div>
      <div class="info-card"><h4>Financing</h4><ul class="checklist"><li>UAE Nationals: up to 80% LTV</li><li>Expats: up to 75% LTV</li><li>Mortgage rates: 3.5–5.5% p.a.</li><li>Pre-approval within 24–48h</li></ul></div>
    </div>
    <span class="page-number">11</span>
  </div>`;
}

function getPage12CommunityGuide(): string {
  return `<div class="page" id="page-12">
    <h2>Community Comparison Guide</h2>
    <p>Location drives long-term value. Use this framework to compare communities objectively.</p>
    <div class="table-wrapper">
      <table>
        <tr><th>Community</th><th>Avg. PSF</th><th>Rental Yield</th><th>Best For</th></tr>
        <tr><td style="font-weight: 600; color: #1A1814;">Dubai Marina</td><td>AED 1,400–2,000</td><td>6–7%</td><td>Rental income, tourism</td></tr>
        <tr><td style="font-weight: 600; color: #1A1814;">Downtown Dubai</td><td>AED 2,000–3,500</td><td>5–6%</td><td>Capital appreciation</td></tr>
        <tr><td style="font-weight: 600; color: #1A1814;">JVC</td><td>AED 800–1,100</td><td>7–9%</td><td>High yield, entry-level</td></tr>
        <tr><td style="font-weight: 600; color: #1A1814;">Dubai Hills</td><td>AED 1,200–1,800</td><td>5–7%</td><td>Family, long-term growth</td></tr>
        <tr><td style="font-weight: 600; color: #1A1814;">Palm Jumeirah</td><td>AED 2,500–5,000+</td><td>4–5%</td><td>Luxury, prestige</td></tr>
        <tr><td style="font-weight: 600; color: #1A1814;">Business Bay</td><td>AED 1,300–1,800</td><td>6–7%</td><td>Commercial proximity</td></tr>
        <tr><td style="font-weight: 600; color: #1A1814;">Dubai Creek Harbour</td><td>AED 1,200–1,600</td><td>6–8%</td><td>New waterfront, growth</td></tr>
        <tr><td style="font-weight: 600; color: #1A1814;">Jumeirah Lake Towers</td><td>AED 900–1,300</td><td>7–9%</td><td>Business, transit hub</td></tr>
      </table>
    </div>
    <h3>Location Factors</h3>
    <ul>
      <li><strong>Connectivity:</strong> Metro access, highway proximity, airport distance</li>
      <li><strong>Amenities:</strong> Schools, hospitals, shopping, beaches, parks</li>
      <li><strong>Supply Pipeline:</strong> Upcoming projects that may impact prices</li>
      <li><strong>Demographics:</strong> Target tenant profile and nationality mix</li>
    </ul>
    <div class="highlight-box">
      <h4 style="margin-top: 0;">Emerging Areas to Watch in 2026</h4>
      <p style="margin-bottom: 0;">Dubai South, Mohammed Bin Rashid City, Dubai Islands, and areas along the new metro extensions offer potential for early-stage capital appreciation. Dubai Creek Harbour (+31% YoY) leads growth.</p>
    </div>
    <span class="page-number">12</span>
  </div>`;
}

function getPage13DeveloperFramework(): string {
  return `<div class="page" id="page-13">
    <h2>Developer Analysis Framework</h2>
    <p>Choosing the right developer is crucial, especially for off-plan purchases. Use this framework.</p>
    <div class="table-wrapper">
      <table>
        <tr><th>Factor</th><th>What to Check</th><th>Weight</th></tr>
        <tr><td>Track Record</td><td>Number of completed projects, years in market</td><td>25%</td></tr>
        <tr><td>Delivery History</td><td>On-time completion rate, delays</td><td>25%</td></tr>
        <tr><td>Build Quality</td><td>Materials, finishes, post-handover reviews</td><td>20%</td></tr>
        <tr><td>Financial Stability</td><td>Parent company, escrow compliance</td><td>15%</td></tr>
        <tr><td>After-Sales</td><td>Community management, maintenance</td><td>15%</td></tr>
      </table>
    </div>
    <div class="two-col">
      <div class="info-card"><h4>Tier 1: Master Developers</h4><ul><li>Emaar, Nakheel, DAMAC, Dubai Properties</li><li>Extensive track record (15+ years)</li><li>Iconic projects portfolio</li><li>Lower risk, moderate returns</li></ul></div>
      <div class="info-card"><h4>Tier 2: Established Developers</h4><ul><li>Sobha, Ellington, Meraas, Binghatti</li><li>Proven delivery (5–15 years)</li><li>Growing portfolio</li><li>Balanced risk-return profile</li></ul></div>
    </div>
    <h3 style="margin-top: 24px; margin-bottom: 14px;">Top 5 Developers by Transaction Volume (2026 YTD)</h3>
    <div class="table-wrapper">
      <table>
        <tr><th>Developer</th><th>Transactions</th><th>Volume (AED)</th><th>Tier</th></tr>
        <tr><td><strong>Emaar Properties</strong></td><td>12,450+</td><td>AED 28.4B</td><td><span style="background:rgba(168,146,90,0.15);color:#A8925A;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">Tier 1</span></td></tr>
        <tr><td><strong>DAMAC Properties</strong></td><td>8,320+</td><td>AED 15.7B</td><td><span style="background:rgba(168,146,90,0.15);color:#A8925A;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">Tier 1</span></td></tr>
        <tr><td><strong>Nakheel</strong></td><td>5,890+</td><td>AED 14.2B</td><td><span style="background:rgba(168,146,90,0.15);color:#A8925A;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">Tier 1</span></td></tr>
        <tr><td><strong>Sobha Realty</strong></td><td>4,120+</td><td>AED 11.9B</td><td><span style="background:rgba(45,106,122,0.12);color:#2d6a7a;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">Tier 2</span></td></tr>
        <tr><td><strong>Ellington Properties</strong></td><td>2,870+</td><td>AED 9.4B</td><td><span style="background:rgba(45,106,122,0.12);color:#2d6a7a;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">Tier 2</span></td></tr>
      </table>
    </div>
    <div class="warning-box">
      <h4>Due Diligence Essentials</h4>
      <p style="margin-bottom: 0;">Always verify: RERA registration, escrow account details, project approvals, and visit at least 2–3 completed projects before committing to off-plan.</p>
    </div>
    <span class="page-number">13</span>
  </div>`;
}

function getPage14OffPlanVsReady(liveYtd: any): string {
  return `<div class="page" id="page-14">
    <h2>Off-Plan vs Ready Properties</h2>
    <p>Understanding the trade-offs is essential for aligning investments with your goals.</p>
    <div class="table-wrapper">
      <table>
        <tr><th>Factor</th><th>Off-Plan</th><th>Ready Property</th></tr>
        <tr><td>Entry Price</td><td>10–20% below market</td><td>Market rate</td></tr>
        <tr><td>Payment</td><td>Installments (40/60 typical)</td><td>Full or mortgage</td></tr>
        <tr><td>Rental Income</td><td>Delayed (2–4 years)</td><td>Immediate</td></tr>
        <tr><td>Price Risk</td><td>Market fluctuation exposure</td><td>Known current value</td></tr>
        <tr><td>Inspection</td><td>Model only</td><td>Physical inspection</td></tr>
      </table>
    </div>
    <div class="two-col">
      <div class="info-card"><h4>When to Choose Off-Plan</h4><ul class="checklist"><li>3–5 year investment horizon</li><li>Developer has strong delivery record</li><li>Location has proven demand drivers</li><li>Payment plan suits your cash flow</li></ul></div>
      <div class="info-card"><h4>When to Choose Ready</h4><ul class="checklist"><li>Need immediate rental income</li><li>Want to physically inspect before buying</li><li>Financing with a mortgage</li><li>Prefer lower uncertainty</li></ul></div>
    </div>
    <div class="highlight-box">
      <h4 style="margin-top: 0;">2026 Market Trend</h4>
      <p style="margin-bottom: 0;">Off-plan transactions represent ${((liveYtd.offPlan / (liveYtd.offPlan + liveYtd.secondary)) * 100).toFixed(0)}% of all 2026 YTD sales, reflecting strong investor confidence in developer pipelines and pre-handover capital gains potential.</p>
    </div>
    <span class="page-number">14</span>
  </div>`;
}

function getPage15DueDiligence(): string {
  return `<div class="page" id="page-15">
    <h2>Due Diligence Checklist</h2>
    <p>Thorough due diligence protects your investment. Use this comprehensive checklist before every transaction.</p>
    <div class="two-col">
      <div>
        <h3>For All Properties</h3>
        <ul class="checklist"><li>Verify seller ownership through DLD title deed</li><li>Confirm no outstanding service charges</li><li>Check developer NOC requirements and fees</li><li>Review service charge history and budget</li><li>Understand community rules and restrictions</li><li>Research recent comparable transactions</li><li>Calculate total acquisition costs (4% DLD + fees)</li></ul>
        <h3>Off-Plan Specific</h3>
        <ul class="checklist"><li>Verify RERA registration and project number</li><li>Confirm escrow account details</li><li>Review Sales and Purchase Agreement</li><li>Check developer completion track record</li><li>Understand cancellation and refund policies</li><li>Visit completed projects by same developer</li></ul>
      </div>
      <div>
        <h3>Ready Property Specific</h3>
        <ul class="checklist"><li>Conduct physical inspection (or hire snagging co.)</li><li>Check for structural issues, water damage, HVAC</li><li>Verify actual size matches title deed</li><li>Review tenant contract if occupied</li><li>Assess renovation or maintenance needs</li><li>Test all appliances and systems</li></ul>
        <div class="highlight-box" style="margin-top: 18px;">
          <h4 style="margin-top: 0;">Official RERA Portal</h4>
          <p style="margin-bottom: 0; font-size: 12px;">Verify any developer or project at <strong>rera.gov.ae</strong> — always check before signing any SPA or booking form.</p>
        </div>
        <h3 style="margin-top: 22px; font-size: 15px;">Professional Team You Need</h3>
        <ul class="checklist"><li>RERA-licensed Broker (verify on RERA portal)</li><li>Property Lawyer (SPA review &amp; title checks)</li><li>Mortgage Advisor (if financing)</li><li>Snagging Inspector (for ready properties)</li><li>Financial Planner (ROI &amp; tax strategy)</li></ul>
        <div class="warning-box" style="margin-top: 18px;">
          <h4 style="margin-top: 0; font-size: 13px;">🚩 Red Flags to Avoid</h4>
          <ul style="margin: 0;"><li style="color:#5C1A1A; border-bottom-color: rgba(180,20,20,0.15); font-size: 12px;">Seller avoiding DLD verification checks</li><li style="color:#5C1A1A; border-bottom-color: rgba(180,20,20,0.15); font-size: 12px;">No RERA escrow account on off-plan project</li><li style="color:#5C1A1A; border-bottom-color: rgba(180,20,20,0.15); font-size: 12px;">Developer with zero completed projects</li><li style="color:#5C1A1A; border-bottom-color: rgba(180,20,20,0.15); font-size: 12px;">Price significantly below market rate</li><li style="color:#5C1A1A; border-bottom-color: rgba(180,20,20,0.15); font-size: 12px;">Pressure to sign without legal review</li></ul>
        </div>
      </div>
    </div>
    <span class="page-number">15</span>
  </div>`;
}

function getPage16MarketOutlook(liveYtd: any): string {
  return `<div class="page" id="page-16">
    <h2>Market Outlook 2026</h2>
    <p>Based on 2025's exceptional performance and strong macroeconomic fundamentals, 2026 presents compelling selective opportunities.</p>
    <h3 style="margin-bottom: 12px;">2025 Full Year vs 2026 YTD</h3>
    <div class="table-wrapper" style="margin-top: 0;">
      <table>
        <tr><th>Metric</th><th style="color:#6B6459;">2025 Full Year</th><th style="color:#A8925A;">2026 YTD</th></tr>
        <tr><td>Transaction Value</td><td style="color:#6B6459;">${fullYear2025.value}</td><td style="color:#A8925A; font-weight:600;">${liveYtd.value}</td></tr>
        <tr><td>Total Transactions</td><td style="color:#6B6459;">${fullYear2025.transactions.toLocaleString()}</td><td style="color:#A8925A; font-weight:600;">${liveYtd.transactions.toLocaleString()}</td></tr>
        <tr><td>YoY Growth</td><td style="color:#6B6459;">${fullYear2025.growth}</td><td style="color:#A8925A; font-weight:600;">${liveYtd.growth}</td></tr>
        <tr><td>Off-Plan Share</td><td style="color:#6B6459;">${Math.round((fullYear2025.offPlan / fullYear2025.transactions) * 100)}%</td><td style="color:#A8925A; font-weight:600;">${Math.round((liveYtd.offPlan / liveYtd.transactions) * 100)}%</td></tr>
        <tr><td>Top Area</td><td style="color:#6B6459;">Jumeirah Village Circle</td><td style="color:#A8925A; font-weight:600;">${liveYtd.topArea}</td></tr>
      </table>
    </div>
    <div class="stat-grid">
      <div class="stat-box"><div class="number">600B+</div><div class="label">Projected AED Transactions</div></div>
      <div class="stat-box"><div class="number">5–10%</div><div class="label">Expected Price Growth</div></div>
      <div class="stat-box"><div class="number">96,500</div><div class="label">New Units Delivery</div></div>
    </div>
    <h3>Supply Forecast 2025–2028</h3>
    <div class="table-wrapper">
      <table>
        <tr><th>Year</th><th>Expected Units</th><th>Key Areas</th></tr>
        <tr><td>2025</td><td>81,084</td><td>JVC, Al Furjan, Arabian Ranches 3</td></tr>
        <tr><td>2026</td><td>96,500</td><td>Arjan, Business Bay, Dubai Hills</td></tr>
        <tr><td>2027</td><td>84,979</td><td>Damac Lagoons, The Valley</td></tr>
        <tr><td>2028</td><td>45,480</td><td>Dubai Harbour, Maritime City</td></tr>
      </table>
    </div>
    <div class="highlight-box">
      <h4 style="margin-top: 0;">Our Perspective</h4>
      <p style="margin-bottom: 0;">At JBJ Global Real Estate, we believe 2026 presents selective opportunities for buyers who do proper due diligence. The market is maturing — quality over quantity will define successful investments. Creek Harbour, Dubai South, and luxury waterfront segments offer the most compelling risk-adjusted returns.</p>
    </div>
    <span class="page-number">16</span>
  </div>`;
}

function getPage17RiskManagement(): string {
  return `<div class="page" id="page-17">
    <h2>Risk Management</h2>
    <p>Every investment carries risk. Smart investors identify, assess, and mitigate risks proactively.</p>
    <div class="two-col">
      <div class="info-card"><h4>Market Risks</h4><ul><li>Price corrections in oversupplied segments</li><li>Currency fluctuations (for non-USD investors)</li><li>Global economic slowdown impact</li><li>Regulatory changes in ownership laws</li></ul></div>
      <div class="info-card"><h4>Developer Risks</h4><ul><li>Delivery delays (6–24 months common)</li><li>Quality deviations from specification</li><li>Developer financial distress</li><li>Community mismanagement post-handover</li></ul></div>
    </div>
    <h3>Mitigation Strategies</h3>
    <ul>
      <li><strong>Diversification:</strong> Spread investments across communities and property types</li>
      <li><strong>Due Diligence:</strong> Follow our checklist rigorously for every transaction</li>
      <li><strong>Developer Selection:</strong> Prioritise Tier 1–2 developers for off-plan</li>
      <li><strong>Cash Buffer:</strong> Maintain reserves for service charges and vacancies</li>
      <li><strong>Professional Support:</strong> Work with licensed brokers (RERA-certified) and legal advisors</li>
    </ul>
    <div class="warning-box">
      <h4>Common Investor Mistakes</h4>
      <ul style="margin-bottom: 0;"><li>Chasing hot tips without independent research</li><li>Over-leveraging with multiple off-plan commitments</li><li>Ignoring service charges and maintenance costs</li><li>Buying based on renders instead of visiting sites</li><li>Skipping legal review of SPA documentation</li></ul>
    </div>
    <span class="page-number">17</span>
  </div>`;
}

function getPage18AIMatchmaker(qrUrl: string, websiteUrl: string): string {
  return `<div class="page" id="page-18">
    <h2>AI Property Matchmaker</h2>
    <p>JBJ Global Real Estate has developed an exclusive AI-powered Property Matchmaker to help buyers identify properties aligned with their specific criteria and investment goals.</p>
    <div style="background: linear-gradient(135deg, #1A1814 0%, #2C2A26 100%); border: 1px solid rgba(168,146,90,0.4); border-radius: 16px; padding: 28px; margin: 24px 0;">
      <p style="color: #A8925A; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 10px;">Premium AI Technology</p>
      <p style="color: #FFFFFF; font-size: 17px; margin-bottom: 5px; font-weight: 600; font-family: 'Playfair Display', serif;">Exclusive for JBJ Global Real Estate</p>
      <p style="color: rgba(212,196,160,0.7); font-size: 13px; margin-bottom: 0;">Powered by advanced property intelligence • Developed in-house by the JBJ team</p>
    </div>
    <div class="two-col">
      <div class="info-card"><h4>How It Works</h4><ul><li>Complete a quick property goals questionnaire</li><li>AI analyses preferences vs available stock</li><li>Receive personalised recommendations</li><li>Connect with our team for consultation</li></ul></div>
      <div class="info-card"><h4>What We Assess</h4><ul><li>Budget range &amp; investment timeline</li><li>Risk tolerance &amp; income vs growth focus</li><li>Property type &amp; location priorities</li><li>Off-plan vs ready preference</li></ul></div>
    </div>
    <div class="qr-section">
      <img class="qr-code" src="${qrUrl}" alt="AI Property Matchmaker QR" />
      <div>
        <h3 style="margin-top: 0; margin-bottom: 10px;">Try Our AI Property Matchmaker</h3>
        <p>Scan this QR code or visit our website to access the complimentary AI assessment tool — created by the founder to help you find the perfect property fit.</p>
        <p style="color: #A8925A; font-weight: 600; margin-bottom: 14px;"><a href="${websiteUrl}/quiz" style="color: #A8925A; text-decoration: none;">${websiteUrl}/quiz</a></p>
        <a href="${websiteUrl}/quiz" target="_blank" style="display: inline-block; background: linear-gradient(90deg, #A8925A, #C4AA6A); color: #1A1814; font-weight: 700; font-size: 13px; padding: 11px 24px; border-radius: 8px; text-decoration: none; letter-spacing: 0.03em;">Start AI Property Finder →</a>
      </div>
    </div>
    <div style="background: #FFFFFF; border: 1px solid rgba(168,146,90,0.25); border-radius: 14px; padding: 18px 22px; margin: 18px 0;">
      <h4 style="margin-top: 0; margin-bottom: 10px; text-align: center;">Stay in the Loop</h4>
      <div style="display: flex; gap: 12px; justify-content: center; align-items: center;">
        <a href="https://www.instagram.com/jbj.ae" target="_blank" style="display: flex; align-items: center; gap: 6px; color: #A8925A; text-decoration: none; font-size: 12px; padding: 7px 14px; border: 1px solid rgba(168,146,90,0.35); border-radius: 8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>Instagram</a>
        <a href="https://www.tiktok.com/@jbj.ae" target="_blank" style="display: flex; align-items: center; gap: 6px; color: #A8925A; text-decoration: none; font-size: 12px; padding: 7px 14px; border: 1px solid rgba(168,146,90,0.35); border-radius: 8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.17v-3.44a4.85 4.85 0 01-4.84-1.08V6.69h4.84z"/></svg>TikTok</a>
        <a href="https://youtube.com/@jbjglobalrealestate" target="_blank" style="display: flex; align-items: center; gap: 6px; color: #A8925A; text-decoration: none; font-size: 12px; padding: 7px 14px; border: 1px solid rgba(168,146,90,0.35); border-radius: 8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>YouTube</a>
        <a href="https://www.linkedin.com/company/jbj-global-real-estate/" target="_blank" style="display: flex; align-items: center; gap: 6px; color: #A8925A; text-decoration: none; font-size: 12px; padding: 7px 14px; border: 1px solid rgba(168,146,90,0.35); border-radius: 8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>LinkedIn</a>
      </div>
      <p style="text-align: center; font-size: 11px; color: #8A8278; margin: 10px 0 0 0;">Follow us for daily Dubai market updates, property drops &amp; investment insights.</p>
    </div>
    <div class="disclaimer">
      <strong>Disclaimer:</strong> This document is for educational purposes only and does not constitute investment, financial, or legal advice. Data sourced from Dubai Land Department (DLD), RERA, Property Monitor, DXB Interact, Bayut, Property Finder, and Khaleej Times. While we strive for accuracy, readers should verify information independently. Real estate investments involve risks, including potential loss of capital. Past performance is not indicative of future results.
    </div>
    <span class="page-number">18</span>
  </div>`;
}

function getPage19LatestNews(latestNews: any[], downloadDate: string): string {
  return `<div class="page" id="page-19">
    <h2>Latest Market News</h2>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 26px;">
      <p style="margin: 0; color: #6B6459;">The latest headlines from official UAE sources — updated at download.</p>
      <span style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.35); border-radius: 20px; padding: 5px 14px; font-size: 11px; color: #059669; font-weight: 600;">Updated ${downloadDate}</span>
    </div>
    ${latestNews.length > 0 ? latestNews.map((n: any) => `
    <div style="background: #FFFFFF; border: 1px solid rgba(168,146,90,0.2); border-left: 3px solid #A8925A; border-radius: 12px; padding: 18px 20px; margin-bottom: 14px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; margin-bottom: 7px;">
        <span style="background: rgba(168,146,90,0.12); color: #A8925A; padding: 3px 9px; border-radius: 6px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${n.category || 'Market Update'}</span>
        <span style="color: #8A8278; font-size: 11px; white-space: nowrap;">${n.published_date ? new Date(n.published_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
      </div>
      <h4 style="color: #1A1814; font-size: 14px; margin: 7px 0; line-height: 1.4;">${n.title}</h4>
      <p style="color: #6B6459; font-size: 12px; margin: 0; line-height: 1.6;">${(n.excerpt || '').slice(0, 200)}${(n.excerpt || '').length > 200 ? '...' : ''}</p>
      <div style="margin-top: 8px; font-size: 10px; color: #8A8278;">Source: ${n.source || 'Official UAE Sources'}</div>
    </div>`).join('') : '<p style="color: #8A8278; text-align: center; padding: 40px;">No recent news available. Visit JBJ.ae/news for the latest updates.</p>'}
    <div class="section-footer-link">
      <p style="margin: 0;">For full articles and daily market analysis: <a href="https://JBJ.ae/news">JBJ.ae/news</a> · <a href="https://khaleejtimes.com/real-estate" style="color: #A8925A; text-decoration: none; font-weight: 600;">Khaleej Times Real Estate</a></p>
    </div>
    <span class="page-number">19</span>
  </div>`;
}

function getPage20FeaturedAreas(featuredAreas: any[], downloadDate: string): string {
  return `<div class="page" id="page-20">
    <h2>Featured Areas</h2>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px;">
      <p style="margin: 0; color: #6B6459;">Top communities by transaction volume — live from our database.</p>
      <span style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.35); border-radius: 20px; padding: 5px 14px; font-size: 11px; color: #059669; font-weight: 600;">Updated ${downloadDate}</span>
    </div>
    ${featuredAreas.length > 0 ? `
    <div class="area-grid">
      ${featuredAreas.map((a: any) => `
      <a href="https://JBJ.AE/area/${a.slug}" class="area-card" target="_blank">
        ${a.image_url ? `<img src="${a.image_url}" alt="${a.name}" style="aspect-ratio: 4/3; object-fit: cover;" onerror="this.style.background='#F5EBD7'; this.style.aspectRatio='4/3';" />` : `<div style="aspect-ratio: 4/3; background: linear-gradient(135deg, #F5EBD7, #E8DCC8); display: flex; align-items: center; justify-content: center;"><span style="font-family: 'Playfair Display', serif; font-size: 22px; color: rgba(168,146,90,0.3); font-weight: 700;">JBJ</span></div>`}
        <div class="area-card-body">
          ${a.is_trending ? '<span class="badge-trending">● Trending</span>' : ''}
          ${a.is_high_demand && !a.is_trending ? '<span class="badge-demand">● High Demand</span>' : ''}
          <div class="area-name">${a.name}</div>
          <div class="area-meta">${a.emirate || 'Dubai'} · ${(a.property_count || 0)} projects</div>
          <a href="https://JBJ.AE/area/${a.slug}" class="area-link" target="_blank">Explore →</a>
        </div>
      </a>`).join('')}
    </div>` : `<p style="color: #8A8278; text-align: center; padding: 40px;">Visit JBJ.ae/areas for all communities.</p>`}
    <div class="section-footer-link">
      <p style="margin: 0; font-size: 13px;">Explore All Areas → <a href="https://JBJ.AE/areas">JBJ.AE/areas</a></p>
    </div>
    <span class="page-number">20</span>
  </div>`;
}

function getPage21FeaturedDevelopers(featuredDevelopers: any[]): string {
  return `<div class="page" id="page-21">
    <h2>Featured Developers</h2>
    <p style="color: #6B6459;">Top-tier developers shaping Dubai's skyline — each backed by a proven delivery track record.</p>
    ${featuredDevelopers.length > 0 ? `
    <div class="area-grid" style="gap: 12px;">
      ${featuredDevelopers.map((d: any) => `
      <a href="https://JBJ.AE/developers/${d.slug}" class="area-card" target="_blank" style="text-align: center;">
        ${d.logo_url ? `<div style="aspect-ratio: 4/3; background: #FFFFFF; display: flex; align-items: center; justify-content: center; padding: 8px;"><img src="${d.logo_url}" alt="${d.name}" style="max-height: 80%; max-width: 85%; object-fit: contain;" onerror="this.parentElement.innerHTML='<span style=&quot;font-family: Playfair Display, serif; font-size: 14px; color: #A8925A; font-weight: 700;&quot;>' + '${d.name.split(' ')[0]}' + '</span>'" /></div>` : `<div style="aspect-ratio: 4/3; background: linear-gradient(135deg, #F5EBD7, #E8DCC8); display: flex; align-items: center; justify-content: center;"><span style="font-family: 'Playfair Display', serif; font-size: 14px; color: #A8925A; font-weight: 700;">${d.name.split(' ')[0]}</span></div>`}
        <div class="area-card-body" style="text-align: center;">
          <div class="area-name" style="text-align: center;">${d.name}</div>
          <a href="https://JBJ.AE/developers/${d.slug}" class="area-link" target="_blank" style="display: block; text-align: center; margin-top: 3px;">View Projects →</a>
        </div>
      </a>`).join('')}
    </div>` : `
    <div class="area-grid" style="gap: 12px;">
      ${["Emaar Properties","DAMAC Properties","Sobha Realty","Nakheel","Aldar Properties","Meraas","Ellington Properties","Binghatti Developers"].map((name) => `
      <div class="area-card" style="text-align: center;">
        <div style="aspect-ratio: 4/3; background: linear-gradient(135deg, #F5EBD7, #E8DCC8); display: flex; align-items: center; justify-content: center;">
          <span style="font-family: 'Playfair Display', serif; font-size: 14px; color: #A8925A; font-weight: 700;">${name.split(' ')[0]}</span>
        </div>
        <div class="area-card-body" style="text-align: center;">
          <div class="area-name" style="text-align: center;">${name}</div>
        </div>
      </div>`).join('')}
    </div>`}
    <div class="section-footer-link">
      <p style="margin: 0; font-size: 13px;">Explore All Developers → <a href="https://JBJ.AE/developers">JBJ.AE/developers</a></p>
    </div>
    <span class="page-number">21</span>
  </div>`;
}

function formatPrice(p: any): string {
  return p.price_from ? `AED ${(Math.round(Number(p.price_from)) >= 1000000 ? (Math.round(Number(p.price_from)) / 1000000).toFixed(1) + 'M' : Math.round(Number(p.price_from)).toLocaleString())}` : 'Price on request';
}

function renderProjectCard(p: any): string {
  const priceStr = formatPrice(p);
  return `<a href="https://JBJ.AE/projects/${p.slug || ''}" class="area-card" target="_blank" style="display: block; text-decoration: none;">
    ${p.cover_image_url ? `<img src="${p.cover_image_url}" alt="${p.name}" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; background: #F5EBD7;" onerror="this.style.display='none'" />` : `<div style="aspect-ratio: 4/3; background: linear-gradient(135deg, #F5EBD7, #E8DCC8); display: flex; align-items: center; justify-content: center;"><span style="font-family: 'Playfair Display', serif; font-size: 16px; color: rgba(168,146,90,0.5); font-weight: 700;">JBJ</span></div>`}
    <div class="area-card-body">
      <div class="area-name">${p.name}</div>
      <div class="area-meta">${p.area_name || p.location || 'Dubai, UAE'}</div>
      ${p.developer_name ? `<div class="area-meta" style="color: #A8925A;">${p.developer_name}</div>` : ''}
      <div style="color: #A8925A; font-weight: 700; font-size: 11px; margin-top: 4px;">From ${priceStr}</div>
    </div>
  </a>`;
}

function getPage22FeaturedProjects(featuredProjects: any[], downloadDate: string): string {
  return `<div class="page" id="page-22">
    <h2>Featured Projects</h2>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
      <p style="margin: 0; color: #6B6459;">Latest published projects available through JBJ Global Real Estate.</p>
      <span style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.35); border-radius: 20px; padding: 5px 14px; font-size: 11px; color: #059669; font-weight: 600;">Updated ${downloadDate}</span>
    </div>
    ${featuredProjects.length > 0 ? `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
      ${featuredProjects.slice(0, 4).map(renderProjectCard).join('')}
    </div>` : `<p style="color: #8A8278; text-align: center; padding: 40px;">Visit JBJ.ae/projects to explore our full portfolio.</p>`}
    <span class="page-number">22</span>
  </div>
  ${featuredProjects.length > 4 ? `
  <div class="page" id="page-22b">
    <h2>Featured Projects <span style="font-size: 16px; color: #8A8278; font-weight: 400;">(continued)</span></h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 16px;">
      ${featuredProjects.slice(4).map(renderProjectCard).join('')}
    </div>
    <div class="section-footer-link" style="margin-top: auto;">
      <p style="margin: 0; font-size: 13px;">Explore All Projects → <a href="https://JBJ.AE/projects">JBJ.AE/projects</a></p>
    </div>
  </div>` : ''}`;
}

function getPage23ExploreAndContact(qrUrl: string, websiteUrl: string): string {
  return `<div class="page" id="page-23">
    <h2>Explore JBJ.AE</h2>
    <p style="color: #6B6459; text-align: center; margin-bottom: 28px;">Everything you need in one place — properties, areas, developers, market intelligence, and AI tools.</p>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px;">
      ${[
        { label: 'Properties', url: '/properties', svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A8925A" stroke-width="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V12h6v10"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01"/></svg>' },
        { label: 'Areas', url: '/areas', svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A8925A" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
        { label: 'Developers', url: '/developers', svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A8925A" stroke-width="1.5"><path d="M2 20h20M5 20V8l7-5 7 5v12"/><path d="M9 20v-4h6v4"/></svg>' },
        { label: 'Market Intel', url: '/market-intelligence', svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A8925A" stroke-width="1.5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>' },
        { label: 'AI Tools', url: '/ai-tools', svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A8925A" stroke-width="1.5"><path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"/><path d="M6 10v1a6 6 0 0012 0v-1"/><path d="M12 17v4M8 21h8"/></svg>' },
        { label: 'Guides', url: '/guides', svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A8925A" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>' },
        { label: 'News', url: '/news', svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A8925A" stroke-width="1.5"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></svg>' },
        { label: 'Contact', url: '/contact', svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A8925A" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>' },
      ].map(item => `
      <a href="https://JBJ.AE${item.url}" target="_blank" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px 10px; background: #FFFFFF; border: 1px solid rgba(168,146,90,0.3); border-radius: 12px; text-decoration: none; gap: 6px;">
        ${item.svg}
        <span style="font-size: 11px; font-weight: 600; color: #1A1814; text-align: center; line-height: 1.3;">${item.label}</span>
        <span style="font-size: 9px; color: #A8925A;">JBJ.AE${item.url}</span>
      </a>`).join('')}
    </div>
    <div class="identity-card">
      <div class="identity-card-logo"><div class="monogram">JBJ</div><div style="width: 40px; height: 1px; background: rgba(168,146,90,0.5); margin: 10px 0;"></div><div class="rera">Real Estate</div><div class="rera" style="margin-top: 4px;">Brokerage</div></div>
      <div style="flex: 1;">
        <div class="identity-card-details">
          <div class="company-name">JBJ Global Real Estate L.L.C S.O.C.</div>
          <div style="width: 60px; height: 1px; background: rgba(168,146,90,0.5); margin: 10px 0;"></div>
          <div class="detail-row"><span class="icon" style="font-size:14px;">☎</span><a href="tel:+971565911000" style="color: rgba(212,196,160,0.85); text-decoration: none;">+971 56 591 1000</a></div>
          <div class="detail-row"><span class="icon" style="font-size:14px;">✉</span><a href="mailto:CONTACT@JBJ.AE" style="color: rgba(212,196,160,0.85); text-decoration: none;">CONTACT@JBJ.AE</a></div>
          <div class="detail-row"><span class="icon" style="font-size:14px;">⌖</span><span>Downtown Dubai, UAE</span></div>
          <div class="detail-row"><span class="icon" style="font-size:14px;">⊕</span><a href="https://JBJ.AE" style="color: rgba(212,196,160,0.85); text-decoration: none;">JBJ.AE</a></div>
        </div>
        <div class="identity-card-bottom">
          <div style="display: flex; gap: 10px;">
            <a href="https://instagram.com/jbjglobalrealestate" target="_blank" style="color: rgba(168,146,90,0.7); font-size: 10px; text-decoration: none; letter-spacing: 0.05em;">Instagram</a>
            <a href="https://tiktok.com/@jbjglobalrealestate" target="_blank" style="color: rgba(168,146,90,0.7); font-size: 10px; text-decoration: none; letter-spacing: 0.05em;">TikTok</a>
            <a href="https://youtube.com/@jbjglobalrealestate" target="_blank" style="color: rgba(168,146,90,0.7); font-size: 10px; text-decoration: none; letter-spacing: 0.05em;">YouTube</a>
          </div>
          <div class="web">JBJ.AE</div>
        </div>
      </div>
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 30px; margin-top: 24px; padding: 20px; background: rgba(168,146,90,0.07); border: 1px solid rgba(168,146,90,0.25); border-radius: 12px;">
      <img src="${qrUrl}" alt="JBJ.AE QR Code" style="width: 110px; height: 110px; background: #fff; padding: 7px; border-radius: 10px;" />
      <div>
        <p style="font-family: 'Playfair Display', serif; font-size: 18px; color: #1A1814; font-weight: 600; margin: 0 0 6px 0;">Scan to Visit JBJ.AE</p>
        <p style="color: #6B6459; font-size: 13px; margin: 0 0 4px 0;">Access properties, AI tools, and live market data.</p>
        <p style="color: #A8925A; font-size: 12px; font-weight: 600; margin: 0;">https://JBJ.AE</p>
      </div>
    </div>
    <div style="margin-top: 32px;">
      <div style="width: 100%; height: 4px; background: linear-gradient(90deg, transparent, #A8925A, transparent); margin-bottom: 28px;"></div>
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 700; color: #A8925A; line-height: 1; margin-bottom: 8px;">JBJ</div>
        <div style="font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; color: #2C2A26; margin-bottom: 4px;">JBJ Global Real Estate</div>
        <div style="font-size: 11px; color: #8A8278;">Real Estate Brokerage · Downtown Dubai, UAE</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-bottom: 24px; padding: 20px 0; border-top: 1px solid rgba(168,146,90,0.2); border-bottom: 1px solid rgba(168,146,90,0.2);">
        <div><div style="font-size: 10px; font-weight: 700; color: #A8925A; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px;">Contact</div><div style="font-size: 11px; color: #6B6459; line-height: 1.9;"><div>+971 56 591 1000</div><div>CONTACT@JBJ.AE</div><div>Downtown Dubai, UAE</div></div></div>
        <div><div style="font-size: 10px; font-weight: 700; color: #A8925A; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px;">Explore</div><div style="font-size: 11px; line-height: 1.9;"><div><a href="https://JBJ.AE/properties" style="color:#6B6459; text-decoration:none;">Properties</a></div><div><a href="https://JBJ.AE/areas" style="color:#6B6459; text-decoration:none;">Areas</a></div><div><a href="https://JBJ.AE/developers" style="color:#6B6459; text-decoration:none;">Developers</a></div><div><a href="https://JBJ.AE/market-intelligence" style="color:#6B6459; text-decoration:none;">Market Intel</a></div></div></div>
        <div><div style="font-size: 10px; font-weight: 700; color: #A8925A; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px;">Social</div><div style="font-size: 11px; line-height: 1.9;"><div><a href="https://www.instagram.com/jbj.ae" style="color:#6B6459; text-decoration:none;">Instagram</a></div><div><a href="https://www.tiktok.com/@jbj.ae" style="color:#6B6459; text-decoration:none;">TikTok</a></div><div><a href="https://youtube.com/@jbjglobalrealestate" style="color:#6B6459; text-decoration:none;">YouTube</a></div><div><a href="https://www.linkedin.com/company/jbj-global-real-estate/" style="color:#6B6459; text-decoration:none;">LinkedIn</a></div></div></div>
      </div>
      <div style="text-align: center; margin-bottom: 16px;">
        <p style="font-size: 10px; color: #8A8278; margin: 0 0 4px 0;">© 2026 JBJ Global Real Estate L.L.C S.O.C. · All Rights Reserved</p>
        <p style="font-size: 10px; color: #8A8278; margin: 0;">Crafted in Dubai, UAE · For educational purposes only · Not financial advice</p>
      </div>
      <div style="width: 100%; height: 4px; background: linear-gradient(90deg, transparent, #A8925A, transparent);"></div>
    </div>
    <span class="page-number">23</span>
  </div>`;
}

function getBackCover(qrUrl: string, websiteUrl: string, backCoverImg: string): string {
  return `<div class="page cover" style="display: flex; flex-direction: column; position: relative; width: 794px; height: 1123px; background: linear-gradient(135deg, #18181b 0%, #09090b 50%, #18181b 100%);">
    <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 24px; background: linear-gradient(to right, rgba(168,146,90,0.4), rgba(168,146,90,0.15), transparent); z-index: 2;"></div>
    <div style="position: absolute; inset: 0; z-index: 1;"><img src="${backCoverImg}" alt="" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.12;" /></div>
    <div style="position: absolute; inset: 0; background: radial-gradient(ellipse at center 40%, rgba(168,146,90,0.1) 0%, transparent 70%); z-index: 2;"></div>
    <div style="position: relative; z-index: 5; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 60px 48px;">
      <div style="font-family: 'Playfair Display', serif; font-size: 72px; font-weight: 700; color: #A8925A; line-height: 1; margin-bottom: 16px;">JBJ</div>
      <div style="width: 80px; height: 2px; background: linear-gradient(to right, transparent, #A8925A, transparent); margin-bottom: 24px;"></div>
      <div style="font-size: 14px; letter-spacing: 0.3em; text-transform: uppercase; color: #a1a1aa; margin-bottom: 8px;">Global Real Estate</div>
      <div style="font-size: 11px; color: #71717a; letter-spacing: 0.15em; margin-bottom: 48px;">Real Estate Brokerage · Dubai, UAE</div>
      <div style="max-width: 380px; margin-bottom: 48px;">
        <p style="font-family: 'Playfair Display', serif; font-size: 22px; color: #e4e4e7; font-weight: 400; font-style: italic; line-height: 1.5; margin: 0;">"Your trusted partner in UAE real estate investment"</p>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px 40px; margin-bottom: 48px; text-align: left;">
        <div><div style="font-size: 9px; color: #A8925A; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 6px; font-weight: 600;">Phone</div><div style="font-size: 12px; color: #d4d4d8;"><a href="tel:+971565911000" style="color: #d4d4d8; text-decoration: none;">+971 56 591 1000</a></div></div>
        <div><div style="font-size: 9px; color: #A8925A; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 6px; font-weight: 600;">Email</div><div style="font-size: 12px; color: #d4d4d8;"><a href="mailto:CONTACT@JBJ.AE" style="color: #d4d4d8; text-decoration: none;">CONTACT@JBJ.AE</a></div></div>
        <div><div style="font-size: 9px; color: #A8925A; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 6px; font-weight: 600;">Location</div><div style="font-size: 12px; color: #d4d4d8;">Downtown Dubai, UAE</div></div>
        <div><div style="font-size: 9px; color: #A8925A; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 6px; font-weight: 600;">Website</div><div style="font-size: 12px; color: #d4d4d8;"><a href="https://JBJ.AE" style="color: #d4d4d8; text-decoration: none;">JBJ.AE</a></div></div>
      </div>
      <div style="margin-bottom: 40px;">
        <img src="${qrUrl}" alt="JBJ.AE" style="width: 90px; height: 90px; background: #fff; padding: 6px; border-radius: 8px; border: 1px solid rgba(168,146,90,0.3);" />
        <div style="font-size: 10px; color: #71717a; margin-top: 10px;">Scan to visit JBJ.AE</div>
      </div>
      <div style="margin-top: auto;">
        <div style="width: 200px; height: 1px; background: linear-gradient(to right, transparent, rgba(168,146,90,0.3), transparent); margin: 0 auto 16px;"></div>
        <p style="font-size: 9px; color: #52525b; margin: 0;">© 2026 JBJ Global Real Estate L.L.C S.O.C.</p>
        <p style="font-size: 9px; color: #52525b; margin: 4px 0 0;">All Rights Reserved</p>
      </div>
    </div>
  </div>`;
}
