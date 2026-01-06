/**
 * Escapes HTML special characters to prevent XSS attacks
 * when inserting user-controlled content into HTML strings.
 */
export const escapeHtml = (str: string | null | undefined): string => {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, (m) => {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeMap[m] || m;
  });
};

/**
 * Escapes CSV field values to prevent CSV injection attacks.
 * Wraps values in quotes and escapes internal quotes.
 * Also prefixes formula triggers with a single quote to prevent injection.
 */
export const escapeCsv = (str: string | null | undefined): string => {
  if (str == null) return '""';
  let val = String(str);
  
  // Prefix formula triggers to prevent CSV injection
  if (/^[=+\-@\t\r]/.test(val)) {
    val = "'" + val;
  }
  
  // Escape double quotes by doubling them and wrap in quotes
  return '"' + val.replace(/"/g, '""') + '"';
};
