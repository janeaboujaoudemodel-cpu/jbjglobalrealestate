/**
 * Open a popup containing generated HTML, for print / "open in new tab" flows.
 *
 * Replaces the `printWindow.document.write(...)` pattern that was repeated
 * across the stamp, business-card, CV, document-studio and job-offer exporters.
 * Two problems with `document.write` here:
 *
 *  1. It runs the HTML parser, so a `<script>` in the written string executes —
 *     and every one of those call sites interpolates user- or DB-controlled
 *     text (company name, document title, applicant name, editor innerHTML)
 *     straight into the markup.
 *  2. It writes into a document that already exists, so the result depends on
 *     whether the popup has finished its initial parse.
 *
 * This helper instead sanitizes the markup, parses it with `DOMParser`, and
 * adopts the resulting document element. Script elements created by
 * `DOMParser` carry the "already started" flag, so they never execute even if
 * one somehow survived sanitization — defence in depth on top of
 * {@link sanitizeDocumentHtml} stripping them.
 *
 * @see src/utils/__tests__/printWindow.test.ts
 */
import { sanitizeDocumentHtml } from './safeHtml';

export interface PrintWindowOptions {
  /** `window.open` feature string, e.g. `'width=800,height=800'`. */
  features?: string;
  /** Call `print()` on the popup once the document is in place. Default true. */
  autoPrint?: boolean;
  /** Delay before printing, to let fonts and images settle. Default 250ms. */
  printDelayMs?: number;
  /** Close the popup after the print dialog is dismissed. Default false. */
  closeAfterPrint?: boolean;
}

/**
 * @returns the popup window, or `null` if it was blocked or the markup was
 * empty after sanitization.
 */
export function openPrintWindow(
  html: string,
  options: PrintWindowOptions = {},
): Window | null {
  const {
    features = '',
    autoPrint = true,
    printDelayMs = 250,
    closeAfterPrint = false,
  } = options;

  const safeHtml = sanitizeDocumentHtml(html);
  if (!safeHtml) return null;

  const win = window.open('', '_blank', features);
  if (!win) return null;

  const parsed = new DOMParser().parseFromString(safeHtml, 'text/html');
  const imported = win.document.importNode(parsed.documentElement, true);
  win.document.replaceChild(imported, win.document.documentElement);

  win.focus();

  if (closeAfterPrint) {
    win.onafterprint = () => win.close();
  }
  if (autoPrint) {
    setTimeout(() => {
      try {
        win.print();
      } catch {
        /* popup closed before printing — nothing to do */
      }
    }, printDelayMs);
  }

  return win;
}

/**
 * Escape a value for interpolation into an HTML template literal.
 *
 * The exporters build their document strings by hand; run every dynamic value
 * through this so the markup is well-formed before it even reaches the
 * sanitizer, rather than relying on the sanitizer to clean up a broken
 * document.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
