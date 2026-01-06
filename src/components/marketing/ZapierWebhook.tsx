// Zapier Webhook utility for sending data to Google Sheets and automations

interface ZapierWebhookData {
  type: 'lead' | 'newsletter' | 'inquiry' | 'booking' | 'report_download';
  timestamp: string;
  source: string;
  data: Record<string, any>;
}

// Get webhook URL from localStorage (set via Admin panel)
const getZapierWebhookUrl = (): string | null => {
  try {
    const config = localStorage.getItem('jj_marketing_config');
    if (config) {
      const parsed = JSON.parse(config);
      return parsed.zapierWebhookUrl || null;
    }
  } catch (e) {
    console.error('Error getting Zapier webhook URL:', e);
  }
  return null;
};

export const sendToZapier = async (data: ZapierWebhookData): Promise<boolean> => {
  const webhookUrl = getZapierWebhookUrl();
  
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
