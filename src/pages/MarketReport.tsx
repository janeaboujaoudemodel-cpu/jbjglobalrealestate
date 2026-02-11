import { useMemo, useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CONTACT_INFO } from "@/constants/stats";
import { getCountryList, getLanguageList } from "@/constants/localeOptions";
import { ytd2026, fullYear2025, topAreas2026, topAreas2025, topNationalities } from "@/constants/dldMarketData";
import founderProfessional from "@/assets/founder-professional.jpeg";
import luxuryVilla1 from "@/assets/luxury-villa-1.jpeg";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle,
  Download,
  FileText,
  Lock,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Unlock,
  Printer,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLeadCapture } from "@/hooks/useLeadCapture";
import { useNavigate } from "react-router-dom";
import MarketReportCTAModal from "@/components/broker/MarketReportCTAModal";
import { FounderContent } from "@/components/FounderContent";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";

const MarketReport = () => {
  const countries = useMemo(() => getCountryList(), []);
  const languages = useMemo(() => getLanguageList(), []);
  const [downloaded, setDownloaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [bookHtml, setBookHtml] = useState<string | null>(null);
  const [showBookPreview, setShowBookPreview] = useState(false);
  const [showCTAModal, setShowCTAModal] = useState(false);
  const bookFrameRef = useRef<HTMLIFrameElement>(null);
  const { isLeadCaptured, leadData, captureLead } = useLeadCapture();
  const navigate = useNavigate();
  const { isFounderVisible } = useFounderVisibility();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    language: "",
  });

  // Pre-fill form with captured lead data
  useEffect(() => {
    if (isLeadCaptured && leadData) {
      setForm({
        fullName: leadData.fullName || "",
        email: leadData.email || "",
        phone: leadData.phone || "",
        nationality: leadData.nationality || "",
        language: leadData.language || "",
      });
    }
  }, [isLeadCaptured, leadData]);

  // If lead is already captured, allow direct download
  const canDirectDownload = isLeadCaptured && leadData?.email;

  const isValid = canDirectDownload || (
    form.fullName.trim().length > 1 &&
    form.email.trim().includes("@") &&
    form.phone.trim().length >= 6 &&
    form.nationality.trim().length > 0 &&
    form.language.trim().length > 0
  );

  const buildInquiryUrl = () => {
    const base = CONTACT_INFO.inquiryFormUrl;
    const params = new URLSearchParams();
    params.set("source", "market-report");
    if (form.fullName) params.set("name", form.fullName);
    if (form.email) params.set("email", form.email);
    if (form.phone) params.set("phone", form.phone);
    if (form.nationality) params.set("nationality", form.nationality);
    if (form.language) params.set("language", form.language);
    return `${base}?${params.toString()}`;
  };

  const downloadBook = async (existingWindow?: Window | null) => {
    // Fetch live data from database
    const [newsResult, projectsResult] = await Promise.all([
      supabase
        .from("market_news")
        .select("title, excerpt, published_date, source, category")
        .order("published_date", { ascending: false })
        .limit(5),
      supabase
        .from("projects")
        .select("name, location, price_from, developer_name, cover_image_url, area_name, short_description, description")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    const latestNews = newsResult.data || [];
    const featuredProjects = projectsResult.data || [];
    const downloadDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const websiteUrl = "https://JBJ.AE";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(websiteUrl + "/quiz")}`;
    
    // Villa images for visual enhancement (removed banned placeholder photo-1512917774080-9991f1c4c750)
    const villaImages = [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80",
    ];

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>UAE Real Estate Market Intelligence 2026 | JBJ Global Real Estate</title>
<meta name="description" content="Comprehensive UAE Real Estate Market Intelligence Report by JBJ Global Real Estate - Your guide to UAE property market 2026" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap');
  
  @page { margin: 0; size: A4; }
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body { 
    font-family: 'Poppins', sans-serif;
    background: #000;
    color: #fff;
    line-height: 1.7;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .page {
    width: 100%;
    min-height: 100vh;
    padding: 60px 50px;
    page-break-after: always;
    background: linear-gradient(180deg, #0a0a0a 0%, #111 100%);
    position: relative;
    overflow: hidden;
  }
  
  .page::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #A8925A, #d4c4a0, #A8925A);
  }
  
  .page-number {
    position: absolute;
    bottom: 30px;
    right: 50px;
    color: #A8925A;
    font-size: 11px;
    letter-spacing: 0.1em;
  }
  
  /* Cover Page */
  .cover {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
    background: radial-gradient(ellipse at center, #1a1814 0%, #0a0a0a 70%);
    position: relative;
  }
  
  .cover-image {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('${villaImages[0]}');
    background-size: cover;
    background-position: center;
    opacity: 0.15;
  }
  
  .cover-content {
    position: relative;
    z-index: 1;
  }
  
  .cover .logo-large {
    font-size: 16px;
    letter-spacing: 0.4em;
    color: #A8925A;
    margin-bottom: 60px;
    text-transform: uppercase;
  }
  
  .cover h1 {
    font-family: 'Playfair Display', serif;
    font-size: 52px;
    font-weight: 600;
    line-height: 1.2;
    margin-bottom: 20px;
    background: linear-gradient(135deg, #fff 30%, #A8925A 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .cover .subtitle {
    font-size: 18px;
    color: #888;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 80px;
  }
  
  .cover .edition {
    display: inline-block;
    padding: 12px 30px;
    border: 1px solid #A8925A;
    color: #A8925A;
    font-size: 12px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    margin-bottom: 60px;
  }
  
  .cover .author-box {
    margin-top: 40px;
    padding: 30px;
    border-top: 1px solid rgba(168, 146, 90, 0.3);
  }
  
  .cover .author-name {
    font-size: 16px;
    color: #A8925A;
    margin-bottom: 5px;
  }
  
  .cover .author-title {
    font-size: 13px;
    color: #666;
    letter-spacing: 0.1em;
  }
  
  /* Section Headers */
  h2 {
    font-family: 'Playfair Display', serif;
    font-size: 32px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 30px;
    padding-bottom: 15px;
    border-bottom: 2px solid #A8925A;
  }
  
  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #A8925A;
    margin: 30px 0 15px 0;
  }
  
  h4 {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin: 20px 0 10px 0;
  }
  
  p {
    font-size: 14px;
    color: #bbb;
    margin-bottom: 15px;
  }
  
  .highlight-box {
    background: linear-gradient(135deg, rgba(168, 146, 90, 0.15) 0%, rgba(168, 146, 90, 0.05) 100%);
    border: 1px solid rgba(168, 146, 90, 0.3);
    border-radius: 12px;
    padding: 25px;
    margin: 25px 0;
  }
  
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin: 30px 0;
  }
  
  .stat-box {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 25px;
    text-align: center;
  }
  
  .stat-box .number {
    font-family: 'Playfair Display', serif;
    font-size: 36px;
    font-weight: 700;
    color: #A8925A;
    margin-bottom: 8px;
  }
  
  .stat-box .label {
    font-size: 12px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 20px 0;
  }
  
  li {
    padding: 12px 0 12px 30px;
    position: relative;
    color: #ccc;
    font-size: 14px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  
  li:last-child { border-bottom: none; }
  
  li::before {
    content: '◆';
    position: absolute;
    left: 0;
    color: #A8925A;
    font-size: 10px;
    top: 14px;
  }
  
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin: 30px 0;
  }
  
  .info-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 25px;
  }
  
  .checklist li::before {
    content: '✓';
    font-weight: bold;
  }
  
  .warning-box {
    background: rgba(220, 50, 50, 0.1);
    border: 1px solid rgba(220, 50, 50, 0.3);
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
  }
  
  .warning-box h4 {
    color: #ff6b6b;
    margin-bottom: 10px;
  }
  
  .table-wrapper {
    overflow-x: auto;
    margin: 25px 0;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  
  th {
    background: rgba(168, 146, 90, 0.2);
    color: #A8925A;
    padding: 15px;
    text-align: left;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-size: 11px;
  }
  
  td {
    padding: 15px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    color: #ccc;
  }
  
  tr:hover td {
    background: rgba(255,255,255,0.02);
  }
  
  .toc {
    margin: 40px 0;
  }
  
  .toc-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  
  .toc-item .title {
    font-size: 16px;
    color: #fff;
  }
  
  .toc-item .page-num {
    color: #A8925A;
    font-weight: 600;
  }
  
  .qr-section {
    display: flex;
    align-items: center;
    gap: 30px;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 146, 90, 0.1) 100%);
    border: 1px solid rgba(139, 92, 246, 0.4);
    border-radius: 16px;
    padding: 30px;
    margin: 40px 0;
  }
  
  .qr-code {
    width: 140px;
    height: 140px;
    background: #fff;
    padding: 10px;
    border-radius: 12px;
    flex-shrink: 0;
  }
  
  .footer-brand {
    text-align: center;
    margin-top: 50px;
    padding-top: 30px;
    border-top: 1px solid rgba(168, 146, 90, 0.2);
  }
  
  .footer-brand .logo {
    font-size: 14px;
    letter-spacing: 0.3em;
    color: #A8925A;
    margin-bottom: 10px;
  }
  
  .footer-brand p {
    font-size: 11px;
    color: #666;
  }
  
  /* GLOBAL PORTRAIT IMAGE RULE - LOCKED (FINAL): Portraits use cover + center 40% for max zoom */
  .founder-image {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    object-fit: cover;
    object-position: center 40%;
    border: 4px solid #A8925A;
    margin: 0 auto 30px;
    display: block;
    background: #0a0a0a;
  }
  
  .founder-section {
    text-align: center;
    padding: 40px 0;
  }
  
  .villa-gallery {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin: 30px 0;
  }
  
  /* GLOBAL IMAGE RULE - LOCKED: No cropping, perfect centering */
  .villa-gallery img {
    width: 100%;
    height: 180px;
    object-fit: contain;
    object-position: center center;
    border-radius: 12px;
    border: 1px solid rgba(168, 146, 90, 0.3);
    background: #0a0a0a;
  }
  
  .disclaimer {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 20px;
    margin: 30px 0;
    font-size: 11px;
    color: #666;
    line-height: 1.6;
  }
  
  .share-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 100%);
    padding: 15px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(168, 146, 90, 0.3);
  }
  
  .share-bar .brand {
    color: #A8925A;
    font-size: 12px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  
  .share-bar .actions {
    display: flex;
    gap: 10px;
  }
  
  .share-bar button {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .share-bar .btn-download {
    background: linear-gradient(135deg, #A8925A 0%, #8a7648 100%);
    color: #000;
  }
  
  .share-bar .btn-download:hover {
    background: linear-gradient(135deg, #c4aa6a 0%, #A8925A 100%);
  }
  
  .share-bar .btn-share {
    background: rgba(255,255,255,0.1);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.2);
  }
  
  .share-bar .btn-share:hover {
    background: rgba(255,255,255,0.2);
  }
  
  .share-bar .btn-close {
    background: transparent;
    color: #888;
    padding: 10px;
  }
  
  .share-bar .btn-close:hover {
    color: #fff;
  }
  
  .chart-container {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 25px;
    margin: 25px 0;
  }
  
  .bar-chart {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .bar-item {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .bar-label {
    width: 120px;
    font-size: 12px;
    color: #999;
    flex-shrink: 0;
  }
  
  .bar-track {
    flex: 1;
    height: 24px;
    background: rgba(255,255,255,0.05);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }
  
  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #A8925A, #d4c4a0);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 10px;
  }
  
  .bar-value {
    font-size: 11px;
    font-weight: 600;
    color: #000;
  }
  
  .pie-chart-container {
    display: flex;
    align-items: center;
    gap: 30px;
    margin: 20px 0;
  }
  
  .pie-legend {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: #ccc;
  }
  
  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  
  .social-links {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 15px;
  }
  
  .social-links a {
    color: #A8925A;
    text-decoration: none;
    font-size: 12px;
    padding: 8px 16px;
    border: 1px solid rgba(168, 146, 90, 0.3);
    border-radius: 8px;
    transition: all 0.2s;
  }
  
  .social-links a:hover {
    background: rgba(168, 146, 90, 0.1);
    border-color: #A8925A;
  }
  
  .contact-link {
    color: #A8925A !important;
    text-decoration: none;
    transition: color 0.2s;
  }
  
  .contact-link:hover {
    color: #d4c4a0 !important;
  }
  
  @media print {
    .page { page-break-after: always; }
    body { background: #000; }
    .share-bar { display: none; }
  }
  
  @media (max-width: 768px) {
    .page { padding: 40px 25px; }
    .cover h1 { font-size: 36px; }
    h2 { font-size: 24px; }
    .stat-grid { grid-template-columns: 1fr; }
    .two-col { grid-template-columns: 1fr; }
    .qr-section { flex-direction: column; text-align: center; }
    .villa-gallery { grid-template-columns: 1fr; }
    .share-bar { padding: 10px 15px; }
    .share-bar .brand { display: none; }
  }
</style>
</head>
<body>
  <!-- Share/Download Bar -->
  <div class="share-bar">
    <div class="brand">JBJ | GLOBAL REAL ESTATE</div>
    <div class="actions">
      <button class="btn-share" onclick="shareBook()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Share
      </button>
      <button class="btn-download" onclick="downloadPDF()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download
      </button>
      <button class="btn-close" onclick="window.close()">✕</button>
    </div>
  </div>

  <!-- COVER PAGE -->
  <div class="page cover" style="padding-top: 80px;">
    <div class="cover-image"></div>
    <div class="cover-content">
      <div class="logo-large">JBJ | Global Real Estate</div>
      <h1>UAE Real Estate<br/>Market Intelligence</h1>
      <div class="subtitle">Property Education & Decision Framework</div>
      <div class="edition">Latest Edition 2026</div>
      ${isFounderVisible ? `
      <div class="author-box">
        <div class="author-name">Jane Bou Jaoude</div>
        <div class="author-title">Founder • JBJ Global Real Estate</div>
        <div style="margin-top: 8px; font-size: 11px; color: #888;">Real Estate Brokerage • Dubai, UAE</div>
      </div>
      ` : ''}
    </div>
  </div>

  <!-- TABLE OF CONTENTS (FIRST) -->
  <div class="page">
    <h2>Table of Contents</h2>
    <div class="toc">
      ${isFounderVisible ? '<div class="toc-item"><span class="title">1. From the Founder</span><span class="page-num">3</span></div>' : ''}
      <div class="toc-item"><span class="title">2. Why I Created This Book</span><span class="page-num">4</span></div>
      <div class="toc-item"><span class="title">3. 2025 Market Review: Setting the Stage</span><span class="page-num">5</span></div>
      <div class="toc-item"><span class="title">4. UAE Market Fundamentals</span><span class="page-num">6</span></div>
      <div class="toc-item"><span class="title">5. Dubai Real Estate Basics</span><span class="page-num">7</span></div>
      <div class="toc-item"><span class="title">6. Key Investment Indicators</span><span class="page-num">8</span></div>
      <div class="toc-item"><span class="title">7. Developer Analysis Framework</span><span class="page-num">9</span></div>
      <div class="toc-item"><span class="title">8. Community Comparison Guide</span><span class="page-num">10</span></div>
      <div class="toc-item"><span class="title">9. Off-Plan vs Ready Properties</span><span class="page-num">11</span></div>
      <div class="toc-item"><span class="title">10. Due Diligence Checklist</span><span class="page-num">12</span></div>
      <div class="toc-item"><span class="title">11. Market Outlook 2026</span><span class="page-num">13</span></div>
      <div class="toc-item"><span class="title">12. Risk Management</span><span class="page-num">14</span></div>
      <div class="toc-item"><span class="title">13. AI Property Matchmaker</span><span class="page-num">15</span></div>
      <div class="toc-item"><span class="title">14. Latest Market News</span><span class="page-num">16</span></div>
      <div class="toc-item"><span class="title">15. DLD Transaction Dashboard</span><span class="page-num">17</span></div>
      <div class="toc-item"><span class="title">16. Featured Properties</span><span class="page-num">18</span></div>
    </div>
    <div class="highlight-box">
      <h4 style="margin-top: 0;">About This Book</h4>
      <p style="margin-bottom: 0;">This educational guide is designed to help property buyers understand the UAE real estate market using government data, structured frameworks, and expert insights. Data sourced from Dubai Land Department (DLD), RERA, Property Monitor, and DXB Interact.</p>
    </div>
    <span class="page-number">2</span>
  </div>

  ${isFounderVisible ? `
  <!-- FOUNDER PAGE -->
  <div class="page">
    <div class="founder-section">
      <h2 style="text-align: center; border-bottom: none; margin-bottom: 40px;">From the Founder</h2>
      <img src="${founderProfessional}" alt="Jane Bou Jaoude" class="founder-image" onerror="this.style.display='none'" />
      <h3 style="color: #A8925A; text-align: center; margin-bottom: 10px;">Jane Bou Jaoude</h3>
      <p style="color: #888; text-align: center; font-size: 13px; margin-bottom: 8px;">Founder, JBJ Global Real Estate</p>
      <p style="color: #666; text-align: center; font-size: 11px; margin-bottom: 30px;">Real Estate Brokerage • Dubai, UAE</p>
    </div>
    
    <div class="highlight-box" style="text-align: center;">
      <p style="font-style: italic; font-size: 18px; color: #fff; margin-bottom: 0;">"We Create | We Elevate | We Lead"</p>
    </div>
    
    <p style="text-align: center; margin-top: 30px; font-size: 15px;">Welcome to the UAE Real Estate Market Intelligence Report. I am honored to share with you the insights, frameworks, and data-driven analysis that have guided thousands of successful property purchases in the UAE market.</p>
    
    <p style="text-align: center; font-size: 14px;">This book represents my commitment to investor education and transparency in one of the world's most dynamic real estate markets.</p>
    
    <span class="page-number">3</span>
  </div>
  ` : ''}

  <!-- WHY I CREATED THIS BOOK -->
  <div class="page">
    <h2>Why I Created This Book</h2>
    
    <div class="two-col">
      <div>
        <p style="font-size: 15px; line-height: 1.8;">After years of guiding buyers through UAE real estate transactions, I recognized a critical gap: there was no single, comprehensive resource that combined official market data with practical decision-making frameworks.</p>
        
        <p style="font-size: 14px;">Too many property buyers were making decisions based on incomplete information, marketing hype, or unreliable sources. I wanted to change that.</p>
        
        <p style="font-size: 14px;">This book distills my experience into structured frameworks that help you evaluate opportunities objectively—whether you are a first-time buyer or an experienced portfolio investor.</p>
      </div>
      <div>
        <!-- GLOBAL IMAGE RULE - LOCKED: No cropping, perfect centering -->
        <img src="${villaImages[1]}" alt="Luxury Property" style="width: 100%; height: 200px; object-fit: contain; object-position: center center; border-radius: 12px; border: 1px solid rgba(168, 146, 90, 0.3); background: #0a0a0a;" />
      </div>
    </div>
    
    <h3>What You Will Learn</h3>
    <div class="two-col">
      <div class="info-card">
        <h4 style="margin-top: 0;">Market Intelligence</h4>
        <ul>
          <li>Official DLD & RERA data analysis</li>
          <li>Price trends by community</li>
          <li>Supply & demand forecasts</li>
        </ul>
      </div>
      <div class="info-card">
        <h4 style="margin-top: 0;">Decision Frameworks</h4>
        <ul>
          <li>Developer comparison matrices</li>
          <li>Investment checklists</li>
          <li>Risk assessment tools</li>
        </ul>
      </div>
    </div>
    
    <div class="villa-gallery">
      <img src="${villaImages[2]}" alt="Premium Villa" />
      <img src="${villaImages[3]}" alt="Luxury Development" />
    </div>
    
    <span class="page-number">4</span>
  </div>

  <!-- 2025 MARKET REVIEW -->
  <div class="page">
    <h2>2025 Market Review: Setting the Stage</h2>
    <p>Before looking ahead to 2026, it is essential to understand Dubai's exceptional performance in 2025. Q3 2025 data reveals a market that continues to break records.</p>
    
    <div class="stat-grid">
      <div class="stat-box">
        <div class="number">52,853</div>
        <div class="label">Q3 2025 Transactions</div>
      </div>
      <div class="stat-box">
        <div class="number">132.76B</div>
        <div class="label">AED Total Sales Value</div>
      </div>
      <div class="stat-box">
        <div class="number">60.8%</div>
        <div class="label">Transaction Growth (vs Q3 2023)</div>
      </div>
    </div>
    
    <!-- Chart: Transaction Growth -->
    <div class="chart-container">
      <h4 style="margin-top: 0; margin-bottom: 20px;">Transaction Volume Growth (Source: DLD)</h4>
      <div class="bar-chart">
        <div class="bar-item">
          <span class="bar-label">Q3 2023</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: 62%;"><span class="bar-value">32,800</span></div>
          </div>
        </div>
        <div class="bar-item">
          <span class="bar-label">Q3 2024</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: 78%;"><span class="bar-value">47,100</span></div>
          </div>
        </div>
        <div class="bar-item">
          <span class="bar-label">Q3 2025</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: 100%;"><span class="bar-value">52,853</span></div>
          </div>
        </div>
      </div>
    </div>
    
    <h3>Q3 2025 Key Highlights</h3>
    <div class="two-col">
      <div class="info-card">
        <h4>Price Performance</h4>
        <ul>
          <li>Average Sale Price: AED 2.5M</li>
          <li>Average Price/Sq Ft: AED 1,913</li>
          <li>Price Growth: +17.4% (vs Q3 2023)</li>
          <li>Luxury segment: +90% YoY transactions</li>
        </ul>
      </div>
      <div class="info-card">
        <h4>Population & Demand</h4>
        <ul>
          <li>Population surpassed 4 million</li>
          <li>9,800 new millionaires in 2025</li>
          <li>D33 Agenda: Double economy by 2033</li>
          <li>Strong East-West buyer mix</li>
        </ul>
      </div>
    </div>
    <span class="page-number">5</span>
  </div>

  <!-- UAE MARKET OVERVIEW -->
  <div class="page">
    <h2>UAE Market Fundamentals</h2>
    <p>The UAE real estate sector demonstrates remarkable resilience, driven by economic diversification, infrastructure investment, and favorable policies.</p>
    
    <!-- Chart: Price Per Sq Ft Trend -->
    <div class="chart-container">
      <h4 style="margin-top: 0; margin-bottom: 20px;">Price Per Sq Ft Growth (Source: Property Monitor)</h4>
      <div class="bar-chart">
        <div class="bar-item">
          <span class="bar-label">2022</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: 70%;"><span class="bar-value">AED 1,450</span></div>
          </div>
        </div>
        <div class="bar-item">
          <span class="bar-label">2023</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: 78%;"><span class="bar-value">AED 1,629</span></div>
          </div>
        </div>
        <div class="bar-item">
          <span class="bar-label">2024</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: 85%;"><span class="bar-value">AED 1,734</span></div>
          </div>
        </div>
        <div class="bar-item">
          <span class="bar-label">2025</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: 100%;"><span class="bar-value">AED 1,913</span></div>
          </div>
        </div>
      </div>
    </div>
    
    <h3>Key Market Drivers</h3>
    <div class="two-col">
      <div class="info-card">
        <h4>Economic Factors</h4>
        <ul>
          <li>Zero income tax policy</li>
          <li>Golden Visa program expansion</li>
          <li>GDP growth of 3.4% projected</li>
          <li>Tourism exceeding 18M visitors</li>
        </ul>
      </div>
      <div class="info-card">
        <h4>Market Dynamics</h4>
        <ul>
          <li>Population growth 2% annually</li>
          <li>Urban Master Plan 2040</li>
          <li>Infrastructure megaprojects</li>
          <li>Expo 2020 legacy developments</li>
        </ul>
      </div>
    </div>
    
    <h3>Property Segment Analysis (Q3 2025)</h3>
    <div class="table-wrapper">
      <table>
        <tr>
          <th>Segment</th>
          <th>Avg. Price</th>
          <th>Avg. Size</th>
          <th>Top Unit Type</th>
        </tr>
        <tr>
          <td>Apartments</td>
          <td>AED 1.77M</td>
          <td>1,031 sq ft</td>
          <td>1-Bedroom</td>
        </tr>
        <tr>
          <td>Townhouses</td>
          <td>AED 2.86M</td>
          <td>2,460 sq ft</td>
          <td>4-Bedroom (59%)</td>
        </tr>
        <tr>
          <td>Villas</td>
          <td>AED 8.53M</td>
          <td>4,626 sq ft</td>
          <td>4-Bedroom (47%)</td>
        </tr>
      </table>
    </div>
    <span class="page-number">6</span>
  </div>

  <!-- DUBAI FUNDAMENTALS -->
  <div class="page">
    <h2>Dubai Real Estate Fundamentals</h2>
    <p>Understanding the structure of Dubai's property market is essential for making informed investment decisions.</p>
    
    <h3>Property Types & Expected Returns</h3>
    <div class="table-wrapper">
      <table>
        <tr>
          <th>Type</th>
          <th>Entry Price</th>
          <th>Typical Yield</th>
          <th>Best For</th>
        </tr>
        <tr>
          <td>Studio Apartment</td>
          <td>AED 400K+</td>
          <td>7-9%</td>
          <td>First-time investors, rental income</td>
        </tr>
        <tr>
          <td>1-2 BR Apartment</td>
          <td>AED 700K+</td>
          <td>6-8%</td>
          <td>Balanced growth & income</td>
        </tr>
        <tr>
          <td>3+ BR Apartment</td>
          <td>AED 1.5M+</td>
          <td>5-7%</td>
          <td>Family residence, luxury segment</td>
        </tr>
        <tr>
          <td>Townhouse</td>
          <td>AED 1.8M+</td>
          <td>5-6%</td>
          <td>Homeowners, capital appreciation</td>
        </tr>
        <tr>
          <td>Villa</td>
          <td>AED 3M+</td>
          <td>4-6%</td>
          <td>Premium lifestyle, long-term hold</td>
        </tr>
      </table>
    </div>
    
    <!-- Yield Comparison Chart -->
    <div class="chart-container">
      <h4 style="margin-top: 0; margin-bottom: 20px;">Rental Yield Comparison (Global Cities)</h4>
      <div class="bar-chart">
        <div class="bar-item">
          <span class="bar-label">Dubai</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: 100%; background: linear-gradient(90deg, #A8925A, #c4aa6a);"><span class="bar-value">6-8%</span></div>
          </div>
        </div>
        <div class="bar-item">
          <span class="bar-label">New York</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: 50%; background: rgba(255,255,255,0.3);"><span class="bar-value" style="color: #fff;">4%</span></div>
          </div>
        </div>
        <div class="bar-item">
          <span class="bar-label">London</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: 38%; background: rgba(255,255,255,0.3);"><span class="bar-value" style="color: #fff;">3%</span></div>
          </div>
        </div>
        <div class="bar-item">
          <span class="bar-label">Hong Kong</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: 31%; background: rgba(255,255,255,0.3);"><span class="bar-value" style="color: #fff;">2.5%</span></div>
          </div>
        </div>
      </div>
    </div>
    
    <h3>Transaction Costs</h3>
    <div class="info-card">
      <ul class="checklist">
        <li>DLD Registration Fee: 4% of property value</li>
        <li>Agency Commission: 2% (typically paid by buyer)</li>
        <li>NOC Fee: AED 500-5,000 (varies by developer)</li>
        <li>Mortgage Registration: 0.25% of loan amount</li>
        <li>Trustee Fee: AED 4,000-5,000</li>
      </ul>
    </div>
    <span class="page-number">7</span>
  </div>

  <!-- KEY INDICATORS -->
  <div class="page">
    <h2>Key Investment Indicators</h2>
    <p>Successful real estate investment requires understanding and monitoring key market indicators.</p>
    
    <h3>Primary Indicators</h3>
    <div class="two-col">
      <div class="info-card">
        <h4>Transaction Volume</h4>
        <p>Monthly counts indicate market momentum. Rising volumes suggest growing demand.</p>
      </div>
      <div class="info-card">
        <h4>Price Per Sq. Ft.</h4>
        <p>Compare against 3-year averages to identify value opportunities or overheated zones.</p>
      </div>
      <div class="info-card">
        <h4>Rental Yield</h4>
        <p>Annual rent / Property value × 100. Dubai averages 6-8% gross yield.</p>
      </div>
      <div class="info-card">
        <h4>Days on Market</h4>
        <p>Properties selling under 30 days indicate strong demand.</p>
      </div>
    </div>
    
    <h3>Market Health Signals</h3>
    <div class="table-wrapper">
      <table>
        <tr>
          <th>Indicator</th>
          <th>Healthy Market</th>
          <th>Caution Zone</th>
        </tr>
        <tr>
          <td>Transaction Growth YoY</td>
          <td>5-15% increase</td>
          <td>Over 25% or negative</td>
        </tr>
        <tr>
          <td>Price Growth YoY</td>
          <td>3-10% increase</td>
          <td>Over 20% (bubble risk)</td>
        </tr>
        <tr>
          <td>Rental Yield</td>
          <td>6-8%</td>
          <td>Under 4% (overvalued)</td>
        </tr>
        <tr>
          <td>Supply Pipeline</td>
          <td>Moderate (2-3% of stock)</td>
          <td>Over 5% of existing stock</td>
        </tr>
      </table>
    </div>
    
    <div class="highlight-box">
      <h4 style="margin-top: 0;">Pro Tip: Data Sources</h4>
      <p style="margin-bottom: 0;">Access real-time transaction data through DXB Interact (mo.dld.gov.ae) and Property Monitor for comprehensive market analytics.</p>
    </div>
    <span class="page-number">8</span>
  </div>

  <!-- DEVELOPER ANALYSIS -->
  <div class="page">
    <h2>Developer Analysis Framework</h2>
    <p>Choosing the right developer is crucial, especially for off-plan purchases.</p>
    
    <h3>Developer Evaluation Criteria</h3>
    <div class="table-wrapper">
      <table>
        <tr>
          <th>Factor</th>
          <th>What to Check</th>
          <th>Weight</th>
        </tr>
        <tr>
          <td>Track Record</td>
          <td>Number of completed projects, years in market</td>
          <td>25%</td>
        </tr>
        <tr>
          <td>Delivery History</td>
          <td>On-time completion rate, delays</td>
          <td>25%</td>
        </tr>
        <tr>
          <td>Build Quality</td>
          <td>Materials, finishes, post-handover reviews</td>
          <td>20%</td>
        </tr>
        <tr>
          <td>Financial Stability</td>
          <td>Parent company, escrow compliance</td>
          <td>15%</td>
        </tr>
        <tr>
          <td>After-Sales</td>
          <td>Community management, maintenance</td>
          <td>15%</td>
        </tr>
      </table>
    </div>
    
    <h3>Developer Tiers</h3>
    <div class="two-col">
      <div class="info-card">
        <h4>Tier 1: Master Developers</h4>
        <ul>
          <li>Emaar, Nakheel, DAMAC, Dubai Properties</li>
          <li>Extensive track record (15+ years)</li>
          <li>Iconic projects portfolio</li>
          <li>Lower risk, moderate returns</li>
        </ul>
      </div>
      <div class="info-card">
        <h4>Tier 2: Established Developers</h4>
        <ul>
          <li>Sobha, Ellington, Omniyat, Binghatti</li>
          <li>Proven delivery (5-15 years)</li>
          <li>Growing portfolio</li>
          <li>Balanced risk-return profile</li>
        </ul>
      </div>
    </div>
    
    <div class="warning-box">
      <h4>Due Diligence Essentials</h4>
      <p style="margin-bottom: 0;">Always verify: RERA registration, escrow account details, project approvals, and visit at least 2-3 completed projects before committing to off-plan.</p>
    </div>
    <span class="page-number">9</span>
  </div>

  <!-- COMMUNITY COMPARISON -->
  <div class="page">
    <h2>Community Comparison Guide</h2>
    <p>Location drives long-term value. Use this framework to compare communities.</p>
    
    <h3>Community Assessment Matrix</h3>
    <div class="table-wrapper">
      <table>
        <tr>
          <th>Community</th>
          <th>Avg. PSF</th>
          <th>Rental Yield</th>
          <th>Best For</th>
        </tr>
        <tr>
          <td>Dubai Marina</td>
          <td>AED 1,400-2,000</td>
          <td>6-7%</td>
          <td>Rental income, tourism</td>
        </tr>
        <tr>
          <td>Downtown Dubai</td>
          <td>AED 2,000-3,500</td>
          <td>5-6%</td>
          <td>Capital appreciation</td>
        </tr>
        <tr>
          <td>JVC</td>
          <td>AED 800-1,100</td>
          <td>7-9%</td>
          <td>High yield, entry-level</td>
        </tr>
        <tr>
          <td>Dubai Hills</td>
          <td>AED 1,200-1,800</td>
          <td>5-7%</td>
          <td>Family, long-term growth</td>
        </tr>
        <tr>
          <td>Palm Jumeirah</td>
          <td>AED 2,500-5,000+</td>
          <td>4-5%</td>
          <td>Luxury, prestige</td>
        </tr>
        <tr>
          <td>Business Bay</td>
          <td>AED 1,300-1,800</td>
          <td>6-7%</td>
          <td>Commercial proximity</td>
        </tr>
      </table>
    </div>
    
    <h3>Location Factors to Consider</h3>
    <ul>
      <li><strong>Connectivity:</strong> Metro access, highway proximity, airport distance</li>
      <li><strong>Amenities:</strong> Schools, hospitals, shopping, beaches, parks</li>
      <li><strong>Supply Pipeline:</strong> Upcoming projects that may impact prices</li>
      <li><strong>Demographics:</strong> Target tenant profile</li>
    </ul>
    
    <div class="highlight-box">
      <h4 style="margin-top: 0;">Emerging Areas to Watch in 2026</h4>
      <p style="margin-bottom: 0;">Dubai South, Mohammed Bin Rashid City, Dubai Islands, and areas along the new metro extensions offer potential for early-stage capital appreciation.</p>
    </div>
    <span class="page-number">10</span>
  </div>

  <!-- OFF-PLAN VS READY -->
  <div class="page">
    <h2>Off-Plan vs Ready Properties</h2>
    <p>Understanding the trade-offs is essential for aligning investments with your goals.</p>
    
    <h3>Comparison Overview</h3>
    <div class="table-wrapper">
      <table>
        <tr>
          <th>Factor</th>
          <th>Off-Plan</th>
          <th>Ready Property</th>
        </tr>
        <tr>
          <td>Entry Price</td>
          <td>10-20% below market</td>
          <td>Market rate</td>
        </tr>
        <tr>
          <td>Payment</td>
          <td>Installments (40/60 typical)</td>
          <td>Full or mortgage</td>
        </tr>
        <tr>
          <td>Rental Income</td>
          <td>Delayed (2-4 years)</td>
          <td>Immediate</td>
        </tr>
        <tr>
          <td>Price Risk</td>
          <td>Market fluctuation exposure</td>
          <td>Known current value</td>
        </tr>
        <tr>
          <td>Inspection</td>
          <td>Model only</td>
          <td>Physical inspection</td>
        </tr>
      </table>
    </div>
    
    <h3>When to Choose Off-Plan</h3>
    <ul class="checklist">
      <li>You have 3-5 year investment horizon</li>
      <li>Developer has strong delivery track record</li>
      <li>Location has proven demand drivers</li>
      <li>Payment plan suits your cash flow</li>
    </ul>
    
    <h3>When to Choose Ready</h3>
    <ul class="checklist">
      <li>You need immediate rental income</li>
      <li>You want to physically inspect before buying</li>
      <li>You are financing with a mortgage</li>
      <li>You prefer lower uncertainty</li>
    </ul>
    <span class="page-number">11</span>
  </div>

  <!-- DUE DILIGENCE -->
  <div class="page">
    <h2>Due Diligence Checklist</h2>
    <p>Thorough due diligence protects your investment. Use this comprehensive checklist.</p>
    
    <h3>For All Properties</h3>
    <ul class="checklist">
      <li>Verify seller ownership through DLD title deed search</li>
      <li>Confirm no outstanding service charges or mortgages</li>
      <li>Check developer NOC requirements and fees</li>
      <li>Review service charge history and budget</li>
      <li>Understand community rules and restrictions</li>
      <li>Research recent comparable transactions</li>
      <li>Calculate total acquisition costs (4% DLD + fees)</li>
    </ul>
    
    <h3>Off-Plan Specific</h3>
    <ul class="checklist">
      <li>Verify RERA registration and project number</li>
      <li>Confirm escrow account details</li>
      <li>Review Sales and Purchase Agreement carefully</li>
      <li>Check developer completion track record</li>
      <li>Understand cancellation and refund policies</li>
      <li>Visit completed projects by same developer</li>
      <li>Verify handover timeline and delay provisions</li>
    </ul>
    
    <h3>Ready Property Specific</h3>
    <ul class="checklist">
      <li>Conduct physical inspection (or hire snagging company)</li>
      <li>Check for structural issues, water damage, HVAC</li>
      <li>Verify actual size matches title deed</li>
      <li>Review tenant contract if occupied</li>
      <li>Assess renovation or maintenance needs</li>
      <li>Test all appliances and systems</li>
    </ul>
    <span class="page-number">12</span>
  </div>

  <!-- MARKET OUTLOOK 2026 -->
  <div class="page">
    <h2>Market Outlook 2026</h2>
    <p>Based on 2025's exceptional performance and market fundamentals.</p>
    
    <h3>Supply Forecast 2025-2028</h3>
    <div class="table-wrapper">
      <table>
        <tr>
          <th>Year</th>
          <th>Expected Units</th>
          <th>Key Areas</th>
        </tr>
        <tr>
          <td>2025</td>
          <td>81,084</td>
          <td>JVC, Al Furjan, Arabian Ranches 3</td>
        </tr>
        <tr>
          <td>2026</td>
          <td>96,500</td>
          <td>Arjan, Business Bay, Dubai Hills</td>
        </tr>
        <tr>
          <td>2027</td>
          <td>84,979</td>
          <td>Damac Lagoons, The Valley</td>
        </tr>
        <tr>
          <td>2028</td>
          <td>45,480</td>
          <td>Dubai Harbour, Maritime City</td>
        </tr>
      </table>
    </div>
    
    <h3>2026 Market Expectations</h3>
    <div class="stat-grid">
      <div class="stat-box">
        <div class="number">600B+</div>
        <div class="label">Projected AED Transactions</div>
      </div>
      <div class="stat-box">
        <div class="number">5-10%</div>
        <div class="label">Expected Price Growth</div>
      </div>
      <div class="stat-box">
        <div class="number">96,500</div>
        <div class="label">New Units Delivery</div>
      </div>
    </div>
    
    <div class="highlight-box">
      <h4 style="margin-top: 0;">Our Perspective</h4>
      <p style="margin-bottom: 0;">At JBJ Global Real Estate, we believe 2026 presents selective opportunities for buyers who do proper due diligence. Focus on quality over quantity.</p>
    </div>
    <span class="page-number">13</span>
  </div>

  <!-- RISK MANAGEMENT -->
  <div class="page">
    <h2>Risk Management</h2>
    <p>Every investment carries risk. Smart investors identify, assess, and mitigate risks proactively.</p>
    
    <h3>Key Risk Categories</h3>
    <div class="two-col">
      <div class="info-card">
        <h4>Market Risks</h4>
        <ul>
          <li>Price corrections</li>
          <li>Oversupply in segment</li>
          <li>Currency fluctuations</li>
          <li>Economic slowdown</li>
        </ul>
      </div>
      <div class="info-card">
        <h4>Developer Risks</h4>
        <ul>
          <li>Delivery delays</li>
          <li>Quality issues</li>
          <li>Financial distress</li>
          <li>Specification changes</li>
        </ul>
      </div>
    </div>
    
    <h3>Mitigation Strategies</h3>
    <ul>
      <li><strong>Diversification:</strong> Spread investments across communities and property types</li>
      <li><strong>Due Diligence:</strong> Follow our checklist rigorously for every transaction</li>
      <li><strong>Developer Selection:</strong> Prioritize Tier 1-2 developers for off-plan</li>
      <li><strong>Cash Buffer:</strong> Maintain reserves for service charges and vacancies</li>
      <li><strong>Professional Support:</strong> Work with licensed brokers and legal advisors</li>
    </ul>
    
    <div class="warning-box">
      <h4>Common Investor Mistakes</h4>
      <ul style="margin-bottom: 0;">
        <li>Chasing hot tips without independent research</li>
        <li>Over-leveraging with multiple off-plan commitments</li>
        <li>Ignoring service charges and maintenance costs</li>
        <li>Buying based on renders instead of visiting sites</li>
      </ul>
    </div>
    <span class="page-number">14</span>
  </div>

  <!-- AI MATCHMAKER -->
  <div class="page">
    <h2 style="color: #8b5cf6;">AI Property Matchmaker</h2>
    <p>JBJ Global Real Estate has developed an exclusive AI-powered Property Matchmaker to help buyers identify properties aligned with their criteria.</p>
    
    <div style="background: linear-gradient(135deg, #ffffff 0%, #f5f5f0 100%); border: 1px solid #d4d4d4; border-radius: 16px; padding: 25px; margin: 25px 0;">
      <p style="color: #A8925A; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 10px;">Premium AI Technology</p>
      <p style="color: #000; font-size: 16px; margin-bottom: 5px; font-weight: 600;">Developed by JBJ Global Real Estate</p>
      <p style="color: #555; font-size: 13px; margin-bottom: 0;">Exclusive for JBJ Global Real Estate • Real Estate Brokerage</p>
    </div>
    
    <h3>How It Works</h3>
    <ul>
      <li><strong>Step 1:</strong> Complete a quick questionnaire about your property goals</li>
      <li><strong>Step 2:</strong> Our AI analyzes your preferences against available properties</li>
      <li><strong>Step 3:</strong> Receive personalized property recommendations</li>
      <li><strong>Step 4:</strong> Connect with our team for detailed consultation</li>
    </ul>
    
    <h3>What We Assess</h3>
    <div class="two-col">
      <div class="info-card">
        <h4>Investment Profile</h4>
        <ul>
          <li>Budget range</li>
          <li>Investment timeline</li>
          <li>Risk tolerance</li>
          <li>Income vs. growth focus</li>
        </ul>
      </div>
      <div class="info-card">
        <h4>Property Preferences</h4>
        <ul>
          <li>Property type</li>
          <li>Location priorities</li>
          <li>Off-plan vs. ready</li>
          <li>Developer preferences</li>
        </ul>
      </div>
    </div>
    
    <div class="qr-section">
      <img class="qr-code" src="${qrUrl}" alt="AI Property Matchmaker QR" />
      <div>
        <h3 style="margin-top: 0; margin-bottom: 10px; color: #8b5cf6;">Try Our AI Property Matchmaker</h3>
        <p style="margin-bottom: 10px;">Scan this QR code or visit our website to access the complimentary AI assessment tool created by the founder.</p>
        <p style="color: #8b5cf6; font-weight: 600; margin-bottom: 0;"><a href="${websiteUrl}/quiz" style="color: #8b5cf6; text-decoration: none;">${websiteUrl}/quiz</a></p>
      </div>
    </div>
    
    <div class="footer-brand">
      <div class="logo">JBJ | GLOBAL REAL ESTATE</div>
      <p>Real Estate Brokerage • Dubai, UAE</p>
      <p style="margin-top: 10px;">
        Email: <a href="mailto:contact@JBJ.ae" class="contact-link">contact@JBJ.ae</a> • 
        Phone: <a href="tel:+971565911000" class="contact-link">+971 56 591 1000</a>
      </p>
      
      <div class="social-links">
        <a href="https://instagram.com/jbjglobalrealestate" target="_blank">Instagram</a>
        <a href="https://tiktok.com/@jbjglobalrealestate" target="_blank">TikTok</a>
        <a href="https://youtube.com/@jbjglobalrealestate" target="_blank">YouTube</a>
        <a href="https://facebook.com/jbjglobalrealestate" target="_blank">Facebook</a>
      </div>
      
      <p style="margin-top: 20px; font-size: 10px; color: #555;">© 2026 JBJ Global Real Estate. All Rights Reserved.</p>
    </div>
    
    <div class="disclaimer">
      <strong>Disclaimer:</strong> This document is for educational purposes only and does not constitute investment, financial, or legal advice. Data sourced from Dubai Land Department (DLD), RERA, Property Monitor, and DXB Interact. While we strive for accuracy, readers should verify information independently. Real estate investments involve risks, including potential loss of capital. Past performance is not indicative of future results.
    </div>
    <span class="page-number">15</span>
  </div>

  <!-- ============= DYNAMIC PAGES (Auto-synced at download time) ============= -->

  <!-- LATEST MARKET NEWS -->
  <div class="page">
    <h2>Latest Market News</h2>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
      <p style="margin: 0;">The latest headlines from official UAE sources, updated daily.</p>
      <span style="background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05)); border: 1px solid rgba(16,185,129,0.3); border-radius: 20px; padding: 6px 16px; font-size: 11px; color: #10b981; font-weight: 600;">Updated ${downloadDate}</span>
    </div>
    ${latestNews.length > 0 ? latestNews.map((n: any, i: number) => `
    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(168,146,90,0.2); border-left: 3px solid #A8925A; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; margin-bottom: 8px;">
        <span style="background: rgba(168,146,90,0.15); color: #A8925A; padding: 3px 10px; border-radius: 6px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${n.category || 'Market Update'}</span>
        <span style="color: #888; font-size: 11px; white-space: nowrap;">${n.published_date ? new Date(n.published_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
      </div>
      <h4 style="color: #fff; font-size: 15px; margin: 8px 0; line-height: 1.4;">${n.title}</h4>
      <p style="color: #999; font-size: 13px; margin: 0; line-height: 1.6;">${(n.excerpt || '').slice(0, 180)}${(n.excerpt || '').length > 180 ? '...' : ''}</p>
      <div style="margin-top: 10px; font-size: 11px; color: #666;">Source: ${n.source || 'Official UAE Sources'}</div>
    </div>
    `).join('') : '<p style="color: #888; text-align: center; padding: 40px;">No recent news available. Visit JBJ.ae/news for the latest updates.</p>'}
    <div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid rgba(168,146,90,0.2);">
      <p style="color: #888; font-size: 12px; margin: 0;">For full articles with detailed analysis, visit <a href="https://JBJ.ae/news" style="color: #A8925A; text-decoration: none; font-weight: 600;">JBJ.ae/news</a></p>
    </div>
    <span class="page-number">16</span>
  </div>

  <!-- DLD TRANSACTION DASHBOARD -->
  <div class="page">
    <h2>DLD Transaction Dashboard</h2>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <p style="margin: 0;">Live market statistics from the Dubai Land Department.</p>
      <span style="background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05)); border: 1px solid rgba(16,185,129,0.3); border-radius: 20px; padding: 6px 16px; font-size: 11px; color: #10b981; font-weight: 600;">Data as of ${downloadDate}</span>
    </div>

    <!-- 2026 YTD KPIs -->
    <div class="stat-grid">
      <div class="stat-box">
        <div class="number">${ytd2026.value}</div>
        <div class="label">2026 YTD Value</div>
      </div>
      <div class="stat-box">
        <div class="number">${ytd2026.transactions.toLocaleString()}+</div>
        <div class="label">2026 YTD Transactions</div>
      </div>
      <div class="stat-box">
        <div class="number">${ytd2026.growth}</div>
        <div class="label">YoY Growth</div>
      </div>
    </div>

    <!-- Transaction Type Breakdown -->
    <h3>Transaction Breakdown — 2026 YTD</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
      <div class="info-card">
        <h4 style="margin-top: 0; font-size: 13px; color: #A8925A;">Transaction Type</h4>
        <div style="margin: 12px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #ccc; font-size: 13px;">Off-Plan</span><span style="color: #A8925A; font-weight: 700;">${ytd2026.offPlan.toLocaleString()} <span style="font-size: 11px; color: #10b981;">(${((ytd2026.offPlan / (ytd2026.offPlan + ytd2026.secondary)) * 100).toFixed(0)}%)</span></span></div>
          <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;"><div style="height: 100%; width: ${((ytd2026.offPlan / (ytd2026.offPlan + ytd2026.secondary)) * 100).toFixed(0)}%; background: linear-gradient(90deg, #A8925A, #d4c4a0); border-radius: 4px;"></div></div>
        </div>
        <div style="margin: 12px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #ccc; font-size: 13px;">Secondary</span><span style="color: #999; font-weight: 700;">${ytd2026.secondary.toLocaleString()} <span style="font-size: 11px; color: #888;">(${((ytd2026.secondary / (ytd2026.offPlan + ytd2026.secondary)) * 100).toFixed(0)}%)</span></span></div>
          <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;"><div style="height: 100%; width: ${((ytd2026.secondary / (ytd2026.offPlan + ytd2026.secondary)) * 100).toFixed(0)}%; background: rgba(255,255,255,0.3); border-radius: 4px;"></div></div>
        </div>
      </div>
      <div class="info-card">
        <h4 style="margin-top: 0; font-size: 13px; color: #A8925A;">Payment Method</h4>
        <div style="margin: 12px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #ccc; font-size: 13px;">Cash</span><span style="color: #10b981; font-weight: 700;">${ytd2026.cash.toLocaleString()} <span style="font-size: 11px;">(${((ytd2026.cash / (ytd2026.cash + ytd2026.mortgage)) * 100).toFixed(0)}%)</span></span></div>
          <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;"><div style="height: 100%; width: ${((ytd2026.cash / (ytd2026.cash + ytd2026.mortgage)) * 100).toFixed(0)}%; background: linear-gradient(90deg, #10b981, #34d399); border-radius: 4px;"></div></div>
        </div>
        <div style="margin: 12px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #ccc; font-size: 13px;">Mortgage</span><span style="color: #999; font-weight: 700;">${ytd2026.mortgage.toLocaleString()} <span style="font-size: 11px; color: #888;">(${((ytd2026.mortgage / (ytd2026.cash + ytd2026.mortgage)) * 100).toFixed(0)}%)</span></span></div>
          <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;"><div style="height: 100%; width: ${((ytd2026.mortgage / (ytd2026.cash + ytd2026.mortgage)) * 100).toFixed(0)}%; background: rgba(255,255,255,0.3); border-radius: 4px;"></div></div>
        </div>
      </div>
    </div>

    <!-- Gift Transactions -->
    <div class="highlight-box" style="text-align: center;">
      <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px;">Gift Transactions</p>
      <p style="font-family: 'Playfair Display', serif; font-size: 42px; color: #A8925A; margin: 0;">${ytd2026.gifts.toLocaleString()}</p>
      <p style="font-size: 12px; color: #888; margin-top: 5px;">Gift transfers YTD 2026</p>
    </div>

    <!-- Top Areas -->
    <h3>Top 10 Areas by Transaction Volume — 2026 YTD</h3>
    <div class="table-wrapper">
      <table>
        <tr><th>#</th><th>Area</th><th>Transactions</th><th>YoY Change</th></tr>
        ${topAreas2026.map((a, i) => `<tr><td style="color: #A8925A; font-weight: 600;">${i + 1}</td><td>${a.area}</td><td style="color: #A8925A; font-weight: 700;">${a.transactions.toLocaleString()}</td><td><span style="color: #10b981; font-size: 12px;">${a.change}</span></td></tr>`).join('')}
      </table>
    </div>

    <!-- Top Nationalities -->
    <h3>Top Buyer Nationalities — 2026 YTD</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0;">
      ${topNationalities.map((n, i) => `
      <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
        <span style="color: #666; font-size: 12px; width: 16px;">${i + 1}</span>
        <span style="font-size: 18px;">${n.flag}</span>
        <span style="color: #ccc; font-size: 13px; flex: 1;">${n.country}</span>
        <span style="color: #A8925A; font-weight: 700; font-size: 14px;">${n.percentage}%</span>
      </div>
      `).join('')}
    </div>

    <span class="page-number">17</span>
  </div>

  <!-- FEATURED PROPERTIES -->
  <div class="page">
    <h2>Featured Properties</h2>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
      <p style="margin: 0;">Latest off-plan and ready properties available through JBJ Global Real Estate.</p>
      <span style="background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05)); border: 1px solid rgba(16,185,129,0.3); border-radius: 20px; padding: 6px 16px; font-size: 11px; color: #10b981; font-weight: 600;">Updated ${downloadDate}</span>
    </div>

    ${featuredProjects.length > 0 ? `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      ${featuredProjects.map((p: any) => {
        const desc = p.short_description || (p.description ? p.description.substring(0, 120) + '...' : '');
        return `
      <div class="info-card" style="overflow: hidden; padding: 0;">
        ${p.cover_image_url ? `<img src="${p.cover_image_url}" alt="${p.name}" style="width: 100%; height: 120px; object-fit: cover; border-bottom: 1px solid rgba(255,255,255,0.05);" onerror="this.style.display='none'" />` : '<div style="height: 120px; background: linear-gradient(135deg, rgba(168,146,90,0.1), rgba(168,146,90,0.05)); display: flex; align-items: center; justify-content: center; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color: #A8925A; font-size: 24px;">🏠</span></div>'}
        <div style="padding: 16px;">
          <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #fff; line-height: 1.3;">${p.name}</h4>
          <p style="color: #888; font-size: 12px; margin: 0 0 4px 0;">📍 ${p.area_name || p.location || 'Dubai, UAE'}</p>
          ${p.developer_name ? `<p style="color: #666; font-size: 11px; margin: 0 0 6px 0;">🏗️ by <span style="color: #A8925A;">${p.developer_name}</span></p>` : ''}
          ${desc ? `<p style="color: #999; font-size: 11px; line-height: 1.5; margin: 0 0 8px 0;">${desc}</p>` : ''}
          ${p.price_from ? `<p style="color: #A8925A; font-weight: 700; font-size: 14px; margin: 0;">From AED ${Number(p.price_from).toLocaleString()}</p>` : '<p style="color: #A8925A; font-size: 13px; margin: 0;">Price on request</p>'}
        </div>
      </div>
      `;}).join('')}
    </div>
    ` : '<p style="color: #888; text-align: center; padding: 40px;">Visit JBJ.ae to explore our full portfolio of properties.</p>'}

    <div style="text-align: center; margin-top: 30px; padding: 25px; background: linear-gradient(135deg, rgba(168,146,90,0.15), rgba(168,146,90,0.05)); border: 1px solid rgba(168,146,90,0.3); border-radius: 12px;">
      <p style="color: #A8925A; font-size: 14px; font-weight: 600; margin: 0 0 5px 0;">Explore All Properties</p>
      <p style="color: #888; font-size: 12px; margin: 0;">Visit <a href="https://JBJ.ae/properties" style="color: #A8925A; text-decoration: none; font-weight: 600;">JBJ.ae/properties</a> for our complete listing catalog with virtual tours, floor plans, and more.</p>
    </div>

    <span class="page-number">18</span>
  </div>

  <script>
    function downloadPDF() {
      window.print();
    }
    
    function shareBook() {
      if (navigator.share) {
        navigator.share({
          title: 'UAE Real Estate Market Intelligence 2026 - JBJ Global Real Estate',
          text: 'Download your free copy of the UAE Real Estate Market Intelligence Report by JBJ Global Real Estate',
          url: 'https://JBJ.ae/market-report'
        }).catch(console.error);
      } else {
        navigator.clipboard.writeText('https://JBJ.ae/market-report').then(() => {
          alert('Link copied to clipboard! Share it with others.');
        }).catch(() => {
          alert('Visit JBJ.ae/market-report to share this book');
        });
      }
    }
  </script>
</body>
</html>`;

    const openInApp = () => {
      setBookHtml(html);
      setShowBookPreview(true);
      setDownloaded(true);
      return true;
    };

    // Try a new tab first (best UX for Print → Save as PDF), fallback to in-page viewer if blocked
    const targetWindow = existingWindow ?? window.open("", "_blank");
    if (!targetWindow) return openInApp();

    try {
      targetWindow.document.open();
      targetWindow.document.write(html);
      targetWindow.document.close();
    } catch (e) {
      console.error("book render error:", e);
      try {
        targetWindow.close();
      } catch {
        // ignore
      }
      return openInApp();
    }

    setDownloaded(true);
    return true;
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    // Open immediately on user click to avoid pop-up blockers (fallback handled inside downloadBook)
    const bookWindow = window.open("", "_blank");

    setIsSubmitting(true);
    setShowThankYou(true);

    try {
      // Capture lead first if this is a new submission - saves to BOTH leads AND crm_leads
      if (!isLeadCaptured && form.email) {
        await captureLead(
          {
            email: form.email,
            fullName: form.fullName,
            phone: form.phone,
            nationality: form.nationality,
            language: form.language,
          },
          "market_report_download",
          "client"
        );
      }

      // Send email notification in the background
      void supabase.functions
        .invoke("send-market-report-email", {
          body: {
            fullName: form.fullName || leadData?.fullName,
            email: form.email || leadData?.email,
            phone: form.phone || leadData?.phone,
            nationality: form.nationality || leadData?.nationality,
            language: form.language || leadData?.language,
          },
        })
        .catch(console.error);

      const opened = await downloadBook(bookWindow);
      if (opened) {
        toast.success("Your book is ready!");
        // Show CTA modal after a short delay
        setTimeout(() => {
          setShowCTAModal(true);
        }, 2000);
      } else {
        toast.error("Couldn't open the book. Please try again.");
      }
    } catch (error) {
      console.error("Error during submission:", error);
      toast.error("Something went wrong. Please try again.");
      try {
        bookWindow?.close();
      } catch {
        // ignore
      }
    } finally {
      setShowThankYou(false);
      setIsSubmitting(false);
    }
  };

  // Direct download for returning users
  const handleDirectDownload = async () => {
    const bookWindow = window.open("", "_blank");
    const opened = await downloadBook(bookWindow);
    if (opened) {
      toast.success("Your book is ready!");
      // Show CTA modal after a short delay
      setTimeout(() => {
        setShowCTAModal(true);
      }, 2000);
    } else {
      toast.error("Couldn't open the book. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">


      {/* Thank You Modal */}
      {showThankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-zinc-900 to-black border border-gold/30 rounded-3xl p-10 max-w-md mx-4 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-gold" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Thank You!</h2>
            <p className="text-gold text-lg font-semibold mb-2">From JBJ Global Real Estate</p>
            <p className="text-zinc-400 mb-6">
              You have successfully unlocked your Market Intelligence Book. Opening now...
            </p>
            <div className="flex items-center justify-center gap-2 text-zinc-500">
              <div className="w-5 h-5 border-2 border-gold/50 border-t-gold rounded-full animate-spin" />
              <span className="text-sm">Preparing your book...</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* In-page Book Viewer (fallback when pop-ups are blocked) */}
      {showBookPreview && bookHtml && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 h-full flex items-center justify-center">
            <div className="w-full max-w-6xl h-[88vh] bg-zinc-950 border border-gold/30 rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-400">JBJ Global Real Estate</p>
                  <h2 className="text-white font-semibold truncate">UAE Real Estate Market Intelligence 2026</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bookFrameRef.current?.contentWindow?.print()}
                    className="border-gold/30 text-gold hover:bg-gold/10"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Save as PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowBookPreview(false);
                      setBookHtml(null);
                    }}
                    className="border-zinc-700 text-zinc-200 hover:bg-zinc-900"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close
                  </Button>
                </div>
              </div>
              <iframe
                ref={bookFrameRef}
                title="UAE Real Estate Market Intelligence 2026"
                srcDoc={bookHtml}
                className="w-full h-[calc(88vh-52px)] bg-white"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - with Active Champagne Layer */}
      <section className="jj-hero-fullscreen relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-black">
        {/* Full Active Color Layer */}
        <div className="absolute inset-x-0 bottom-0 top-20 md:top-24 mx-0.5 md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-2xl md:rounded-3xl" />
        {/* Premium gold glow elements */}
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gold/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/10 rounded-full blur-[100px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Book Visual */}
            <motion.div 
              initial={{ opacity: 0, x: -30, rotateY: -15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8 }}
              className="relative perspective-1000"
            >
              {/* 3D Book Container - Side-based hover flip */}
              <div 
                className="relative mx-auto w-[280px] md:w-[320px] transform-gpu group" 
                style={{ perspective: '1200px' }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const centerX = rect.width / 2;
                  const rotateY = x < centerX ? 25 : -25; // Left side = flip right, right side = flip left
                  const scale = 1.05;
                  const translateZ = 50;
                  e.currentTarget.querySelector<HTMLDivElement>('.book-inner')?.style.setProperty('transform', `rotateY(${rotateY}deg) rotateX(3deg) translateZ(${translateZ}px) scale(${scale})`);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.querySelector<HTMLDivElement>('.book-inner')?.style.setProperty('transform', 'rotateY(-12deg) rotateX(5deg)');
                }}
              >
                <div 
                  className="book-inner relative transform-gpu transition-transform duration-500 ease-out"
                  style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-12deg) rotateX(5deg)' }}
                >
                  {/* Book Cover */}
                  <div className="relative bg-gradient-to-br from-zinc-900 via-black to-zinc-900 rounded-lg overflow-hidden shadow-2xl border border-gold/30" style={{ boxShadow: '20px 20px 60px rgba(0,0,0,0.8), -5px -5px 20px rgba(168, 146, 90, 0.1)' }}>
                    {/* Book Spine Effect - Thicker for readability */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900 border-r border-gold/30"
                      style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-90deg) translateX(-16px)', transformOrigin: 'left center' }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span 
                          className="text-gold text-[9px] font-bold tracking-[0.15em] uppercase whitespace-nowrap"
                          style={{ transform: 'rotate(-90deg)', textShadow: '0 0 10px rgba(200,167,102,0.5)' }}
                        >
                          JBJ Global Real Estate 2026
                        </span>
                      </div>
                    </div>
                    
                    {/* Visible Spine on Cover */}
                    <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gold/40 via-gold/20 to-transparent" />
                    
                    {/* Cover Image */}
                    <img 
                      src={luxuryVilla1}
                      alt="UAE Luxury Real Estate"
                      className="w-full h-48 md:h-56 object-cover opacity-60"
                    />
                    
                    {/* Cover Content */}
                    <div className="p-6 md:p-8 relative">
                      {/* Gold Line */}
                      <div className="w-16 h-1 bg-gradient-to-r from-gold to-gold-dark mb-4" />
                      
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] uppercase tracking-[0.2em] mb-4">
                        <Sparkles className="w-3 h-3" />
                        Latest Edition 2026
                      </div>
                      
                      <h3 className="text-white text-xl md:text-2xl font-bold leading-tight mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                        UAE Real Estate
                        <span className="block text-gold">Market Intelligence</span>
                      </h3>
                      
                      <FounderContent fallback={null}>
                        <p className="text-zinc-500 text-xs mt-4">By Founder & CEO Jane Bou Jaoude</p>
                      </FounderContent>
                      
                      {/* JJ Logo */}
                      <div className="mt-6 pt-4 border-t border-zinc-800">
                        <p className="text-zinc-400 text-[10px] tracking-[0.3em] uppercase">JBJ Global Real Estate</p>
                      </div>
                    </div>
                    
                    {/* Book Pages Effect - Thicker pages */}
                    <div className="absolute right-0 top-0 bottom-0 w-3">
                      <div className="h-full bg-gradient-to-l from-zinc-100/10 via-zinc-200/15 to-transparent" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 95%, 0 5%)' }} />
                      {/* Individual page lines for depth */}
                      <div className="absolute right-0 top-[5%] bottom-[5%] w-[2px] bg-zinc-300/20" />
                      <div className="absolute right-[3px] top-[6%] bottom-[6%] w-[1px] bg-zinc-300/15" />
                      <div className="absolute right-[5px] top-[7%] bottom-[7%] w-[1px] bg-zinc-300/10" />
                    </div>
                  </div>
                  
                  {/* Shadow */}
                  <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black/60 blur-xl rounded-full transition-all duration-500 group-hover:blur-2xl group-hover:h-10" />
                </div>
              </div>
              
              {/* Floating Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute -bottom-2 -right-4 md:right-8 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black px-4 py-2 rounded-full shadow-lg border border-gold/50"
              >
                <span className="text-xs font-bold uppercase tracking-wider">Free Download</span>
              </motion.div>
            </motion.div>
            
            {/* Right: Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs uppercase tracking-[0.25em] mb-6">
                <FileText className="w-4 h-4" />
                Exclusive Market Report
              </div>
              
              <h1 className="text-black text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
                Unlock Your
                <span className="block text-gold">Investment Edge</span>
              </h1>
              
              <p className="text-black text-lg md:text-xl leading-relaxed mb-8">
                An educational, founder-led overview designed around government-led sources and structured decision frameworks—created exclusively for clients of JBJ Global Real Estate.
              </p>
              
              {/* What You Get */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: TrendingUp, text: "Market Analysis" },
                  { icon: Shield, text: "Due Diligence" },
                  { icon: Star, text: "AI Matchmaker Access" },
                  { icon: BookOpen, text: "Expert Insights" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-zinc-700 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-gold/20 border border-gold/30 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-gold" />
                    </div>
                    <span className="text-black">{item.text}</span>
                  </div>
                ))}
              </div>
              
              {/* Scroll CTA - PRIMARY BUTTON */}
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => {
                  const el = document.getElementById('unlock-form');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="shadow-[0_10px_30px_rgba(200,167,102,0.4)] hover:shadow-[0_15px_40px_rgba(200,167,102,0.5)] transition-all"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Your Free Book Now
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <FounderContent fallback={null}>
        {/* Founder Quote Section */}
        <section className="py-16 border-y border-zinc-800/50 bg-gradient-to-r from-gold/5 via-transparent to-gold/5">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              {/* GLOBAL FOUNDER IMAGE RULE: Perfect center 40%, no cropping */}
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-gold/50 mx-auto mb-6 bg-zinc-900">
                <img 
                  src={founderProfessional} 
                  alt="Jane Bou Jaoude, Founder & CEO of JBJ GLOBAL REAL ESTATE"
                  className="w-full h-full"
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'center 40%',
                  }}
                />
              </div>
              <blockquote className="text-white text-xl md:text-2xl lg:text-3xl font-light leading-relaxed mb-6 italic" style={{ fontFamily: "Poppins, sans-serif" }}>
                "This book represents years of experience in UAE real estate, distilled into actionable frameworks. I created it so investors can make informed decisions with confidence."
              </blockquote>
              <div>
                <p className="text-white font-semibold text-lg tracking-wide">Jane Bou Jaoude</p>
                <p className="text-gold text-sm font-medium mt-1">Founder & CEO</p>
                <p className="text-zinc-400 text-sm mt-0.5">JBJ Global Real Estate</p>
              </div>
            </motion.div>
          </div>
        </section>
      </FounderContent>

      {/* Download Book Section - Uses jj-layer-2 styling to match "Unlock Your Investment Edge" */}
      <section className="py-12 md:py-16 bg-black">
        <div className="jj-layer-2">
          <div className="grid lg:grid-cols-5 gap-10 items-start">
            {/* Form Section */}
            <motion.section 
              id="unlock-form"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-3 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-3xl p-8 md:p-10 shadow-xl"
            >
            {/* Show streamlined view for returning users */}
            {canDirectDownload ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-gold" />
                </div>
                <h2 className="text-black text-2xl font-bold mb-2">Welcome back, <span className="text-gold">{leadData?.fullName || leadData?.email}</span></h2>
                <p className="text-zinc-500 text-sm mb-8">Click below to instantly access your Market Intelligence book.</p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleDirectDownload}
                  className="w-full h-14 text-base shadow-[0_10px_30px_rgba(200,167,102,0.4)] hover:shadow-[0_15px_40px_rgba(200,167,102,0.5)] transition-all"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Book Now
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center flex-shrink-0">
                    <Unlock className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h2 className="text-black text-2xl font-bold">Unlock Your Book</h2>
                    <p className="text-zinc-600 mt-1">
                      Complete the form below to unlock instant access to the UAE Market Intelligence book.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <Label className="text-zinc-700 text-sm font-medium">Full Name *</Label>
                    <Input
                      value={form.fullName}
                      onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                      placeholder="Enter your full name"
                      className="mt-2 bg-zinc-50 border-zinc-300 text-black h-12 rounded-xl focus:border-gold/50 focus:ring-gold/20"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-black text-sm font-medium">Email <span className="text-gold">*</span></Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="mt-2 bg-zinc-50 border-zinc-300 text-black placeholder:text-gold h-12 rounded-xl focus:border-gold/50 focus:ring-gold/20"
                      />
                    </div>
                    <div>
                      <Label className="text-black text-sm font-medium">Phone <span className="text-gold">*</span></Label>
                      <Input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+971 50 123 4567"
                        className="mt-2 bg-zinc-50 border-zinc-300 text-black placeholder:text-gold h-12 rounded-xl focus:border-gold/50 focus:ring-gold/20"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-black text-sm font-medium">Nationality <span className="text-gold">*</span></Label>
                      <div className="mt-2">
                        <SearchableSelect
                          value={form.nationality}
                          onChange={(v) => setForm((p) => ({ ...p, nationality: v }))}
                          options={countries}
                          placeholder="Select nationality"
                          searchPlaceholder="Search countries..."
                          priorityItem="United Arab Emirates"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-black text-sm font-medium">Preferred Language <span className="text-gold">*</span></Label>
                      <div className="mt-2">
                        <SearchableSelect
                          value={form.language}
                          onChange={(v) => setForm((p) => ({ ...p, language: v }))}
                          options={languages}
                          placeholder="Select language"
                          searchPlaceholder="Search languages..."
                          priorityItem="English"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    onClick={handleSubmit}
                    disabled={!isValid || isSubmitting}
                    variant="primary"
                    size="lg"
                    className="w-full h-14"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 mr-2 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Unlock className="w-5 h-5 mr-2" />
                        Unlock & Download Now
                        <ArrowUpRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-zinc-600 text-xs leading-relaxed text-center mt-4">
                  By downloading, you agree your details may be used to contact you about UAE real estate opportunities.
                </p>
              </>
            )}
          </motion.section>

          {/* Sidebar */}
          <motion.aside 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* What You'll Receive - White/Champagne Theme */}
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-3xl p-8 shadow-lg">
              <h2 className="text-black text-xl font-bold mb-6">What You'll Receive</h2>
              <ul className="space-y-4">
                {[
                  "Structured market overview (educational)",
                  "Developer & community comparison frameworks",
                  "Investment due diligence checklist",
                  "Complimentary AI Home Finder access",
                  "Expert insights from the founder",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Brand Box - White/Champagne Theme - JBJ Global Real Estate links to About */}
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-2xl p-6 text-center shadow-lg">
              <p className="text-zinc-600 text-xs mb-1">
                Created by <span className="text-black font-semibold">JBJ Global Real Estate</span>
              </p>
              <p className="text-zinc-700 text-sm">
                Exclusive for <a href="/about" className="text-gold font-semibold hover:underline">JBJ Global Real Estate</a>
              </p>
              <p className="text-zinc-500 text-[10px] mt-2 uppercase tracking-widest">
                Real Estate Brokerage • Dubai, UAE
              </p>
            </div>
          </motion.aside>
        </div>
        </div>
      </section>

      {/* CTA Modal after download */}
      <MarketReportCTAModal
        open={showCTAModal}
        onOpenChange={setShowCTAModal}
        userName={form.fullName || leadData?.fullName}
      />
    </div>
  );
};

export default MarketReport;
