/**
 * Page Guides Configuration
 * Content for admin page guide modals
 */

import { GuideContent } from '@/components/admin/PageGuide';

export const pageGuides: Record<string, GuideContent> = {
  'pwa-analytics': {
    title: 'PWA Analytics',
    description: 'Track how users install and use your Progressive Web App. Monitor download button clicks, successful installations, and app usage patterns.',
    whatIs: 'PWA stands for "Progressive Web App" - this technology allows users to install your website as an app on their phone, tablet, or computer WITHOUT going to the App Store or Google Play. When installed, users get a home screen icon and can use the site like a native app with faster loading and offline support.',
    benefits: [
      'See how many visitors click the "Install App" button',
      'Track successful installations vs. dismissed prompts',
      'Understand which devices (mobile/tablet/desktop) are installing most',
      'Monitor app opens to see engagement after installation',
      'Calculate conversion rate from clicks to actual installs'
    ],
    howToUse: [
      'Check the "Conversion Rate" card - higher percentage means your install prompt is effective',
      'Review "Device Breakdown" to see if mobile or desktop users install more',
      'Use the date range filter (7 days, 30 days, all time) to spot trends',
      'Monitor "App Opens" to see how often installed users return',
      'If conversion is low, consider improving your install prompt message'
    ],
    tips: [
      'A good PWA install conversion rate is 3-5%',
      'Mobile users are more likely to install than desktop users',
      'The "Install App" button should be prominently displayed',
      'Consider showing the install prompt after users engage with your content'
    ]
  },
  
  'ai-analytics': {
    title: 'AI Analytics',
    description: 'Monitor your AI-powered features usage, performance, and costs. Track which AI tools are used most and identify any errors.',
    whatIs: 'This dashboard tracks all AI-powered features across your platform - from the AI Home Finder to AI-generated property descriptions, chatbot interactions, and more. It shows you how much AI is being used, how fast it responds, and if there are any errors.',
    benefits: [
      'Track total AI API calls and usage trends',
      'Monitor response times to ensure fast user experience',
      'See token usage for cost management',
      'Identify which AI features are most popular',
      'Catch errors early before they affect users'
    ],
    howToUse: [
      'Check "Success Rate" - should be above 95% for healthy operation',
      'Monitor "Avg Response Time" - under 3 seconds is good',
      'Review "Usage by Function" to see which AI features are most used',
      'Check "Recent Errors" section if success rate drops',
      'Use time range filters to compare different periods'
    ],
    tips: [
      'High token usage means higher costs - monitor this regularly',
      'Sudden spikes in errors may indicate API issues',
      'Most popular functions should get optimization priority',
      'Response times over 5 seconds may frustrate users'
    ]
  },
  
  'visitor-insights': {
    title: 'Visitor Insights',
    description: 'Understand your website visitors - where they come from, what they look at, and how they interact with your site.',
    whatIs: 'Visitor Insights collects anonymous data about how people use your website. It tracks page views, session duration, device types, and user journeys without collecting personal information (until they submit a form or sign up).',
    benefits: [
      'See which pages get the most traffic',
      'Understand where visitors come from (countries, referrers)',
      'Track which devices and browsers are most common',
      'Identify popular properties and high-interest areas',
      'Measure engagement metrics like session duration'
    ],
    howToUse: [
      'Check "Top Pages" to see your most viewed content',
      'Review traffic sources to understand where leads come from',
      'Monitor device breakdown to ensure mobile experience is good',
      'Track session duration - longer sessions indicate engaged users',
      'Use this data to optimize low-performing pages'
    ],
    tips: [
      'High bounce rate on key pages may indicate UX issues',
      'Mobile traffic typically exceeds 60% - ensure mobile optimization',
      'Direct traffic often means brand recognition is growing',
      'Compare weekday vs. weekend traffic for patterns'
    ]
  },
  
  'marketing-hub': {
    title: 'Marketing Hub',
    description: 'Create, manage, and send marketing campaigns across email, WhatsApp, and social media. Track opens, clicks, and conversions.',
    whatIs: 'The Marketing Hub is your central command for all marketing communications. Create email newsletters, WhatsApp broadcasts, and social media campaigns. Design content with AI assistance, schedule sends, and track performance - all in one place.',
    benefits: [
      'Create professional email campaigns with AI-powered content',
      'Manage newsletter subscribers and segments',
      'Schedule campaigns for optimal send times',
      'Track open rates, click rates, and conversions',
      'A/B test subject lines and content',
      'Integrate with WhatsApp Business for direct messaging'
    ],
    howToUse: [
      'Click "New Campaign" to start creating',
      'Choose campaign type: Email, WhatsApp, or Social',
      'Use AI to generate compelling content and subject lines',
      'Select your target audience (newsletter, leads, custom)',
      'Preview, schedule or send immediately',
      'Monitor performance in the campaign analytics'
    ],
    tips: [
      'Best email send times: Tuesday-Thursday, 10am-2pm',
      'Subject lines under 50 characters perform better',
      'Personalization increases open rates by 26%',
      'A/B test with at least 1000 recipients for valid results'
    ]
  },
  
  'marketing-settings': {
    title: 'Marketing Settings',
    description: 'Configure your marketing integrations including Google Analytics, Meta Pixel, and other tracking tools.',
    whatIs: 'Marketing Settings is where you connect third-party analytics and advertising platforms to your website. Set up Google Analytics 4, Meta (Facebook) Pixel, Google Tag Manager, and other tools to track conversions and build remarketing audiences.',
    benefits: [
      'Track website traffic with Google Analytics',
      'Build Facebook/Instagram remarketing audiences with Meta Pixel',
      'Measure ad campaign effectiveness',
      'Set up conversion tracking for lead forms',
      'Enable advanced analytics and attribution'
    ],
    howToUse: [
      'Enter your GA4 Measurement ID (starts with G-)',
      'Add your Meta Pixel ID for Facebook tracking',
      'Configure Google Tag Manager if using GTM',
      'Test integrations using browser developer tools',
      'Verify data is flowing in your analytics dashboards'
    ],
    tips: [
      'Always test tracking after setup using debug modes',
      'Set up conversion events for form submissions',
      'Use Google Tag Manager for easier management of multiple tags',
      'Meta Pixel needs 500+ events before optimization works well'
    ]
  },
  
  'rate-limits': {
    title: 'Rate Limits',
    description: 'Protect your API endpoints from abuse by configuring request limits per IP address and time window.',
    whatIs: 'Rate Limiting controls how many requests a single user (identified by IP address) can make to your API in a given time period. This prevents abuse, protects against DDoS attacks, and ensures fair usage for all visitors.',
    benefits: [
      'Protect against automated attacks and bots',
      'Prevent API abuse and excessive resource usage',
      'Ensure fair access for all legitimate users',
      'Reduce server costs from malicious traffic',
      'Maintain site performance during traffic spikes'
    ],
    howToUse: [
      'Set requests per minute/hour for each endpoint',
      'Configure different limits for different actions (search, submit, etc.)',
      'Monitor blocked requests to identify attack patterns',
      'Adjust limits based on actual usage patterns',
      'Whitelist trusted IPs if needed'
    ],
    tips: [
      'Start with generous limits and tighten based on abuse patterns',
      'AI endpoints should have stricter limits (expensive to run)',
      'Search endpoints typically need higher limits',
      'Monitor for false positives blocking legitimate users'
    ]
  },
  
  'ip-blocklist': {
    title: 'IP Blocklist',
    description: 'Block specific IP addresses from accessing your site. Use this to stop spammers, attackers, or unwanted traffic.',
    whatIs: 'The IP Blocklist is a security feature that prevents specific IP addresses from accessing your website. When an IP is blocked, all requests from that address are immediately rejected before reaching your application.',
    benefits: [
      'Stop known spammers and attackers immediately',
      'Block persistent abusers who bypass rate limits',
      'Reduce unwanted form submissions',
      'Protect against targeted attacks',
      'Maintain site security and performance'
    ],
    howToUse: [
      'Add suspicious IPs from rate limit violations',
      'Include a reason for each block for reference',
      'Set expiration dates for temporary blocks',
      'Review and clean up old blocks periodically',
      'Export blocklist for backup or sharing'
    ],
    tips: [
      'Block IP ranges (CIDR) for coordinated attacks',
      'Be careful blocking shared IPs (offices, VPNs)',
      'Use temporary blocks first, permanent if abuse continues',
      'Check rate limit logs to identify IPs to block'
    ]
  },
  
  'audit-logs': {
    title: 'Audit Logs',
    description: 'Track all administrative actions and system events. See who did what and when for security and compliance.',
    whatIs: 'Audit Logs record every significant action taken in the admin panel and system. This creates an unalterable record of who made changes, what was changed, and when - essential for security, debugging, and compliance.',
    benefits: [
      'Track all admin user actions',
      'Detect unauthorized access attempts',
      'Debug issues by seeing recent changes',
      'Meet compliance requirements (GDPR, etc.)',
      'Hold team members accountable for actions'
    ],
    howToUse: [
      'Filter by action type to find specific events',
      'Search by user to see their activity',
      'Use date range to investigate specific incidents',
      'Export logs for compliance reports',
      'Review regularly for suspicious activity'
    ],
    tips: [
      'Check logs after any unexpected system behavior',
      'Review admin login attempts from unknown IPs',
      'Logs are immutable - they cannot be deleted',
      'Set up alerts for critical actions if needed'
    ]
  },
  
  'brokers': {
    title: 'Broker Subscriptions',
    description: 'Manage broker accounts, subscription plans, and team access. Track broker activity and performance.',
    whatIs: 'The Broker Management section handles all aspects of broker accounts on your platform. View subscription status, manage plan upgrades, track broker activity, and handle team member access - all from one dashboard.',
    benefits: [
      'See all active broker subscriptions at a glance',
      'Track revenue from broker plans',
      'Manage team member access for brokers',
      'Monitor broker activity and engagement',
      'Handle plan changes and renewals'
    ],
    howToUse: [
      'View subscription status for each broker',
      'Filter by plan type or status (active, expired)',
      'Click on a broker to see detailed activity',
      'Process plan upgrades or downgrades',
      'Manage team member invitations'
    ],
    tips: [
      'Follow up with brokers whose plans are expiring soon',
      'Active brokers with high engagement are upsell opportunities',
      'Monitor unused features to improve onboarding',
      'Check for inactive accounts that may need support'
    ]
  },
  
  'chat-history': {
    title: 'Chat History',
    description: 'View all chat conversations between visitors and AI/human agents. Monitor support quality and extract leads.',
    whatIs: 'Chat History stores every conversation from your website chat widget. This includes both AI chatbot interactions and human agent chats. Review conversations to improve AI responses, identify leads, and monitor support quality.',
    benefits: [
      'Extract leads from chat conversations',
      'Improve AI chatbot responses based on real conversations',
      'Monitor customer service quality',
      'Identify common questions for FAQ updates',
      'Track chat volume and response times'
    ],
    howToUse: [
      'Search for specific conversations by keyword',
      'Filter by date range or conversation status',
      'Click on a conversation to read full transcript',
      'Mark conversations as leads for follow-up',
      'Use insights to train AI or update FAQs'
    ],
    tips: [
      'Review AI-handled chats for accuracy regularly',
      'Conversations mentioning budget are hot leads',
      'Common questions should become FAQ entries',
      'Long conversations may indicate confused users'
    ]
  }
};

export const getGuide = (pageId: string): GuideContent | null => {
  return pageGuides[pageId] || null;
};
