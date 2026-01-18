/**
 * PDF Report Generator Utility
 * Creates branded, downloadable PDF reports for property listings and market analysis
 * 
 * BRAND: JBJ GLOBAL REAL ESTATE
 * STYLE: White/champagne/gold background with black and gold content
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateWatermarkId, getCopyrightOverlay } from './pdfWatermark';
import { CONTACT_INFO } from '@/constants/stats';

export interface PropertyReportData {
  title: string;
  propertyName?: string;
  propertyImage?: string;
  location?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  sizeUnit?: 'sqft' | 'sqm';
  price?: number;
  priceType?: 'sale' | 'rent';
  currency?: string;
  analysisData?: {
    marketTrend?: string;
    pricePerSqft?: number;
    rentalYield?: number;
    demandScore?: number;
    supplyScore?: number;
    yearOverYear?: number;
    highlights?: string[];
    recommendation?: string;
  };
  dataSources?: string[];
  generatedAt?: Date;
}

export interface ReportBrandingOptions {
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  websiteUrl?: string;
  whatsappUrl?: string;
  includeQR?: boolean;
}

const DEFAULT_BRANDING: ReportBrandingOptions = {
  companyName: 'JBJ GLOBAL REAL ESTATE',
  companyEmail: CONTACT_INFO.email,
  companyPhone: CONTACT_INFO.phone,
  websiteUrl: 'https://jbjglobalrealestate.lovable.app',
  whatsappUrl: `https://wa.me/${CONTACT_INFO.phoneRaw}`,
  includeQR: true,
};

// Color palette (RGB values 0-1)
const COLORS = {
  black: rgb(0, 0, 0),
  white: rgb(1, 1, 1),
  gold: rgb(0.66, 0.58, 0.35), // #A8925A
  champagne: rgb(0.96, 0.94, 0.90), // #F5F0E6
  lightGold: rgb(0.83, 0.77, 0.66), // #D4C4A8
  zinc: rgb(0.4, 0.4, 0.4),
  lightZinc: rgb(0.6, 0.6, 0.6),
};

/**
 * Generates a branded PDF report for a property listing
 */
export async function generatePropertyReport(
  data: PropertyReportData,
  branding: ReportBrandingOptions = DEFAULT_BRANDING
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  
  const { width, height } = page.getSize();
  const margin = 50;
  
  // Load fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const watermarkId = generateWatermarkId();
  const generatedAt = data.generatedAt || new Date();
  
  // === HEADER SECTION ===
  // Gold header bar
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width: width,
    height: 80,
    color: COLORS.black,
  });
  
  // Company name
  page.drawText(branding.companyName || 'JBJ GLOBAL REAL ESTATE', {
    x: margin,
    y: height - 45,
    size: 16,
    font: helveticaBold,
    color: COLORS.gold,
  });
  
  // Tagline
  page.drawText('BUY · SELL · RENT', {
    x: margin,
    y: height - 62,
    size: 10,
    font: helvetica,
    color: COLORS.white,
  });
  
  // Report type label
  page.drawText('PROPERTY ANALYSIS REPORT', {
    x: width - margin - 180,
    y: height - 45,
    size: 10,
    font: helveticaBold,
    color: COLORS.gold,
  });
  
  // Date
  page.drawText(generatedAt.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), {
    x: width - margin - 180,
    y: height - 60,
    size: 9,
    font: helvetica,
    color: COLORS.white,
  });
  
  // === MAIN CONTENT ===
  let yPos = height - 120;
  
  // Report Title
  page.drawText(data.title || 'Property Market Analysis', {
    x: margin,
    y: yPos,
    size: 20,
    font: helveticaBold,
    color: COLORS.black,
  });
  yPos -= 30;
  
  // Property Name
  if (data.propertyName) {
    page.drawText(data.propertyName, {
      x: margin,
      y: yPos,
      size: 14,
      font: helveticaBold,
      color: COLORS.gold,
    });
    yPos -= 25;
  }
  
  // Location
  if (data.location) {
    page.drawText(`Location: ${data.location}`, {
      x: margin,
      y: yPos,
      size: 11,
      font: helvetica,
      color: COLORS.zinc,
    });
    yPos -= 20;
  }
  
  // Property details box
  if (data.propertyType || data.bedrooms || data.size) {
    yPos -= 10;
    page.drawRectangle({
      x: margin,
      y: yPos - 60,
      width: width - (margin * 2),
      height: 70,
      color: COLORS.champagne,
      borderColor: COLORS.lightGold,
      borderWidth: 1,
    });
    
    const detailY = yPos - 25;
    let detailX = margin + 20;
    
    if (data.propertyType) {
      page.drawText('Type', { x: detailX, y: detailY, size: 8, font: helvetica, color: COLORS.lightZinc });
      page.drawText(data.propertyType, { x: detailX, y: detailY - 15, size: 11, font: helveticaBold, color: COLORS.black });
      detailX += 100;
    }
    
    if (data.bedrooms !== undefined) {
      page.drawText('Bedrooms', { x: detailX, y: detailY, size: 8, font: helvetica, color: COLORS.lightZinc });
      page.drawText(data.bedrooms.toString(), { x: detailX, y: detailY - 15, size: 11, font: helveticaBold, color: COLORS.black });
      detailX += 80;
    }
    
    if (data.bathrooms !== undefined) {
      page.drawText('Bathrooms', { x: detailX, y: detailY, size: 8, font: helvetica, color: COLORS.lightZinc });
      page.drawText(data.bathrooms.toString(), { x: detailX, y: detailY - 15, size: 11, font: helveticaBold, color: COLORS.black });
      detailX += 80;
    }
    
    if (data.size) {
      const sizeLabel = data.sizeUnit === 'sqm' ? 'Size (sqm)' : 'Size (sqft)';
      page.drawText(sizeLabel, { x: detailX, y: detailY, size: 8, font: helvetica, color: COLORS.lightZinc });
      page.drawText(data.size.toLocaleString(), { x: detailX, y: detailY - 15, size: 11, font: helveticaBold, color: COLORS.black });
      detailX += 100;
    }
    
    if (data.price) {
      const priceLabel = data.priceType === 'rent' ? 'Rent/Year' : 'Price';
      const currency = data.currency || 'AED';
      page.drawText(priceLabel, { x: detailX, y: detailY, size: 8, font: helvetica, color: COLORS.lightZinc });
      page.drawText(`${currency} ${data.price.toLocaleString()}`, { x: detailX, y: detailY - 15, size: 11, font: helveticaBold, color: COLORS.gold });
    }
    
    yPos -= 80;
  }
  
  // === ANALYSIS SECTION ===
  if (data.analysisData) {
    yPos -= 20;
    
    page.drawText('MARKET ANALYSIS', {
      x: margin,
      y: yPos,
      size: 12,
      font: helveticaBold,
      color: COLORS.black,
    });
    yPos -= 25;
    
    // Analysis metrics grid
    const analysis = data.analysisData;
    const metricsStartY = yPos;
    const colWidth = (width - margin * 2) / 3;
    
    const metrics = [
      { label: 'Market Trend', value: analysis.marketTrend || 'N/A' },
      { label: 'Price/Sqft', value: analysis.pricePerSqft ? `AED ${analysis.pricePerSqft.toLocaleString()}` : 'N/A' },
      { label: 'Rental Yield', value: analysis.rentalYield ? `${analysis.rentalYield}%` : 'N/A' },
      { label: 'Demand Score', value: analysis.demandScore ? `${analysis.demandScore}/100` : 'N/A' },
      { label: 'Supply Score', value: analysis.supplyScore ? `${analysis.supplyScore}/100` : 'N/A' },
      { label: 'YoY Change', value: analysis.yearOverYear !== undefined ? `${analysis.yearOverYear > 0 ? '+' : ''}${analysis.yearOverYear}%` : 'N/A' },
    ];
    
    metrics.forEach((metric, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = margin + (col * colWidth);
      const y = metricsStartY - (row * 45);
      
      page.drawRectangle({
        x: x,
        y: y - 35,
        width: colWidth - 10,
        height: 40,
        color: COLORS.champagne,
        borderColor: COLORS.lightGold,
        borderWidth: 0.5,
      });
      
      page.drawText(metric.label, { x: x + 10, y: y - 12, size: 8, font: helvetica, color: COLORS.lightZinc });
      page.drawText(metric.value, { x: x + 10, y: y - 26, size: 11, font: helveticaBold, color: COLORS.black });
    });
    
    yPos = metricsStartY - 100;
    
    // Highlights
    if (analysis.highlights && analysis.highlights.length > 0) {
      yPos -= 10;
      page.drawText('KEY INSIGHTS', {
        x: margin,
        y: yPos,
        size: 10,
        font: helveticaBold,
        color: COLORS.gold,
      });
      yPos -= 18;
      
      analysis.highlights.slice(0, 4).forEach((highlight) => {
        page.drawText(`• ${highlight}`, {
          x: margin + 10,
          y: yPos,
          size: 9,
          font: helvetica,
          color: COLORS.zinc,
        });
        yPos -= 15;
      });
    }
    
    // Recommendation
    if (analysis.recommendation) {
      yPos -= 15;
      page.drawRectangle({
        x: margin,
        y: yPos - 45,
        width: width - (margin * 2),
        height: 55,
        color: rgb(0.98, 0.97, 0.94),
        borderColor: COLORS.gold,
        borderWidth: 1,
      });
      
      page.drawText('AI RECOMMENDATION', {
        x: margin + 15,
        y: yPos - 15,
        size: 9,
        font: helveticaBold,
        color: COLORS.gold,
      });
      
      // Wrap recommendation text
      const maxChars = 90;
      const recText = analysis.recommendation.slice(0, maxChars * 2);
      const lines = [];
      for (let i = 0; i < recText.length; i += maxChars) {
        lines.push(recText.slice(i, i + maxChars));
      }
      
      lines.forEach((line, i) => {
        page.drawText(line, {
          x: margin + 15,
          y: yPos - 30 - (i * 12),
          size: 9,
          font: helvetica,
          color: COLORS.zinc,
        });
      });
      
      yPos -= 60;
    }
  }
  
  // === DATA SOURCES ===
  if (data.dataSources && data.dataSources.length > 0) {
    yPos -= 20;
    page.drawText('DATA SOURCES', {
      x: margin,
      y: yPos,
      size: 9,
      font: helveticaBold,
      color: COLORS.lightZinc,
    });
    yPos -= 12;
    page.drawText(data.dataSources.join(' • '), {
      x: margin,
      y: yPos,
      size: 8,
      font: helvetica,
      color: COLORS.lightZinc,
    });
  }
  
  // === FOOTER ===
  // Footer background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 90,
    color: COLORS.black,
  });
  
  // Contact info
  page.drawText(branding.companyName || 'JBJ GLOBAL REAL ESTATE', {
    x: margin,
    y: 65,
    size: 11,
    font: helveticaBold,
    color: COLORS.gold,
  });
  
  page.drawText(`Email: ${branding.companyEmail} | Phone: ${branding.companyPhone}`, {
    x: margin,
    y: 48,
    size: 8,
    font: helvetica,
    color: COLORS.white,
  });
  
  page.drawText(`Website: ${branding.websiteUrl}`, {
    x: margin,
    y: 35,
    size: 8,
    font: helvetica,
    color: COLORS.gold,
  });
  
  // Watermark ID
  page.drawText(`Report ID: ${watermarkId}`, {
    x: width - margin - 100,
    y: 65,
    size: 7,
    font: helvetica,
    color: COLORS.lightZinc,
  });
  
  // Copyright
  page.drawText(getCopyrightOverlay(), {
    x: margin,
    y: 15,
    size: 6,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // CTA
  page.drawText('WhatsApp us for expert guidance →', {
    x: width - margin - 160,
    y: 35,
    size: 8,
    font: helveticaBold,
    color: COLORS.gold,
  });
  
  return await pdfDoc.save();
}

/**
 * Downloads the generated PDF report
 */
export function downloadPdfReport(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convenience function to generate and download a property report
 */
export async function generateAndDownloadPropertyReport(
  data: PropertyReportData,
  branding?: ReportBrandingOptions
): Promise<void> {
  const pdfBytes = await generatePropertyReport(data, branding);
  const filename = `JBJ-${data.propertyName || 'Property'}-Analysis-${new Date().toISOString().split('T')[0]}.pdf`;
  downloadPdfReport(pdfBytes, filename.replace(/\s+/g, '-'));
}
