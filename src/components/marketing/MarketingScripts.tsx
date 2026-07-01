import { useEffect } from 'react';
import { useMarketingConsent } from '@/hooks/useMarketingConsent';
import { supabase } from '@/integrations/supabase/client';

interface MarketingConfig {
  ga4MeasurementId?: string;
  gtmContainerId?: string;
  metaPixelId?: string;
  linkedInPartnerId?: string;
  clarityProjectId?: string;
  tiktokPixelId?: string;
}

// Load config from marketing_config DB table (cached)
let configCache: MarketingConfig | null = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getMarketingConfig = async (): Promise<MarketingConfig> => {
  if (configCache && Date.now() - configCacheTime < CONFIG_CACHE_TTL) {
    return configCache;
  }

  try {
    // Call the SECURITY DEFINER RPC that whitelists only the six
    // non-secret tracking IDs. The base marketing_config table is locked
    // to owner/admin, so a direct select from anon sessions raises
    // "permission denied" — which broke analytics for every visitor.
    const { data, error } = await supabase
      .rpc('get_public_marketing_config');

    if (error || !data) return {};

    const allowed = new Set([
      'ga4MeasurementId', 'gtmContainerId', 'metaPixelId',
      'linkedInPartnerId', 'clarityProjectId', 'tiktokPixelId',
    ]);
    const config: MarketingConfig = {};
    (data as Array<{ key: string; value: string }>).forEach((row) => {
      if (allowed.has(row.key)) {
        (config as any)[row.key] = row.value;
      }
    });
    configCache = config;
    configCacheTime = Date.now();
    return config;
  } catch {
    return {};
  }
};

// Declare global types for tracking pixels
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    _fbq: any;
    lintrk: (...args: any[]) => void;
    _linkedin_data_partner_ids: string[];
    clarity: (...args: any[]) => void;
    ttq: any;
  }
}

export const MarketingScripts = () => {
  const { hasAnalyticsConsent, hasMarketingConsent, isLoaded } = useMarketingConsent();

  useEffect(() => {
    if (!isLoaded) return;

    const init = async () => {
      const config = await getMarketingConfig();

      if (hasAnalyticsConsent()) {
        initializeAnalytics(config);
      }

      if (hasMarketingConsent()) {
        initializeMarketing(config);
      }
    };

    init();
  }, [isLoaded, hasAnalyticsConsent, hasMarketingConsent]);

  return null;
};

// Google Analytics 4
const initializeGA4 = (measurementId: string) => {
  if (!measurementId || document.querySelector(`script[src*="${measurementId}"]`)) return;

  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure',
  });
};

// Google Tag Manager
const initializeGTM = (containerId: string) => {
  if (!containerId || document.querySelector(`script[src*="gtm.js"]`)) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });

  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
  document.head.appendChild(script);

  const noscript = document.createElement('noscript');
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${containerId}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);
};

// Microsoft Clarity
const initializeClarity = (projectId: string) => {
  if (!projectId || window.clarity) return;

  (function (c: any, l: Document, a: string, r: string, i: string, t?: HTMLScriptElement, y?: HTMLScriptElement) {
    c[a] = c[a] || function () {
      (c[a].q = c[a].q || []).push(arguments);
    };
    t = l.createElement(r) as HTMLScriptElement;
    t.async = true;
    t.defer = true;
    t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0] as HTMLScriptElement;
    y.parentNode?.insertBefore(t, y);
  })(window, document, 'clarity', 'script', projectId);
};

// Meta (Facebook/Instagram) Pixel
const initializeMetaPixel = (pixelId: string) => {
  if (!pixelId || window.fbq) return;

  (function (f: any, b: Document, e: string, v: string, n?: any, t?: HTMLScriptElement, s?: HTMLScriptElement) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.defer = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0] as HTMLScriptElement;
    s.parentNode?.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
};

// LinkedIn Insight Tag
const initializeLinkedIn = (partnerId: string) => {
  if (!partnerId || window.lintrk) return;

  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(partnerId);

  (function (l: Document) {
    if (!l.getElementById('linkedin-insight')) {
      const s = l.getElementsByTagName('script')[0];
      const b = l.createElement('script') as HTMLScriptElement;
      b.id = 'linkedin-insight';
      b.type = 'text/javascript';
      b.async = true;
      b.defer = true;
      b.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
      s.parentNode?.insertBefore(b, s);
    }
  })(document);
};

// TikTok Pixel
const initializeTikTokPixel = (pixelId: string) => {
  if (!pixelId || window.ttq) return;

  (function (w: any, d: Document, t: string) {
    w.TiktokAnalyticsObject = t;
    const ttq = (w[t] = w[t] || []);
    ttq.methods = [
      'page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias',
      'group', 'enableCookie', 'disableCookie',
    ];
    ttq.setAndDefer = function (t: any, e: string) {
      t[e] = function () {
        t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (t: string) {
      const e = ttq._i[t] || [];
      for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
      return e;
    };
    ttq.load = function (e: string, n?: any) {
      const i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      ttq._i = ttq._i || {};
      ttq._i[e] = [];
      ttq._i[e]._u = i;
      ttq._t = ttq._t || {};
      ttq._t[e] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[e] = n || {};
      const o = d.createElement('script');
      o.type = 'text/javascript';
      o.async = true;
      o.defer = true;
      o.src = i + '?sdkid=' + e + '&lib=' + t;
      const a = d.getElementsByTagName('script')[0];
      a.parentNode?.insertBefore(o, a);
    };
    ttq.load(pixelId);
    ttq.page();
  })(window, document, 'ttq');
};

// Initialize all analytics tools
const initializeAnalytics = (config: MarketingConfig) => {
  if (config.ga4MeasurementId) initializeGA4(config.ga4MeasurementId);
  if (config.gtmContainerId) initializeGTM(config.gtmContainerId);
  if (config.clarityProjectId) initializeClarity(config.clarityProjectId);
};

// Initialize all marketing tools
const initializeMarketing = (config: MarketingConfig) => {
  if (config.metaPixelId) initializeMetaPixel(config.metaPixelId);
  if (config.linkedInPartnerId) initializeLinkedIn(config.linkedInPartnerId);
  if (config.tiktokPixelId) initializeTikTokPixel(config.tiktokPixelId);
};

export default MarketingScripts;
