import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Save, 
  RefreshCw,
  Globe,
  BarChart,
  Target,
  Mail,
  Calendar,
  Webhook,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface MarketingConfig {
  ga4MeasurementId: string;
  gtmContainerId: string;
  clarityProjectId: string;
  metaPixelId: string;
  linkedInPartnerId: string;
  googleAdsId: string;
  tiktokPixelId: string;
  brevoApiKey: string;
  brevoListId: string;
  mailchimpApiKey: string;
  mailchimpListId: string;
  calendlyUrl: string;
  zapierWebhookUrl: string;
  googleBusinessUrl: string;
  trustpilotUrl: string;
}

const STORAGE_KEY = 'jj_marketing_config';

const defaultConfig: MarketingConfig = {
  ga4MeasurementId: '',
  gtmContainerId: '',
  clarityProjectId: '',
  metaPixelId: '',
  linkedInPartnerId: '',
  googleAdsId: '',
  tiktokPixelId: '',
  brevoApiKey: '',
  brevoListId: '',
  mailchimpApiKey: '',
  mailchimpListId: '',
  calendlyUrl: '',
  zapierWebhookUrl: '',
  googleBusinessUrl: '',
  trustpilotUrl: '',
};

export const MarketingSettingsDashboard = () => {
  const [config, setConfig] = useState<MarketingConfig>(defaultConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setConfig({ ...defaultConfig, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Failed to load marketing config:', e);
      }
    }
  }, []);

  const handleChange = (field: keyof MarketingConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      toast.success('Marketing settings saved!', {
        description: 'Changes will take effect on page refresh.',
      });
      setHasChanges(false);
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatus = (value: string) => {
    if (!value) return <XCircle className="w-4 h-4 text-zinc-400" />;
    return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  };

  const IntegrationCard = ({
    icon: Icon,
    title,
    description,
    fields,
    docsUrl,
  }: {
    icon: any;
    title: string;
    description: string;
    fields: { key: keyof MarketingConfig; label: string; placeholder: string }[];
    docsUrl?: string;
  }) => (
    <Card className="bg-white border-2 border-gold/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-gold" />
            </div>
            <div>
              <CardTitle className="text-black text-base">{title}</CardTitle>
              <CardDescription className="text-black/40 text-sm">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {fields.map(f => getStatus(config[f.key]))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map(field => (
          <div key={field.key} className="space-y-2">
            <Label className="text-black/60 text-sm">{field.label}</Label>
            <Input
              value={config[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        ))}
        {docsUrl && (
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-gold text-xs hover:underline"
          >
            Setup Guide <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-black text-2xl font-bold">Marketing Integrations</h2>
          <p className="text-black/60 text-sm mt-1">
            Configure analytics, advertising, and automation tools
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-amber-600 text-sm flex items-center gap-1">
              <RefreshCw className="w-4 h-4" />
              Unsaved changes
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-gold text-black hover:bg-gold/90"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="bg-white/80 border-2 border-gold/30">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-gold data-[state=active]:text-black text-black">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="advertising" className="data-[state=active]:bg-gold data-[state=active]:text-black text-black">
            <Target className="w-4 h-4 mr-2" />
            Advertising
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-gold data-[state=active]:text-black text-black">
            <Mail className="w-4 h-4 mr-2" />
            Email & CRM
          </TabsTrigger>
          <TabsTrigger value="automation" className="data-[state=active]:bg-gold data-[state=active]:text-black text-black">
            <Webhook className="w-4 h-4 mr-2" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="local" className="data-[state=active]:bg-gold data-[state=active]:text-black text-black">
            <Globe className="w-4 h-4 mr-2" />
            Local & Trust
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IntegrationCard icon={BarChart} title="Google Analytics 4" description="Track website traffic and user behavior" fields={[{ key: 'ga4MeasurementId', label: 'Measurement ID', placeholder: 'G-XXXXXXXXXX' }]} docsUrl="https://support.google.com/analytics/answer/9304153" />
            <IntegrationCard icon={Settings} title="Google Tag Manager" description="Manage all marketing tags in one place" fields={[{ key: 'gtmContainerId', label: 'Container ID', placeholder: 'GTM-XXXXXXX' }]} docsUrl="https://support.google.com/tagmanager/answer/6103696" />
            <IntegrationCard icon={BarChart3} title="Microsoft Clarity" description="Heatmaps and session recordings" fields={[{ key: 'clarityProjectId', label: 'Project ID', placeholder: 'xxxxxxxxxx' }]} docsUrl="https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup" />
          </div>
        </TabsContent>

        <TabsContent value="advertising" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IntegrationCard icon={Target} title="Meta Pixel" description="Facebook & Instagram tracking" fields={[{ key: 'metaPixelId', label: 'Pixel ID', placeholder: 'XXXXXXXXXXXXXXXXX' }]} docsUrl="https://www.facebook.com/business/help/952192354843755" />
            <IntegrationCard icon={Target} title="LinkedIn Insight Tag" description="Track LinkedIn ad conversions" fields={[{ key: 'linkedInPartnerId', label: 'Partner ID', placeholder: 'XXXXXXX' }]} docsUrl="https://www.linkedin.com/help/lms/answer/a418880" />
            <IntegrationCard icon={Target} title="Google Ads" description="Conversion tracking (via GTM recommended)" fields={[{ key: 'googleAdsId', label: 'Conversion ID', placeholder: 'AW-XXXXXXXXXX' }]} docsUrl="https://support.google.com/google-ads/answer/1722054" />
            <IntegrationCard icon={Target} title="TikTok Pixel" description="TikTok ad tracking (optional)" fields={[{ key: 'tiktokPixelId', label: 'Pixel ID', placeholder: 'XXXXXXXXXXXXX' }]} docsUrl="https://ads.tiktok.com/help/article/get-started-pixel" />
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 mb-4">
            <p className="text-emerald-700 text-sm">
              <strong>Recommended:</strong> Brevo (SendinBlue) offers 300 free emails/day, superior automation, and transactional email support.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IntegrationCard icon={Mail} title="Brevo (SendinBlue)" description="Email marketing & automation (recommended)" fields={[{ key: 'brevoApiKey', label: 'API Key', placeholder: 'xkeysib-...' }, { key: 'brevoListId', label: 'List ID', placeholder: '1' }]} docsUrl="https://developers.brevo.com/docs/getting-started" />
            <IntegrationCard icon={Mail} title="Mailchimp" description="Alternative email platform" fields={[{ key: 'mailchimpApiKey', label: 'API Key', placeholder: 'xxxxxxxx-usX' }, { key: 'mailchimpListId', label: 'Audience ID', placeholder: 'abc123xyz' }]} docsUrl="https://mailchimp.com/developer/marketing/api/" />
            <IntegrationCard icon={Calendar} title="Calendly" description="Meeting scheduling" fields={[{ key: 'calendlyUrl', label: 'Scheduling URL', placeholder: 'https://calendly.com/your-link' }]} docsUrl="https://help.calendly.com/hc/en-us/articles/223147027" />
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IntegrationCard icon={Webhook} title="Zapier Webhook" description="Connect to Google Sheets, CRMs, and 5000+ apps" fields={[{ key: 'zapierWebhookUrl', label: 'Webhook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/...' }]} docsUrl="https://zapier.com/help/create/code-webhooks/trigger-zaps-from-webhooks" />
          </div>
          <div className="bg-gold/5 border border-gold/20 rounded-xl p-6">
            <h3 className="text-black font-semibold mb-2">How to set up Zapier:</h3>
            <ol className="text-black/60 text-sm space-y-2 list-decimal list-inside">
              <li>Create a Zap in Zapier with "Webhooks by Zapier" as the trigger</li>
              <li>Choose "Catch Hook" as the event</li>
              <li>Copy the webhook URL and paste it above</li>
              <li>Connect Google Sheets or any other app as the action</li>
              <li>All form submissions will automatically sync to your spreadsheet</li>
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="local" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IntegrationCard icon={Globe} title="Google Business Profile" description="Local SEO and reviews" fields={[{ key: 'googleBusinessUrl', label: 'Business Profile URL', placeholder: 'https://g.page/your-business' }]} docsUrl="https://support.google.com/business/answer/3038177" />
            <IntegrationCard icon={Globe} title="Trustpilot" description="Customer reviews widget" fields={[{ key: 'trustpilotUrl', label: 'Trustpilot Page URL', placeholder: 'https://www.trustpilot.com/review/yourdomain.com' }]} docsUrl="https://support.trustpilot.com/hc/en-us/articles/360019718593" />
          </div>
        </TabsContent>
      </Tabs>

      {/* Integration Status Summary */}
      <Card className="bg-white border-2 border-gold/30">
        <CardHeader>
          <CardTitle className="text-black text-lg">Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { label: 'GA4', value: config.ga4MeasurementId },
              { label: 'GTM', value: config.gtmContainerId },
              { label: 'Clarity', value: config.clarityProjectId },
              { label: 'Meta', value: config.metaPixelId },
              { label: 'LinkedIn', value: config.linkedInPartnerId },
              { label: 'Brevo', value: config.brevoApiKey },
              { label: 'Zapier', value: config.zapierWebhookUrl },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  item.value ? 'bg-emerald-100 border-2 border-emerald-400' : 'bg-gold/5 border-2 border-gold/20'
                }`}>
                  {item.value ? (
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-zinc-400" />
                  )}
                </div>
                <span className="text-black/60 text-xs">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingSettingsDashboard;
