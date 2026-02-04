import DOMPurify from 'dompurify';

/**
 * Convert markdown text to safe HTML
 * Handles: headers (#), bold (**), italic (*), lists, links
 */
export function renderMarkdownToHtml(markdown: string | null): string {
  if (!markdown) return '';
  
  let html = markdown
    // Headers (must process ### before ## before #)
    .replace(/^### (.+)$/gm, '<h4 class="font-semibold text-lg mt-4 mb-2">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-bold text-xl mt-6 mb-3">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="font-bold text-2xl mt-8 mb-4">$1</h2>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-gold hover:underline">$1</a>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^• (.+)$/gm, '<li class="ml-4">$1</li>')
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
    ALLOWED_TAGS: ['h2', 'h3', 'h4', 'p', 'br', 'strong', 'em', 'ul', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
  });
}

/**
 * Strip all markdown formatting for plain text display
 * Useful for meta descriptions, previews, etc.
 */
export function stripMarkdown(markdown: string | null): string {
  if (!markdown) return '';
  return markdown
    // Remove headers
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
