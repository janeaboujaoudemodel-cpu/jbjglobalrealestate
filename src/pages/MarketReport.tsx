import { useMemo, useState } from "react";
import Footer from "@/components/Footer";
import GlobalHeader from "@/components/GlobalHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_INFO } from "@/constants/stats";
import { getCountryList, getLanguageList } from "@/constants/localeOptions";
import founderProfessional from "@/assets/founder-professional.jpeg";
import luxuryVilla1 from "@/assets/luxury-villa-1.jpeg";
import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen, CheckCircle, Download, FileText, Lock, Shield, Sparkles, Star, TrendingUp, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MarketReport = () => {
  const countries = useMemo(() => getCountryList(), []);
  const languages = useMemo(() => getLanguageList(), []);
  const [downloaded, setDownloaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    language: "",
  });

  const isValid =
    form.fullName.trim().length > 1 &&
    form.email.trim().includes("@") &&
    form.phone.trim().length >= 6 &&
    form.nationality.trim().length > 0 &&
    form.language.trim().length > 0;

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

  const downloadBook = () => {
    const websiteUrl = "https://jjglobalcapital.com";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(websiteUrl + "/quiz")}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>UAE Real Estate Market Intelligence 2025-2026 | JJ Global Capital</title>
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
    background: linear-gradient(135deg, rgba(168, 146, 90, 0.15) 0%, rgba(0,0,0,0.5) 100%);
    border: 1px solid rgba(168, 146, 90, 0.3);
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
  
  @media print {
    .page { page-break-after: always; }
    body { background: #000; }
  }
</style>
</head>
<body>
  <!-- COVER PAGE -->
  <div class="page cover">
    <div class="logo-large">JJ | Global Capital</div>
    <h1>UAE Real Estate<br/>Market Intelligence</h1>
    <div class="subtitle">Investor Education & Decision Framework</div>
    <div class="edition">2025 – 2026 Edition</div>
    <div class="author-box">
      <div class="author-name">Jane Abou Jaoude</div>
      <div class="author-title">Founder & Chairwoman • JJ Global Capital</div>
    </div>
  </div>

  <!-- TABLE OF CONTENTS -->
  <div class="page">
    <h2>Table of Contents</h2>
    <div class="toc">
      <div class="toc-item"><span class="title">1. Introduction: Why This Book</span><span class="page-num">3</span></div>
      <div class="toc-item"><span class="title">2. UAE Market Overview 2024-2025</span><span class="page-num">4</span></div>
      <div class="toc-item"><span class="title">3. Dubai Real Estate Fundamentals</span><span class="page-num">5</span></div>
      <div class="toc-item"><span class="title">4. Key Investment Indicators</span><span class="page-num">6</span></div>
      <div class="toc-item"><span class="title">5. Developer Analysis Framework</span><span class="page-num">7</span></div>
      <div class="toc-item"><span class="title">6. Community Comparison Guide</span><span class="page-num">8</span></div>
      <div class="toc-item"><span class="title">7. Off-Plan vs Ready Properties</span><span class="page-num">9</span></div>
      <div class="toc-item"><span class="title">8. Due Diligence Checklist</span><span class="page-num">10</span></div>
      <div class="toc-item"><span class="title">9. Risk Management</span><span class="page-num">11</span></div>
      <div class="toc-item"><span class="title">10. AI Property Matchmaker</span><span class="page-num">12</span></div>
    </div>
    <div class="highlight-box">
      <h4 style="margin-top: 0;">About This Book</h4>
      <p style="margin-bottom: 0;">This educational guide is designed to help investors understand the UAE real estate market using government data, structured frameworks, and expert insights. It does not constitute financial or brokerage advice.</p>
    </div>
    <span class="page-number">2</span>
  </div>

  <!-- INTRODUCTION -->
  <div class="page">
    <h2>1. Introduction: Why This Book</h2>
    <p>The UAE real estate market has evolved into one of the world's most dynamic investment destinations. With transaction volumes exceeding AED 500 billion in 2024 and continued infrastructure development, the opportunity is clear—but so is the need for informed decision-making.</p>
    
    <h3>A Message from the Founder</h3>
    <div class="highlight-box">
      <p style="font-style: italic; font-size: 15px; margin-bottom: 0;">"After years of guiding investors through UAE real estate transactions, I created this book to distill the essential knowledge every investor needs. My goal is to help you make confident, data-driven decisions—whether you're purchasing your first property or expanding your portfolio."</p>
      <p style="color: #A8925A; font-weight: 600; margin-top: 15px; margin-bottom: 0;">— Jane Abou Jaoude, Founder & Chairwoman</p>
    </div>
    
    <h3>What You Will Learn</h3>
    <ul>
      <li>How to read and interpret official market data from Dubai Land Department</li>
      <li>Frameworks for comparing developers, communities, and property types</li>
      <li>Investment checklists for both off-plan and ready properties</li>
      <li>Risk management strategies and due diligence best practices</li>
      <li>How to use our complimentary AI Property Matchmaker tool</li>
    </ul>
    
    <h3>Data Sources & Methodology</h3>
    <p>All market data in this book is sourced from official government publications and trusted industry platforms:</p>
    <ul>
      <li>Dubai Land Department (DLD) — Official transaction records</li>
      <li>Dubai REST Platform — Real estate statistics portal</li>
      <li>RERA — Regulatory guidelines and developer ratings</li>
      <li>Property Monitor — Market analytics and trends</li>
      <li>DXB Interact — Real-time transaction data</li>
    </ul>
    <span class="page-number">3</span>
  </div>

  <!-- UAE MARKET OVERVIEW -->
  <div class="page">
    <h2>2. UAE Market Overview 2024-2025</h2>
    <p>The UAE real estate sector continues to demonstrate remarkable resilience and growth, driven by economic diversification, infrastructure investment, and favorable government policies.</p>
    
    <div class="stat-grid">
      <div class="stat-box">
        <div class="number">528B+</div>
        <div class="label">AED Transactions 2024</div>
      </div>
      <div class="stat-box">
        <div class="number">180K+</div>
        <div class="label">Properties Sold</div>
      </div>
      <div class="stat-box">
        <div class="number">7.5%</div>
        <div class="label">Average Yield</div>
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
          <li>Limited prime land supply</li>
          <li>Infrastructure megaprojects</li>
          <li>Expo 2020 legacy developments</li>
        </ul>
      </div>
    </div>
    
    <h3>Investor Demographics</h3>
    <p>The UAE continues to attract diverse international investors, with notable growth from European, Asian, and CIS markets. In 2024, overseas buyers accounted for approximately 45% of all property transactions.</p>
    
    <div class="highlight-box">
      <h4 style="margin-top: 0;">Top 10 Investor Nationalities (2024)</h4>
      <p style="margin-bottom: 0;">Indians, British, Russians, Chinese, Pakistanis, French, Egyptians, Canadians, Italians, Germans</p>
    </div>
    <span class="page-number">4</span>
  </div>

  <!-- DUBAI FUNDAMENTALS -->
  <div class="page">
    <h2>3. Dubai Real Estate Fundamentals</h2>
    <p>Understanding the structure of Dubai's property market is essential for making informed investment decisions.</p>
    
    <h3>Property Types</h3>
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
          <td>End-users, capital appreciation</td>
        </tr>
        <tr>
          <td>Villa</td>
          <td>AED 3M+</td>
          <td>4-6%</td>
          <td>Premium lifestyle, long-term hold</td>
        </tr>
      </table>
    </div>
    
    <h3>Ownership Structures</h3>
    <ul>
      <li><strong>Freehold:</strong> Full ownership rights for UAE nationals and foreigners in designated areas</li>
      <li><strong>Leasehold:</strong> Long-term lease (typically 99 years) in certain zones</li>
      <li><strong>Usufruct:</strong> Right to use property for specified period (less common)</li>
    </ul>
    
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
    <span class="page-number">5</span>
  </div>

  <!-- KEY INDICATORS -->
  <div class="page">
    <h2>4. Key Investment Indicators</h2>
    <p>Successful real estate investment requires understanding and monitoring key market indicators. Here's what to track:</p>
    
    <h3>Primary Indicators</h3>
    <div class="two-col">
      <div class="info-card">
        <h4>Transaction Volume</h4>
        <p>Monthly transaction counts indicate market momentum. Rising volumes suggest growing demand; declining volumes may signal cooling.</p>
      </div>
      <div class="info-card">
        <h4>Price Per Sq. Ft.</h4>
        <p>Track price movements in your target area. Compare against 3-year averages to identify value opportunities or overheated zones.</p>
      </div>
      <div class="info-card">
        <h4>Rental Yield</h4>
        <p>Annual rent / Property value × 100. Dubai averages 6-8% gross yield, significantly higher than London (3%) or New York (4%).</p>
      </div>
      <div class="info-card">
        <h4>Days on Market</h4>
        <p>Properties selling quickly (< 30 days) indicate strong demand. Extended listings (> 90 days) may suggest overpricing.</p>
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
          <td>>25% or negative</td>
        </tr>
        <tr>
          <td>Price Growth YoY</td>
          <td>3-10% increase</td>
          <td>>20% (bubble risk)</td>
        </tr>
        <tr>
          <td>Rental Yield</td>
          <td>6-8%</td>
          <td><4% (overvalued)</td>
        </tr>
        <tr>
          <td>Supply Pipeline</td>
          <td>Moderate (2-3% of stock)</td>
          <td>>5% of existing stock</td>
        </tr>
      </table>
    </div>
    
    <div class="highlight-box">
      <h4 style="margin-top: 0;">Pro Tip: Data Sources</h4>
      <p style="margin-bottom: 0;">Access real-time transaction data through DXB Interact (mo.dld.gov.ae) and Property Monitor for comprehensive market analytics.</p>
    </div>
    <span class="page-number">6</span>
  </div>

  <!-- DEVELOPER ANALYSIS -->
  <div class="page">
    <h2>5. Developer Analysis Framework</h2>
    <p>Choosing the right developer is crucial, especially for off-plan purchases. Use this framework to evaluate developers objectively.</p>
    
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
          <td>On-time delivery rate, delay patterns</td>
          <td>25%</td>
        </tr>
        <tr>
          <td>Build Quality</td>
          <td>Site visits to completed projects, reviews</td>
          <td>20%</td>
        </tr>
        <tr>
          <td>Financial Stability</td>
          <td>Escrow compliance, funding sources</td>
          <td>15%</td>
        </tr>
        <tr>
          <td>Post-Handover Service</td>
          <td>Warranty, maintenance, owner feedback</td>
          <td>15%</td>
        </tr>
      </table>
    </div>
    
    <h3>Tier Classification</h3>
    <div class="two-col">
      <div class="info-card">
        <h4>Tier 1: Master Developers</h4>
        <ul>
          <li>Emaar, DAMAC, Nakheel, Dubai Properties</li>
          <li>Established track record (15+ years)</li>
          <li>Strong government backing</li>
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
    <span class="page-number">7</span>
  </div>

  <!-- COMMUNITY COMPARISON -->
  <div class="page">
    <h2>6. Community Comparison Guide</h2>
    <p>Location drives long-term value. Use this framework to compare communities based on investment fundamentals.</p>
    
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
      <li><strong>Demographics:</strong> Target tenant profile (families, professionals, tourists)</li>
      <li><strong>Maturity:</strong> Established vs. emerging communities (risk/reward balance)</li>
    </ul>
    
    <div class="highlight-box">
      <h4 style="margin-top: 0;">Emerging Areas to Watch</h4>
      <p style="margin-bottom: 0;">Dubai South, Mohammed Bin Rashid City, Dubai Islands (formerly Deira Islands), and areas along the new metro extensions offer potential for early-stage capital appreciation.</p>
    </div>
    <span class="page-number">8</span>
  </div>

  <!-- OFF-PLAN VS READY -->
  <div class="page">
    <h2>7. Off-Plan vs Ready Properties</h2>
    <p>Understanding the trade-offs between off-plan and ready properties is essential for aligning investments with your goals.</p>
    
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
        <tr>
          <td>Flexibility</td>
          <td>Assignment possible</td>
          <td>Standard resale</td>
        </tr>
      </table>
    </div>
    
    <h3>When to Choose Off-Plan</h3>
    <ul class="checklist">
      <li>You have 3-5 year investment horizon</li>
      <li>Developer has strong delivery track record</li>
      <li>Location has proven demand drivers</li>
      <li>Payment plan suits your cash flow</li>
      <li>You're comfortable with construction risk</li>
    </ul>
    
    <h3>When to Choose Ready</h3>
    <ul class="checklist">
      <li>You need immediate rental income</li>
      <li>You want to physically inspect before buying</li>
      <li>You're financing with a mortgage</li>
      <li>You prefer lower uncertainty</li>
      <li>You're buying for personal use</li>
    </ul>
    <span class="page-number">9</span>
  </div>

  <!-- DUE DILIGENCE -->
  <div class="page">
    <h2>8. Due Diligence Checklist</h2>
    <p>Thorough due diligence protects your investment. Use this comprehensive checklist before any purchase.</p>
    
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
      <li>Review Sales & Purchase Agreement carefully</li>
      <li>Check developer's completion track record</li>
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
    <span class="page-number">10</span>
  </div>

  <!-- RISK MANAGEMENT -->
  <div class="page">
    <h2>9. Risk Management</h2>
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
      <li><strong>Exit Strategy:</strong> Have clear criteria for when to sell or hold</li>
    </ul>
    
    <div class="warning-box">
      <h4>Common Investor Mistakes</h4>
      <ul style="margin-bottom: 0;">
        <li>Chasing "hot tips" without independent research</li>
        <li>Over-leveraging with multiple off-plan commitments</li>
        <li>Ignoring service charges and maintenance costs</li>
        <li>Buying based on renders instead of visiting sites</li>
      </ul>
    </div>
    <span class="page-number">11</span>
  </div>

  <!-- AI MATCHMAKER -->
  <div class="page">
    <h2>10. AI Property Matchmaker</h2>
    <p>JJ Global Capital has developed an exclusive AI-powered Property Matchmaker to help investors identify opportunities that align with their specific criteria.</p>
    
    <h3>How It Works</h3>
    <ul>
      <li><strong>Step 1:</strong> Complete a quick questionnaire about your investment goals</li>
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
        <h3 style="margin-top: 0; margin-bottom: 10px;">Try Our AI Property Matchmaker</h3>
        <p style="margin-bottom: 10px;">Scan this QR code or visit our website to access the complimentary AI assessment tool created by our founder.</p>
        <p style="color: #A8925A; font-weight: 600; margin-bottom: 0;">${websiteUrl}/quiz</p>
      </div>
    </div>
    
    <div class="footer-brand">
      <div class="logo">JJ | GLOBAL CAPITAL</div>
      <p>Part of JJ Holding Group • jjholdinggroup.com</p>
      <p style="margin-top: 10px;">Email: ${CONTACT_INFO.emailCapitalized} • Phone: ${CONTACT_INFO.phone}</p>
      <p style="margin-top: 20px; color: #888; font-size: 10px;">© 2025 JJ Global Capital. This document is for educational purposes only and does not constitute investment advice.</p>
    </div>
    <span class="page-number">12</span>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "JJ-Global-Capital-UAE-Market-Intelligence-2025.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Send email notifications via edge function
      const { error } = await supabase.functions.invoke('send-market-report-email', {
        body: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          nationality: form.nationality,
          language: form.language,
        },
      });
      
      if (error) {
        console.error('Email error:', error);
      }
      
      // Download the book
      downloadBook();
      toast.success('Your book is downloading!');
    } catch (err) {
      console.error('Submit error:', err);
      // Still download the book even if email fails
      downloadBook();
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    { icon: TrendingUp, title: "Market Analysis", desc: "Official government data & trends" },
    { icon: Shield, title: "Due Diligence", desc: "Investment checklist framework" },
    { icon: Star, title: "AI Matchmaker", desc: "Complimentary property assessment" },
    { icon: BookOpen, title: "Educational", desc: "Founder-led expert insights" },
  ];

  return (
    <div className="min-h-screen bg-black">
      <GlobalHeader />
      
      {/* Hero Section with 3D Book Visual */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-black to-black" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Book Visual */}
            <motion.div 
              initial={{ opacity: 0, x: -30, rotateY: -15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8 }}
              className="relative perspective-1000"
            >
              {/* 3D Book Container */}
              <div className="relative mx-auto w-[280px] md:w-[320px] transform-gpu" style={{ perspective: '1000px' }}>
                <div 
                  className="relative transform-gpu transition-transform duration-500 hover:rotate-y-6"
                  style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-12deg) rotateX(5deg)' }}
                >
                  {/* Book Cover */}
                  <div className="relative bg-gradient-to-br from-zinc-900 via-black to-zinc-900 rounded-lg overflow-hidden shadow-2xl border border-gold/30" style={{ boxShadow: '20px 20px 60px rgba(0,0,0,0.8), -5px -5px 20px rgba(168, 146, 90, 0.1)' }}>
                    {/* Book Spine Effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-gold/30 via-gold/10 to-transparent" />
                    
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
                        2025-2026 Edition
                      </div>
                      
                      <h3 className="text-white text-xl md:text-2xl font-bold leading-tight mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                        UAE Real Estate
                        <span className="block text-gold">Market Intelligence</span>
                      </h3>
                      
                      <p className="text-zinc-500 text-xs mt-4">By Jane Abou Jaoude</p>
                      
                      {/* JJ Logo */}
                      <div className="mt-6 pt-4 border-t border-zinc-800">
                        <p className="text-zinc-400 text-[10px] tracking-[0.3em] uppercase">JJ Global Capital</p>
                      </div>
                    </div>
                    
                    {/* Book Pages Effect */}
                    <div className="absolute right-0 top-0 bottom-0 w-2">
                      <div className="h-full bg-gradient-to-l from-zinc-100/5 via-zinc-200/10 to-transparent" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 95%, 0 5%)' }} />
                    </div>
                  </div>
                  
                  {/* Shadow */}
                  <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black/60 blur-xl rounded-full" />
                </div>
              </div>
              
              {/* Floating Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute -bottom-2 -right-4 md:right-8 bg-gradient-to-br from-gold to-gold-dark text-black px-4 py-2 rounded-full shadow-lg"
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
              
              <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
                Unlock Your
                <span className="block text-gold">Investment Edge</span>
              </h1>
              
              <p className="text-zinc-400 text-lg md:text-xl leading-relaxed mb-8">
                An educational, founder-led overview designed around government-led sources and structured decision frameworks—created exclusively for investors of JJ Global Capital.
              </p>
              
              {/* What You Get */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: TrendingUp, text: "Market Analysis" },
                  { icon: Shield, text: "Due Diligence" },
                  { icon: Star, text: "AI Matchmaker Access" },
                  { icon: BookOpen, text: "Expert Insights" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-zinc-300 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-gold" />
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
              
              {/* Scroll Indicator */}
              <a href="#unlock-form" className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors">
                <Download className="w-5 h-5" />
                <span className="font-medium">Download Your Free Book Now</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

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
            <img 
              src={founderProfessional} 
              alt="Jane Abou Jaoude"
              className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover object-center border-2 border-gold/50 mx-auto mb-6"
            />
            <blockquote className="text-white text-xl md:text-2xl lg:text-3xl font-light leading-relaxed mb-6 italic" style={{ fontFamily: "Poppins, sans-serif" }}>
              "This book represents years of experience in UAE real estate, distilled into actionable frameworks. I created it so investors can make informed decisions with confidence."
            </blockquote>
            <div>
              <p className="text-gold font-semibold text-lg">Jane Abou Jaoude</p>
              <p className="text-zinc-500 text-sm">Founder & Chairwoman, JJ Global Capital</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-5 gap-10 items-start">
          {/* Form Section */}
          <motion.section 
            id="unlock-form"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3 bg-gradient-to-br from-zinc-900/80 to-zinc-950 border border-zinc-800 rounded-3xl p-8 md:p-10"
          >
            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center flex-shrink-0">
                <Unlock className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h2 className="text-white text-2xl font-bold">Unlock Your Book</h2>
                <p className="text-zinc-400 mt-1">
                  Complete the form below to unlock instant access to the UAE Market Intelligence book.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <Label className="text-zinc-300 text-sm font-medium">Full Name *</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                  className="mt-2 bg-zinc-900/50 border-zinc-700 text-white h-12 rounded-xl focus:border-gold/50 focus:ring-gold/20"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-300 text-sm font-medium">Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="mt-2 bg-zinc-900/50 border-zinc-700 text-white h-12 rounded-xl focus:border-gold/50 focus:ring-gold/20"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300 text-sm font-medium">Phone *</Label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+971 50 123 4567"
                    className="mt-2 bg-zinc-900/50 border-zinc-700 text-white h-12 rounded-xl focus:border-gold/50 focus:ring-gold/20"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-300 text-sm font-medium">Nationality *</Label>
                  <Select
                    value={form.nationality}
                    onValueChange={(v) => setForm((p) => ({ ...p, nationality: v }))}
                  >
                    <SelectTrigger className="mt-2 bg-zinc-900/50 border-zinc-700 text-white h-12 rounded-xl">
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 max-h-72">
                      {countries.map((c) => (
                        <SelectItem key={c} value={c} className="text-white hover:bg-zinc-800">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-zinc-300 text-sm font-medium">Preferred Language *</Label>
                  <Select
                    value={form.language}
                    onValueChange={(v) => setForm((p) => ({ ...p, language: v }))}
                  >
                    <SelectTrigger className="mt-2 bg-zinc-900/50 border-zinc-700 text-white h-12 rounded-xl">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 max-h-72">
                      {languages.map((l) => (
                        <SelectItem key={l} value={l} className="text-white hover:bg-zinc-800">
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!isValid || isSubmitting}
                  className="w-full h-14 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-black font-semibold text-base rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : downloaded ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Book Unlocked!
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

              <p className="text-zinc-600 text-xs leading-relaxed text-center">
                By downloading, you agree your details may be used to contact you about UAE real estate opportunities.
              </p>
            </div>
          </motion.section>

          {/* Sidebar */}
          <motion.aside 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* What You'll Receive */}
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950 border border-zinc-800 rounded-3xl p-8">
              <h2 className="text-white text-xl font-bold mb-6">What You'll Receive</h2>
              <ul className="space-y-4">
                {[
                  "Structured market overview (educational)",
                  "Developer & community comparison frameworks",
                  "Investment due diligence checklist",
                  "Complimentary AI Home Finder access",
                  "Expert insights from our founder",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-300 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Founder Card */}
            <div className="bg-gradient-to-br from-gold/10 to-zinc-950 border border-gold/20 rounded-3xl p-8">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={founderProfessional} 
                  alt="Jane Abou Jaoude"
                  className="w-16 h-16 rounded-full object-cover object-center border-2 border-gold/50"
                />
                <div>
                  <h3 className="text-white font-semibold">Jane Abou Jaoude</h3>
                  <p className="text-gold text-sm">Founder & Chairwoman</p>
                </div>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                "This book represents years of experience in UAE real estate, distilled into actionable frameworks for investors."
              </p>
            </div>

            {/* Brand Box */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center">
              <p className="text-zinc-400 text-sm">
                Powered by <span className="text-white font-semibold">JJ Global Capital</span>
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                Part of{" "}
                <a
                  className="text-gold hover:underline"
                  href={CONTACT_INFO.holdingGroupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  JJ Holding Group
                </a>
              </p>
            </div>
          </motion.aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MarketReport;