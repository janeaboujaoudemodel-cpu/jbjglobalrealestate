import DOMPurify from 'dompurify';
import { sanitizeForDisplay, sanitizeHtml } from '@/utils/contentSanitizer';

/**
 * Strip social media hashtags from text
 */
function stripHashtags(text: string): string {
  return text
    .replace(/#\w+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Clean up raw text for premium display
 */
function cleanRawText(text: string): string {
  return text
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/(?<=\s)#\w+/g, '')
    .replace(/^#\w+$/gm, '')
    .replace(/!{2,}/g, '!')
    .replace(/\b[A-Z]{4,}\s+[A-Z]{4,}(\s+[A-Z]{4,})+\b/g, (match) => {
      return match.charAt(0) + match.slice(1).toLowerCase();
    })
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Convert markdown tables to HTML tables with premium styling
 */
function convertMarkdownTables(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    // Detect table: line with |, followed by separator line with |---|
    if (lines[i]?.includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+\s*\|/.test(lines[i + 1])) {
      const headerLine = lines[i].trim().replace(/^\||\|$/g, '');
      const headers = headerLine.split('|').map(h => h.trim());
      
      let tableHtml = '<table class="w-full border-collapse my-6 text-sm"><thead><tr>';
      for (const h of headers) {
        tableHtml += `<th class="bg-champagne-light/50 text-left p-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 border border-gold/20">${h}</th>`;
      }
      tableHtml += '</tr></thead><tbody>';

      i += 2; // Skip header and separator

      while (i < lines.length && lines[i]?.includes('|')) {
        const rowLine = lines[i].trim().replace(/^\||\|$/g, '');
        const cells = rowLine.split('|').map(c => c.trim());
        tableHtml += '<tr>';
        for (const c of cells) {
          tableHtml += `<td class="p-3 border border-gold/10 text-sm">${c}</td>`;
        }
        tableHtml += '</tr>';
        i++;
      }

      tableHtml += '</tbody></table>';
      result.push(tableHtml);
    } else {
      result.push(lines[i]);
      i++;
    }
  }

  return result.join('\n');
}

/**
 * Detect Reelly plain-text section labels and convert to markdown headings.
 * This transforms wall-of-text descriptions into structured, readable sections.
 */
export function formatReellyDescription(text: string): string {
  const SECTION_MAP: Record<string, string | null> = {
    'project general facts': null,
    'location description and benefits': '## Location',
    'location description': '## Location',
    'finishing and materials': '## Finishing & Materials',
    'kitchen and appliances': '## Kitchen & Appliances',
    'furnishing': '## Furnishing',
    'project highlights': '## Highlights',
    'amenities and facilities': '## Amenities & Facilities',
    'amenities': '## Amenities',
    'payment plan': '## Payment Plan',
    'about the project': null,
    'project overview': null,
    'key features': '## Key Features',
    'community': '## Community',
    'connectivity': '## Connectivity',
    'nearby attractions': '## Nearby Attractions',
    // Expanded patterns
    'features': '## Features',
    'facilities': '## Facilities',
    'unit types': '## Unit Types',
    'investment highlights': '## Investment Highlights',
    'developer': '## Developer',
    'property details': '## Property Details',
    'property description': null,
    'building features': '## Building Features',
    'interior features': '## Interior Features',
    'outdoor features': '## Outdoor Features',
    'leisure facilities': '## Leisure Facilities',
    'security features': '## Security Features',
    'smart home features': '## Smart Home',
    'sustainability': '## Sustainability',
    'design and architecture': '## Design & Architecture',
    'lifestyle': '## Lifestyle',
    'master plan': '## Master Plan',
    'why invest': '## Why Invest',
    'about the developer': '## About the Developer',
    'about developer': '## About the Developer',
    'project specifications': '## Specifications',
    'specifications': '## Specifications',
    'highlights': '## Highlights',
    'overview': null,
    'description': null,
  };

  let result = text;

  // Replace known section labels at start of line (case-insensitive)
  for (const [pattern, replacement] of Object.entries(SECTION_MAP)) {
    const regex = new RegExp(`(^|\\n)\\s*${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:?\\s*(\\n|$)`, 'gi');
    if (replacement === null) {
      result = result.replace(regex, '$1$2');
    } else {
      result = result.replace(regex, `$1\n${replacement}\n$2`);
    }
  }

  // Auto-detect: standalone short line (≤50 chars, no period, followed by longer text)
  result = result.replace(
    /\n([A-Z][A-Za-z &,\-\/]{3,48})\n\n([A-Z])/g,
    (_, heading, nextChar) => {
      const lower = heading.toLowerCase().trim();
      if (lower.includes('.') || lower.split(' ').length > 8) return _;
      return `\n\n## ${heading.trim()}\n\n${nextChar}`;
    }
  );

  // Detect inline numbered lists (e.g., "1. Feature one 2. Feature two")
  result = result.replace(
    /(\d+)\.\s+([^.]+?)(?=\s+\d+\.\s|$)/g,
    '\n$1. $2'
  );

  // Fallback: if no headings detected and text > 500 chars, auto-split into paragraphs
  if (!result.includes('## ') && result.length > 500) {
    const sentences = result.split(/(?<=[.!?])\s+/);
    const chunks: string[] = [];
    let current: string[] = [];
    
    for (const sentence of sentences) {
      current.push(sentence);
      if (current.length >= 3) {
        chunks.push(current.join(' '));
        current = [];
      }
    }
    if (current.length > 0) chunks.push(current.join(' '));
    
    result = chunks.join('\n\n');
  }

  // Clean up excessive blank lines
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

/**
 * Convert markdown text to safe HTML
 */
export function renderMarkdownToHtml(markdown: string | null): string {
  if (!markdown) return '';
  
  // Strip HTML tags and competitor references from source before processing
  let cleaned = sanitizeForDisplay(markdown);
  cleaned = cleanRawText(cleaned);
  
  // Convert markdown tables first
  cleaned = convertMarkdownTables(cleaned);

  // Convert markdown headers to styled HTML headings
  cleaned = cleaned
    .replace(/^#{5,6}\s*(.+)$/gm, '<h4 class="text-lg font-semibold text-foreground mt-6 mb-2">$1</h4>')
    .replace(/^#{3,4}\s*(.+)$/gm, '<h3 class="text-xl font-bold text-foreground mt-8 mb-3">$1</h3>')
    .replace(/^#{1,2}\s*(.+)$/gm, '<h2 class="text-2xl font-bold text-foreground mt-8 mb-4">$1</h2>');
  
  let html = cleaned
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-gold hover:underline">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^• (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/\n\n/g, '</p><p class="mt-3">')
    .replace(/\n/g, '<br/>');
  
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }
  
  html = html.replace(/(<li[^>]*>.*?<\/li>(?:<br\/>)?)+/g, '<ul class="list-disc pl-5 space-y-1 my-3">$&</ul>');
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote'],
    ALLOWED_ATTR: ['href', 'class', 'target', 'rel', 'style'],
  });
}

/**
 * Clean description text for database storage
 */
export function cleanDescription(text: string | null): string | null {
  if (!text) return null;
  return text
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() || null;
}

export function stripMarkdown(markdown: string | null): string {
  if (!markdown) return '';
  return cleanRawText(markdown)
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s*/gm, '• ')
    .trim();
}

/**
 * Truncate text to a maximum length, preserving word boundaries
 */
export function truncateText(text: string | null, maxLength: number = 160): string {
  if (!text) return '';
  const cleaned = stripMarkdown(text);
  if (cleaned.length <= maxLength) return cleaned;
  
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}
