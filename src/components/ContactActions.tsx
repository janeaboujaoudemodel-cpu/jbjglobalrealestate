/**
 * Centralized contact actions helper for WhatsApp, Call, and Email
 * Uses direct navigation to avoid popup blocking issues on mobile/iframe
 */

import { CONTACT_INFO, getWhatsAppUrl, getCallUrl, getEmailUrl } from "@/constants/stats";

interface ContactActionOptions {
  /** Custom message for WhatsApp */
  whatsappMessage?: string;
  /** Subject for email */
  emailSubject?: string;
  /** Body content for email */
  emailBody?: string;
  /** Stop event propagation (for cards/links) */
  stopPropagation?: boolean;
}

/**
 * Open WhatsApp with a custom or default message
 * Uses direct navigation to avoid popup blocking
 */
export function openWhatsApp(options: ContactActionOptions = {}) {
  const { whatsappMessage } = options;
  const url = getWhatsAppUrl(whatsappMessage);
  
  // Use window.open to avoid iframe/popup blocking issues
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Initiate a phone call
 */
export function openCall() {
  window.location.href = getCallUrl();
}

/**
 * Open email client with subject and body
 */
export function openEmail(options: ContactActionOptions = {}) {
  const { emailSubject, emailBody } = options;
  
  let url = `mailto:${CONTACT_INFO.email}`;
  const params: string[] = [];
  
  if (emailSubject) {
    params.push(`subject=${encodeURIComponent(emailSubject)}`);
  }
  if (emailBody) {
    params.push(`body=${encodeURIComponent(emailBody)}`);
  }
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  window.location.href = url;
}

/**
 * Get proper href for WhatsApp link
 */
export function getWhatsAppHref(customMessage?: string): string {
  return getWhatsAppUrl(customMessage);
}

/**
 * Get proper href for call link
 */
export function getCallHref(): string {
  return getCallUrl();
}

/**
 * Get proper href for email link with optional subject and body
 */
export function getEmailHref(subject?: string, body?: string): string {
  let url = `mailto:${CONTACT_INFO.email}`;
  const params: string[] = [];
  
  if (subject) {
    params.push(`subject=${encodeURIComponent(subject)}`);
  }
  if (body) {
    params.push(`body=${encodeURIComponent(body)}`);
  }
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  return url;
}

/**
 * Generate a property inquiry WhatsApp message
 */
export function getPropertyWhatsAppMessage(propertyName: string, location?: string): string {
  return `Hello JBJ Global Real Estate,\n\nI am interested in ${propertyName}${location ? ` located in ${location}` : ''}.\n\nPlease provide more details about this property.\n\nThank you.`;
}

/**
 * Generate a property inquiry email body
 */
export function getPropertyEmailBody(propertyName: string, location?: string): string {
  return `Hello JBJ Global Real Estate,\n\nI am interested in ${propertyName}${location ? ` located in ${location}` : ''}.\n\nPlease provide more details.\n\nThank you.`;
}
