import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Allowed origins
const ALLOWED_ORIGINS = [
  "https://jjglobalcapital.com",
  "https://www.jjglobalcapital.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith(".lovableproject.com") || origin.endsWith(".lovable.app")
  );
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Input validation schema
const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  developer: z.string().optional(),
  location: z.string().optional(),
  emirate: z.string().optional(),
  community: z.string().optional(),
  description: z.string().optional().nullable(),
  priceFrom: z.number().optional(),
  priceTo: z.number().optional().nullable(),
  bedroomsMin: z.number().optional(),
  bedroomsMax: z.number().optional(),
  sizeMin: z.number().optional(),
  sizeMax: z.number().optional(),
  handover: z.string().optional().nullable(),
  paymentPlan: z.string().optional().nullable(),
  amenities: z.array(z.string()).optional(),
  facilities: z.array(z.string()).optional(),
  views: z.array(z.string()).optional(),
  furnishedStatus: z.string().optional().nullable(),
  floors: z.number().optional().nullable(),
  serviceCharge: z.string().optional().nullable(),
  images: z.array(z.object({
    image_url: z.string(),
    alt_text: z.string().optional().nullable(),
  })).optional(),
  documents: z.array(z.object({
    file_url: z.string(),
    file_name: z.string(),
    document_type: z.string(),
  })).optional(),
});

const RequestSchema = z.object({
  project: ProjectSchema,
});

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPrice(price: number | null | undefined): string {
  if (!price) return 'Contact for pricing';
  if (price >= 1000000) {
    return `AED ${(price / 1000000).toFixed(2)}M`;
  }
  return `AED ${price.toLocaleString()}`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { project } = parseResult.data;
    const dateStr = new Date().toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Generate comprehensive HTML report
    const reportHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(project.name)} - JJ Global Capital Property Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: #0a0a0a; 
      color: #ffffff;
      line-height: 1.6;
    }
    .page { 
      max-width: 900px; 
      margin: 0 auto; 
      padding: 40px; 
      background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
    }
    
    /* Header */
    .header { 
      text-align: center; 
      padding-bottom: 30px;
      border-bottom: 2px solid #A8925A;
      margin-bottom: 40px;
    }
    .logo { 
      font-size: 28px; 
      font-weight: 700;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }
    .logo-gold { color: #A8925A; }
    .logo-divider { margin: 0 8px; color: #A8925A; }
    .tagline { color: #888; font-size: 14px; letter-spacing: 1px; }
    .report-date { color: #666; font-size: 12px; margin-top: 15px; }
    
    /* Hero Section */
    .hero {
      background: linear-gradient(135deg, rgba(168, 146, 90, 0.15) 0%, rgba(0,0,0,0) 70%);
      border: 1px solid rgba(168, 146, 90, 0.3);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
    }
    .property-name {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #fff;
    }
    .developer-badge {
      display: inline-block;
      background: #A8925A;
      color: #000;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 15px;
    }
    .location-info { color: #999; font-size: 16px; }
    
    /* Section Styles */
    .section {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #A8925A;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #333;
    }
    
    /* Key Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .metric-card {
      background: #252525;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
    }
    .metric-value {
      font-size: 24px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 5px;
    }
    .metric-label {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    /* Details Table */
    .details-table {
      width: 100%;
      border-collapse: collapse;
    }
    .details-table tr {
      border-bottom: 1px solid #333;
    }
    .details-table td {
      padding: 12px 0;
    }
    .details-table td:first-child {
      color: #888;
      width: 40%;
    }
    .details-table td:last-child {
      color: #fff;
      font-weight: 500;
    }
    
    /* Tags */
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .tag {
      background: #252525;
      color: #A8925A;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      border: 1px solid #333;
    }
    
    /* Payment Plan */
    .payment-box {
      background: linear-gradient(135deg, rgba(168, 146, 90, 0.1) 0%, rgba(0,0,0,0) 100%);
      border: 1px solid rgba(168, 146, 90, 0.3);
      border-radius: 12px;
      padding: 20px;
      margin-top: 20px;
    }
    .payment-title {
      color: #A8925A;
      font-weight: 600;
      margin-bottom: 10px;
    }
    
    /* Documents List */
    .doc-list {
      list-style: none;
    }
    .doc-item {
      display: flex;
      align-items: center;
      padding: 12px;
      background: #252525;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .doc-icon {
      width: 40px;
      height: 40px;
      background: #A8925A;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      color: #000;
      font-weight: bold;
    }
    .doc-name { font-weight: 500; }
    .doc-type { font-size: 12px; color: #888; }
    .doc-link {
      margin-left: auto;
      color: #A8925A;
      text-decoration: none;
      font-size: 14px;
    }
    
    /* Description */
    .description {
      color: #ccc;
      line-height: 1.8;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      margin-top: 50px;
      padding-top: 30px;
      border-top: 1px solid #333;
    }
    .footer-logo { font-size: 20px; margin-bottom: 15px; }
    .contact-info { color: #888; font-size: 14px; margin-bottom: 10px; }
    .contact-info a { color: #A8925A; text-decoration: none; }
    .disclaimer {
      font-size: 11px;
      color: #666;
      margin-top: 20px;
      font-style: italic;
    }
    
    /* CTA Box */
    .cta-box {
      background: linear-gradient(135deg, #A8925A 0%, #8B7744 100%);
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin-top: 30px;
    }
    .cta-title {
      font-size: 20px;
      font-weight: 700;
      color: #000;
      margin-bottom: 10px;
    }
    .cta-text {
      color: #333;
      margin-bottom: 15px;
    }
    .cta-button {
      display: inline-block;
      background: #000;
      color: #A8925A;
      padding: 12px 30px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
    }

    @media print {
      body { background: #fff; color: #000; }
      .page { max-width: 100%; padding: 20px; }
      .section { border-color: #ddd; }
      .cta-box { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        <span class="logo-gold">J</span><span class="logo-divider">|</span><span class="logo-gold">J</span>
        GLOBAL CAPITAL
      </div>
      <div class="tagline">PREMIUM PROPERTY INVESTMENT ADVISORY</div>
      <div class="report-date">Exclusive Property Report • Generated ${dateStr}</div>
    </div>

    <!-- Hero -->
    <div class="hero">
      <div class="developer-badge">${escapeHtml(project.developer) || 'Premium Developer'}</div>
      <h1 class="property-name">${escapeHtml(project.name)}</h1>
      <p class="location-info">📍 ${escapeHtml(project.location) || 'Dubai'}${project.community ? `, ${escapeHtml(project.community)}` : ''}${project.emirate ? ` • ${escapeHtml(project.emirate)}` : ''}</p>
    </div>

    <!-- Key Metrics -->
    <div class="section">
      <h2 class="section-title">Investment Overview</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${formatPrice(project.priceFrom)}</div>
          <div class="metric-label">Starting Price</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${project.bedroomsMin || 0} - ${project.bedroomsMax || 0} BR</div>
          <div class="metric-label">Bedrooms</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${project.sizeMin?.toLocaleString() || 'N/A'} - ${project.sizeMax?.toLocaleString() || 'N/A'}</div>
          <div class="metric-label">Size (sqft)</div>
        </div>
      </div>
    </div>

    <!-- Property Details -->
    <div class="section">
      <h2 class="section-title">Property Details</h2>
      <table class="details-table">
        <tr>
          <td>Developer</td>
          <td>${escapeHtml(project.developer) || 'N/A'}</td>
        </tr>
        <tr>
          <td>Location</td>
          <td>${escapeHtml(project.location) || 'N/A'}${project.community ? `, ${escapeHtml(project.community)}` : ''}</td>
        </tr>
        <tr>
          <td>Emirate</td>
          <td>${escapeHtml(project.emirate) || 'Dubai'}</td>
        </tr>
        <tr>
          <td>Price Range</td>
          <td>${formatPrice(project.priceFrom)}${project.priceTo ? ` - ${formatPrice(project.priceTo)}` : ''}</td>
        </tr>
        <tr>
          <td>Unit Sizes</td>
          <td>${project.sizeMin?.toLocaleString() || 'N/A'} - ${project.sizeMax?.toLocaleString() || 'N/A'} sqft</td>
        </tr>
        <tr>
          <td>Bedroom Options</td>
          <td>${project.bedroomsMin || 0} - ${project.bedroomsMax || 0} Bedrooms</td>
        </tr>
        <tr>
          <td>Handover Date</td>
          <td>${escapeHtml(project.handover) || 'Contact for details'}</td>
        </tr>
        <tr>
          <td>Furnished Status</td>
          <td>${escapeHtml(project.furnishedStatus) || 'Contact for details'}</td>
        </tr>
        ${project.floors ? `<tr><td>Total Floors</td><td>${project.floors} Floors</td></tr>` : ''}
        ${project.serviceCharge ? `<tr><td>Service Charge</td><td>${escapeHtml(project.serviceCharge)}</td></tr>` : ''}
      </table>

      ${project.paymentPlan ? `
      <div class="payment-box">
        <div class="payment-title">💰 Payment Plan</div>
        <div>${escapeHtml(project.paymentPlan)}</div>
      </div>
      ` : ''}
    </div>

    ${project.description ? `
    <!-- Description -->
    <div class="section">
      <h2 class="section-title">About This Property</h2>
      <p class="description">${escapeHtml(project.description)}</p>
    </div>
    ` : ''}

    ${project.amenities && project.amenities.length > 0 ? `
    <!-- Amenities -->
    <div class="section">
      <h2 class="section-title">Amenities</h2>
      <div class="tags">
        ${project.amenities.map(a => `<span class="tag">${escapeHtml(a)}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    ${project.facilities && project.facilities.length > 0 ? `
    <!-- Facilities -->
    <div class="section">
      <h2 class="section-title">Facilities</h2>
      <div class="tags">
        ${project.facilities.map(f => `<span class="tag">${escapeHtml(f)}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    ${project.views && project.views.length > 0 ? `
    <!-- Views -->
    <div class="section">
      <h2 class="section-title">Views</h2>
      <div class="tags">
        ${project.views.map(v => `<span class="tag">🌅 ${escapeHtml(v)}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    ${project.documents && project.documents.length > 0 ? `
    <!-- Documents -->
    <div class="section">
      <h2 class="section-title">Available Documents</h2>
      <ul class="doc-list">
        ${project.documents.map(doc => `
        <li class="doc-item">
          <div class="doc-icon">📄</div>
          <div>
            <div class="doc-name">${escapeHtml(doc.file_name)}</div>
            <div class="doc-type">${escapeHtml(doc.document_type)}</div>
          </div>
          <a href="${escapeHtml(doc.file_url)}" class="doc-link" target="_blank">Download →</a>
        </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    <!-- CTA -->
    <div class="cta-box">
      <div class="cta-title">Interested in This Property?</div>
      <p class="cta-text">Our investment advisors are ready to assist you with detailed analysis, site visits, and exclusive deals.</p>
      <a href="https://jjglobalcapital.com/form/property-investment-inquiry-form/" class="cta-button">Schedule a Consultation</a>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo">
        <span style="color: #A8925A;">J | J</span> GLOBAL CAPITAL
      </div>
      <div class="contact-info">
        📧 <a href="mailto:invest@jjglobalcapital.com">invest@jjglobalcapital.com</a> • 
        📞 <a href="tel:+971565911000">+971 56 591 1000</a>
      </div>
      <div class="contact-info">
        🌐 <a href="https://jjglobalcapital.com">www.jjglobalcapital.com</a>
      </div>
      <p class="contact-info" style="margin-top: 15px;">
        Powered & Made by JJ Global Capital — Part of <a href="https://jjholdinggroup.com">JJ Holding Group</a>
      </p>
      <p class="disclaimer">
        This report is for informational purposes only. Prices, availability, and specifications are subject to change. 
        Please contact JJ Global Capital for the most current information and investment advice.
      </p>
    </div>
  </div>
</body>
</html>`;

    return new Response(JSON.stringify({ html: reportHTML }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-property-report error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
