import DOMPurify from 'dompurify';

/**
 * Strip social media hashtags from text
 * Removes patterns like #DubaiRealEstate #PropertyInDubai etc.
 */
function stripHashtags(text: string): string {
  return text
    // Remove hashtags (word characters after #)
    .replace(/#\w+/g, '')
    // Clean up multiple spaces left behind
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Clean up raw text for premium display
 * Handles common issues in API-sourced content
 */
function cleanRawText(text: string): string {
  return text
    // Remove hashtags
    .replace(/#\w+/gi, '')
    // Remove excessive exclamation marks
    .replace(/!{2,}/g, '!')
    // Remove marketing ALL CAPS phrases (more than 3 words)
    .replace(/\b[A-Z]{4,}\s+[A-Z]{4,}(\s+[A-Z]{4,})+\b/g, (match) => {
      return match.charAt(0) + match.slice(1).toLowerCase();
    })
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Clean up multiple spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Convert markdown text to safe HTML
 * Handles: headers (#), bold (**), italic (*), lists, links
 */
export function renderMarkdownToHtml(markdown: string | null): string {
  if (!markdown) return '';
  
  // First clean the raw text
  let cleaned = cleanRawText(markdown);
  
  // Additional pass: strip any remaining # symbols at line start (malformed markdown)
  cleaned = cleaned.replace(/^#{1,6}\s*/gm, '');
  
  let html = cleaned
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-gold hover:underline">$1</a>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^• (.+)$/gm, '<li class="ml-4">$1</li>')
    // Numbered lists
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4">$1</li>')
    // Line breaks - double newline = paragraph break
    .replace(/\n\n/g, '</p><p class="mt-3">')
    // Single newline = line break
    .replace(/\n/g, '<br/>');
  
  // Wrap in paragraph if not starting with HTML tag
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }
  
  // Wrap list items in ul
  html = html.replace(/(<li[^>]*>.*?<\/li>(?:<br\/>)?)+/g, '<ul class="list-disc pl-5 space-y-1 my-3">$&</ul>');
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
  });
}

/**
 * Strip all markdown formatting for plain text display
 * Useful for meta descriptions, previews, etc.
 */
export function stripMarkdown(markdown: string | null): string {
  if (!markdown) return '';
  return cleanRawText(markdown)
    // Remove headers (any # at line start or inline)
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/#{1,6}\s*/g, '')
    // Remove bold/italic
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    // Convert links to just text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Convert list markers to bullet
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
  
  // Find last space before maxLength
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}
