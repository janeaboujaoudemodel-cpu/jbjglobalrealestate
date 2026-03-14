// Zapier Webhook utility for sending data to Google Sheets and automations
import { supabase } from '@/integrations/supabase/client';

interface ZapierWebhookData {
  type: 'lead' | 'newsletter' | 'inquiry' | 'booking' | 'report_download';
  timestamp: string;
  source: string;
  data: Record<string, any>;
}

// Get webhook URL from marketing_config DB table (owner-only RLS)
let cachedWebhookUrl: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getZapierWebhookUrl = async (): Promise<string | null> => {
  // Use cached value if fresh
  if (cachedWebhookUrl !== null && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedWebhookUrl;
  }

  try {
    const { data, error } = await supabase
      .from('marketing_config')
      .select('value')
      .eq('key', 'zapierWebhookUrl')
      .maybeSingle();
    
    if (error || !data) {
      cachedWebhookUrl = null;
    } else {
      cachedWebhookUrl = data.value || null;
    }
    cacheTimestamp = Date.now();
  } catch (e) {
    console.error('[Zapier] Error fetching webhook URL:', e);
    cachedWebhookUrl = null;
  }
  return cachedWebhookUrl;
};

export const sendToZapier = async (data: ZapierWebhookData): Promise<boolean> => {
  const webhookUrl = await getZapierWebhookUrl();
  
  if (!webhookUrl) {
    console.log('[Zapier] No webhook URL configured, skipping');
    return false;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors', // Required for Zapier webhooks
      body: JSON.stringify({
        ...data,
        triggered_from: window.location.origin,
        user_agent: navigator.userAgent,
      }),
    });

    console.log('[Zapier] Webhook sent successfully:', data.type);
    return true;
  } catch (error) {
    console.error('[Zapier] Webhook error:', error);
    return false;
  }
};

// Helper functions for common webhook types
export const trackLead = (leadData: {
  email: string;
  name?: string;
  phone?: string;
  source: string;
  page?: string;
}) => {
  return sendToZapier({
    type: 'lead',
    timestamp: new Date().toISOString(),
    source: leadData.source,
    data: {
      email: leadData.email,
      name: leadData.name || '',
      phone: leadData.phone || '',
      page: leadData.page || window.location.pathname,
    },
  });
};

export const trackNewsletter = (email: string, source: string) => {
  return sendToZapier({
    type: 'newsletter',
    timestamp: new Date().toISOString(),
    source,
    data: {
      email,
      subscribed_at: new Date().toISOString(),
    },
  });
};

export const trackInquiry = (inquiryData: {
  email: string;
  name: string;
  phone?: string;
  message: string;
  project?: string;
}) => {
  return sendToZapier({
    type: 'inquiry',
    timestamp: new Date().toISOString(),
    source: 'contact_form',
    data: inquiryData,
  });
};

export const trackBooking = (bookingData: {
  email: string;
  name: string;
  date?: string;
  time?: string;
  type?: string;
}) => {
  return sendToZapier({
    type: 'booking',
    timestamp: new Date().toISOString(),
    source: 'calendly',
    data: bookingData,
  });
};

export const trackReportDownload = (reportData: {
  email: string;
  reportType: string;
  reportName: string;
}) => {
  return sendToZapier({
    type: 'report_download',
    timestamp: new Date().toISOString(),
    source: 'market_report',
    data: reportData,
  });
};
